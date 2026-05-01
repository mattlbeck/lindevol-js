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

    constructor(mapping, codeRange=256){
        this.mapping = mapping;
        this.codeRange = codeRange;
        this.actions = [Divide, FlyingSeed, LocalSeed, MutatePlus, MutateMinus, StateBitN];
    }

    getAction(actionCode){
        // Normalize the action code into the [0, sum) range so weights can be
        // any positive integers rather than needing to sum to codeRange.
        const sum = this.mapping.reduce((a, b) => a + b, 0);
        const normalizedCode = Math.floor((actionCode / this.codeRange) * sum);
        var mappingCount = 0;
        for(var i=0; i<this.mapping.length; i++){
            mappingCount += this.mapping[i];
            if (normalizedCode < mappingCount){
                return new this.actions[i](actionCode);
            }
        }
        // Fallback for floating-point edge cases
        return new this.actions[this.mapping.length - 1](actionCode);
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

    static from(arr, mut_exp=0){
        var ba = new ByteArray(arr.length, mut_exp);
        for(var i=0; i<ba.length;i++){
            ba[i] = arr[i];
        }
        return ba;
    }

    /**
     * Serialize this genome to a string: "<mut_exp>;<byte0>,<byte1>,..."
     */
    serialize(){
        return `${this.mut_exp};${Array.from(this).join(",")}`;
    }

    /**
     * Deserialize a genome string produced by serialize().
     * @param {string} str
     * @returns {ByteArray}
     */
    static deserialize(str){
        const parts = str.trim().split(";");
        const mut_exp = parseFloat(parts[0]);
        const bytes = parts[1].split(",").map(Number);
        return ByteArray.from(bytes, mut_exp);
    }

    static random(length){
        var ba = new ByteArray(length);
        for(var i=0; i<ba.length;i++){
            ba[i] = (0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, 255);
        }
        return ba;
    }

    copy(){
        var newArr = new ByteArray(this.length, this.mut_exp);
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
    constructor(mapping, codeRange=256){
        this.mapping = new _actions_js__WEBPACK_IMPORTED_MODULE_1__.ActionMap(mapping, codeRange);
    }
    interpret(bytearray){

    }
}

class BlockInterpreter extends GenomeInterpreter{
    constructor(mapping){
        super(mapping, 256); // action byte is full 0-255 range
    }
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
    constructor(mapping){
        super(mapping, 64); // terminator contributes lower 6 bits: range 0-63
    }
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


function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    let matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function calculateAlleleEntropy(plants) {
    if (plants.length === 0) return 0;
    const counts = new Array(256).fill(0);
    let total = 0;
    plants.forEach(p => {
        for (let i = 0; i < p.genome.length; i++) {
            counts[p.genome[i]]++;
            total++;
        }
    });
    if (total === 0) return 0;
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
        if (counts[i] > 0) {
            const p = counts[i] / total;
            entropy -= p * Math.log2(p);
        }
    }
    return entropy;
}

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
            }),
            new Collector("genetic_distance_mean", AsIs, function(sim) {
                const plants = sim.world.plants;
                if (plants.length < 2) return 0;
                let sumDist = 0;
                let sampleSize = Math.min(30, plants.length);
                let pairs = 0;
                for (let i = 0; i < sampleSize; i++) {
                    const p1 = plants[Math.floor(Math.random() * plants.length)];
                    const p2 = plants[Math.floor(Math.random() * plants.length)];
                    if (p1 !== p2) {
                        sumDist += levenshtein(p1.genome, p2.genome);
                        pairs++;
                    }
                }
                return pairs > 0 ? sumDist / pairs : 0;
            }),
            new Collector("allele_entropy", AsIs, function(sim) {
                return calculateAlleleEntropy(sim.world.plants);
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
        if (this.data["stepnum"].length > SimData.MAX_DATA_POINTS) {
            this.data["stepnum"].shift();
        }
        Object.keys(stepData).forEach(function(k){
            if (!(k in this.data)){
                this.data[k] = [];
            }
            this.data[k].push(stepData[k]);
            if (this.data[k].length > SimData.MAX_DATA_POINTS) {
                this.data[k].shift();
            }
        }, this);
    }
}
SimData.MAX_DATA_POINTS = 2000;

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

    /**
     * Initialise the population from a list of serialized genome strings,
     * drawing with replacement up to initial_population.
     * @param {string[]} serializedGenomes
     */
    init_population_from_genomes(serializedGenomes){
        for (var i=0; i<this.params.initial_population; i++){
            const str = serializedGenomes[Math.floor(Math.random() * serializedGenomes.length)];
            const genome = _genome_js__WEBPACK_IMPORTED_MODULE_2__.ByteArray.deserialize(str);
            this.world.seed(genome);
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
        initSim(msg.params, msg.genomes || null);
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
        pushStats();
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
    case "export":
        exportGenomes();
        break;
    }
};

function initSim(params, importedGenomes=null) {
    running = false;
    const sim_params = new _simulation_js__WEBPACK_IMPORTED_MODULE_0__.SimulationParams(params);
    cellSize = params.cellSize || 8;
    simulation = new _simulation_js__WEBPACK_IMPORTED_MODULE_0__.Simulation(sim_params);
    data = new _simdata_js__WEBPACK_IMPORTED_MODULE_1__.SimData(simulation);
    if (importedGenomes && importedGenomes.length > 0) {
        simulation.init_population_from_genomes(importedGenomes);
    } else {
        simulation.init_population();
    }
    pushFrame();
    pushStats();
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
        pushStats();
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
    }
}

function pushStats() {
    if (!data) return;
    self.postMessage({
        type: "stats",
        data: JSON.parse(JSON.stringify(data.data)),
        stepnum: simulation.stepnum
    });
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

function exportGenomes() {
    const seen = new Set();
    simulation.world.plants.forEach(plant => {
        seen.add(plant.genome.serialize());
    });
    const genomes = Array.from(seen);
    self.postMessage({ type: "exportedGenomes", genomes });
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

        // Use the correct state depending on interpreter type
        let cellState;
        if (simulation.params.genome_interpreter === "block") {
            cellState = plant.getNeighbourhood(cell);
        } else {
            cellState = plant.getState(cell);
        }
        const neighbourhood = plant.getNeighbourhood(cell);
        const energised = cell.energised;

        // Serialize rules as structured objects for rich UI rendering
        const serializedRules = rules.map((r, i) => {
            const matches = r.matches(cellState);
            const actionStr = r.action.toString();
            const isDiv = actionStr.startsWith("divide");
            return {
                index: i,
                matches,
                state: r.state,
                eqMask: r.eqMask,
                actionType: isDiv ? "divide" : actionStr,
                direction: isDiv ? r.action.getDirection() : null,
            };
        });

        const matchingRuleIndex = serializedRules.findIndex(r => r.matches);

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
            energised,
            cellState,
            matchingRuleIndex,
            death: JSON.stringify(death),
            genomeLength: plant.genome.length,
            mutExp: plant.genome.mut_exp,
            rules: serializedRules,
            interpreterType: simulation.params.genome_interpreter,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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UEE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxFQUFFO1dBQ0YsRTs7Ozs7V0NSQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1dDSkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxHQUFHO1dBQ0g7V0FDQTtXQUNBLENBQUMsSTs7Ozs7V0NQRCx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0QsRTs7Ozs7V0NOQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1dDSkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esa0M7Ozs7O1dDbEJBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxhQUFhO1dBQ2I7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBOztXQUVBOztXQUVBLGtCOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztVRUhBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9saW5kZXZvbC9pZ25vcmVkfC9Vc2Vycy9tYXR0L2xpbmRldm9sLWpzL25vZGVfbW9kdWxlcy9zZWVkcmFuZG9tfGNyeXB0byIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9hY3Rpb25zLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2NlbGwuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvZ2Vub21lLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3BsYW50LmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3JhbmRvbS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW1kYXRhLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvd29ybGQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBkZWZpbmUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBvcHRpb25zIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9ub2RlIG1vZHVsZSBkZWNvcmF0b3IiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3B1YmxpY1BhdGgiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2ltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvc3RhcnR1cCBjaHVuayBkZXBlbmRlbmNpZXMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIChpZ25vcmVkKSAqLyIsImNvbnN0IE5FSUdIQk9VUkhPT0QgPSBbWy0xLC0xXSwgWzAsLTFdLCBbMSwtMV0sIFstMSwwXSwgWzEsMF0sIFstMSwxXSwgWzAsMV0sIFsxLDFdXTtcbmNvbnN0IE1VVF9JTkNSRU1FTlQgPSAwLjAwMTtcblxuY2xhc3MgQWN0aW9ue1xuICAgIGNvbnN0cnVjdG9yKGFjdGlvbkNvZGUpe1xuICAgICAgICB0aGlzLmNvZGUgPSBhY3Rpb25Db2RlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZXhlY3V0ZShjZWxsKXtcbiAgICAgICAgLy8gYWN0aW9ucyBhcmUgdHlwaWNhbGx5IG9ubHkgY2FycmllZCBvdXQgaWYgdGhlIGNlbGwgaGFzIGVuZXJneVxuICAgICAgICAvLyBhbmQgdGhlIGNlbGwgbG9zZXMgZW5lcmd5IGFzIGEgcmVzdWx0LlxuICAgICAgICBpZiAoY2VsbC5lbmVyZ2lzZWQpe1xuICAgICAgICAgICAgdmFyIHN1Y2Nlc3MgPSB0aGlzLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICAgICAgY2VsbC5lbmVyZ2lzZWQgPSAhc3VjY2VzcztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBkb0FjdGlvbihjZWxsKXtcblxuICAgIH1cbn1cblxuY2xhc3MgRGl2aWRlIGV4dGVuZHMgQWN0aW9ue1xuXG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIC8vIHRoZSAyIGxlYXN0IHNpZ25pZmljYW50IGJpdHMgb2YgdGhlIGFjdGlvbiBjb2RlXG4gICAgICAgIC8vIGRldGVybWluZXMgd2hpY2ggZGlyZWN0aW9uIHRoZSBkaXZpZGUgYWN0aW9uIGlzIGZvclxuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgZ2V0RGlyZWN0aW9uKCl7XG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIGNvcnJlY3QgYml0c1xuICAgICAgICAvLyAmIHdpdGggMDAwMDAxMTEgdG8gbWFzayBvdXQgbGVhc3Qgc2lnIGJpdHNcbiAgICAgICAgdmFyIGRpcmVjdGlvbkNvZGUgPSB0aGlzLmNvZGUgJiA3O1xuICAgICAgICByZXR1cm4gTkVJR0hCT1VSSE9PRFtkaXJlY3Rpb25Db2RlXTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYGRpdmlkZSAke3RoaXMuZ2V0RGlyZWN0aW9uKCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIE11dGF0ZVBsdXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwICs9IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dCtcIjtcbiAgICB9XG59XG5cbmNsYXNzIE11dGF0ZU1pbnVzIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgY2VsbC5wbGFudC5nZW5vbWUubXV0X2V4cCAtPSBNVVRfSU5DUkVNRU5UO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJtdXQtXCI7XG4gICAgfVxufVxuXG5jbGFzcyBGbHlpbmdTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCkpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcImZseWluZ3NlZWRcIjtcbiAgICB9XG59XG5cbmNsYXNzIExvY2FsU2VlZCBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIHJldHVybiBjZWxsLnBsYW50LndvcmxkLnNlZWQoY2VsbC5wbGFudC5nZW5vbWUuY29weSgpLCBjZWxsLngpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcImxvY2Fsc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgU3RhdGVCaXROIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpIHtcbiAgICAgICAgY2VsbC5uZXh0SW50ZXJuYWxTdGF0ZSA9IGNlbGwubmV4dEludGVybmFsU3RhdGUgJiBNYXRoLnBvdygyLCB0aGlzLmdldE50aEJpdCgpKTtcbiAgICAgICAgLy8gdGhpcyBhY3Rpb24gZG9lcyBub3QgY29uc3VtZSBlbmVyZ3lcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGdldE50aEJpdCgpe1xuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcbiAgICAgICAgLy8gJiB3aXRoIDAwMDAxMTExIHRvIG1hc2sgb3V0IGxlYXN0IHNpZyBiaXRzXG4gICAgICAgIHJldHVybiB0aGlzLmNvZGUgJiAxNTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYFN0YXRlQml0ICR7dGhpcy5nZXROdGhCaXQoKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgQWN0aW9uTWFwIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcsIGNvZGVSYW5nZT0yNTYpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBtYXBwaW5nO1xuICAgICAgICB0aGlzLmNvZGVSYW5nZSA9IGNvZGVSYW5nZTtcbiAgICAgICAgdGhpcy5hY3Rpb25zID0gW0RpdmlkZSwgRmx5aW5nU2VlZCwgTG9jYWxTZWVkLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgU3RhdGVCaXROXTtcbiAgICB9XG5cbiAgICBnZXRBY3Rpb24oYWN0aW9uQ29kZSl7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgYWN0aW9uIGNvZGUgaW50byB0aGUgWzAsIHN1bSkgcmFuZ2Ugc28gd2VpZ2h0cyBjYW4gYmVcbiAgICAgICAgLy8gYW55IHBvc2l0aXZlIGludGVnZXJzIHJhdGhlciB0aGFuIG5lZWRpbmcgdG8gc3VtIHRvIGNvZGVSYW5nZS5cbiAgICAgICAgY29uc3Qgc3VtID0gdGhpcy5tYXBwaW5nLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkQ29kZSA9IE1hdGguZmxvb3IoKGFjdGlvbkNvZGUgLyB0aGlzLmNvZGVSYW5nZSkgKiBzdW0pO1xuICAgICAgICB2YXIgbWFwcGluZ0NvdW50ID0gMDtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5tYXBwaW5nLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG1hcHBpbmdDb3VudCArPSB0aGlzLm1hcHBpbmdbaV07XG4gICAgICAgICAgICBpZiAobm9ybWFsaXplZENvZGUgPCBtYXBwaW5nQ291bnQpe1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5hY3Rpb25zW2ldKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEZhbGxiYWNrIGZvciBmbG9hdGluZy1wb2ludCBlZGdlIGNhc2VzXG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5hY3Rpb25zW3RoaXMubWFwcGluZy5sZW5ndGggLSAxXShhY3Rpb25Db2RlKTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHtEaXZpZGUsIE11dGF0ZVBsdXMsIE11dGF0ZU1pbnVzLCBMb2NhbFNlZWQsIEZseWluZ1NlZWQsIEFjdGlvbk1hcCwgTkVJR0hCT1VSSE9PRH07IiwiXG5jbGFzcyBDZWxse1xuICAgIGNvbnN0cnVjdG9yKHBsYW50LCB4LCB5KXtcbiAgICAgICAgdGhpcy5wbGFudCA9IHBsYW50O1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gMDtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZ2V0IGVuZXJnaXNlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuZXJnaXNlZDtcbiAgICB9XG5cbiAgICBzZXQgZW5lcmdpc2VkKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmVyZ2lzZWQgPT09IHZhbHVlKSByZXR1cm47XG4gICAgICAgIHRoaXMuX2VuZXJnaXNlZCA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5wbGFudCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudCsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYW50LmVuZXJnaXNlZENvdW50LS07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVTdGF0ZSgpe1xuICAgICAgICB0aGlzLmludGVybmFsU3RhdGUgPSB0aGlzLm5leHRJbnRlcm5hbFN0YXRlO1xuICAgICAgICB0aGlzLm5leHRJbnRlcm5hbFN0YXRlID0gMDtcbiAgICB9XG5cbiAgICBkcmF3KGN0eCwgeCwgeSwgc2l6ZSwgY29sb3VyKXtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG91cjtcbiAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgICAgICAvL2N0eC5zdHJva2VSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgQ2VsbCBhdCAoJHt0aGlzLnh9LCAke3RoaXMueX0pIGVuZXJneTogJHt0aGlzLmVuZXJnaXNlZH1gO1xuICAgIH1cbn1cblxuZXhwb3J0IHtDZWxsfTsiLCJpbXBvcnQge3JhbmRvbUludCwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge0FjdGlvbk1hcH0gZnJvbSBcIi4vYWN0aW9ucy5qc1wiO1xuXG5jbGFzcyBCeXRlQXJyYXkgZXh0ZW5kcyBBcnJheXtcblxuICAgIGNvbnN0cnVjdG9yKGxlbmd0aD0wLCBpbml0aWFsX211dF9leHA9MCl7XG4gICAgICAgIHN1cGVyKGxlbmd0aCk7XG4gICAgICAgIHRoaXMubXV0X2V4cCA9IGluaXRpYWxfbXV0X2V4cDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbShhcnIsIG11dF9leHA9MCl7XG4gICAgICAgIHZhciBiYSA9IG5ldyBCeXRlQXJyYXkoYXJyLmxlbmd0aCwgbXV0X2V4cCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSBhcnJbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlcmlhbGl6ZSB0aGlzIGdlbm9tZSB0byBhIHN0cmluZzogXCI8bXV0X2V4cD47PGJ5dGUwPiw8Ynl0ZTE+LC4uLlwiXG4gICAgICovXG4gICAgc2VyaWFsaXplKCl7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm11dF9leHB9OyR7QXJyYXkuZnJvbSh0aGlzKS5qb2luKFwiLFwiKX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlc2VyaWFsaXplIGEgZ2Vub21lIHN0cmluZyBwcm9kdWNlZCBieSBzZXJpYWxpemUoKS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gICAgICogQHJldHVybnMge0J5dGVBcnJheX1cbiAgICAgKi9cbiAgICBzdGF0aWMgZGVzZXJpYWxpemUoc3RyKXtcbiAgICAgICAgY29uc3QgcGFydHMgPSBzdHIudHJpbSgpLnNwbGl0KFwiO1wiKTtcbiAgICAgICAgY29uc3QgbXV0X2V4cCA9IHBhcnNlRmxvYXQocGFydHNbMF0pO1xuICAgICAgICBjb25zdCBieXRlcyA9IHBhcnRzWzFdLnNwbGl0KFwiLFwiKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgcmV0dXJuIEJ5dGVBcnJheS5mcm9tKGJ5dGVzLCBtdXRfZXhwKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmFuZG9tKGxlbmd0aCl7XG4gICAgICAgIHZhciBiYSA9IG5ldyBCeXRlQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8YmEubGVuZ3RoO2krKyl7XG4gICAgICAgICAgICBiYVtpXSA9IHJhbmRvbUludCgwLCAyNTUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICBjb3B5KCl7XG4gICAgICAgIHZhciBuZXdBcnIgPSBuZXcgQnl0ZUFycmF5KHRoaXMubGVuZ3RoLCB0aGlzLm11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG5ld0FycltpXSA9IHRoaXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld0FycjtcbiAgICB9XG5cbn1cblxuY2xhc3MgTXV0YXRvcntcbiAgICBjb25zdHJ1Y3Rvcihwcm9iLCBwcm9iX3JlcGxhY2VtZW50LCBwcm9iX2luc2VydGlvbiwgcHJvYl9kZWxldGlvbiwgcHJvYl9kdXAsIHJlcGxhY2VtZW50X21vZGUsIHVuaXRzKXtcbiAgICAgICAgdGhpcy5wcm9iID0gcHJvYjtcbiAgICAgICAgdGhpcy5wUiA9IHByb2JfcmVwbGFjZW1lbnQ7XG4gICAgICAgIHRoaXMucEkgPSBwcm9iX2luc2VydGlvbjtcbiAgICAgICAgdGhpcy5wRCA9IHByb2JfZGVsZXRpb247XG4gICAgICAgIHRoaXMucER1cCA9IHByb2JfZHVwO1xuICAgICAgICB0aGlzLnBSbW9kZSA9IHJlcGxhY2VtZW50X21vZGU7ICBcbiAgICAgICAgdGhpcy51bml0cyA9IHVuaXRzO1xuICAgIH1cblxuICAgIG11dGF0ZShnZW5vbWUpe1xuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucFIsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2UoZ2Vub21lKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEksIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmluc2VydChnZW5vbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMubVByb2IodGhpcy5wRCwgZ2Vub21lLm11dF9leHApKXtcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlKGdlbm9tZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtUHJvYihwLCBleHApe1xuICAgICAgICByZXR1cm4gcmFuZG9tUHJvYihwICogTWF0aC5wb3coIHRoaXMucHJvYiwgZXhwKSk7XG4gICAgfVxuXG4gICAgcmVwbGFjZShnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIHN3aXRjaCh0aGlzLnBSbW9kZSl7XG4gICAgICAgIGNhc2UgXCJieXRld2lzZVwiOlxuICAgICAgICAgICAgZ2Vub21lW2ldID0gdGhpcy5yYW5kb21DaGFyKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImJpdHdpc2VcIjpcbiAgICAgICAgICAgIGdlbm9tZVtpXSA9IGdlbm9tZVtpXSBeIE1hdGgucG93KDIsIHJhbmRvbUludCgwLCA3KSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBtdXRhdGlvbiByZXBsYWNlbWVudCBtb2RlOiAke3RoaXMucFJtb2RlfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cblxuICAgIGluc2VydChnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIGZvcih2YXIgbj0wOyBuPHRoaXMudW5pdHM7IG4rKyl7XG4gICAgICAgICAgICBnZW5vbWUuc3BsaWNlKGksIDAsIHRoaXMucmFuZG9tQ2hhcigpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlbGV0ZShnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIGZvcih2YXIgbj0wOyBuPHRoaXMudW5pdHM7IG4rKyl7XG4gICAgICAgICAgICBnZW5vbWUuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmFuZG9tQ2hhcigpe1xuICAgICAgICByZXR1cm4gcmFuZG9tSW50KDAsIDI1NSk7XG4gICAgfVxuXG4gICAgcmFuZG9tUG9zKGdlbm9tZSl7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQoMCwgZ2Vub21lLmxlbmd0aC0xKTtcbiAgICB9XG59XG5cblxuXG5jbGFzcyBSdWxlIHtcbiAgICBjb25zdHJ1Y3RvcihlcU1hc2ssIHN0YXRlLCBhY3Rpb24pe1xuICAgICAgICB0aGlzLmVxTWFzayA9IGVxTWFzaztcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgICAgICB0aGlzLmFjdGlvbiA9IGFjdGlvbjtcbiAgICB9XG5cbiAgICBtYXRjaGVzKHN0YXRlKXtcbiAgICAgICAgdmFyIGVxU3RhdGUgPSBzdGF0ZSAmIHRoaXMuZXFNYXNrO1xuICAgICAgICByZXR1cm4gZXFTdGF0ZSA9PT0gdGhpcy5zdGF0ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5zdGF0ZX0gLT4gJHt0aGlzLmFjdGlvbn1gO1xuICAgIH1cbn1cblxuY2xhc3MgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgLyoqXG4gICAgICogTWV0aG9kcyB0aGF0IGRlY29kZSBnZW5vbWVzIGludG8gcnVsZXNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nLCBjb2RlUmFuZ2U9MjU2KXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbmV3IEFjdGlvbk1hcChtYXBwaW5nLCBjb2RlUmFuZ2UpO1xuICAgIH1cbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5KXtcblxuICAgIH1cbn1cblxuY2xhc3MgQmxvY2tJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcpe1xuICAgICAgICBzdXBlcihtYXBwaW5nLCAyNTYpOyAvLyBhY3Rpb24gYnl0ZSBpcyBmdWxsIDAtMjU1IHJhbmdlXG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBieXRlYXJyYXkubGVuZ3RoOyBpKz0yKXtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLm1hcHBpbmcuZ2V0QWN0aW9uKGJ5dGVhcnJheVtpKzFdKTtcbiAgICAgICAgICAgIHJ1bGVzLnB1c2gobmV3IFJ1bGUoMjU1LCBieXRlYXJyYXlbaV0sIGFjdGlvbikpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmNsYXNzIFByb21vdG9ySW50ZXJwcmV0ZXIgZXh0ZW5kcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nKXtcbiAgICAgICAgc3VwZXIobWFwcGluZywgNjQpOyAvLyB0ZXJtaW5hdG9yIGNvbnRyaWJ1dGVzIGxvd2VyIDYgYml0czogcmFuZ2UgMC02M1xuICAgIH1cbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5KXtcbiAgICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICAgIHZhciBnZW5lcyA9IFtdO1xuICAgICAgICB2YXIgZ2VuZSA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgYyA9IGJ5dGVhcnJheVtpXTtcbiAgICAgICAgICAgIGlmKGJpdFNldChjLCA2KSA9PT0gYml0U2V0KGMsIDcpKXtcbiAgICAgICAgICAgICAgICAvLyBvcGVyYXRvclxuICAgICAgICAgICAgICAgIGlmKGdlbmUubGVuZ3RoPjApe1xuICAgICAgICAgICAgICAgICAgICBnZW5lLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDcpKXtcbiAgICAgICAgICAgICAgICAvLyBwcm9tb3RvclxuICAgICAgICAgICAgICAgIGdlbmUgPSBbY107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIGlmKGJpdFNldChjLCA2KSl7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRlcm1pbmF0b3JcbiAgICAgICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcy5wdXNoKGdlbmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgZ2VuZXMuZm9yRWFjaChmdW5jdGlvbihnZW5lKXtcbiAgICAgICAgICAgIC8vIGV4dHJhY3QgNiBsZWFzdCBzaWcgYml0cyBmcm9tIHRlcm1pbmF0b3IgYXMgdGhlIGFjdGlvbiBjb2RlXG4gICAgICAgICAgICB2YXIgYWN0aW9uQ29kZSA9IGdlbmVbZ2VuZS5sZW5ndGgtMV0gJiAoTWF0aC5wb3coMiwgNikgLSAxKTtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLm1hcHBpbmcuZ2V0QWN0aW9uKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyB0YWtlIGluZm9ybWF0aW9uIGZyb20gb3BlcmF0b3JzIHRvIGNyZWF0ZSBzdGF0ZSBtYXNrXG4gICAgICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgICAgICB2YXIgZXFNYXNrID0gMDsgLy8gc3BlY2lmaWVkIHdoaWNoIGJpdHMgY29udHJpYnV0ZSB0byB0aGUgc3RhdGUgbWFza1xuICAgICAgICAgICAgZm9yKHZhciBpPTE7IGk8Z2VuZS5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gNCBsZWFzdCBzaWcgYml0cyBkZXRlcm1pbmUgdGhlIG1hc2sgaW5kZXhcbiAgICAgICAgICAgICAgICB2YXIgbWFza0JpdCA9IGdlbmVbaV0gJiAoTWF0aC5wb3coMiwgNCkgLSAxKTtcblxuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZXMgaWYgdGhlIG1hc2sgYXQgdGhpcyBpbmRleCBpcyBzZXQgdG8gMSBvciAwXG4gICAgICAgICAgICAgICAgdmFyIGJpdFN0YXRlID0gKGdlbmVbaV0gJiBNYXRoLnBvdygyLCA0KSkgPj4gNDtcbiAgICAgICAgICAgICAgICBtYXNrICs9IE1hdGgucG93KDIsIG1hc2tCaXQpKmJpdFN0YXRlO1xuXG4gICAgICAgICAgICAgICAgZXFNYXNrICs9IE1hdGgucG93KDIsIG1hc2tCaXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZShlcU1hc2ssIG1hc2ssIGFjdGlvbikpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHJ1bGVzO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYml0U2V0KGJ5dGUsIGkpe1xuICAgIHJldHVybiAoYnl0ZSAmIE1hdGgucG93KDIsIGkpKSA+PiBpO1xufVxuXG5leHBvcnQge0J5dGVBcnJheSwgQmxvY2tJbnRlcnByZXRlciwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtDZWxsfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5pbXBvcnQge05FSUdIQk9VUkhPT0R9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgUGxhbnR7XG4gICAgY29uc3RydWN0b3IoeCwgd29ybGQsIGdlbm9tZSwgdXNlSW50ZXJuYWxTdGF0ZT1mYWxzZSkge1xuICAgICAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgICAgIHRoaXMuZW5lcmdpc2VkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmNlbGxzID0gW25ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgMCldO1xuICAgICAgICB0aGlzLmdlbm9tZSA9IGdlbm9tZTtcbiAgICAgICAgdGhpcy51c2VJbnRlcm5hbFN0YXRlID0gdXNlSW50ZXJuYWxTdGF0ZTtcbiAgICB9XG5cbiAgICBnZXROZWlnaGJvdXJob29kKGNlbGwpe1xuICAgICAgICAvLyBSZXR1cm4gdGhlIG5laWdoYm91cmhvb2QgbWFza1xuICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPE5FSUdIQk9VUkhPT0QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIHBvcyA9IE5FSUdIQk9VUkhPT0RbaV07XG4gICAgICAgICAgICB2YXIgeCA9IGNlbGwueCArIHBvc1swXTtcbiAgICAgICAgICAgIHZhciB5ID0gY2VsbC55ICsgcG9zWzFdO1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaChlcnJvcil7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod29ybGRQb3MgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgICAgICBtYXNrID0gbWFzayB8IE1hdGgucG93KDIsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXNrO1xuICAgIH1cblxuICAgIGdldFN0YXRlKGNlbGwpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXROZWlnaGJvdXJob29kKGNlbGwpIHwgY2VsbC5pbnRlcm5hbFN0YXRlIHwgKE1hdGgucG93KDIsIDE1KSAqICggY2VsbC5lbmVyZ2lzZWQgPyAxIDogMCkpO1xuICAgIH1cblxuICAgIGdyb3coKXtcbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBncm93XG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKDAuOCkpe1xuICAgICAgICAgICAgICAgIHZhciBzcGFjZXMgPSB0aGlzLmdldEdyb3dEaXJlY3Rpb24oY2VsbCk7XG4gICAgICAgICAgICAgICAgaWYoc3BhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gc3BhY2VzW3JhbmRvbUludCgwLCBzcGFjZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR3JvdyB0aGUgcGxhbnQgYnkgb25lIGNlbGwgaWYgcG9zc2libGVcbiAgICAgKiBAcGFyYW0geyp9IGNlbGwgdGhlIGNlbGwgdG8gZ3JvdyBmcm9tXG4gICAgICogQHBhcmFtIHsqfSBkaXJlY3Rpb24gdGhlIGRpcmVjdGlvbiB0byBncm93IGluXG4gICAgICovXG4gICAgZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbil7XG4gICAgICAgIHZhciB4ID0gY2VsbC54K2RpcmVjdGlvblswXSwgeSA9IGNlbGwueStkaXJlY3Rpb25bMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIHNwYWNlIGlzIGNsZWFyXG4gICAgICAgIHZhciBzcGFjZSA9IHRoaXMud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICAgICAgaWYgKHNwYWNlID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGFjZSBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgaWYgKHNwYWNlLnBsYW50ID09PSB0aGlzKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGlzIHBsYW50IHdpbGwga2lsbCB0aGUgb3RoZXJcbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9iYWJpbGl0eS4uLlxuICAgICAgICAgICAgaWYocmFuZG9tUHJvYihzcGFjZS5wbGFudC5nZXRLaWxsUHJvYmFiaWxpdHkoKSkpe1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBzdWNjZWVkZWQuIEtpbGwgY29tcGV0aXRvciBhbmQgY29udGludWUgd2l0aCBncm93dGhcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChzcGFjZS5wbGFudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgZmFpbGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgLy8gZ3JvdyBjZWxsIGluIHRvIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBuZXdfY2VsbCA9IG5ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgeSk7XG4gICAgICAgIHRoaXMuY2VsbHMucHVzaChuZXdfY2VsbCk7XG4gICAgICAgIHRoaXMud29ybGQuYWRkQ2VsbChuZXdfY2VsbCk7XG4gICAgfVxuXG4gICAgZ2V0S2lsbFByb2JhYmlsaXR5KCl7XG4gICAgICAgIHJldHVybiAxL3RoaXMuZW5lcmdpc2VkQ291bnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIHdoZXRoZXIgdGhpcyBwbGFudCBzaG91bGQgZGllLlxuICAgICAqIEBwYXJhbSB7fSBuYXR1cmFsX2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBlbmVyZ3lfZXhwIGV4cG9uZW50IHRvIHRoZSBudW1iZXIgb2YgZW5lcmd5IHJpY2ggY2VsbHNcbiAgICAgKiBAcGFyYW0geyp9IGxlYW5vdmVyX2ZhY3RvciBmYWN0b3IgdG8gdGhlIGxlYW5vdmVyIHRlcm1cbiAgICAgKi9cbiAgICBnZXREZWF0aFByb2JhYmlsaXR5KGRlYXRoX2ZhY3RvciwgbmF0dXJhbF9leHAsIGVuZXJneV9leHAsIGxlYW5vdmVyX2ZhY3Rvcil7XG4gICAgICAgIHZhciBudW1DZWxscyA9IHRoaXMuY2VsbHMubGVuZ3RoO1xuICAgICAgICB2YXIgbGVhbm92ZXJFbmVyZ2lzZWQgPSAwO1xuICAgICAgICB2YXIgcm9vdENlbGwgPSB0aGlzLmNlbGxzWzBdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmNlbGxzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjZWxsID0gdGhpcy5jZWxsc1tpXTtcbiAgICAgICAgICAgIHZhciBsZSA9IHRoaXMud29ybGQud2lkdGgvMiAtICggKCggMS41KnRoaXMud29ybGQud2lkdGggKSArIGNlbGwueCAtIHJvb3RDZWxsLngpICAlIHRoaXMud29ybGQud2lkdGgpO1xuICAgICAgICAgICAgbGVhbm92ZXJFbmVyZ2lzZWQgKz0gbGU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVhbm92ZXJDZWxscyA9IDIvKG51bUNlbGxzKihudW1DZWxscy0xKSk7XG4gICAgICAgIGlmIChsZWFub3ZlckNlbGxzID09PSBJbmZpbml0eSl7XG4gICAgICAgICAgICBsZWFub3ZlckNlbGxzID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWFub3ZlclRlcm0gPSBsZWFub3ZlckNlbGxzKk1hdGguYWJzKGxlYW5vdmVyRW5lcmdpc2VkKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBkX25hdHVyYWwgPSBNYXRoLnBvdyhudW1DZWxscywgbmF0dXJhbF9leHApO1xuICAgICAgICB2YXIgZF9lbmVyZ3kgPSBNYXRoLnBvdyh0aGlzLmVuZXJnaXNlZENvdW50KzEsIGVuZXJneV9leHApO1xuICAgICAgICB2YXIgZF9sZWFub3ZlciA9IGxlYW5vdmVyX2ZhY3RvcipsZWFub3ZlclRlcm07XG4gICAgICAgIHZhciBwRGVhdGggPSBkZWF0aF9mYWN0b3IgKiBkX25hdHVyYWwgKiBkX2VuZXJneSArIGRfbGVhbm92ZXI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInByb2JcIjogcERlYXRoLFxuICAgICAgICAgICAgXCJuYXR1cmFsXCI6IGRfbmF0dXJhbCxcbiAgICAgICAgICAgIFwiZW5lcmd5XCI6IGRfZW5lcmd5LFxuICAgICAgICAgICAgXCJsZWFub3ZlclwiOiBkX2xlYW5vdmVyXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgeyBQbGFudCB9OyIsImltcG9ydCBzZWVkcmFuZG9tIGZyb20gXCJzZWVkcmFuZG9tXCI7XG5cbi8qKlxuICogU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIE1hdGgucmFuZG9tXG4gKiBAcGFyYW0geyp9IHNlZWQgZGF0YSB0byB1c2UgdG8gc2VlZCBhbGwgZnV0dXJlIFJORyBjYWxsc1xuICovXG5mdW5jdGlvbiBzZWVkUmFuZG9tKHNlZWQpe1xuICAgIHNlZWRyYW5kb20oc2VlZCwge2dsb2JhbDogdHJ1ZX0pO1xufVxuXG4vKipcbiAqIHJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIG1heCAoaW5jbHVzaXZlKVxuICogQHBhcmFtIHsqfSBtYXggbWF4aW11bSBpbnRlZ2VyIHRvIGdlbmVyYXRlIGFzIGEgcmFuZG9tIG51bWJlclxuICovXG5mdW5jdGlvbiByYW5kb21JbnQobWluLCBtYXgpe1xuICAgIC8vIG5vdGU6IE1hdGgucmFuZG9tIHJldHVybnMgYSByYW5kb20gbnVtYmVyIGV4Y2x1c2l2ZSBvZiAxLFxuICAgIC8vIHNvIHRoZXJlIGlzICsxIGluIHRoZSBiZWxvdyBlcXVhdGlvbiB0byBlbnN1cmUgdGhlIG1heGltdW1cbiAgICAvLyBudW1iZXIgaXMgY29uc2lkZXJlZCB3aGVuIGZsb29yaW5nIDAuOS4uLiByZXN1bHRzLlxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG4vKipcbiAqIEV2YWx1YXRlcyB0aGUgY2hhbmNlIG9mIGFuIGV2ZW50IGhhcHBlbmluZyBnaXZlbiBwcm9iXG4gKiBAcGFyYW0geyp9IHByb2IgZnJhY3Rpb24gYmV0d2VlbiAwIGFuZCAxIGNoYW5jZSBvZiB0aGUgZXZlbnQgaGFwcGVuaW5nXG4gKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBldmVudCBoYXBwZW5zLCBmYWxzZSBpZiBub3RcbiAqL1xuZnVuY3Rpb24gcmFuZG9tUHJvYihwcm9iKXtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8PSBwcm9iO1xufVxuXG5leHBvcnQge3NlZWRSYW5kb20sIHJhbmRvbUludCwgcmFuZG9tUHJvYn07IiwiaW1wb3J0ICogYXMgc3RhdHMgZnJvbSBcInN0YXRzLWxpdGVcIjtcblxuZnVuY3Rpb24gbGV2ZW5zaHRlaW4oYSwgYikge1xuICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGIubGVuZ3RoO1xuICAgIGlmIChiLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGEubGVuZ3RoO1xuICAgIGxldCBtYXRyaXggPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBiLmxlbmd0aDsgaSsrKSBtYXRyaXhbaV0gPSBbaV07XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPD0gYS5sZW5ndGg7IGorKykgbWF0cml4WzBdW2pdID0gajtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBiLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChiW2kgLSAxXSA9PT0gYVtqIC0gMV0pIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBtYXRyaXhbaSAtIDFdW2ogLSAxXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1baiAtIDFdICsgMSwgLy8gc3Vic3RpdHV0aW9uXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4W2ldW2ogLSAxXSArIDEsIC8vIGluc2VydGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4W2kgLSAxXVtqXSArIDEgIC8vIGRlbGV0aW9uXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRyaXhbYi5sZW5ndGhdW2EubGVuZ3RoXTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlQWxsZWxlRW50cm9weShwbGFudHMpIHtcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgY29uc3QgY291bnRzID0gbmV3IEFycmF5KDI1NikuZmlsbCgwKTtcbiAgICBsZXQgdG90YWwgPSAwO1xuICAgIHBsYW50cy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHAuZ2Vub21lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb3VudHNbcC5nZW5vbWVbaV1dKys7XG4gICAgICAgICAgICB0b3RhbCsrO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRvdGFsID09PSAwKSByZXR1cm4gMDtcbiAgICBsZXQgZW50cm9weSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICAgICAgICBpZiAoY291bnRzW2ldID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcCA9IGNvdW50c1tpXSAvIHRvdGFsO1xuICAgICAgICAgICAgZW50cm9weSAtPSBwICogTWF0aC5sb2cyKHApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbnRyb3B5O1xufVxuXG5jbGFzcyBTaW1EYXRhe1xuXG4gICAgY29uc3RydWN0b3Ioc2ltdWxhdGlvbil7XG4gICAgICAgIHRoaXMuc2ltID0gc2ltdWxhdGlvbjtcbiAgICAgICAgdGhpcy5kYXRhID0ge1wic3RlcG51bVwiOiBbXX07XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycyA9IFtcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwb3B1bGF0aW9uXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidG90YWxfY2VsbHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgcC5jZWxscy5sZW5ndGgsIDApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZW5lcmdpc2VkX2NlbGxzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIHAuY2VsbHMuZmlsdGVyKGMgPT4gYy5lbmVyZ2lzZWQpLmxlbmd0aCwgMCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwbGFudF9zaXplX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmNlbGxzLmxlbmd0aCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJnZW5vbWVfc2l6ZV9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5nZW5vbWUubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcIm11dF9leHBfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLm11dF9leHApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicGxhbnRfaGVpZ2h0X1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCguLi5wLmNlbGxzLm1hcChjID0+IGMueSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2VuZXRpY19kaXN0YW5jZV9tZWFuXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYW50cyA9IHNpbS53b3JsZC5wbGFudHM7XG4gICAgICAgICAgICAgICAgaWYgKHBsYW50cy5sZW5ndGggPCAyKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBsZXQgc3VtRGlzdCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IHNhbXBsZVNpemUgPSBNYXRoLm1pbigzMCwgcGxhbnRzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhaXJzID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNhbXBsZVNpemU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwMSA9IHBsYW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwbGFudHMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAyID0gcGxhbnRzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBsYW50cy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAxICE9PSBwMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VtRGlzdCArPSBsZXZlbnNodGVpbihwMS5nZW5vbWUsIHAyLmdlbm9tZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWlycysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwYWlycyA+IDAgPyBzdW1EaXN0IC8gcGFpcnMgOiAwO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYWxsZWxlX2VudHJvcHlcIiwgQXNJcywgZnVuY3Rpb24oc2ltKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGN1bGF0ZUFsbGVsZUVudHJvcHkoc2ltLndvcmxkLnBsYW50cyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbGxlY3QgZGF0YSBmb3IgdGhlIGN1cnJlbnQgc3RlcFxuICAgICAqL1xuICAgIHJlY29yZFN0ZXAoKXtcbiAgICAgICAgdmFyIHN0ZXBEYXRhID0ge307XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGMpe1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGMuY29sbGVjdCh0aGlzLnNpbSk7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHN0ZXBEYXRhLCB2YWx1ZXMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLmRhdGFbXCJzdGVwbnVtXCJdLnB1c2godGhpcy5zaW0uc3RlcG51bSk7XG4gICAgICAgIGlmICh0aGlzLmRhdGFbXCJzdGVwbnVtXCJdLmxlbmd0aCA+IFNpbURhdGEuTUFYX0RBVEFfUE9JTlRTKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGFbXCJzdGVwbnVtXCJdLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmtleXMoc3RlcERhdGEpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgICAgICBpZiAoIShrIGluIHRoaXMuZGF0YSkpe1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVtrXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kYXRhW2tdLnB1c2goc3RlcERhdGFba10pO1xuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVtrXS5sZW5ndGggPiBTaW1EYXRhLk1BWF9EQVRBX1BPSU5UUykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVtrXS5zaGlmdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG59XG5TaW1EYXRhLk1BWF9EQVRBX1BPSU5UUyA9IDIwMDA7XG5cbmNsYXNzIENvbGxlY3RvcntcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCB0eXBlY2xzLCBjb2xsZWN0RnVuYyl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMudHlwZSA9IG5ldyB0eXBlY2xzKG5hbWUpO1xuICAgICAgICB0aGlzLmZ1bmMgPSBjb2xsZWN0RnVuYztcbiAgICB9XG5cbiAgICBjb2xsZWN0KHNpbSl7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5mdW5jKHNpbSk7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUudHJhbnNmb3JtKGRhdGEpO1xuICAgIH1cbn1cblxuY2xhc3MgQ29sbGVjdG9yVHlwZXtcbiAgICBjb25zdHJ1Y3RvcihuYW1lKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmltcGxlbWVudGVkIG1ldGhvZFwiKTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm0oZGF0YSl7XG4gICAgICAgIHZhciB2YWx1ZXMgPSB0aGlzLnRyYW5zZm9ybURhdGEoZGF0YSk7XG4gICAgICAgIHZhciB0cmFuc2Zvcm1lZF9kYXRhID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKHZhbHVlcykuZm9yRWFjaChmdW5jdGlvbihrKXtcbiAgICAgICAgICAgIHRyYW5zZm9ybWVkX2RhdGFbdGhpcy5uYW1lICsga10gPSB2YWx1ZXNba107XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtZWRfZGF0YTtcbiAgICB9XG59XG5cbmNsYXNzIEFzSXMgZXh0ZW5kcyBDb2xsZWN0b3JUeXBlIHtcblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSl7XG4gICAgICAgIHJldHVybiB7XCJcIjogZGF0YX07XG4gICAgfVxufVxuXG5jbGFzcyBTdW1tYXJ5IGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICByZXR1cm4ge1wibWluXCI6IE1hdGgubWluKGRhdGEpLCBcIm1lYW5cIjogc3RhdHMubWVhbihkYXRhKSwgXCJtYXhcIjogTWF0aC5tYXgoZGF0YSl9O1xuICAgIH1cbn1cbmV4cG9ydCB7U2ltRGF0YX07IiwiaW1wb3J0IHtzZWVkUmFuZG9tLCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7V29ybGR9IGZyb20gXCIuL3dvcmxkLmpzXCI7XG5pbXBvcnQge0J5dGVBcnJheSwgQmxvY2tJbnRlcnByZXRlciwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn0gZnJvbSBcIi4vZ2Vub21lLmpzXCI7XG5cbmNsYXNzIFNpbXVsYXRpb25QYXJhbXN7XG4gICAgY29uc3RydWN0b3IocGFyYW1zPXt9KXtcbiAgICAgICAgdGhpcy5yYW5kb21fc2VlZCA9IDE7XG4gICAgICAgIHRoaXMucmVjb3JkX2ludGVydmFsID0gMTA7XG4gICAgICAgIHRoaXMuc3RlcHNfcGVyX2ZyYW1lID0gMTtcbiAgICAgICAgdGhpcy5kaXN0dXJiYW5jZV9pbnRlcnZhbCA9IDA7XG4gICAgICAgIHRoaXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGggPSAwLjE7XG5cbiAgICAgICAgdGhpcy53b3JsZF93aWR0aCA9IDI1MDtcbiAgICAgICAgdGhpcy53b3JsZF9oZWlnaHQgPSA0MDtcbiAgICAgICAgdGhpcy5pbml0aWFsX3BvcHVsYXRpb24gPSAyNTA7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVuZXJneV9wcm9iID0gMC41O1xuXG4gICAgICAgIC8vIGRlYXRoIHBhcmFtc1xuICAgICAgICB0aGlzLmRlYXRoX2ZhY3RvciA9IDAuMjtcbiAgICAgICAgdGhpcy5uYXR1cmFsX2V4cCA9IDA7XG4gICAgICAgIHRoaXMuZW5lcmd5X2V4cCA9IC0yLjU7XG4gICAgICAgIHRoaXMubGVhbm92ZXJfZmFjdG9yID0gMC4yO1xuXG4gICAgICAgIC8vIG11dGF0aW9uc1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlX21vZGUgPSBcImJ5dGV3aXNlXCI7XG4gICAgICAgIHRoaXMubXV0X3JlcGxhY2UgPSAwLjAwMjtcbiAgICAgICAgdGhpcy5tdXRfaW5zZXJ0ID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9kZWxldGUgPSAwLjAwMDQ7XG4gICAgICAgIHRoaXMubXV0X2ZhY3RvciA9IDEuNTtcbiAgICAgICAgdGhpcy5pbml0aWFsX211dF9leHAgPSAwO1xuXG4gICAgICAgIHRoaXMuZ2Vub21lX2ludGVycHJldGVyID0gXCJibG9ja1wiO1xuICAgICAgICB0aGlzLmluaXRpYWxfZ2Vub21lX2xlbmd0aCA9IDQwMDtcblxuICAgICAgICAvLyBkaXZpZGUsIGZseWluZ3NlZWQsIGxvY2Fsc2VlZCwgbXV0KywgbXV0LSwgc3RhdGViaXRcbiAgICAgICAgdGhpcy5hY3Rpb25fbWFwID0gWzIwMCwgMjAsIDAsIDE4LCAxOCwgMF07XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBwYXJhbXMpO1xuICAgIH1cbn1cblxuY2xhc3MgU2ltdWxhdGlvbiB7XG4gICAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgICAgIC8vIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byByYW5kb21cbiAgICAgICAgLy8gdGhpcyBtYWtlcyBvdXQgdGVzdHMgcmVwcm9kdWNpYmxlIGdpdmVuIHRoZSBzYW1lIHNlZWQgaXMgdXNlZFxuICAgICAgICAvLyBpbiBmdXR1cmUgaW5wdXQgcGFyYW1ldGVyc1xuICAgICAgICBzZWVkUmFuZG9tKHRoaXMucGFyYW1zLnJhbmRvbV9zZWVkKTtcblxuICAgICAgICB0aGlzLndvcmxkID0gbmV3IFdvcmxkKHRoaXMucGFyYW1zLndvcmxkX3dpZHRoLCB0aGlzLnBhcmFtcy53b3JsZF9oZWlnaHQpO1xuICAgICAgICB0aGlzLmdlbm9tZUludGVycHJldGVyID0gdGhpcy5nZXRJbnRlcnByZXRlcigpO1xuICAgICAgICB0aGlzLm11dF91bml0cyA9IDE7XG4gICAgICAgIC8vIGVuc3VyZSBtdXRhdGlvbiB1bml0cyBpcyBjb21wYXRpYmxlIHdpdGggdGhlIGludGVycHJldGVyIHR5cGVcbiAgICAgICAgaWYodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIEJsb2NrSW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgdGhpcy5tdXRfdW5pdHMgPSAyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RlcG51bSA9IDA7XG4gICAgfVxuXG4gICAgZ2V0SW50ZXJwcmV0ZXIoKXtcbiAgICAgICAgc3dpdGNoICh0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIpe1xuICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmxvY2tJbnRlcnByZXRlcih0aGlzLnBhcmFtcy5hY3Rpb25fbWFwKTtcbiAgICAgICAgY2FzZSBcInByb21vdG9yXCI6XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21vdG9ySW50ZXJwcmV0ZXIodGhpcy5wYXJhbXMuYWN0aW9uX21hcCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaW50ZXJwcmV0ZXIgJHt0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXJ9YCk7XG4gICAgICAgIH0gIFxuICAgIH1cblxuICAgIGluaXRfcG9wdWxhdGlvbigpe1xuICAgICAgICAvLyByYW5kb21seSBjaG9vc2Ugc3BvdHMgdG8gc2VlZCB0aGUgd29ybGQgd2l0aFxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5wYXJhbXMuaW5pdGlhbF9wb3B1bGF0aW9uOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5uZXdTZWVkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBwb3B1bGF0aW9uIGZyb20gYSBsaXN0IG9mIHNlcmlhbGl6ZWQgZ2Vub21lIHN0cmluZ3MsXG4gICAgICogZHJhd2luZyB3aXRoIHJlcGxhY2VtZW50IHVwIHRvIGluaXRpYWxfcG9wdWxhdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBzZXJpYWxpemVkR2Vub21lc1xuICAgICAqL1xuICAgIGluaXRfcG9wdWxhdGlvbl9mcm9tX2dlbm9tZXMoc2VyaWFsaXplZEdlbm9tZXMpe1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5wYXJhbXMuaW5pdGlhbF9wb3B1bGF0aW9uOyBpKyspe1xuICAgICAgICAgICAgY29uc3Qgc3RyID0gc2VyaWFsaXplZEdlbm9tZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2VyaWFsaXplZEdlbm9tZXMubGVuZ3RoKV07XG4gICAgICAgICAgICBjb25zdCBnZW5vbWUgPSBCeXRlQXJyYXkuZGVzZXJpYWxpemUoc3RyKTtcbiAgICAgICAgICAgIHRoaXMud29ybGQuc2VlZChnZW5vbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3U2VlZCgpe1xuICAgICAgICAvLyBjcmVhdGUgYSByYW5kb20gZ2Vub21lXG4gICAgICAgIHZhciBnZW5vbWUgPSBCeXRlQXJyYXkucmFuZG9tKHRoaXMucGFyYW1zLmluaXRpYWxfZ2Vub21lX2xlbmd0aCk7XG4gICAgICAgIHRoaXMud29ybGQuc2VlZChnZW5vbWUpO1xuICAgIH1cblxuICAgIHN0ZXAoKXtcbiAgICAgICAgdGhpcy5zdGVwbnVtKys7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVEZWF0aCgpO1xuICAgICAgICB0aGlzLnNpbXVsYXRlTGlnaHQoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUFjdGlvbnMoKTtcbiAgICAgICAgdGhpcy5tdXRhdGUoKTtcbiAgICB9XG5cbiAgICBzaW11bGF0ZUFjdGlvbnMoKXtcbiAgICAgICAgdGhpcy53b3JsZC5wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICB2YXIgcnVsZXMgPSB0aGlzLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUpO1xuICAgICAgICAgICAgcGxhbnQuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxBY3Rpb24oY2VsbCwgcnVsZXMpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIGNlbGxBY3Rpb24oY2VsbCwgcnVsZXMpe1xuICAgICAgICB2YXIgc3RhdGU7XG4gICAgICAgIGlmICh0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgQmxvY2tJbnRlcnByZXRlcil7XG4gICAgICAgICAgICBzdGF0ZSA9IGNlbGwucGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBQcm9tb3RvckludGVycHJldGVyKXtcbiAgICAgICAgICAgIHN0YXRlID0gY2VsbC5wbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBydWxlcy5mb3JFYWNoKGZ1bmN0aW9uKHJ1bGUpe1xuICAgICAgICAgICAgLy8gZXhlY3V0ZSBvbmUgYWN0aW9uIHVzaW5nIHRoZSBmaXJzdCBtYXRjaGluZyBydWxlXG4gICAgICAgICAgICAvLyBpZiAocnVsZS5tYXRjaGVzKHN0YXRlKSl7XG4gICAgICAgICAgICBpZiAocnVsZS5tYXRjaGVzKHN0YXRlKSl7XG4gICAgICAgICAgICAgICAgcnVsZS5hY3Rpb24uZXhlY3V0ZShjZWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGNlbGwudXBkYXRlU3RhdGUoKTtcbiAgICB9XG5cbiAgICBtdXRhdGUoKXtcbiAgICAgICAgdmFyIG11dGF0b3IgPSBuZXcgTXV0YXRvcih0aGlzLnBhcmFtcy5tdXRfZmFjdG9yLCB0aGlzLnBhcmFtcy5tdXRfcmVwbGFjZSwgXG4gICAgICAgICAgICB0aGlzLnBhcmFtcy5tdXRfaW5zZXJ0LCB0aGlzLnBhcmFtcy5tdXRfZGVsZXRlLCBcbiAgICAgICAgICAgIDAsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlX21vZGUsIHRoaXMubXV0X3VuaXRzKTtcbiAgICAgICAgdGhpcy53b3JsZC5wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICBtdXRhdG9yLm11dGF0ZShwbGFudC5nZW5vbWUpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgZWFjaCBwbGFudCdzIGN1cnJlbnQgZGVhdGggcHJvYmFiaWxpdHkgdG8gc2ltdWxhdGVcbiAgICAgKiB3aGV0aGVyIGVhY2ggcGxhbnQgZGllcyBvbiB0aGlzIHN0ZXBcbiAgICAgKi9cbiAgICBzaW11bGF0ZURlYXRoKCl7XG4gICAgICAgIHZhciBkZWFkX3BsYW50cyA9IFtdO1xuICAgICAgICB0aGlzLndvcmxkLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIHZhciBkZWF0aFByb2IgPSBwbGFudC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmxlYW5vdmVyX2ZhY3RvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChyYW5kb21Qcm9iKGRlYXRoUHJvYi5wcm9iKSl7XG4gICAgICAgICAgICAgICAgZGVhZF9wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBkZWFkX3BsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIHRoaXMud29ybGQua2lsbFBsYW50KHBsYW50KTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGUgbGlnaHQuIFN1bmxpZ2h0IHRyYXZlcnNlcyBmcm9tIHRoZSBjZWlsaW5nIG9mIHRoZSB3b3JsZFxuICAgICAqIGRvd253YXJkcyB2ZXJ0aWNhbGx5LiBJdCBpcyBjYXVnaHQgYnkgYSBwbGFudCBjZWxsIHdpdGggYSBwcm9iYWJpbGl0eVxuICAgICAqIHdoaWNoIGNhdXNlcyB0aGF0IGNlbGwgdG8gYmUgZW5lcmdpc2VkLlxuICAgICAqL1xuICAgIHNpbXVsYXRlTGlnaHQoKXtcbiAgICAgICAgZm9yKHZhciB4PTA7IHg8dGhpcy53b3JsZC53aWR0aDsgeCsrKXtcbiAgICAgICAgICAgIGZvcih2YXIgeT0wOyB5PHRoaXMud29ybGQuaGVpZ2h0OyB5Kyspe1xuICAgICAgICAgICAgICAgIHZhciBjZWxsID0gdGhpcy53b3JsZC5jZWxsc1t4XVt0aGlzLndvcmxkLmhlaWdodC15LTFdO1xuICAgICAgICAgICAgICAgIGlmKGNlbGwgIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICBpZihyYW5kb21Qcm9iKHRoaXMucGFyYW1zLmVuZXJneV9wcm9iKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsLmVuZXJnaXNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHtTaW11bGF0aW9uLCBTaW11bGF0aW9uUGFyYW1zfTsiLCJpbXBvcnQge1NpbXVsYXRpb24sIFNpbXVsYXRpb25QYXJhbXN9IGZyb20gXCIuL3NpbXVsYXRpb24uanNcIjtcbmltcG9ydCB7U2ltRGF0YX0gZnJvbSBcIi4vc2ltZGF0YS5qc1wiO1xuXG5sZXQgc2ltdWxhdGlvbiA9IG51bGw7XG5sZXQgZGF0YSA9IG51bGw7XG5sZXQgcnVubmluZyA9IGZhbHNlO1xubGV0IGNlbGxTaXplID0gODtcbmNvbnN0IFRBUkdFVF9GUFMgPSA2MDtcbmNvbnN0IEZSQU1FX0lOVEVSVkFMX01TID0gMTAwMCAvIFRBUkdFVF9GUFM7XG5sZXQgbGFzdEZyYW1lVGltZSA9IDA7XG5cbnNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBjb25zdCBtc2cgPSBldmVudC5kYXRhO1xuICAgIHN3aXRjaCAobXNnLnR5cGUpIHtcbiAgICBjYXNlIFwiaW5pdFwiOlxuICAgICAgICBpbml0U2ltKG1zZy5wYXJhbXMsIG1zZy5nZW5vbWVzIHx8IG51bGwpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RhcnRcIjpcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGxvb3AoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0b3BcIjpcbiAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RlcFwiOlxuICAgICAgICBkb1N0ZXAoKTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIHB1c2hTdGF0cygpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZ2V0Q2VsbFwiOlxuICAgICAgICBzZW5kQ2VsbEluZm8obXNnLngsIG1zZy55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImRpc3R1cmJcIjpcbiAgICAgICAgYXBwbHlEaXN0dXJiYW5jZShtc2cuc3RyZW5ndGgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImtpbGxDZWxsXCI6XG4gICAgICAgIGtpbGxDZWxsQXQobXNnLngsIG1zZy55KTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJ1cGRhdGVEaXNwbGF5UGFyYW1zXCI6XG4gICAgICAgIGlmIChzaW11bGF0aW9uICYmIHNpbXVsYXRpb24ucGFyYW1zKSB7XG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5zdGVwc19wZXJfZnJhbWUgPSBtc2cuc3RlcHNfcGVyX2ZyYW1lO1xuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMucmVjb3JkX2ludGVydmFsID0gbXNnLnJlY29yZF9pbnRlcnZhbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZXhwb3J0XCI6XG4gICAgICAgIGV4cG9ydEdlbm9tZXMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gaW5pdFNpbShwYXJhbXMsIGltcG9ydGVkR2Vub21lcz1udWxsKSB7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGNvbnN0IHNpbV9wYXJhbXMgPSBuZXcgU2ltdWxhdGlvblBhcmFtcyhwYXJhbXMpO1xuICAgIGNlbGxTaXplID0gcGFyYW1zLmNlbGxTaXplIHx8IDg7XG4gICAgc2ltdWxhdGlvbiA9IG5ldyBTaW11bGF0aW9uKHNpbV9wYXJhbXMpO1xuICAgIGRhdGEgPSBuZXcgU2ltRGF0YShzaW11bGF0aW9uKTtcbiAgICBpZiAoaW1wb3J0ZWRHZW5vbWVzICYmIGltcG9ydGVkR2Vub21lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNpbXVsYXRpb24uaW5pdF9wb3B1bGF0aW9uX2Zyb21fZ2Vub21lcyhpbXBvcnRlZEdlbm9tZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbXVsYXRpb24uaW5pdF9wb3B1bGF0aW9uKCk7XG4gICAgfVxuICAgIHB1c2hGcmFtZSgpO1xuICAgIHB1c2hTdGF0cygpO1xufVxuXG5mdW5jdGlvbiBsb29wKCkge1xuICAgIGlmICghcnVubmluZykgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3BmID0gc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3BmOyBpKyspIHtcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdEZyYW1lVGltZSA+PSBGUkFNRV9JTlRFUlZBTF9NUykge1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgcHVzaFN0YXRzKCk7XG4gICAgICAgIGxhc3RGcmFtZVRpbWUgPSBub3c7XG4gICAgfVxuXG4gICAgc2V0VGltZW91dChsb29wLCAwKTtcbn1cblxuZnVuY3Rpb24gZG9TdGVwKCkge1xuICAgIHNpbXVsYXRpb24uc3RlcCgpO1xuXG4gICAgLy8gUGVyaW9kaWMgZGlzdHVyYmFuY2VcbiAgICBjb25zdCBkaSA9IHNpbXVsYXRpb24ucGFyYW1zLmRpc3R1cmJhbmNlX2ludGVydmFsO1xuICAgIGlmIChkaSA+IDAgJiYgc2ltdWxhdGlvbi5zdGVwbnVtICUgZGkgPT09IDApIHtcbiAgICAgICAgYXBwbHlEaXN0dXJiYW5jZShzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9zdHJlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKHNpbXVsYXRpb24uc3RlcG51bSAlIHNpbXVsYXRpb24ucGFyYW1zLnJlY29yZF9pbnRlcnZhbCA9PT0gMCB8fCBzaW11bGF0aW9uLnN0ZXBudW0gPT09IDEpIHtcbiAgICAgICAgZGF0YS5yZWNvcmRTdGVwKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwdXNoU3RhdHMoKSB7XG4gICAgaWYgKCFkYXRhKSByZXR1cm47XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwic3RhdHNcIixcbiAgICAgICAgZGF0YTogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhLmRhdGEpKSxcbiAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5RGlzdHVyYmFuY2Uoc3RyZW5ndGgpIHtcbiAgICBjb25zdCB3b3JsZCA9IHNpbXVsYXRpb24ud29ybGQ7XG4gICAgY29uc3QgcGxhbnRzID0gd29ybGQucGxhbnRzO1xuICAgIGlmIChwbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgY29uc3QgbnVtVG9LaWxsID0gTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihzdHJlbmd0aCAqIHBsYW50cy5sZW5ndGgpKTtcbiAgICAvLyBTaHVmZmxlIGEgc2FtcGxlIGFuZCBraWxsXG4gICAgY29uc3Qgc2h1ZmZsZWQgPSBwbGFudHMuc2xpY2UoKS5zb3J0KCgpID0+IE1hdGgucmFuZG9tKCkgLSAwLjUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVG9LaWxsICYmIGkgPCBzaHVmZmxlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBDaGVjayBwbGFudCBzdGlsbCBhbGl2ZSAobm90IGtpbGxlZCBieSBwcmV2aW91cyBpdGVyYXRpb24pXG4gICAgICAgIGlmICh3b3JsZC5wbGFudHMuaW5jbHVkZXMoc2h1ZmZsZWRbaV0pKSB7XG4gICAgICAgICAgICB3b3JsZC5raWxsUGxhbnQoc2h1ZmZsZWRbaV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBraWxsQ2VsbEF0KHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmIChjZWxsICYmIGNlbGwucGxhbnQpIHtcbiAgICAgICAgc2ltdWxhdGlvbi53b3JsZC5raWxsUGxhbnQoY2VsbC5wbGFudCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBleHBvcnRHZW5vbWVzKCkge1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgc2ltdWxhdGlvbi53b3JsZC5wbGFudHMuZm9yRWFjaChwbGFudCA9PiB7XG4gICAgICAgIHNlZW4uYWRkKHBsYW50Lmdlbm9tZS5zZXJpYWxpemUoKSk7XG4gICAgfSk7XG4gICAgY29uc3QgZ2Vub21lcyA9IEFycmF5LmZyb20oc2Vlbik7XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiZXhwb3J0ZWRHZW5vbWVzXCIsIGdlbm9tZXMgfSk7XG59XG5cbmZ1bmN0aW9uIHB1c2hGcmFtZSgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBzaW11bGF0aW9uLndvcmxkLmdldFBpeGVsQnVmZmVyKGNlbGxTaXplKTtcbiAgICAvLyBUcmFuc2ZlciBvd25lcnNoaXAgb2YgdGhlIEFycmF5QnVmZmVyIGZvciB6ZXJvLWNvcHkgcGVyZm9ybWFuY2VcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJmcmFtZVwiLFxuICAgICAgICBidWZmZXI6IHJlc3VsdC5idWZmZXIuYnVmZmVyLFxuICAgICAgICB3aWR0aDogcmVzdWx0LndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHJlc3VsdC5oZWlnaHQsXG4gICAgICAgIGNlbGxDb3VudDogcmVzdWx0LmNlbGxDb3VudCxcbiAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgfSwgW3Jlc3VsdC5idWZmZXIuYnVmZmVyXSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRDZWxsSW5mbyh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoIWNlbGwgfHwgIWNlbGwucGxhbnQgfHwgIWNlbGwucGxhbnQuZ2Vub21lKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBwbGFudCA9IGNlbGwucGxhbnQ7XG4gICAgICAgIGNvbnN0IHJ1bGVzID0gc2ltdWxhdGlvbi5nZW5vbWVJbnRlcnByZXRlci5pbnRlcnByZXQocGxhbnQuZ2Vub21lKTtcblxuICAgICAgICAvLyBVc2UgdGhlIGNvcnJlY3Qgc3RhdGUgZGVwZW5kaW5nIG9uIGludGVycHJldGVyIHR5cGVcbiAgICAgICAgbGV0IGNlbGxTdGF0ZTtcbiAgICAgICAgaWYgKHNpbXVsYXRpb24ucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlciA9PT0gXCJibG9ja1wiKSB7XG4gICAgICAgICAgICBjZWxsU3RhdGUgPSBwbGFudC5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2VsbFN0YXRlID0gcGxhbnQuZ2V0U3RhdGUoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmVpZ2hib3VyaG9vZCA9IHBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIGNvbnN0IGVuZXJnaXNlZCA9IGNlbGwuZW5lcmdpc2VkO1xuXG4gICAgICAgIC8vIFNlcmlhbGl6ZSBydWxlcyBhcyBzdHJ1Y3R1cmVkIG9iamVjdHMgZm9yIHJpY2ggVUkgcmVuZGVyaW5nXG4gICAgICAgIGNvbnN0IHNlcmlhbGl6ZWRSdWxlcyA9IHJ1bGVzLm1hcCgociwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHIubWF0Y2hlcyhjZWxsU3RhdGUpO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uU3RyID0gci5hY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IGlzRGl2ID0gYWN0aW9uU3RyLnN0YXJ0c1dpdGgoXCJkaXZpZGVcIik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGluZGV4OiBpLFxuICAgICAgICAgICAgICAgIG1hdGNoZXMsXG4gICAgICAgICAgICAgICAgc3RhdGU6IHIuc3RhdGUsXG4gICAgICAgICAgICAgICAgZXFNYXNrOiByLmVxTWFzayxcbiAgICAgICAgICAgICAgICBhY3Rpb25UeXBlOiBpc0RpdiA/IFwiZGl2aWRlXCIgOiBhY3Rpb25TdHIsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc0RpdiA/IHIuYWN0aW9uLmdldERpcmVjdGlvbigpIDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoaW5nUnVsZUluZGV4ID0gc2VyaWFsaXplZFJ1bGVzLmZpbmRJbmRleChyID0+IHIubWF0Y2hlcyk7XG5cbiAgICAgICAgY29uc3QgZGVhdGggPSBwbGFudC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogXCJjZWxsSW5mb1wiLFxuICAgICAgICAgICAgZm91bmQ6IHRydWUsXG4gICAgICAgICAgICBjZWxsU3RyOiBjZWxsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBuZWlnaGJvdXJob29kLFxuICAgICAgICAgICAgZW5lcmdpc2VkLFxuICAgICAgICAgICAgY2VsbFN0YXRlLFxuICAgICAgICAgICAgbWF0Y2hpbmdSdWxlSW5kZXgsXG4gICAgICAgICAgICBkZWF0aDogSlNPTi5zdHJpbmdpZnkoZGVhdGgpLFxuICAgICAgICAgICAgZ2Vub21lTGVuZ3RoOiBwbGFudC5nZW5vbWUubGVuZ3RoLFxuICAgICAgICAgICAgbXV0RXhwOiBwbGFudC5nZW5vbWUubXV0X2V4cCxcbiAgICAgICAgICAgIHJ1bGVzOiBzZXJpYWxpemVkUnVsZXMsXG4gICAgICAgICAgICBpbnRlcnByZXRlclR5cGU6IHNpbXVsYXRpb24ucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcixcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJjZWxsSW5mb1wiLCBmb3VuZDogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtyYW5kb21JbnR9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtQbGFudH0gZnJvbSBcIi4vcGxhbnQuanNcIjtcbmltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5cbmNsYXNzIFdvcmxkIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KXtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHdvcmxkIGxhdHRpY2UgdG8gYWxsIG51bGxzXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzLnB1c2goW10pO1xuICAgICAgICAgICAgZm9yKHZhciBqPTA7IGo8dGhpcy5oZWlnaHQ7IGorKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tpXVtqXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYW50cyA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIGFycmF5IG9mIHggcG9zaXRpb25zIGF0IHk9MCB3aGVyZSBubyBjZWxsIGV4aXN0c1xuICAgICAqL1xuICAgIGdldEZsb29yU3BhY2UoKXtcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICBpZih0aGlzLmNlbGxzW2ldWzBdID09PSBudWxsKXtcbiAgICAgICAgICAgICAgICBlbXB0eVNwYWNlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbXB0eVNwYWNlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdHJhdGVnaWVzIGZvciBzb3dpbmcgYSBzZWVkIG9uIHRoZSB3b3JsZCBmbG9vclxuICAgICAqIEBwYXJhbSB7Kn0gZ2Vub21lIHRoZSBnZW5vbWUgdXNlZCBieSB0aGUgbmV3IHNlZWRcbiAgICAgKiBAcGFyYW0geyp9IG5lYXJYIGlmIG5vdCBudWxsLCB0cnkgdG8gc293IGEgc2VlZCBhcyBjbG9zZVxuICAgICAqIGFzIHBvc3NpYmxlIHRvIHRoaXMgbG9jYXRpb25cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgYSBzZWVkIHdhcyBzdWNjZXNmdWxseSBwbGFudGVkLCBmYWxzZSBpZlxuICAgICAqIHRoZXJlIHdhcyBubyBzcGFjZSB0byBzb3cgYSBzZWVkLlxuICAgICAqL1xuICAgIHNlZWQoZ2Vub21lLCBuZWFyWCl7XG4gICAgICAgIC8vIGZpbmQgYSByYW5kb20gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gdGhpcy5nZXRGbG9vclNwYWNlKCk7XG4gICAgICAgIGlmKGVtcHR5U3BhY2VzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZWFyWCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0WCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdF9kaWZmID0gdGhpcy53aWR0aDtcbiAgICAgICAgICAgIGVtcHR5U3BhY2VzLmZvckVhY2goZnVuY3Rpb24oeHBvcyl7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBNYXRoLmFicyhuZWFyWC14cG9zKTtcbiAgICAgICAgICAgICAgICBpZihkaWZmIDwgbmVhcmVzdF9kaWZmKXtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdF9kaWZmID0gZGlmZjtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFggPSB4cG9zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIG5lYXJlc3RYKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHggPSBlbXB0eVNwYWNlc1tyYW5kb21JbnQoMCwgZW1wdHlTcGFjZXMubGVuZ3RoLTEpXTtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbeF1bMF0gIT09IG51bGwpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3BhY2UgaXMgdGFrZW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIHgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzb3dQbGFudChnZW5vbWUsIHgpe1xuICAgICAgICB4ID0gdGhpcy5nZXRYKHgpO1xuICAgICAgICB2YXIgcGxhbnQgPSBuZXcgUGxhbnQoeCwgdGhpcywgZ2Vub21lKTtcbiAgICAgICAgdGhpcy5wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgIHRoaXMuYWRkQ2VsbChwbGFudC5jZWxsc1swXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBsYW50IGZyb20gd29ybGQgcGxhbnQgbGlzdC5cbiAgICAgKiBSZW1vdmUgYWxsIGNlbGxzIGZyb20gY2VsbCBncmlkXG4gICAgICovXG4gICAga2lsbFBsYW50KHBsYW50KXtcbiAgICAgICAgdGhpcy5wbGFudHMuc3BsaWNlKHRoaXMucGxhbnRzLmluZGV4T2YocGxhbnQpLCAxKTtcbiAgICAgICAgcGxhbnQuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldID0gbnVsbDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0WCh4KXtcbiAgICAgICAgaWYoeCA8IDApe1xuICAgICAgICAgICAgeCA9IHRoaXMud2lkdGggKyB4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4ICUgdGhpcy53aWR0aDtcbiAgICB9XG5cbiAgICBnZXRDZWxsKHgsIHkpe1xuICAgICAgICByZXR1cm4gdGhpcy5jZWxsc1t0aGlzLmdldFgoeCldW3ldO1xuICAgIH1cblxuICAgIGFkZENlbGwoY2VsbCl7XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IGNlbGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRQaXhlbEJ1ZmZlcihjZWxsU2l6ZSl7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLndpZHRoICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGggPSB0aGlzLmhlaWdodCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBidWYgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkodyAqIGggKiA0KTsgLy8gUkdCQSwgaW5pdGlhbGl6ZWQgdG8gMCAodHJhbnNwYXJlbnQvYmxhY2spXG5cbiAgICAgICAgdGhpcy5wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICBjb25zdCBbYmFzZVIsIGJhc2VHLCBiYXNlQl0gPSB0aGlzLmdldEJhc2VDb2xvdXIocGxhbnQpO1xuICAgICAgICAgICAgcGxhbnQuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2wgPSBjZWxsLmVuZXJnaXNlZFxuICAgICAgICAgICAgICAgICAgICA/IFtiYXNlUiwgYmFzZUcsIGJhc2VCXVxuICAgICAgICAgICAgICAgICAgICA6IFtNYXRoLnJvdW5kKGJhc2VSICogMC43KSwgTWF0aC5yb3VuZChiYXNlRyAqIDAuNyksIE1hdGgucm91bmQoYmFzZUIgKiAwLjcpXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHB4MCA9IGNlbGwueCAqIGNlbGxTaXplO1xuICAgICAgICAgICAgICAgIC8vIHdvcmxkIHk9MCBpcyBncm91bmQgKGJvdHRvbSksIGNhbnZhcyB5PTAgaXMgdG9wXG4gICAgICAgICAgICAgICAgY29uc3QgcHkwID0gKHRoaXMuaGVpZ2h0IC0gMSAtIGNlbGwueSkgKiBjZWxsU2l6ZTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGR5ID0gMDsgZHkgPCBjZWxsU2l6ZTsgZHkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkeCA9IDA7IGR4IDwgY2VsbFNpemU7IGR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYXcgMXB4IGJvcmRlcjogZGFya2VuIGVkZ2UgcGl4ZWxzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0JvcmRlciA9IGR4ID09PSAwIHx8IGR5ID09PSAwIHx8IGR4ID09PSBjZWxsU2l6ZSAtIDEgfHwgZHkgPT09IGNlbGxTaXplIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGlzQm9yZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBbTWF0aC5yb3VuZChjb2xbMF0gKiAwLjUpLCBNYXRoLnJvdW5kKGNvbFsxXSAqIDAuNSksIE1hdGgucm91bmQoY29sWzJdICogMC41KV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkeCA9ICgocHkwICsgZHkpICogdyArIChweDAgKyBkeCkpICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdICAgICA9IHI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBnO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDJdID0gYjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAzXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4geyBidWZmZXI6IGJ1Ziwgd2lkdGg6IHcsIGhlaWdodDogaCwgY2VsbENvdW50OiB0aGlzLnBsYW50cy5yZWR1Y2UoKHMscCk9PnMrcC5jZWxscy5sZW5ndGgsMCkgfTtcbiAgICB9XG5cbiAgICBnZXRCYXNlQ29sb3VyKHBsYW50KXtcbiAgICAgICAgdmFyIGkgPSBwbGFudC5jZWxsc1swXS54ICUgY1NjYWxlLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGNTY2FsZVtpXTtcbiAgICB9XG59XG5cbi8vIGh0dHA6Ly9jb2xvcmJyZXdlcjIub3JnLz90eXBlPXF1YWxpdGF0aXZlJnNjaGVtZT1TZXQzJm49OCDigJQgYXMgcmF3IFtSLEcsQl0gdHVwbGVzXG52YXIgY1NjYWxlID0gW1xuICAgIFsxNDEsMjExLDE5OV0sWzI1NSwyNTUsMTc5XSxbMTkwLDE4NiwyMThdLFsyNTEsMTI4LDExNF0sXG4gICAgWzEyOCwxNzcsMjExXSxbMjUzLDE4MCw5OF0sWzE3OSwyMjIsMTA1XSxbMjUyLDIwNSwyMjldXG5dO1xuXG5cbmV4cG9ydCB7IFdvcmxkIH07IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0bG9hZGVkOiBmYWxzZSxcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuLy8gdGhlIHN0YXJ0dXAgZnVuY3Rpb25cbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5cdC8vIFRoaXMgZW50cnkgbW9kdWxlIGRlcGVuZHMgb24gb3RoZXIgbG9hZGVkIGNodW5rcyBhbmQgZXhlY3V0aW9uIG5lZWQgdG8gYmUgZGVsYXllZFxuXHR2YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyh1bmRlZmluZWQsIFtcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3NlZWRyYW5kb21faW5kZXhfanMtbm9kZV9tb2R1bGVzX3N0YXRzLWxpdGVfc3RhdHNfanNcIl0sICgpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanNcIikpKVxuXHRfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKF9fd2VicGFja19leHBvcnRzX18pO1xuXHRyZXR1cm4gX193ZWJwYWNrX2V4cG9ydHNfXztcbn07XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kRCA9IGZ1bmN0aW9uICgpIHtcblx0dGhyb3cgbmV3IEVycm9yKCdkZWZpbmUgY2Fubm90IGJlIHVzZWQgaW5kaXJlY3QnKTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5hbWRPID0ge307IiwidmFyIGRlZmVycmVkID0gW107XG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8gPSAocmVzdWx0LCBjaHVua0lkcywgZm4sIHByaW9yaXR5KSA9PiB7XG5cdGlmKGNodW5rSWRzKSB7XG5cdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuXHRcdGZvcih2YXIgaSA9IGRlZmVycmVkLmxlbmd0aDsgaSA+IDAgJiYgZGVmZXJyZWRbaSAtIDFdWzJdID4gcHJpb3JpdHk7IGktLSkgZGVmZXJyZWRbaV0gPSBkZWZlcnJlZFtpIC0gMV07XG5cdFx0ZGVmZXJyZWRbaV0gPSBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV07XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBub3RGdWxmaWxsZWQgPSBJbmZpbml0eTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV0gPSBkZWZlcnJlZFtpXTtcblx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpZiAoKHByaW9yaXR5ICYgMSA9PT0gMCB8fCBub3RGdWxmaWxsZWQgPj0gcHJpb3JpdHkpICYmIE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uTykuZXZlcnkoKGtleSkgPT4gKF9fd2VicGFja19yZXF1aXJlX18uT1trZXldKGNodW5rSWRzW2pdKSkpKSB7XG5cdFx0XHRcdGNodW5rSWRzLnNwbGljZShqLS0sIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnVsZmlsbGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmKHByaW9yaXR5IDwgbm90RnVsZmlsbGVkKSBub3RGdWxmaWxsZWQgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoZnVsZmlsbGVkKSB7XG5cdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuXHRcdFx0dmFyIHIgPSBmbigpO1xuXHRcdFx0aWYgKHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vLyBUaGlzIGZpbGUgY29udGFpbnMgb25seSB0aGUgZW50cnkgY2h1bmsuXG4vLyBUaGUgY2h1bmsgbG9hZGluZyBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLmYpLnJlZHVjZSgocHJvbWlzZXMsIGtleSkgPT4ge1xuXHRcdF9fd2VicGFja19yZXF1aXJlX18uZltrZXldKGNodW5rSWQsIHByb21pc2VzKTtcblx0XHRyZXR1cm4gcHJvbWlzZXM7XG5cdH0sIFtdKSk7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rcyBhbmQgY2h1bmtzIHRoYXQgdGhlIGVudHJ5cG9pbnQgZGVwZW5kcyBvblxuX193ZWJwYWNrX3JlcXVpcmVfXy51ID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiBcIlwiICsgY2h1bmtJZCArIFwiLmJ1bmRsZS5qc1wiO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwidmFyIHNjcmlwdFVybDtcbmlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmcuaW1wb3J0U2NyaXB0cykgc2NyaXB0VXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmxvY2F0aW9uICsgXCJcIjtcbnZhciBkb2N1bWVudCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5kb2N1bWVudDtcbmlmICghc2NyaXB0VXJsICYmIGRvY3VtZW50KSB7XG5cdGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0ICYmIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnU0NSSVBUJylcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcblx0aWYgKCFzY3JpcHRVcmwpIHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xuXHRcdGlmKHNjcmlwdHMubGVuZ3RoKSB7XG5cdFx0XHR2YXIgaSA9IHNjcmlwdHMubGVuZ3RoIC0gMTtcblx0XHRcdHdoaWxlIChpID4gLTEgJiYgKCFzY3JpcHRVcmwgfHwgIS9eaHR0cChzPyk6Ly50ZXN0KHNjcmlwdFVybCkpKSBzY3JpcHRVcmwgPSBzY3JpcHRzW2ktLV0uc3JjO1xuXHRcdH1cblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC9eYmxvYjovLCBcIlwiKS5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGNodW5rc1xuLy8gXCIxXCIgbWVhbnMgXCJhbHJlYWR5IGxvYWRlZFwiXG52YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuXHRcInNyY19zaW11bGF0aW9uX3dvcmtlcl9qc1wiOiAxXG59O1xuXG4vLyBpbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmdcbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIgW2NodW5rSWRzLCBtb3JlTW9kdWxlcywgcnVudGltZV0gPSBkYXRhO1xuXHRmb3IodmFyIG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubVttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG5cdFx0fVxuXHR9XG5cdGlmKHJ1bnRpbWUpIHJ1bnRpbWUoX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cdHdoaWxlKGNodW5rSWRzLmxlbmd0aClcblx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZHMucG9wKCldID0gMTtcblx0cGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24oZGF0YSk7XG59O1xuX193ZWJwYWNrX3JlcXVpcmVfXy5mLmkgPSAoY2h1bmtJZCwgcHJvbWlzZXMpID0+IHtcblx0Ly8gXCIxXCIgaXMgdGhlIHNpZ25hbCBmb3IgXCJhbHJlYWR5IGxvYWRlZFwiXG5cdGlmKCFpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRpZih0cnVlKSB7IC8vIGFsbCBjaHVua3MgaGF2ZSBKU1xuXHRcdFx0aW1wb3J0U2NyaXB0cyhfX3dlYnBhY2tfcmVxdWlyZV9fLnAgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLnUoY2h1bmtJZCkpO1xuXHRcdH1cblx0fVxufTtcblxudmFyIGNodW5rTG9hZGluZ0dsb2JhbCA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSB8fCBbXTtcbnZhciBwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbiA9IGNodW5rTG9hZGluZ0dsb2JhbC5wdXNoLmJpbmQoY2h1bmtMb2FkaW5nR2xvYmFsKTtcbmNodW5rTG9hZGluZ0dsb2JhbC5wdXNoID0gaW5zdGFsbENodW5rO1xuXG4vLyBubyBITVJcblxuLy8gbm8gSE1SIG1hbmlmZXN0IiwidmFyIG5leHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLng7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fLmUoXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCIpLnRoZW4obmV4dCk7XG59OyIsIiIsIi8vIHJ1biBzdGFydHVwXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18ueCgpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9