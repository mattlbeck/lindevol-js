var should = require('chai').should();
var assert = require('chai').assert
var expect = require('chai').expect

import {World, SimulationParams} from "../src/world.js";
import {Cell} from "../src/cell.js";
import {ByteArray, GenomeInterpreter} from "../src/genome.js";

describe("World", function() {
    context("In a 1x1 world", function(){
        var world;
        before("new world", function(){
            world = new World({"world_width": 1, "world_height": 1});
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
        var world;
        var plant;
        before("new world", function(){
            world = new World({
                "world_width": 1, 
                "world_height": 3,
                "energy_prob": 1
            });
            world.seed(0); // cell is at (0, 0)
            plant = world.plants[0];
            plant.growFromCell(plant.cells[0], [0,1]);
        });
        context("When light is simulated", function(){
            before("simulate light", function(){
                world.simulateLight();
            });
            it("top most cell is energised", function(){
                world.getCell(0, 1).energised.should.be.true;
            });
            it("Bottom most cell is not energised", function(){
                world.getCell(0, 0).energised.should.be.false;
            });
            context("If further light is simulated", function(){
                before("second light sim", function(){
                    world.simulateLight();
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
                        plant.genome = new ByteArray([]);
                        plant.action(new GenomeInterpreter());
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
                        plant.genome = new ByteArray([2, 6]);
                        plant.action(new GenomeInterpreter());
                    });
                    it("all cells are not energised", function(){
                        plant.cells.forEach(function(cell){
                            plant.action(new GenomeInterpreter());
                            cell.energised.should.be.false;
                        });
                    });
                });
            });
        });
    });

});

describe("Plant", function() {
    var world, plant, cell;
    context("In a 3x2 world", function() {
        beforeEach(function() {
            world = new World(new SimulationParams({"world_width": 3, "world_height": 2, "action_map": [220, 16, 0, 10, 10, 0]}));
            world.seed(1); // cell is at (1, 0)
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
                plant.genome = new ByteArray([0, 6]);
                plant.action(new GenomeInterpreter())
            });
            it("the plant grows directly up", function(){
                plant.getNeighbourhood(cell).should.equal(Math.pow(2, 6));
            });
        });
        context("Given a gene for flying seed", function(){
            beforeEach("Add gene to plant and execute action", function(){
                plant.genome = new ByteArray([0, 221]);
                plant.action(new GenomeInterpreter());
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
                var dprob = plant.getDeathProbability(
                    world.params.death_factor,
                    world.params.natural_exp,
                    world.params.energy_exp,
                    world.params.leanover_factor
                );
                dprob.leanover.should.equal(world.params.leanover_factor);
            });
        });
    });

    context("In a world with two plants", function(){
        beforeEach(function() {
            world = new World(new SimulationParams({"world_width": 2, "world_height": 2, "action_map": [220, 16, 0, 10, 10, 0]}));
            world.seed(0); // cell is at (1, 0)
            world.seed(1);
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

