import {seedRandom, randomProb} from "./random.js";
import {World} from "./world.js";
import {ByteArray, BlockInterpreter, PromotorInterpreter, Mutator} from "./genome.js";

class SimulationParams{
    constructor(params={}){
        this.random_seed = 1;
        this.record_interval = 10;
        this.steps_per_frame = 1;
        this.disturbance_interval = 0;
        this.disturbance_strength = 0.1;

        this.world_width = 250;
        this.world_height = 40;
        this.initial_population = 250;
        
        this.energy_prob = 0.5;

        // death params
        this.death_factor = 0.2;
        this.natural_exp = 0;
        this.energy_exp = -2.5;
        this.leanover_factor = 0.2;

        // mutations
        this.mut_replace_mode = "bytewise";
        this.mut_replace = 0.002;
        this.mut_insert = 0.0004;
        this.mut_delete = 0.0004;
        this.mut_factor = 1.5;
        this.initial_mut_exp = 0;

        this.genome_interpreter = "block";
        this.initial_genome_length = 400;

        // divide, flyingseed, localseed, mut+, mut-, statebit
        this.action_map = [200, 20, 0, 18, 18, 0];

        Object.assign(this, params);
    }
}

class Simulation {
    constructor(params) {
        this.params = params;

        // Seed all future calls to random
        // this makes out tests reproducible given the same seed is used
        // in future input parameters
        seedRandom(this.params.random_seed);

        this.world = new World(this.params.world_width, this.params.world_height);
        this.genomeInterpreter = this.getInterpreter();
        this.mut_units = 1;
        // ensure mutation units is compatible with the interpreter type
        if(this.genomeInterpreter instanceof BlockInterpreter){
            this.mut_units = 2;
        }
        this.stepnum = 0;
    }

    getInterpreter(){
        switch (this.params.genome_interpreter){
        case "block":
            return new BlockInterpreter(this.params.action_map);
        case "promotor":
            return new PromotorInterpreter(this.params.action_map);
        default:
            throw new Error(`Unknown interpreter ${this.params.genome_interpreter}`);
        }  
    }

    init_population(){
        // randomly choose spots to seed the world with
        for (var i=0; i<this.params.initial_population; i++){
            this.newSeed();
        }
    }

    /**
     * Initialise the population from a list of serialized genome strings,
     * drawing with replacement up to initial_population.
     * @param {string[]} serializedGenomes
     */
    init_population_from_genomes(serializedGenomes){
        for (var i=0; i<this.params.initial_population; i++){
            const str = serializedGenomes[Math.floor(Math.random() * serializedGenomes.length)];
            const genome = ByteArray.deserialize(str);
            this.world.seed(genome);
        }
    }

    newSeed(){
        // create a random genome
        var genome = ByteArray.random(this.params.initial_genome_length);
        this.world.seed(genome);
    }

    step(){
        this.stepnum++;
        this.simulateDeath();
        this.simulateLight();
        this.simulateActions();
        this.mutate();
    }

    simulateActions(){
        for (let i = 0; i < this.world.plants.length; i++) {
            const plant = this.world.plants[i];
            if (!plant.rules) {
                plant.rules = this.genomeInterpreter.interpret(plant.genome);
            }
            const rules = plant.rules;
            for (let j = 0; j < plant.cells.length; j++) {
                this.cellAction(plant.cells[j], rules);
            }
        }
    }

    cellAction(cell, rules){
        var state;
        if (this.genomeInterpreter instanceof BlockInterpreter){
            state = cell.plant.getNeighbourhood(cell);
        }
        else if(this.genomeInterpreter instanceof PromotorInterpreter){
            state = cell.plant.getState(cell);
        }
        rules.forEach(function(rule){
            // execute one action using the first matching rule
            // if (rule.matches(state)){
            if (rule.matches(state)){
                rule.action.execute(cell);
            }
        }, this);
        cell.updateState();
    }

    mutate(){
        var mutator = new Mutator(this.params.mut_factor, this.params.mut_replace, 
            this.params.mut_insert, this.params.mut_delete, 
            0, this.params.mut_replace_mode, this.mut_units);
        for (let i = 0; i < this.world.plants.length; i++) {
            const plant = this.world.plants[i];
            if (mutator.mutate(plant.genome)) {
                plant.rules = null; // Invalidate cache
            }
        }
    }

    /**
     * Use each plant's current death probability to simulate
     * whether each plant dies on this step
     */
    simulateDeath(){
        const dead_plants = [];
        const plants = this.world.plants;
        for (let i = 0; i < plants.length; i++) {
            const plant = plants[i];
            const deathProb = plant.getDeathProbability(
                this.params.death_factor,
                this.params.natural_exp,
                this.params.energy_exp,
                this.params.leanover_factor
            );
            if (randomProb(deathProb.prob)){
                dead_plants.push(plant);
            }
        }
        for (let i = 0; i < dead_plants.length; i++) {
            this.world.killPlant(dead_plants[i]);
        }
    }

    /**
     * Simulate light. Sunlight traverses from the ceiling of the world
     * downwards vertically. It is caught by a plant cell with a probability
     * which causes that cell to be energised.
     */
    simulateLight(){
        const colTops = new Int16Array(this.world.width).fill(-1);
        const plants = this.world.plants;
        for (let i = 0; i < plants.length; i++) {
            const cells = plants[i].cells;
            for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                if (cell.y > colTops[cell.x]) {
                    colTops[cell.x] = cell.y;
                }
            }
        }

        for(let x=0; x<this.world.width; x++){
            const topY = colTops[x];
            if (topY === -1) continue;

            for(let y=topY; y>=0; y--){
                const cell = this.world.cells[x][y];
                if(cell !== null){
                    if(randomProb(this.params.energy_prob)){
                        cell.energised = true;
                        break;
                    }
                }
            }
        }
    }
}

export {Simulation, SimulationParams};