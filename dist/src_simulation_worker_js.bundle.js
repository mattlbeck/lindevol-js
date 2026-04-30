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
    case "updateDisturbance":
        simulation.params.disturbance_interval = msg.interval;
        simulation.params.disturbance_strength = msg.strength;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO1dBQ0E7V0FDQTtXQUNBLEdBQUc7V0FDSDtXQUNBO1dBQ0EsQ0FBQyxJOzs7OztXQ1BELHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7OztXQ05BO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7V0NKQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxrQzs7Ozs7V0NsQkE7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGFBQWE7V0FDYjtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7O1dBRUE7O1dBRUEsa0I7Ozs7O1dDcENBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1VFSEE7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2xpbmRldm9sL2lnbm9yZWR8L1VzZXJzL21hdHQvbGluZGV2b2wtanMvbm9kZV9tb2R1bGVzL3NlZWRyYW5kb218Y3J5cHRvIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2FjdGlvbnMuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvY2VsbC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9nZW5vbWUuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvcGxhbnQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvcmFuZG9tLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbWRhdGEuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW11bGF0aW9uLndvcmtlci5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy93b3JsZC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvYW1kIGRlZmluZSIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvYW1kIG9wdGlvbnMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2NodW5rIGxvYWRlZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2Vuc3VyZSBjaHVuayIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZ2V0IGphdmFzY3JpcHQgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvcHVibGljUGF0aCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9zdGFydHVwIGNodW5rIGRlcGVuZGVuY2llcyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLyogKGlnbm9yZWQpICovIiwiY29uc3QgTkVJR0hCT1VSSE9PRCA9IFtbLTEsLTFdLCBbMCwtMV0sIFsxLC0xXSwgWy0xLDBdLCBbMSwwXSwgWy0xLDFdLCBbMCwxXSwgWzEsMV1dO1xuY29uc3QgTVVUX0lOQ1JFTUVOVCA9IDAuMDAxO1xuXG5jbGFzcyBBY3Rpb257XG4gICAgY29uc3RydWN0b3IoYWN0aW9uQ29kZSl7XG4gICAgICAgIHRoaXMuY29kZSA9IGFjdGlvbkNvZGU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBleGVjdXRlKGNlbGwpe1xuICAgICAgICAvLyBhY3Rpb25zIGFyZSB0eXBpY2FsbHkgb25seSBjYXJyaWVkIG91dCBpZiB0aGUgY2VsbCBoYXMgZW5lcmd5XG4gICAgICAgIC8vIGFuZCB0aGUgY2VsbCBsb3NlcyBlbmVyZ3kgYXMgYSByZXN1bHQuXG4gICAgICAgIGlmIChjZWxsLmVuZXJnaXNlZCl7XG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9IHRoaXMuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgICAgICBjZWxsLmVuZXJnaXNlZCA9ICFzdWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cblxuICAgIGRvQWN0aW9uKGNlbGwpe1xuXG4gICAgfVxufVxuXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBBY3Rpb257XG5cbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgLy8gdGhlIDIgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBvZiB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgLy8gZGV0ZXJtaW5lcyB3aGljaCBkaXJlY3Rpb24gdGhlIGRpdmlkZSBhY3Rpb24gaXMgZm9yXG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICAgICAgY2VsbC5wbGFudC5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICB9XG5cbiAgICBnZXREaXJlY3Rpb24oKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMDExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICB2YXIgZGlyZWN0aW9uQ29kZSA9IHRoaXMuY29kZSAmIDc7XG4gICAgICAgIHJldHVybiBORUlHSEJPVVJIT09EW2RpcmVjdGlvbkNvZGVdO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgZGl2aWRlICR7dGhpcy5nZXREaXJlY3Rpb24oKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlUGx1cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgKz0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0K1wiO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlTWludXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwIC09IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dC1cIjtcbiAgICB9XG59XG5cbmNsYXNzIEZseWluZ1NlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwiZmx5aW5nc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgTG9jYWxTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCksIGNlbGwueCk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibG9jYWxzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBTdGF0ZUJpdE4gZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCkge1xuICAgICAgICBjZWxsLm5leHRJbnRlcm5hbFN0YXRlID0gY2VsbC5uZXh0SW50ZXJuYWxTdGF0ZSAmIE1hdGgucG93KDIsIHRoaXMuZ2V0TnRoQml0KCkpO1xuICAgICAgICAvLyB0aGlzIGFjdGlvbiBkb2VzIG5vdCBjb25zdW1lIGVuZXJneVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZ2V0TnRoQml0KCl7XG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIGNvcnJlY3QgYml0c1xuICAgICAgICAvLyAmIHdpdGggMDAwMDExMTEgdG8gbWFzayBvdXQgbGVhc3Qgc2lnIGJpdHNcbiAgICAgICAgcmV0dXJuIHRoaXMuY29kZSAmIDE1O1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgU3RhdGVCaXQgJHt0aGlzLmdldE50aEJpdCgpfWA7XG4gICAgfVxufVxuXG5jbGFzcyBBY3Rpb25NYXAge1xuXG4gICAgY29uc3RydWN0b3IobWFwcGluZyl7XG4gICAgICAgIHRoaXMubWFwcGluZyA9IG1hcHBpbmc7XG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IFtEaXZpZGUsIEZseWluZ1NlZWQsIExvY2FsU2VlZCwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIFN0YXRlQml0Tl07XG4gICAgfVxuXG4gICAgZ2V0QWN0aW9uKGFjdGlvbkNvZGUpe1xuICAgICAgICB2YXIgbWFwcGluZ0NvdW50ID0gMDtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5tYXBwaW5nLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG1hcHBpbmdDb3VudCArPSB0aGlzLm1hcHBpbmdbaV07XG4gICAgICAgICAgICBpZiAoYWN0aW9uQ29kZSA8IG1hcHBpbmdDb3VudCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmFjdGlvbnNbaV0oYWN0aW9uQ29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgYEFjdGlvbiBjb2RlICR7YWN0aW9uQ29kZX0gZG9lcyBub3QgbWFwIHRvIGFuIGFjdGlvbmA7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7RGl2aWRlLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgTG9jYWxTZWVkLCBGbHlpbmdTZWVkLCBBY3Rpb25NYXAsIE5FSUdIQk9VUkhPT0R9OyIsIlxuY2xhc3MgQ2VsbHtcbiAgICBjb25zdHJ1Y3RvcihwbGFudCwgeCwgeSl7XG4gICAgICAgIHRoaXMucGxhbnQgPSBwbGFudDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGdldCBlbmVyZ2lzZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmVyZ2lzZWQ7XG4gICAgfVxuXG4gICAgc2V0IGVuZXJnaXNlZCh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fZW5lcmdpc2VkID09PSB2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucGxhbnQpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoKXtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgsIHgsIHksIHNpemUsIGNvbG91cil7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvdXI7XG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgLy9jdHguc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYENlbGwgYXQgKCR7dGhpcy54fSwgJHt0aGlzLnl9KSBlbmVyZ3k6ICR7dGhpcy5lbmVyZ2lzZWR9YDtcbiAgICB9XG59XG5cbmV4cG9ydCB7Q2VsbH07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtBY3Rpb25NYXB9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgQnl0ZUFycmF5IGV4dGVuZHMgQXJyYXl7XG5cbiAgICBjb25zdHJ1Y3RvcihsZW5ndGg9MCwgaW5pdGlhbF9tdXRfZXhwPTApe1xuICAgICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgICB0aGlzLm11dF9leHAgPSBpbml0aWFsX211dF9leHA7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb20oYXJyKXtcbiAgICAgICAgdmFyIGJhID0gbmV3IEJ5dGVBcnJheShhcnIubGVuZ3RoKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8YmEubGVuZ3RoO2krKyl7XG4gICAgICAgICAgICBiYVtpXSA9IGFycltpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgc3RhdGljIHJhbmRvbShsZW5ndGgpe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSByYW5kb21JbnQoMCwgMjU1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgY29weSgpe1xuICAgICAgICB2YXIgbmV3QXJyID0gbmV3IEJ5dGVBcnJheSh0aGlzLmxlbmd0aCwgdGhpcy5pbml0aWFsX211dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG5ld0FycltpXSA9IHRoaXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld0FycjtcbiAgICB9XG5cbn1cblxuY2xhc3MgTXV0YXRvcntcbiAgICBjb25zdHJ1Y3Rvcihwcm9iLCBwcm9iX3JlcGxhY2VtZW50LCBwcm9iX2luc2VydGlvbiwgcHJvYl9kZWxldGlvbiwgcHJvYl9kdXAsIHJlcGxhY2VtZW50X21vZGUsIHVuaXRzKXtcbiAgICAgICAgdGhpcy5wcm9iID0gcHJvYjtcbiAgICAgICAgdGhpcy5wUiA9IHByb2JfcmVwbGFjZW1lbnQ7XG4gICAgICAgIHRoaXMucEkgPSBwcm9iX2luc2VydGlvbjtcbiAgICAgICAgdGhpcy5wRCA9IHByb2JfZGVsZXRpb247XG4gICAgICAgIHRoaXMucER1cCA9IHByb2JfZHVwO1xuICAgICAgICB0aGlzLnBSbW9kZSA9IHJlcGxhY2VtZW50X21vZGU7ICBcbiAgICAgICAgdGhpcy51bml0cyA9IHVuaXRzO1xuICAgIH1cblxuICAgIG11dGF0ZShnZW5vbWUpe1xuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucFIsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2UoZ2Vub21lKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEksIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmluc2VydChnZW5vbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMubVByb2IodGhpcy5wRCwgZ2Vub21lLm11dF9leHApKXtcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlKGdlbm9tZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtUHJvYihwLCBleHApe1xuICAgICAgICByZXR1cm4gcmFuZG9tUHJvYihwICogTWF0aC5wb3coIHRoaXMucHJvYiwgZXhwKSk7XG4gICAgfVxuXG4gICAgcmVwbGFjZShnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIHN3aXRjaCh0aGlzLnBSbW9kZSl7XG4gICAgICAgIGNhc2UgXCJieXRld2lzZVwiOlxuICAgICAgICAgICAgZ2Vub21lW2ldID0gdGhpcy5yYW5kb21DaGFyKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImJpdHdpc2VcIjpcbiAgICAgICAgICAgIGdlbm9tZVtpXSA9IGdlbm9tZVtpXSBeIE1hdGgucG93KDIsIHJhbmRvbUludCgwLCA3KSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBtdXRhdGlvbiByZXBsYWNlbWVudCBtb2RlOiAke3RoaXMucFJtb2RlfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cblxuICAgIGluc2VydChnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIGZvcih2YXIgbj0wOyBuPHRoaXMudW5pdHM7IG4rKyl7XG4gICAgICAgICAgICBnZW5vbWUuc3BsaWNlKGksIDAsIHRoaXMucmFuZG9tQ2hhcigpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlbGV0ZShnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIGZvcih2YXIgbj0wOyBuPHRoaXMudW5pdHM7IG4rKyl7XG4gICAgICAgICAgICBnZW5vbWUuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmFuZG9tQ2hhcigpe1xuICAgICAgICByZXR1cm4gcmFuZG9tSW50KDAsIDI1NSk7XG4gICAgfVxuXG4gICAgcmFuZG9tUG9zKGdlbm9tZSl7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQoMCwgZ2Vub21lLmxlbmd0aC0xKTtcbiAgICB9XG59XG5cblxuXG5jbGFzcyBSdWxlIHtcbiAgICBjb25zdHJ1Y3RvcihlcU1hc2ssIHN0YXRlLCBhY3Rpb24pe1xuICAgICAgICB0aGlzLmVxTWFzayA9IGVxTWFzaztcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgICAgICB0aGlzLmFjdGlvbiA9IGFjdGlvbjtcbiAgICB9XG5cbiAgICBtYXRjaGVzKHN0YXRlKXtcbiAgICAgICAgdmFyIGVxU3RhdGUgPSBzdGF0ZSAmIHRoaXMuZXFNYXNrO1xuICAgICAgICByZXR1cm4gZXFTdGF0ZSA9PT0gdGhpcy5zdGF0ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5zdGF0ZX0gLT4gJHt0aGlzLmFjdGlvbn1gO1xuICAgIH1cbn1cblxuY2xhc3MgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgLyoqXG4gICAgICogTWV0aG9kcyB0aGF0IGRlY29kZSBnZW5vbWVzIGludG8gcnVsZXNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nKXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbmV3IEFjdGlvbk1hcChtYXBwaW5nKTtcbiAgICB9XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG5cbiAgICB9XG59XG5cbmNsYXNzIEJsb2NrSW50ZXJwcmV0ZXIgZXh0ZW5kcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5KXtcbiAgICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgYnl0ZWFycmF5Lmxlbmd0aDsgaSs9Mil7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5tYXBwaW5nLmdldEFjdGlvbihieXRlYXJyYXlbaSsxXSk7XG4gICAgICAgICAgICBydWxlcy5wdXNoKG5ldyBSdWxlKDI1NSwgYnl0ZWFycmF5W2ldLCBhY3Rpb24pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnVsZXM7XG4gICAgfVxufVxuXG5jbGFzcyBQcm9tb3RvckludGVycHJldGVyIGV4dGVuZHMgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG4gICAgICAgIHZhciBydWxlcyA9IFtdO1xuICAgICAgICB2YXIgZ2VuZXMgPSBbXTtcbiAgICAgICAgdmFyIGdlbmUgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBieXRlYXJyYXkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGMgPSBieXRlYXJyYXlbaV07XG4gICAgICAgICAgICBpZihiaXRTZXQoYywgNikgPT09IGJpdFNldChjLCA3KSl7XG4gICAgICAgICAgICAgICAgLy8gb3BlcmF0b3JcbiAgICAgICAgICAgICAgICBpZihnZW5lLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZS5wdXNoKGMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGJpdFNldChjLCA3KSl7XG4gICAgICAgICAgICAgICAgLy8gcHJvbW90b3JcbiAgICAgICAgICAgICAgICBnZW5lID0gW2NdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBpZihiaXRTZXQoYywgNikpe1xuICAgICAgICAgICAgICAgICAgICAvLyB0ZXJtaW5hdG9yXG4gICAgICAgICAgICAgICAgICAgIGlmKGdlbmUubGVuZ3RoPjApe1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZS5wdXNoKGMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXMucHVzaChnZW5lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmUgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIGdlbmVzLmZvckVhY2goZnVuY3Rpb24oZ2VuZSl7XG4gICAgICAgICAgICAvLyBleHRyYWN0IDYgbGVhc3Qgc2lnIGJpdHMgZnJvbSB0ZXJtaW5hdG9yIGFzIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAgICAgdmFyIGFjdGlvbkNvZGUgPSBnZW5lW2dlbmUubGVuZ3RoLTFdICYgKE1hdGgucG93KDIsIDYpIC0gMSk7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5tYXBwaW5nLmdldEFjdGlvbihhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gdGFrZSBpbmZvcm1hdGlvbiBmcm9tIG9wZXJhdG9ycyB0byBjcmVhdGUgc3RhdGUgbWFza1xuICAgICAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICAgICAgdmFyIGVxTWFzayA9IDA7IC8vIHNwZWNpZmllZCB3aGljaCBiaXRzIGNvbnRyaWJ1dGUgdG8gdGhlIHN0YXRlIG1hc2tcbiAgICAgICAgICAgIGZvcih2YXIgaT0xOyBpPGdlbmUubGVuZ3RoLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIDQgbGVhc3Qgc2lnIGJpdHMgZGV0ZXJtaW5lIHRoZSBtYXNrIGluZGV4XG4gICAgICAgICAgICAgICAgdmFyIG1hc2tCaXQgPSBnZW5lW2ldICYgKE1hdGgucG93KDIsIDQpIC0gMSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmVzIGlmIHRoZSBtYXNrIGF0IHRoaXMgaW5kZXggaXMgc2V0IHRvIDEgb3IgMFxuICAgICAgICAgICAgICAgIHZhciBiaXRTdGF0ZSA9IChnZW5lW2ldICYgTWF0aC5wb3coMiwgNCkpID4+IDQ7XG4gICAgICAgICAgICAgICAgbWFzayArPSBNYXRoLnBvdygyLCBtYXNrQml0KSpiaXRTdGF0ZTtcblxuICAgICAgICAgICAgICAgIGVxTWFzayArPSBNYXRoLnBvdygyLCBtYXNrQml0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJ1bGVzLnB1c2gobmV3IFJ1bGUoZXFNYXNrLCBtYXNrLCBhY3Rpb24pKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJpdFNldChieXRlLCBpKXtcbiAgICByZXR1cm4gKGJ5dGUgJiBNYXRoLnBvdygyLCBpKSkgPj4gaTtcbn1cblxuZXhwb3J0IHtCeXRlQXJyYXksIEJsb2NrSW50ZXJwcmV0ZXIsIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9OyIsImltcG9ydCB7cmFuZG9tSW50LCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7Q2VsbH0gZnJvbSBcIi4vY2VsbC5qc1wiO1xuaW1wb3J0IHtORUlHSEJPVVJIT09EfSBmcm9tIFwiLi9hY3Rpb25zLmpzXCI7XG5cbmNsYXNzIFBsYW50e1xuICAgIGNvbnN0cnVjdG9yKHgsIHdvcmxkLCBnZW5vbWUsIHVzZUludGVybmFsU3RhdGU9ZmFsc2UpIHtcbiAgICAgICAgdGhpcy53b3JsZCA9IHdvcmxkO1xuICAgICAgICB0aGlzLmVuZXJnaXNlZENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5jZWxscyA9IFtuZXcgQ2VsbCh0aGlzLCB0aGlzLndvcmxkLmdldFgoeCksIDApXTtcbiAgICAgICAgdGhpcy5nZW5vbWUgPSBnZW5vbWU7XG4gICAgICAgIHRoaXMudXNlSW50ZXJuYWxTdGF0ZSA9IHVzZUludGVybmFsU3RhdGU7XG4gICAgfVxuXG4gICAgZ2V0TmVpZ2hib3VyaG9vZChjZWxsKXtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBuZWlnaGJvdXJob29kIG1hc2tcbiAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxORUlHSEJPVVJIT09ELmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBwb3MgPSBORUlHSEJPVVJIT09EW2ldO1xuICAgICAgICAgICAgdmFyIHggPSBjZWxsLnggKyBwb3NbMF07XG4gICAgICAgICAgICB2YXIgeSA9IGNlbGwueSArIHBvc1sxXTtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICB2YXIgd29ybGRQb3MgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2goZXJyb3Ipe1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdvcmxkUG9zIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICAgICAgbWFzayA9IG1hc2sgfCBNYXRoLnBvdygyLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFzaztcbiAgICB9XG5cbiAgICBnZXRTdGF0ZShjZWxsKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKSB8IGNlbGwuaW50ZXJuYWxTdGF0ZSB8IChNYXRoLnBvdygyLCAxNSkgKiAoIGNlbGwuZW5lcmdpc2VkID8gMSA6IDApKTtcbiAgICB9XG5cbiAgICBncm93KCl7XG4gICAgICAgIHRoaXMuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gZ3Jvd1xuICAgICAgICAgICAgaWYocmFuZG9tUHJvYigwLjgpKXtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VzID0gdGhpcy5nZXRHcm93RGlyZWN0aW9uKGNlbGwpO1xuICAgICAgICAgICAgICAgIGlmKHNwYWNlcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHNwYWNlc1tyYW5kb21JbnQoMCwgc3BhY2VzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdyb3cgdGhlIHBsYW50IGJ5IG9uZSBjZWxsIGlmIHBvc3NpYmxlXG4gICAgICogQHBhcmFtIHsqfSBjZWxsIHRoZSBjZWxsIHRvIGdyb3cgZnJvbVxuICAgICAqIEBwYXJhbSB7Kn0gZGlyZWN0aW9uIHRoZSBkaXJlY3Rpb24gdG8gZ3JvdyBpblxuICAgICAqL1xuICAgIGdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24pe1xuICAgICAgICB2YXIgeCA9IGNlbGwueCtkaXJlY3Rpb25bMF0sIHkgPSBjZWxsLnkrZGlyZWN0aW9uWzFdO1xuICAgICAgICAvLyBjaGVjayBpZiBzcGFjZSBpcyBjbGVhclxuICAgICAgICB2YXIgc3BhY2UgPSB0aGlzLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgICAgIGlmIChzcGFjZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BhY2UgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgIGlmIChzcGFjZS5wbGFudCA9PT0gdGhpcyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdGhpcyBwbGFudCB3aWxsIGtpbGwgdGhlIG90aGVyXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvYmFiaWxpdHkuLi5cbiAgICAgICAgICAgIGlmKHJhbmRvbVByb2Ioc3BhY2UucGxhbnQuZ2V0S2lsbFByb2JhYmlsaXR5KCkpKXtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgc3VjY2VlZGVkLiBLaWxsIGNvbXBldGl0b3IgYW5kIGNvbnRpbnVlIHdpdGggZ3Jvd3RoXG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZC5raWxsUGxhbnQoc3BhY2UucGxhbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYXR0YWNrIGZhaWxlZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIC8vIGdyb3cgY2VsbCBpbiB0byBlbXB0eSBzcGFjZVxuICAgICAgICB2YXIgbmV3X2NlbGwgPSBuZXcgQ2VsbCh0aGlzLCB0aGlzLndvcmxkLmdldFgoeCksIHkpO1xuICAgICAgICB0aGlzLmNlbGxzLnB1c2gobmV3X2NlbGwpO1xuICAgICAgICB0aGlzLndvcmxkLmFkZENlbGwobmV3X2NlbGwpO1xuICAgIH1cblxuICAgIGdldEtpbGxQcm9iYWJpbGl0eSgpe1xuICAgICAgICByZXR1cm4gMS90aGlzLmVuZXJnaXNlZENvdW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB3aGV0aGVyIHRoaXMgcGxhbnQgc2hvdWxkIGRpZS5cbiAgICAgKiBAcGFyYW0ge30gbmF0dXJhbF9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gZW5lcmd5X2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGVuZXJneSByaWNoIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBsZWFub3Zlcl9mYWN0b3IgZmFjdG9yIHRvIHRoZSBsZWFub3ZlciB0ZXJtXG4gICAgICovXG4gICAgZ2V0RGVhdGhQcm9iYWJpbGl0eShkZWF0aF9mYWN0b3IsIG5hdHVyYWxfZXhwLCBlbmVyZ3lfZXhwLCBsZWFub3Zlcl9mYWN0b3Ipe1xuICAgICAgICB2YXIgbnVtQ2VsbHMgPSB0aGlzLmNlbGxzLmxlbmd0aDtcbiAgICAgICAgdmFyIGxlYW5vdmVyRW5lcmdpc2VkID0gMDtcbiAgICAgICAgdmFyIHJvb3RDZWxsID0gdGhpcy5jZWxsc1swXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5jZWxscy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbHNbaV07XG4gICAgICAgICAgICB2YXIgbGUgPSB0aGlzLndvcmxkLndpZHRoLzIgLSAoICgoIDEuNSp0aGlzLndvcmxkLndpZHRoICkgKyBjZWxsLnggLSByb290Q2VsbC54KSAgJSB0aGlzLndvcmxkLndpZHRoKTtcbiAgICAgICAgICAgIGxlYW5vdmVyRW5lcmdpc2VkICs9IGxlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYW5vdmVyQ2VsbHMgPSAyLyhudW1DZWxscyoobnVtQ2VsbHMtMSkpO1xuICAgICAgICBpZiAobGVhbm92ZXJDZWxscyA9PT0gSW5maW5pdHkpe1xuICAgICAgICAgICAgbGVhbm92ZXJDZWxscyA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVhbm92ZXJUZXJtID0gbGVhbm92ZXJDZWxscypNYXRoLmFicyhsZWFub3ZlckVuZXJnaXNlZCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZF9uYXR1cmFsID0gTWF0aC5wb3cobnVtQ2VsbHMsIG5hdHVyYWxfZXhwKTtcbiAgICAgICAgdmFyIGRfZW5lcmd5ID0gTWF0aC5wb3codGhpcy5lbmVyZ2lzZWRDb3VudCsxLCBlbmVyZ3lfZXhwKTtcbiAgICAgICAgdmFyIGRfbGVhbm92ZXIgPSBsZWFub3Zlcl9mYWN0b3IqbGVhbm92ZXJUZXJtO1xuICAgICAgICB2YXIgcERlYXRoID0gZGVhdGhfZmFjdG9yICogZF9uYXR1cmFsICogZF9lbmVyZ3kgKyBkX2xlYW5vdmVyO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJwcm9iXCI6IHBEZWF0aCxcbiAgICAgICAgICAgIFwibmF0dXJhbFwiOiBkX25hdHVyYWwsXG4gICAgICAgICAgICBcImVuZXJneVwiOiBkX2VuZXJneSxcbiAgICAgICAgICAgIFwibGVhbm92ZXJcIjogZF9sZWFub3ZlclxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGxhbnQgfTsiLCJpbXBvcnQgc2VlZHJhbmRvbSBmcm9tIFwic2VlZHJhbmRvbVwiO1xuXG4vKipcbiAqIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byBNYXRoLnJhbmRvbVxuICogQHBhcmFtIHsqfSBzZWVkIGRhdGEgdG8gdXNlIHRvIHNlZWQgYWxsIGZ1dHVyZSBSTkcgY2FsbHNcbiAqL1xuZnVuY3Rpb24gc2VlZFJhbmRvbShzZWVkKXtcbiAgICBzZWVkcmFuZG9tKHNlZWQsIHtnbG9iYWw6IHRydWV9KTtcbn1cblxuLyoqXG4gKiByZXR1cm5zIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiAwIGFuZCBtYXggKGluY2x1c2l2ZSlcbiAqIEBwYXJhbSB7Kn0gbWF4IG1heGltdW0gaW50ZWdlciB0byBnZW5lcmF0ZSBhcyBhIHJhbmRvbSBudW1iZXJcbiAqL1xuZnVuY3Rpb24gcmFuZG9tSW50KG1pbiwgbWF4KXtcbiAgICAvLyBub3RlOiBNYXRoLnJhbmRvbSByZXR1cm5zIGEgcmFuZG9tIG51bWJlciBleGNsdXNpdmUgb2YgMSxcbiAgICAvLyBzbyB0aGVyZSBpcyArMSBpbiB0aGUgYmVsb3cgZXF1YXRpb24gdG8gZW5zdXJlIHRoZSBtYXhpbXVtXG4gICAgLy8gbnVtYmVyIGlzIGNvbnNpZGVyZWQgd2hlbiBmbG9vcmluZyAwLjkuLi4gcmVzdWx0cy5cbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZXMgdGhlIGNoYW5jZSBvZiBhbiBldmVudCBoYXBwZW5pbmcgZ2l2ZW4gcHJvYlxuICogQHBhcmFtIHsqfSBwcm9iIGZyYWN0aW9uIGJldHdlZW4gMCBhbmQgMSBjaGFuY2Ugb2YgdGhlIGV2ZW50IGhhcHBlbmluZ1xuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgZXZlbnQgaGFwcGVucywgZmFsc2UgaWYgbm90XG4gKi9cbmZ1bmN0aW9uIHJhbmRvbVByb2IocHJvYil7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgPD0gcHJvYjtcbn1cblxuZXhwb3J0IHtzZWVkUmFuZG9tLCByYW5kb21JbnQsIHJhbmRvbVByb2J9OyIsImltcG9ydCAqIGFzIHN0YXRzIGZyb20gXCJzdGF0cy1saXRlXCI7XG5cbmNsYXNzIFNpbURhdGF7XG5cbiAgICBjb25zdHJ1Y3RvcihzaW11bGF0aW9uKXtcbiAgICAgICAgdGhpcy5zaW0gPSBzaW11bGF0aW9uO1xuICAgICAgICB0aGlzLmRhdGEgPSB7XCJzdGVwbnVtXCI6IFtdfTtcbiAgICAgICAgdGhpcy5jb2xsZWN0b3JzID0gW1xuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBvcHVsYXRpb25cIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJ0b3RhbF9jZWxsc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLmNlbGxzLmxlbmd0aCwgMCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJlbmVyZ2lzZWRfY2VsbHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgcC5jZWxscy5maWx0ZXIoYyA9PiBjLmVuZXJnaXNlZCkubGVuZ3RoLCAwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuY2VsbHMubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbm9tZV9zaXplX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwibXV0X2V4cF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5nZW5vbWUubXV0X2V4cCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwbGFudF9oZWlnaHRfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KC4uLnAuY2VsbHMubWFwKGMgPT4gYy55KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbGxlY3QgZGF0YSBmb3IgdGhlIGN1cnJlbnQgc3RlcFxuICAgICAqL1xuICAgIHJlY29yZFN0ZXAoKXtcbiAgICAgICAgdmFyIHN0ZXBEYXRhID0ge307XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGMpe1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGMuY29sbGVjdCh0aGlzLnNpbSk7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHN0ZXBEYXRhLCB2YWx1ZXMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLmRhdGFbXCJzdGVwbnVtXCJdLnB1c2godGhpcy5zaW0uc3RlcG51bSk7XG4gICAgICAgIE9iamVjdC5rZXlzKHN0ZXBEYXRhKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAgICAgaWYgKCEoayBpbiB0aGlzLmRhdGEpKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF0YVtrXS5wdXNoKHN0ZXBEYXRhW2tdKTsgXG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn1cblxuY2xhc3MgQ29sbGVjdG9ye1xuICAgIGNvbnN0cnVjdG9yKG5hbWUsIHR5cGVjbHMsIGNvbGxlY3RGdW5jKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy50eXBlID0gbmV3IHR5cGVjbHMobmFtZSk7XG4gICAgICAgIHRoaXMuZnVuYyA9IGNvbGxlY3RGdW5jO1xuICAgIH1cblxuICAgIGNvbGxlY3Qoc2ltKXtcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLmZ1bmMoc2ltKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZS50cmFuc2Zvcm0oZGF0YSk7XG4gICAgfVxufVxuXG5jbGFzcyBDb2xsZWN0b3JUeXBle1xuICAgIGNvbnN0cnVjdG9yKG5hbWUpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuaW1wbGVtZW50ZWQgbWV0aG9kXCIpO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybShkYXRhKXtcbiAgICAgICAgdmFyIHZhbHVlcyA9IHRoaXMudHJhbnNmb3JtRGF0YShkYXRhKTtcbiAgICAgICAgdmFyIHRyYW5zZm9ybWVkX2RhdGEgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXModmFsdWVzKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAgICAgdHJhbnNmb3JtZWRfZGF0YVt0aGlzLm5hbWUgKyBrXSA9IHZhbHVlc1trXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1lZF9kYXRhO1xuICAgIH1cbn1cblxuY2xhc3MgQXNJcyBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIlwiOiBkYXRhfTtcbiAgICB9XG59XG5cbmNsYXNzIFN1bW1hcnkgZXh0ZW5kcyBDb2xsZWN0b3JUeXBlIHtcblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSl7XG4gICAgICAgIHJldHVybiB7XCJtaW5cIjogTWF0aC5taW4oZGF0YSksIFwibWVhblwiOiBzdGF0cy5tZWFuKGRhdGEpLCBcIm1heFwiOiBNYXRoLm1heChkYXRhKX07XG4gICAgfVxufVxuZXhwb3J0IHtTaW1EYXRhfTsiLCJpbXBvcnQge3NlZWRSYW5kb20sIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtXb3JsZH0gZnJvbSBcIi4vd29ybGQuanNcIjtcbmltcG9ydCB7Qnl0ZUFycmF5LCBCbG9ja0ludGVycHJldGVyLCBQcm9tb3RvckludGVycHJldGVyLCBNdXRhdG9yfSBmcm9tIFwiLi9nZW5vbWUuanNcIjtcblxuY2xhc3MgU2ltdWxhdGlvblBhcmFtc3tcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXM9e30pe1xuICAgICAgICB0aGlzLnJhbmRvbV9zZWVkID0gMTtcbiAgICAgICAgdGhpcy5yZWNvcmRfaW50ZXJ2YWwgPSAxMDtcbiAgICAgICAgdGhpcy5zdGVwc19wZXJfZnJhbWUgPSAxO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX2ludGVydmFsID0gMDtcbiAgICAgICAgdGhpcy5kaXN0dXJiYW5jZV9zdHJlbmd0aCA9IDAuMTtcblxuICAgICAgICB0aGlzLndvcmxkX3dpZHRoID0gMjUwO1xuICAgICAgICB0aGlzLndvcmxkX2hlaWdodCA9IDQwO1xuICAgICAgICB0aGlzLmluaXRpYWxfcG9wdWxhdGlvbiA9IDI1MDtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW5lcmd5X3Byb2IgPSAwLjU7XG5cbiAgICAgICAgLy8gZGVhdGggcGFyYW1zXG4gICAgICAgIHRoaXMuZGVhdGhfZmFjdG9yID0gMC4yO1xuICAgICAgICB0aGlzLm5hdHVyYWxfZXhwID0gMDtcbiAgICAgICAgdGhpcy5lbmVyZ3lfZXhwID0gLTIuNTtcbiAgICAgICAgdGhpcy5sZWFub3Zlcl9mYWN0b3IgPSAwLjI7XG5cbiAgICAgICAgLy8gbXV0YXRpb25zXG4gICAgICAgIHRoaXMubXV0X3JlcGxhY2VfbW9kZSA9IFwiYnl0ZXdpc2VcIjtcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZSA9IDAuMDAyO1xuICAgICAgICB0aGlzLm11dF9pbnNlcnQgPSAwLjAwMDQ7XG4gICAgICAgIHRoaXMubXV0X2RlbGV0ZSA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZmFjdG9yID0gMS41O1xuICAgICAgICB0aGlzLmluaXRpYWxfbXV0X2V4cCA9IDA7XG5cbiAgICAgICAgdGhpcy5nZW5vbWVfaW50ZXJwcmV0ZXIgPSBcImJsb2NrXCI7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoID0gNDAwO1xuXG4gICAgICAgIC8vIGRpdmlkZSwgZmx5aW5nc2VlZCwgbG9jYWxzZWVkLCBtdXQrLCBtdXQtLCBzdGF0ZWJpdFxuICAgICAgICB0aGlzLmFjdGlvbl9tYXAgPSBbMjAwLCAyMCwgMCwgMTgsIDE4LCAwXTtcblxuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHBhcmFtcyk7XG4gICAgfVxufVxuXG5jbGFzcyBTaW11bGF0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG5cbiAgICAgICAgLy8gU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIHJhbmRvbVxuICAgICAgICAvLyB0aGlzIG1ha2VzIG91dCB0ZXN0cyByZXByb2R1Y2libGUgZ2l2ZW4gdGhlIHNhbWUgc2VlZCBpcyB1c2VkXG4gICAgICAgIC8vIGluIGZ1dHVyZSBpbnB1dCBwYXJhbWV0ZXJzXG4gICAgICAgIHNlZWRSYW5kb20odGhpcy5wYXJhbXMucmFuZG9tX3NlZWQpO1xuXG4gICAgICAgIHRoaXMud29ybGQgPSBuZXcgV29ybGQodGhpcy5wYXJhbXMud29ybGRfd2lkdGgsIHRoaXMucGFyYW1zLndvcmxkX2hlaWdodCk7XG4gICAgICAgIHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgPSB0aGlzLmdldEludGVycHJldGVyKCk7XG4gICAgICAgIHRoaXMubXV0X3VuaXRzID0gMTtcbiAgICAgICAgLy8gZW5zdXJlIG11dGF0aW9uIHVuaXRzIGlzIGNvbXBhdGlibGUgd2l0aCB0aGUgaW50ZXJwcmV0ZXIgdHlwZVxuICAgICAgICBpZih0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgQmxvY2tJbnRlcnByZXRlcil7XG4gICAgICAgICAgICB0aGlzLm11dF91bml0cyA9IDI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGVwbnVtID0gMDtcbiAgICB9XG5cbiAgICBnZXRJbnRlcnByZXRlcigpe1xuICAgICAgICBzd2l0Y2ggKHRoaXMucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcil7XG4gICAgICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCbG9ja0ludGVycHJldGVyKHRoaXMucGFyYW1zLmFjdGlvbl9tYXApO1xuICAgICAgICBjYXNlIFwicHJvbW90b3JcIjpcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbW90b3JJbnRlcnByZXRlcih0aGlzLnBhcmFtcy5hY3Rpb25fbWFwKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBpbnRlcnByZXRlciAke3RoaXMucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcn1gKTtcbiAgICAgICAgfSAgXG4gICAgfVxuXG4gICAgaW5pdF9wb3B1bGF0aW9uKCl7XG4gICAgICAgIC8vIHJhbmRvbWx5IGNob29zZSBzcG90cyB0byBzZWVkIHRoZSB3b3JsZCB3aXRoXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLnBhcmFtcy5pbml0aWFsX3BvcHVsYXRpb247IGkrKyl7XG4gICAgICAgICAgICB0aGlzLm5ld1NlZWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ld1NlZWQoKXtcbiAgICAgICAgLy8gY3JlYXRlIGEgcmFuZG9tIGdlbm9tZVxuICAgICAgICB2YXIgZ2Vub21lID0gQnl0ZUFycmF5LnJhbmRvbSh0aGlzLnBhcmFtcy5pbml0aWFsX2dlbm9tZV9sZW5ndGgpO1xuICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lKTtcbiAgICB9XG5cbiAgICBzdGVwKCl7XG4gICAgICAgIHRoaXMuc3RlcG51bSsrO1xuICAgICAgICB0aGlzLnNpbXVsYXRlRGVhdGgoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUxpZ2h0KCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMubXV0YXRlKCk7XG4gICAgfVxuXG4gICAgc2ltdWxhdGVBY3Rpb25zKCl7XG4gICAgICAgIHRoaXMud29ybGQucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgdmFyIHJ1bGVzID0gdGhpcy5nZW5vbWVJbnRlcnByZXRlci5pbnRlcnByZXQocGxhbnQuZ2Vub21lKTtcbiAgICAgICAgICAgIHBsYW50LmNlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsQWN0aW9uKGNlbGwsIHJ1bGVzKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBjZWxsQWN0aW9uKGNlbGwsIHJ1bGVzKXtcbiAgICAgICAgdmFyIHN0YXRlO1xuICAgICAgICBpZiAodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIEJsb2NrSW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgc3RhdGUgPSBjZWxsLnBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgUHJvbW90b3JJbnRlcnByZXRlcil7XG4gICAgICAgICAgICBzdGF0ZSA9IGNlbGwucGxhbnQuZ2V0U3RhdGUoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcnVsZXMuZm9yRWFjaChmdW5jdGlvbihydWxlKXtcbiAgICAgICAgICAgIC8vIGV4ZWN1dGUgb25lIGFjdGlvbiB1c2luZyB0aGUgZmlyc3QgbWF0Y2hpbmcgcnVsZVxuICAgICAgICAgICAgLy8gaWYgKHJ1bGUubWF0Y2hlcyhzdGF0ZSkpe1xuICAgICAgICAgICAgaWYgKHJ1bGUubWF0Y2hlcyhzdGF0ZSkpe1xuICAgICAgICAgICAgICAgIHJ1bGUuYWN0aW9uLmV4ZWN1dGUoY2VsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBjZWxsLnVwZGF0ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgbXV0YXRlKCl7XG4gICAgICAgIHZhciBtdXRhdG9yID0gbmV3IE11dGF0b3IodGhpcy5wYXJhbXMubXV0X2ZhY3RvciwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2UsIFxuICAgICAgICAgICAgdGhpcy5wYXJhbXMubXV0X2luc2VydCwgdGhpcy5wYXJhbXMubXV0X2RlbGV0ZSwgXG4gICAgICAgICAgICAwLCB0aGlzLnBhcmFtcy5tdXRfcmVwbGFjZV9tb2RlLCB0aGlzLm11dF91bml0cyk7XG4gICAgICAgIHRoaXMud29ybGQucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgbXV0YXRvci5tdXRhdGUocGxhbnQuZ2Vub21lKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIGVhY2ggcGxhbnQncyBjdXJyZW50IGRlYXRoIHByb2JhYmlsaXR5IHRvIHNpbXVsYXRlXG4gICAgICogd2hldGhlciBlYWNoIHBsYW50IGRpZXMgb24gdGhpcyBzdGVwXG4gICAgICovXG4gICAgc2ltdWxhdGVEZWF0aCgpe1xuICAgICAgICB2YXIgZGVhZF9wbGFudHMgPSBbXTtcbiAgICAgICAgdGhpcy53b3JsZC5wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICB2YXIgZGVhdGhQcm9iID0gcGxhbnQuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3JcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAocmFuZG9tUHJvYihkZWF0aFByb2IucHJvYikpe1xuICAgICAgICAgICAgICAgIGRlYWRfcGxhbnRzLnB1c2gocGxhbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgZGVhZF9wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChwbGFudCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNpbXVsYXRlIGxpZ2h0LiBTdW5saWdodCB0cmF2ZXJzZXMgZnJvbSB0aGUgY2VpbGluZyBvZiB0aGUgd29ybGRcbiAgICAgKiBkb3dud2FyZHMgdmVydGljYWxseS4gSXQgaXMgY2F1Z2h0IGJ5IGEgcGxhbnQgY2VsbCB3aXRoIGEgcHJvYmFiaWxpdHlcbiAgICAgKiB3aGljaCBjYXVzZXMgdGhhdCBjZWxsIHRvIGJlIGVuZXJnaXNlZC5cbiAgICAgKi9cbiAgICBzaW11bGF0ZUxpZ2h0KCl7XG4gICAgICAgIGZvcih2YXIgeD0wOyB4PHRoaXMud29ybGQud2lkdGg7IHgrKyl7XG4gICAgICAgICAgICBmb3IodmFyIHk9MDsgeTx0aGlzLndvcmxkLmhlaWdodDsgeSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMud29ybGQuY2VsbHNbeF1bdGhpcy53b3JsZC5oZWlnaHQteS0xXTtcbiAgICAgICAgICAgICAgICBpZihjZWxsICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocmFuZG9tUHJvYih0aGlzLnBhcmFtcy5lbmVyZ3lfcHJvYikpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5lbmVyZ2lzZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc307IiwiaW1wb3J0IHtTaW11bGF0aW9uLCBTaW11bGF0aW9uUGFyYW1zfSBmcm9tIFwiLi9zaW11bGF0aW9uLmpzXCI7XG5pbXBvcnQge1NpbURhdGF9IGZyb20gXCIuL3NpbWRhdGEuanNcIjtcblxubGV0IHNpbXVsYXRpb24gPSBudWxsO1xubGV0IGRhdGEgPSBudWxsO1xubGV0IHJ1bm5pbmcgPSBmYWxzZTtcbmxldCBjZWxsU2l6ZSA9IDg7XG5jb25zdCBUQVJHRVRfRlBTID0gNjA7XG5jb25zdCBGUkFNRV9JTlRFUlZBTF9NUyA9IDEwMDAgLyBUQVJHRVRfRlBTO1xubGV0IGxhc3RGcmFtZVRpbWUgPSAwO1xuXG5zZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgY29uc3QgbXNnID0gZXZlbnQuZGF0YTtcbiAgICBzd2l0Y2ggKG1zZy50eXBlKSB7XG4gICAgY2FzZSBcImluaXRcIjpcbiAgICAgICAgaW5pdFNpbShtc2cucGFyYW1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0YXJ0XCI6XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBsb29wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdG9wXCI6XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0ZXBcIjpcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZ2V0Q2VsbFwiOlxuICAgICAgICBzZW5kQ2VsbEluZm8obXNnLngsIG1zZy55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImRpc3R1cmJcIjpcbiAgICAgICAgYXBwbHlEaXN0dXJiYW5jZShtc2cuc3RyZW5ndGgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImtpbGxDZWxsXCI6XG4gICAgICAgIGtpbGxDZWxsQXQobXNnLngsIG1zZy55KTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJ1cGRhdGVEaXN0dXJiYW5jZVwiOlxuICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9pbnRlcnZhbCA9IG1zZy5pbnRlcnZhbDtcbiAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGggPSBtc2cuc3RyZW5ndGg7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGluaXRTaW0ocGFyYW1zKSB7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGNvbnN0IHNpbV9wYXJhbXMgPSBuZXcgU2ltdWxhdGlvblBhcmFtcyhwYXJhbXMpO1xuICAgIGNlbGxTaXplID0gcGFyYW1zLmNlbGxTaXplIHx8IDg7XG4gICAgc2ltdWxhdGlvbiA9IG5ldyBTaW11bGF0aW9uKHNpbV9wYXJhbXMpO1xuICAgIGRhdGEgPSBuZXcgU2ltRGF0YShzaW11bGF0aW9uKTtcbiAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbigpO1xuICAgIHB1c2hGcmFtZSgpO1xufVxuXG5mdW5jdGlvbiBsb29wKCkge1xuICAgIGlmICghcnVubmluZykgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3BmID0gc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3BmOyBpKyspIHtcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdEZyYW1lVGltZSA+PSBGUkFNRV9JTlRFUlZBTF9NUykge1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgbGFzdEZyYW1lVGltZSA9IG5vdztcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KGxvb3AsIDApO1xufVxuXG5mdW5jdGlvbiBkb1N0ZXAoKSB7XG4gICAgc2ltdWxhdGlvbi5zdGVwKCk7XG5cbiAgICAvLyBQZXJpb2RpYyBkaXN0dXJiYW5jZVxuICAgIGNvbnN0IGRpID0gc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWw7XG4gICAgaWYgKGRpID4gMCAmJiBzaW11bGF0aW9uLnN0ZXBudW0gJSBkaSA9PT0gMCkge1xuICAgICAgICBhcHBseURpc3R1cmJhbmNlKHNpbXVsYXRpb24ucGFyYW1zLmRpc3R1cmJhbmNlX3N0cmVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoc2ltdWxhdGlvbi5zdGVwbnVtICUgc2ltdWxhdGlvbi5wYXJhbXMucmVjb3JkX2ludGVydmFsID09PSAwIHx8IHNpbXVsYXRpb24uc3RlcG51bSA9PT0gMSkge1xuICAgICAgICBkYXRhLnJlY29yZFN0ZXAoKTtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiBcInN0YXRzXCIsXG4gICAgICAgICAgICBkYXRhOiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRhdGEuZGF0YSkpLFxuICAgICAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlEaXN0dXJiYW5jZShzdHJlbmd0aCkge1xuICAgIGNvbnN0IHdvcmxkID0gc2ltdWxhdGlvbi53b3JsZDtcbiAgICBjb25zdCBwbGFudHMgPSB3b3JsZC5wbGFudHM7XG4gICAgaWYgKHBsYW50cy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBudW1Ub0tpbGwgPSBNYXRoLm1heCgxLCBNYXRoLmZsb29yKHN0cmVuZ3RoICogcGxhbnRzLmxlbmd0aCkpO1xuICAgIC8vIFNodWZmbGUgYSBzYW1wbGUgYW5kIGtpbGxcbiAgICBjb25zdCBzaHVmZmxlZCA9IHBsYW50cy5zbGljZSgpLnNvcnQoKCkgPT4gTWF0aC5yYW5kb20oKSAtIDAuNSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1Ub0tpbGwgJiYgaSA8IHNodWZmbGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIENoZWNrIHBsYW50IHN0aWxsIGFsaXZlIChub3Qga2lsbGVkIGJ5IHByZXZpb3VzIGl0ZXJhdGlvbilcbiAgICAgICAgaWYgKHdvcmxkLnBsYW50cy5pbmNsdWRlcyhzaHVmZmxlZFtpXSkpIHtcbiAgICAgICAgICAgIHdvcmxkLmtpbGxQbGFudChzaHVmZmxlZFtpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGtpbGxDZWxsQXQoeCwgeSkge1xuICAgIGNvbnN0IGNlbGwgPSBzaW11bGF0aW9uLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgaWYgKGNlbGwgJiYgY2VsbC5wbGFudCkge1xuICAgICAgICBzaW11bGF0aW9uLndvcmxkLmtpbGxQbGFudChjZWxsLnBsYW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHB1c2hGcmFtZSgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBzaW11bGF0aW9uLndvcmxkLmdldFBpeGVsQnVmZmVyKGNlbGxTaXplKTtcbiAgICAvLyBUcmFuc2ZlciBvd25lcnNoaXAgb2YgdGhlIEFycmF5QnVmZmVyIGZvciB6ZXJvLWNvcHkgcGVyZm9ybWFuY2VcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJmcmFtZVwiLFxuICAgICAgICBidWZmZXI6IHJlc3VsdC5idWZmZXIuYnVmZmVyLFxuICAgICAgICB3aWR0aDogcmVzdWx0LndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHJlc3VsdC5oZWlnaHQsXG4gICAgICAgIGNlbGxDb3VudDogcmVzdWx0LmNlbGxDb3VudCxcbiAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgfSwgW3Jlc3VsdC5idWZmZXIuYnVmZmVyXSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRDZWxsSW5mbyh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoIWNlbGwgfHwgIWNlbGwucGxhbnQgfHwgIWNlbGwucGxhbnQuZ2Vub21lKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBwbGFudCA9IGNlbGwucGxhbnQ7XG4gICAgICAgIGNvbnN0IHJ1bGVzID0gc2ltdWxhdGlvbi5nZW5vbWVJbnRlcnByZXRlci5pbnRlcnByZXQocGxhbnQuZ2Vub21lKTtcbiAgICAgICAgY29uc3QgbmVpZ2hib3VyaG9vZCA9IHBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIGxldCBtYXRjaGluZ19ydWxlID0gXCJOb25lXCI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChydWxlc1tpXS5zdGF0ZSA9PT0gbmVpZ2hib3VyaG9vZCkge1xuICAgICAgICAgICAgICAgIG1hdGNoaW5nX3J1bGUgPSBgIyR7aX0gJHtydWxlc1tpXX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlYXRoID0gcGxhbnQuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmxlYW5vdmVyX2ZhY3RvclxuICAgICAgICApO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6IFwiY2VsbEluZm9cIixcbiAgICAgICAgICAgIGZvdW5kOiB0cnVlLFxuICAgICAgICAgICAgY2VsbFN0cjogY2VsbC50b1N0cmluZygpLFxuICAgICAgICAgICAgbmVpZ2hib3VyaG9vZCxcbiAgICAgICAgICAgIG1hdGNoaW5nX3J1bGUsXG4gICAgICAgICAgICBkZWF0aDogSlNPTi5zdHJpbmdpZnkoZGVhdGgpLFxuICAgICAgICAgICAgZ2Vub21lTGVuZ3RoOiBwbGFudC5nZW5vbWUubGVuZ3RoLFxuICAgICAgICAgICAgbXV0RXhwOiBwbGFudC5nZW5vbWUubXV0X2V4cCxcbiAgICAgICAgICAgIHJ1bGVzOiBydWxlcy5tYXAociA9PiByLnRvU3RyaW5nKCkpXG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7cmFuZG9tSW50fSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7UGxhbnR9IGZyb20gXCIuL3BsYW50LmpzXCI7XG5pbXBvcnQgeyBDZWxsIH0gZnJvbSBcIi4vY2VsbC5qc1wiO1xuXG5jbGFzcyBXb3JsZCB7XG4gICAgY29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCl7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5jZWxscyA9IFtdO1xuICAgICAgICAvLyBpbml0aWFsaXNlIHRoZSB3b3JsZCBsYXR0aWNlIHRvIGFsbCBudWxsc1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLndpZHRoOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5jZWxscy5wdXNoKFtdKTtcbiAgICAgICAgICAgIGZvcih2YXIgaj0wOyBqPHRoaXMuaGVpZ2h0OyBqKyspe1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbHNbaV1bal0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGFudHMgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyBhcnJheSBvZiB4IHBvc2l0aW9ucyBhdCB5PTAgd2hlcmUgbm8gY2VsbCBleGlzdHNcbiAgICAgKi9cbiAgICBnZXRGbG9vclNwYWNlKCl7XG4gICAgICAgIHZhciBlbXB0eVNwYWNlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLndpZHRoOyBpKyspe1xuICAgICAgICAgICAgaWYodGhpcy5jZWxsc1tpXVswXSA9PT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZW1wdHlTcGFjZXMucHVzaChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZW1wdHlTcGFjZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RyYXRlZ2llcyBmb3Igc293aW5nIGEgc2VlZCBvbiB0aGUgd29ybGQgZmxvb3JcbiAgICAgKiBAcGFyYW0geyp9IGdlbm9tZSB0aGUgZ2Vub21lIHVzZWQgYnkgdGhlIG5ldyBzZWVkXG4gICAgICogQHBhcmFtIHsqfSBuZWFyWCBpZiBub3QgbnVsbCwgdHJ5IHRvIHNvdyBhIHNlZWQgYXMgY2xvc2VcbiAgICAgKiBhcyBwb3NzaWJsZSB0byB0aGlzIGxvY2F0aW9uXG4gICAgICogXG4gICAgICogQHJldHVybiB0cnVlIGlmIGEgc2VlZCB3YXMgc3VjY2VzZnVsbHkgcGxhbnRlZCwgZmFsc2UgaWZcbiAgICAgKiB0aGVyZSB3YXMgbm8gc3BhY2UgdG8gc293IGEgc2VlZC5cbiAgICAgKi9cbiAgICBzZWVkKGdlbm9tZSwgbmVhclgpe1xuICAgICAgICAvLyBmaW5kIGEgcmFuZG9tIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBlbXB0eVNwYWNlcyA9IHRoaXMuZ2V0Rmxvb3JTcGFjZSgpO1xuICAgICAgICBpZihlbXB0eVNwYWNlcy5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobmVhclggIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdFggPSBudWxsO1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RfZGlmZiA9IHRoaXMud2lkdGg7XG4gICAgICAgICAgICBlbXB0eVNwYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHhwb3Mpe1xuICAgICAgICAgICAgICAgIHZhciBkaWZmID0gTWF0aC5hYnMobmVhclgteHBvcyk7XG4gICAgICAgICAgICAgICAgaWYoZGlmZiA8IG5lYXJlc3RfZGlmZil7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RfZGlmZiA9IGRpZmY7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RYID0geHBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc293UGxhbnQoZ2Vub21lLCBuZWFyZXN0WCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4ID0gZW1wdHlTcGFjZXNbcmFuZG9tSW50KDAsIGVtcHR5U3BhY2VzLmxlbmd0aC0xKV07XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW3hdWzBdICE9PSBudWxsKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNwYWNlIGlzIHRha2VuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc293UGxhbnQoZ2Vub21lLCB4KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc293UGxhbnQoZ2Vub21lLCB4KXtcbiAgICAgICAgeCA9IHRoaXMuZ2V0WCh4KTtcbiAgICAgICAgdmFyIHBsYW50ID0gbmV3IFBsYW50KHgsIHRoaXMsIGdlbm9tZSk7XG4gICAgICAgIHRoaXMucGxhbnRzLnB1c2gocGxhbnQpO1xuICAgICAgICB0aGlzLmFkZENlbGwocGxhbnQuY2VsbHNbMF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBwbGFudCBmcm9tIHdvcmxkIHBsYW50IGxpc3QuXG4gICAgICogUmVtb3ZlIGFsbCBjZWxscyBmcm9tIGNlbGwgZ3JpZFxuICAgICAqL1xuICAgIGtpbGxQbGFudChwbGFudCl7XG4gICAgICAgIHRoaXMucGxhbnRzLnNwbGljZSh0aGlzLnBsYW50cy5pbmRleE9mKHBsYW50KSwgMSk7XG4gICAgICAgIHBsYW50LmNlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IG51bGw7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIGdldFgoeCl7XG4gICAgICAgIGlmKHggPCAwKXtcbiAgICAgICAgICAgIHggPSB0aGlzLndpZHRoICsgeDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCAlIHRoaXMud2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0Q2VsbCh4LCB5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2VsbHNbdGhpcy5nZXRYKHgpXVt5XTtcbiAgICB9XG5cbiAgICBhZGRDZWxsKGNlbGwpe1xuICAgICAgICBpZiAodGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gPSBjZWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpe1xuICAgICAgICBjb25zdCB3ID0gdGhpcy53aWR0aCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBoID0gdGhpcy5oZWlnaHQgKiBjZWxsU2l6ZTtcbiAgICAgICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHcgKiBoICogNCk7IC8vIFJHQkEsIGluaXRpYWxpemVkIHRvIDAgKHRyYW5zcGFyZW50L2JsYWNrKVxuXG4gICAgICAgIHRoaXMucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgY29uc3QgW2Jhc2VSLCBiYXNlRywgYmFzZUJdID0gdGhpcy5nZXRCYXNlQ29sb3VyKHBsYW50KTtcbiAgICAgICAgICAgIHBsYW50LmNlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCl7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sID0gY2VsbC5lbmVyZ2lzZWRcbiAgICAgICAgICAgICAgICAgICAgPyBbYmFzZVIsIGJhc2VHLCBiYXNlQl1cbiAgICAgICAgICAgICAgICAgICAgOiBbTWF0aC5yb3VuZChiYXNlUiAqIDAuNyksIE1hdGgucm91bmQoYmFzZUcgKiAwLjcpLCBNYXRoLnJvdW5kKGJhc2VCICogMC43KV07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBweDAgPSBjZWxsLnggKiBjZWxsU2l6ZTtcbiAgICAgICAgICAgICAgICAvLyB3b3JsZCB5PTAgaXMgZ3JvdW5kIChib3R0b20pLCBjYW52YXMgeT0wIGlzIHRvcFxuICAgICAgICAgICAgICAgIGNvbnN0IHB5MCA9ICh0aGlzLmhlaWdodCAtIDEgLSBjZWxsLnkpICogY2VsbFNpemU7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkeSA9IDA7IGR5IDwgY2VsbFNpemU7IGR5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZHggPSAwOyBkeCA8IGNlbGxTaXplOyBkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IDFweCBib3JkZXI6IGRhcmtlbiBlZGdlIHBpeGVsc1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNCb3JkZXIgPSBkeCA9PT0gMCB8fCBkeSA9PT0gMCB8fCBkeCA9PT0gY2VsbFNpemUgLSAxIHx8IGR5ID09PSBjZWxsU2l6ZSAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBbciwgZywgYl0gPSBpc0JvcmRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gW01hdGgucm91bmQoY29sWzBdICogMC41KSwgTWF0aC5yb3VuZChjb2xbMV0gKiAwLjUpLCBNYXRoLnJvdW5kKGNvbFsyXSAqIDAuNSldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpZHggPSAoKHB5MCArIGR5KSAqIHcgKyAocHgwICsgZHgpKSAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4XSAgICAgPSByO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDFdID0gZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IGI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgM10gPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHsgYnVmZmVyOiBidWYsIHdpZHRoOiB3LCBoZWlnaHQ6IGgsIGNlbGxDb3VudDogdGhpcy5wbGFudHMucmVkdWNlKChzLHApPT5zK3AuY2VsbHMubGVuZ3RoLDApIH07XG4gICAgfVxuXG4gICAgZ2V0QmFzZUNvbG91cihwbGFudCl7XG4gICAgICAgIHZhciBpID0gcGxhbnQuY2VsbHNbMF0ueCAlIGNTY2FsZS5sZW5ndGg7XG4gICAgICAgIHJldHVybiBjU2NhbGVbaV07XG4gICAgfVxufVxuXG4vLyBodHRwOi8vY29sb3JicmV3ZXIyLm9yZy8/dHlwZT1xdWFsaXRhdGl2ZSZzY2hlbWU9U2V0MyZuPTgg4oCUIGFzIHJhdyBbUixHLEJdIHR1cGxlc1xudmFyIGNTY2FsZSA9IFtcbiAgICBbMTQxLDIxMSwxOTldLFsyNTUsMjU1LDE3OV0sWzE5MCwxODYsMjE4XSxbMjUxLDEyOCwxMTRdLFxuICAgIFsxMjgsMTc3LDIxMV0sWzI1MywxODAsOThdLFsxNzksMjIyLDEwNV0sWzI1MiwyMDUsMjI5XVxuXTtcblxuXG5leHBvcnQgeyBXb3JsZCB9OyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdGxvYWRlZDogZmFsc2UsXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG5cdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLy8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbl9fd2VicGFja19yZXF1aXJlX18ubSA9IF9fd2VicGFja19tb2R1bGVzX187XG5cbi8vIHRoZSBzdGFydHVwIGZ1bmN0aW9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuXHQvLyBUaGlzIGVudHJ5IG1vZHVsZSBkZXBlbmRzIG9uIG90aGVyIGxvYWRlZCBjaHVua3MgYW5kIGV4ZWN1dGlvbiBuZWVkIHRvIGJlIGRlbGF5ZWRcblx0dmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8odW5kZWZpbmVkLCBbXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzXCIpKSlcblx0X193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyhfX3dlYnBhY2tfZXhwb3J0c19fKTtcblx0cmV0dXJuIF9fd2VicGFja19leHBvcnRzX187XG59O1xuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmFtZEQgPSBmdW5jdGlvbiAoKSB7XG5cdHRocm93IG5ldyBFcnJvcignZGVmaW5lIGNhbm5vdCBiZSB1c2VkIGluZGlyZWN0Jyk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kTyA9IHt9OyIsInZhciBkZWZlcnJlZCA9IFtdO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5PID0gKHJlc3VsdCwgY2h1bmtJZHMsIGZuLCBwcmlvcml0eSkgPT4ge1xuXHRpZihjaHVua0lkcykge1xuXHRcdHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcblx0XHRmb3IodmFyIGkgPSBkZWZlcnJlZC5sZW5ndGg7IGkgPiAwICYmIGRlZmVycmVkW2kgLSAxXVsyXSA+IHByaW9yaXR5OyBpLS0pIGRlZmVycmVkW2ldID0gZGVmZXJyZWRbaSAtIDFdO1xuXHRcdGRlZmVycmVkW2ldID0gW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldO1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXIgbm90RnVsZmlsbGVkID0gSW5maW5pdHk7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWQubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldID0gZGVmZXJyZWRbaV07XG5cdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaHVua0lkcy5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYgKChwcmlvcml0eSAmIDEgPT09IDAgfHwgbm90RnVsZmlsbGVkID49IHByaW9yaXR5KSAmJiBPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLk8pLmV2ZXJ5KChrZXkpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fLk9ba2V5XShjaHVua0lkc1tqXSkpKSkge1xuXHRcdFx0XHRjaHVua0lkcy5zcGxpY2Uoai0tLCAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZ1bGZpbGxlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZihwcmlvcml0eSA8IG5vdEZ1bGZpbGxlZCkgbm90RnVsZmlsbGVkID0gcHJpb3JpdHk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKGZ1bGZpbGxlZCkge1xuXHRcdFx0ZGVmZXJyZWQuc3BsaWNlKGktLSwgMSlcblx0XHRcdHZhciByID0gZm4oKTtcblx0XHRcdGlmIChyICE9PSB1bmRlZmluZWQpIHJlc3VsdCA9IHI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3MgYW5kIGNodW5rcyB0aGF0IHRoZSBlbnRyeXBvaW50IGRlcGVuZHMgb25cbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5idW5kbGUuanNcIjtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5ubWQgPSAobW9kdWxlKSA9PiB7XG5cdG1vZHVsZS5wYXRocyA9IFtdO1xuXHRpZiAoIW1vZHVsZS5jaGlsZHJlbikgbW9kdWxlLmNoaWxkcmVuID0gW107XG5cdHJldHVybiBtb2R1bGU7XG59OyIsInZhciBzY3JpcHRVcmw7XG5pZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5nLmltcG9ydFNjcmlwdHMpIHNjcmlwdFVybCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5sb2NhdGlvbiArIFwiXCI7XG52YXIgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCAmJiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ1NDUklQVCcpXG5cdFx0c2NyaXB0VXJsID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG5cdGlmICghc2NyaXB0VXJsKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKTtcblx0XHRpZihzY3JpcHRzLmxlbmd0aCkge1xuXHRcdFx0dmFyIGkgPSBzY3JpcHRzLmxlbmd0aCAtIDE7XG5cdFx0XHR3aGlsZSAoaSA+IC0xICYmICghc2NyaXB0VXJsIHx8ICEvXmh0dHAocz8pOi8udGVzdChzY3JpcHRVcmwpKSkgc2NyaXB0VXJsID0gc2NyaXB0c1tpLS1dLnNyYztcblx0XHR9XG5cdH1cbn1cbi8vIFdoZW4gc3VwcG9ydGluZyBicm93c2VycyB3aGVyZSBhbiBhdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIHlvdSBtdXN0IHNwZWNpZnkgYW4gb3V0cHV0LnB1YmxpY1BhdGggbWFudWFsbHkgdmlhIGNvbmZpZ3VyYXRpb25cbi8vIG9yIHBhc3MgYW4gZW1wdHkgc3RyaW5nIChcIlwiKSBhbmQgc2V0IHRoZSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyB2YXJpYWJsZSBmcm9tIHlvdXIgY29kZSB0byB1c2UgeW91ciBvd24gbG9naWMuXG5pZiAoIXNjcmlwdFVybCkgdGhyb3cgbmV3IEVycm9yKFwiQXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXJcIik7XG5zY3JpcHRVcmwgPSBzY3JpcHRVcmwucmVwbGFjZSgvXmJsb2I6LywgXCJcIikucmVwbGFjZSgvIy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcPy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcL1teXFwvXSskLywgXCIvXCIpO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5wID0gc2NyaXB0VXJsOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBjaHVua3Ncbi8vIFwiMVwiIG1lYW5zIFwiYWxyZWFkeSBsb2FkZWRcIlxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJzcmNfc2ltdWxhdGlvbl93b3JrZXJfanNcIjogMVxufTtcblxuLy8gaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0dmFyIFtjaHVua0lkcywgbW9yZU1vZHVsZXMsIHJ1bnRpbWVdID0gZGF0YTtcblx0Zm9yKHZhciBtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG5cdFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLm1bbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHR3aGlsZShjaHVua0lkcy5sZW5ndGgpXG5cdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRzLnBvcCgpXSA9IDE7XG5cdHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uKGRhdGEpO1xufTtcbl9fd2VicGFja19yZXF1aXJlX18uZi5pID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdC8vIFwiMVwiIGlzIHRoZSBzaWduYWwgZm9yIFwiYWxyZWFkeSBsb2FkZWRcIlxuXHRpZighaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG5cdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdGltcG9ydFNjcmlwdHMoX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgX193ZWJwYWNrX3JlcXVpcmVfXy51KGNodW5rSWQpKTtcblx0XHR9XG5cdH1cbn07XG5cbnZhciBjaHVua0xvYWRpbmdHbG9iYWwgPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gfHwgW107XG52YXIgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24gPSBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IGluc3RhbGxDaHVuaztcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdCIsInZhciBuZXh0ID0gX193ZWJwYWNrX3JlcXVpcmVfXy54O1xuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5lKFwidmVuZG9ycy1ub2RlX21vZHVsZXNfc2VlZHJhbmRvbV9pbmRleF9qcy1ub2RlX21vZHVsZXNfc3RhdHMtbGl0ZV9zdGF0c19qc1wiKS50aGVuKG5leHQpO1xufTsiLCIiLCIvLyBydW4gc3RhcnR1cFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLngoKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==