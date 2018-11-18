import {randomInt} from "./random.js";
import {Plant} from "./plant.js";
import { Cell } from "./cell.js";

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

    /**
     * @returns array of x positions at y=0 where no cell exists
     */
    getFloorSpace(){
        var emptySpaces = [];
        for(var i=0; i<this.width; i++){
            if(this.cells[i][0] === null){
                emptySpaces.push(i);
            }
        }
        return emptySpaces;
    }

    /**
     * Strategies for sowing a seed on the world floor
     * @param {*} genome the genome used by the new seed
     * @param {*} nearX if not null, try to sow a seed as close
     * as possible to this location
     * 
     * @return true if a seed was succesfully planted, false if
     * there was no space to sow a seed.
     */
    seed(genome, nearX){
        // find a random empty space
        var emptySpaces = this.getFloorSpace();
        if(emptySpaces.length === 0){
            return false;
        }

        if(nearX !== undefined){
            var nearestX = null;
            var nearest_diff = this.width;
            emptySpaces.forEach(function(xpos){
                var diff = Math.abs(nearX-xpos);
                if(diff < nearest_diff){
                    nearest_diff = diff;
                    nearestX = xpos;
                }
            });
            this.sowPlant(genome, nearestX);
        }

        var x = emptySpaces[randomInt(0, emptySpaces.length-1)];
        this.sowPlant(genome, x);
        return true;
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

    getHeightDelta(ctx, cellSize){
        // find the delat between canvas height and world height in pixels
        var canvasHeight = ctx.canvas.height;
        var realHeight = (cellSize * this.height);
        return canvasHeight - realHeight;
    }

    draw(ctx, cellSize){
        var numDraws = 0;
        this.plants.forEach(function(plant){
            plant.cells.forEach(function(cell){
                var x = cell.x * cellSize;
                
                var y = cellSize * (this.height - cell.y) + this.getHeightDelta(ctx, cellSize);
                var colour = this.getCellColour(plant, cell);
                cell.draw(ctx, x, y - cellSize, cellSize, colour);
                this.drawCellBorders(ctx, cell, cellSize);
                numDraws++;
            }, this);
        }, this);
        document.querySelector("#cellnum").textContent = numDraws;
    }

    drawCellBorders(ctx, cell, cellSize){
        [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(function(d){
            var dx = cell.x+d[0], dy=cell.y+d[1];

            if(dx in this.cells){

                var nCell = this.cells[dx][dy];
                if (nCell instanceof Cell && nCell.plant === cell.plant){
                    return;
                }
            }
            var px = (cell.x*cellSize), py = cellSize * (this.height - cell.y)+this.getHeightDelta(ctx, cellSize);
            if (d[0] > 0){
                px += cellSize;
            }
            if(d[1] > 0){
                py -= cellSize;
            }
            ctx.beginPath();
            ctx.moveTo(px,py);
            ctx.lineTo(px+cellSize*Math.abs(d[1]),py-cellSize*Math.abs(d[0]));
            ctx.stroke();
        }, this);

    }

    getCellColour(plant, cell){
        var i =plant.cells[0].x % cScale.length;
        if(cell.energised){
            return cScale[i];
        }
        else{
            return cEscale[i];
        }
    }
}

// http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=8
var cScale = ["rgb(141,211,199)","rgb(255,255,179)","rgb(190,186,218)","rgb(251,128,114)","rgb(128,177,211)","rgb(253,180,98)","rgb(179,222,105)","rgb(252,205,229)"];
var cEscale = [];
for(var i=0;i<cScale.length;i++){
    cEscale.push(shadeRGBColor(cScale[i], -0.3));
}

function shadeRGBColor(color, percent) {
    // https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    var f=color.split(","),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=parseInt(f[0].slice(4)),G=parseInt(f[1]),B=parseInt(f[2]);
    return "rgb("+(Math.round((t-R)*p)+R)+","+(Math.round((t-G)*p)+G)+","+(Math.round((t-B)*p)+B)+")";
}


export { World };