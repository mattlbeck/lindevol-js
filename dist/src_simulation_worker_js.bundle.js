/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "?d4c0"
/*!************************!*\
  !*** crypto (ignored) ***!
  \************************/
() {

/* (ignored) */

/***/ },

/***/ "./src/actions.js"
/*!************************!*\
  !*** ./src/actions.js ***!
  \************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ActionMap: () => (/* binding */ ActionMap),
/* harmony export */   Divide: () => (/* binding */ Divide),
/* harmony export */   FlyingSeed: () => (/* binding */ FlyingSeed),
/* harmony export */   LocalSeed: () => (/* binding */ LocalSeed),
/* harmony export */   MutateMinus: () => (/* binding */ MutateMinus),
/* harmony export */   MutatePlus: () => (/* binding */ MutatePlus),
/* harmony export */   NEIGHBOURHOOD: () => (/* binding */ NEIGHBOURHOOD)
/* harmony export */ });
const NEIGHBOURHOOD = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]];
const MUT_INCREMENT = 0.001;

class Action{
    constructor(actionCode){
        this.code = actionCode;
    }

    get params(){
        return 0;
    }

    execute(cell){
        // actions are typically only carried out if the cell has energy
        // and the cell loses energy as a result.
        if (cell.energised){
            var success = this.doAction(cell);
            cell.energised = !success;
        }
        
    }

    doAction(cell){

    }
}

class Divide extends Action{

    doAction(cell){
        // the 2 least significant bits of the action code
        // determines which direction the divide action is for
        super.doAction(cell);
        var direction = this.getDirection();
        cell.plant.growFromCell(cell, direction);
        return true;
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
    doAction(cell){
        super.doAction(cell);
        cell.plant.genome.mut_exp += MUT_INCREMENT;
        return true;
    }

    toString(){
        return "mut+";
    }
}

class MutateMinus extends Action{
    doAction(cell){
        super.doAction(cell);
        cell.plant.genome.mut_exp -= MUT_INCREMENT;
        return true;
    }

    toString(){
        return "mut-";
    }
}

class FlyingSeed extends Action{
    doAction(cell){
        super.doAction(cell);
        return cell.plant.world.seed(cell.plant.genome.copy());
    }

    toString(){
        return "flyingseed";
    }
}

class LocalSeed extends Action{
    doAction(cell){
        super.doAction(cell);
        return cell.plant.world.seed(cell.plant.genome.copy(), cell.x);
    }

    toString(){
        return "localseed";
    }
}

class StateBitN extends Action{
    doAction(cell) {
        cell.nextInternalState = cell.nextInternalState & Math.pow(2, this.getNthBit());
        // this action does not consume energy
        return false;
    }

    getNthBit(){
        // extract the correct bits
        // & with 00001111 to mask out least sig bits
        return this.code & 15;
    }

    toString(){
        return `StateBit ${this.getNthBit()}`;
    }
}

class ActionMap {

    constructor(mapping){
        this.mapping = mapping;
        this.actions = [Divide, FlyingSeed, LocalSeed, MutatePlus, MutateMinus, StateBitN];
    }

    getAction(actionCode){
        var mappingCount = 0;
        for(var i=0; i<this.mapping.length; i++){
            mappingCount += this.mapping[i];
            if (actionCode < mappingCount){
                return new this.actions[i](actionCode);
            }
        }
        throw `Action code ${actionCode} does not map to an action`;
    }

}



/***/ },

/***/ "./src/cell.js"
/*!*********************!*\
  !*** ./src/cell.js ***!
  \*********************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Cell: () => (/* binding */ Cell)
/* harmony export */ });

class Cell{
    constructor(plant, x, y){
        this.plant = plant;
        this.x = x;
        this.y = y;
        this._energised = false;
        this.internalState = 0;
        this.nextInternalState = 0;
    }

    get energised() {
        return this._energised;
    }

    set energised(value) {
        if (this._energised === value) return;
        this._energised = value;
        if (this.plant) {
            if (value) {
                this.plant.energisedCount++;
            } else {
                this.plant.energisedCount--;
            }
        }
    }

    updateState(){
        this.internalState = this.nextInternalState;
        this.nextInternalState = 0;
    }

    draw(ctx, x, y, size, colour){
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, size, size);
        //ctx.strokeRect(x, y, size, size);
    }

    toString(){
        return `Cell at (${this.x}, ${this.y}) energy: ${this.energised}`;
    }
}



/***/ },

/***/ "./src/genome.js"
/*!***********************!*\
  !*** ./src/genome.js ***!
  \***********************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BlockInterpreter: () => (/* binding */ BlockInterpreter),
/* harmony export */   ByteArray: () => (/* binding */ ByteArray),
/* harmony export */   Mutator: () => (/* binding */ Mutator),
/* harmony export */   PromotorInterpreter: () => (/* binding */ PromotorInterpreter)
/* harmony export */ });
/* harmony import */ var _random_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./random.js */ "./src/random.js");
/* harmony import */ var _actions_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./actions.js */ "./src/actions.js");



class ByteArray extends Array{

    constructor(length=0, initial_mut_exp=0){
        super(length);
        this.mut_exp = initial_mut_exp;
    }

    static from(arr){
        var ba = new ByteArray(arr.length);
        for(var i=0; i<ba.length;i++){
            ba[i] = arr[i];
        }
        return ba;
    }

    static random(length){
        var ba = new ByteArray(length);
        for(var i=0; i<ba.length;i++){
            ba[i] = (0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, 255);
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
        return (0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomProb)(p * Math.pow( this.prob, exp));
    }

    replace(genome){
        var i = this.randomPos(genome);
        switch(this.pRmode){
        case "bytewise":
            genome[i] = this.randomChar();
            break;
        case "bitwise":
            genome[i] = genome[i] ^ Math.pow(2, (0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, 7));
            break;
        default:
            throw new Error(`Invalid mutation replacement mode: ${this.pRmode}`);
        }
        
    }

    insert(genome){
        var i = this.randomPos(genome);
        for(var n=0; n<this.units; n++){
            genome.splice(i, 0, this.randomChar());
        }
    }

    delete(genome){
        var i = this.randomPos(genome);
        for(var n=0; n<this.units; n++){
            genome.splice(i, 1);
        }
    }

    randomChar(){
        return (0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, 255);
    }

    randomPos(genome){
        return (0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, genome.length-1);
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
        this.mapping = new _actions_js__WEBPACK_IMPORTED_MODULE_1__.ActionMap(mapping);
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



/***/ },

/***/ "./src/plant.js"
/*!**********************!*\
  !*** ./src/plant.js ***!
  \**********************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Plant: () => (/* binding */ Plant)
/* harmony export */ });
/* harmony import */ var _random_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./random.js */ "./src/random.js");
/* harmony import */ var _cell_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./cell.js */ "./src/cell.js");
/* harmony import */ var _actions_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./actions.js */ "./src/actions.js");




class Plant{
    constructor(x, world, genome, useInternalState=false) {
        this.world = world;
        this.energisedCount = 0;
        this.cells = [new _cell_js__WEBPACK_IMPORTED_MODULE_1__.Cell(this, this.world.getX(x), 0)];
        this.genome = genome;
        this.useInternalState = useInternalState;
    }

    getNeighbourhood(cell){
        // Return the neighbourhood mask
        var mask = 0;
        for(var i=0; i<_actions_js__WEBPACK_IMPORTED_MODULE_2__.NEIGHBOURHOOD.length; i++){
            var pos = _actions_js__WEBPACK_IMPORTED_MODULE_2__.NEIGHBOURHOOD[i];
            var x = cell.x + pos[0];
            var y = cell.y + pos[1];
            try{
                var worldPos = this.world.cells[x][y];
            }
            catch(error){
                continue;
            }
            if (worldPos instanceof _cell_js__WEBPACK_IMPORTED_MODULE_1__.Cell){
                mask = mask | Math.pow(2, i);
            }
        }
        return mask;
    }

    getState(cell){
        return this.getNeighbourhood(cell) | cell.internalState | (Math.pow(2, 15) * ( cell.energised ? 1 : 0));
    }

    grow(){
        this.cells.forEach(function(cell){
            // 50% chance to grow
            if((0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomProb)(0.8)){
                var spaces = this.getGrowDirection(cell);
                if(spaces.length > 0){
                    var direction = spaces[(0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, spaces.length)];
                    if (direction !== null){
                        this.growFromCell(cell, direction);
                    }
                }
            }
        }, this);
    }

    /**
     * Grow the plant by one cell if possible
     * @param {*} cell the cell to grow from
     * @param {*} direction the direction to grow in
     */
    growFromCell(cell, direction){
        var x = cell.x+direction[0], y = cell.y+direction[1];
        // check if space is clear
        var space = this.world.getCell(x, y);
        if (space === undefined){
            return;
        }
        if (space instanceof _cell_js__WEBPACK_IMPORTED_MODULE_1__.Cell){
            if (space.plant === this){
                return;
            }
            // this plant will kill the other
            // with a probability...
            if((0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomProb)(space.plant.getKillProbability())){
                // attack succeeded. Kill competitor and continue with growth
                this.world.killPlant(space.plant);
            }
            else {
                // attack failed
                return;
            }
            
        }
        // grow cell in to empty space
        var new_cell = new _cell_js__WEBPACK_IMPORTED_MODULE_1__.Cell(this, this.world.getX(x), y);
        this.cells.push(new_cell);
        this.world.addCell(new_cell);
    }

    getKillProbability(){
        return 1/this.energisedCount;
    }

    /**
     * Calculate whether this plant should die.
     * @param {} natural_exp exponent to the number of cells
     * @param {*} energy_exp exponent to the number of energy rich cells
     * @param {*} leanover_factor factor to the leanover term
     */
    getDeathProbability(death_factor, natural_exp, energy_exp, leanover_factor){
        var numCells = this.cells.length;
        var leanoverEnergised = 0;
        var rootCell = this.cells[0];
        for(var i=0; i<this.cells.length; i++){
            var cell = this.cells[i];
            var le = this.world.width/2 - ( (( 1.5*this.world.width ) + cell.x - rootCell.x)  % this.world.width);
            leanoverEnergised += le;
        }

        var leanoverCells = 2/(numCells*(numCells-1));
        if (leanoverCells === Infinity){
            leanoverCells = 0;
        }

        var leanoverTerm = leanoverCells*Math.abs(leanoverEnergised);
        
        var d_natural = Math.pow(numCells, natural_exp);
        var d_energy = Math.pow(this.energisedCount+1, energy_exp);
        var d_leanover = leanover_factor*leanoverTerm;
        var pDeath = death_factor * d_natural * d_energy + d_leanover;
        return {
            "prob": pDeath,
            "natural": d_natural,
            "energy": d_energy,
            "leanover": d_leanover
        };
    }
}



/***/ },

/***/ "./src/random.js"
/*!***********************!*\
  !*** ./src/random.js ***!
  \***********************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   randomInt: () => (/* binding */ randomInt),
/* harmony export */   randomProb: () => (/* binding */ randomProb),
/* harmony export */   seedRandom: () => (/* binding */ seedRandom)
/* harmony export */ });
/* harmony import */ var seedrandom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! seedrandom */ "./node_modules/seedrandom/index.js");


/**
 * Seed all future calls to Math.random
 * @param {*} seed data to use to seed all future RNG calls
 */
function seedRandom(seed){
    seedrandom__WEBPACK_IMPORTED_MODULE_0__(seed, {global: true});
}

/**
 * returns a random integer between 0 and max (inclusive)
 * @param {*} max maximum integer to generate as a random number
 */
function randomInt(min, max){
    // note: Math.random returns a random number exclusive of 1,
    // so there is +1 in the below equation to ensure the maximum
    // number is considered when flooring 0.9... results.
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Evaluates the chance of an event happening given prob
 * @param {*} prob fraction between 0 and 1 chance of the event happening
 * @returns true if the event happens, false if not
 */
function randomProb(prob){
    return Math.random() <= prob;
}



/***/ },

/***/ "./src/simdata.js"
/*!************************!*\
  !*** ./src/simdata.js ***!
  \************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SimData: () => (/* binding */ SimData)
/* harmony export */ });
/* harmony import */ var stats_lite__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! stats-lite */ "./node_modules/stats-lite/stats.js");


class SimData{

    constructor(simulation){
        this.sim = simulation;
        this.data = {"stepnum": []};
        this.collectors = [
            new Collector("population", AsIs, function(sim){
                return sim.world.plants.length;
            }),
            new Collector("total_cells", AsIs, function(sim){
                return sim.world.plants.reduce((sum, p) => sum + p.cells.length, 0);
            }),
            new Collector("energised_cells", AsIs, function(sim){
                return sim.world.plants.reduce((sum, p) => sum + p.cells.filter(c => c.energised).length, 0);
            }),
            new Collector("plant_size_", Summary, function(sim){
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.cells.length);
            }),
            new Collector("genome_size_", Summary, function(sim){
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.genome.length);
            }),
            new Collector("mut_exp_", Summary, function(sim){
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.genome.mut_exp);
            }),
            new Collector("plant_height_", Summary, function(sim){
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => {
                    return Math.max(...p.cells.map(c => c.y));
                });
            })
        ];
    }

    /**
     * Collect data for the current step
     */
    recordStep(){
        var stepData = {};
        this.collectors.forEach(function(c){
            var values = c.collect(this.sim);
            Object.assign(stepData, values);
        }, this);

        this.data["stepnum"].push(this.sim.stepnum);
        Object.keys(stepData).forEach(function(k){
            if (!(k in this.data)){
                this.data[k] = [];
            }
            this.data[k].push(stepData[k]); 
        }, this);
    }
}

class Collector{
    constructor(name, typecls, collectFunc){
        this.name = name;
        this.type = new typecls(name);
        this.func = collectFunc;
    }

    collect(sim){
        var data = this.func(sim);
        return this.type.transform(data);
    }
}

class CollectorType{
    constructor(name){
        this.name = name;
    }

    transformData(data){
        throw new Error("Unimplemented method");
    }

    transform(data){
        var values = this.transformData(data);
        var transformed_data = {};
        Object.keys(values).forEach(function(k){
            transformed_data[this.name + k] = values[k];
        }, this);
        return transformed_data;
    }
}

class AsIs extends CollectorType {

    transformData(data){
        return {"": data};
    }
}

class Summary extends CollectorType {

    transformData(data){
        return {"min": Math.min(data), "mean": stats_lite__WEBPACK_IMPORTED_MODULE_0__.mean(data), "max": Math.max(data)};
    }
}


/***/ },

/***/ "./src/simulation.js"
/*!***************************!*\
  !*** ./src/simulation.js ***!
  \***************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Simulation: () => (/* binding */ Simulation),
/* harmony export */   SimulationParams: () => (/* binding */ SimulationParams)
/* harmony export */ });
/* harmony import */ var _random_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./random.js */ "./src/random.js");
/* harmony import */ var _world_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./world.js */ "./src/world.js");
/* harmony import */ var _genome_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./genome.js */ "./src/genome.js");




class SimulationParams{
    constructor(params={}){
        this.random_seed = 1;
        this.record_interval = 10;
        this.steps_per_frame = 1;
        this.disturbance_interval = 0;
        this.disturbance_strength = 0.1;

        this.world_width = 250;
        this.world_height = 40;
        this.initial_population = 250;
        
        this.energy_prob = 0.5;

        // death params
        this.death_factor = 0.2;
        this.natural_exp = 0;
        this.energy_exp = -2.5;
        this.leanover_factor = 0.2;

        // mutations
        this.mut_replace_mode = "bytewise";
        this.mut_replace = 0.002;
        this.mut_insert = 0.0004;
        this.mut_delete = 0.0004;
        this.mut_factor = 1.5;
        this.initial_mut_exp = 0;

        this.genome_interpreter = "block";
        this.initial_genome_length = 400;

        // divide, flyingseed, localseed, mut+, mut-, statebit
        this.action_map = [200, 20, 0, 18, 18, 0];

        Object.assign(this, params);
    }
}

class Simulation {
    constructor(params) {
        this.params = params;

        // Seed all future calls to random
        // this makes out tests reproducible given the same seed is used
        // in future input parameters
        (0,_random_js__WEBPACK_IMPORTED_MODULE_0__.seedRandom)(this.params.random_seed);

        this.world = new _world_js__WEBPACK_IMPORTED_MODULE_1__.World(this.params.world_width, this.params.world_height);
        this.genomeInterpreter = this.getInterpreter();
        this.mut_units = 1;
        // ensure mutation units is compatible with the interpreter type
        if(this.genomeInterpreter instanceof _genome_js__WEBPACK_IMPORTED_MODULE_2__.BlockInterpreter){
            this.mut_units = 2;
        }
        this.stepnum = 0;
    }

    getInterpreter(){
        switch (this.params.genome_interpreter){
        case "block":
            return new _genome_js__WEBPACK_IMPORTED_MODULE_2__.BlockInterpreter(this.params.action_map);
        case "promotor":
            return new _genome_js__WEBPACK_IMPORTED_MODULE_2__.PromotorInterpreter(this.params.action_map);
        default:
            throw new Error(`Unknown interpreter ${this.params.genome_interpreter}`);
        }  
    }

    init_population(){
        // randomly choose spots to seed the world with
        for (var i=0; i<this.params.initial_population; i++){
            this.newSeed();
        }
    }

    newSeed(){
        // create a random genome
        var genome = _genome_js__WEBPACK_IMPORTED_MODULE_2__.ByteArray.random(this.params.initial_genome_length);
        this.world.seed(genome);
    }

    step(){
        this.stepnum++;
        this.simulateDeath();
        this.simulateLight();
        this.simulateActions();
        this.mutate();
    }

    simulateActions(){
        this.world.plants.forEach(function(plant){
            var rules = this.genomeInterpreter.interpret(plant.genome);
            plant.cells.forEach(function(cell){
                this.cellAction(cell, rules);
            }, this);
        }, this);
    }

    cellAction(cell, rules){
        var state;
        if (this.genomeInterpreter instanceof _genome_js__WEBPACK_IMPORTED_MODULE_2__.BlockInterpreter){
            state = cell.plant.getNeighbourhood(cell);
        }
        else if(this.genomeInterpreter instanceof _genome_js__WEBPACK_IMPORTED_MODULE_2__.PromotorInterpreter){
            state = cell.plant.getState(cell);
        }
        rules.forEach(function(rule){
            // execute one action using the first matching rule
            // if (rule.matches(state)){
            if (rule.matches(state)){
                rule.action.execute(cell);
            }
        }, this);
        cell.updateState();
    }

    mutate(){
        var mutator = new _genome_js__WEBPACK_IMPORTED_MODULE_2__.Mutator(this.params.mut_factor, this.params.mut_replace, 
            this.params.mut_insert, this.params.mut_delete, 
            0, this.params.mut_replace_mode, this.mut_units);
        this.world.plants.forEach(function(plant){
            mutator.mutate(plant.genome);
        }, this);
    }

    /**
     * Use each plant's current death probability to simulate
     * whether each plant dies on this step
     */
    simulateDeath(){
        var dead_plants = [];
        this.world.plants.forEach(function(plant){
            var deathProb = plant.getDeathProbability(
                this.params.death_factor,
                this.params.natural_exp,
                this.params.energy_exp,
                this.params.leanover_factor
            );
            if ((0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomProb)(deathProb.prob)){
                dead_plants.push(plant);
            }
        }, this);
        dead_plants.forEach(function(plant){
            this.world.killPlant(plant);
        }, this);
    }

    /**
     * Simulate light. Sunlight traverses from the ceiling of the world
     * downwards vertically. It is caught by a plant cell with a probability
     * which causes that cell to be energised.
     */
    simulateLight(){
        for(var x=0; x<this.world.width; x++){
            for(var y=0; y<this.world.height; y++){
                var cell = this.world.cells[x][this.world.height-y-1];
                if(cell !== null){
                    if((0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomProb)(this.params.energy_prob)){
                        cell.energised = true;
                        break;
                    }
                }
            }
        }
    }
}



/***/ },

/***/ "./src/simulation.worker.js"
/*!**********************************!*\
  !*** ./src/simulation.worker.js ***!
  \**********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _simulation_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./simulation.js */ "./src/simulation.js");
/* harmony import */ var _simdata_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./simdata.js */ "./src/simdata.js");



let simulation = null;
let data = null;
let running = false;
let cellSize = 8;
const TARGET_FPS = 60;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
let lastFrameTime = 0;

self.onmessage = function(event) {
    const msg = event.data;
    switch (msg.type) {
    case "init":
        initSim(msg.params);
        break;
    case "start":
        running = true;
        loop();
        break;
    case "stop":
        running = false;
        break;
    case "step":
        doStep();
        pushFrame();
        break;
    case "getCell":
        sendCellInfo(msg.x, msg.y);
        break;
    case "disturb":
        applyDisturbance(msg.strength);
        pushFrame();
        break;
    case "killCell":
        killCellAt(msg.x, msg.y);
        pushFrame();
        break;
    case "updateDisplayParams":
        if (simulation && simulation.params) {
            simulation.params.steps_per_frame = msg.steps_per_frame;
            simulation.params.record_interval = msg.record_interval;
        }
        break;
    }
};

function initSim(params) {
    running = false;
    const sim_params = new _simulation_js__WEBPACK_IMPORTED_MODULE_0__.SimulationParams(params);
    cellSize = params.cellSize || 8;
    simulation = new _simulation_js__WEBPACK_IMPORTED_MODULE_0__.Simulation(sim_params);
    data = new _simdata_js__WEBPACK_IMPORTED_MODULE_1__.SimData(simulation);
    simulation.init_population();
    pushFrame();
}

function loop() {
    if (!running) return;

    const spf = simulation.params.steps_per_frame;
    for (let i = 0; i < spf; i++) {
        doStep();
    }

    const now = Date.now();
    if (now - lastFrameTime >= FRAME_INTERVAL_MS) {
        pushFrame();
        lastFrameTime = now;
    }

    setTimeout(loop, 0);
}

function doStep() {
    simulation.step();

    // Periodic disturbance
    const di = simulation.params.disturbance_interval;
    if (di > 0 && simulation.stepnum % di === 0) {
        applyDisturbance(simulation.params.disturbance_strength);
    }

    if (simulation.stepnum % simulation.params.record_interval === 0 || simulation.stepnum === 1) {
        data.recordStep();
        self.postMessage({
            type: "stats",
            data: JSON.parse(JSON.stringify(data.data)),
            stepnum: simulation.stepnum
        });
    }
}

function applyDisturbance(strength) {
    const world = simulation.world;
    const plants = world.plants;
    if (plants.length === 0) return;
    const numToKill = Math.max(1, Math.floor(strength * plants.length));
    // Shuffle a sample and kill
    const shuffled = plants.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < numToKill && i < shuffled.length; i++) {
        // Check plant still alive (not killed by previous iteration)
        if (world.plants.includes(shuffled[i])) {
            world.killPlant(shuffled[i]);
        }
    }
}

function killCellAt(x, y) {
    const cell = simulation.world.getCell(x, y);
    if (cell && cell.plant) {
        simulation.world.killPlant(cell.plant);
    }
}

function pushFrame() {
    const result = simulation.world.getPixelBuffer(cellSize);
    // Transfer ownership of the ArrayBuffer for zero-copy performance
    self.postMessage({
        type: "frame",
        buffer: result.buffer.buffer,
        width: result.width,
        height: result.height,
        cellCount: result.cellCount,
        stepnum: simulation.stepnum
    }, [result.buffer.buffer]);
}

function sendCellInfo(x, y) {
    const cell = simulation.world.getCell(x, y);
    if (!cell || !cell.plant || !cell.plant.genome) {
        self.postMessage({ type: "cellInfo", found: false });
        return;
    }
    try {
        const plant = cell.plant;
        const rules = simulation.genomeInterpreter.interpret(plant.genome);
        const neighbourhood = plant.getNeighbourhood(cell);
        let matching_rule = "None";
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].state === neighbourhood) {
                matching_rule = `#${i} ${rules[i]}`;
            }
        }
        const death = plant.getDeathProbability(
            simulation.params.death_factor,
            simulation.params.natural_exp,
            simulation.params.energy_exp,
            simulation.params.leanover_factor
        );
        self.postMessage({
            type: "cellInfo",
            found: true,
            cellStr: cell.toString(),
            neighbourhood,
            matching_rule,
            death: JSON.stringify(death),
            genomeLength: plant.genome.length,
            mutExp: plant.genome.mut_exp,
            rules: rules.map(r => r.toString())
        });
    } catch (e) {
        self.postMessage({ type: "cellInfo", found: false, error: e.message });
    }
}


/***/ },

/***/ "./src/world.js"
/*!**********************!*\
  !*** ./src/world.js ***!
  \**********************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   World: () => (/* binding */ World)
/* harmony export */ });
/* harmony import */ var _random_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./random.js */ "./src/random.js");
/* harmony import */ var _plant_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./plant.js */ "./src/plant.js");
/* harmony import */ var _cell_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./cell.js */ "./src/cell.js");




class World {
    constructor(width, height){
        this.width = width;
        this.height = height;

        this.cells = [];
        // initialise the world lattice to all nulls
        for(var i=0; i<this.width; i++){
            this.cells.push([]);
            for(var j=0; j<this.height; j++){
                this.cells[i][j] = null;
            }
        }

        this.plants = [];
    }

    /**
     * @returns array of x positions at y=0 where no cell exists
     */
    getFloorSpace(){
        var emptySpaces = [];
        for(var i=0; i<this.width; i++){
            if(this.cells[i][0] === null){
                emptySpaces.push(i);
            }
        }
        return emptySpaces;
    }

    /**
     * Strategies for sowing a seed on the world floor
     * @param {*} genome the genome used by the new seed
     * @param {*} nearX if not null, try to sow a seed as close
     * as possible to this location
     * 
     * @return true if a seed was succesfully planted, false if
     * there was no space to sow a seed.
     */
    seed(genome, nearX){
        // find a random empty space
        var emptySpaces = this.getFloorSpace();
        if(emptySpaces.length === 0){
            return false;
        }

        if(nearX !== undefined){
            var nearestX = null;
            var nearest_diff = this.width;
            emptySpaces.forEach(function(xpos){
                var diff = Math.abs(nearX-xpos);
                if(diff < nearest_diff){
                    nearest_diff = diff;
                    nearestX = xpos;
                }
            });
            this.sowPlant(genome, nearestX);
            return true;
        }

        var x = emptySpaces[(0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, emptySpaces.length-1)];
        if (this.cells[x][0] !== null){
            throw new Error("Space is taken");
        }
        this.sowPlant(genome, x);
        return true;
    }

    sowPlant(genome, x){
        x = this.getX(x);
        var plant = new _plant_js__WEBPACK_IMPORTED_MODULE_1__.Plant(x, this, genome);
        this.plants.push(plant);
        this.addCell(plant.cells[0]);
    }

    /**
     * Remove plant from world plant list.
     * Remove all cells from cell grid
     */
    killPlant(plant){
        this.plants.splice(this.plants.indexOf(plant), 1);
        plant.cells.forEach(function(cell){
            this.cells[cell.x][cell.y] = null;
        }, this);
    }

    getX(x){
        if(x < 0){
            x = this.width + x;
        }
        return x % this.width;
    }

    getCell(x, y){
        return this.cells[this.getX(x)][y];
    }

    addCell(cell){
        if (this.cells[cell.x][cell.y] !== undefined) {
            this.cells[cell.x][cell.y] = cell;
        }
    }

    getPixelBuffer(cellSize){
        const w = this.width * cellSize;
        const h = this.height * cellSize;
        const buf = new Uint8ClampedArray(w * h * 4); // RGBA, initialized to 0 (transparent/black)

        this.plants.forEach(function(plant){
            const [baseR, baseG, baseB] = this.getBaseColour(plant);
            plant.cells.forEach(function(cell){
                const col = cell.energised
                    ? [baseR, baseG, baseB]
                    : [Math.round(baseR * 0.7), Math.round(baseG * 0.7), Math.round(baseB * 0.7)];

                const px0 = cell.x * cellSize;
                // world y=0 is ground (bottom), canvas y=0 is top
                const py0 = (this.height - 1 - cell.y) * cellSize;

                for (let dy = 0; dy < cellSize; dy++) {
                    for (let dx = 0; dx < cellSize; dx++) {
                        // Draw 1px border: darken edge pixels
                        const isBorder = dx === 0 || dy === 0 || dx === cellSize - 1 || dy === cellSize - 1;
                        const [r, g, b] = isBorder
                            ? [Math.round(col[0] * 0.5), Math.round(col[1] * 0.5), Math.round(col[2] * 0.5)]
                            : col;
                        const idx = ((py0 + dy) * w + (px0 + dx)) * 4;
                        buf[idx]     = r;
                        buf[idx + 1] = g;
                        buf[idx + 2] = b;
                        buf[idx + 3] = 255;
                    }
                }
            }, this);
        }, this);

        return { buffer: buf, width: w, height: h, cellCount: this.plants.reduce((s,p)=>s+p.cells.length,0) };
    }

    getBaseColour(plant){
        var i = plant.cells[0].x % cScale.length;
        return cScale[i];
    }
}

// http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=8 — as raw [R,G,B] tuples
var cScale = [
    [141,211,199],[255,255,179],[190,186,218],[251,128,114],
    [128,177,211],[253,180,98],[179,222,105],[252,205,229]
];




/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_seedrandom_index_js-node_modules_stats-lite_stats_js"], () => (__webpack_require__("./src/simulation.worker.js")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd define */
/******/ 	(() => {
/******/ 		__webpack_require__.amdD = function () {
/******/ 			throw new Error('define cannot be used indirect');
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/amd options */
/******/ 	(() => {
/******/ 		__webpack_require__.amdO = {};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and chunks that the entrypoint depends on
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".bundle.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"src_simulation_worker_js": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunklindevol"] = self["webpackChunklindevol"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			return __webpack_require__.e("vendors-node_modules_seedrandom_index_js-node_modules_stats-lite_stats_js").then(next);
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ozs7O1dDSkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxHQUFHO1dBQ0g7V0FDQTtXQUNBLENBQUMsSTs7Ozs7V0NQRCx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0QsRTs7Ozs7V0NOQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1dDSkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esa0M7Ozs7O1dDbEJBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxhQUFhO1dBQ2I7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBOztXQUVBOztXQUVBLGtCOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztVRUhBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9saW5kZXZvbC9pZ25vcmVkfC9Vc2Vycy9tYXR0L2xpbmRldm9sLWpzL25vZGVfbW9kdWxlcy9zZWVkcmFuZG9tfGNyeXB0byIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9hY3Rpb25zLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2NlbGwuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvZ2Vub21lLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3BsYW50LmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3JhbmRvbS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW1kYXRhLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvd29ybGQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBkZWZpbmUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBvcHRpb25zIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9ub2RlIG1vZHVsZSBkZWNvcmF0b3IiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3B1YmxpY1BhdGgiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2ltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvc3RhcnR1cCBjaHVuayBkZXBlbmRlbmNpZXMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIChpZ25vcmVkKSAqLyIsImNvbnN0IE5FSUdIQk9VUkhPT0QgPSBbWy0xLC0xXSwgWzAsLTFdLCBbMSwtMV0sIFstMSwwXSwgWzEsMF0sIFstMSwxXSwgWzAsMV0sIFsxLDFdXTtcbmNvbnN0IE1VVF9JTkNSRU1FTlQgPSAwLjAwMTtcblxuY2xhc3MgQWN0aW9ue1xuICAgIGNvbnN0cnVjdG9yKGFjdGlvbkNvZGUpe1xuICAgICAgICB0aGlzLmNvZGUgPSBhY3Rpb25Db2RlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZXhlY3V0ZShjZWxsKXtcbiAgICAgICAgLy8gYWN0aW9ucyBhcmUgdHlwaWNhbGx5IG9ubHkgY2FycmllZCBvdXQgaWYgdGhlIGNlbGwgaGFzIGVuZXJneVxuICAgICAgICAvLyBhbmQgdGhlIGNlbGwgbG9zZXMgZW5lcmd5IGFzIGEgcmVzdWx0LlxuICAgICAgICBpZiAoY2VsbC5lbmVyZ2lzZWQpe1xuICAgICAgICAgICAgdmFyIHN1Y2Nlc3MgPSB0aGlzLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICAgICAgY2VsbC5lbmVyZ2lzZWQgPSAhc3VjY2VzcztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBkb0FjdGlvbihjZWxsKXtcblxuICAgIH1cbn1cblxuY2xhc3MgRGl2aWRlIGV4dGVuZHMgQWN0aW9ue1xuXG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIC8vIHRoZSAyIGxlYXN0IHNpZ25pZmljYW50IGJpdHMgb2YgdGhlIGFjdGlvbiBjb2RlXG4gICAgICAgIC8vIGRldGVybWluZXMgd2hpY2ggZGlyZWN0aW9uIHRoZSBkaXZpZGUgYWN0aW9uIGlzIGZvclxuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgZ2V0RGlyZWN0aW9uKCl7XG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIGNvcnJlY3QgYml0c1xuICAgICAgICAvLyAmIHdpdGggMDAwMDAxMTEgdG8gbWFzayBvdXQgbGVhc3Qgc2lnIGJpdHNcbiAgICAgICAgdmFyIGRpcmVjdGlvbkNvZGUgPSB0aGlzLmNvZGUgJiA3O1xuICAgICAgICByZXR1cm4gTkVJR0hCT1VSSE9PRFtkaXJlY3Rpb25Db2RlXTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYGRpdmlkZSAke3RoaXMuZ2V0RGlyZWN0aW9uKCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIE11dGF0ZVBsdXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwICs9IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dCtcIjtcbiAgICB9XG59XG5cbmNsYXNzIE11dGF0ZU1pbnVzIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgY2VsbC5wbGFudC5nZW5vbWUubXV0X2V4cCAtPSBNVVRfSU5DUkVNRU5UO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJtdXQtXCI7XG4gICAgfVxufVxuXG5jbGFzcyBGbHlpbmdTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCkpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcImZseWluZ3NlZWRcIjtcbiAgICB9XG59XG5cbmNsYXNzIExvY2FsU2VlZCBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIHJldHVybiBjZWxsLnBsYW50LndvcmxkLnNlZWQoY2VsbC5wbGFudC5nZW5vbWUuY29weSgpLCBjZWxsLngpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcImxvY2Fsc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgU3RhdGVCaXROIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpIHtcbiAgICAgICAgY2VsbC5uZXh0SW50ZXJuYWxTdGF0ZSA9IGNlbGwubmV4dEludGVybmFsU3RhdGUgJiBNYXRoLnBvdygyLCB0aGlzLmdldE50aEJpdCgpKTtcbiAgICAgICAgLy8gdGhpcyBhY3Rpb24gZG9lcyBub3QgY29uc3VtZSBlbmVyZ3lcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGdldE50aEJpdCgpe1xuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcbiAgICAgICAgLy8gJiB3aXRoIDAwMDAxMTExIHRvIG1hc2sgb3V0IGxlYXN0IHNpZyBiaXRzXG4gICAgICAgIHJldHVybiB0aGlzLmNvZGUgJiAxNTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYFN0YXRlQml0ICR7dGhpcy5nZXROdGhCaXQoKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgQWN0aW9uTWFwIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBtYXBwaW5nO1xuICAgICAgICB0aGlzLmFjdGlvbnMgPSBbRGl2aWRlLCBGbHlpbmdTZWVkLCBMb2NhbFNlZWQsIE11dGF0ZVBsdXMsIE11dGF0ZU1pbnVzLCBTdGF0ZUJpdE5dO1xuICAgIH1cblxuICAgIGdldEFjdGlvbihhY3Rpb25Db2RlKXtcbiAgICAgICAgdmFyIG1hcHBpbmdDb3VudCA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubWFwcGluZy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBtYXBwaW5nQ291bnQgKz0gdGhpcy5tYXBwaW5nW2ldO1xuICAgICAgICAgICAgaWYgKGFjdGlvbkNvZGUgPCBtYXBwaW5nQ291bnQpe1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5hY3Rpb25zW2ldKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRocm93IGBBY3Rpb24gY29kZSAke2FjdGlvbkNvZGV9IGRvZXMgbm90IG1hcCB0byBhbiBhY3Rpb25gO1xuICAgIH1cblxufVxuXG5leHBvcnQge0RpdmlkZSwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIExvY2FsU2VlZCwgRmx5aW5nU2VlZCwgQWN0aW9uTWFwLCBORUlHSEJPVVJIT09EfTsiLCJcbmNsYXNzIENlbGx7XG4gICAgY29uc3RydWN0b3IocGxhbnQsIHgsIHkpe1xuICAgICAgICB0aGlzLnBsYW50ID0gcGxhbnQ7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMuX2VuZXJnaXNlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmludGVybmFsU3RhdGUgPSAwO1xuICAgICAgICB0aGlzLm5leHRJbnRlcm5hbFN0YXRlID0gMDtcbiAgICB9XG5cbiAgICBnZXQgZW5lcmdpc2VkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5lcmdpc2VkO1xuICAgIH1cblxuICAgIHNldCBlbmVyZ2lzZWQodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2VuZXJnaXNlZCA9PT0gdmFsdWUpIHJldHVybjtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLnBsYW50KSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYW50LmVuZXJnaXNlZENvdW50Kys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVN0YXRlKCl7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IHRoaXMubmV4dEludGVybmFsU3RhdGU7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGRyYXcoY3R4LCB4LCB5LCBzaXplLCBjb2xvdXIpe1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gY29sb3VyO1xuICAgICAgICBjdHguZmlsbFJlY3QoeCwgeSwgc2l6ZSwgc2l6ZSk7XG4gICAgICAgIC8vY3R4LnN0cm9rZVJlY3QoeCwgeSwgc2l6ZSwgc2l6ZSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBDZWxsIGF0ICgke3RoaXMueH0sICR7dGhpcy55fSkgZW5lcmd5OiAke3RoaXMuZW5lcmdpc2VkfWA7XG4gICAgfVxufVxuXG5leHBvcnQge0NlbGx9OyIsImltcG9ydCB7cmFuZG9tSW50LCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7QWN0aW9uTWFwfSBmcm9tIFwiLi9hY3Rpb25zLmpzXCI7XG5cbmNsYXNzIEJ5dGVBcnJheSBleHRlbmRzIEFycmF5e1xuXG4gICAgY29uc3RydWN0b3IobGVuZ3RoPTAsIGluaXRpYWxfbXV0X2V4cD0wKXtcbiAgICAgICAgc3VwZXIobGVuZ3RoKTtcbiAgICAgICAgdGhpcy5tdXRfZXhwID0gaW5pdGlhbF9tdXRfZXhwO1xuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tKGFycil7XG4gICAgICAgIHZhciBiYSA9IG5ldyBCeXRlQXJyYXkoYXJyLmxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSBhcnJbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhO1xuICAgIH1cblxuICAgIHN0YXRpYyByYW5kb20obGVuZ3RoKXtcbiAgICAgICAgdmFyIGJhID0gbmV3IEJ5dGVBcnJheShsZW5ndGgpO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gcmFuZG9tSW50KDAsIDI1NSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhO1xuICAgIH1cblxuICAgIGNvcHkoKXtcbiAgICAgICAgdmFyIG5ld0FyciA9IG5ldyBCeXRlQXJyYXkodGhpcy5sZW5ndGgsIHRoaXMuaW5pdGlhbF9tdXRfZXhwKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBuZXdBcnJbaV0gPSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdBcnI7XG4gICAgfVxuXG59XG5cbmNsYXNzIE11dGF0b3J7XG4gICAgY29uc3RydWN0b3IocHJvYiwgcHJvYl9yZXBsYWNlbWVudCwgcHJvYl9pbnNlcnRpb24sIHByb2JfZGVsZXRpb24sIHByb2JfZHVwLCByZXBsYWNlbWVudF9tb2RlLCB1bml0cyl7XG4gICAgICAgIHRoaXMucHJvYiA9IHByb2I7XG4gICAgICAgIHRoaXMucFIgPSBwcm9iX3JlcGxhY2VtZW50O1xuICAgICAgICB0aGlzLnBJID0gcHJvYl9pbnNlcnRpb247XG4gICAgICAgIHRoaXMucEQgPSBwcm9iX2RlbGV0aW9uO1xuICAgICAgICB0aGlzLnBEdXAgPSBwcm9iX2R1cDtcbiAgICAgICAgdGhpcy5wUm1vZGUgPSByZXBsYWNlbWVudF9tb2RlOyAgXG4gICAgICAgIHRoaXMudW5pdHMgPSB1bml0cztcbiAgICB9XG5cbiAgICBtdXRhdGUoZ2Vub21lKXtcbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBSLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlKGdlbm9tZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBJLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5pbnNlcnQoZ2Vub21lKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEQsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShnZW5vbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbVByb2IocCwgZXhwKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbVByb2IocCAqIE1hdGgucG93KCB0aGlzLnByb2IsIGV4cCkpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBzd2l0Y2godGhpcy5wUm1vZGUpe1xuICAgICAgICBjYXNlIFwiYnl0ZXdpc2VcIjpcbiAgICAgICAgICAgIGdlbm9tZVtpXSA9IHRoaXMucmFuZG9tQ2hhcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJiaXR3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSBnZW5vbWVbaV0gXiBNYXRoLnBvdygyLCByYW5kb21JbnQoMCwgNykpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbXV0YXRpb24gcmVwbGFjZW1lbnQgbW9kZTogJHt0aGlzLnBSbW9kZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBpbnNlcnQoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAwLCB0aGlzLnJhbmRvbUNoYXIoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZWxldGUoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJhbmRvbUNoYXIoKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCAyNTUpO1xuICAgIH1cblxuICAgIHJhbmRvbVBvcyhnZW5vbWUpe1xuICAgICAgICByZXR1cm4gcmFuZG9tSW50KDAsIGdlbm9tZS5sZW5ndGgtMSk7XG4gICAgfVxufVxuXG5cblxuY2xhc3MgUnVsZSB7XG4gICAgY29uc3RydWN0b3IoZXFNYXNrLCBzdGF0ZSwgYWN0aW9uKXtcbiAgICAgICAgdGhpcy5lcU1hc2sgPSBlcU1hc2s7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBhY3Rpb247XG4gICAgfVxuXG4gICAgbWF0Y2hlcyhzdGF0ZSl7XG4gICAgICAgIHZhciBlcVN0YXRlID0gc3RhdGUgJiB0aGlzLmVxTWFzaztcbiAgICAgICAgcmV0dXJuIGVxU3RhdGUgPT09IHRoaXMuc3RhdGU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuc3RhdGV9IC0+ICR7dGhpcy5hY3Rpb259YDtcbiAgICB9XG59XG5cbmNsYXNzIEdlbm9tZUludGVycHJldGVye1xuICAgIC8qKlxuICAgICAqIE1ldGhvZHMgdGhhdCBkZWNvZGUgZ2Vub21lcyBpbnRvIHJ1bGVzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWFwcGluZyl7XG4gICAgICAgIHRoaXMubWFwcGluZyA9IG5ldyBBY3Rpb25NYXAobWFwcGluZyk7XG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuXG4gICAgfVxufVxuXG5jbGFzcyBCbG9ja0ludGVycHJldGVyIGV4dGVuZHMgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG4gICAgICAgIHZhciBydWxlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrPTIpe1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMubWFwcGluZy5nZXRBY3Rpb24oYnl0ZWFycmF5W2krMV0pO1xuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZSgyNTUsIGJ5dGVhcnJheVtpXSwgYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ1bGVzO1xuICAgIH1cbn1cblxuY2xhc3MgUHJvbW90b3JJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgdmFyIGdlbmVzID0gW107XG4gICAgICAgIHZhciBnZW5lID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgYnl0ZWFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjID0gYnl0ZWFycmF5W2ldO1xuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDYpID09PSBiaXRTZXQoYywgNykpe1xuICAgICAgICAgICAgICAgIC8vIG9wZXJhdG9yXG4gICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihiaXRTZXQoYywgNykpe1xuICAgICAgICAgICAgICAgIC8vIHByb21vdG9yXG4gICAgICAgICAgICAgICAgZ2VuZSA9IFtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgaWYoYml0U2V0KGMsIDYpKXtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGVybWluYXRvclxuICAgICAgICAgICAgICAgICAgICBpZihnZW5lLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVzLnB1c2goZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lID0gW107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBnZW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGdlbmUpe1xuICAgICAgICAgICAgLy8gZXh0cmFjdCA2IGxlYXN0IHNpZyBiaXRzIGZyb20gdGVybWluYXRvciBhcyB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgICAgIHZhciBhY3Rpb25Db2RlID0gZ2VuZVtnZW5lLmxlbmd0aC0xXSAmIChNYXRoLnBvdygyLCA2KSAtIDEpO1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMubWFwcGluZy5nZXRBY3Rpb24oYWN0aW9uQ29kZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHRha2UgaW5mb3JtYXRpb24gZnJvbSBvcGVyYXRvcnMgdG8gY3JlYXRlIHN0YXRlIG1hc2tcbiAgICAgICAgICAgIHZhciBtYXNrID0gMDtcbiAgICAgICAgICAgIHZhciBlcU1hc2sgPSAwOyAvLyBzcGVjaWZpZWQgd2hpY2ggYml0cyBjb250cmlidXRlIHRvIHRoZSBzdGF0ZSBtYXNrXG4gICAgICAgICAgICBmb3IodmFyIGk9MTsgaTxnZW5lLmxlbmd0aC0xOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyA0IGxlYXN0IHNpZyBiaXRzIGRldGVybWluZSB0aGUgbWFzayBpbmRleFxuICAgICAgICAgICAgICAgIHZhciBtYXNrQml0ID0gZ2VuZVtpXSAmIChNYXRoLnBvdygyLCA0KSAtIDEpO1xuXG4gICAgICAgICAgICAgICAgLy8gZGV0ZXJtaW5lcyBpZiB0aGUgbWFzayBhdCB0aGlzIGluZGV4IGlzIHNldCB0byAxIG9yIDBcbiAgICAgICAgICAgICAgICB2YXIgYml0U3RhdGUgPSAoZ2VuZVtpXSAmIE1hdGgucG93KDIsIDQpKSA+PiA0O1xuICAgICAgICAgICAgICAgIG1hc2sgKz0gTWF0aC5wb3coMiwgbWFza0JpdCkqYml0U3RhdGU7XG5cbiAgICAgICAgICAgICAgICBlcU1hc2sgKz0gTWF0aC5wb3coMiwgbWFza0JpdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydWxlcy5wdXNoKG5ldyBSdWxlKGVxTWFzaywgbWFzaywgYWN0aW9uKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gcnVsZXM7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBiaXRTZXQoYnl0ZSwgaSl7XG4gICAgcmV0dXJuIChieXRlICYgTWF0aC5wb3coMiwgaSkpID4+IGk7XG59XG5cbmV4cG9ydCB7Qnl0ZUFycmF5LCBCbG9ja0ludGVycHJldGVyLCBQcm9tb3RvckludGVycHJldGVyLCBNdXRhdG9yfTsiLCJpbXBvcnQge3JhbmRvbUludCwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge0NlbGx9IGZyb20gXCIuL2NlbGwuanNcIjtcbmltcG9ydCB7TkVJR0hCT1VSSE9PRH0gZnJvbSBcIi4vYWN0aW9ucy5qc1wiO1xuXG5jbGFzcyBQbGFudHtcbiAgICBjb25zdHJ1Y3Rvcih4LCB3b3JsZCwgZ2Vub21lLCB1c2VJbnRlcm5hbFN0YXRlPWZhbHNlKSB7XG4gICAgICAgIHRoaXMud29ybGQgPSB3b3JsZDtcbiAgICAgICAgdGhpcy5lbmVyZ2lzZWRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuY2VsbHMgPSBbbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCAwKV07XG4gICAgICAgIHRoaXMuZ2Vub21lID0gZ2Vub21lO1xuICAgICAgICB0aGlzLnVzZUludGVybmFsU3RhdGUgPSB1c2VJbnRlcm5hbFN0YXRlO1xuICAgIH1cblxuICAgIGdldE5laWdoYm91cmhvb2QoY2VsbCl7XG4gICAgICAgIC8vIFJldHVybiB0aGUgbmVpZ2hib3VyaG9vZCBtYXNrXG4gICAgICAgIHZhciBtYXNrID0gMDtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8TkVJR0hCT1VSSE9PRC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgcG9zID0gTkVJR0hCT1VSSE9PRFtpXTtcbiAgICAgICAgICAgIHZhciB4ID0gY2VsbC54ICsgcG9zWzBdO1xuICAgICAgICAgICAgdmFyIHkgPSBjZWxsLnkgKyBwb3NbMV07XG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgdmFyIHdvcmxkUG9zID0gdGhpcy53b3JsZC5jZWxsc1t4XVt5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoKGVycm9yKXtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3b3JsZFBvcyBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgICAgIG1hc2sgPSBtYXNrIHwgTWF0aC5wb3coMiwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hc2s7XG4gICAgfVxuXG4gICAgZ2V0U3RhdGUoY2VsbCl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldE5laWdoYm91cmhvb2QoY2VsbCkgfCBjZWxsLmludGVybmFsU3RhdGUgfCAoTWF0aC5wb3coMiwgMTUpICogKCBjZWxsLmVuZXJnaXNlZCA/IDEgOiAwKSk7XG4gICAgfVxuXG4gICAgZ3Jvdygpe1xuICAgICAgICB0aGlzLmNlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCl7XG4gICAgICAgICAgICAvLyA1MCUgY2hhbmNlIHRvIGdyb3dcbiAgICAgICAgICAgIGlmKHJhbmRvbVByb2IoMC44KSl7XG4gICAgICAgICAgICAgICAgdmFyIHNwYWNlcyA9IHRoaXMuZ2V0R3Jvd0RpcmVjdGlvbihjZWxsKTtcbiAgICAgICAgICAgICAgICBpZihzcGFjZXMubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSBzcGFjZXNbcmFuZG9tSW50KDAsIHNwYWNlcy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHcm93IHRoZSBwbGFudCBieSBvbmUgY2VsbCBpZiBwb3NzaWJsZVxuICAgICAqIEBwYXJhbSB7Kn0gY2VsbCB0aGUgY2VsbCB0byBncm93IGZyb21cbiAgICAgKiBAcGFyYW0geyp9IGRpcmVjdGlvbiB0aGUgZGlyZWN0aW9uIHRvIGdyb3cgaW5cbiAgICAgKi9cbiAgICBncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKXtcbiAgICAgICAgdmFyIHggPSBjZWxsLngrZGlyZWN0aW9uWzBdLCB5ID0gY2VsbC55K2RpcmVjdGlvblsxXTtcbiAgICAgICAgLy8gY2hlY2sgaWYgc3BhY2UgaXMgY2xlYXJcbiAgICAgICAgdmFyIHNwYWNlID0gdGhpcy53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgICAgICBpZiAoc3BhY2UgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNwYWNlIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICBpZiAoc3BhY2UucGxhbnQgPT09IHRoaXMpe1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRoaXMgcGxhbnQgd2lsbCBraWxsIHRoZSBvdGhlclxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb2JhYmlsaXR5Li4uXG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKHNwYWNlLnBsYW50LmdldEtpbGxQcm9iYWJpbGl0eSgpKSl7XG4gICAgICAgICAgICAgICAgLy8gYXR0YWNrIHN1Y2NlZWRlZC4gS2lsbCBjb21wZXRpdG9yIGFuZCBjb250aW51ZSB3aXRoIGdyb3d0aFxuICAgICAgICAgICAgICAgIHRoaXMud29ybGQua2lsbFBsYW50KHNwYWNlLnBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBmYWlsZWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICAvLyBncm93IGNlbGwgaW4gdG8gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIG5ld19jZWxsID0gbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCB5KTtcbiAgICAgICAgdGhpcy5jZWxscy5wdXNoKG5ld19jZWxsKTtcbiAgICAgICAgdGhpcy53b3JsZC5hZGRDZWxsKG5ld19jZWxsKTtcbiAgICB9XG5cbiAgICBnZXRLaWxsUHJvYmFiaWxpdHkoKXtcbiAgICAgICAgcmV0dXJuIDEvdGhpcy5lbmVyZ2lzZWRDb3VudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgd2hldGhlciB0aGlzIHBsYW50IHNob3VsZCBkaWUuXG4gICAgICogQHBhcmFtIHt9IG5hdHVyYWxfZXhwIGV4cG9uZW50IHRvIHRoZSBudW1iZXIgb2YgY2VsbHNcbiAgICAgKiBAcGFyYW0geyp9IGVuZXJneV9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBlbmVyZ3kgcmljaCBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gbGVhbm92ZXJfZmFjdG9yIGZhY3RvciB0byB0aGUgbGVhbm92ZXIgdGVybVxuICAgICAqL1xuICAgIGdldERlYXRoUHJvYmFiaWxpdHkoZGVhdGhfZmFjdG9yLCBuYXR1cmFsX2V4cCwgZW5lcmd5X2V4cCwgbGVhbm92ZXJfZmFjdG9yKXtcbiAgICAgICAgdmFyIG51bUNlbGxzID0gdGhpcy5jZWxscy5sZW5ndGg7XG4gICAgICAgIHZhciBsZWFub3ZlckVuZXJnaXNlZCA9IDA7XG4gICAgICAgIHZhciByb290Q2VsbCA9IHRoaXMuY2VsbHNbMF07XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMuY2VsbHMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgICAgICAgICAgdmFyIGxlID0gdGhpcy53b3JsZC53aWR0aC8yIC0gKCAoKCAxLjUqdGhpcy53b3JsZC53aWR0aCApICsgY2VsbC54IC0gcm9vdENlbGwueCkgICUgdGhpcy53b3JsZC53aWR0aCk7XG4gICAgICAgICAgICBsZWFub3ZlckVuZXJnaXNlZCArPSBsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWFub3ZlckNlbGxzID0gMi8obnVtQ2VsbHMqKG51bUNlbGxzLTEpKTtcbiAgICAgICAgaWYgKGxlYW5vdmVyQ2VsbHMgPT09IEluZmluaXR5KXtcbiAgICAgICAgICAgIGxlYW5vdmVyQ2VsbHMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYW5vdmVyVGVybSA9IGxlYW5vdmVyQ2VsbHMqTWF0aC5hYnMobGVhbm92ZXJFbmVyZ2lzZWQpO1xuICAgICAgICBcbiAgICAgICAgdmFyIGRfbmF0dXJhbCA9IE1hdGgucG93KG51bUNlbGxzLCBuYXR1cmFsX2V4cCk7XG4gICAgICAgIHZhciBkX2VuZXJneSA9IE1hdGgucG93KHRoaXMuZW5lcmdpc2VkQ291bnQrMSwgZW5lcmd5X2V4cCk7XG4gICAgICAgIHZhciBkX2xlYW5vdmVyID0gbGVhbm92ZXJfZmFjdG9yKmxlYW5vdmVyVGVybTtcbiAgICAgICAgdmFyIHBEZWF0aCA9IGRlYXRoX2ZhY3RvciAqIGRfbmF0dXJhbCAqIGRfZW5lcmd5ICsgZF9sZWFub3ZlcjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwicHJvYlwiOiBwRGVhdGgsXG4gICAgICAgICAgICBcIm5hdHVyYWxcIjogZF9uYXR1cmFsLFxuICAgICAgICAgICAgXCJlbmVyZ3lcIjogZF9lbmVyZ3ksXG4gICAgICAgICAgICBcImxlYW5vdmVyXCI6IGRfbGVhbm92ZXJcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFBsYW50IH07IiwiaW1wb3J0IHNlZWRyYW5kb20gZnJvbSBcInNlZWRyYW5kb21cIjtcblxuLyoqXG4gKiBTZWVkIGFsbCBmdXR1cmUgY2FsbHMgdG8gTWF0aC5yYW5kb21cbiAqIEBwYXJhbSB7Kn0gc2VlZCBkYXRhIHRvIHVzZSB0byBzZWVkIGFsbCBmdXR1cmUgUk5HIGNhbGxzXG4gKi9cbmZ1bmN0aW9uIHNlZWRSYW5kb20oc2VlZCl7XG4gICAgc2VlZHJhbmRvbShzZWVkLCB7Z2xvYmFsOiB0cnVlfSk7XG59XG5cbi8qKlxuICogcmV0dXJucyBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgbWF4IChpbmNsdXNpdmUpXG4gKiBAcGFyYW0geyp9IG1heCBtYXhpbXVtIGludGVnZXIgdG8gZ2VuZXJhdGUgYXMgYSByYW5kb20gbnVtYmVyXG4gKi9cbmZ1bmN0aW9uIHJhbmRvbUludChtaW4sIG1heCl7XG4gICAgLy8gbm90ZTogTWF0aC5yYW5kb20gcmV0dXJucyBhIHJhbmRvbSBudW1iZXIgZXhjbHVzaXZlIG9mIDEsXG4gICAgLy8gc28gdGhlcmUgaXMgKzEgaW4gdGhlIGJlbG93IGVxdWF0aW9uIHRvIGVuc3VyZSB0aGUgbWF4aW11bVxuICAgIC8vIG51bWJlciBpcyBjb25zaWRlcmVkIHdoZW4gZmxvb3JpbmcgMC45Li4uIHJlc3VsdHMuXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG59XG5cbi8qKlxuICogRXZhbHVhdGVzIHRoZSBjaGFuY2Ugb2YgYW4gZXZlbnQgaGFwcGVuaW5nIGdpdmVuIHByb2JcbiAqIEBwYXJhbSB7Kn0gcHJvYiBmcmFjdGlvbiBiZXR3ZWVuIDAgYW5kIDEgY2hhbmNlIG9mIHRoZSBldmVudCBoYXBwZW5pbmdcbiAqIEByZXR1cm5zIHRydWUgaWYgdGhlIGV2ZW50IGhhcHBlbnMsIGZhbHNlIGlmIG5vdFxuICovXG5mdW5jdGlvbiByYW5kb21Qcm9iKHByb2Ipe1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDw9IHByb2I7XG59XG5cbmV4cG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tSW50LCByYW5kb21Qcm9ifTsiLCJpbXBvcnQgKiBhcyBzdGF0cyBmcm9tIFwic3RhdHMtbGl0ZVwiO1xuXG5jbGFzcyBTaW1EYXRhe1xuXG4gICAgY29uc3RydWN0b3Ioc2ltdWxhdGlvbil7XG4gICAgICAgIHRoaXMuc2ltID0gc2ltdWxhdGlvbjtcbiAgICAgICAgdGhpcy5kYXRhID0ge1wic3RlcG51bVwiOiBbXX07XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycyA9IFtcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwb3B1bGF0aW9uXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidG90YWxfY2VsbHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgcC5jZWxscy5sZW5ndGgsIDApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZW5lcmdpc2VkX2NlbGxzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIHAuY2VsbHMuZmlsdGVyKGMgPT4gYy5lbmVyZ2lzZWQpLmxlbmd0aCwgMCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwbGFudF9zaXplX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmNlbGxzLmxlbmd0aCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJnZW5vbWVfc2l6ZV9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5nZW5vbWUubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcIm11dF9leHBfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLm11dF9leHApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicGxhbnRfaGVpZ2h0X1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCguLi5wLmNlbGxzLm1hcChjID0+IGMueSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb2xsZWN0IGRhdGEgZm9yIHRoZSBjdXJyZW50IHN0ZXBcbiAgICAgKi9cbiAgICByZWNvcmRTdGVwKCl7XG4gICAgICAgIHZhciBzdGVwRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMuZm9yRWFjaChmdW5jdGlvbihjKXtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBjLmNvbGxlY3QodGhpcy5zaW0pO1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihzdGVwRGF0YSwgdmFsdWVzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5wdXNoKHRoaXMuc2ltLnN0ZXBudW0pO1xuICAgICAgICBPYmplY3Qua2V5cyhzdGVwRGF0YSkuZm9yRWFjaChmdW5jdGlvbihrKXtcbiAgICAgICAgICAgIGlmICghKGsgaW4gdGhpcy5kYXRhKSl7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhW2tdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRhdGFba10ucHVzaChzdGVwRGF0YVtrXSk7IFxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG59XG5cbmNsYXNzIENvbGxlY3RvcntcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCB0eXBlY2xzLCBjb2xsZWN0RnVuYyl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMudHlwZSA9IG5ldyB0eXBlY2xzKG5hbWUpO1xuICAgICAgICB0aGlzLmZ1bmMgPSBjb2xsZWN0RnVuYztcbiAgICB9XG5cbiAgICBjb2xsZWN0KHNpbSl7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5mdW5jKHNpbSk7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUudHJhbnNmb3JtKGRhdGEpO1xuICAgIH1cbn1cblxuY2xhc3MgQ29sbGVjdG9yVHlwZXtcbiAgICBjb25zdHJ1Y3RvcihuYW1lKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmltcGxlbWVudGVkIG1ldGhvZFwiKTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm0oZGF0YSl7XG4gICAgICAgIHZhciB2YWx1ZXMgPSB0aGlzLnRyYW5zZm9ybURhdGEoZGF0YSk7XG4gICAgICAgIHZhciB0cmFuc2Zvcm1lZF9kYXRhID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKHZhbHVlcykuZm9yRWFjaChmdW5jdGlvbihrKXtcbiAgICAgICAgICAgIHRyYW5zZm9ybWVkX2RhdGFbdGhpcy5uYW1lICsga10gPSB2YWx1ZXNba107XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtZWRfZGF0YTtcbiAgICB9XG59XG5cbmNsYXNzIEFzSXMgZXh0ZW5kcyBDb2xsZWN0b3JUeXBlIHtcblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSl7XG4gICAgICAgIHJldHVybiB7XCJcIjogZGF0YX07XG4gICAgfVxufVxuXG5jbGFzcyBTdW1tYXJ5IGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICByZXR1cm4ge1wibWluXCI6IE1hdGgubWluKGRhdGEpLCBcIm1lYW5cIjogc3RhdHMubWVhbihkYXRhKSwgXCJtYXhcIjogTWF0aC5tYXgoZGF0YSl9O1xuICAgIH1cbn1cbmV4cG9ydCB7U2ltRGF0YX07IiwiaW1wb3J0IHtzZWVkUmFuZG9tLCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7V29ybGR9IGZyb20gXCIuL3dvcmxkLmpzXCI7XG5pbXBvcnQge0J5dGVBcnJheSwgQmxvY2tJbnRlcnByZXRlciwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn0gZnJvbSBcIi4vZ2Vub21lLmpzXCI7XG5cbmNsYXNzIFNpbXVsYXRpb25QYXJhbXN7XG4gICAgY29uc3RydWN0b3IocGFyYW1zPXt9KXtcbiAgICAgICAgdGhpcy5yYW5kb21fc2VlZCA9IDE7XG4gICAgICAgIHRoaXMucmVjb3JkX2ludGVydmFsID0gMTA7XG4gICAgICAgIHRoaXMuc3RlcHNfcGVyX2ZyYW1lID0gMTtcbiAgICAgICAgdGhpcy5kaXN0dXJiYW5jZV9pbnRlcnZhbCA9IDA7XG4gICAgICAgIHRoaXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGggPSAwLjE7XG5cbiAgICAgICAgdGhpcy53b3JsZF93aWR0aCA9IDI1MDtcbiAgICAgICAgdGhpcy53b3JsZF9oZWlnaHQgPSA0MDtcbiAgICAgICAgdGhpcy5pbml0aWFsX3BvcHVsYXRpb24gPSAyNTA7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVuZXJneV9wcm9iID0gMC41O1xuXG4gICAgICAgIC8vIGRlYXRoIHBhcmFtc1xuICAgICAgICB0aGlzLmRlYXRoX2ZhY3RvciA9IDAuMjtcbiAgICAgICAgdGhpcy5uYXR1cmFsX2V4cCA9IDA7XG4gICAgICAgIHRoaXMuZW5lcmd5X2V4cCA9IC0yLjU7XG4gICAgICAgIHRoaXMubGVhbm92ZXJfZmFjdG9yID0gMC4yO1xuXG4gICAgICAgIC8vIG11dGF0aW9uc1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlX21vZGUgPSBcImJ5dGV3aXNlXCI7XG4gICAgICAgIHRoaXMubXV0X3JlcGxhY2UgPSAwLjAwMjtcbiAgICAgICAgdGhpcy5tdXRfaW5zZXJ0ID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9kZWxldGUgPSAwLjAwMDQ7XG4gICAgICAgIHRoaXMubXV0X2ZhY3RvciA9IDEuNTtcbiAgICAgICAgdGhpcy5pbml0aWFsX211dF9leHAgPSAwO1xuXG4gICAgICAgIHRoaXMuZ2Vub21lX2ludGVycHJldGVyID0gXCJibG9ja1wiO1xuICAgICAgICB0aGlzLmluaXRpYWxfZ2Vub21lX2xlbmd0aCA9IDQwMDtcblxuICAgICAgICAvLyBkaXZpZGUsIGZseWluZ3NlZWQsIGxvY2Fsc2VlZCwgbXV0KywgbXV0LSwgc3RhdGViaXRcbiAgICAgICAgdGhpcy5hY3Rpb25fbWFwID0gWzIwMCwgMjAsIDAsIDE4LCAxOCwgMF07XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBwYXJhbXMpO1xuICAgIH1cbn1cblxuY2xhc3MgU2ltdWxhdGlvbiB7XG4gICAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgICAgIC8vIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byByYW5kb21cbiAgICAgICAgLy8gdGhpcyBtYWtlcyBvdXQgdGVzdHMgcmVwcm9kdWNpYmxlIGdpdmVuIHRoZSBzYW1lIHNlZWQgaXMgdXNlZFxuICAgICAgICAvLyBpbiBmdXR1cmUgaW5wdXQgcGFyYW1ldGVyc1xuICAgICAgICBzZWVkUmFuZG9tKHRoaXMucGFyYW1zLnJhbmRvbV9zZWVkKTtcblxuICAgICAgICB0aGlzLndvcmxkID0gbmV3IFdvcmxkKHRoaXMucGFyYW1zLndvcmxkX3dpZHRoLCB0aGlzLnBhcmFtcy53b3JsZF9oZWlnaHQpO1xuICAgICAgICB0aGlzLmdlbm9tZUludGVycHJldGVyID0gdGhpcy5nZXRJbnRlcnByZXRlcigpO1xuICAgICAgICB0aGlzLm11dF91bml0cyA9IDE7XG4gICAgICAgIC8vIGVuc3VyZSBtdXRhdGlvbiB1bml0cyBpcyBjb21wYXRpYmxlIHdpdGggdGhlIGludGVycHJldGVyIHR5cGVcbiAgICAgICAgaWYodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIEJsb2NrSW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgdGhpcy5tdXRfdW5pdHMgPSAyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RlcG51bSA9IDA7XG4gICAgfVxuXG4gICAgZ2V0SW50ZXJwcmV0ZXIoKXtcbiAgICAgICAgc3dpdGNoICh0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIpe1xuICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmxvY2tJbnRlcnByZXRlcih0aGlzLnBhcmFtcy5hY3Rpb25fbWFwKTtcbiAgICAgICAgY2FzZSBcInByb21vdG9yXCI6XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21vdG9ySW50ZXJwcmV0ZXIodGhpcy5wYXJhbXMuYWN0aW9uX21hcCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaW50ZXJwcmV0ZXIgJHt0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXJ9YCk7XG4gICAgICAgIH0gIFxuICAgIH1cblxuICAgIGluaXRfcG9wdWxhdGlvbigpe1xuICAgICAgICAvLyByYW5kb21seSBjaG9vc2Ugc3BvdHMgdG8gc2VlZCB0aGUgd29ybGQgd2l0aFxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5wYXJhbXMuaW5pdGlhbF9wb3B1bGF0aW9uOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5uZXdTZWVkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXdTZWVkKCl7XG4gICAgICAgIC8vIGNyZWF0ZSBhIHJhbmRvbSBnZW5vbWVcbiAgICAgICAgdmFyIGdlbm9tZSA9IEJ5dGVBcnJheS5yYW5kb20odGhpcy5wYXJhbXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoKTtcbiAgICAgICAgdGhpcy53b3JsZC5zZWVkKGdlbm9tZSk7XG4gICAgfVxuXG4gICAgc3RlcCgpe1xuICAgICAgICB0aGlzLnN0ZXBudW0rKztcbiAgICAgICAgdGhpcy5zaW11bGF0ZURlYXRoKCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVMaWdodCgpO1xuICAgICAgICB0aGlzLnNpbXVsYXRlQWN0aW9ucygpO1xuICAgICAgICB0aGlzLm11dGF0ZSgpO1xuICAgIH1cblxuICAgIHNpbXVsYXRlQWN0aW9ucygpe1xuICAgICAgICB0aGlzLndvcmxkLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIHZhciBydWxlcyA9IHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIuaW50ZXJwcmV0KHBsYW50Lmdlbm9tZSk7XG4gICAgICAgICAgICBwbGFudC5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbEFjdGlvbihjZWxsLCBydWxlcyk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgY2VsbEFjdGlvbihjZWxsLCBydWxlcyl7XG4gICAgICAgIHZhciBzdGF0ZTtcbiAgICAgICAgaWYgKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBCbG9ja0ludGVycHJldGVyKXtcbiAgICAgICAgICAgIHN0YXRlID0gY2VsbC5wbGFudC5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIFByb21vdG9ySW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgc3RhdGUgPSBjZWxsLnBsYW50LmdldFN0YXRlKGNlbGwpO1xuICAgICAgICB9XG4gICAgICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSl7XG4gICAgICAgICAgICAvLyBleGVjdXRlIG9uZSBhY3Rpb24gdXNpbmcgdGhlIGZpcnN0IG1hdGNoaW5nIHJ1bGVcbiAgICAgICAgICAgIC8vIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgICAgICBydWxlLmFjdGlvbi5leGVjdXRlKGNlbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgY2VsbC51cGRhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIG11dGF0ZSgpe1xuICAgICAgICB2YXIgbXV0YXRvciA9IG5ldyBNdXRhdG9yKHRoaXMucGFyYW1zLm11dF9mYWN0b3IsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlLCBcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLm11dF9pbnNlcnQsIHRoaXMucGFyYW1zLm11dF9kZWxldGUsIFxuICAgICAgICAgICAgMCwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2VfbW9kZSwgdGhpcy5tdXRfdW5pdHMpO1xuICAgICAgICB0aGlzLndvcmxkLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIG11dGF0b3IubXV0YXRlKHBsYW50Lmdlbm9tZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSBlYWNoIHBsYW50J3MgY3VycmVudCBkZWF0aCBwcm9iYWJpbGl0eSB0byBzaW11bGF0ZVxuICAgICAqIHdoZXRoZXIgZWFjaCBwbGFudCBkaWVzIG9uIHRoaXMgc3RlcFxuICAgICAqL1xuICAgIHNpbXVsYXRlRGVhdGgoKXtcbiAgICAgICAgdmFyIGRlYWRfcGxhbnRzID0gW107XG4gICAgICAgIHRoaXMud29ybGQucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgdmFyIGRlYXRoUHJvYiA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHJhbmRvbVByb2IoZGVhdGhQcm9iLnByb2IpKXtcbiAgICAgICAgICAgICAgICBkZWFkX3BsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGRlYWRfcGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgdGhpcy53b3JsZC5raWxsUGxhbnQocGxhbnQpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZSBsaWdodC4gU3VubGlnaHQgdHJhdmVyc2VzIGZyb20gdGhlIGNlaWxpbmcgb2YgdGhlIHdvcmxkXG4gICAgICogZG93bndhcmRzIHZlcnRpY2FsbHkuIEl0IGlzIGNhdWdodCBieSBhIHBsYW50IGNlbGwgd2l0aCBhIHByb2JhYmlsaXR5XG4gICAgICogd2hpY2ggY2F1c2VzIHRoYXQgY2VsbCB0byBiZSBlbmVyZ2lzZWQuXG4gICAgICovXG4gICAgc2ltdWxhdGVMaWdodCgpe1xuICAgICAgICBmb3IodmFyIHg9MDsgeDx0aGlzLndvcmxkLndpZHRoOyB4Kyspe1xuICAgICAgICAgICAgZm9yKHZhciB5PTA7IHk8dGhpcy53b3JsZC5oZWlnaHQ7IHkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3RoaXMud29ybGQuaGVpZ2h0LXktMV07XG4gICAgICAgICAgICAgICAgaWYoY2VsbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJhbmRvbVByb2IodGhpcy5wYXJhbXMuZW5lcmd5X3Byb2IpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQge1NpbXVsYXRpb24sIFNpbXVsYXRpb25QYXJhbXN9OyIsImltcG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc30gZnJvbSBcIi4vc2ltdWxhdGlvbi5qc1wiO1xuaW1wb3J0IHtTaW1EYXRhfSBmcm9tIFwiLi9zaW1kYXRhLmpzXCI7XG5cbmxldCBzaW11bGF0aW9uID0gbnVsbDtcbmxldCBkYXRhID0gbnVsbDtcbmxldCBydW5uaW5nID0gZmFsc2U7XG5sZXQgY2VsbFNpemUgPSA4O1xuY29uc3QgVEFSR0VUX0ZQUyA9IDYwO1xuY29uc3QgRlJBTUVfSU5URVJWQUxfTVMgPSAxMDAwIC8gVEFSR0VUX0ZQUztcbmxldCBsYXN0RnJhbWVUaW1lID0gMDtcblxuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGE7XG4gICAgc3dpdGNoIChtc2cudHlwZSkge1xuICAgIGNhc2UgXCJpbml0XCI6XG4gICAgICAgIGluaXRTaW0obXNnLnBhcmFtcyk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgbG9vcCgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RvcFwiOlxuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGVwXCI6XG4gICAgICAgIGRvU3RlcCgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImdldENlbGxcIjpcbiAgICAgICAgc2VuZENlbGxJbmZvKG1zZy54LCBtc2cueSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJkaXN0dXJiXCI6XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2UobXNnLnN0cmVuZ3RoKTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJraWxsQ2VsbFwiOlxuICAgICAgICBraWxsQ2VsbEF0KG1zZy54LCBtc2cueSk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwidXBkYXRlRGlzcGxheVBhcmFtc1wiOlxuICAgICAgICBpZiAoc2ltdWxhdGlvbiAmJiBzaW11bGF0aW9uLnBhcmFtcykge1xuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lID0gbXNnLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnJlY29yZF9pbnRlcnZhbCA9IG1zZy5yZWNvcmRfaW50ZXJ2YWw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gaW5pdFNpbShwYXJhbXMpIHtcbiAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgY29uc3Qgc2ltX3BhcmFtcyA9IG5ldyBTaW11bGF0aW9uUGFyYW1zKHBhcmFtcyk7XG4gICAgY2VsbFNpemUgPSBwYXJhbXMuY2VsbFNpemUgfHwgODtcbiAgICBzaW11bGF0aW9uID0gbmV3IFNpbXVsYXRpb24oc2ltX3BhcmFtcyk7XG4gICAgZGF0YSA9IG5ldyBTaW1EYXRhKHNpbXVsYXRpb24pO1xuICAgIHNpbXVsYXRpb24uaW5pdF9wb3B1bGF0aW9uKCk7XG4gICAgcHVzaEZyYW1lKCk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKSB7XG4gICAgaWYgKCFydW5uaW5nKSByZXR1cm47XG5cbiAgICBjb25zdCBzcGYgPSBzaW11bGF0aW9uLnBhcmFtcy5zdGVwc19wZXJfZnJhbWU7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGY7IGkrKykge1xuICAgICAgICBkb1N0ZXAoKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSBsYXN0RnJhbWVUaW1lID49IEZSQU1FX0lOVEVSVkFMX01TKSB7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBsYXN0RnJhbWVUaW1lID0gbm93O1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQobG9vcCwgMCk7XG59XG5cbmZ1bmN0aW9uIGRvU3RlcCgpIHtcbiAgICBzaW11bGF0aW9uLnN0ZXAoKTtcblxuICAgIC8vIFBlcmlvZGljIGRpc3R1cmJhbmNlXG4gICAgY29uc3QgZGkgPSBzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9pbnRlcnZhbDtcbiAgICBpZiAoZGkgPiAwICYmIHNpbXVsYXRpb24uc3RlcG51bSAlIGRpID09PSAwKSB7XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2Uoc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChzaW11bGF0aW9uLnN0ZXBudW0gJSBzaW11bGF0aW9uLnBhcmFtcy5yZWNvcmRfaW50ZXJ2YWwgPT09IDAgfHwgc2ltdWxhdGlvbi5zdGVwbnVtID09PSAxKSB7XG4gICAgICAgIGRhdGEucmVjb3JkU3RlcCgpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RhdHNcIixcbiAgICAgICAgICAgIGRhdGE6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YS5kYXRhKSksXG4gICAgICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcHBseURpc3R1cmJhbmNlKHN0cmVuZ3RoKSB7XG4gICAgY29uc3Qgd29ybGQgPSBzaW11bGF0aW9uLndvcmxkO1xuICAgIGNvbnN0IHBsYW50cyA9IHdvcmxkLnBsYW50cztcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGNvbnN0IG51bVRvS2lsbCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3Ioc3RyZW5ndGggKiBwbGFudHMubGVuZ3RoKSk7XG4gICAgLy8gU2h1ZmZsZSBhIHNhbXBsZSBhbmQga2lsbFxuICAgIGNvbnN0IHNodWZmbGVkID0gcGxhbnRzLnNsaWNlKCkuc29ydCgoKSA9PiBNYXRoLnJhbmRvbSgpIC0gMC41KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRvS2lsbCAmJiBpIDwgc2h1ZmZsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2hlY2sgcGxhbnQgc3RpbGwgYWxpdmUgKG5vdCBraWxsZWQgYnkgcHJldmlvdXMgaXRlcmF0aW9uKVxuICAgICAgICBpZiAod29ybGQucGxhbnRzLmluY2x1ZGVzKHNodWZmbGVkW2ldKSkge1xuICAgICAgICAgICAgd29ybGQua2lsbFBsYW50KHNodWZmbGVkW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24ga2lsbENlbGxBdCh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoY2VsbCAmJiBjZWxsLnBsYW50KSB7XG4gICAgICAgIHNpbXVsYXRpb24ud29ybGQua2lsbFBsYW50KGNlbGwucGxhbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcHVzaEZyYW1lKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpO1xuICAgIC8vIFRyYW5zZmVyIG93bmVyc2hpcCBvZiB0aGUgQXJyYXlCdWZmZXIgZm9yIHplcm8tY29weSBwZXJmb3JtYW5jZVxuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcImZyYW1lXCIsXG4gICAgICAgIGJ1ZmZlcjogcmVzdWx0LmJ1ZmZlci5idWZmZXIsXG4gICAgICAgIHdpZHRoOiByZXN1bHQud2lkdGgsXG4gICAgICAgIGhlaWdodDogcmVzdWx0LmhlaWdodCxcbiAgICAgICAgY2VsbENvdW50OiByZXN1bHQuY2VsbENvdW50LFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9LCBbcmVzdWx0LmJ1ZmZlci5idWZmZXJdKTtcbn1cblxuZnVuY3Rpb24gc2VuZENlbGxJbmZvKHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmICghY2VsbCB8fCAhY2VsbC5wbGFudCB8fCAhY2VsbC5wbGFudC5nZW5vbWUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBsYW50ID0gY2VsbC5wbGFudDtcbiAgICAgICAgY29uc3QgcnVsZXMgPSBzaW11bGF0aW9uLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUpO1xuICAgICAgICBjb25zdCBuZWlnaGJvdXJob29kID0gcGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgbGV0IG1hdGNoaW5nX3J1bGUgPSBcIk5vbmVcIjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHJ1bGVzW2ldLnN0YXRlID09PSBuZWlnaGJvdXJob29kKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hpbmdfcnVsZSA9IGAjJHtpfSAke3J1bGVzW2ldfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVhdGggPSBwbGFudC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogXCJjZWxsSW5mb1wiLFxuICAgICAgICAgICAgZm91bmQ6IHRydWUsXG4gICAgICAgICAgICBjZWxsU3RyOiBjZWxsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBuZWlnaGJvdXJob29kLFxuICAgICAgICAgICAgbWF0Y2hpbmdfcnVsZSxcbiAgICAgICAgICAgIGRlYXRoOiBKU09OLnN0cmluZ2lmeShkZWF0aCksXG4gICAgICAgICAgICBnZW5vbWVMZW5ndGg6IHBsYW50Lmdlbm9tZS5sZW5ndGgsXG4gICAgICAgICAgICBtdXRFeHA6IHBsYW50Lmdlbm9tZS5tdXRfZXhwLFxuICAgICAgICAgICAgcnVsZXM6IHJ1bGVzLm1hcChyID0+IHIudG9TdHJpbmcoKSlcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJjZWxsSW5mb1wiLCBmb3VuZDogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtyYW5kb21JbnR9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtQbGFudH0gZnJvbSBcIi4vcGxhbnQuanNcIjtcbmltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5cbmNsYXNzIFdvcmxkIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KXtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHdvcmxkIGxhdHRpY2UgdG8gYWxsIG51bGxzXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzLnB1c2goW10pO1xuICAgICAgICAgICAgZm9yKHZhciBqPTA7IGo8dGhpcy5oZWlnaHQ7IGorKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tpXVtqXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYW50cyA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIGFycmF5IG9mIHggcG9zaXRpb25zIGF0IHk9MCB3aGVyZSBubyBjZWxsIGV4aXN0c1xuICAgICAqL1xuICAgIGdldEZsb29yU3BhY2UoKXtcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICBpZih0aGlzLmNlbGxzW2ldWzBdID09PSBudWxsKXtcbiAgICAgICAgICAgICAgICBlbXB0eVNwYWNlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbXB0eVNwYWNlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdHJhdGVnaWVzIGZvciBzb3dpbmcgYSBzZWVkIG9uIHRoZSB3b3JsZCBmbG9vclxuICAgICAqIEBwYXJhbSB7Kn0gZ2Vub21lIHRoZSBnZW5vbWUgdXNlZCBieSB0aGUgbmV3IHNlZWRcbiAgICAgKiBAcGFyYW0geyp9IG5lYXJYIGlmIG5vdCBudWxsLCB0cnkgdG8gc293IGEgc2VlZCBhcyBjbG9zZVxuICAgICAqIGFzIHBvc3NpYmxlIHRvIHRoaXMgbG9jYXRpb25cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgYSBzZWVkIHdhcyBzdWNjZXNmdWxseSBwbGFudGVkLCBmYWxzZSBpZlxuICAgICAqIHRoZXJlIHdhcyBubyBzcGFjZSB0byBzb3cgYSBzZWVkLlxuICAgICAqL1xuICAgIHNlZWQoZ2Vub21lLCBuZWFyWCl7XG4gICAgICAgIC8vIGZpbmQgYSByYW5kb20gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gdGhpcy5nZXRGbG9vclNwYWNlKCk7XG4gICAgICAgIGlmKGVtcHR5U3BhY2VzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZWFyWCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0WCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdF9kaWZmID0gdGhpcy53aWR0aDtcbiAgICAgICAgICAgIGVtcHR5U3BhY2VzLmZvckVhY2goZnVuY3Rpb24oeHBvcyl7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBNYXRoLmFicyhuZWFyWC14cG9zKTtcbiAgICAgICAgICAgICAgICBpZihkaWZmIDwgbmVhcmVzdF9kaWZmKXtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdF9kaWZmID0gZGlmZjtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFggPSB4cG9zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIG5lYXJlc3RYKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHggPSBlbXB0eVNwYWNlc1tyYW5kb21JbnQoMCwgZW1wdHlTcGFjZXMubGVuZ3RoLTEpXTtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbeF1bMF0gIT09IG51bGwpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3BhY2UgaXMgdGFrZW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIHgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzb3dQbGFudChnZW5vbWUsIHgpe1xuICAgICAgICB4ID0gdGhpcy5nZXRYKHgpO1xuICAgICAgICB2YXIgcGxhbnQgPSBuZXcgUGxhbnQoeCwgdGhpcywgZ2Vub21lKTtcbiAgICAgICAgdGhpcy5wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgIHRoaXMuYWRkQ2VsbChwbGFudC5jZWxsc1swXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBsYW50IGZyb20gd29ybGQgcGxhbnQgbGlzdC5cbiAgICAgKiBSZW1vdmUgYWxsIGNlbGxzIGZyb20gY2VsbCBncmlkXG4gICAgICovXG4gICAga2lsbFBsYW50KHBsYW50KXtcbiAgICAgICAgdGhpcy5wbGFudHMuc3BsaWNlKHRoaXMucGxhbnRzLmluZGV4T2YocGxhbnQpLCAxKTtcbiAgICAgICAgcGxhbnQuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldID0gbnVsbDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0WCh4KXtcbiAgICAgICAgaWYoeCA8IDApe1xuICAgICAgICAgICAgeCA9IHRoaXMud2lkdGggKyB4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4ICUgdGhpcy53aWR0aDtcbiAgICB9XG5cbiAgICBnZXRDZWxsKHgsIHkpe1xuICAgICAgICByZXR1cm4gdGhpcy5jZWxsc1t0aGlzLmdldFgoeCldW3ldO1xuICAgIH1cblxuICAgIGFkZENlbGwoY2VsbCl7XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IGNlbGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRQaXhlbEJ1ZmZlcihjZWxsU2l6ZSl7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLndpZHRoICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGggPSB0aGlzLmhlaWdodCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBidWYgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkodyAqIGggKiA0KTsgLy8gUkdCQSwgaW5pdGlhbGl6ZWQgdG8gMCAodHJhbnNwYXJlbnQvYmxhY2spXG5cbiAgICAgICAgdGhpcy5wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICBjb25zdCBbYmFzZVIsIGJhc2VHLCBiYXNlQl0gPSB0aGlzLmdldEJhc2VDb2xvdXIocGxhbnQpO1xuICAgICAgICAgICAgcGxhbnQuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2wgPSBjZWxsLmVuZXJnaXNlZFxuICAgICAgICAgICAgICAgICAgICA/IFtiYXNlUiwgYmFzZUcsIGJhc2VCXVxuICAgICAgICAgICAgICAgICAgICA6IFtNYXRoLnJvdW5kKGJhc2VSICogMC43KSwgTWF0aC5yb3VuZChiYXNlRyAqIDAuNyksIE1hdGgucm91bmQoYmFzZUIgKiAwLjcpXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHB4MCA9IGNlbGwueCAqIGNlbGxTaXplO1xuICAgICAgICAgICAgICAgIC8vIHdvcmxkIHk9MCBpcyBncm91bmQgKGJvdHRvbSksIGNhbnZhcyB5PTAgaXMgdG9wXG4gICAgICAgICAgICAgICAgY29uc3QgcHkwID0gKHRoaXMuaGVpZ2h0IC0gMSAtIGNlbGwueSkgKiBjZWxsU2l6ZTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGR5ID0gMDsgZHkgPCBjZWxsU2l6ZTsgZHkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkeCA9IDA7IGR4IDwgY2VsbFNpemU7IGR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYXcgMXB4IGJvcmRlcjogZGFya2VuIGVkZ2UgcGl4ZWxzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0JvcmRlciA9IGR4ID09PSAwIHx8IGR5ID09PSAwIHx8IGR4ID09PSBjZWxsU2l6ZSAtIDEgfHwgZHkgPT09IGNlbGxTaXplIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGlzQm9yZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBbTWF0aC5yb3VuZChjb2xbMF0gKiAwLjUpLCBNYXRoLnJvdW5kKGNvbFsxXSAqIDAuNSksIE1hdGgucm91bmQoY29sWzJdICogMC41KV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkeCA9ICgocHkwICsgZHkpICogdyArIChweDAgKyBkeCkpICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdICAgICA9IHI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBnO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDJdID0gYjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAzXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4geyBidWZmZXI6IGJ1Ziwgd2lkdGg6IHcsIGhlaWdodDogaCwgY2VsbENvdW50OiB0aGlzLnBsYW50cy5yZWR1Y2UoKHMscCk9PnMrcC5jZWxscy5sZW5ndGgsMCkgfTtcbiAgICB9XG5cbiAgICBnZXRCYXNlQ29sb3VyKHBsYW50KXtcbiAgICAgICAgdmFyIGkgPSBwbGFudC5jZWxsc1swXS54ICUgY1NjYWxlLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGNTY2FsZVtpXTtcbiAgICB9XG59XG5cbi8vIGh0dHA6Ly9jb2xvcmJyZXdlcjIub3JnLz90eXBlPXF1YWxpdGF0aXZlJnNjaGVtZT1TZXQzJm49OCDigJQgYXMgcmF3IFtSLEcsQl0gdHVwbGVzXG52YXIgY1NjYWxlID0gW1xuICAgIFsxNDEsMjExLDE5OV0sWzI1NSwyNTUsMTc5XSxbMTkwLDE4NiwyMThdLFsyNTEsMTI4LDExNF0sXG4gICAgWzEyOCwxNzcsMjExXSxbMjUzLDE4MCw5OF0sWzE3OSwyMjIsMTA1XSxbMjUyLDIwNSwyMjldXG5dO1xuXG5cbmV4cG9ydCB7IFdvcmxkIH07IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0bG9hZGVkOiBmYWxzZSxcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuLy8gdGhlIHN0YXJ0dXAgZnVuY3Rpb25cbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5cdC8vIFRoaXMgZW50cnkgbW9kdWxlIGRlcGVuZHMgb24gb3RoZXIgbG9hZGVkIGNodW5rcyBhbmQgZXhlY3V0aW9uIG5lZWQgdG8gYmUgZGVsYXllZFxuXHR2YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyh1bmRlZmluZWQsIFtcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3NlZWRyYW5kb21faW5kZXhfanMtbm9kZV9tb2R1bGVzX3N0YXRzLWxpdGVfc3RhdHNfanNcIl0sICgpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanNcIikpKVxuXHRfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKF9fd2VicGFja19leHBvcnRzX18pO1xuXHRyZXR1cm4gX193ZWJwYWNrX2V4cG9ydHNfXztcbn07XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kRCA9IGZ1bmN0aW9uICgpIHtcblx0dGhyb3cgbmV3IEVycm9yKCdkZWZpbmUgY2Fubm90IGJlIHVzZWQgaW5kaXJlY3QnKTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5hbWRPID0ge307IiwidmFyIGRlZmVycmVkID0gW107XG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8gPSAocmVzdWx0LCBjaHVua0lkcywgZm4sIHByaW9yaXR5KSA9PiB7XG5cdGlmKGNodW5rSWRzKSB7XG5cdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuXHRcdGZvcih2YXIgaSA9IGRlZmVycmVkLmxlbmd0aDsgaSA+IDAgJiYgZGVmZXJyZWRbaSAtIDFdWzJdID4gcHJpb3JpdHk7IGktLSkgZGVmZXJyZWRbaV0gPSBkZWZlcnJlZFtpIC0gMV07XG5cdFx0ZGVmZXJyZWRbaV0gPSBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV07XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBub3RGdWxmaWxsZWQgPSBJbmZpbml0eTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV0gPSBkZWZlcnJlZFtpXTtcblx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpZiAoKHByaW9yaXR5ICYgMSA9PT0gMCB8fCBub3RGdWxmaWxsZWQgPj0gcHJpb3JpdHkpICYmIE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uTykuZXZlcnkoKGtleSkgPT4gKF9fd2VicGFja19yZXF1aXJlX18uT1trZXldKGNodW5rSWRzW2pdKSkpKSB7XG5cdFx0XHRcdGNodW5rSWRzLnNwbGljZShqLS0sIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnVsZmlsbGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmKHByaW9yaXR5IDwgbm90RnVsZmlsbGVkKSBub3RGdWxmaWxsZWQgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoZnVsZmlsbGVkKSB7XG5cdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuXHRcdFx0dmFyIHIgPSBmbigpO1xuXHRcdFx0aWYgKHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vLyBUaGlzIGZpbGUgY29udGFpbnMgb25seSB0aGUgZW50cnkgY2h1bmsuXG4vLyBUaGUgY2h1bmsgbG9hZGluZyBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLmYpLnJlZHVjZSgocHJvbWlzZXMsIGtleSkgPT4ge1xuXHRcdF9fd2VicGFja19yZXF1aXJlX18uZltrZXldKGNodW5rSWQsIHByb21pc2VzKTtcblx0XHRyZXR1cm4gcHJvbWlzZXM7XG5cdH0sIFtdKSk7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rcyBhbmQgY2h1bmtzIHRoYXQgdGhlIGVudHJ5cG9pbnQgZGVwZW5kcyBvblxuX193ZWJwYWNrX3JlcXVpcmVfXy51ID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiBcIlwiICsgY2h1bmtJZCArIFwiLmJ1bmRsZS5qc1wiO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwidmFyIHNjcmlwdFVybDtcbmlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmcuaW1wb3J0U2NyaXB0cykgc2NyaXB0VXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmxvY2F0aW9uICsgXCJcIjtcbnZhciBkb2N1bWVudCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5kb2N1bWVudDtcbmlmICghc2NyaXB0VXJsICYmIGRvY3VtZW50KSB7XG5cdGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0ICYmIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnU0NSSVBUJylcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcblx0aWYgKCFzY3JpcHRVcmwpIHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xuXHRcdGlmKHNjcmlwdHMubGVuZ3RoKSB7XG5cdFx0XHR2YXIgaSA9IHNjcmlwdHMubGVuZ3RoIC0gMTtcblx0XHRcdHdoaWxlIChpID4gLTEgJiYgKCFzY3JpcHRVcmwgfHwgIS9eaHR0cChzPyk6Ly50ZXN0KHNjcmlwdFVybCkpKSBzY3JpcHRVcmwgPSBzY3JpcHRzW2ktLV0uc3JjO1xuXHRcdH1cblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC9eYmxvYjovLCBcIlwiKS5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGNodW5rc1xuLy8gXCIxXCIgbWVhbnMgXCJhbHJlYWR5IGxvYWRlZFwiXG52YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuXHRcInNyY19zaW11bGF0aW9uX3dvcmtlcl9qc1wiOiAxXG59O1xuXG4vLyBpbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmdcbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIgW2NodW5rSWRzLCBtb3JlTW9kdWxlcywgcnVudGltZV0gPSBkYXRhO1xuXHRmb3IodmFyIG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubVttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG5cdFx0fVxuXHR9XG5cdGlmKHJ1bnRpbWUpIHJ1bnRpbWUoX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cdHdoaWxlKGNodW5rSWRzLmxlbmd0aClcblx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZHMucG9wKCldID0gMTtcblx0cGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24oZGF0YSk7XG59O1xuX193ZWJwYWNrX3JlcXVpcmVfXy5mLmkgPSAoY2h1bmtJZCwgcHJvbWlzZXMpID0+IHtcblx0Ly8gXCIxXCIgaXMgdGhlIHNpZ25hbCBmb3IgXCJhbHJlYWR5IGxvYWRlZFwiXG5cdGlmKCFpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRpZih0cnVlKSB7IC8vIGFsbCBjaHVua3MgaGF2ZSBKU1xuXHRcdFx0aW1wb3J0U2NyaXB0cyhfX3dlYnBhY2tfcmVxdWlyZV9fLnAgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLnUoY2h1bmtJZCkpO1xuXHRcdH1cblx0fVxufTtcblxudmFyIGNodW5rTG9hZGluZ0dsb2JhbCA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSB8fCBbXTtcbnZhciBwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbiA9IGNodW5rTG9hZGluZ0dsb2JhbC5wdXNoLmJpbmQoY2h1bmtMb2FkaW5nR2xvYmFsKTtcbmNodW5rTG9hZGluZ0dsb2JhbC5wdXNoID0gaW5zdGFsbENodW5rO1xuXG4vLyBubyBITVJcblxuLy8gbm8gSE1SIG1hbmlmZXN0IiwidmFyIG5leHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLng7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fLmUoXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCIpLnRoZW4obmV4dCk7XG59OyIsIiIsIi8vIHJ1biBzdGFydHVwXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18ueCgpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9