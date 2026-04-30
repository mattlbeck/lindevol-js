import {Cell} from "../src/cell.js";
import chai from "chai";
const {expect} = chai;
describe("Cell", function (){
    it("should not be energised by default", function (){
        var cell = new Cell(0, 0);
        expect(cell.energised).to.be.false;
    });
});