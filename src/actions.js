var NEIGHBOURHOOD = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]];

class Action{
    constructor(actionCode){
        this.code = actionCode;
    }

    get params(){
        return 0;
    }

    execute(cell){
        cell.energised = false;
    }
}

class Divide extends Action{

    execute(cell){
        // the 2 least significant bits of the action code
        // determines which direction the divide action is for
        super.execute(cell);
        var direction = this.getDirection();
        cell.plant.growFromCell(cell, direction);
    }

    get params(){
        return this.getDirection();
    }

    getDirection(){
        // extract the correct bits
        // & with 00000111 to mask out least sig bits
        var directionCode = this.code & 7;
        return NEIGHBOURHOOD[directionCode];
    }

    toString(){
        return `divide ${this.getDirection()}`;
    }
}

class MutatePlus extends Action{
    execute(cell){
        super.execute(cell);
    }

    toString(){
        return "mut+";
    }
}

class MutateMinus extends Action{
    execute(cell){
        super.execute(cell);
    }

    toString(){
        return "mut-";
    }
}

class FlyingSeed extends Action{
    execute(cell){
        super.execute(cell);
        cell.plant.world.seed(null, cell.plant.genome.copy());
    }

    toString(){
        return "flyingseed";
    }
}

class LocalSeed extends Action{
    execute(cell){
        // cell.plant.seed
    }

    toString(){
        return "localseed";
    }
}

class ActionMap {

    constructor(mapping=[220, 15, 0, 10, 10, 0]){
        this.mapping = mapping;
        this.actions = [Divide, FlyingSeed, LocalSeed, MutatePlus, MutateMinus];
    }

    getAction(actionCode){
        var mappingCount = 0;
        for(var i=0; i<this.mapping.length; i++){
            mappingCount += this.mapping[i];
            if (actionCode < mappingCount){
                return new this.actions[i](actionCode);
            }
        }
        throw `Action code ${actionCode} does not map to an action`
    }
}

export {Divide, MutatePlus, MutateMinus, LocalSeed, FlyingSeed, ActionMap, NEIGHBOURHOOD};