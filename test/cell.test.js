const Cell = require("../src/cell.js");
require("tap").mochaGlobals()

describe("Cell", function (){
    it("should be energised by default", function (){
        var cell = new Cell(0, 0);
        expect(cell.energised).toBe(true);
    });
});