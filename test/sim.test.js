require("tap").mochaGlobals();
var should = require('chai').should();
var assert = require('chai').assert
var expect = require('chai').expect

const Plant = require("../src/plant.js");
const World = require("../src/world.js");
const Cell = require("../src/cell.js");

describe("World", function() {
    var world
    before("New world for a single cell", function(){
        world = new World(1, 1);
    });
    context("When a cell is added to the world", function() {
        var cell = new Cell(0, 0);
        world.addCell(cell);
        it("can be found in the correct position on the world grid", function() {
            world.cells[0][0].should.equal(cell);
        });
    });
});

describe("Plant", function() {
    var world, plant, cell
    context("In a 3x2 world", function() {
        beforeEach(function() {
            world = new World(3, 2);
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
            var directions = plant.getGrowDirection(cell)
            it("finds all empty neighbouring spaces", function() {
                directions.should.have.lengthOf(5)
            });
            it("All identified spaces are one away from the source", function(){
                directions.forEach(function(direction){
                    assert.isAtLeast(direction[0], -1);
                    assert.isAtMost(direction[0], 1);
                    assert.isAtLeast(direction[1], -1)
                    assert.isAtMost(direction[1], 1);
                });
            });
        });
        context("Growing plant vertically", function() {
            it("can grow directly up", function() {
                plant.growFromCell(cell, [0, 1]);
                assert.notTypeOf(world.cells[1][1], "null");
            });
            it("can grow diagnoally", function() {
                plant.growFromCell(cell, [1, 1]);
                assert.notTypeOf(world.cells[2][1], "null");
            });
            it("can grow horizontally", function() {
                plant.growFromCell(cell, [1, 0]);
                assert.notTypeOf(world.cells[2][0], "null");
            });
            it("will not grow if outside of the world", function() {
                expect(() => plant.growFromCell(cell, [0, -1])).to.throw();
            });
        });
    });
});