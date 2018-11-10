
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
            var death = cell.plant.getDeathProbability(params.death_factor, params.natural_exp, params.energy_exp, params.leanover_factor);
            var cellinfo = $("#cellinfo");
            cellinfo.empty();
            cellinfo.append(`<p>${cell.toString()}</p><p>Neighbourhood: ${neighbourhood}</p><p>Rule: ${matching_rule}</p>`);
            cellinfo.append(`<p>Plant death prob ${JSON.stringify(death)}</p>`);
            cellinfo.append(`<p>mut exponent:${cell.plant.genome.mut_exp} mut: ${cell.plant.genome.getMutationProbability(params)}</p>`);
            rules.forEach(function(rule){
                cellinfo.append(`<p>${rule.toString()}</p>`);
            });
        }
    }
}

canvas.addEventListener("click", function(event){
    console.log([event.pageX, event.pageY, canvas.height])
    var x = event.pageX-canvas.offsetLeft+canvasOffset, 
        y = (canvas.height - (event.pageY-canvas.offsetTop))+canvasOffset;
    console.log([x,y])
    var cellx = Math.floor(x / cellSize),
        celly = Math.floor(y / cellSize);
   
    var cell = simulation.world.getCell(cellx, celly);
    console.log(`Clicked ${cell}`);
    if (cell instanceof Cell){
        selectedCell = [cellx, celly];
        updateCellFocus();
    }

});

var cellSize = 10;

var params = new SimulationParams({
    "initial_population": 250,
    "mut_replacement": 0.0001
});
var simulation = new Simulation(params);
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

