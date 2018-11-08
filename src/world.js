import {Plant} from "./plant.js";
import {ByteArray, GenomeInterpreter} from "./genome.js";

class SimulationParams{
    constructor(params={}){
        this.world_width = 80;
        this.world_height = 40;
        this.initial_population = 60;
        
        this.energy_prob = 0.5;

        // death params
        this.death_factor = 0.35;
        this.natural_exp = 0;
        this.energy_exp = -2.5;
        this.leanover_factor = 0.15;

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
        for(var i=0; i<this.width; i++){
            this.cells.push([]);
            for(var j=0; j<this.height; j++){
                this.cells[i][j] = null;
            }
        }

        this.plants = [];
        this.genomeInterpreter = new GenomeInterpreter();
    }

    seed(x){
        // Create a new plant seed on the world floor
        var g = ByteArray.random(20);
        var plant = new Plant(x, this, g);
        this.plants.push(plant);
        this.cells[x][0] = plant.cells[0];
    }

    getCell(x, y){
        if (x in this.cells){
            return this.cells[x][y];
        }
        return undefined;
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
            for(var  i=0; i<plant.genome.length; i++){
                if(Math.random() > 0.9){
                    var mbit = Math.pow(2, Math.floor(Math.random()*7));
                    plant.genome[i] = plant.genome[i] ^ mbit;
                }
            }
        });
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
            if (Math.random() < deathProb){
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