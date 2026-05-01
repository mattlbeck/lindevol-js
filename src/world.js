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
        this.cellCount = 0;

        this.onPlantBirth = null;
        this.onPlantDeath = null;
        this.onAttack = null;
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
    seed(genome, nearX, stepnum){
        // find a random empty space
        var emptySpaces = this.getFloorSpace();
        if(emptySpaces.length === 0){
            return false;
        }

        if(nearX !== undefined && nearX !== null){
            var nearestX = null;
            var nearest_diff = this.width;
            emptySpaces.forEach(function(xpos){
                var diff = Math.abs(nearX-xpos);
                if(diff < nearest_diff){
                    nearest_diff = diff;
                    nearestX = xpos;
                }
            });
            this.sowPlant(genome, nearestX, stepnum);
            return true;
        }

        var x = emptySpaces[randomInt(0, emptySpaces.length-1)];
        if (this.cells[x][0] !== null){
            throw new Error("Space is taken");
        }
        this.sowPlant(genome, x, stepnum);
        return true;
    }

    sowPlant(genome, x, stepnum){
        x = this.getX(x);
        var plant = new Plant(x, this, genome, stepnum);
        this.plants.push(plant);
        this.addCell(plant.cells[0]);
        if (this.onPlantBirth) this.onPlantBirth(plant);
    }

    /**
     * Remove plant from world plant list.
     * Remove all cells from cell grid
     */
    killPlant(plant){
        const idx = this.plants.indexOf(plant);
        if (idx > -1) {
            this.plants.splice(idx, 1);
            this.cellCount -= plant.cells.length;
            for (let i = 0; i < plant.cells.length; i++) {
                const cell = plant.cells[i];
                this.cells[cell.x][cell.y] = null;
            }
            if (this.onPlantDeath) this.onPlantDeath(plant);
        }
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
            this.cellCount++;
        }
    }

    getPixelBuffer(cellSize){
        const w = this.width * cellSize;
        const h = this.height * cellSize;
        const buf = new Uint8ClampedArray(w * h * 4);
        const plants = this.plants;

        for (let i = 0; i < plants.length; i++) {
            const plant = plants[i];
            const [baseR, baseG, baseB] = this.getBaseColour(plant);
            const darkR = Math.round(baseR * 0.7);
            const darkG = Math.round(baseG * 0.7);
            const darkB = Math.round(baseB * 0.7);
            
            const cells = plant.cells;
            for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                const r0 = cell.energised ? baseR : darkR;
                const g0 = cell.energised ? baseG : darkG;
                const b0 = cell.energised ? baseB : darkB;
                
                const px0 = cell.x * cellSize;
                const py0 = (this.height - 1 - cell.y) * cellSize;

                for (let dy = 0; dy < cellSize; dy++) {
                    const rowIdx = (py0 + dy) * w;
                    for (let dx = 0; dx < cellSize; dx++) {
                        const isBorder = cellSize > 1 && (dx === 0 || dy === 0 || dx === cellSize - 1 || dy === cellSize - 1);
                        const idx = (rowIdx + px0 + dx) * 4;
                        
                        if (isBorder) {
                            buf[idx]     = Math.round(r0 * 0.5);
                            buf[idx + 1] = Math.round(g0 * 0.5);
                            buf[idx + 2] = Math.round(b0 * 0.5);
                        } else {
                            buf[idx]     = r0;
                            buf[idx + 1] = g0;
                            buf[idx + 2] = b0;
                        }
                        buf[idx + 3] = 255;
                    }
                }
            }
        }

        return { buffer: buf, width: w, height: h, cellCount: this.cellCount };
    }

    getBaseColour(plant){
        var i = plant.cells[0].x % cScale.length;
        return cScale[i];
    }
}

// http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=8 — as raw [R,G,B] tuples
var cScale = [
    [141,211,199],[255,255,179],[190,186,218],[251,128,114],
    [128,177,211],[253,180,98],[179,222,105],[252,205,229]
];


export { World };