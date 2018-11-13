import {ActionMap} from "./actions.js";

class ByteArray extends Array{

    constructor(length=0, initial_mut_exp=0){
        super(length);
        this.mut_exp = initial_mut_exp;
    }

    static random(length){
        var ba = new ByteArray(length);
        for(var i=0; i<ba.length;i++){
            ba[i] = Math.floor(Math.random()*255);
        }
        return ba;
    }

    copy(){
        var newArr = new ByteArray(this.length, this.initial_mut_exp);
        for(var i=0; i<this.length; i++){
            newArr[i] = this[i];
        }
        return newArr;
    }

}

class Mutator{
    constructor(prob, prob_replacement, prob_insertion, prob_deletion, prob_dup, replacement_mode, units){
        this.prob = prob;
        this.pR = prob_replacement;
        this.pI = prob_insertion;
        this.pD = prob_deletion;
        this.pDup = prob_dup;
        this.pRmode = replacement_mode;  
        this.units = units;
    }

    mutate(genome){
        if(this.mProb(this.pR, genome.mut_exp)){
            this.replace(genome);
        }
        if(this.mProb(this.pI, genome.mut_exp)){
            this.insert(genome);
        }
        if(this.mProb(this.pD, genome.mut_exp)){
            this.delete(genome);
        }
    }

    mProb(p, exp){
        return Math.random() < p * Math.pow( this.prob, exp);
    }

    replace(genome){
        var i = this.randomPos(genome);
        switch(this.pRmode){
        case "bytewise":
            genome[i] = this.randomChar();
            break;
        case "bitwise":
            genome[i] = genome[i] ^ Math.pow(2, Math.floor(Math.random()*7));
            break;
        default:
            throw new Error(`Invalid mutation replacement mode: ${this.pRmode}`);
        }
        
    }

    insert(genome){
        var i = this.randomPos(genome);
        for(var n; n<this.units; n++){
            genome.splice(i, 0, this.randomChar());
        }
    }

    delete(genome){
        var i = this.randomPos(genome);
        for(var n; n<this.units; n++){
            genome.splice(i, 1);
        }
    }

    randomChar(){
        return Math.floor(Math.random()*255);
    }

    randomPos(genome){
        return Math.floor(Math.random()*genome.length);
    }
}



class Rule {
    constructor(eqMask, state, action){
        this.eqMask = eqMask;
        this.state = state;
        this.action = action;
    }

    matches(state){
        var eqState = state & this.eqMask;
        return eqState === this.state;
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
            rules.push(new Rule(255, bytearray[i], action));
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
            if(bitSet(c, 6) === bitSet(c, 7)){
                // operator
                if(gene.length>0){
                    gene.push(c);
                }
                continue;
            }
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
            }
            
        }
        genes.forEach(function(gene){
            // extract 6 least sig bits from terminator as the action code
            var actionCode = gene[gene.length-1] & (Math.pow(2, 6) - 1);
            var action = this.mapping.getAction(actionCode);
            
            // take information from operators to create state mask
            var mask = 0;
            var eqMask = 0; // specified which bits contribute to the state mask
            var mask = 0;
            for(var i=1; i<gene.length-1; i++) {
                // 4 least sig bits determine the mask index
                var maskBit = gene[i] & (Math.pow(2, 4) - 1);

                // determines if the mask at this index is set to 1 or 0
                var bitState = (gene[i] & Math.pow(2, 4)) >> 4;
                mask += Math.pow(2, maskBit)*bitState;

                eqMask += Math.pow(2, maskBit);
            }
            rules.push(new Rule(eqMask, mask, action));
        }, this);
        return rules;
    }
}

function bitSet(byte, i){
    return (byte & Math.pow(2, i)) >> i;
}

export {ByteArray, BlockInterpreter, PromotorInterpreter, Mutator};