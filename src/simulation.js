import {World} from "./world.js";
import {ByteArray, BlockInterpreter, PromotorInterpreter, Mutator} from "./genome.js";

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
        this.mut_replace_mode = "bytewise";
        this.mut_replace = 0.002;
        this.mut_insert = 0.0004;
        this.mut_delete = 0.0004;
        this.mut_factor = 1.5;
        this.initial_mut_exp = 0;

        this.genome_interpreter = "block";
        this.initial_genome_length = 400;

        // divide, flyingseed, localseed, mut+, mut-, statebit
        this.action_map = [200, 20, 0, 18, 18, 0];

        Object.assign(this, params);
    }
}

class Simulation {
    constructor(params) {
        this.params = params;
        this.world = new World(this.params.world_width, this.params.world_height);
        this.genomeInterpreter = this.getInterpreter();
        this.stepnum = 0;
    }

    getInterpreter(){
        switch (this.params.genome_interpreter){
        case "block":
            return new BlockInterpreter(this.params.action_map);
        case "promotor":
            return new PromotorInterpreter(this.params.action_map);
        default:
            throw new Error(`Unknown interpreter ${this.params.genome_interpreter}`);
        }  
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
        this.simulateActions();
        this.mutate();
    }

    simulateActions(){
        this.world.plants.forEach(function(plant){
            var rules = this.genomeInterpreter.interpret(plant.genome);
            plant.cells.forEach(function(cell){
                this.cellAction(cell, rules);
            }, this);
        }, this);
    }

    cellAction(cell, rules){
        var state;
        if (this.genomeInterpreter instanceof BlockInterpreter){
            state = cell.plant.getNeighbourhood(cell);
        }
        else if(this.genomeInterpreter instanceof PromotorInterpreter){
            state = cell.plant.getState(cell);
        }
        rules.forEach(function(rule){
            // execute one action using the first matching rule
            // if (rule.matches(state)){
            if (rule.matches(state)){
                rule.action.execute(cell);
            }
        }, this);
        cell.updateState();
    }

    mutate(){
        var mutator = new Mutator(this.params.mut_factor, this.params.mut_replace, 
            this.params.mut_insert, this.params.mut_delete, 
            0, this.params.mut_replace_mode, this.params.units);
        this.world.plants.forEach(function(plant){
            mutator.mutate(plant.genome);
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