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

    if (simulation.stepnum % simulation.params.record_interval === 0 || simulation.stepnum === 1) {
        data.recordStep();
        // send stats snapshot (clone the arrays to avoid transfer issues)
        self.postMessage({
            type: "stats",
            data: JSON.parse(JSON.stringify(data.data)),
            stepnum: simulation.stepnum
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGtDOzs7OztXQ2xCQTs7V0FFQTtXQUNBO1dBQ0E7V0FDQTtXQUNBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsYUFBYTtXQUNiO1dBQ0E7V0FDQTtXQUNBOztXQUVBO1dBQ0E7V0FDQTs7V0FFQTs7V0FFQSxrQjs7Ozs7V0NwQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7VUVIQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbGluZGV2b2wvaWdub3JlZHwvVXNlcnMvbWF0dC9saW5kZXZvbC1qcy9ub2RlX21vZHVsZXMvc2VlZHJhbmRvbXxjcnlwdG8iLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvYWN0aW9ucy5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9jZWxsLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2dlbm9tZS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9wbGFudC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9yYW5kb20uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltZGF0YS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW11bGF0aW9uLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3dvcmxkLmpzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9hbWQgZGVmaW5lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9hbWQgb3B0aW9ucyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvY2h1bmsgbG9hZGVkIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZW5zdXJlIGNodW5rIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbm9kZSBtb2R1bGUgZGVjb3JhdG9yIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9pbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3N0YXJ0dXAgY2h1bmsgZGVwZW5kZW5jaWVzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiAoaWdub3JlZCkgKi8iLCJjb25zdCBORUlHSEJPVVJIT09EID0gW1stMSwtMV0sIFswLC0xXSwgWzEsLTFdLCBbLTEsMF0sIFsxLDBdLCBbLTEsMV0sIFswLDFdLCBbMSwxXV07XG5jb25zdCBNVVRfSU5DUkVNRU5UID0gMC4wMDE7XG5cbmNsYXNzIEFjdGlvbntcbiAgICBjb25zdHJ1Y3RvcihhY3Rpb25Db2RlKXtcbiAgICAgICAgdGhpcy5jb2RlID0gYWN0aW9uQ29kZTtcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1zKCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGV4ZWN1dGUoY2VsbCl7XG4gICAgICAgIC8vIGFjdGlvbnMgYXJlIHR5cGljYWxseSBvbmx5IGNhcnJpZWQgb3V0IGlmIHRoZSBjZWxsIGhhcyBlbmVyZ3lcbiAgICAgICAgLy8gYW5kIHRoZSBjZWxsIGxvc2VzIGVuZXJneSBhcyBhIHJlc3VsdC5cbiAgICAgICAgaWYgKGNlbGwuZW5lcmdpc2VkKXtcbiAgICAgICAgICAgIHZhciBzdWNjZXNzID0gdGhpcy5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gIXN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgZG9BY3Rpb24oY2VsbCl7XG5cbiAgICB9XG59XG5cbmNsYXNzIERpdmlkZSBleHRlbmRzIEFjdGlvbntcblxuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICAvLyB0aGUgMiBsZWFzdCBzaWduaWZpY2FudCBiaXRzIG9mIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAvLyBkZXRlcm1pbmVzIHdoaWNoIGRpcmVjdGlvbiB0aGUgZGl2aWRlIGFjdGlvbiBpcyBmb3JcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLmdldERpcmVjdGlvbigpO1xuICAgICAgICBjZWxsLnBsYW50Lmdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1zKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERpcmVjdGlvbigpO1xuICAgIH1cblxuICAgIGdldERpcmVjdGlvbigpe1xuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcbiAgICAgICAgLy8gJiB3aXRoIDAwMDAwMTExIHRvIG1hc2sgb3V0IGxlYXN0IHNpZyBiaXRzXG4gICAgICAgIHZhciBkaXJlY3Rpb25Db2RlID0gdGhpcy5jb2RlICYgNztcbiAgICAgICAgcmV0dXJuIE5FSUdIQk9VUkhPT0RbZGlyZWN0aW9uQ29kZV07XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBkaXZpZGUgJHt0aGlzLmdldERpcmVjdGlvbigpfWA7XG4gICAgfVxufVxuXG5jbGFzcyBNdXRhdGVQbHVzIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgY2VsbC5wbGFudC5nZW5vbWUubXV0X2V4cCArPSBNVVRfSU5DUkVNRU5UO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJtdXQrXCI7XG4gICAgfVxufVxuXG5jbGFzcyBNdXRhdGVNaW51cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgLT0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0LVwiO1xuICAgIH1cbn1cblxuY2xhc3MgRmx5aW5nU2VlZCBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIHJldHVybiBjZWxsLnBsYW50LndvcmxkLnNlZWQoY2VsbC5wbGFudC5nZW5vbWUuY29weSgpKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJmbHlpbmdzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBMb2NhbFNlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSwgY2VsbC54KTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJsb2NhbHNlZWRcIjtcbiAgICB9XG59XG5cbmNsYXNzIFN0YXRlQml0TiBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKSB7XG4gICAgICAgIGNlbGwubmV4dEludGVybmFsU3RhdGUgPSBjZWxsLm5leHRJbnRlcm5hbFN0YXRlICYgTWF0aC5wb3coMiwgdGhpcy5nZXROdGhCaXQoKSk7XG4gICAgICAgIC8vIHRoaXMgYWN0aW9uIGRvZXMgbm90IGNvbnN1bWUgZW5lcmd5XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXROdGhCaXQoKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMTExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICByZXR1cm4gdGhpcy5jb2RlICYgMTU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBTdGF0ZUJpdCAke3RoaXMuZ2V0TnRoQml0KCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIEFjdGlvbk1hcCB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nKXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbWFwcGluZztcbiAgICAgICAgdGhpcy5hY3Rpb25zID0gW0RpdmlkZSwgRmx5aW5nU2VlZCwgTG9jYWxTZWVkLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgU3RhdGVCaXROXTtcbiAgICB9XG5cbiAgICBnZXRBY3Rpb24oYWN0aW9uQ29kZSl7XG4gICAgICAgIHZhciBtYXBwaW5nQ291bnQgPSAwO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLm1hcHBpbmcubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgbWFwcGluZ0NvdW50ICs9IHRoaXMubWFwcGluZ1tpXTtcbiAgICAgICAgICAgIGlmIChhY3Rpb25Db2RlIDwgbWFwcGluZ0NvdW50KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1tpXShhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBgQWN0aW9uIGNvZGUgJHthY3Rpb25Db2RlfSBkb2VzIG5vdCBtYXAgdG8gYW4gYWN0aW9uYDtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHtEaXZpZGUsIE11dGF0ZVBsdXMsIE11dGF0ZU1pbnVzLCBMb2NhbFNlZWQsIEZseWluZ1NlZWQsIEFjdGlvbk1hcCwgTkVJR0hCT1VSSE9PRH07IiwiXG5jbGFzcyBDZWxse1xuICAgIGNvbnN0cnVjdG9yKHBsYW50LCB4LCB5KXtcbiAgICAgICAgdGhpcy5wbGFudCA9IHBsYW50O1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gMDtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZ2V0IGVuZXJnaXNlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuZXJnaXNlZDtcbiAgICB9XG5cbiAgICBzZXQgZW5lcmdpc2VkKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmVyZ2lzZWQgPT09IHZhbHVlKSByZXR1cm47XG4gICAgICAgIHRoaXMuX2VuZXJnaXNlZCA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5wbGFudCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudCsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYW50LmVuZXJnaXNlZENvdW50LS07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVTdGF0ZSgpe1xuICAgICAgICB0aGlzLmludGVybmFsU3RhdGUgPSB0aGlzLm5leHRJbnRlcm5hbFN0YXRlO1xuICAgICAgICB0aGlzLm5leHRJbnRlcm5hbFN0YXRlID0gMDtcbiAgICB9XG5cbiAgICBkcmF3KGN0eCwgeCwgeSwgc2l6ZSwgY29sb3VyKXtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG91cjtcbiAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgICAgICAvL2N0eC5zdHJva2VSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgQ2VsbCBhdCAoJHt0aGlzLnh9LCAke3RoaXMueX0pIGVuZXJneTogJHt0aGlzLmVuZXJnaXNlZH1gO1xuICAgIH1cbn1cblxuZXhwb3J0IHtDZWxsfTsiLCJpbXBvcnQge3JhbmRvbUludCwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge0FjdGlvbk1hcH0gZnJvbSBcIi4vYWN0aW9ucy5qc1wiO1xuXG5jbGFzcyBCeXRlQXJyYXkgZXh0ZW5kcyBBcnJheXtcblxuICAgIGNvbnN0cnVjdG9yKGxlbmd0aD0wLCBpbml0aWFsX211dF9leHA9MCl7XG4gICAgICAgIHN1cGVyKGxlbmd0aCk7XG4gICAgICAgIHRoaXMubXV0X2V4cCA9IGluaXRpYWxfbXV0X2V4cDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbShhcnIpe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGFyci5sZW5ndGgpO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gYXJyW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmFuZG9tKGxlbmd0aCl7XG4gICAgICAgIHZhciBiYSA9IG5ldyBCeXRlQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8YmEubGVuZ3RoO2krKyl7XG4gICAgICAgICAgICBiYVtpXSA9IHJhbmRvbUludCgwLCAyNTUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICBjb3B5KCl7XG4gICAgICAgIHZhciBuZXdBcnIgPSBuZXcgQnl0ZUFycmF5KHRoaXMubGVuZ3RoLCB0aGlzLmluaXRpYWxfbXV0X2V4cCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgbmV3QXJyW2ldID0gdGhpc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3QXJyO1xuICAgIH1cblxufVxuXG5jbGFzcyBNdXRhdG9ye1xuICAgIGNvbnN0cnVjdG9yKHByb2IsIHByb2JfcmVwbGFjZW1lbnQsIHByb2JfaW5zZXJ0aW9uLCBwcm9iX2RlbGV0aW9uLCBwcm9iX2R1cCwgcmVwbGFjZW1lbnRfbW9kZSwgdW5pdHMpe1xuICAgICAgICB0aGlzLnByb2IgPSBwcm9iO1xuICAgICAgICB0aGlzLnBSID0gcHJvYl9yZXBsYWNlbWVudDtcbiAgICAgICAgdGhpcy5wSSA9IHByb2JfaW5zZXJ0aW9uO1xuICAgICAgICB0aGlzLnBEID0gcHJvYl9kZWxldGlvbjtcbiAgICAgICAgdGhpcy5wRHVwID0gcHJvYl9kdXA7XG4gICAgICAgIHRoaXMucFJtb2RlID0gcmVwbGFjZW1lbnRfbW9kZTsgIFxuICAgICAgICB0aGlzLnVuaXRzID0gdW5pdHM7XG4gICAgfVxuXG4gICAgbXV0YXRlKGdlbm9tZSl7XG4gICAgICAgIGlmKHRoaXMubVByb2IodGhpcy5wUiwgZ2Vub21lLm11dF9leHApKXtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZShnZW5vbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMubVByb2IodGhpcy5wSSwgZ2Vub21lLm11dF9leHApKXtcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGdlbm9tZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBELCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5kZWxldGUoZ2Vub21lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1Qcm9iKHAsIGV4cCl7XG4gICAgICAgIHJldHVybiByYW5kb21Qcm9iKHAgKiBNYXRoLnBvdyggdGhpcy5wcm9iLCBleHApKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgc3dpdGNoKHRoaXMucFJtb2RlKXtcbiAgICAgICAgY2FzZSBcImJ5dGV3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSB0aGlzLnJhbmRvbUNoYXIoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYml0d2lzZVwiOlxuICAgICAgICAgICAgZ2Vub21lW2ldID0gZ2Vub21lW2ldIF4gTWF0aC5wb3coMiwgcmFuZG9tSW50KDAsIDcpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG11dGF0aW9uIHJlcGxhY2VtZW50IG1vZGU6ICR7dGhpcy5wUm1vZGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgaW5zZXJ0KGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMCwgdGhpcy5yYW5kb21DaGFyKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVsZXRlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByYW5kb21DaGFyKCl7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQoMCwgMjU1KTtcbiAgICB9XG5cbiAgICByYW5kb21Qb3MoZ2Vub21lKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCBnZW5vbWUubGVuZ3RoLTEpO1xuICAgIH1cbn1cblxuXG5cbmNsYXNzIFJ1bGUge1xuICAgIGNvbnN0cnVjdG9yKGVxTWFzaywgc3RhdGUsIGFjdGlvbil7XG4gICAgICAgIHRoaXMuZXFNYXNrID0gZXFNYXNrO1xuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIHRoaXMuYWN0aW9uID0gYWN0aW9uO1xuICAgIH1cblxuICAgIG1hdGNoZXMoc3RhdGUpe1xuICAgICAgICB2YXIgZXFTdGF0ZSA9IHN0YXRlICYgdGhpcy5lcU1hc2s7XG4gICAgICAgIHJldHVybiBlcVN0YXRlID09PSB0aGlzLnN0YXRlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnN0YXRlfSAtPiAke3RoaXMuYWN0aW9ufWA7XG4gICAgfVxufVxuXG5jbGFzcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICAvKipcbiAgICAgKiBNZXRob2RzIHRoYXQgZGVjb2RlIGdlbm9tZXMgaW50byBydWxlc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBuZXcgQWN0aW9uTWFwKG1hcHBpbmcpO1xuICAgIH1cbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5KXtcblxuICAgIH1cbn1cblxuY2xhc3MgQmxvY2tJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBieXRlYXJyYXkubGVuZ3RoOyBpKz0yKXtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLm1hcHBpbmcuZ2V0QWN0aW9uKGJ5dGVhcnJheVtpKzFdKTtcbiAgICAgICAgICAgIHJ1bGVzLnB1c2gobmV3IFJ1bGUoMjU1LCBieXRlYXJyYXlbaV0sIGFjdGlvbikpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmNsYXNzIFByb21vdG9ySW50ZXJwcmV0ZXIgZXh0ZW5kcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5KXtcbiAgICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICAgIHZhciBnZW5lcyA9IFtdO1xuICAgICAgICB2YXIgZ2VuZSA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgYyA9IGJ5dGVhcnJheVtpXTtcbiAgICAgICAgICAgIGlmKGJpdFNldChjLCA2KSA9PT0gYml0U2V0KGMsIDcpKXtcbiAgICAgICAgICAgICAgICAvLyBvcGVyYXRvclxuICAgICAgICAgICAgICAgIGlmKGdlbmUubGVuZ3RoPjApe1xuICAgICAgICAgICAgICAgICAgICBnZW5lLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDcpKXtcbiAgICAgICAgICAgICAgICAvLyBwcm9tb3RvclxuICAgICAgICAgICAgICAgIGdlbmUgPSBbY107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIGlmKGJpdFNldChjLCA2KSl7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRlcm1pbmF0b3JcbiAgICAgICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcy5wdXNoKGdlbmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgZ2VuZXMuZm9yRWFjaChmdW5jdGlvbihnZW5lKXtcbiAgICAgICAgICAgIC8vIGV4dHJhY3QgNiBsZWFzdCBzaWcgYml0cyBmcm9tIHRlcm1pbmF0b3IgYXMgdGhlIGFjdGlvbiBjb2RlXG4gICAgICAgICAgICB2YXIgYWN0aW9uQ29kZSA9IGdlbmVbZ2VuZS5sZW5ndGgtMV0gJiAoTWF0aC5wb3coMiwgNikgLSAxKTtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLm1hcHBpbmcuZ2V0QWN0aW9uKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyB0YWtlIGluZm9ybWF0aW9uIGZyb20gb3BlcmF0b3JzIHRvIGNyZWF0ZSBzdGF0ZSBtYXNrXG4gICAgICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgICAgICB2YXIgZXFNYXNrID0gMDsgLy8gc3BlY2lmaWVkIHdoaWNoIGJpdHMgY29udHJpYnV0ZSB0byB0aGUgc3RhdGUgbWFza1xuICAgICAgICAgICAgZm9yKHZhciBpPTE7IGk8Z2VuZS5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gNCBsZWFzdCBzaWcgYml0cyBkZXRlcm1pbmUgdGhlIG1hc2sgaW5kZXhcbiAgICAgICAgICAgICAgICB2YXIgbWFza0JpdCA9IGdlbmVbaV0gJiAoTWF0aC5wb3coMiwgNCkgLSAxKTtcblxuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZXMgaWYgdGhlIG1hc2sgYXQgdGhpcyBpbmRleCBpcyBzZXQgdG8gMSBvciAwXG4gICAgICAgICAgICAgICAgdmFyIGJpdFN0YXRlID0gKGdlbmVbaV0gJiBNYXRoLnBvdygyLCA0KSkgPj4gNDtcbiAgICAgICAgICAgICAgICBtYXNrICs9IE1hdGgucG93KDIsIG1hc2tCaXQpKmJpdFN0YXRlO1xuXG4gICAgICAgICAgICAgICAgZXFNYXNrICs9IE1hdGgucG93KDIsIG1hc2tCaXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZShlcU1hc2ssIG1hc2ssIGFjdGlvbikpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHJ1bGVzO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYml0U2V0KGJ5dGUsIGkpe1xuICAgIHJldHVybiAoYnl0ZSAmIE1hdGgucG93KDIsIGkpKSA+PiBpO1xufVxuXG5leHBvcnQge0J5dGVBcnJheSwgQmxvY2tJbnRlcnByZXRlciwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtDZWxsfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5pbXBvcnQge05FSUdIQk9VUkhPT0R9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgUGxhbnR7XG4gICAgY29uc3RydWN0b3IoeCwgd29ybGQsIGdlbm9tZSwgdXNlSW50ZXJuYWxTdGF0ZT1mYWxzZSkge1xuICAgICAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgICAgIHRoaXMuZW5lcmdpc2VkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmNlbGxzID0gW25ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgMCldO1xuICAgICAgICB0aGlzLmdlbm9tZSA9IGdlbm9tZTtcbiAgICAgICAgdGhpcy51c2VJbnRlcm5hbFN0YXRlID0gdXNlSW50ZXJuYWxTdGF0ZTtcbiAgICB9XG5cbiAgICBnZXROZWlnaGJvdXJob29kKGNlbGwpe1xuICAgICAgICAvLyBSZXR1cm4gdGhlIG5laWdoYm91cmhvb2QgbWFza1xuICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPE5FSUdIQk9VUkhPT0QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIHBvcyA9IE5FSUdIQk9VUkhPT0RbaV07XG4gICAgICAgICAgICB2YXIgeCA9IGNlbGwueCArIHBvc1swXTtcbiAgICAgICAgICAgIHZhciB5ID0gY2VsbC55ICsgcG9zWzFdO1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaChlcnJvcil7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod29ybGRQb3MgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgICAgICBtYXNrID0gbWFzayB8IE1hdGgucG93KDIsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXNrO1xuICAgIH1cblxuICAgIGdldFN0YXRlKGNlbGwpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXROZWlnaGJvdXJob29kKGNlbGwpIHwgY2VsbC5pbnRlcm5hbFN0YXRlIHwgKE1hdGgucG93KDIsIDE1KSAqICggY2VsbC5lbmVyZ2lzZWQgPyAxIDogMCkpO1xuICAgIH1cblxuICAgIGdyb3coKXtcbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBncm93XG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKDAuOCkpe1xuICAgICAgICAgICAgICAgIHZhciBzcGFjZXMgPSB0aGlzLmdldEdyb3dEaXJlY3Rpb24oY2VsbCk7XG4gICAgICAgICAgICAgICAgaWYoc3BhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gc3BhY2VzW3JhbmRvbUludCgwLCBzcGFjZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR3JvdyB0aGUgcGxhbnQgYnkgb25lIGNlbGwgaWYgcG9zc2libGVcbiAgICAgKiBAcGFyYW0geyp9IGNlbGwgdGhlIGNlbGwgdG8gZ3JvdyBmcm9tXG4gICAgICogQHBhcmFtIHsqfSBkaXJlY3Rpb24gdGhlIGRpcmVjdGlvbiB0byBncm93IGluXG4gICAgICovXG4gICAgZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbil7XG4gICAgICAgIHZhciB4ID0gY2VsbC54K2RpcmVjdGlvblswXSwgeSA9IGNlbGwueStkaXJlY3Rpb25bMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIHNwYWNlIGlzIGNsZWFyXG4gICAgICAgIHZhciBzcGFjZSA9IHRoaXMud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICAgICAgaWYgKHNwYWNlID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGFjZSBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgaWYgKHNwYWNlLnBsYW50ID09PSB0aGlzKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGlzIHBsYW50IHdpbGwga2lsbCB0aGUgb3RoZXJcbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9iYWJpbGl0eS4uLlxuICAgICAgICAgICAgaWYocmFuZG9tUHJvYihzcGFjZS5wbGFudC5nZXRLaWxsUHJvYmFiaWxpdHkoKSkpe1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBzdWNjZWVkZWQuIEtpbGwgY29tcGV0aXRvciBhbmQgY29udGludWUgd2l0aCBncm93dGhcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChzcGFjZS5wbGFudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgZmFpbGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgLy8gZ3JvdyBjZWxsIGluIHRvIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBuZXdfY2VsbCA9IG5ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgeSk7XG4gICAgICAgIHRoaXMuY2VsbHMucHVzaChuZXdfY2VsbCk7XG4gICAgICAgIHRoaXMud29ybGQuYWRkQ2VsbChuZXdfY2VsbCk7XG4gICAgfVxuXG4gICAgZ2V0S2lsbFByb2JhYmlsaXR5KCl7XG4gICAgICAgIHJldHVybiAxL3RoaXMuZW5lcmdpc2VkQ291bnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIHdoZXRoZXIgdGhpcyBwbGFudCBzaG91bGQgZGllLlxuICAgICAqIEBwYXJhbSB7fSBuYXR1cmFsX2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBlbmVyZ3lfZXhwIGV4cG9uZW50IHRvIHRoZSBudW1iZXIgb2YgZW5lcmd5IHJpY2ggY2VsbHNcbiAgICAgKiBAcGFyYW0geyp9IGxlYW5vdmVyX2ZhY3RvciBmYWN0b3IgdG8gdGhlIGxlYW5vdmVyIHRlcm1cbiAgICAgKi9cbiAgICBnZXREZWF0aFByb2JhYmlsaXR5KGRlYXRoX2ZhY3RvciwgbmF0dXJhbF9leHAsIGVuZXJneV9leHAsIGxlYW5vdmVyX2ZhY3Rvcil7XG4gICAgICAgIHZhciBudW1DZWxscyA9IHRoaXMuY2VsbHMubGVuZ3RoO1xuICAgICAgICB2YXIgbGVhbm92ZXJFbmVyZ2lzZWQgPSAwO1xuICAgICAgICB2YXIgcm9vdENlbGwgPSB0aGlzLmNlbGxzWzBdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmNlbGxzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjZWxsID0gdGhpcy5jZWxsc1tpXTtcbiAgICAgICAgICAgIHZhciBsZSA9IHRoaXMud29ybGQud2lkdGgvMiAtICggKCggMS41KnRoaXMud29ybGQud2lkdGggKSArIGNlbGwueCAtIHJvb3RDZWxsLngpICAlIHRoaXMud29ybGQud2lkdGgpO1xuICAgICAgICAgICAgbGVhbm92ZXJFbmVyZ2lzZWQgKz0gbGU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVhbm92ZXJDZWxscyA9IDIvKG51bUNlbGxzKihudW1DZWxscy0xKSk7XG4gICAgICAgIGlmIChsZWFub3ZlckNlbGxzID09PSBJbmZpbml0eSl7XG4gICAgICAgICAgICBsZWFub3ZlckNlbGxzID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWFub3ZlclRlcm0gPSBsZWFub3ZlckNlbGxzKk1hdGguYWJzKGxlYW5vdmVyRW5lcmdpc2VkKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBkX25hdHVyYWwgPSBNYXRoLnBvdyhudW1DZWxscywgbmF0dXJhbF9leHApO1xuICAgICAgICB2YXIgZF9lbmVyZ3kgPSBNYXRoLnBvdyh0aGlzLmVuZXJnaXNlZENvdW50KzEsIGVuZXJneV9leHApO1xuICAgICAgICB2YXIgZF9sZWFub3ZlciA9IGxlYW5vdmVyX2ZhY3RvcipsZWFub3ZlclRlcm07XG4gICAgICAgIHZhciBwRGVhdGggPSBkZWF0aF9mYWN0b3IgKiBkX25hdHVyYWwgKiBkX2VuZXJneSArIGRfbGVhbm92ZXI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInByb2JcIjogcERlYXRoLFxuICAgICAgICAgICAgXCJuYXR1cmFsXCI6IGRfbmF0dXJhbCxcbiAgICAgICAgICAgIFwiZW5lcmd5XCI6IGRfZW5lcmd5LFxuICAgICAgICAgICAgXCJsZWFub3ZlclwiOiBkX2xlYW5vdmVyXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgeyBQbGFudCB9OyIsImltcG9ydCBzZWVkcmFuZG9tIGZyb20gXCJzZWVkcmFuZG9tXCI7XG5cbi8qKlxuICogU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIE1hdGgucmFuZG9tXG4gKiBAcGFyYW0geyp9IHNlZWQgZGF0YSB0byB1c2UgdG8gc2VlZCBhbGwgZnV0dXJlIFJORyBjYWxsc1xuICovXG5mdW5jdGlvbiBzZWVkUmFuZG9tKHNlZWQpe1xuICAgIHNlZWRyYW5kb20oc2VlZCwge2dsb2JhbDogdHJ1ZX0pO1xufVxuXG4vKipcbiAqIHJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIG1heCAoaW5jbHVzaXZlKVxuICogQHBhcmFtIHsqfSBtYXggbWF4aW11bSBpbnRlZ2VyIHRvIGdlbmVyYXRlIGFzIGEgcmFuZG9tIG51bWJlclxuICovXG5mdW5jdGlvbiByYW5kb21JbnQobWluLCBtYXgpe1xuICAgIC8vIG5vdGU6IE1hdGgucmFuZG9tIHJldHVybnMgYSByYW5kb20gbnVtYmVyIGV4Y2x1c2l2ZSBvZiAxLFxuICAgIC8vIHNvIHRoZXJlIGlzICsxIGluIHRoZSBiZWxvdyBlcXVhdGlvbiB0byBlbnN1cmUgdGhlIG1heGltdW1cbiAgICAvLyBudW1iZXIgaXMgY29uc2lkZXJlZCB3aGVuIGZsb29yaW5nIDAuOS4uLiByZXN1bHRzLlxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG4vKipcbiAqIEV2YWx1YXRlcyB0aGUgY2hhbmNlIG9mIGFuIGV2ZW50IGhhcHBlbmluZyBnaXZlbiBwcm9iXG4gKiBAcGFyYW0geyp9IHByb2IgZnJhY3Rpb24gYmV0d2VlbiAwIGFuZCAxIGNoYW5jZSBvZiB0aGUgZXZlbnQgaGFwcGVuaW5nXG4gKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBldmVudCBoYXBwZW5zLCBmYWxzZSBpZiBub3RcbiAqL1xuZnVuY3Rpb24gcmFuZG9tUHJvYihwcm9iKXtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8PSBwcm9iO1xufVxuXG5leHBvcnQge3NlZWRSYW5kb20sIHJhbmRvbUludCwgcmFuZG9tUHJvYn07IiwiaW1wb3J0ICogYXMgc3RhdHMgZnJvbSBcInN0YXRzLWxpdGVcIjtcblxuY2xhc3MgU2ltRGF0YXtcblxuICAgIGNvbnN0cnVjdG9yKHNpbXVsYXRpb24pe1xuICAgICAgICB0aGlzLnNpbSA9IHNpbXVsYXRpb247XG4gICAgICAgIHRoaXMuZGF0YSA9IHtcInN0ZXBudW1cIjogW119O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMgPSBbXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicG9wdWxhdGlvblwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInRvdGFsX2NlbGxzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIHAuY2VsbHMubGVuZ3RoLCAwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImVuZXJnaXNlZF9jZWxsc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLmNlbGxzLmZpbHRlcihjID0+IGMuZW5lcmdpc2VkKS5sZW5ndGgsIDApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicGxhbnRfc2l6ZV9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5jZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2Vub21lX3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLmxlbmd0aCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJtdXRfZXhwX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5tdXRfZXhwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X2hlaWdodF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoLi4ucC5jZWxscy5tYXAoYyA9PiBjLnkpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29sbGVjdCBkYXRhIGZvciB0aGUgY3VycmVudCBzdGVwXG4gICAgICovXG4gICAgcmVjb3JkU3RlcCgpe1xuICAgICAgICB2YXIgc3RlcERhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5jb2xsZWN0b3JzLmZvckVhY2goZnVuY3Rpb24oYyl7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gYy5jb2xsZWN0KHRoaXMuc2ltKTtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oc3RlcERhdGEsIHZhbHVlcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuZGF0YVtcInN0ZXBudW1cIl0ucHVzaCh0aGlzLnNpbS5zdGVwbnVtKTtcbiAgICAgICAgT2JqZWN0LmtleXMoc3RlcERhdGEpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgICAgICBpZiAoIShrIGluIHRoaXMuZGF0YSkpe1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVtrXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kYXRhW2tdLnB1c2goc3RlcERhdGFba10pOyBcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuXG5jbGFzcyBDb2xsZWN0b3J7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZWNscywgY29sbGVjdEZ1bmMpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnR5cGUgPSBuZXcgdHlwZWNscyhuYW1lKTtcbiAgICAgICAgdGhpcy5mdW5jID0gY29sbGVjdEZ1bmM7XG4gICAgfVxuXG4gICAgY29sbGVjdChzaW0pe1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZnVuYyhzaW0pO1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnRyYW5zZm9ybShkYXRhKTtcbiAgICB9XG59XG5cbmNsYXNzIENvbGxlY3RvclR5cGV7XG4gICAgY29uc3RydWN0b3IobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZCBtZXRob2RcIik7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtKGRhdGEpe1xuICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy50cmFuc2Zvcm1EYXRhKGRhdGEpO1xuICAgICAgICB2YXIgdHJhbnNmb3JtZWRfZGF0YSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgICAgICB0cmFuc2Zvcm1lZF9kYXRhW3RoaXMubmFtZSArIGtdID0gdmFsdWVzW2tdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkX2RhdGE7XG4gICAgfVxufVxuXG5jbGFzcyBBc0lzIGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICByZXR1cm4ge1wiXCI6IGRhdGF9O1xuICAgIH1cbn1cblxuY2xhc3MgU3VtbWFyeSBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIm1pblwiOiBNYXRoLm1pbihkYXRhKSwgXCJtZWFuXCI6IHN0YXRzLm1lYW4oZGF0YSksIFwibWF4XCI6IE1hdGgubWF4KGRhdGEpfTtcbiAgICB9XG59XG5leHBvcnQge1NpbURhdGF9OyIsImltcG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1dvcmxkfSBmcm9tIFwiLi93b3JsZC5qc1wiO1xuaW1wb3J0IHtCeXRlQXJyYXksIEJsb2NrSW50ZXJwcmV0ZXIsIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9IGZyb20gXCIuL2dlbm9tZS5qc1wiO1xuXG5jbGFzcyBTaW11bGF0aW9uUGFyYW1ze1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcz17fSl7XG4gICAgICAgIHRoaXMucmFuZG9tX3NlZWQgPSAxO1xuICAgICAgICB0aGlzLnJlY29yZF9pbnRlcnZhbCA9IDEwO1xuICAgICAgICB0aGlzLnN0ZXBzX3Blcl9mcmFtZSA9IDE7XG5cbiAgICAgICAgdGhpcy53b3JsZF93aWR0aCA9IDI1MDtcbiAgICAgICAgdGhpcy53b3JsZF9oZWlnaHQgPSA0MDtcbiAgICAgICAgdGhpcy5pbml0aWFsX3BvcHVsYXRpb24gPSAyNTA7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVuZXJneV9wcm9iID0gMC41O1xuXG4gICAgICAgIC8vIGRlYXRoIHBhcmFtc1xuICAgICAgICB0aGlzLmRlYXRoX2ZhY3RvciA9IDAuMjtcbiAgICAgICAgdGhpcy5uYXR1cmFsX2V4cCA9IDA7XG4gICAgICAgIHRoaXMuZW5lcmd5X2V4cCA9IC0yLjU7XG4gICAgICAgIHRoaXMubGVhbm92ZXJfZmFjdG9yID0gMC4yO1xuXG4gICAgICAgIC8vIG11dGF0aW9uc1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlX21vZGUgPSBcImJ5dGV3aXNlXCI7XG4gICAgICAgIHRoaXMubXV0X3JlcGxhY2UgPSAwLjAwMjtcbiAgICAgICAgdGhpcy5tdXRfaW5zZXJ0ID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9kZWxldGUgPSAwLjAwMDQ7XG4gICAgICAgIHRoaXMubXV0X2ZhY3RvciA9IDEuNTtcbiAgICAgICAgdGhpcy5pbml0aWFsX211dF9leHAgPSAwO1xuXG4gICAgICAgIHRoaXMuZ2Vub21lX2ludGVycHJldGVyID0gXCJibG9ja1wiO1xuICAgICAgICB0aGlzLmluaXRpYWxfZ2Vub21lX2xlbmd0aCA9IDQwMDtcblxuICAgICAgICAvLyBkaXZpZGUsIGZseWluZ3NlZWQsIGxvY2Fsc2VlZCwgbXV0KywgbXV0LSwgc3RhdGViaXRcbiAgICAgICAgdGhpcy5hY3Rpb25fbWFwID0gWzIwMCwgMjAsIDAsIDE4LCAxOCwgMF07XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBwYXJhbXMpO1xuICAgIH1cbn1cblxuY2xhc3MgU2ltdWxhdGlvbiB7XG4gICAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgICAgIC8vIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byByYW5kb21cbiAgICAgICAgLy8gdGhpcyBtYWtlcyBvdXQgdGVzdHMgcmVwcm9kdWNpYmxlIGdpdmVuIHRoZSBzYW1lIHNlZWQgaXMgdXNlZFxuICAgICAgICAvLyBpbiBmdXR1cmUgaW5wdXQgcGFyYW1ldGVyc1xuICAgICAgICBzZWVkUmFuZG9tKHRoaXMucGFyYW1zLnJhbmRvbV9zZWVkKTtcblxuICAgICAgICB0aGlzLndvcmxkID0gbmV3IFdvcmxkKHRoaXMucGFyYW1zLndvcmxkX3dpZHRoLCB0aGlzLnBhcmFtcy53b3JsZF9oZWlnaHQpO1xuICAgICAgICB0aGlzLmdlbm9tZUludGVycHJldGVyID0gdGhpcy5nZXRJbnRlcnByZXRlcigpO1xuICAgICAgICB0aGlzLm11dF91bml0cyA9IDE7XG4gICAgICAgIC8vIGVuc3VyZSBtdXRhdGlvbiB1bml0cyBpcyBjb21wYXRpYmxlIHdpdGggdGhlIGludGVycHJldGVyIHR5cGVcbiAgICAgICAgaWYodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIEJsb2NrSW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgdGhpcy5tdXRfdW5pdHMgPSAyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RlcG51bSA9IDA7XG4gICAgfVxuXG4gICAgZ2V0SW50ZXJwcmV0ZXIoKXtcbiAgICAgICAgc3dpdGNoICh0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIpe1xuICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmxvY2tJbnRlcnByZXRlcih0aGlzLnBhcmFtcy5hY3Rpb25fbWFwKTtcbiAgICAgICAgY2FzZSBcInByb21vdG9yXCI6XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21vdG9ySW50ZXJwcmV0ZXIodGhpcy5wYXJhbXMuYWN0aW9uX21hcCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaW50ZXJwcmV0ZXIgJHt0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXJ9YCk7XG4gICAgICAgIH0gIFxuICAgIH1cblxuICAgIGluaXRfcG9wdWxhdGlvbigpe1xuICAgICAgICAvLyByYW5kb21seSBjaG9vc2Ugc3BvdHMgdG8gc2VlZCB0aGUgd29ybGQgd2l0aFxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5wYXJhbXMuaW5pdGlhbF9wb3B1bGF0aW9uOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5uZXdTZWVkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXdTZWVkKCl7XG4gICAgICAgIC8vIGNyZWF0ZSBhIHJhbmRvbSBnZW5vbWVcbiAgICAgICAgdmFyIGdlbm9tZSA9IEJ5dGVBcnJheS5yYW5kb20odGhpcy5wYXJhbXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoKTtcbiAgICAgICAgdGhpcy53b3JsZC5zZWVkKGdlbm9tZSk7XG4gICAgfVxuXG4gICAgc3RlcCgpe1xuICAgICAgICB0aGlzLnN0ZXBudW0rKztcbiAgICAgICAgdGhpcy5zaW11bGF0ZURlYXRoKCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVMaWdodCgpO1xuICAgICAgICB0aGlzLnNpbXVsYXRlQWN0aW9ucygpO1xuICAgICAgICB0aGlzLm11dGF0ZSgpO1xuICAgIH1cblxuICAgIHNpbXVsYXRlQWN0aW9ucygpe1xuICAgICAgICB0aGlzLndvcmxkLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIHZhciBydWxlcyA9IHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIuaW50ZXJwcmV0KHBsYW50Lmdlbm9tZSk7XG4gICAgICAgICAgICBwbGFudC5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbEFjdGlvbihjZWxsLCBydWxlcyk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgY2VsbEFjdGlvbihjZWxsLCBydWxlcyl7XG4gICAgICAgIHZhciBzdGF0ZTtcbiAgICAgICAgaWYgKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBCbG9ja0ludGVycHJldGVyKXtcbiAgICAgICAgICAgIHN0YXRlID0gY2VsbC5wbGFudC5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIFByb21vdG9ySW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgc3RhdGUgPSBjZWxsLnBsYW50LmdldFN0YXRlKGNlbGwpO1xuICAgICAgICB9XG4gICAgICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSl7XG4gICAgICAgICAgICAvLyBleGVjdXRlIG9uZSBhY3Rpb24gdXNpbmcgdGhlIGZpcnN0IG1hdGNoaW5nIHJ1bGVcbiAgICAgICAgICAgIC8vIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgICAgICBydWxlLmFjdGlvbi5leGVjdXRlKGNlbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgY2VsbC51cGRhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIG11dGF0ZSgpe1xuICAgICAgICB2YXIgbXV0YXRvciA9IG5ldyBNdXRhdG9yKHRoaXMucGFyYW1zLm11dF9mYWN0b3IsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlLCBcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLm11dF9pbnNlcnQsIHRoaXMucGFyYW1zLm11dF9kZWxldGUsIFxuICAgICAgICAgICAgMCwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2VfbW9kZSwgdGhpcy5tdXRfdW5pdHMpO1xuICAgICAgICB0aGlzLndvcmxkLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIG11dGF0b3IubXV0YXRlKHBsYW50Lmdlbm9tZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSBlYWNoIHBsYW50J3MgY3VycmVudCBkZWF0aCBwcm9iYWJpbGl0eSB0byBzaW11bGF0ZVxuICAgICAqIHdoZXRoZXIgZWFjaCBwbGFudCBkaWVzIG9uIHRoaXMgc3RlcFxuICAgICAqL1xuICAgIHNpbXVsYXRlRGVhdGgoKXtcbiAgICAgICAgdmFyIGRlYWRfcGxhbnRzID0gW107XG4gICAgICAgIHRoaXMud29ybGQucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgdmFyIGRlYXRoUHJvYiA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHJhbmRvbVByb2IoZGVhdGhQcm9iLnByb2IpKXtcbiAgICAgICAgICAgICAgICBkZWFkX3BsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGRlYWRfcGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgdGhpcy53b3JsZC5raWxsUGxhbnQocGxhbnQpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZSBsaWdodC4gU3VubGlnaHQgdHJhdmVyc2VzIGZyb20gdGhlIGNlaWxpbmcgb2YgdGhlIHdvcmxkXG4gICAgICogZG93bndhcmRzIHZlcnRpY2FsbHkuIEl0IGlzIGNhdWdodCBieSBhIHBsYW50IGNlbGwgd2l0aCBhIHByb2JhYmlsaXR5XG4gICAgICogd2hpY2ggY2F1c2VzIHRoYXQgY2VsbCB0byBiZSBlbmVyZ2lzZWQuXG4gICAgICovXG4gICAgc2ltdWxhdGVMaWdodCgpe1xuICAgICAgICBmb3IodmFyIHg9MDsgeDx0aGlzLndvcmxkLndpZHRoOyB4Kyspe1xuICAgICAgICAgICAgZm9yKHZhciB5PTA7IHk8dGhpcy53b3JsZC5oZWlnaHQ7IHkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3RoaXMud29ybGQuaGVpZ2h0LXktMV07XG4gICAgICAgICAgICAgICAgaWYoY2VsbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJhbmRvbVByb2IodGhpcy5wYXJhbXMuZW5lcmd5X3Byb2IpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQge1NpbXVsYXRpb24sIFNpbXVsYXRpb25QYXJhbXN9OyIsImltcG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc30gZnJvbSBcIi4vc2ltdWxhdGlvbi5qc1wiO1xuaW1wb3J0IHtTaW1EYXRhfSBmcm9tIFwiLi9zaW1kYXRhLmpzXCI7XG5cbmxldCBzaW11bGF0aW9uID0gbnVsbDtcbmxldCBkYXRhID0gbnVsbDtcbmxldCBydW5uaW5nID0gZmFsc2U7XG5sZXQgY2VsbFNpemUgPSA4O1xuY29uc3QgVEFSR0VUX0ZQUyA9IDYwO1xuY29uc3QgRlJBTUVfSU5URVJWQUxfTVMgPSAxMDAwIC8gVEFSR0VUX0ZQUztcbmxldCBsYXN0RnJhbWVUaW1lID0gMDtcblxuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGE7XG4gICAgc3dpdGNoIChtc2cudHlwZSkge1xuICAgIGNhc2UgXCJpbml0XCI6XG4gICAgICAgIGluaXRTaW0obXNnLnBhcmFtcyk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgbG9vcCgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RvcFwiOlxuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGVwXCI6XG4gICAgICAgIGRvU3RlcCgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImdldENlbGxcIjpcbiAgICAgICAgc2VuZENlbGxJbmZvKG1zZy54LCBtc2cueSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGluaXRTaW0ocGFyYW1zKSB7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGNvbnN0IHNpbV9wYXJhbXMgPSBuZXcgU2ltdWxhdGlvblBhcmFtcyhwYXJhbXMpO1xuICAgIGNlbGxTaXplID0gcGFyYW1zLmNlbGxTaXplIHx8IDg7XG4gICAgc2ltdWxhdGlvbiA9IG5ldyBTaW11bGF0aW9uKHNpbV9wYXJhbXMpO1xuICAgIGRhdGEgPSBuZXcgU2ltRGF0YShzaW11bGF0aW9uKTtcbiAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbigpO1xuICAgIHB1c2hGcmFtZSgpO1xufVxuXG5mdW5jdGlvbiBsb29wKCkge1xuICAgIGlmICghcnVubmluZykgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3BmID0gc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3BmOyBpKyspIHtcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdEZyYW1lVGltZSA+PSBGUkFNRV9JTlRFUlZBTF9NUykge1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgbGFzdEZyYW1lVGltZSA9IG5vdztcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KGxvb3AsIDApO1xufVxuXG5mdW5jdGlvbiBkb1N0ZXAoKSB7XG4gICAgc2ltdWxhdGlvbi5zdGVwKCk7XG5cbiAgICBpZiAoc2ltdWxhdGlvbi5zdGVwbnVtICUgc2ltdWxhdGlvbi5wYXJhbXMucmVjb3JkX2ludGVydmFsID09PSAwIHx8IHNpbXVsYXRpb24uc3RlcG51bSA9PT0gMSkge1xuICAgICAgICBkYXRhLnJlY29yZFN0ZXAoKTtcbiAgICAgICAgLy8gc2VuZCBzdGF0cyBzbmFwc2hvdCAoY2xvbmUgdGhlIGFycmF5cyB0byBhdm9pZCB0cmFuc2ZlciBpc3N1ZXMpXG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogXCJzdGF0c1wiLFxuICAgICAgICAgICAgZGF0YTogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhLmRhdGEpKSxcbiAgICAgICAgICAgIHN0ZXBudW06IHNpbXVsYXRpb24uc3RlcG51bVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHB1c2hGcmFtZSgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBzaW11bGF0aW9uLndvcmxkLmdldFBpeGVsQnVmZmVyKGNlbGxTaXplKTtcbiAgICAvLyBUcmFuc2ZlciBvd25lcnNoaXAgb2YgdGhlIEFycmF5QnVmZmVyIGZvciB6ZXJvLWNvcHkgcGVyZm9ybWFuY2VcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJmcmFtZVwiLFxuICAgICAgICBidWZmZXI6IHJlc3VsdC5idWZmZXIuYnVmZmVyLFxuICAgICAgICB3aWR0aDogcmVzdWx0LndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHJlc3VsdC5oZWlnaHQsXG4gICAgICAgIGNlbGxDb3VudDogcmVzdWx0LmNlbGxDb3VudCxcbiAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgfSwgW3Jlc3VsdC5idWZmZXIuYnVmZmVyXSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRDZWxsSW5mbyh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoIWNlbGwgfHwgIWNlbGwucGxhbnQgfHwgIWNlbGwucGxhbnQuZ2Vub21lKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBwbGFudCA9IGNlbGwucGxhbnQ7XG4gICAgICAgIGNvbnN0IHJ1bGVzID0gc2ltdWxhdGlvbi5nZW5vbWVJbnRlcnByZXRlci5pbnRlcnByZXQocGxhbnQuZ2Vub21lKTtcbiAgICAgICAgY29uc3QgbmVpZ2hib3VyaG9vZCA9IHBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIGxldCBtYXRjaGluZ19ydWxlID0gXCJOb25lXCI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChydWxlc1tpXS5zdGF0ZSA9PT0gbmVpZ2hib3VyaG9vZCkge1xuICAgICAgICAgICAgICAgIG1hdGNoaW5nX3J1bGUgPSBgIyR7aX0gJHtydWxlc1tpXX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlYXRoID0gcGxhbnQuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmxlYW5vdmVyX2ZhY3RvclxuICAgICAgICApO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6IFwiY2VsbEluZm9cIixcbiAgICAgICAgICAgIGZvdW5kOiB0cnVlLFxuICAgICAgICAgICAgY2VsbFN0cjogY2VsbC50b1N0cmluZygpLFxuICAgICAgICAgICAgbmVpZ2hib3VyaG9vZCxcbiAgICAgICAgICAgIG1hdGNoaW5nX3J1bGUsXG4gICAgICAgICAgICBkZWF0aDogSlNPTi5zdHJpbmdpZnkoZGVhdGgpLFxuICAgICAgICAgICAgZ2Vub21lTGVuZ3RoOiBwbGFudC5nZW5vbWUubGVuZ3RoLFxuICAgICAgICAgICAgbXV0RXhwOiBwbGFudC5nZW5vbWUubXV0X2V4cCxcbiAgICAgICAgICAgIHJ1bGVzOiBydWxlcy5tYXAociA9PiByLnRvU3RyaW5nKCkpXG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7cmFuZG9tSW50fSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7UGxhbnR9IGZyb20gXCIuL3BsYW50LmpzXCI7XG5pbXBvcnQgeyBDZWxsIH0gZnJvbSBcIi4vY2VsbC5qc1wiO1xuXG5jbGFzcyBXb3JsZCB7XG4gICAgY29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCl7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5jZWxscyA9IFtdO1xuICAgICAgICAvLyBpbml0aWFsaXNlIHRoZSB3b3JsZCBsYXR0aWNlIHRvIGFsbCBudWxsc1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLndpZHRoOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5jZWxscy5wdXNoKFtdKTtcbiAgICAgICAgICAgIGZvcih2YXIgaj0wOyBqPHRoaXMuaGVpZ2h0OyBqKyspe1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbHNbaV1bal0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGFudHMgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyBhcnJheSBvZiB4IHBvc2l0aW9ucyBhdCB5PTAgd2hlcmUgbm8gY2VsbCBleGlzdHNcbiAgICAgKi9cbiAgICBnZXRGbG9vclNwYWNlKCl7XG4gICAgICAgIHZhciBlbXB0eVNwYWNlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLndpZHRoOyBpKyspe1xuICAgICAgICAgICAgaWYodGhpcy5jZWxsc1tpXVswXSA9PT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZW1wdHlTcGFjZXMucHVzaChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZW1wdHlTcGFjZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RyYXRlZ2llcyBmb3Igc293aW5nIGEgc2VlZCBvbiB0aGUgd29ybGQgZmxvb3JcbiAgICAgKiBAcGFyYW0geyp9IGdlbm9tZSB0aGUgZ2Vub21lIHVzZWQgYnkgdGhlIG5ldyBzZWVkXG4gICAgICogQHBhcmFtIHsqfSBuZWFyWCBpZiBub3QgbnVsbCwgdHJ5IHRvIHNvdyBhIHNlZWQgYXMgY2xvc2VcbiAgICAgKiBhcyBwb3NzaWJsZSB0byB0aGlzIGxvY2F0aW9uXG4gICAgICogXG4gICAgICogQHJldHVybiB0cnVlIGlmIGEgc2VlZCB3YXMgc3VjY2VzZnVsbHkgcGxhbnRlZCwgZmFsc2UgaWZcbiAgICAgKiB0aGVyZSB3YXMgbm8gc3BhY2UgdG8gc293IGEgc2VlZC5cbiAgICAgKi9cbiAgICBzZWVkKGdlbm9tZSwgbmVhclgpe1xuICAgICAgICAvLyBmaW5kIGEgcmFuZG9tIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBlbXB0eVNwYWNlcyA9IHRoaXMuZ2V0Rmxvb3JTcGFjZSgpO1xuICAgICAgICBpZihlbXB0eVNwYWNlcy5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobmVhclggIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdFggPSBudWxsO1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RfZGlmZiA9IHRoaXMud2lkdGg7XG4gICAgICAgICAgICBlbXB0eVNwYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHhwb3Mpe1xuICAgICAgICAgICAgICAgIHZhciBkaWZmID0gTWF0aC5hYnMobmVhclgteHBvcyk7XG4gICAgICAgICAgICAgICAgaWYoZGlmZiA8IG5lYXJlc3RfZGlmZil7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RfZGlmZiA9IGRpZmY7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RYID0geHBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc293UGxhbnQoZ2Vub21lLCBuZWFyZXN0WCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4ID0gZW1wdHlTcGFjZXNbcmFuZG9tSW50KDAsIGVtcHR5U3BhY2VzLmxlbmd0aC0xKV07XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW3hdWzBdICE9PSBudWxsKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNwYWNlIGlzIHRha2VuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc293UGxhbnQoZ2Vub21lLCB4KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc293UGxhbnQoZ2Vub21lLCB4KXtcbiAgICAgICAgeCA9IHRoaXMuZ2V0WCh4KTtcbiAgICAgICAgdmFyIHBsYW50ID0gbmV3IFBsYW50KHgsIHRoaXMsIGdlbm9tZSk7XG4gICAgICAgIHRoaXMucGxhbnRzLnB1c2gocGxhbnQpO1xuICAgICAgICB0aGlzLmFkZENlbGwocGxhbnQuY2VsbHNbMF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBwbGFudCBmcm9tIHdvcmxkIHBsYW50IGxpc3QuXG4gICAgICogUmVtb3ZlIGFsbCBjZWxscyBmcm9tIGNlbGwgZ3JpZFxuICAgICAqL1xuICAgIGtpbGxQbGFudChwbGFudCl7XG4gICAgICAgIHRoaXMucGxhbnRzLnNwbGljZSh0aGlzLnBsYW50cy5pbmRleE9mKHBsYW50KSwgMSk7XG4gICAgICAgIHBsYW50LmNlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IG51bGw7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIGdldFgoeCl7XG4gICAgICAgIGlmKHggPCAwKXtcbiAgICAgICAgICAgIHggPSB0aGlzLndpZHRoICsgeDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCAlIHRoaXMud2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0Q2VsbCh4LCB5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2VsbHNbdGhpcy5nZXRYKHgpXVt5XTtcbiAgICB9XG5cbiAgICBhZGRDZWxsKGNlbGwpe1xuICAgICAgICBpZiAodGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gPSBjZWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpe1xuICAgICAgICBjb25zdCB3ID0gdGhpcy53aWR0aCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBoID0gdGhpcy5oZWlnaHQgKiBjZWxsU2l6ZTtcbiAgICAgICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHcgKiBoICogNCk7IC8vIFJHQkEsIGluaXRpYWxpemVkIHRvIDAgKHRyYW5zcGFyZW50L2JsYWNrKVxuXG4gICAgICAgIHRoaXMucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgY29uc3QgW2Jhc2VSLCBiYXNlRywgYmFzZUJdID0gdGhpcy5nZXRCYXNlQ29sb3VyKHBsYW50KTtcbiAgICAgICAgICAgIHBsYW50LmNlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCl7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sID0gY2VsbC5lbmVyZ2lzZWRcbiAgICAgICAgICAgICAgICAgICAgPyBbYmFzZVIsIGJhc2VHLCBiYXNlQl1cbiAgICAgICAgICAgICAgICAgICAgOiBbTWF0aC5yb3VuZChiYXNlUiAqIDAuNyksIE1hdGgucm91bmQoYmFzZUcgKiAwLjcpLCBNYXRoLnJvdW5kKGJhc2VCICogMC43KV07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBweDAgPSBjZWxsLnggKiBjZWxsU2l6ZTtcbiAgICAgICAgICAgICAgICAvLyB3b3JsZCB5PTAgaXMgZ3JvdW5kIChib3R0b20pLCBjYW52YXMgeT0wIGlzIHRvcFxuICAgICAgICAgICAgICAgIGNvbnN0IHB5MCA9ICh0aGlzLmhlaWdodCAtIDEgLSBjZWxsLnkpICogY2VsbFNpemU7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkeSA9IDA7IGR5IDwgY2VsbFNpemU7IGR5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZHggPSAwOyBkeCA8IGNlbGxTaXplOyBkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IDFweCBib3JkZXI6IGRhcmtlbiBlZGdlIHBpeGVsc1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNCb3JkZXIgPSBkeCA9PT0gMCB8fCBkeSA9PT0gMCB8fCBkeCA9PT0gY2VsbFNpemUgLSAxIHx8IGR5ID09PSBjZWxsU2l6ZSAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBbciwgZywgYl0gPSBpc0JvcmRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gW01hdGgucm91bmQoY29sWzBdICogMC41KSwgTWF0aC5yb3VuZChjb2xbMV0gKiAwLjUpLCBNYXRoLnJvdW5kKGNvbFsyXSAqIDAuNSldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBjb2w7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpZHggPSAoKHB5MCArIGR5KSAqIHcgKyAocHgwICsgZHgpKSAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4XSAgICAgPSByO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDFdID0gZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IGI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgM10gPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHsgYnVmZmVyOiBidWYsIHdpZHRoOiB3LCBoZWlnaHQ6IGgsIGNlbGxDb3VudDogdGhpcy5wbGFudHMucmVkdWNlKChzLHApPT5zK3AuY2VsbHMubGVuZ3RoLDApIH07XG4gICAgfVxuXG4gICAgZ2V0QmFzZUNvbG91cihwbGFudCl7XG4gICAgICAgIHZhciBpID0gcGxhbnQuY2VsbHNbMF0ueCAlIGNTY2FsZS5sZW5ndGg7XG4gICAgICAgIHJldHVybiBjU2NhbGVbaV07XG4gICAgfVxufVxuXG4vLyBodHRwOi8vY29sb3JicmV3ZXIyLm9yZy8/dHlwZT1xdWFsaXRhdGl2ZSZzY2hlbWU9U2V0MyZuPTgg4oCUIGFzIHJhdyBbUixHLEJdIHR1cGxlc1xudmFyIGNTY2FsZSA9IFtcbiAgICBbMTQxLDIxMSwxOTldLFsyNTUsMjU1LDE3OV0sWzE5MCwxODYsMjE4XSxbMjUxLDEyOCwxMTRdLFxuICAgIFsxMjgsMTc3LDIxMV0sWzI1MywxODAsOThdLFsxNzksMjIyLDEwNV0sWzI1MiwyMDUsMjI5XVxuXTtcblxuXG5leHBvcnQgeyBXb3JsZCB9OyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdGxvYWRlZDogZmFsc2UsXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG5cdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLy8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbl9fd2VicGFja19yZXF1aXJlX18ubSA9IF9fd2VicGFja19tb2R1bGVzX187XG5cbi8vIHRoZSBzdGFydHVwIGZ1bmN0aW9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuXHQvLyBUaGlzIGVudHJ5IG1vZHVsZSBkZXBlbmRzIG9uIG90aGVyIGxvYWRlZCBjaHVua3MgYW5kIGV4ZWN1dGlvbiBuZWVkIHRvIGJlIGRlbGF5ZWRcblx0dmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8odW5kZWZpbmVkLCBbXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzXCIpKSlcblx0X193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyhfX3dlYnBhY2tfZXhwb3J0c19fKTtcblx0cmV0dXJuIF9fd2VicGFja19leHBvcnRzX187XG59O1xuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmFtZEQgPSBmdW5jdGlvbiAoKSB7XG5cdHRocm93IG5ldyBFcnJvcignZGVmaW5lIGNhbm5vdCBiZSB1c2VkIGluZGlyZWN0Jyk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kTyA9IHt9OyIsInZhciBkZWZlcnJlZCA9IFtdO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5PID0gKHJlc3VsdCwgY2h1bmtJZHMsIGZuLCBwcmlvcml0eSkgPT4ge1xuXHRpZihjaHVua0lkcykge1xuXHRcdHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcblx0XHRmb3IodmFyIGkgPSBkZWZlcnJlZC5sZW5ndGg7IGkgPiAwICYmIGRlZmVycmVkW2kgLSAxXVsyXSA+IHByaW9yaXR5OyBpLS0pIGRlZmVycmVkW2ldID0gZGVmZXJyZWRbaSAtIDFdO1xuXHRcdGRlZmVycmVkW2ldID0gW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldO1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXIgbm90RnVsZmlsbGVkID0gSW5maW5pdHk7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWQubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldID0gZGVmZXJyZWRbaV07XG5cdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaHVua0lkcy5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYgKChwcmlvcml0eSAmIDEgPT09IDAgfHwgbm90RnVsZmlsbGVkID49IHByaW9yaXR5KSAmJiBPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLk8pLmV2ZXJ5KChrZXkpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fLk9ba2V5XShjaHVua0lkc1tqXSkpKSkge1xuXHRcdFx0XHRjaHVua0lkcy5zcGxpY2Uoai0tLCAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZ1bGZpbGxlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZihwcmlvcml0eSA8IG5vdEZ1bGZpbGxlZCkgbm90RnVsZmlsbGVkID0gcHJpb3JpdHk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKGZ1bGZpbGxlZCkge1xuXHRcdFx0ZGVmZXJyZWQuc3BsaWNlKGktLSwgMSlcblx0XHRcdHZhciByID0gZm4oKTtcblx0XHRcdGlmIChyICE9PSB1bmRlZmluZWQpIHJlc3VsdCA9IHI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3MgYW5kIGNodW5rcyB0aGF0IHRoZSBlbnRyeXBvaW50IGRlcGVuZHMgb25cbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5idW5kbGUuanNcIjtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5ubWQgPSAobW9kdWxlKSA9PiB7XG5cdG1vZHVsZS5wYXRocyA9IFtdO1xuXHRpZiAoIW1vZHVsZS5jaGlsZHJlbikgbW9kdWxlLmNoaWxkcmVuID0gW107XG5cdHJldHVybiBtb2R1bGU7XG59OyIsInZhciBzY3JpcHRVcmw7XG5pZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5nLmltcG9ydFNjcmlwdHMpIHNjcmlwdFVybCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5sb2NhdGlvbiArIFwiXCI7XG52YXIgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCAmJiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ1NDUklQVCcpXG5cdFx0c2NyaXB0VXJsID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG5cdGlmICghc2NyaXB0VXJsKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKTtcblx0XHRpZihzY3JpcHRzLmxlbmd0aCkge1xuXHRcdFx0dmFyIGkgPSBzY3JpcHRzLmxlbmd0aCAtIDE7XG5cdFx0XHR3aGlsZSAoaSA+IC0xICYmICghc2NyaXB0VXJsIHx8ICEvXmh0dHAocz8pOi8udGVzdChzY3JpcHRVcmwpKSkgc2NyaXB0VXJsID0gc2NyaXB0c1tpLS1dLnNyYztcblx0XHR9XG5cdH1cbn1cbi8vIFdoZW4gc3VwcG9ydGluZyBicm93c2VycyB3aGVyZSBhbiBhdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIHlvdSBtdXN0IHNwZWNpZnkgYW4gb3V0cHV0LnB1YmxpY1BhdGggbWFudWFsbHkgdmlhIGNvbmZpZ3VyYXRpb25cbi8vIG9yIHBhc3MgYW4gZW1wdHkgc3RyaW5nIChcIlwiKSBhbmQgc2V0IHRoZSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyB2YXJpYWJsZSBmcm9tIHlvdXIgY29kZSB0byB1c2UgeW91ciBvd24gbG9naWMuXG5pZiAoIXNjcmlwdFVybCkgdGhyb3cgbmV3IEVycm9yKFwiQXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXJcIik7XG5zY3JpcHRVcmwgPSBzY3JpcHRVcmwucmVwbGFjZSgvXmJsb2I6LywgXCJcIikucmVwbGFjZSgvIy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcPy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcL1teXFwvXSskLywgXCIvXCIpO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5wID0gc2NyaXB0VXJsOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBjaHVua3Ncbi8vIFwiMVwiIG1lYW5zIFwiYWxyZWFkeSBsb2FkZWRcIlxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJzcmNfc2ltdWxhdGlvbl93b3JrZXJfanNcIjogMVxufTtcblxuLy8gaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0dmFyIFtjaHVua0lkcywgbW9yZU1vZHVsZXMsIHJ1bnRpbWVdID0gZGF0YTtcblx0Zm9yKHZhciBtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG5cdFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLm1bbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHR3aGlsZShjaHVua0lkcy5sZW5ndGgpXG5cdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRzLnBvcCgpXSA9IDE7XG5cdHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uKGRhdGEpO1xufTtcbl9fd2VicGFja19yZXF1aXJlX18uZi5pID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdC8vIFwiMVwiIGlzIHRoZSBzaWduYWwgZm9yIFwiYWxyZWFkeSBsb2FkZWRcIlxuXHRpZighaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG5cdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdGltcG9ydFNjcmlwdHMoX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgX193ZWJwYWNrX3JlcXVpcmVfXy51KGNodW5rSWQpKTtcblx0XHR9XG5cdH1cbn07XG5cbnZhciBjaHVua0xvYWRpbmdHbG9iYWwgPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gfHwgW107XG52YXIgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24gPSBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IGluc3RhbGxDaHVuaztcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdCIsInZhciBuZXh0ID0gX193ZWJwYWNrX3JlcXVpcmVfXy54O1xuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5lKFwidmVuZG9ycy1ub2RlX21vZHVsZXNfc2VlZHJhbmRvbV9pbmRleF9qcy1ub2RlX21vZHVsZXNfc3RhdHMtbGl0ZV9zdGF0c19qc1wiKS50aGVuKG5leHQpO1xufTsiLCIiLCIvLyBydW4gc3RhcnR1cFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLngoKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==