import {Plant} from "./plant.js";

class World {
    constructor(width, height){
        this.width = width;
        this.height = height;

        this.cells = [];
        // initialise the world lattice to all nulls
        for(var i=0; i<this.width; i++){
            this.cells.push([]);
            for(var j=0; j<this.height; j++){
                this.cells[i][j] = null;
            }
        }

        this.plants = [];
    }

    seed(genome){
        // find a random empty space
        var emptySpaces = [];
        for(var i=0; i<this.width; i++){
            if(this.cells[i][0] === null){
                emptySpaces.push(i);
            }
        }
        if(emptySpaces.length === 0){
            return false;
        }

        var x = emptySpaces[Math.floor(Math.random()*(emptySpaces.length-1))];
        if (this.cells[x][0] === null){
            this.sowPlant(genome, x);
            return true;
        }
        return false;
    }

    sowPlant(genome, x){
        x = this.getX(x);
        var plant = new Plant(x, this, genome);
        this.plants.push(plant);
        this.addCell(plant.cells[0]);
    }

    /**
     * Remove plant from world plant list.
     * Remove all cells from cell grid
     */
    killPlant(plant){
        this.plants.splice(this.plants.indexOf(plant), 1);
        plant.cells.forEach(function(cell){
            this.cells[cell.x][cell.y] = null;
        }, this);
    }

    getX(x){
        if(x < 0){
            x = this.width + x;
        }
        return x % this.width;
    }

    getCell(x, y){
        return this.cells[this.getX(x)][y];
    }

    addCell(cell){
        if (this.cells[cell.x][cell.y] !== undefined) {
            this.cells[cell.x][cell.y] = cell;
        }
    }

    draw(ctx, cellSize){
        var numDraws = 0;
        this.plants.forEach(function(plant){
            plant.cells.forEach(function(cell){
                var x = cell.x * cellSize;
                var y = cellSize * (this.height - cell.y);
                // console.log("Draw " + [x, y]);
                var colour = cell.energised ? "black" : "grey";
                cell.draw(ctx, x, y - cellSize, cellSize, colour);
                numDraws++;
            }, this);
        }, this);
        document.querySelector("#cellnum").textContent = numDraws;
    }
}

export { World };