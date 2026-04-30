import {Cell} from "../src/cell.js";
import {Plant} from "../src/plant.js";
import {World} from "../src/world.js";
import chai from "chai";
const {expect} = chai;

describe("Cell", function (){
    it("should not be energised by default", function (){
        var cell = new Cell(null, 0, 0);
        expect(cell.energised).to.be.false;
    });

    context("energised setter + Plant.energisedCount caching", function() {
        var world, plant, cell;

        before(function() {
            world = new World(3, 3);
            world.sowPlant(null, 1);
            plant = world.plants[0];
            cell = plant.cells[0];
        });

        it("plant starts with energisedCount of 0", function() {
            expect(plant.energisedCount).to.equal(0);
        });

        it("setting energised=true increments plant.energisedCount", function() {
            cell.energised = true;
            expect(plant.energisedCount).to.equal(1);
        });

        it("setting energised=true again does not double-count", function() {
            cell.energised = true;
            expect(plant.energisedCount).to.equal(1);
        });

        it("setting energised=false decrements plant.energisedCount", function() {
            cell.energised = false;
            expect(plant.energisedCount).to.equal(0);
        });

        it("setting energised=false again does not go negative", function() {
            cell.energised = false;
            expect(plant.energisedCount).to.equal(0);
        });

        it("energisedCount reflects all energised cells across the plant", function() {
            plant.growFromCell(cell, [0, 1]);
            plant.growFromCell(cell, [1, 0]);
            plant.cells[0].energised = true;
            plant.cells[1].energised = true;
            expect(plant.energisedCount).to.equal(2);
            plant.cells[0].energised = false;
            expect(plant.energisedCount).to.equal(1);
        });
    });
});