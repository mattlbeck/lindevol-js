import chai from 'chai';
const should = chai.should();
const assert = chai.assert;
const expect = chai.expect;

import {ByteArray, BlockInterpreter, PromotorInterpreter} from "../src/genome.js";
import {Divide} from "../src/actions.js";

describe("ByteArray mut_exp inheritance", function(){
    it("copy() inherits mut_exp from parent", function(){
        const parent = ByteArray.from([10, 20, 30]);
        parent.mut_exp = 2.5;
        const child = parent.copy();
        child.mut_exp.should.equal(2.5);
    });

    it("copy() increments to parent mut_exp independently", function(){
        const parent = ByteArray.from([10, 20, 30]);
        parent.mut_exp = 1.0;
        const child = parent.copy();
        child.mut_exp += 0.5;
        parent.mut_exp.should.equal(1.0); // parent unchanged
        child.mut_exp.should.equal(1.5);
    });

    it("copy() preserves byte contents", function(){
        const parent = ByteArray.from([1, 2, 3, 4]);
        parent.mut_exp = 0.8;
        const child = parent.copy();
        for(let i = 0; i < parent.length; i++){
            child[i].should.equal(parent[i]);
        }
    });
});

describe("ByteArray serialization", function(){
    it("serialize and deserialize round-trip preserves bytes", function(){
        const original = ByteArray.from([0, 14, 255, 128]);
        original.mut_exp = 0;
        const str = original.serialize();
        const restored = ByteArray.deserialize(str);
        for(let i = 0; i < original.length; i++){
            restored[i].should.equal(original[i]);
        }
    });

    it("serialize and deserialize round-trip preserves mut_exp", function(){
        const original = ByteArray.from([10, 20, 30]);
        original.mut_exp = 3.75;
        const str = original.serialize();
        const restored = ByteArray.deserialize(str);
        restored.mut_exp.should.equal(3.75);
    });

    it("serialize format is '<mut_exp>;<csv bytes>'", function(){
        const ba = ByteArray.from([1, 2, 3]);
        ba.mut_exp = 0;
        ba.serialize().should.equal("0;1,2,3");
    });
});
describe("Byte array", function(){
    describe("When init with 1, 2, 4, 8, 16, 32, 64, and 128", function(){
        // create the vals dynamically
        var vals = []
        for (var v=0; v<8; v++){
            vals.push(Math.pow(2, v));
        }

        var bytes = new ByteArray(vals.length);
        for(var i=0; i<vals.length; i++){
            bytes[i] = vals[i];
        }

        describe("When bytes are shifted right", function(){
            var result = [];
            bytes.forEach(b => result.push(b >> 1));
            it("expected result equals element in byte array indexed +1", function(){
                for(var i=0; i < bytes.length-1; i++){
                    bytes[i].should.equal(result[i+1]);
                }
            });
            it("1 results in 0", function(){
                result[0].should.equal(0);
            });
        });
        /**
        describe("When bytes are shifted left", function(){
            var result = [];
            bytes.forEach(b => result.push(b << 1));
            it("expected result equals element in byte array indexed +1", function(){
                for(var i=0; i < bytes.length-1; i++){
                    bytes[i+1].should.equal(result[i]);
                }
            });
            it("128 results in 0", function(){
                result[result.length-1].should.equal(0);
            });
        });
        */

        describe("When bytes are anded with 11111111", function(){
            var result = [];
            bytes.forEach(b => result.push(b & 255));
            it("no changes", function(){
                for(var i=0; i < bytes.length-1; i++){
                    bytes[i].should.equal(result[i]);
                }
            });
        });

        describe("When bytes are ORd with 11111111", function(){
            var result = []
            bytes.forEach(b => result.push(b | 255));
            it("results in the given input", function(){
                result.forEach(function(b){
                    b.should.equal(255)
                });
            });
        });

    });

});

describe("Block interpretation", function(){
    var interpreter = new BlockInterpreter([220, 15, 0, 10, 10, 0])

    var ba = ByteArray.from([0, 0, 0, 9, 17, 210])
    var rules = interpreter.interpret(ba)
    
    it("interprets the correct number of rules", function(){
        rules.should.have.length(3)
    });
    it("Interprets divide actions", function(){
        var rule = rules[0]
        assert.instanceOf(rule.action, Divide)
    });
    it("Interprets divide params correctly", function(){
        assert.deepEqual(rules.shift().action.params, [-1, -1])
        assert.deepEqual(rules.shift().action.params, [0, -1])
        assert.deepEqual(rules.shift().action.params, [1, -1])
    });
})

describe("Promotor interpretation", function(){
    var interpreter = new PromotorInterpreter([220, 15, 0, 10, 10, 0])
    var rules;
    beforeEach("interpret", function(){
        var ba = ByteArray.from([128, 0, 64]);
        rules = interpreter.interpret(ba)
    })
    it("interprets the correct number of rules", function(){
        rules.should.have.length(1);
    });
    it("Interprets terminator 64 as divide action [-1, -1]", function(){
        var rule = rules[0]
        assert.instanceOf(rule.action, Divide)
        assert.deepEqual(rule.action.params, [-1, -1])
    });
})