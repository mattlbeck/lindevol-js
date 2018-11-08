
import {World, SimulationParams} from "./world.js";
import { Cell } from "./cell.js";
import $ from "jquery";

var canvas = document.querySelector("#mainbox");
var ctx = canvas.getContext("2d");
ctx.translate(0.5, 0.5);

// control
document.querySelector("#step").addEventListener("click", function (){
    simStep();
});

var selectedCell = null;

function updateCellFocus(){
    if (selectedCell !== null){
        var rules = world.genomeInterpreter.interpret(selectedCell.plant.genome);
        var neighbourhood = selectedCell.plant.getNeighbourhood(selectedCell);
        var matching_rule = "None";
        for(var i=0; i<rules.length; i++){
            if(rules[i].state === neighbourhood){
                matching_rule = `#${i} ${rules[i]}`;
            }
        }
        var cellinfo = $("#cellinfo");
        cellinfo.empty();
        cellinfo.append(`<p>${selectedCell.toString()} Neighbourhood: ${neighbourhood} Rule: ${matching_rule}</p>`);
        rules.forEach(function(rule){
            cellinfo.append(`<p>${rule.toString()}</p>`);
        });
    }
}

canvas.addEventListener("click", function(event){
    var x = event.pageX, 
        y = canvas.height - event.pageY;
    
    var cellx = Math.floor(x / cellSize),
        celly = Math.floor(y / cellSize);
   
    var cell = world.getCell(cellx, celly);
    console.log(`Clicked ${cell}`);
    if (cell instanceof Cell){
        selectedCell = cell;
        updateCellFocus();
    }

});

var cellSize = 10;

var params = new SimulationParams({
    "initial_population": 250
});
var world = new World(params);
// randomly choose spots to seed the world with
for (var i=0; i<params.initial_population; i++){
    var x = Math.floor(Math.random()*world.width);
    world.seed(x);
}

function drawScreen(){
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    world.draw(ctx, cellSize);
    ctx.restore();
}

function gameLoop(){
    simStep();
    window.requestAnimationFrame(gameLoop);
}

function updateStats(){
    document.querySelector("#stepnum").textContent = world.stepnum;
}

function simStep(){
    world.step();
    updateCellFocus();
    updateStats();
    drawScreen();
}

gameLoop();

