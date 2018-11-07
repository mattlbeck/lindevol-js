var Cell = require("./cell.js");
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
            var pos = NEIGHBOURHOOD[i]
            var worldPos = this.world.cells[cell.x + pos[0]][cell.y + pos[1]];
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
        var mask = this.getNeighbourhood();
        rules.forEach(function(rule){
            if (rule.mask === mask){
                rule.action.execute(this);
            }
        });
    }

    /**
     * Grow the plant by one cell
     * @param {*} cell the cell to grow from
     * @param {*} direction the direction to grow in
     */
    growFromCell(cell, direction){
        var new_cell = new Cell(this, cell.x+direction[0], cell.y+direction[1]);
        this.cells.push(new_cell);
        this.world.addCell(new_cell);
    }

    draw(ctx) {

    }
}

module.exports = Plant