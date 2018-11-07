var Plant = require("./plant.js");

class World{
    constructor(width, height){
        this.width = width;
        this.height = height;

        this.cells = [];
        for(var i=0; i<this.width; i++){
            this.cells.push([]);
            for(var j=0; j<this.height; j++){
                this.cells[i][j] = null;
            }
        }

        this.plants = [];
    }

    seed(x){
        // Create a new plant seed on the world floor
        var plant = new Plant(x, this);
        this.plants.push(plant);
        this.cells[x][0] = plant.cells[0];
    }

    addCell(cell){
        if (this.cells[cell.x][cell.y] !== undefined) {
            this.cells[cell.x][cell.y] = cell;
        }
        else {
            throw "Cell can not be added outside of world limits"
        }
        
    }

    step(){
        this.plants.forEach(function(plant){
            plant.grow();
        });
    }

    draw(ctx, width, height, cellSize){
        this.plants.forEach(function(plant){
            plant.cells.forEach(function(cell){
                var x = cell.x * cellSize;
                var y = cellSize * (this.height - cell.y);
                // console.log("Draw " + [x, y]);
                cell.draw(ctx, x, y - cellSize, cellSize, "gray");
            }, this);
        }, this);
    }
}

module.exports = World