var should = require('chai').should();
var assert = require('chai').assert
var expect = require('chai').expect

import {ByteArray, GenomeInterpreter} from "../src/genome.js";
import {Divide} from "../src/actions.js";
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
    var genome = require("../src/genome.js")
    var interpreter = new GenomeInterpreter([220, 15, 0, 10, 10, 0])

    var ba = new ByteArray([0, 0, 0, 9, 17, 210])
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