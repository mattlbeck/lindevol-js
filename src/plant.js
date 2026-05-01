import {randomInt, randomProb} from "./random.js";
import {Cell} from "./cell.js";
import {NEIGHBOURHOOD} from "./actions.js";

class Plant{
    constructor(x, world, genome, birthStep, useInternalState=false) {
        this.world = world;
        this.energisedCount = 0;
        this.cells = [new Cell(this, this.world.getX(x), 0)];
        this.genome = genome;
        this.useInternalState = useInternalState;
        this.rules = null; // cached rules
        this.leanoverEnergised = 0; // Incremental tracking
        this.birthStep = birthStep;
    }

    getNeighbourhood(cell){
        // Return the neighbourhood mask
        var mask = 0;
        for(var i=0; i<NEIGHBOURHOOD.length; i++){
            var pos = NEIGHBOURHOOD[i];
            var x = cell.x + pos[0];
            var y = cell.y + pos[1];
            
            // Bounds check instead of try-catch
            if (x >= 0 && x < this.world.width && y >= 0 && y < this.world.height) {
                var worldPos = this.world.cells[x][y];
                if (worldPos instanceof Cell){
                    mask = mask | (1 << i);
                }
            }
        }
        return mask;
    }

    getState(cell){
        return this.getNeighbourhood(cell) | cell.internalState | (( cell.energised ? 1 : 0) << 15);
    }

    grow(){
        this.cells.forEach(function(cell){
            // 50% chance to grow
            if(randomProb(0.8)){
                var spaces = this.getGrowDirection(cell);
                if(spaces.length > 0){
                    var direction = spaces[randomInt(0, spaces.length)];
                    if (direction !== null){
                        this.growFromCell(cell, direction);
                    }
                }
            }
        }, this);
    }

    /**
     * Grow the plant by one cell if possible
     * @param {*} cell the cell to grow from
     * @param {*} direction the direction to grow in
     */
    growFromCell(cell, direction, stepnum){
        var x = cell.x+direction[0], y = cell.y+direction[1];
        // check if space is clear
        var space = this.world.getCell(x, y);
        if (space === undefined){
            return;
        }
        if (space instanceof Cell){
            if (space.plant === this){
                return;
            }
            
            // Attack occurs
            if (this.world.onAttack) this.world.onAttack();

            // this plant will kill the other
            // with a probability...
            if(randomProb(space.plant.getKillProbability())){
                // attack succeeded. Kill competitor and continue with growth
                this.world.killPlant(space.plant);
            }
            else {
                // attack failed
                return;
            }
            
        }
        // grow cell in to empty space
        var new_cell = new Cell(this, this.world.getX(x), y);
        this.cells.push(new_cell);
        
        // Update incremental tracking
        const rootCell = this.cells[0];
        const le = this.world.width/2 - ( (( 1.5*this.world.width ) + new_cell.x - rootCell.x)  % this.world.width);
        this.leanoverEnergised += le;

        this.world.addCell(new_cell);
    }

    getKillProbability(){
        return 1/this.energisedCount;
    }

    /**
     * Calculate whether this plant should die.
     * @param {} natural_exp exponent to the number of cells
     * @param {*} energy_exp exponent to the number of energy rich cells
     * @param {*} leanover_factor factor to the leanover term
     */
    getDeathProbability(death_factor, natural_exp, energy_exp, leanover_factor){
        var numCells = this.cells.length;
        
        var leanoverCells = 2/(numCells*(numCells-1));
        if (leanoverCells === Infinity){
            leanoverCells = 0;
        }

        var leanoverTerm = leanoverCells*Math.abs(this.leanoverEnergised);
        
        var d_natural = Math.pow(numCells, natural_exp);
        var d_energy = Math.pow(this.energisedCount+1, energy_exp);
        var d_leanover = leanover_factor*leanoverTerm;
        var pDeath = death_factor * d_natural * d_energy + d_leanover;
        return {
            "prob": pDeath,
            "natural": d_natural,
            "energy": d_energy,
            "leanover": d_leanover
        };
    }
}

export { Plant };