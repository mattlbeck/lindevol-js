
import {Simulation, SimulationParams} from "./simulation.js";
import { Cell } from "./cell.js";
import $ from "jquery";

var canvas = document.querySelector("#mainbox");
var ctx = canvas.getContext("2d");
var canvasOffset = 0.5;
ctx.translate(canvasOffset, canvasOffset);

// control
document.querySelector("#step").addEventListener("click", function (){
    simStep();
});
var run = false;
$("#run").on("click", function (){
    run = !run;
    if(run){
        gameLoop();
    }
});

var selectedCell = null;

function updateCellFocus(){
    if (selectedCell !== null){
        var cell = simulation.world.getCell(selectedCell[0], selectedCell[1]);
        if (cell !== null){
            var rules = simulation.genomeInterpreter.interpret(cell.plant.genome);
            var neighbourhood = cell.plant.getNeighbourhood(cell);
            var matching_rule = "None";
            for(var i=0; i<rules.length; i++){
                if(rules[i].state === neighbourhood){
                    matching_rule = `#${i} ${rules[i]}`;
                }
            }
            var death = cell.plant.getDeathProbability(simulation.params.death_factor, simulation.params.natural_exp, simulation.params.energy_exp, simulation.params.leanover_factor);
            var cellinfo = $("#cellinfo");
            cellinfo.empty();
            cellinfo.append(`<p>${cell.toString()}</p><p>Neighbourhood: ${neighbourhood}</p><p>Rule: ${matching_rule}</p>`);
            cellinfo.append(`<p>Plant death prob ${JSON.stringify(death)} genome length ${cell.plant.genome.length}</p>`);
            cellinfo.append(`<p>mut exponent:${cell.plant.genome.mut_exp}</p>`);
            rules.forEach(function(rule){
                cellinfo.append(`<p>${rule.toString()}</p>`);
            });
        }
    }
}

canvas.addEventListener("click", function(event){
    var x = event.pageX-canvas.offsetLeft+canvasOffset, 
        y = (canvas.height - (event.pageY-canvas.offsetTop))+canvasOffset;
    var cellx = Math.floor(x / cellSize),
        celly = Math.floor(y / cellSize);
   
    var cell = simulation.world.getCell(cellx, celly);
    if (cell instanceof Cell){
        selectedCell = [cellx, celly];
        updateCellFocus();
    }

});

var cellSize = 8;

// Lindevol P params
var params_p = new SimulationParams({
    "world_width": 500,
    "initial_population": 500,
    "genome_interpreter": "promotor",
    "initial_genome_length": 50,
    "mut_replace_mode": "bytewise",
    "mut_replace": 0.002,
    "mut_insert": 0.0004,
    "mut_delete": 0.0004,
    "mut_factor": 1.5,
    "action_map": [32, 4, 4, 4, 4, 16],
    "death_factor": 0.35,
    "leanover_factor": 0.15,
    "energy_exp": -2.5
});

// Lindevol C params
var params_c = new SimulationParams({
    "genome_interpreter": "block",
    "initial_genome_length": 400,
    "mut_replace_mode": "bitwise",
    "mut_replace": 0.001,
    "action_map": [200, 21, 0, 18, 18, 0],
    "death_factor": 0.2
});

var simulation = new Simulation(params_p);
simulation.init_population();

function drawScreen(){
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    simulation.world.draw(ctx, cellSize);
    ctx.restore();
}

function gameLoop(){
    simStep();
    if(run){
        window.requestAnimationFrame(gameLoop);
    }
}

function updateStats(){
    document.querySelector("#stepnum").textContent = simulation.stepnum;
}

function simStep(){
    simulation.step();
    updateCellFocus();
    updateStats();
    drawScreen();
}

gameLoop();

