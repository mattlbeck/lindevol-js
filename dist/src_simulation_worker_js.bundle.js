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
    const exportBundle = {
        action_map: simulation.params.action_map,
        genome_interpreter: simulation.params.genome_interpreter,
        genomes
    };
    self.postMessage({ type: "exportedGenomes", bundle: exportBundle });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsRUFBRTtXQUNGLEU7Ozs7O1dDUkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztXQ0pBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsR0FBRztXQUNIO1dBQ0E7V0FDQSxDQUFDLEk7Ozs7O1dDUEQsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7O1dDTkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztXQ0pBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGtDOzs7OztXQ2xCQTs7V0FFQTtXQUNBO1dBQ0E7V0FDQTtXQUNBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsYUFBYTtXQUNiO1dBQ0E7V0FDQTtXQUNBOztXQUVBO1dBQ0E7V0FDQTs7V0FFQTs7V0FFQSxrQjs7Ozs7V0NwQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7VUVIQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbGluZGV2b2wvaWdub3JlZHwvVXNlcnMvbWF0dC9saW5kZXZvbC1qcy9ub2RlX21vZHVsZXMvc2VlZHJhbmRvbXxjcnlwdG8iLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvYWN0aW9ucy5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9jZWxsLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2dlbm9tZS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9wbGFudC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9yYW5kb20uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltZGF0YS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW11bGF0aW9uLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3dvcmxkLmpzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9hbWQgZGVmaW5lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9hbWQgb3B0aW9ucyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvY2h1bmsgbG9hZGVkIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZW5zdXJlIGNodW5rIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbm9kZSBtb2R1bGUgZGVjb3JhdG9yIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9pbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3N0YXJ0dXAgY2h1bmsgZGVwZW5kZW5jaWVzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiAoaWdub3JlZCkgKi8iLCJjb25zdCBORUlHSEJPVVJIT09EID0gW1stMSwtMV0sIFswLC0xXSwgWzEsLTFdLCBbLTEsMF0sIFsxLDBdLCBbLTEsMV0sIFswLDFdLCBbMSwxXV07XG5jb25zdCBNVVRfSU5DUkVNRU5UID0gMC4wMDE7XG5cbmNsYXNzIEFjdGlvbntcbiAgICBjb25zdHJ1Y3RvcihhY3Rpb25Db2RlKXtcbiAgICAgICAgdGhpcy5jb2RlID0gYWN0aW9uQ29kZTtcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1zKCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGV4ZWN1dGUoY2VsbCl7XG4gICAgICAgIC8vIGFjdGlvbnMgYXJlIHR5cGljYWxseSBvbmx5IGNhcnJpZWQgb3V0IGlmIHRoZSBjZWxsIGhhcyBlbmVyZ3lcbiAgICAgICAgLy8gYW5kIHRoZSBjZWxsIGxvc2VzIGVuZXJneSBhcyBhIHJlc3VsdC5cbiAgICAgICAgaWYgKGNlbGwuZW5lcmdpc2VkKXtcbiAgICAgICAgICAgIHZhciBzdWNjZXNzID0gdGhpcy5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gIXN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgZG9BY3Rpb24oY2VsbCl7XG5cbiAgICB9XG59XG5cbmNsYXNzIERpdmlkZSBleHRlbmRzIEFjdGlvbntcblxuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICAvLyB0aGUgMiBsZWFzdCBzaWduaWZpY2FudCBiaXRzIG9mIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAvLyBkZXRlcm1pbmVzIHdoaWNoIGRpcmVjdGlvbiB0aGUgZGl2aWRlIGFjdGlvbiBpcyBmb3JcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLmdldERpcmVjdGlvbigpO1xuICAgICAgICBjZWxsLnBsYW50Lmdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1zKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERpcmVjdGlvbigpO1xuICAgIH1cblxuICAgIGdldERpcmVjdGlvbigpe1xuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcbiAgICAgICAgLy8gJiB3aXRoIDAwMDAwMTExIHRvIG1hc2sgb3V0IGxlYXN0IHNpZyBiaXRzXG4gICAgICAgIHZhciBkaXJlY3Rpb25Db2RlID0gdGhpcy5jb2RlICYgNztcbiAgICAgICAgcmV0dXJuIE5FSUdIQk9VUkhPT0RbZGlyZWN0aW9uQ29kZV07XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBkaXZpZGUgJHt0aGlzLmdldERpcmVjdGlvbigpfWA7XG4gICAgfVxufVxuXG5jbGFzcyBNdXRhdGVQbHVzIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgY2VsbC5wbGFudC5nZW5vbWUubXV0X2V4cCArPSBNVVRfSU5DUkVNRU5UO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJtdXQrXCI7XG4gICAgfVxufVxuXG5jbGFzcyBNdXRhdGVNaW51cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgLT0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0LVwiO1xuICAgIH1cbn1cblxuY2xhc3MgRmx5aW5nU2VlZCBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIHJldHVybiBjZWxsLnBsYW50LndvcmxkLnNlZWQoY2VsbC5wbGFudC5nZW5vbWUuY29weSgpKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJmbHlpbmdzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBMb2NhbFNlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSwgY2VsbC54KTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJsb2NhbHNlZWRcIjtcbiAgICB9XG59XG5cbmNsYXNzIFN0YXRlQml0TiBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKSB7XG4gICAgICAgIGNlbGwubmV4dEludGVybmFsU3RhdGUgPSBjZWxsLm5leHRJbnRlcm5hbFN0YXRlICYgTWF0aC5wb3coMiwgdGhpcy5nZXROdGhCaXQoKSk7XG4gICAgICAgIC8vIHRoaXMgYWN0aW9uIGRvZXMgbm90IGNvbnN1bWUgZW5lcmd5XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXROdGhCaXQoKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMTExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICByZXR1cm4gdGhpcy5jb2RlICYgMTU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBTdGF0ZUJpdCAke3RoaXMuZ2V0TnRoQml0KCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIEFjdGlvbk1hcCB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nLCBjb2RlUmFuZ2U9MjU2KXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbWFwcGluZztcbiAgICAgICAgdGhpcy5jb2RlUmFuZ2UgPSBjb2RlUmFuZ2U7XG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IFtEaXZpZGUsIEZseWluZ1NlZWQsIExvY2FsU2VlZCwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIFN0YXRlQml0Tl07XG4gICAgfVxuXG4gICAgZ2V0QWN0aW9uKGFjdGlvbkNvZGUpe1xuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGFjdGlvbiBjb2RlIGludG8gdGhlIFswLCBzdW0pIHJhbmdlIHNvIHdlaWdodHMgY2FuIGJlXG4gICAgICAgIC8vIGFueSBwb3NpdGl2ZSBpbnRlZ2VycyByYXRoZXIgdGhhbiBuZWVkaW5nIHRvIHN1bSB0byBjb2RlUmFuZ2UuXG4gICAgICAgIGNvbnN0IHN1bSA9IHRoaXMubWFwcGluZy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZENvZGUgPSBNYXRoLmZsb29yKChhY3Rpb25Db2RlIC8gdGhpcy5jb2RlUmFuZ2UpICogc3VtKTtcbiAgICAgICAgdmFyIG1hcHBpbmdDb3VudCA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubWFwcGluZy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBtYXBwaW5nQ291bnQgKz0gdGhpcy5tYXBwaW5nW2ldO1xuICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRDb2RlIDwgbWFwcGluZ0NvdW50KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1tpXShhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBGYWxsYmFjayBmb3IgZmxvYXRpbmctcG9pbnQgZWRnZSBjYXNlc1xuICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1t0aGlzLm1hcHBpbmcubGVuZ3RoIC0gMV0oYWN0aW9uQ29kZSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7RGl2aWRlLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgTG9jYWxTZWVkLCBGbHlpbmdTZWVkLCBBY3Rpb25NYXAsIE5FSUdIQk9VUkhPT0R9OyIsIlxuY2xhc3MgQ2VsbHtcbiAgICBjb25zdHJ1Y3RvcihwbGFudCwgeCwgeSl7XG4gICAgICAgIHRoaXMucGxhbnQgPSBwbGFudDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGdldCBlbmVyZ2lzZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmVyZ2lzZWQ7XG4gICAgfVxuXG4gICAgc2V0IGVuZXJnaXNlZCh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fZW5lcmdpc2VkID09PSB2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucGxhbnQpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoKXtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgsIHgsIHksIHNpemUsIGNvbG91cil7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvdXI7XG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgLy9jdHguc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYENlbGwgYXQgKCR7dGhpcy54fSwgJHt0aGlzLnl9KSBlbmVyZ3k6ICR7dGhpcy5lbmVyZ2lzZWR9YDtcbiAgICB9XG59XG5cbmV4cG9ydCB7Q2VsbH07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtBY3Rpb25NYXB9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgQnl0ZUFycmF5IGV4dGVuZHMgQXJyYXl7XG5cbiAgICBjb25zdHJ1Y3RvcihsZW5ndGg9MCwgaW5pdGlhbF9tdXRfZXhwPTApe1xuICAgICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgICB0aGlzLm11dF9leHAgPSBpbml0aWFsX211dF9leHA7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb20oYXJyLCBtdXRfZXhwPTApe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGFyci5sZW5ndGgsIG11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gYXJyW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXJpYWxpemUgdGhpcyBnZW5vbWUgdG8gYSBzdHJpbmc6IFwiPG11dF9leHA+OzxieXRlMD4sPGJ5dGUxPiwuLi5cIlxuICAgICAqL1xuICAgIHNlcmlhbGl6ZSgpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5tdXRfZXhwfTske0FycmF5LmZyb20odGhpcykuam9pbihcIixcIil9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXNlcmlhbGl6ZSBhIGdlbm9tZSBzdHJpbmcgcHJvZHVjZWQgYnkgc2VyaWFsaXplKCkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm5zIHtCeXRlQXJyYXl9XG4gICAgICovXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKHN0cil7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gc3RyLnRyaW0oKS5zcGxpdChcIjtcIik7XG4gICAgICAgIGNvbnN0IG11dF9leHAgPSBwYXJzZUZsb2F0KHBhcnRzWzBdKTtcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBwYXJ0c1sxXS5zcGxpdChcIixcIikubWFwKE51bWJlcik7XG4gICAgICAgIHJldHVybiBCeXRlQXJyYXkuZnJvbShieXRlcywgbXV0X2V4cCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJhbmRvbShsZW5ndGgpe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSByYW5kb21JbnQoMCwgMjU1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgY29weSgpe1xuICAgICAgICB2YXIgbmV3QXJyID0gbmV3IEJ5dGVBcnJheSh0aGlzLmxlbmd0aCwgdGhpcy5tdXRfZXhwKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBuZXdBcnJbaV0gPSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdBcnI7XG4gICAgfVxuXG59XG5cbmNsYXNzIE11dGF0b3J7XG4gICAgY29uc3RydWN0b3IocHJvYiwgcHJvYl9yZXBsYWNlbWVudCwgcHJvYl9pbnNlcnRpb24sIHByb2JfZGVsZXRpb24sIHByb2JfZHVwLCByZXBsYWNlbWVudF9tb2RlLCB1bml0cyl7XG4gICAgICAgIHRoaXMucHJvYiA9IHByb2I7XG4gICAgICAgIHRoaXMucFIgPSBwcm9iX3JlcGxhY2VtZW50O1xuICAgICAgICB0aGlzLnBJID0gcHJvYl9pbnNlcnRpb247XG4gICAgICAgIHRoaXMucEQgPSBwcm9iX2RlbGV0aW9uO1xuICAgICAgICB0aGlzLnBEdXAgPSBwcm9iX2R1cDtcbiAgICAgICAgdGhpcy5wUm1vZGUgPSByZXBsYWNlbWVudF9tb2RlOyAgXG4gICAgICAgIHRoaXMudW5pdHMgPSB1bml0cztcbiAgICB9XG5cbiAgICBtdXRhdGUoZ2Vub21lKXtcbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBSLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlKGdlbm9tZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBJLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5pbnNlcnQoZ2Vub21lKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEQsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShnZW5vbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbVByb2IocCwgZXhwKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbVByb2IocCAqIE1hdGgucG93KCB0aGlzLnByb2IsIGV4cCkpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBzd2l0Y2godGhpcy5wUm1vZGUpe1xuICAgICAgICBjYXNlIFwiYnl0ZXdpc2VcIjpcbiAgICAgICAgICAgIGdlbm9tZVtpXSA9IHRoaXMucmFuZG9tQ2hhcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJiaXR3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSBnZW5vbWVbaV0gXiBNYXRoLnBvdygyLCByYW5kb21JbnQoMCwgNykpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbXV0YXRpb24gcmVwbGFjZW1lbnQgbW9kZTogJHt0aGlzLnBSbW9kZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBpbnNlcnQoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAwLCB0aGlzLnJhbmRvbUNoYXIoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZWxldGUoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJhbmRvbUNoYXIoKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCAyNTUpO1xuICAgIH1cblxuICAgIHJhbmRvbVBvcyhnZW5vbWUpe1xuICAgICAgICByZXR1cm4gcmFuZG9tSW50KDAsIGdlbm9tZS5sZW5ndGgtMSk7XG4gICAgfVxufVxuXG5cblxuY2xhc3MgUnVsZSB7XG4gICAgY29uc3RydWN0b3IoZXFNYXNrLCBzdGF0ZSwgYWN0aW9uKXtcbiAgICAgICAgdGhpcy5lcU1hc2sgPSBlcU1hc2s7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBhY3Rpb247XG4gICAgfVxuXG4gICAgbWF0Y2hlcyhzdGF0ZSl7XG4gICAgICAgIHZhciBlcVN0YXRlID0gc3RhdGUgJiB0aGlzLmVxTWFzaztcbiAgICAgICAgcmV0dXJuIGVxU3RhdGUgPT09IHRoaXMuc3RhdGU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuc3RhdGV9IC0+ICR7dGhpcy5hY3Rpb259YDtcbiAgICB9XG59XG5cbmNsYXNzIEdlbm9tZUludGVycHJldGVye1xuICAgIC8qKlxuICAgICAqIE1ldGhvZHMgdGhhdCBkZWNvZGUgZ2Vub21lcyBpbnRvIHJ1bGVzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWFwcGluZywgY29kZVJhbmdlPTI1Nil7XG4gICAgICAgIHRoaXMubWFwcGluZyA9IG5ldyBBY3Rpb25NYXAobWFwcGluZywgY29kZVJhbmdlKTtcbiAgICB9XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG5cbiAgICB9XG59XG5cbmNsYXNzIEJsb2NrSW50ZXJwcmV0ZXIgZXh0ZW5kcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nKXtcbiAgICAgICAgc3VwZXIobWFwcGluZywgMjU2KTsgLy8gYWN0aW9uIGJ5dGUgaXMgZnVsbCAwLTI1NSByYW5nZVxuICAgIH1cbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5KXtcbiAgICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgYnl0ZWFycmF5Lmxlbmd0aDsgaSs9Mil7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5tYXBwaW5nLmdldEFjdGlvbihieXRlYXJyYXlbaSsxXSk7XG4gICAgICAgICAgICBydWxlcy5wdXNoKG5ldyBSdWxlKDI1NSwgYnl0ZWFycmF5W2ldLCBhY3Rpb24pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnVsZXM7XG4gICAgfVxufVxuXG5jbGFzcyBQcm9tb3RvckludGVycHJldGVyIGV4dGVuZHMgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgY29uc3RydWN0b3IobWFwcGluZyl7XG4gICAgICAgIHN1cGVyKG1hcHBpbmcsIDY0KTsgLy8gdGVybWluYXRvciBjb250cmlidXRlcyBsb3dlciA2IGJpdHM6IHJhbmdlIDAtNjNcbiAgICB9XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG4gICAgICAgIHZhciBydWxlcyA9IFtdO1xuICAgICAgICB2YXIgZ2VuZXMgPSBbXTtcbiAgICAgICAgdmFyIGdlbmUgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBieXRlYXJyYXkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGMgPSBieXRlYXJyYXlbaV07XG4gICAgICAgICAgICBpZihiaXRTZXQoYywgNikgPT09IGJpdFNldChjLCA3KSl7XG4gICAgICAgICAgICAgICAgLy8gb3BlcmF0b3JcbiAgICAgICAgICAgICAgICBpZihnZW5lLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZS5wdXNoKGMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGJpdFNldChjLCA3KSl7XG4gICAgICAgICAgICAgICAgLy8gcHJvbW90b3JcbiAgICAgICAgICAgICAgICBnZW5lID0gW2NdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBpZihiaXRTZXQoYywgNikpe1xuICAgICAgICAgICAgICAgICAgICAvLyB0ZXJtaW5hdG9yXG4gICAgICAgICAgICAgICAgICAgIGlmKGdlbmUubGVuZ3RoPjApe1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZS5wdXNoKGMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXMucHVzaChnZW5lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmUgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIGdlbmVzLmZvckVhY2goZnVuY3Rpb24oZ2VuZSl7XG4gICAgICAgICAgICAvLyBleHRyYWN0IDYgbGVhc3Qgc2lnIGJpdHMgZnJvbSB0ZXJtaW5hdG9yIGFzIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAgICAgdmFyIGFjdGlvbkNvZGUgPSBnZW5lW2dlbmUubGVuZ3RoLTFdICYgKE1hdGgucG93KDIsIDYpIC0gMSk7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5tYXBwaW5nLmdldEFjdGlvbihhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gdGFrZSBpbmZvcm1hdGlvbiBmcm9tIG9wZXJhdG9ycyB0byBjcmVhdGUgc3RhdGUgbWFza1xuICAgICAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICAgICAgdmFyIGVxTWFzayA9IDA7IC8vIHNwZWNpZmllZCB3aGljaCBiaXRzIGNvbnRyaWJ1dGUgdG8gdGhlIHN0YXRlIG1hc2tcbiAgICAgICAgICAgIGZvcih2YXIgaT0xOyBpPGdlbmUubGVuZ3RoLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIDQgbGVhc3Qgc2lnIGJpdHMgZGV0ZXJtaW5lIHRoZSBtYXNrIGluZGV4XG4gICAgICAgICAgICAgICAgdmFyIG1hc2tCaXQgPSBnZW5lW2ldICYgKE1hdGgucG93KDIsIDQpIC0gMSk7XG5cbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmVzIGlmIHRoZSBtYXNrIGF0IHRoaXMgaW5kZXggaXMgc2V0IHRvIDEgb3IgMFxuICAgICAgICAgICAgICAgIHZhciBiaXRTdGF0ZSA9IChnZW5lW2ldICYgTWF0aC5wb3coMiwgNCkpID4+IDQ7XG4gICAgICAgICAgICAgICAgbWFzayArPSBNYXRoLnBvdygyLCBtYXNrQml0KSpiaXRTdGF0ZTtcblxuICAgICAgICAgICAgICAgIGVxTWFzayArPSBNYXRoLnBvdygyLCBtYXNrQml0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJ1bGVzLnB1c2gobmV3IFJ1bGUoZXFNYXNrLCBtYXNrLCBhY3Rpb24pKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJpdFNldChieXRlLCBpKXtcbiAgICByZXR1cm4gKGJ5dGUgJiBNYXRoLnBvdygyLCBpKSkgPj4gaTtcbn1cblxuZXhwb3J0IHtCeXRlQXJyYXksIEJsb2NrSW50ZXJwcmV0ZXIsIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9OyIsImltcG9ydCB7cmFuZG9tSW50LCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7Q2VsbH0gZnJvbSBcIi4vY2VsbC5qc1wiO1xuaW1wb3J0IHtORUlHSEJPVVJIT09EfSBmcm9tIFwiLi9hY3Rpb25zLmpzXCI7XG5cbmNsYXNzIFBsYW50e1xuICAgIGNvbnN0cnVjdG9yKHgsIHdvcmxkLCBnZW5vbWUsIHVzZUludGVybmFsU3RhdGU9ZmFsc2UpIHtcbiAgICAgICAgdGhpcy53b3JsZCA9IHdvcmxkO1xuICAgICAgICB0aGlzLmVuZXJnaXNlZENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5jZWxscyA9IFtuZXcgQ2VsbCh0aGlzLCB0aGlzLndvcmxkLmdldFgoeCksIDApXTtcbiAgICAgICAgdGhpcy5nZW5vbWUgPSBnZW5vbWU7XG4gICAgICAgIHRoaXMudXNlSW50ZXJuYWxTdGF0ZSA9IHVzZUludGVybmFsU3RhdGU7XG4gICAgfVxuXG4gICAgZ2V0TmVpZ2hib3VyaG9vZChjZWxsKXtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBuZWlnaGJvdXJob29kIG1hc2tcbiAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxORUlHSEJPVVJIT09ELmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBwb3MgPSBORUlHSEJPVVJIT09EW2ldO1xuICAgICAgICAgICAgdmFyIHggPSBjZWxsLnggKyBwb3NbMF07XG4gICAgICAgICAgICB2YXIgeSA9IGNlbGwueSArIHBvc1sxXTtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICB2YXIgd29ybGRQb3MgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2goZXJyb3Ipe1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdvcmxkUG9zIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICAgICAgbWFzayA9IG1hc2sgfCBNYXRoLnBvdygyLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFzaztcbiAgICB9XG5cbiAgICBnZXRTdGF0ZShjZWxsKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKSB8IGNlbGwuaW50ZXJuYWxTdGF0ZSB8IChNYXRoLnBvdygyLCAxNSkgKiAoIGNlbGwuZW5lcmdpc2VkID8gMSA6IDApKTtcbiAgICB9XG5cbiAgICBncm93KCl7XG4gICAgICAgIHRoaXMuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gZ3Jvd1xuICAgICAgICAgICAgaWYocmFuZG9tUHJvYigwLjgpKXtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VzID0gdGhpcy5nZXRHcm93RGlyZWN0aW9uKGNlbGwpO1xuICAgICAgICAgICAgICAgIGlmKHNwYWNlcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHNwYWNlc1tyYW5kb21JbnQoMCwgc3BhY2VzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdyb3cgdGhlIHBsYW50IGJ5IG9uZSBjZWxsIGlmIHBvc3NpYmxlXG4gICAgICogQHBhcmFtIHsqfSBjZWxsIHRoZSBjZWxsIHRvIGdyb3cgZnJvbVxuICAgICAqIEBwYXJhbSB7Kn0gZGlyZWN0aW9uIHRoZSBkaXJlY3Rpb24gdG8gZ3JvdyBpblxuICAgICAqL1xuICAgIGdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24pe1xuICAgICAgICB2YXIgeCA9IGNlbGwueCtkaXJlY3Rpb25bMF0sIHkgPSBjZWxsLnkrZGlyZWN0aW9uWzFdO1xuICAgICAgICAvLyBjaGVjayBpZiBzcGFjZSBpcyBjbGVhclxuICAgICAgICB2YXIgc3BhY2UgPSB0aGlzLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgICAgIGlmIChzcGFjZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BhY2UgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgIGlmIChzcGFjZS5wbGFudCA9PT0gdGhpcyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdGhpcyBwbGFudCB3aWxsIGtpbGwgdGhlIG90aGVyXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvYmFiaWxpdHkuLi5cbiAgICAgICAgICAgIGlmKHJhbmRvbVByb2Ioc3BhY2UucGxhbnQuZ2V0S2lsbFByb2JhYmlsaXR5KCkpKXtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgc3VjY2VlZGVkLiBLaWxsIGNvbXBldGl0b3IgYW5kIGNvbnRpbnVlIHdpdGggZ3Jvd3RoXG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZC5raWxsUGxhbnQoc3BhY2UucGxhbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYXR0YWNrIGZhaWxlZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIC8vIGdyb3cgY2VsbCBpbiB0byBlbXB0eSBzcGFjZVxuICAgICAgICB2YXIgbmV3X2NlbGwgPSBuZXcgQ2VsbCh0aGlzLCB0aGlzLndvcmxkLmdldFgoeCksIHkpO1xuICAgICAgICB0aGlzLmNlbGxzLnB1c2gobmV3X2NlbGwpO1xuICAgICAgICB0aGlzLndvcmxkLmFkZENlbGwobmV3X2NlbGwpO1xuICAgIH1cblxuICAgIGdldEtpbGxQcm9iYWJpbGl0eSgpe1xuICAgICAgICByZXR1cm4gMS90aGlzLmVuZXJnaXNlZENvdW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB3aGV0aGVyIHRoaXMgcGxhbnQgc2hvdWxkIGRpZS5cbiAgICAgKiBAcGFyYW0ge30gbmF0dXJhbF9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gZW5lcmd5X2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGVuZXJneSByaWNoIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBsZWFub3Zlcl9mYWN0b3IgZmFjdG9yIHRvIHRoZSBsZWFub3ZlciB0ZXJtXG4gICAgICovXG4gICAgZ2V0RGVhdGhQcm9iYWJpbGl0eShkZWF0aF9mYWN0b3IsIG5hdHVyYWxfZXhwLCBlbmVyZ3lfZXhwLCBsZWFub3Zlcl9mYWN0b3Ipe1xuICAgICAgICB2YXIgbnVtQ2VsbHMgPSB0aGlzLmNlbGxzLmxlbmd0aDtcbiAgICAgICAgdmFyIGxlYW5vdmVyRW5lcmdpc2VkID0gMDtcbiAgICAgICAgdmFyIHJvb3RDZWxsID0gdGhpcy5jZWxsc1swXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5jZWxscy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbHNbaV07XG4gICAgICAgICAgICB2YXIgbGUgPSB0aGlzLndvcmxkLndpZHRoLzIgLSAoICgoIDEuNSp0aGlzLndvcmxkLndpZHRoICkgKyBjZWxsLnggLSByb290Q2VsbC54KSAgJSB0aGlzLndvcmxkLndpZHRoKTtcbiAgICAgICAgICAgIGxlYW5vdmVyRW5lcmdpc2VkICs9IGxlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYW5vdmVyQ2VsbHMgPSAyLyhudW1DZWxscyoobnVtQ2VsbHMtMSkpO1xuICAgICAgICBpZiAobGVhbm92ZXJDZWxscyA9PT0gSW5maW5pdHkpe1xuICAgICAgICAgICAgbGVhbm92ZXJDZWxscyA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVhbm92ZXJUZXJtID0gbGVhbm92ZXJDZWxscypNYXRoLmFicyhsZWFub3ZlckVuZXJnaXNlZCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZF9uYXR1cmFsID0gTWF0aC5wb3cobnVtQ2VsbHMsIG5hdHVyYWxfZXhwKTtcbiAgICAgICAgdmFyIGRfZW5lcmd5ID0gTWF0aC5wb3codGhpcy5lbmVyZ2lzZWRDb3VudCsxLCBlbmVyZ3lfZXhwKTtcbiAgICAgICAgdmFyIGRfbGVhbm92ZXIgPSBsZWFub3Zlcl9mYWN0b3IqbGVhbm92ZXJUZXJtO1xuICAgICAgICB2YXIgcERlYXRoID0gZGVhdGhfZmFjdG9yICogZF9uYXR1cmFsICogZF9lbmVyZ3kgKyBkX2xlYW5vdmVyO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJwcm9iXCI6IHBEZWF0aCxcbiAgICAgICAgICAgIFwibmF0dXJhbFwiOiBkX25hdHVyYWwsXG4gICAgICAgICAgICBcImVuZXJneVwiOiBkX2VuZXJneSxcbiAgICAgICAgICAgIFwibGVhbm92ZXJcIjogZF9sZWFub3ZlclxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGxhbnQgfTsiLCJpbXBvcnQgc2VlZHJhbmRvbSBmcm9tIFwic2VlZHJhbmRvbVwiO1xuXG4vKipcbiAqIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byBNYXRoLnJhbmRvbVxuICogQHBhcmFtIHsqfSBzZWVkIGRhdGEgdG8gdXNlIHRvIHNlZWQgYWxsIGZ1dHVyZSBSTkcgY2FsbHNcbiAqL1xuZnVuY3Rpb24gc2VlZFJhbmRvbShzZWVkKXtcbiAgICBzZWVkcmFuZG9tKHNlZWQsIHtnbG9iYWw6IHRydWV9KTtcbn1cblxuLyoqXG4gKiByZXR1cm5zIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiAwIGFuZCBtYXggKGluY2x1c2l2ZSlcbiAqIEBwYXJhbSB7Kn0gbWF4IG1heGltdW0gaW50ZWdlciB0byBnZW5lcmF0ZSBhcyBhIHJhbmRvbSBudW1iZXJcbiAqL1xuZnVuY3Rpb24gcmFuZG9tSW50KG1pbiwgbWF4KXtcbiAgICAvLyBub3RlOiBNYXRoLnJhbmRvbSByZXR1cm5zIGEgcmFuZG9tIG51bWJlciBleGNsdXNpdmUgb2YgMSxcbiAgICAvLyBzbyB0aGVyZSBpcyArMSBpbiB0aGUgYmVsb3cgZXF1YXRpb24gdG8gZW5zdXJlIHRoZSBtYXhpbXVtXG4gICAgLy8gbnVtYmVyIGlzIGNvbnNpZGVyZWQgd2hlbiBmbG9vcmluZyAwLjkuLi4gcmVzdWx0cy5cbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZXMgdGhlIGNoYW5jZSBvZiBhbiBldmVudCBoYXBwZW5pbmcgZ2l2ZW4gcHJvYlxuICogQHBhcmFtIHsqfSBwcm9iIGZyYWN0aW9uIGJldHdlZW4gMCBhbmQgMSBjaGFuY2Ugb2YgdGhlIGV2ZW50IGhhcHBlbmluZ1xuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgZXZlbnQgaGFwcGVucywgZmFsc2UgaWYgbm90XG4gKi9cbmZ1bmN0aW9uIHJhbmRvbVByb2IocHJvYil7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgPD0gcHJvYjtcbn1cblxuZXhwb3J0IHtzZWVkUmFuZG9tLCByYW5kb21JbnQsIHJhbmRvbVByb2J9OyIsImltcG9ydCAqIGFzIHN0YXRzIGZyb20gXCJzdGF0cy1saXRlXCI7XG5cbmZ1bmN0aW9uIGxldmVuc2h0ZWluKGEsIGIpIHtcbiAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiBiLmxlbmd0aDtcbiAgICBpZiAoYi5sZW5ndGggPT09IDApIHJldHVybiBhLmxlbmd0aDtcbiAgICBsZXQgbWF0cml4ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gYi5sZW5ndGg7IGkrKykgbWF0cml4W2ldID0gW2ldO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDw9IGEubGVuZ3RoOyBqKyspIG1hdHJpeFswXVtqXSA9IGo7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoYltpIC0gMV0gPT09IGFbaiAtIDFdKSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gbWF0cml4W2kgLSAxXVtqIC0gMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqXSA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaSAtIDFdW2ogLSAxXSArIDEsIC8vIHN1YnN0aXR1dGlvblxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqIC0gMV0gKyAxLCAvLyBpbnNlcnRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1bal0gKyAxICAvLyBkZWxldGlvblxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0cml4W2IubGVuZ3RoXVthLmxlbmd0aF07XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUFsbGVsZUVudHJvcHkocGxhbnRzKSB7XG4gICAgaWYgKHBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIGNvbnN0IGNvdW50cyA9IG5ldyBBcnJheSgyNTYpLmZpbGwoMCk7XG4gICAgbGV0IHRvdGFsID0gMDtcbiAgICBwbGFudHMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwLmdlbm9tZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY291bnRzW3AuZ2Vub21lW2ldXSsrO1xuICAgICAgICAgICAgdG90YWwrKztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0b3RhbCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgbGV0IGVudHJvcHkgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICAgICAgaWYgKGNvdW50c1tpXSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBjb3VudHNbaV0gLyB0b3RhbDtcbiAgICAgICAgICAgIGVudHJvcHkgLT0gcCAqIE1hdGgubG9nMihwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZW50cm9weTtcbn1cblxuY2xhc3MgU2ltRGF0YXtcblxuICAgIGNvbnN0cnVjdG9yKHNpbXVsYXRpb24pe1xuICAgICAgICB0aGlzLnNpbSA9IHNpbXVsYXRpb247XG4gICAgICAgIHRoaXMuZGF0YSA9IHtcInN0ZXBudW1cIjogW119O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMgPSBbXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicG9wdWxhdGlvblwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInRvdGFsX2NlbGxzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIHAuY2VsbHMubGVuZ3RoLCAwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImVuZXJnaXNlZF9jZWxsc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLmNlbGxzLmZpbHRlcihjID0+IGMuZW5lcmdpc2VkKS5sZW5ndGgsIDApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicGxhbnRfc2l6ZV9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5jZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2Vub21lX3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLmxlbmd0aCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJtdXRfZXhwX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5tdXRfZXhwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X2hlaWdodF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoLi4ucC5jZWxscy5tYXAoYyA9PiBjLnkpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbmV0aWNfZGlzdGFuY2VfbWVhblwiLCBBc0lzLCBmdW5jdGlvbihzaW0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGFudHMgPSBzaW0ud29ybGQucGxhbnRzO1xuICAgICAgICAgICAgICAgIGlmIChwbGFudHMubGVuZ3RoIDwgMikgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgbGV0IHN1bURpc3QgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBzYW1wbGVTaXplID0gTWF0aC5taW4oMzAsIHBsYW50cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGxldCBwYWlycyA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzYW1wbGVTaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcDEgPSBwbGFudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGxhbnRzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwMiA9IHBsYW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwbGFudHMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwMSAhPT0gcDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bURpc3QgKz0gbGV2ZW5zaHRlaW4ocDEuZ2Vub21lLCBwMi5nZW5vbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFpcnMrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFpcnMgPiAwID8gc3VtRGlzdCAvIHBhaXJzIDogMDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImFsbGVsZV9lbnRyb3B5XCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxjdWxhdGVBbGxlbGVFbnRyb3B5KHNpbS53b3JsZC5wbGFudHMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb2xsZWN0IGRhdGEgZm9yIHRoZSBjdXJyZW50IHN0ZXBcbiAgICAgKi9cbiAgICByZWNvcmRTdGVwKCl7XG4gICAgICAgIHZhciBzdGVwRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMuZm9yRWFjaChmdW5jdGlvbihjKXtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBjLmNvbGxlY3QodGhpcy5zaW0pO1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihzdGVwRGF0YSwgdmFsdWVzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5wdXNoKHRoaXMuc2ltLnN0ZXBudW0pO1xuICAgICAgICBpZiAodGhpcy5kYXRhW1wic3RlcG51bVwiXS5sZW5ndGggPiBTaW1EYXRhLk1BWF9EQVRBX1BPSU5UUykge1xuICAgICAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5rZXlzKHN0ZXBEYXRhKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAgICAgaWYgKCEoayBpbiB0aGlzLmRhdGEpKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF0YVtrXS5wdXNoKHN0ZXBEYXRhW2tdKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGFba10ubGVuZ3RoID4gU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10uc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMgPSAyMDAwO1xuXG5jbGFzcyBDb2xsZWN0b3J7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZWNscywgY29sbGVjdEZ1bmMpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnR5cGUgPSBuZXcgdHlwZWNscyhuYW1lKTtcbiAgICAgICAgdGhpcy5mdW5jID0gY29sbGVjdEZ1bmM7XG4gICAgfVxuXG4gICAgY29sbGVjdChzaW0pe1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZnVuYyhzaW0pO1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnRyYW5zZm9ybShkYXRhKTtcbiAgICB9XG59XG5cbmNsYXNzIENvbGxlY3RvclR5cGV7XG4gICAgY29uc3RydWN0b3IobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZCBtZXRob2RcIik7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtKGRhdGEpe1xuICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy50cmFuc2Zvcm1EYXRhKGRhdGEpO1xuICAgICAgICB2YXIgdHJhbnNmb3JtZWRfZGF0YSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgICAgICB0cmFuc2Zvcm1lZF9kYXRhW3RoaXMubmFtZSArIGtdID0gdmFsdWVzW2tdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkX2RhdGE7XG4gICAgfVxufVxuXG5jbGFzcyBBc0lzIGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICByZXR1cm4ge1wiXCI6IGRhdGF9O1xuICAgIH1cbn1cblxuY2xhc3MgU3VtbWFyeSBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIm1pblwiOiBNYXRoLm1pbihkYXRhKSwgXCJtZWFuXCI6IHN0YXRzLm1lYW4oZGF0YSksIFwibWF4XCI6IE1hdGgubWF4KGRhdGEpfTtcbiAgICB9XG59XG5leHBvcnQge1NpbURhdGF9OyIsImltcG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1dvcmxkfSBmcm9tIFwiLi93b3JsZC5qc1wiO1xuaW1wb3J0IHtCeXRlQXJyYXksIEJsb2NrSW50ZXJwcmV0ZXIsIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9IGZyb20gXCIuL2dlbm9tZS5qc1wiO1xuXG5jbGFzcyBTaW11bGF0aW9uUGFyYW1ze1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcz17fSl7XG4gICAgICAgIHRoaXMucmFuZG9tX3NlZWQgPSAxO1xuICAgICAgICB0aGlzLnJlY29yZF9pbnRlcnZhbCA9IDEwO1xuICAgICAgICB0aGlzLnN0ZXBzX3Blcl9mcmFtZSA9IDE7XG4gICAgICAgIHRoaXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWwgPSAwO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX3N0cmVuZ3RoID0gMC4xO1xuXG4gICAgICAgIHRoaXMud29ybGRfd2lkdGggPSAyNTA7XG4gICAgICAgIHRoaXMud29ybGRfaGVpZ2h0ID0gNDA7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9wb3B1bGF0aW9uID0gMjUwO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmVyZ3lfcHJvYiA9IDAuNTtcblxuICAgICAgICAvLyBkZWF0aCBwYXJhbXNcbiAgICAgICAgdGhpcy5kZWF0aF9mYWN0b3IgPSAwLjI7XG4gICAgICAgIHRoaXMubmF0dXJhbF9leHAgPSAwO1xuICAgICAgICB0aGlzLmVuZXJneV9leHAgPSAtMi41O1xuICAgICAgICB0aGlzLmxlYW5vdmVyX2ZhY3RvciA9IDAuMjtcblxuICAgICAgICAvLyBtdXRhdGlvbnNcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZV9tb2RlID0gXCJieXRld2lzZVwiO1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlID0gMC4wMDI7XG4gICAgICAgIHRoaXMubXV0X2luc2VydCA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZGVsZXRlID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9mYWN0b3IgPSAxLjU7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9tdXRfZXhwID0gMDtcblxuICAgICAgICB0aGlzLmdlbm9tZV9pbnRlcnByZXRlciA9IFwiYmxvY2tcIjtcbiAgICAgICAgdGhpcy5pbml0aWFsX2dlbm9tZV9sZW5ndGggPSA0MDA7XG5cbiAgICAgICAgLy8gZGl2aWRlLCBmbHlpbmdzZWVkLCBsb2NhbHNlZWQsIG11dCssIG11dC0sIHN0YXRlYml0XG4gICAgICAgIHRoaXMuYWN0aW9uX21hcCA9IFsyMDAsIDIwLCAwLCAxOCwgMTgsIDBdO1xuXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgcGFyYW1zKTtcbiAgICB9XG59XG5cbmNsYXNzIFNpbXVsYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcblxuICAgICAgICAvLyBTZWVkIGFsbCBmdXR1cmUgY2FsbHMgdG8gcmFuZG9tXG4gICAgICAgIC8vIHRoaXMgbWFrZXMgb3V0IHRlc3RzIHJlcHJvZHVjaWJsZSBnaXZlbiB0aGUgc2FtZSBzZWVkIGlzIHVzZWRcbiAgICAgICAgLy8gaW4gZnV0dXJlIGlucHV0IHBhcmFtZXRlcnNcbiAgICAgICAgc2VlZFJhbmRvbSh0aGlzLnBhcmFtcy5yYW5kb21fc2VlZCk7XG5cbiAgICAgICAgdGhpcy53b3JsZCA9IG5ldyBXb3JsZCh0aGlzLnBhcmFtcy53b3JsZF93aWR0aCwgdGhpcy5wYXJhbXMud29ybGRfaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5nZW5vbWVJbnRlcnByZXRlciA9IHRoaXMuZ2V0SW50ZXJwcmV0ZXIoKTtcbiAgICAgICAgdGhpcy5tdXRfdW5pdHMgPSAxO1xuICAgICAgICAvLyBlbnN1cmUgbXV0YXRpb24gdW5pdHMgaXMgY29tcGF0aWJsZSB3aXRoIHRoZSBpbnRlcnByZXRlciB0eXBlXG4gICAgICAgIGlmKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBCbG9ja0ludGVycHJldGVyKXtcbiAgICAgICAgICAgIHRoaXMubXV0X3VuaXRzID0gMjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0ZXBudW0gPSAwO1xuICAgIH1cblxuICAgIGdldEludGVycHJldGVyKCl7XG4gICAgICAgIHN3aXRjaCAodGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyKXtcbiAgICAgICAgY2FzZSBcImJsb2NrXCI6XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJsb2NrSW50ZXJwcmV0ZXIodGhpcy5wYXJhbXMuYWN0aW9uX21hcCk7XG4gICAgICAgIGNhc2UgXCJwcm9tb3RvclwiOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9tb3RvckludGVycHJldGVyKHRoaXMucGFyYW1zLmFjdGlvbl9tYXApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGludGVycHJldGVyICR7dGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyfWApO1xuICAgICAgICB9ICBcbiAgICB9XG5cbiAgICBpbml0X3BvcHVsYXRpb24oKXtcbiAgICAgICAgLy8gcmFuZG9tbHkgY2hvb3NlIHNwb3RzIHRvIHNlZWQgdGhlIHdvcmxkIHdpdGhcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMubmV3U2VlZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgcG9wdWxhdGlvbiBmcm9tIGEgbGlzdCBvZiBzZXJpYWxpemVkIGdlbm9tZSBzdHJpbmdzLFxuICAgICAqIGRyYXdpbmcgd2l0aCByZXBsYWNlbWVudCB1cCB0byBpbml0aWFsX3BvcHVsYXRpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2VyaWFsaXplZEdlbm9tZXNcbiAgICAgKi9cbiAgICBpbml0X3BvcHVsYXRpb25fZnJvbV9nZW5vbWVzKHNlcmlhbGl6ZWRHZW5vbWVzKXtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IHNlcmlhbGl6ZWRHZW5vbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlcmlhbGl6ZWRHZW5vbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgY29uc3QgZ2Vub21lID0gQnl0ZUFycmF5LmRlc2VyaWFsaXplKHN0cik7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ld1NlZWQoKXtcbiAgICAgICAgLy8gY3JlYXRlIGEgcmFuZG9tIGdlbm9tZVxuICAgICAgICB2YXIgZ2Vub21lID0gQnl0ZUFycmF5LnJhbmRvbSh0aGlzLnBhcmFtcy5pbml0aWFsX2dlbm9tZV9sZW5ndGgpO1xuICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lKTtcbiAgICB9XG5cbiAgICBzdGVwKCl7XG4gICAgICAgIHRoaXMuc3RlcG51bSsrO1xuICAgICAgICB0aGlzLnNpbXVsYXRlRGVhdGgoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUxpZ2h0KCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMubXV0YXRlKCk7XG4gICAgfVxuXG4gICAgc2ltdWxhdGVBY3Rpb25zKCl7XG4gICAgICAgIHRoaXMud29ybGQucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgdmFyIHJ1bGVzID0gdGhpcy5nZW5vbWVJbnRlcnByZXRlci5pbnRlcnByZXQocGxhbnQuZ2Vub21lKTtcbiAgICAgICAgICAgIHBsYW50LmNlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsQWN0aW9uKGNlbGwsIHJ1bGVzKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBjZWxsQWN0aW9uKGNlbGwsIHJ1bGVzKXtcbiAgICAgICAgdmFyIHN0YXRlO1xuICAgICAgICBpZiAodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIEJsb2NrSW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgc3RhdGUgPSBjZWxsLnBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgUHJvbW90b3JJbnRlcnByZXRlcil7XG4gICAgICAgICAgICBzdGF0ZSA9IGNlbGwucGxhbnQuZ2V0U3RhdGUoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcnVsZXMuZm9yRWFjaChmdW5jdGlvbihydWxlKXtcbiAgICAgICAgICAgIC8vIGV4ZWN1dGUgb25lIGFjdGlvbiB1c2luZyB0aGUgZmlyc3QgbWF0Y2hpbmcgcnVsZVxuICAgICAgICAgICAgLy8gaWYgKHJ1bGUubWF0Y2hlcyhzdGF0ZSkpe1xuICAgICAgICAgICAgaWYgKHJ1bGUubWF0Y2hlcyhzdGF0ZSkpe1xuICAgICAgICAgICAgICAgIHJ1bGUuYWN0aW9uLmV4ZWN1dGUoY2VsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBjZWxsLnVwZGF0ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgbXV0YXRlKCl7XG4gICAgICAgIHZhciBtdXRhdG9yID0gbmV3IE11dGF0b3IodGhpcy5wYXJhbXMubXV0X2ZhY3RvciwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2UsIFxuICAgICAgICAgICAgdGhpcy5wYXJhbXMubXV0X2luc2VydCwgdGhpcy5wYXJhbXMubXV0X2RlbGV0ZSwgXG4gICAgICAgICAgICAwLCB0aGlzLnBhcmFtcy5tdXRfcmVwbGFjZV9tb2RlLCB0aGlzLm11dF91bml0cyk7XG4gICAgICAgIHRoaXMud29ybGQucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgbXV0YXRvci5tdXRhdGUocGxhbnQuZ2Vub21lKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIGVhY2ggcGxhbnQncyBjdXJyZW50IGRlYXRoIHByb2JhYmlsaXR5IHRvIHNpbXVsYXRlXG4gICAgICogd2hldGhlciBlYWNoIHBsYW50IGRpZXMgb24gdGhpcyBzdGVwXG4gICAgICovXG4gICAgc2ltdWxhdGVEZWF0aCgpe1xuICAgICAgICB2YXIgZGVhZF9wbGFudHMgPSBbXTtcbiAgICAgICAgdGhpcy53b3JsZC5wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICB2YXIgZGVhdGhQcm9iID0gcGxhbnQuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3JcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAocmFuZG9tUHJvYihkZWF0aFByb2IucHJvYikpe1xuICAgICAgICAgICAgICAgIGRlYWRfcGxhbnRzLnB1c2gocGxhbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgZGVhZF9wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChwbGFudCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNpbXVsYXRlIGxpZ2h0LiBTdW5saWdodCB0cmF2ZXJzZXMgZnJvbSB0aGUgY2VpbGluZyBvZiB0aGUgd29ybGRcbiAgICAgKiBkb3dud2FyZHMgdmVydGljYWxseS4gSXQgaXMgY2F1Z2h0IGJ5IGEgcGxhbnQgY2VsbCB3aXRoIGEgcHJvYmFiaWxpdHlcbiAgICAgKiB3aGljaCBjYXVzZXMgdGhhdCBjZWxsIHRvIGJlIGVuZXJnaXNlZC5cbiAgICAgKi9cbiAgICBzaW11bGF0ZUxpZ2h0KCl7XG4gICAgICAgIGZvcih2YXIgeD0wOyB4PHRoaXMud29ybGQud2lkdGg7IHgrKyl7XG4gICAgICAgICAgICBmb3IodmFyIHk9MDsgeTx0aGlzLndvcmxkLmhlaWdodDsgeSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMud29ybGQuY2VsbHNbeF1bdGhpcy53b3JsZC5oZWlnaHQteS0xXTtcbiAgICAgICAgICAgICAgICBpZihjZWxsICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocmFuZG9tUHJvYih0aGlzLnBhcmFtcy5lbmVyZ3lfcHJvYikpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5lbmVyZ2lzZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc307IiwiaW1wb3J0IHtTaW11bGF0aW9uLCBTaW11bGF0aW9uUGFyYW1zfSBmcm9tIFwiLi9zaW11bGF0aW9uLmpzXCI7XG5pbXBvcnQge1NpbURhdGF9IGZyb20gXCIuL3NpbWRhdGEuanNcIjtcblxubGV0IHNpbXVsYXRpb24gPSBudWxsO1xubGV0IGRhdGEgPSBudWxsO1xubGV0IHJ1bm5pbmcgPSBmYWxzZTtcbmxldCBjZWxsU2l6ZSA9IDg7XG5jb25zdCBUQVJHRVRfRlBTID0gNjA7XG5jb25zdCBGUkFNRV9JTlRFUlZBTF9NUyA9IDEwMDAgLyBUQVJHRVRfRlBTO1xubGV0IGxhc3RGcmFtZVRpbWUgPSAwO1xuXG5zZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgY29uc3QgbXNnID0gZXZlbnQuZGF0YTtcbiAgICBzd2l0Y2ggKG1zZy50eXBlKSB7XG4gICAgY2FzZSBcImluaXRcIjpcbiAgICAgICAgaW5pdFNpbShtc2cucGFyYW1zLCBtc2cuZ2Vub21lcyB8fCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0YXJ0XCI6XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBsb29wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdG9wXCI6XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0ZXBcIjpcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBwdXNoU3RhdHMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImdldENlbGxcIjpcbiAgICAgICAgc2VuZENlbGxJbmZvKG1zZy54LCBtc2cueSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJkaXN0dXJiXCI6XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2UobXNnLnN0cmVuZ3RoKTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJraWxsQ2VsbFwiOlxuICAgICAgICBraWxsQ2VsbEF0KG1zZy54LCBtc2cueSk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwidXBkYXRlRGlzcGxheVBhcmFtc1wiOlxuICAgICAgICBpZiAoc2ltdWxhdGlvbiAmJiBzaW11bGF0aW9uLnBhcmFtcykge1xuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lID0gbXNnLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnJlY29yZF9pbnRlcnZhbCA9IG1zZy5yZWNvcmRfaW50ZXJ2YWw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImV4cG9ydFwiOlxuICAgICAgICBleHBvcnRHZW5vbWVzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGluaXRTaW0ocGFyYW1zLCBpbXBvcnRlZEdlbm9tZXM9bnVsbCkge1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBjb25zdCBzaW1fcGFyYW1zID0gbmV3IFNpbXVsYXRpb25QYXJhbXMocGFyYW1zKTtcbiAgICBjZWxsU2l6ZSA9IHBhcmFtcy5jZWxsU2l6ZSB8fCA4O1xuICAgIHNpbXVsYXRpb24gPSBuZXcgU2ltdWxhdGlvbihzaW1fcGFyYW1zKTtcbiAgICBkYXRhID0gbmV3IFNpbURhdGEoc2ltdWxhdGlvbik7XG4gICAgaWYgKGltcG9ydGVkR2Vub21lcyAmJiBpbXBvcnRlZEdlbm9tZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbl9mcm9tX2dlbm9tZXMoaW1wb3J0ZWRHZW5vbWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbigpO1xuICAgIH1cbiAgICBwdXNoRnJhbWUoKTtcbiAgICBwdXNoU3RhdHMoKTtcbn1cblxuZnVuY3Rpb24gbG9vcCgpIHtcbiAgICBpZiAoIXJ1bm5pbmcpIHJldHVybjtcblxuICAgIGNvbnN0IHNwZiA9IHNpbXVsYXRpb24ucGFyYW1zLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNwZjsgaSsrKSB7XG4gICAgICAgIGRvU3RlcCgpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgaWYgKG5vdyAtIGxhc3RGcmFtZVRpbWUgPj0gRlJBTUVfSU5URVJWQUxfTVMpIHtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIHB1c2hTdGF0cygpO1xuICAgICAgICBsYXN0RnJhbWVUaW1lID0gbm93O1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQobG9vcCwgMCk7XG59XG5cbmZ1bmN0aW9uIGRvU3RlcCgpIHtcbiAgICBzaW11bGF0aW9uLnN0ZXAoKTtcblxuICAgIC8vIFBlcmlvZGljIGRpc3R1cmJhbmNlXG4gICAgY29uc3QgZGkgPSBzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9pbnRlcnZhbDtcbiAgICBpZiAoZGkgPiAwICYmIHNpbXVsYXRpb24uc3RlcG51bSAlIGRpID09PSAwKSB7XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2Uoc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChzaW11bGF0aW9uLnN0ZXBudW0gJSBzaW11bGF0aW9uLnBhcmFtcy5yZWNvcmRfaW50ZXJ2YWwgPT09IDAgfHwgc2ltdWxhdGlvbi5zdGVwbnVtID09PSAxKSB7XG4gICAgICAgIGRhdGEucmVjb3JkU3RlcCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcHVzaFN0YXRzKCkge1xuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcInN0YXRzXCIsXG4gICAgICAgIGRhdGE6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YS5kYXRhKSksXG4gICAgICAgIHN0ZXBudW06IHNpbXVsYXRpb24uc3RlcG51bVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseURpc3R1cmJhbmNlKHN0cmVuZ3RoKSB7XG4gICAgY29uc3Qgd29ybGQgPSBzaW11bGF0aW9uLndvcmxkO1xuICAgIGNvbnN0IHBsYW50cyA9IHdvcmxkLnBsYW50cztcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGNvbnN0IG51bVRvS2lsbCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3Ioc3RyZW5ndGggKiBwbGFudHMubGVuZ3RoKSk7XG4gICAgLy8gU2h1ZmZsZSBhIHNhbXBsZSBhbmQga2lsbFxuICAgIGNvbnN0IHNodWZmbGVkID0gcGxhbnRzLnNsaWNlKCkuc29ydCgoKSA9PiBNYXRoLnJhbmRvbSgpIC0gMC41KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRvS2lsbCAmJiBpIDwgc2h1ZmZsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2hlY2sgcGxhbnQgc3RpbGwgYWxpdmUgKG5vdCBraWxsZWQgYnkgcHJldmlvdXMgaXRlcmF0aW9uKVxuICAgICAgICBpZiAod29ybGQucGxhbnRzLmluY2x1ZGVzKHNodWZmbGVkW2ldKSkge1xuICAgICAgICAgICAgd29ybGQua2lsbFBsYW50KHNodWZmbGVkW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24ga2lsbENlbGxBdCh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoY2VsbCAmJiBjZWxsLnBsYW50KSB7XG4gICAgICAgIHNpbXVsYXRpb24ud29ybGQua2lsbFBsYW50KGNlbGwucGxhbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZXhwb3J0R2Vub21lcygpIHtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgIHNpbXVsYXRpb24ud29ybGQucGxhbnRzLmZvckVhY2gocGxhbnQgPT4ge1xuICAgICAgICBzZWVuLmFkZChwbGFudC5nZW5vbWUuc2VyaWFsaXplKCkpO1xuICAgIH0pO1xuICAgIGNvbnN0IGdlbm9tZXMgPSBBcnJheS5mcm9tKHNlZW4pO1xuICAgIGNvbnN0IGV4cG9ydEJ1bmRsZSA9IHtcbiAgICAgICAgYWN0aW9uX21hcDogc2ltdWxhdGlvbi5wYXJhbXMuYWN0aW9uX21hcCxcbiAgICAgICAgZ2Vub21lX2ludGVycHJldGVyOiBzaW11bGF0aW9uLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIsXG4gICAgICAgIGdlbm9tZXNcbiAgICB9O1xuICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImV4cG9ydGVkR2Vub21lc1wiLCBidW5kbGU6IGV4cG9ydEJ1bmRsZSB9KTtcbn1cblxuZnVuY3Rpb24gcHVzaEZyYW1lKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpO1xuICAgIC8vIFRyYW5zZmVyIG93bmVyc2hpcCBvZiB0aGUgQXJyYXlCdWZmZXIgZm9yIHplcm8tY29weSBwZXJmb3JtYW5jZVxuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcImZyYW1lXCIsXG4gICAgICAgIGJ1ZmZlcjogcmVzdWx0LmJ1ZmZlci5idWZmZXIsXG4gICAgICAgIHdpZHRoOiByZXN1bHQud2lkdGgsXG4gICAgICAgIGhlaWdodDogcmVzdWx0LmhlaWdodCxcbiAgICAgICAgY2VsbENvdW50OiByZXN1bHQuY2VsbENvdW50LFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9LCBbcmVzdWx0LmJ1ZmZlci5idWZmZXJdKTtcbn1cblxuZnVuY3Rpb24gc2VuZENlbGxJbmZvKHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmICghY2VsbCB8fCAhY2VsbC5wbGFudCB8fCAhY2VsbC5wbGFudC5nZW5vbWUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBsYW50ID0gY2VsbC5wbGFudDtcbiAgICAgICAgY29uc3QgcnVsZXMgPSBzaW11bGF0aW9uLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUpO1xuXG4gICAgICAgIC8vIFVzZSB0aGUgY29ycmVjdCBzdGF0ZSBkZXBlbmRpbmcgb24gaW50ZXJwcmV0ZXIgdHlwZVxuICAgICAgICBsZXQgY2VsbFN0YXRlO1xuICAgICAgICBpZiAoc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyID09PSBcImJsb2NrXCIpIHtcbiAgICAgICAgICAgIGNlbGxTdGF0ZSA9IHBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsU3RhdGUgPSBwbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZWlnaGJvdXJob29kID0gcGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgY29uc3QgZW5lcmdpc2VkID0gY2VsbC5lbmVyZ2lzZWQ7XG5cbiAgICAgICAgLy8gU2VyaWFsaXplIHJ1bGVzIGFzIHN0cnVjdHVyZWQgb2JqZWN0cyBmb3IgcmljaCBVSSByZW5kZXJpbmdcbiAgICAgICAgY29uc3Qgc2VyaWFsaXplZFJ1bGVzID0gcnVsZXMubWFwKChyLCBpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gci5tYXRjaGVzKGNlbGxTdGF0ZSk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb25TdHIgPSByLmFjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgY29uc3QgaXNEaXYgPSBhY3Rpb25TdHIuc3RhcnRzV2l0aChcImRpdmlkZVwiKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyxcbiAgICAgICAgICAgICAgICBzdGF0ZTogci5zdGF0ZSxcbiAgICAgICAgICAgICAgICBlcU1hc2s6IHIuZXFNYXNrLFxuICAgICAgICAgICAgICAgIGFjdGlvblR5cGU6IGlzRGl2ID8gXCJkaXZpZGVcIiA6IGFjdGlvblN0cixcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGlzRGl2ID8gci5hY3Rpb24uZ2V0RGlyZWN0aW9uKCkgOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdSdWxlSW5kZXggPSBzZXJpYWxpemVkUnVsZXMuZmluZEluZGV4KHIgPT4gci5tYXRjaGVzKTtcblxuICAgICAgICBjb25zdCBkZWF0aCA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3JcbiAgICAgICAgKTtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiBcImNlbGxJbmZvXCIsXG4gICAgICAgICAgICBmb3VuZDogdHJ1ZSxcbiAgICAgICAgICAgIGNlbGxTdHI6IGNlbGwudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIG5laWdoYm91cmhvb2QsXG4gICAgICAgICAgICBlbmVyZ2lzZWQsXG4gICAgICAgICAgICBjZWxsU3RhdGUsXG4gICAgICAgICAgICBtYXRjaGluZ1J1bGVJbmRleCxcbiAgICAgICAgICAgIGRlYXRoOiBKU09OLnN0cmluZ2lmeShkZWF0aCksXG4gICAgICAgICAgICBnZW5vbWVMZW5ndGg6IHBsYW50Lmdlbm9tZS5sZW5ndGgsXG4gICAgICAgICAgICBtdXRFeHA6IHBsYW50Lmdlbm9tZS5tdXRfZXhwLFxuICAgICAgICAgICAgcnVsZXM6IHNlcmlhbGl6ZWRSdWxlcyxcbiAgICAgICAgICAgIGludGVycHJldGVyVHlwZTogc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyLFxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQge3JhbmRvbUludH0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1BsYW50fSBmcm9tIFwiLi9wbGFudC5qc1wiO1xuaW1wb3J0IHsgQ2VsbCB9IGZyb20gXCIuL2NlbGwuanNcIjtcblxuY2xhc3MgV29ybGQge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMuY2VsbHMgPSBbXTtcbiAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgd29ybGQgbGF0dGljZSB0byBhbGwgbnVsbHNcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy53aWR0aDsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMuY2VsbHMucHVzaChbXSk7XG4gICAgICAgICAgICBmb3IodmFyIGo9MDsgajx0aGlzLmhlaWdodDsgaisrKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2ldW2pdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxhbnRzID0gW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMgYXJyYXkgb2YgeCBwb3NpdGlvbnMgYXQgeT0wIHdoZXJlIG5vIGNlbGwgZXhpc3RzXG4gICAgICovXG4gICAgZ2V0Rmxvb3JTcGFjZSgpe1xuICAgICAgICB2YXIgZW1wdHlTcGFjZXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy53aWR0aDsgaSsrKXtcbiAgICAgICAgICAgIGlmKHRoaXMuY2VsbHNbaV1bMF0gPT09IG51bGwpe1xuICAgICAgICAgICAgICAgIGVtcHR5U3BhY2VzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVtcHR5U3BhY2VzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0cmF0ZWdpZXMgZm9yIHNvd2luZyBhIHNlZWQgb24gdGhlIHdvcmxkIGZsb29yXG4gICAgICogQHBhcmFtIHsqfSBnZW5vbWUgdGhlIGdlbm9tZSB1c2VkIGJ5IHRoZSBuZXcgc2VlZFxuICAgICAqIEBwYXJhbSB7Kn0gbmVhclggaWYgbm90IG51bGwsIHRyeSB0byBzb3cgYSBzZWVkIGFzIGNsb3NlXG4gICAgICogYXMgcG9zc2libGUgdG8gdGhpcyBsb2NhdGlvblxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiBhIHNlZWQgd2FzIHN1Y2Nlc2Z1bGx5IHBsYW50ZWQsIGZhbHNlIGlmXG4gICAgICogdGhlcmUgd2FzIG5vIHNwYWNlIHRvIHNvdyBhIHNlZWQuXG4gICAgICovXG4gICAgc2VlZChnZW5vbWUsIG5lYXJYKXtcbiAgICAgICAgLy8gZmluZCBhIHJhbmRvbSBlbXB0eSBzcGFjZVxuICAgICAgICB2YXIgZW1wdHlTcGFjZXMgPSB0aGlzLmdldEZsb29yU3BhY2UoKTtcbiAgICAgICAgaWYoZW1wdHlTcGFjZXMubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5lYXJYICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RYID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0X2RpZmYgPSB0aGlzLndpZHRoO1xuICAgICAgICAgICAgZW1wdHlTcGFjZXMuZm9yRWFjaChmdW5jdGlvbih4cG9zKXtcbiAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IE1hdGguYWJzKG5lYXJYLXhwb3MpO1xuICAgICAgICAgICAgICAgIGlmKGRpZmYgPCBuZWFyZXN0X2RpZmYpe1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0X2RpZmYgPSBkaWZmO1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0WCA9IHhwb3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnNvd1BsYW50KGdlbm9tZSwgbmVhcmVzdFgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeCA9IGVtcHR5U3BhY2VzW3JhbmRvbUludCgwLCBlbXB0eVNwYWNlcy5sZW5ndGgtMSldO1xuICAgICAgICBpZiAodGhpcy5jZWxsc1t4XVswXSAhPT0gbnVsbCl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTcGFjZSBpcyB0YWtlblwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNvd1BsYW50KGdlbm9tZSwgeCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHNvd1BsYW50KGdlbm9tZSwgeCl7XG4gICAgICAgIHggPSB0aGlzLmdldFgoeCk7XG4gICAgICAgIHZhciBwbGFudCA9IG5ldyBQbGFudCh4LCB0aGlzLCBnZW5vbWUpO1xuICAgICAgICB0aGlzLnBsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgdGhpcy5hZGRDZWxsKHBsYW50LmNlbGxzWzBdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgcGxhbnQgZnJvbSB3b3JsZCBwbGFudCBsaXN0LlxuICAgICAqIFJlbW92ZSBhbGwgY2VsbHMgZnJvbSBjZWxsIGdyaWRcbiAgICAgKi9cbiAgICBraWxsUGxhbnQocGxhbnQpe1xuICAgICAgICB0aGlzLnBsYW50cy5zcGxpY2UodGhpcy5wbGFudHMuaW5kZXhPZihwbGFudCksIDEpO1xuICAgICAgICBwbGFudC5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgdGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gPSBudWxsO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBnZXRYKHgpe1xuICAgICAgICBpZih4IDwgMCl7XG4gICAgICAgICAgICB4ID0gdGhpcy53aWR0aCArIHg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggJSB0aGlzLndpZHRoO1xuICAgIH1cblxuICAgIGdldENlbGwoeCwgeSl7XG4gICAgICAgIHJldHVybiB0aGlzLmNlbGxzW3RoaXMuZ2V0WCh4KV1beV07XG4gICAgfVxuXG4gICAgYWRkQ2VsbChjZWxsKXtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldID0gY2VsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFBpeGVsQnVmZmVyKGNlbGxTaXplKXtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMud2lkdGggKiBjZWxsU2l6ZTtcbiAgICAgICAgY29uc3QgaCA9IHRoaXMuaGVpZ2h0ICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OENsYW1wZWRBcnJheSh3ICogaCAqIDQpOyAvLyBSR0JBLCBpbml0aWFsaXplZCB0byAwICh0cmFuc3BhcmVudC9ibGFjaylcblxuICAgICAgICB0aGlzLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIGNvbnN0IFtiYXNlUiwgYmFzZUcsIGJhc2VCXSA9IHRoaXMuZ2V0QmFzZUNvbG91cihwbGFudCk7XG4gICAgICAgICAgICBwbGFudC5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbCA9IGNlbGwuZW5lcmdpc2VkXG4gICAgICAgICAgICAgICAgICAgID8gW2Jhc2VSLCBiYXNlRywgYmFzZUJdXG4gICAgICAgICAgICAgICAgICAgIDogW01hdGgucm91bmQoYmFzZVIgKiAwLjcpLCBNYXRoLnJvdW5kKGJhc2VHICogMC43KSwgTWF0aC5yb3VuZChiYXNlQiAqIDAuNyldO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcHgwID0gY2VsbC54ICogY2VsbFNpemU7XG4gICAgICAgICAgICAgICAgLy8gd29ybGQgeT0wIGlzIGdyb3VuZCAoYm90dG9tKSwgY2FudmFzIHk9MCBpcyB0b3BcbiAgICAgICAgICAgICAgICBjb25zdCBweTAgPSAodGhpcy5oZWlnaHQgLSAxIC0gY2VsbC55KSAqIGNlbGxTaXplO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZHkgPSAwOyBkeSA8IGNlbGxTaXplOyBkeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGR4ID0gMDsgZHggPCBjZWxsU2l6ZTsgZHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRHJhdyAxcHggYm9yZGVyOiBkYXJrZW4gZWRnZSBwaXhlbHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQm9yZGVyID0gZHggPT09IDAgfHwgZHkgPT09IDAgfHwgZHggPT09IGNlbGxTaXplIC0gMSB8fCBkeSA9PT0gY2VsbFNpemUgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW3IsIGcsIGJdID0gaXNCb3JkZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFtNYXRoLnJvdW5kKGNvbFswXSAqIDAuNSksIE1hdGgucm91bmQoY29sWzFdICogMC41KSwgTWF0aC5yb3VuZChjb2xbMl0gKiAwLjUpXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogY29sO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaWR4ID0gKChweTAgKyBkeSkgKiB3ICsgKHB4MCArIGR4KSkgKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeF0gICAgID0gcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAxXSA9IGc7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMl0gPSBiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDNdID0gMjU1O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiB7IGJ1ZmZlcjogYnVmLCB3aWR0aDogdywgaGVpZ2h0OiBoLCBjZWxsQ291bnQ6IHRoaXMucGxhbnRzLnJlZHVjZSgocyxwKT0+cytwLmNlbGxzLmxlbmd0aCwwKSB9O1xuICAgIH1cblxuICAgIGdldEJhc2VDb2xvdXIocGxhbnQpe1xuICAgICAgICB2YXIgaSA9IHBsYW50LmNlbGxzWzBdLnggJSBjU2NhbGUubGVuZ3RoO1xuICAgICAgICByZXR1cm4gY1NjYWxlW2ldO1xuICAgIH1cbn1cblxuLy8gaHR0cDovL2NvbG9yYnJld2VyMi5vcmcvP3R5cGU9cXVhbGl0YXRpdmUmc2NoZW1lPVNldDMmbj04IOKAlCBhcyByYXcgW1IsRyxCXSB0dXBsZXNcbnZhciBjU2NhbGUgPSBbXG4gICAgWzE0MSwyMTEsMTk5XSxbMjU1LDI1NSwxNzldLFsxOTAsMTg2LDIxOF0sWzI1MSwxMjgsMTE0XSxcbiAgICBbMTI4LDE3NywyMTFdLFsyNTMsMTgwLDk4XSxbMTc5LDIyMiwxMDVdLFsyNTIsMjA1LDIyOV1cbl07XG5cblxuZXhwb3J0IHsgV29ybGQgfTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdGlkOiBtb2R1bGVJZCxcblx0XHRsb2FkZWQ6IGZhbHNlLFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuXHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4vLyB0aGUgc3RhcnR1cCBmdW5jdGlvblxuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcblx0Ly8gVGhpcyBlbnRyeSBtb2R1bGUgZGVwZW5kcyBvbiBvdGhlciBsb2FkZWQgY2h1bmtzIGFuZCBleGVjdXRpb24gbmVlZCB0byBiZSBkZWxheWVkXG5cdHZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKHVuZGVmaW5lZCwgW1widmVuZG9ycy1ub2RlX21vZHVsZXNfc2VlZHJhbmRvbV9pbmRleF9qcy1ub2RlX21vZHVsZXNfc3RhdHMtbGl0ZV9zdGF0c19qc1wiXSwgKCkgPT4gKF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9zaW11bGF0aW9uLndvcmtlci5qc1wiKSkpXG5cdF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8oX193ZWJwYWNrX2V4cG9ydHNfXyk7XG5cdHJldHVybiBfX3dlYnBhY2tfZXhwb3J0c19fO1xufTtcblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5hbWREID0gZnVuY3Rpb24gKCkge1xuXHR0aHJvdyBuZXcgRXJyb3IoJ2RlZmluZSBjYW5ub3QgYmUgdXNlZCBpbmRpcmVjdCcpO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmFtZE8gPSB7fTsiLCJ2YXIgZGVmZXJyZWQgPSBbXTtcbl9fd2VicGFja19yZXF1aXJlX18uTyA9IChyZXN1bHQsIGNodW5rSWRzLCBmbiwgcHJpb3JpdHkpID0+IHtcblx0aWYoY2h1bmtJZHMpIHtcblx0XHRwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG5cdFx0Zm9yKHZhciBpID0gZGVmZXJyZWQubGVuZ3RoOyBpID4gMCAmJiBkZWZlcnJlZFtpIC0gMV1bMl0gPiBwcmlvcml0eTsgaS0tKSBkZWZlcnJlZFtpXSA9IGRlZmVycmVkW2kgLSAxXTtcblx0XHRkZWZlcnJlZFtpXSA9IFtjaHVua0lkcywgZm4sIHByaW9yaXR5XTtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIG5vdEZ1bGZpbGxlZCA9IEluZmluaXR5O1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGRlZmVycmVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIFtjaHVua0lkcywgZm4sIHByaW9yaXR5XSA9IGRlZmVycmVkW2ldO1xuXHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgY2h1bmtJZHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdGlmICgocHJpb3JpdHkgJiAxID09PSAwIHx8IG5vdEZ1bGZpbGxlZCA+PSBwcmlvcml0eSkgJiYgT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5PKS5ldmVyeSgoa2V5KSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXy5PW2tleV0oY2h1bmtJZHNbal0pKSkpIHtcblx0XHRcdFx0Y2h1bmtJZHMuc3BsaWNlKGotLSwgMSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmdWxmaWxsZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYocHJpb3JpdHkgPCBub3RGdWxmaWxsZWQpIG5vdEZ1bGZpbGxlZCA9IHByaW9yaXR5O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZihmdWxmaWxsZWQpIHtcblx0XHRcdGRlZmVycmVkLnNwbGljZShpLS0sIDEpXG5cdFx0XHR2YXIgciA9IGZuKCk7XG5cdFx0XHRpZiAociAhPT0gdW5kZWZpbmVkKSByZXN1bHQgPSByO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmYgPSB7fTtcbi8vIFRoaXMgZmlsZSBjb250YWlucyBvbmx5IHRoZSBlbnRyeSBjaHVuay5cbi8vIFRoZSBjaHVuayBsb2FkaW5nIGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIGNodW5rc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5lID0gKGNodW5rSWQpID0+IHtcblx0cmV0dXJuIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uZikucmVkdWNlKChwcm9taXNlcywga2V5KSA9PiB7XG5cdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mW2tleV0oY2h1bmtJZCwgcHJvbWlzZXMpO1xuXHRcdHJldHVybiBwcm9taXNlcztcblx0fSwgW10pKTtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzIGFuZCBjaHVua3MgdGhhdCB0aGUgZW50cnlwb2ludCBkZXBlbmRzIG9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnUgPSAoY2h1bmtJZCkgPT4ge1xuXHQvLyByZXR1cm4gdXJsIGZvciBmaWxlbmFtZXMgYmFzZWQgb24gdGVtcGxhdGVcblx0cmV0dXJuIFwiXCIgKyBjaHVua0lkICsgXCIuYnVuZGxlLmpzXCI7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubm1kID0gKG1vZHVsZSkgPT4ge1xuXHRtb2R1bGUucGF0aHMgPSBbXTtcblx0aWYgKCFtb2R1bGUuY2hpbGRyZW4pIG1vZHVsZS5jaGlsZHJlbiA9IFtdO1xuXHRyZXR1cm4gbW9kdWxlO1xufTsiLCJ2YXIgc2NyaXB0VXJsO1xuaWYgKF9fd2VicGFja19yZXF1aXJlX18uZy5pbXBvcnRTY3JpcHRzKSBzY3JpcHRVcmwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcubG9jYXRpb24gKyBcIlwiO1xudmFyIGRvY3VtZW50ID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmRvY3VtZW50O1xuaWYgKCFzY3JpcHRVcmwgJiYgZG9jdW1lbnQpIHtcblx0aWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgJiYgZG9jdW1lbnQuY3VycmVudFNjcmlwdC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdTQ1JJUFQnKVxuXHRcdHNjcmlwdFVybCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuXHRpZiAoIXNjcmlwdFVybCkge1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG5cdFx0aWYoc2NyaXB0cy5sZW5ndGgpIHtcblx0XHRcdHZhciBpID0gc2NyaXB0cy5sZW5ndGggLSAxO1xuXHRcdFx0d2hpbGUgKGkgPiAtMSAmJiAoIXNjcmlwdFVybCB8fCAhL15odHRwKHM/KTovLnRlc3Qoc2NyaXB0VXJsKSkpIHNjcmlwdFVybCA9IHNjcmlwdHNbaS0tXS5zcmM7XG5cdFx0fVxuXHR9XG59XG4vLyBXaGVuIHN1cHBvcnRpbmcgYnJvd3NlcnMgd2hlcmUgYW4gYXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCB5b3UgbXVzdCBzcGVjaWZ5IGFuIG91dHB1dC5wdWJsaWNQYXRoIG1hbnVhbGx5IHZpYSBjb25maWd1cmF0aW9uXG4vLyBvciBwYXNzIGFuIGVtcHR5IHN0cmluZyAoXCJcIikgYW5kIHNldCB0aGUgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gdmFyaWFibGUgZnJvbSB5b3VyIGNvZGUgdG8gdXNlIHlvdXIgb3duIGxvZ2ljLlxuaWYgKCFzY3JpcHRVcmwpIHRocm93IG5ldyBFcnJvcihcIkF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xuc2NyaXB0VXJsID0gc2NyaXB0VXJsLnJlcGxhY2UoL15ibG9iOi8sIFwiXCIpLnJlcGxhY2UoLyMuKiQvLCBcIlwiKS5yZXBsYWNlKC9cXD8uKiQvLCBcIlwiKS5yZXBsYWNlKC9cXC9bXlxcL10rJC8sIFwiL1wiKTtcbl9fd2VicGFja19yZXF1aXJlX18ucCA9IHNjcmlwdFVybDsiLCIvLyBubyBiYXNlVVJJXG5cbi8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgY2h1bmtzXG4vLyBcIjFcIiBtZWFucyBcImFscmVhZHkgbG9hZGVkXCJcbnZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG5cdFwic3JjX3NpbXVsYXRpb25fd29ya2VyX2pzXCI6IDFcbn07XG5cbi8vIGltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZ1xudmFyIGluc3RhbGxDaHVuayA9IChkYXRhKSA9PiB7XG5cdHZhciBbY2h1bmtJZHMsIG1vcmVNb2R1bGVzLCBydW50aW1lXSA9IGRhdGE7XG5cdGZvcih2YXIgbW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8obW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcblx0XHR9XG5cdH1cblx0aWYocnVudGltZSkgcnVudGltZShfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblx0d2hpbGUoY2h1bmtJZHMubGVuZ3RoKVxuXHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkcy5wb3AoKV0gPSAxO1xuXHRwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbihkYXRhKTtcbn07XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmYuaSA9IChjaHVua0lkLCBwcm9taXNlcykgPT4ge1xuXHQvLyBcIjFcIiBpcyB0aGUgc2lnbmFsIGZvciBcImFscmVhZHkgbG9hZGVkXCJcblx0aWYoIWluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdGlmKHRydWUpIHsgLy8gYWxsIGNodW5rcyBoYXZlIEpTXG5cdFx0XHRpbXBvcnRTY3JpcHRzKF9fd2VicGFja19yZXF1aXJlX18ucCArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSk7XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgY2h1bmtMb2FkaW5nR2xvYmFsID0gc2VsZltcIndlYnBhY2tDaHVua2xpbmRldm9sXCJdID0gc2VsZltcIndlYnBhY2tDaHVua2xpbmRldm9sXCJdIHx8IFtdO1xudmFyIHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uID0gY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2guYmluZChjaHVua0xvYWRpbmdHbG9iYWwpO1xuY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2ggPSBpbnN0YWxsQ2h1bms7XG5cbi8vIG5vIEhNUlxuXG4vLyBubyBITVIgbWFuaWZlc3QiLCJ2YXIgbmV4dCA9IF9fd2VicGFja19yZXF1aXJlX18ueDtcbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18uZShcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3NlZWRyYW5kb21faW5kZXhfanMtbm9kZV9tb2R1bGVzX3N0YXRzLWxpdGVfc3RhdHNfanNcIikudGhlbihuZXh0KTtcbn07IiwiIiwiLy8gcnVuIHN0YXJ0dXBcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy54KCk7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=