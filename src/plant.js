import {Cell} from "./cell.js";
import {NEIGHBOURHOOD} from "./actions.js";

class Plant{
    constructor(x, world, genome) {
        this.world = world;
        this.cells = [new Cell(this, x, 0)];
        this.genome = genome;
    }

    getNeighbourhood(cell){
        // Return the neighbourhood mask
        var mask = 0;
        for(var i=0; i<NEIGHBOURHOOD.length; i++){
            var pos = NEIGHBOURHOOD[i];
            var x = cell.x + pos[0];
            var y = cell.y + pos[1];
            try{
                var worldPos = this.world.cells[x][y];
            }
            catch(error){
                continue;
            }
            if (worldPos instanceof Cell){
                mask = mask | Math.pow(2, i);
            }
        }
        return mask;
    }

    grow(){
        this.cells.forEach(function(cell){
            // 50% chance to grow
            if(Math.random() > 0.8){
                var spaces = this.getGrowDirection(cell);
                if(spaces.length > 0){
                    var direction = spaces[Math.floor(Math.random()*spaces.length)];
                    if (direction !== null){
                        this.growFromCell(cell, direction);
                    }
                }
            }
        }, this);
    }

    action(genomeInterpreter){
        var rules = genomeInterpreter.interpret(this.genome);
        this.cells.forEach(function(cell){
            var mask = this.getNeighbourhood(cell);
            rules.forEach(function(rule){
                // execute one action using the first matching rule
                if (rule.state === mask){
                    rule.action.execute(cell);
                    return;
                }
            }, this);
        }, this);

    }

    /**
     * Grow the plant by one cell if possible
     * @param {*} cell the cell to grow from
     * @param {*} direction the direction to grow in
     */
    growFromCell(cell, direction){
        var x = cell.x+direction[0], y = cell.y+direction[1];
        // check if space is clear
        var space = this.world.getCell(x, y);
        if (space !== null){
            return;
        }

        // grow cell in to empty space
        var new_cell = new Cell(this, x, y);
        this.cells.push(new_cell);
        this.world.addCell(new_cell);
    }

    /**
     * Calculate whether this plant should die.
     * @param {} natural_exp exponent to the number of cells
     * @param {*} energy_exp exponent to the number of energy rich cells
     * @param {*} leanover_factor factor to the leanover term
     */
    getDeathProbability(death_factor, natural_exp, energy_exp, leanover_factor){
        var numCells = this.cells.length;
        var numEnergised = 0;
        var leanoverEnergised = 0;
        var rootCell = this.cells[0];
        this.cells.forEach(function(cell){
            if(cell.energised){
                numEnergised++;

                var le = this.world.width/2 - ( ( (3*this.world.width)/2 ) + cell.x - rootCell.x )  % this.world.width/2;
                leanoverEnergised += le;
            }
        }, this);

        var leanoverCells = 2/(numCells*(numCells-1));
        if (leanoverCells === Infinity){
            leanoverCells = 0;
        }

        var leanoverTerm = leanoverCells*Math.abs(leanoverEnergised);
        
        return death_factor * Math.pow(numCells, natural_exp) * Math.pow(numEnergised, energy_exp) * leanover_factor*leanoverTerm;
    }
}

export { Plant };