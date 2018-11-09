import {ActionMap} from "./actions.js";
import { generateKeyPairSync } from "crypto";

class ByteArray extends Uint8Array{

    constructor(bytes=null, length=0, initial_mut_exp=0){
        if (bytes){
            if (typeof(bytes) === "string"){
                super(bytes.split(''));
            }
            else{
                super(bytes);
            }
        }
        else{
            super(length);
        }
        this.mut_exp = initial_mut_exp;
    }

    static random(length){
        var ba = new ByteArray(length);
        for(var i=0; i<ba.length;i++){
            ba[i] = Math.floor(Math.random()*255);
        }
        return ba;
    }

    getMutationProbability(params){
        return params.mut_replacement * Math.pow(params.mut_factor, this.mut_exp);
    }

    copy(){
        return new ByteArray(this, null, this.initial_mut_exp);
    }

}



class Rule {
    constructor(state, action){
        this.state = state;
        this.action = action;
    }

    toString(){
        return `${this.state} -> ${this.action}`;
    }
}

class GenomeInterpreter{
    /**
     * Methods that decode genomes into rules
     */
    constructor(mapping){
        this.mapping = new ActionMap(mapping);
    }
    interpret(bytearray){

    }
}

class BlockInterpreter extends GenomeInterpreter{
    interpret(bytearray){
        var rules = [];
        for(var i=0; i < bytearray.length; i+=2){
            var action = this.mapping.getAction(bytearray[i+1]);
            rules.push(new Rule(bytearray[i], action));
        }
        return rules;
    }
}

class PromotorInterpreter extends GenomeInterpreter{
    interpret(bytearray){
        var rules = [];
        var genes = [];
        var gene = [];
        for(var i=0; i < bytearray.length; i++){
            var c = bytearray[i];
            if(bitSet(c, 7)){
                // promotor
                gene = [c];
            }
            else{
                if(bitSet(c, 6)){
                    // terminator
                    if(gene.length>0){
                        gene.push(c);
                        genes.push(gene);
                        gene = [];
                    }
                }
                else {
                    // operator
                    if(gene.length>0){
                        gene.push(c);
                    }
                }
            }
            
        }
        genes.forEach(function(gene){
            // extract 6 least sig bits from terminator as the action code
            var action = this.mapping.getAction(gene[gene.length-1] & (Math.pow(2, 6) - 1));
            
            // take information from operators to create state mask
            var mask = Array(16).fill(null);
            for(var i=1; i<gene.length-1; i++) {
                // 4 least sig bits determine the mask index
                var maskBit = gene[i] & (Math.pow(2, 4) - 1);

                // determines if the mask at this index is set to 1 or 0
                var bit = (1 << 4) & gene[i];
                mask[maskBit] = bit;
            }
            rules.push(new Rule(mask, action));
        }, this);
        return rules;
    }
}

function bitSet(byte, i){
    return byte & Math.pow(2,i);
}

export {ByteArray, BlockInterpreter, PromotorInterpreter};