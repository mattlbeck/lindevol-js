
var World = require("./world.js");

var canvas = document.querySelector("#mainbox");
var ctx = canvas.getContext("2d");

// control
document.querySelector("#step").addEventListener("click", function (){
    simStep();
});

var cellSize = 10;

var world = new World(Math.floor(canvas.width/cellSize), Math.floor(canvas.height/cellSize));
console.log(world)
// randomly choose spots to seed the world with
for (var i=0; i<1; i++){
    var x = Math.floor(Math.random()*world.width);
    world.seed(x);
}

function drawScreen(){
    ctx.strokeStyle = "black";
    
    world.draw(ctx, canvas.width, canvas.height, cellSize);
}

function gameLoop(){
    world.step();
    drawScreen();
    window.requestAnimationFrame(gameLoop);
}


function simStep(){
    world.step();
    drawScreen();
}

drawScreen()

