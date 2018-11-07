var Cell = require("./cell.js");

class Plant{
    constructor(x, world, genome) {
        this.world = world;
        this.cells = [new Cell(x, 0)];
        this.genome = genome
    }

    getGrowDirection(cell){
        // find a free direction to grow in and do it
        var spaces = [];
        var directions = []
        for (var i=-1; i<=1; i++){
            for (var j=-1; j<=1; j++){
                directions.push([i, j])
            }
        }
        directions.forEach(function(d){
            var i = d[0], j = d[1]
            if (cell.x+i >= 0 && cell.x+i < this.world.width){
                if (cell.y+j >= 0 && cell.y+j < this.world.height){
                    if (i != 0 || j != 0){
                        var pos = this.world.cells[cell.x+i][cell.y+j];
                        if (pos === null){
                            spaces.push([i, j]);
                        }
                    }
                }
            }
        }, this);
        return spaces

        // from all spaces, randomly choose one to divide to
        /** 
        else{
            // Determine if the plant is able to compete with its neighbourhood (50% chance)
            if (Math.random() > 1){
                var competeSpace = [Math.floor(Math.random() * 3) - 2, Math.floor(Math.random() * 3) - 2];
                while(competeSpace === [0, 0]){
                    competeSpace = [Math.floor(Math.random() * 3) - 2, Math.floor(Math.random() * 3) - 2];
                }
                return competeSpace;
            }
            return null;
        }
        */
    }

    grow(){
        this.cells.forEach(function(cell){
            // 50% chance to grow
            if(Math.random() > 0.8){
                var spaces = this.getGrowDirection(cell);
                if(spaces.length > 0){
                    var direction = spaces[Math.floor(Math.random()*spaces.length)];
                    if (direction !== null){
                        this.growFromCell(cell, direction)
                    }
                }
            }
        }, this);
    }

    action(genomeInterpreter){
        rules = genomeInterpreter.interpret(this.genome);
        
    }

    /**
     * Grow the plant by one cell
     * @param {*} cell the cell to grow from
     * @param {*} direction the direction to grow in
     */
    growFromCell(cell, direction){
        var new_cell = new Cell(cell.x+direction[0], cell.y+direction[1]);
        this.cells.push(new_cell);
        this.world.addCell(new_cell);
    }

    draw(ctx) {

    }
}

module.exports = Plant