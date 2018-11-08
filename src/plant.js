import {Cell} from "./cell.js";
var NEIGHBOURHOOD = require("./actions.js").NEIGHBOURHOOD
class Plant{
    constructor(x, world, genome) {
        this.world = world;
        this.cells = [new Cell(this, x, 0)];
        this.genome = genome
    }

    getNeighbourhood(cell){
        // Return the neighbourhood mask
        var mask = 0
        for(var i=0; i<NEIGHBOURHOOD.length; i++){
            var pos = NEIGHBOURHOOD[i];
            var x = cell.x + pos[0];
            var y = cell.y + pos[1];
            try{
                var worldPos = this.world.cells[x][y];
            }
            catch {
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
        var space = this.world.getCell(x, y)
        if (space !== null){
            return;
        }

        // grow cell in to empty space
        var new_cell = new Cell(this, x, y);
        this.cells.push(new_cell);
        this.world.addCell(new_cell);
    }

    draw(ctx) {

    }
}

export { Plant };