import {Plant} from "./plant.js";
import {ByteArray, GenomeInterpreter} from "./genome.js";

class World {
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
        try {
            cell = this.cells[x][y];
            if(cell === undefined){
                throw ""
            }
            return cell
        }
        catch(error) {
            throw "world coordinates out of bounds when adding cell";
        } 
    }

    addCell(cell){
        try {
            if (this.cells[cell.x][cell.y] !== undefined) {
                this.cells[cell.x][cell.y] = cell;
            }
            else {
                throw "";
            }
        }
        catch(error) {
            throw "world coordinates out of bounds when adding cell";
        }
    }

    step(){
        this.plants.forEach(function(plant){
            plant.action(this.genomeInterpreter);
        }, this);
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

export { World };