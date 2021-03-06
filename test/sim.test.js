var should = require('chai').should();
var assert = require('chai').assert
var expect = require('chai').expect

import {Simulation, SimulationParams} from "../src/simulation.js";
import {World} from "../src/world.js";
import {Cell} from "../src/cell.js";
import {ByteArray, BlockInterpreter} from "../src/genome.js";

describe("World", function() {
    context("In a 1x1 world", function(){
        var world;
        before("new world", function(){
            world = new World(1, 1);
        });
        context("Using coordinates outside world limits", function(){
            it("x wraps around", function(){
                assert.typeOf(world.getCell(1,0), "null");
            })
            it("getter returns undefined", function(){
                assert.typeOf(world.getCell(0,1), "undefined");
            });
        })
        context("When a cell is added to the world", function() {
            var cell;
            before("add cell", function(){
                cell = new Cell(null, 0, 0);
                world.addCell(cell);
            });
            it("can be found in the correct position on the world grid", function() {
                world.cells[0][0].should.equal(cell);
            });
        });
    });
    context("In a 1x3 world", function(){
        var sim;
        var world;
        var plant;
        before("new sim", function(){
            sim = new Simulation(new SimulationParams({
                "world_width": 1, 
                "world_height": 3,
                "energy_prob": 1
            }));
            world = sim.world;
            world.sowPlant(null, 0); // cell is at (0, 0)
            plant = sim.world.plants[0];
            plant.growFromCell(plant.cells[0], [0,1]);
        });
        context("When light is simulated", function(){
            before("simulate light", function(){
                sim.simulateLight();
            });
            it("top most cell is energised", function(){
                world.getCell(0, 1).energised.should.be.true;
            });
            it("Bottom most cell is not energised", function(){
                world.getCell(0, 0).energised.should.be.false;
            });
            context("If further light is simulated", function(){
                before("second light sim", function(){
                    sim.simulateLight();
                });
                it("top most cell is still energised", function(){
                    world.getCell(0, 1).energised.should.be.true;
                });
                it("Bottom most cell is still not energised", function(){
                    world.getCell(0, 0).energised.should.be.false;
                });
            });
            context("when plant performs actions", function(){
                context("when no actions available", function(){
                    before("actions", function(){
                        plant.genome = new ByteArray(0);
                        sim.simulateActions();
                    });
                    it("top most cell is still energised", function(){
                        world.getCell(0, 1).energised.should.be.true;
                    });
                    it("Bottom most cell is still not energised", function(){
                        world.getCell(0, 0).energised.should.be.false;
                    });
                });
                context("when actions are available", function(){
                    before("actions", function(){
                        plant.genome = ByteArray.from([2, 6]);
                        sim.simulateActions();
                    });
                    it("all cells are not energised", function(){
                        plant.cells.forEach(function(cell){
                            sim.simulateActions();
                            cell.energised.should.be.false;
                        });
                    });
                });
            });
        });
    });

});

describe("Plant", function() {
    var sim, world, plant, cell;
    context("In a 3x2 world", function() {
        beforeEach(function() {
            sim = new Simulation(new SimulationParams({
                "world_width": 3, 
                "world_height": 2,
                "genome_interpreter": "block",
                "action_map": [220, 15, 0, 10, 10, 0]
            }));
            world = sim.world;
            world.sowPlant(null, 1); // cell is at (1, 0)
            plant = world.plants[0];
            cell = plant.cells[0];
        });
        context("When seeded into the world", function() {
            it("The world contains one plant", function() {
                world.plants.should.have.lengthOf(1);
            });
            it("The world has a single starting cell", function() {
                world.plants[0].cells.should.have.lengthOf(1);
            });
        });
        context("Looking for a direction to grow", function() {
            var mask;
            before(function() {
                mask = plant.getNeighbourhood(cell)
            });
            it("finds all empty neighbouring spaces", function() {
                mask.should.equal(0)
            });
        });
        
        context("Growing plant", function() {
            beforeEach("Grow plant", function(){
                plant.growFromCell(cell, [0, 1]);
            });
            it("can grow directly up", function() {
                assert.notTypeOf(world.cells[1][1], "null");
            });
            it("neghbourhood has changed", function(){
                plant.getNeighbourhood(cell).should.equal(Math.pow(2, 6));
            });
            context("Growing plant again", function(){
                beforeEach("grow plant diagonally", function(){
                    plant.growFromCell(cell, [1, 1]);
                });
                it("neghbourhood has changed", function(){
                    plant.getNeighbourhood(cell).should.equal(Math.pow(2, 6) + Math.pow(2,7));
                });
            });
        });

        context("Given a gene for dividing vertically", function(){
            beforeEach("Add gene to plant and execute action", function(){
                plant.genome = ByteArray.from([0, 6]);
                plant.cells[0].energised = true;
                sim.simulateActions();
            });
            it("the plant grows directly up", function(){
                plant.getNeighbourhood(cell).should.equal(Math.pow(2, 6));
            });
        });
        context("Given a gene for flying seed", function(){
            beforeEach("Add gene to plant and execute action", function(){
                plant.genome = ByteArray.from([0, 220]);
                plant.cells[0].energised = true;
                sim.simulateActions();
            });
            it("there are now two plants", function(){
                world.plants.length.should.equal(2);
            });
        });
        context("Given a diagonally grown plant", function(){
            beforeEach("grow plant diagonally", function(){
                plant.growFromCell(cell, [1, 1]);
            });
            it("the leanover term is the same as the leanover factor", function(){
                var params = new SimulationParams();
                var dprob = plant.getDeathProbability(
                    params.death_factor,
                    params.natural_exp,
                    params.energy_exp,
                    params.leanover_factor
                );
                dprob.leanover.should.equal(params.leanover_factor);
            });
        });
    });

    context("In a world with two plants", function(){
        beforeEach(function() {
            world = new World(2,2);
            world.sowPlant(null, 0); // cell is at (1, 0)
            world.sowPlant(null, 1);
            plant = world.plants[0];
            cell = plant.cells[0];
        });
        it("there are two plants", function(){
            world.plants.length.should.equal(2);
        });
        context("When a plant grows into a non-energised plant", function(){
            beforeEach(function(){
                world.plants[0].growFromCell(world.plants[0].cells[0], [1,0]);
            });
            it("there is one plant", function(){
                world.plants.length.should.equal(1);
            });
            it("the plant has two cells", function(){
                world.plants[0].cells.length.should.equal(2);
            });
        });
        context("When a plant grows into a plant with one energy", function(){
            beforeEach(function(){
                world.plants[1].cells[0].energised = true;
                world.plants[0].growFromCell(world.plants[0].cells[0], [1,0]);
            });
            it("there is one plant", function(){
                world.plants.length.should.equal(1);
            });
            it("the plant has two cells", function(){
                world.plants[0].cells.length.should.equal(2);
            });
        });
        context("When a plant grows into itself", function(){
            beforeEach(function(){
                world.plants[0].growFromCell(world.plants[0].cells[0], [0,0]);
            });
            it("Nothing happens", function(){
                world.plants.length.should.equal(2);
            });
        });
    })
    
});

