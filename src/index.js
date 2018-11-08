
import {World, SimulationParams} from "./world.js";

var canvas = document.querySelector("#mainbox");
var ctx = canvas.getContext("2d");

// control
document.querySelector("#step").addEventListener("click", function (){
    simStep();
});

var cellSize = 10;

var params = new SimulationParams({
    "initial_population": 20
});
var world = new World(params);
console.log(world)
// randomly choose spots to seed the world with
for (var i=0; i<params.initial_population; i++){
    var x = Math.floor(Math.random()*world.width);
    world.seed(x);
}

function drawScreen(){
    ctx.strokeStyle = "black";
    
    world.draw(ctx, canvas.width, canvas.height, cellSize);
}

function gameLoop(){
    world.step();
    updateStats();
    drawScreen();
    window.requestAnimationFrame(gameLoop);
}

function updateStats(){
    document.querySelector("#stepnum").textContent = world.stepnum
}

function simStep(){
    world.step();
    
    drawScreen();
}

gameLoop()

