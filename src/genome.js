import {ActionMap} from "./actions.js"

class ByteArray extends Uint8Array{

    constructor(bytes=null, length=0){
        if (bytes){
            if (typeof(bytes) === "string"){
                super(bytes.split(''))
            }
            else{
                super(bytes)
            }
        }
        else{
            super(length)
        }
    }

    static random(length){
        var ba = new ByteArray(length)
        for(var i=0; i<ba.length;i++){
            ba[i] = Math.floor(Math.random()*255)
        }
        return ba
    }

}



class Rule {
    constructor(state, action){
        this.state = state;
        this.action = action;
    }
}

class GenomeInterpreter{
    /**
     * Methods that decode genomes into rules
     */
    constructor(mapping=[224, 0, 0, 16, 16, 0]){
        this.mapping = new ActionMap(mapping)
    }
    
    interpret(bytearray){
        var rules = []
        for(var i=0; i < bytearray.length; i+=2){
            var action = this.mapping.getAction(bytearray[i+1])
            rules.push(new Rule(bytearray[i], action))
        }
        return rules
    }
}

export {ByteArray, GenomeInterpreter};