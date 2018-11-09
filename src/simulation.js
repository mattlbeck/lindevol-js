import {World} from "./world.js";
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
        this.initial_genome_length = 400;
        this.action_map = [200, 20, 0, 18, 18, 0];

        Object.assign(this, params);
    }
}

class Simulation {
    constructor(params) {
        this.params = params;
        this.world = new World(this.params.world_width, this.params.world_height);
        this.genomeInterpreter = new GenomeInterpreter(params.action_map);
        this.stepnum = 0;
    }

    init_population(){
        // randomly choose spots to seed the world with
        for (var i=0; i<this.params.initial_population; i++){
            this.newSeed();
        }
    }

    newSeed(){
        // create a random genome
        var genome = ByteArray.random(this.params.initial_genome_length);
        this.world.seed(genome);
    }

    step(){
        this.stepnum++;
        this.simulateDeath();
        this.simulateLight();
        this.world.plants.forEach(function(plant){
            plant.action(this.genomeInterpreter);
        }, this);
        this.mutate();
    }

    mutate(){
        this.world.plants.forEach(function(plant){
            var p_mut = plant.genome.getMutationProbability(this.params);
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
        this.world.plants.forEach(function(plant){
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
            this.world.killPlant(plant);
        }, this);
    }

    /**
     * Simulate light. Sunlight traverses from the ceiling of the world
     * downwards vertically. It is caught by a plant cell with a probability
     * which causes that cell to be energised.
     */
    simulateLight(){
        for(var x=0; x<this.world.width; x++){
            for(var y=0; y<this.world.height; y++){
                var cell = this.world.cells[x][this.world.height-y-1];
                if(cell !== null){
                    if(Math.random() <= this.params.energy_prob){
                        cell.energised = true;
                        break;
                    }
                }
            }
        }
    }
}

export {Simulation, SimulationParams};