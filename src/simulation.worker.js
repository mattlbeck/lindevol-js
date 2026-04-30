import {Simulation, SimulationParams} from "./simulation.js";
import {SimData} from "./simdata.js";

let simulation = null;
let data = null;
let running = false;
let cellSize = 8;
const TARGET_FPS = 60;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
let lastFrameTime = 0;

self.onmessage = function(event) {
    const msg = event.data;
    switch (msg.type) {
    case "init":
        initSim(msg.params);
        break;
    case "start":
        running = true;
        loop();
        break;
    case "stop":
        running = false;
        break;
    case "step":
        doStep();
        pushFrame();
        break;
    case "getCell":
        sendCellInfo(msg.x, msg.y);
        break;
    case "disturb":
        applyDisturbance(msg.strength);
        pushFrame();
        break;
    case "killCell":
        killCellAt(msg.x, msg.y);
        pushFrame();
        break;
    case "updateDisturbance":
        simulation.params.disturbance_interval = msg.interval;
        simulation.params.disturbance_strength = msg.strength;
        break;
    }
};

function initSim(params) {
    running = false;
    const sim_params = new SimulationParams(params);
    cellSize = params.cellSize || 8;
    simulation = new Simulation(sim_params);
    data = new SimData(simulation);
    simulation.init_population();
    pushFrame();
}

function loop() {
    if (!running) return;

    const spf = simulation.params.steps_per_frame;
    for (let i = 0; i < spf; i++) {
        doStep();
    }

    const now = Date.now();
    if (now - lastFrameTime >= FRAME_INTERVAL_MS) {
        pushFrame();
        lastFrameTime = now;
    }

    setTimeout(loop, 0);
}

function doStep() {
    simulation.step();

    // Periodic disturbance
    const di = simulation.params.disturbance_interval;
    if (di > 0 && simulation.stepnum % di === 0) {
        applyDisturbance(simulation.params.disturbance_strength);
    }

    if (simulation.stepnum % simulation.params.record_interval === 0 || simulation.stepnum === 1) {
        data.recordStep();
        self.postMessage({
            type: "stats",
            data: JSON.parse(JSON.stringify(data.data)),
            stepnum: simulation.stepnum
        });
    }
}

function applyDisturbance(strength) {
    const world = simulation.world;
    const plants = world.plants;
    if (plants.length === 0) return;
    const numToKill = Math.max(1, Math.floor(strength * plants.length));
    // Shuffle a sample and kill
    const shuffled = plants.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < numToKill && i < shuffled.length; i++) {
        // Check plant still alive (not killed by previous iteration)
        if (world.plants.includes(shuffled[i])) {
            world.killPlant(shuffled[i]);
        }
    }
}

function killCellAt(x, y) {
    const cell = simulation.world.getCell(x, y);
    if (cell && cell.plant) {
        simulation.world.killPlant(cell.plant);
    }
}

function pushFrame() {
    const result = simulation.world.getPixelBuffer(cellSize);
    // Transfer ownership of the ArrayBuffer for zero-copy performance
    self.postMessage({
        type: "frame",
        buffer: result.buffer.buffer,
        width: result.width,
        height: result.height,
        cellCount: result.cellCount,
        stepnum: simulation.stepnum
    }, [result.buffer.buffer]);
}

function sendCellInfo(x, y) {
    const cell = simulation.world.getCell(x, y);
    if (!cell || !cell.plant || !cell.plant.genome) {
        self.postMessage({ type: "cellInfo", found: false });
        return;
    }
    try {
        const plant = cell.plant;
        const rules = simulation.genomeInterpreter.interpret(plant.genome);
        const neighbourhood = plant.getNeighbourhood(cell);
        let matching_rule = "None";
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].state === neighbourhood) {
                matching_rule = `#${i} ${rules[i]}`;
            }
        }
        const death = plant.getDeathProbability(
            simulation.params.death_factor,
            simulation.params.natural_exp,
            simulation.params.energy_exp,
            simulation.params.leanover_factor
        );
        self.postMessage({
            type: "cellInfo",
            found: true,
            cellStr: cell.toString(),
            neighbourhood,
            matching_rule,
            death: JSON.stringify(death),
            genomeLength: plant.genome.length,
            mutExp: plant.genome.mut_exp,
            rules: rules.map(r => r.toString())
        });
    } catch (e) {
        self.postMessage({ type: "cellInfo", found: false, error: e.message });
    }
}
