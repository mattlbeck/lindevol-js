actions = require("./actions.js")

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
        this.mapping = new actions.ActionMap(mapping)
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

module.exports = {ByteArray, GenomeInterpreter}