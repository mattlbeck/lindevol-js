import {ActionMap} from "./actions.js";

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
        var rules = []
        for(var i=0; i < bytearray.length; i+=2){
            var action = this.mapping.getAction(bytearray[i+1]);
            rules.push(new Rule(bytearray[i], action));
        }
        return rules;
    }
}

export {ByteArray, GenomeInterpreter};