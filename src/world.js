import {Plant} from "./plant.js";
import {ByteArray, GenomeInterpreter} from "./genome.js";

class SimulationParams{
    constructor(params={}){
        this.world_width = 250;
        this.world_height = 40;
        this.initial_population = 250;
        
        this.energy_prob = 0.5;

        // death params
        this.death_factor = 0.2;
        this.natural_exp = 0;
        this.energy_exp = -2.5;
        this.leanover_factor = 0.2;

        // mutations
        this.mut_replacement = 0.001;
        this.mut_factor = 1.5;
        this.initial_mut_exp = 0;

        // divide, flyingseed, localseed, mut+, mut-, statebit
        this.initial_genome_length = 200;
        this.action_map = [200, 20, 0, 18, 18, 0];

        Object.assign(this, params);
    }
}

class World {
    constructor(params=new SimulationParams()){
        this.params = params;
        this.width = params.world_width;
        this.height = params.world_height;

        this.stepnum = 0;

        this.cells = [];
        // initialise the world lattice to all nulls
        for(var i=0; i<this.width; i++){
            this.cells.push([]);
            for(var j=0; j<this.height; j++){
                this.cells[i][j] = null;
            }
        }

        this.plants = [];
        this.genomeInterpreter = new GenomeInterpreter(params.action_map);
    }

    seed(x=null, genome=null){
        // Create a new plant seed on the world floor
        if (genome===null){
            genome = ByteArray.random(this.params.initial_genome_length);
        }
        if (x===null){
            // find a random empty space
            var emptySpaces = [];
            for(var i=0; i<this.width; i++){
                if(this.cells[i][0] === null){
                    emptySpaces.push(i);
                }
            }
            if(emptySpaces.length > 0){
                x = emptySpaces[Math.floor(Math.random()*(emptySpaces.length-1))];
            }
            else{
                return false;
            }
        }
        if (this.cells[x][0] === null){
            var plant = new Plant(x, this, genome);
            this.plants.push(plant);
            this.addCell(plant.cells[0]);
            return true;
        }
        return false;
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

    step(){
        this.stepnum++;
        this.simulateDeath();
        this.simulateLight();
        this.plants.forEach(function(plant){
            plant.action(this.genomeInterpreter);
        }, this);
        this.mutate();
    }

    mutate(){
        this.plants.forEach(function(plant){
            var p_mut = this.params.mut_replacement * Math.pow(this.params.mut_factor, plant.genome.mut_exp);
            for(var  i=0; i<plant.genome.length; i++){
                if(Math.random() <= p_mut){
                    var mbit = Math.pow(2, Math.floor(Math.random()*7));
                    plant.genome[i] = plant.genome[i] ^ mbit;
                }
            }
        }, this);
    }

    /**
     * Use each plant's current death probability to simulate
     * whether each plant dies on this step
     */
    simulateDeath(){
        var dead_plants = [];
        this.plants.forEach(function(plant){
            var deathProb = plant.getDeathProbability(
                this.params.death_factor,
                this.params.natural_exp,
                this.params.energy_exp,
                this.params.leanover_factor
            );
            if (Math.random() <= deathProb.prob){
                dead_plants.push(plant);
            }
        }, this);
        dead_plants.forEach(function(plant){
            this.killPlant(plant);
        }, this);
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

    /**
     * Simulate light. Sunlight traverses from the ceiling of the world
     * downwards vertically. It is caught by a plant cell with a probability
     * which causes that cell to be energised.
     */
    simulateLight(){
        for(var x=0; x<this.width; x++){
            for(var y=0; y<this.height; y++){
                var cell = this.cells[x][this.height-y-1];
                if(cell !== null){
                    if(Math.random() <= this.params.energy_prob){
                        cell.energised = true;
                        break;
                    }
                }
            }
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

export { World, SimulationParams };