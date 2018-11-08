
import {World, SimulationParams} from "./world.js";

var canvas = document.querySelector("#mainbox");
var ctx = canvas.getContext("2d");
ctx.translate(0.5, 0.5);

// control
document.querySelector("#step").addEventListener("click", function (){
    simStep();
});

var cellSize = 10;

var params = new SimulationParams({
    "initial_population": 20
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

