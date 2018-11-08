import {Plant} from "./plant.js";
import {ByteArray, GenomeInterpreter} from "./genome.js";

class World {
    constructor(width, height){
        this.width = width;
        this.height = height;

        this.stepnum = 0;

        this.cells = [];
        for(var i=0; i<this.width; i++){
            this.cells.push([]);
            for(var j=0; j<this.height; j++){
                this.cells[i][j] = null;
            }
        }

        this.plants = [];
        this.genomeInterpreter = new GenomeInterpreter()
    }

    seed(x){
        // Create a new plant seed on the world floor
        var g = ByteArray.random(20);
        var plant = new Plant(x, this, g);
        this.plants.push(plant);
        this.cells[x][0] = plant.cells[0];
    }

    getCell(x, y){
        if (x in this.cells){
            return this.cells[x][y]
        }
        return undefined
    }

    addCell(cell){
        if (this.cells[cell.x][cell.y] !== undefined) {
            this.cells[cell.x][cell.y] = cell;
        }
    }

    step(){
        this.stepnum++;
        this.plants.forEach(function(plant){
            plant.action(this.genomeInterpreter);
        }, this);
        this.mutate();
    }

    mutate(){
        this.plants.forEach(function(plant){
            for(var  i=0; i<plant.genome.length; i++){
                if(Math.random() > 0.9){
                    var mbit = Math.pow(2, Math.floor(Math.random()*7))
                    plant.genome[i] = plant.genome[i] ^ mbit
                }
            }
        });
    }

    draw(ctx, width, height, cellSize){
        var numDraws = 0
        this.plants.forEach(function(plant){
            plant.cells.forEach(function(cell){
                var x = cell.x * cellSize;
                var y = cellSize * (this.height - cell.y);
                // console.log("Draw " + [x, y]);
                cell.draw(ctx, x, y - cellSize, cellSize, "gray");
                numDraws++;
            }, this);
        }, this);
        document.querySelector("#cellnum").textContent = numDraws
    }
}

export { World };