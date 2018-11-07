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
        var cell = new Cell(null, 0, 0);
        world.addCell(cell);
        it("can be found in the correct position on the world grid", function() {
            world.cells[0][0].should.equal(cell);
        });
    });
});

describe("Plant", function() {
    var world, plant, cell
    context("In a 3x2 world", function() {
        before(function() {
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
            var mask = plant.getNeighbourhood(cell)
            it("finds all empty neighbouring spaces", function() {
                mask.should.equal(0)
            });
        });
        
        context("Growing plant", function() {
            before("Grow plant", function(){
                plant.growFromCell(cell, [0, 1]);
            });
            it("can grow directly up", function() {
                assert.notTypeOf(world.cells[1][1], "null");
            });
            it("neghbourhood has changed", function(){
                plant.getNeighbourhood(cell).should.equal(Math.pow(2, 6))
            });
            context("Growing plant again", function(){
                before("grow plant diagonally", function(){
                    plant.growFromCell(cell, [1, 1]);
                });
                it("neghbourhood has changed", function(){
                    plant.getNeighbourhood(cell).should.equal(Math.pow(2, 6) + Math.pow(2,7))
                });
            });
        });
    });
});

