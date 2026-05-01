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
        let mutated = false;
        if(this.mProb(this.pR, genome.mut_exp)){
            this.replace(genome);
            mutated = true;
        }
        if(this.mProb(this.pI, genome.mut_exp)){
            this.insert(genome);
            mutated = true;
        }
        if(this.mProb(this.pD, genome.mut_exp)){
            this.delete(genome);
            mutated = true;
        }
        return mutated;
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
            genome[i] = genome[i] ^ (1 << (0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, 7));
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
            var actionCode = gene[gene.length-1] & ((1 << 6) - 1);
            var action = this.mapping.getAction(actionCode);
            
            // take information from operators to create state mask
            var mask = 0;
            var eqMask = 0; // specified which bits contribute to the state mask
            for(var i=1; i<gene.length-1; i++) {
                // 4 least sig bits determine the mask index
                var maskBit = gene[i] & ((1 << 4) - 1);

                // determines if the mask at this index is set to 1 or 0
                var bitState = (gene[i] & (1 << 4)) >> 4;
                mask += (1 << maskBit) * bitState;

                eqMask += (1 << maskBit);
            }
            rules.push(new Rule(eqMask, mask, action));
        }, this);
        return rules;
    }
}

function bitSet(byte, i){
    return (byte >> i) & 1;
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
        this.rules = null; // cached rules
        this.leanoverEnergised = 0; // Incremental tracking
    }

    getNeighbourhood(cell){
        // Return the neighbourhood mask
        var mask = 0;
        for(var i=0; i<_actions_js__WEBPACK_IMPORTED_MODULE_2__.NEIGHBOURHOOD.length; i++){
            var pos = _actions_js__WEBPACK_IMPORTED_MODULE_2__.NEIGHBOURHOOD[i];
            var x = cell.x + pos[0];
            var y = cell.y + pos[1];
            
            // Bounds check instead of try-catch
            if (x >= 0 && x < this.world.width && y >= 0 && y < this.world.height) {
                var worldPos = this.world.cells[x][y];
                if (worldPos instanceof _cell_js__WEBPACK_IMPORTED_MODULE_1__.Cell){
                    mask = mask | (1 << i);
                }
            }
        }
        return mask;
    }

    getState(cell){
        return this.getNeighbourhood(cell) | cell.internalState | (( cell.energised ? 1 : 0) << 15);
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
        
        // Update incremental tracking
        const rootCell = this.cells[0];
        const le = this.world.width/2 - ( (( 1.5*this.world.width ) + new_cell.x - rootCell.x)  % this.world.width);
        this.leanoverEnergised += le;

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
        
        var leanoverCells = 2/(numCells*(numCells-1));
        if (leanoverCells === Infinity){
            leanoverCells = 0;
        }

        var leanoverTerm = leanoverCells*Math.abs(this.leanoverEnergised);
        
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
        for (let i = 0; i < this.world.plants.length; i++) {
            const plant = this.world.plants[i];
            if (!plant.rules) {
                plant.rules = this.genomeInterpreter.interpret(plant.genome);
            }
            const rules = plant.rules;
            for (let j = 0; j < plant.cells.length; j++) {
                this.cellAction(plant.cells[j], rules);
            }
        }
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
        for (let i = 0; i < this.world.plants.length; i++) {
            const plant = this.world.plants[i];
            if (mutator.mutate(plant.genome)) {
                plant.rules = null; // Invalidate cache
            }
        }
    }

    /**
     * Use each plant's current death probability to simulate
     * whether each plant dies on this step
     */
    simulateDeath(){
        const dead_plants = [];
        const plants = this.world.plants;
        for (let i = 0; i < plants.length; i++) {
            const plant = plants[i];
            const deathProb = plant.getDeathProbability(
                this.params.death_factor,
                this.params.natural_exp,
                this.params.energy_exp,
                this.params.leanover_factor
            );
            if ((0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomProb)(deathProb.prob)){
                dead_plants.push(plant);
            }
        }
        for (let i = 0; i < dead_plants.length; i++) {
            this.world.killPlant(dead_plants[i]);
        }
    }

    /**
     * Simulate light. Sunlight traverses from the ceiling of the world
     * downwards vertically. It is caught by a plant cell with a probability
     * which causes that cell to be energised.
     */
    simulateLight(){
        const colTops = new Int16Array(this.world.width).fill(-1);
        const plants = this.world.plants;
        for (let i = 0; i < plants.length; i++) {
            const cells = plants[i].cells;
            for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                if (cell.y > colTops[cell.x]) {
                    colTops[cell.x] = cell.y;
                }
            }
        }

        for(let x=0; x<this.world.width; x++){
            const topY = colTops[x];
            if (topY === -1) continue;

            for(let y=topY; y>=0; y--){
                const cell = this.world.cells[x][y];
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
let cellSize = 2;
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
        this.cellCount = 0;
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
        const idx = this.plants.indexOf(plant);
        if (idx > -1) {
            this.plants.splice(idx, 1);
            this.cellCount -= plant.cells.length;
            for (let i = 0; i < plant.cells.length; i++) {
                const cell = plant.cells[i];
                this.cells[cell.x][cell.y] = null;
            }
        }
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
            this.cellCount++;
        }
    }

    getPixelBuffer(cellSize){
        const w = this.width * cellSize;
        const h = this.height * cellSize;
        const buf = new Uint8ClampedArray(w * h * 4);
        const plants = this.plants;

        for (let i = 0; i < plants.length; i++) {
            const plant = plants[i];
            const [baseR, baseG, baseB] = this.getBaseColour(plant);
            const darkR = Math.round(baseR * 0.7);
            const darkG = Math.round(baseG * 0.7);
            const darkB = Math.round(baseB * 0.7);
            
            const cells = plant.cells;
            for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                const r0 = cell.energised ? baseR : darkR;
                const g0 = cell.energised ? baseG : darkG;
                const b0 = cell.energised ? baseB : darkB;
                
                const px0 = cell.x * cellSize;
                const py0 = (this.height - 1 - cell.y) * cellSize;

                for (let dy = 0; dy < cellSize; dy++) {
                    const rowIdx = (py0 + dy) * w;
                    for (let dx = 0; dx < cellSize; dx++) {
                        const isBorder = cellSize > 1 && (dx === 0 || dy === 0 || dx === cellSize - 1 || dy === cellSize - 1);
                        const idx = (rowIdx + px0 + dx) * 4;
                        
                        if (isBorder) {
                            buf[idx]     = Math.round(r0 * 0.5);
                            buf[idx + 1] = Math.round(g0 * 0.5);
                            buf[idx + 2] = Math.round(b0 * 0.5);
                        } else {
                            buf[idx]     = r0;
                            buf[idx + 1] = g0;
                            buf[idx + 2] = b0;
                        }
                        buf[idx + 3] = 255;
                    }
                }
            }
        }

        return { buffer: buf, width: w, height: h, cellCount: this.cellCount };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Qjs7Ozs7V0NwQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7VUVIQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbGluZGV2b2wvaWdub3JlZHwvVXNlcnMvbWF0dC9saW5kZXZvbC1qcy9ub2RlX21vZHVsZXMvc2VlZHJhbmRvbXxjcnlwdG8iLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvYWN0aW9ucy5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9jZWxsLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2dlbm9tZS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9wbGFudC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9yYW5kb20uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltZGF0YS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW11bGF0aW9uLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3dvcmxkLmpzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9hbWQgZGVmaW5lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9hbWQgb3B0aW9ucyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvY2h1bmsgbG9hZGVkIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZW5zdXJlIGNodW5rIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbm9kZSBtb2R1bGUgZGVjb3JhdG9yIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9pbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3N0YXJ0dXAgY2h1bmsgZGVwZW5kZW5jaWVzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiAoaWdub3JlZCkgKi8iLCJjb25zdCBORUlHSEJPVVJIT09EID0gW1stMSwtMV0sIFswLC0xXSwgWzEsLTFdLCBbLTEsMF0sIFsxLDBdLCBbLTEsMV0sIFswLDFdLCBbMSwxXV07XG5jb25zdCBNVVRfSU5DUkVNRU5UID0gMC4wMDE7XG5cbmNsYXNzIEFjdGlvbntcbiAgICBjb25zdHJ1Y3RvcihhY3Rpb25Db2RlKXtcbiAgICAgICAgdGhpcy5jb2RlID0gYWN0aW9uQ29kZTtcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1zKCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGV4ZWN1dGUoY2VsbCl7XG4gICAgICAgIC8vIGFjdGlvbnMgYXJlIHR5cGljYWxseSBvbmx5IGNhcnJpZWQgb3V0IGlmIHRoZSBjZWxsIGhhcyBlbmVyZ3lcbiAgICAgICAgLy8gYW5kIHRoZSBjZWxsIGxvc2VzIGVuZXJneSBhcyBhIHJlc3VsdC5cbiAgICAgICAgaWYgKGNlbGwuZW5lcmdpc2VkKXtcbiAgICAgICAgICAgIHZhciBzdWNjZXNzID0gdGhpcy5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gIXN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgZG9BY3Rpb24oY2VsbCl7XG5cbiAgICB9XG59XG5cbmNsYXNzIERpdmlkZSBleHRlbmRzIEFjdGlvbntcblxuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICAvLyB0aGUgMiBsZWFzdCBzaWduaWZpY2FudCBiaXRzIG9mIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAvLyBkZXRlcm1pbmVzIHdoaWNoIGRpcmVjdGlvbiB0aGUgZGl2aWRlIGFjdGlvbiBpcyBmb3JcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLmdldERpcmVjdGlvbigpO1xuICAgICAgICBjZWxsLnBsYW50Lmdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1zKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERpcmVjdGlvbigpO1xuICAgIH1cblxuICAgIGdldERpcmVjdGlvbigpe1xuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcbiAgICAgICAgLy8gJiB3aXRoIDAwMDAwMTExIHRvIG1hc2sgb3V0IGxlYXN0IHNpZyBiaXRzXG4gICAgICAgIHZhciBkaXJlY3Rpb25Db2RlID0gdGhpcy5jb2RlICYgNztcbiAgICAgICAgcmV0dXJuIE5FSUdIQk9VUkhPT0RbZGlyZWN0aW9uQ29kZV07XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBkaXZpZGUgJHt0aGlzLmdldERpcmVjdGlvbigpfWA7XG4gICAgfVxufVxuXG5jbGFzcyBNdXRhdGVQbHVzIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgY2VsbC5wbGFudC5nZW5vbWUubXV0X2V4cCArPSBNVVRfSU5DUkVNRU5UO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJtdXQrXCI7XG4gICAgfVxufVxuXG5jbGFzcyBNdXRhdGVNaW51cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgLT0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0LVwiO1xuICAgIH1cbn1cblxuY2xhc3MgRmx5aW5nU2VlZCBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIHJldHVybiBjZWxsLnBsYW50LndvcmxkLnNlZWQoY2VsbC5wbGFudC5nZW5vbWUuY29weSgpKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJmbHlpbmdzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBMb2NhbFNlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSwgY2VsbC54KTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJsb2NhbHNlZWRcIjtcbiAgICB9XG59XG5cbmNsYXNzIFN0YXRlQml0TiBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKSB7XG4gICAgICAgIGNlbGwubmV4dEludGVybmFsU3RhdGUgPSBjZWxsLm5leHRJbnRlcm5hbFN0YXRlICYgTWF0aC5wb3coMiwgdGhpcy5nZXROdGhCaXQoKSk7XG4gICAgICAgIC8vIHRoaXMgYWN0aW9uIGRvZXMgbm90IGNvbnN1bWUgZW5lcmd5XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXROdGhCaXQoKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMTExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICByZXR1cm4gdGhpcy5jb2RlICYgMTU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBTdGF0ZUJpdCAke3RoaXMuZ2V0TnRoQml0KCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIEFjdGlvbk1hcCB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nLCBjb2RlUmFuZ2U9MjU2KXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbWFwcGluZztcbiAgICAgICAgdGhpcy5jb2RlUmFuZ2UgPSBjb2RlUmFuZ2U7XG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IFtEaXZpZGUsIEZseWluZ1NlZWQsIExvY2FsU2VlZCwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIFN0YXRlQml0Tl07XG4gICAgfVxuXG4gICAgZ2V0QWN0aW9uKGFjdGlvbkNvZGUpe1xuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGFjdGlvbiBjb2RlIGludG8gdGhlIFswLCBzdW0pIHJhbmdlIHNvIHdlaWdodHMgY2FuIGJlXG4gICAgICAgIC8vIGFueSBwb3NpdGl2ZSBpbnRlZ2VycyByYXRoZXIgdGhhbiBuZWVkaW5nIHRvIHN1bSB0byBjb2RlUmFuZ2UuXG4gICAgICAgIGNvbnN0IHN1bSA9IHRoaXMubWFwcGluZy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZENvZGUgPSBNYXRoLmZsb29yKChhY3Rpb25Db2RlIC8gdGhpcy5jb2RlUmFuZ2UpICogc3VtKTtcbiAgICAgICAgdmFyIG1hcHBpbmdDb3VudCA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubWFwcGluZy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBtYXBwaW5nQ291bnQgKz0gdGhpcy5tYXBwaW5nW2ldO1xuICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRDb2RlIDwgbWFwcGluZ0NvdW50KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1tpXShhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBGYWxsYmFjayBmb3IgZmxvYXRpbmctcG9pbnQgZWRnZSBjYXNlc1xuICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1t0aGlzLm1hcHBpbmcubGVuZ3RoIC0gMV0oYWN0aW9uQ29kZSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7RGl2aWRlLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgTG9jYWxTZWVkLCBGbHlpbmdTZWVkLCBBY3Rpb25NYXAsIE5FSUdIQk9VUkhPT0R9OyIsIlxuY2xhc3MgQ2VsbHtcbiAgICBjb25zdHJ1Y3RvcihwbGFudCwgeCwgeSl7XG4gICAgICAgIHRoaXMucGxhbnQgPSBwbGFudDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGdldCBlbmVyZ2lzZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmVyZ2lzZWQ7XG4gICAgfVxuXG4gICAgc2V0IGVuZXJnaXNlZCh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fZW5lcmdpc2VkID09PSB2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucGxhbnQpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoKXtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgsIHgsIHksIHNpemUsIGNvbG91cil7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvdXI7XG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgLy9jdHguc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYENlbGwgYXQgKCR7dGhpcy54fSwgJHt0aGlzLnl9KSBlbmVyZ3k6ICR7dGhpcy5lbmVyZ2lzZWR9YDtcbiAgICB9XG59XG5cbmV4cG9ydCB7Q2VsbH07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtBY3Rpb25NYXB9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgQnl0ZUFycmF5IGV4dGVuZHMgQXJyYXl7XG5cbiAgICBjb25zdHJ1Y3RvcihsZW5ndGg9MCwgaW5pdGlhbF9tdXRfZXhwPTApe1xuICAgICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgICB0aGlzLm11dF9leHAgPSBpbml0aWFsX211dF9leHA7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb20oYXJyLCBtdXRfZXhwPTApe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGFyci5sZW5ndGgsIG11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gYXJyW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXJpYWxpemUgdGhpcyBnZW5vbWUgdG8gYSBzdHJpbmc6IFwiPG11dF9leHA+OzxieXRlMD4sPGJ5dGUxPiwuLi5cIlxuICAgICAqL1xuICAgIHNlcmlhbGl6ZSgpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5tdXRfZXhwfTske0FycmF5LmZyb20odGhpcykuam9pbihcIixcIil9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXNlcmlhbGl6ZSBhIGdlbm9tZSBzdHJpbmcgcHJvZHVjZWQgYnkgc2VyaWFsaXplKCkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm5zIHtCeXRlQXJyYXl9XG4gICAgICovXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKHN0cil7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gc3RyLnRyaW0oKS5zcGxpdChcIjtcIik7XG4gICAgICAgIGNvbnN0IG11dF9leHAgPSBwYXJzZUZsb2F0KHBhcnRzWzBdKTtcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBwYXJ0c1sxXS5zcGxpdChcIixcIikubWFwKE51bWJlcik7XG4gICAgICAgIHJldHVybiBCeXRlQXJyYXkuZnJvbShieXRlcywgbXV0X2V4cCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJhbmRvbShsZW5ndGgpe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSByYW5kb21JbnQoMCwgMjU1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgY29weSgpe1xuICAgICAgICB2YXIgbmV3QXJyID0gbmV3IEJ5dGVBcnJheSh0aGlzLmxlbmd0aCwgdGhpcy5tdXRfZXhwKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBuZXdBcnJbaV0gPSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdBcnI7XG4gICAgfVxuXG59XG5cbmNsYXNzIE11dGF0b3J7XG4gICAgY29uc3RydWN0b3IocHJvYiwgcHJvYl9yZXBsYWNlbWVudCwgcHJvYl9pbnNlcnRpb24sIHByb2JfZGVsZXRpb24sIHByb2JfZHVwLCByZXBsYWNlbWVudF9tb2RlLCB1bml0cyl7XG4gICAgICAgIHRoaXMucHJvYiA9IHByb2I7XG4gICAgICAgIHRoaXMucFIgPSBwcm9iX3JlcGxhY2VtZW50O1xuICAgICAgICB0aGlzLnBJID0gcHJvYl9pbnNlcnRpb247XG4gICAgICAgIHRoaXMucEQgPSBwcm9iX2RlbGV0aW9uO1xuICAgICAgICB0aGlzLnBEdXAgPSBwcm9iX2R1cDtcbiAgICAgICAgdGhpcy5wUm1vZGUgPSByZXBsYWNlbWVudF9tb2RlOyAgXG4gICAgICAgIHRoaXMudW5pdHMgPSB1bml0cztcbiAgICB9XG5cbiAgICBtdXRhdGUoZ2Vub21lKXtcbiAgICAgICAgbGV0IG11dGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBSLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlKGdlbm9tZSk7XG4gICAgICAgICAgICBtdXRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEksIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmluc2VydChnZW5vbWUpO1xuICAgICAgICAgICAgbXV0YXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBELCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5kZWxldGUoZ2Vub21lKTtcbiAgICAgICAgICAgIG11dGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtdXRhdGVkO1xuICAgIH1cblxuICAgIG1Qcm9iKHAsIGV4cCl7XG4gICAgICAgIHJldHVybiByYW5kb21Qcm9iKHAgKiBNYXRoLnBvdyggdGhpcy5wcm9iLCBleHApKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgc3dpdGNoKHRoaXMucFJtb2RlKXtcbiAgICAgICAgY2FzZSBcImJ5dGV3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSB0aGlzLnJhbmRvbUNoYXIoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYml0d2lzZVwiOlxuICAgICAgICAgICAgZ2Vub21lW2ldID0gZ2Vub21lW2ldIF4gKDEgPDwgcmFuZG9tSW50KDAsIDcpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG11dGF0aW9uIHJlcGxhY2VtZW50IG1vZGU6ICR7dGhpcy5wUm1vZGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgaW5zZXJ0KGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMCwgdGhpcy5yYW5kb21DaGFyKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVsZXRlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByYW5kb21DaGFyKCl7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQoMCwgMjU1KTtcbiAgICB9XG5cbiAgICByYW5kb21Qb3MoZ2Vub21lKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCBnZW5vbWUubGVuZ3RoLTEpO1xuICAgIH1cbn1cblxuXG5cbmNsYXNzIFJ1bGUge1xuICAgIGNvbnN0cnVjdG9yKGVxTWFzaywgc3RhdGUsIGFjdGlvbil7XG4gICAgICAgIHRoaXMuZXFNYXNrID0gZXFNYXNrO1xuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIHRoaXMuYWN0aW9uID0gYWN0aW9uO1xuICAgIH1cblxuICAgIG1hdGNoZXMoc3RhdGUpe1xuICAgICAgICB2YXIgZXFTdGF0ZSA9IHN0YXRlICYgdGhpcy5lcU1hc2s7XG4gICAgICAgIHJldHVybiBlcVN0YXRlID09PSB0aGlzLnN0YXRlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnN0YXRlfSAtPiAke3RoaXMuYWN0aW9ufWA7XG4gICAgfVxufVxuXG5jbGFzcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICAvKipcbiAgICAgKiBNZXRob2RzIHRoYXQgZGVjb2RlIGdlbm9tZXMgaW50byBydWxlc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcsIGNvZGVSYW5nZT0yNTYpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBuZXcgQWN0aW9uTWFwKG1hcHBpbmcsIGNvZGVSYW5nZSk7XG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuXG4gICAgfVxufVxuXG5jbGFzcyBCbG9ja0ludGVycHJldGVyIGV4dGVuZHMgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgY29uc3RydWN0b3IobWFwcGluZyl7XG4gICAgICAgIHN1cGVyKG1hcHBpbmcsIDI1Nik7IC8vIGFjdGlvbiBieXRlIGlzIGZ1bGwgMC0yNTUgcmFuZ2VcbiAgICB9XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG4gICAgICAgIHZhciBydWxlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrPTIpe1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMubWFwcGluZy5nZXRBY3Rpb24oYnl0ZWFycmF5W2krMV0pO1xuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZSgyNTUsIGJ5dGVhcnJheVtpXSwgYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ1bGVzO1xuICAgIH1cbn1cblxuY2xhc3MgUHJvbW90b3JJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcpe1xuICAgICAgICBzdXBlcihtYXBwaW5nLCA2NCk7IC8vIHRlcm1pbmF0b3IgY29udHJpYnV0ZXMgbG93ZXIgNiBiaXRzOiByYW5nZSAwLTYzXG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgdmFyIGdlbmVzID0gW107XG4gICAgICAgIHZhciBnZW5lID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgYnl0ZWFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjID0gYnl0ZWFycmF5W2ldO1xuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDYpID09PSBiaXRTZXQoYywgNykpe1xuICAgICAgICAgICAgICAgIC8vIG9wZXJhdG9yXG4gICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihiaXRTZXQoYywgNykpe1xuICAgICAgICAgICAgICAgIC8vIHByb21vdG9yXG4gICAgICAgICAgICAgICAgZ2VuZSA9IFtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgaWYoYml0U2V0KGMsIDYpKXtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGVybWluYXRvclxuICAgICAgICAgICAgICAgICAgICBpZihnZW5lLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVzLnB1c2goZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lID0gW107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBnZW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGdlbmUpe1xuICAgICAgICAgICAgLy8gZXh0cmFjdCA2IGxlYXN0IHNpZyBiaXRzIGZyb20gdGVybWluYXRvciBhcyB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgICAgIHZhciBhY3Rpb25Db2RlID0gZ2VuZVtnZW5lLmxlbmd0aC0xXSAmICgoMSA8PCA2KSAtIDEpO1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMubWFwcGluZy5nZXRBY3Rpb24oYWN0aW9uQ29kZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHRha2UgaW5mb3JtYXRpb24gZnJvbSBvcGVyYXRvcnMgdG8gY3JlYXRlIHN0YXRlIG1hc2tcbiAgICAgICAgICAgIHZhciBtYXNrID0gMDtcbiAgICAgICAgICAgIHZhciBlcU1hc2sgPSAwOyAvLyBzcGVjaWZpZWQgd2hpY2ggYml0cyBjb250cmlidXRlIHRvIHRoZSBzdGF0ZSBtYXNrXG4gICAgICAgICAgICBmb3IodmFyIGk9MTsgaTxnZW5lLmxlbmd0aC0xOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyA0IGxlYXN0IHNpZyBiaXRzIGRldGVybWluZSB0aGUgbWFzayBpbmRleFxuICAgICAgICAgICAgICAgIHZhciBtYXNrQml0ID0gZ2VuZVtpXSAmICgoMSA8PCA0KSAtIDEpO1xuXG4gICAgICAgICAgICAgICAgLy8gZGV0ZXJtaW5lcyBpZiB0aGUgbWFzayBhdCB0aGlzIGluZGV4IGlzIHNldCB0byAxIG9yIDBcbiAgICAgICAgICAgICAgICB2YXIgYml0U3RhdGUgPSAoZ2VuZVtpXSAmICgxIDw8IDQpKSA+PiA0O1xuICAgICAgICAgICAgICAgIG1hc2sgKz0gKDEgPDwgbWFza0JpdCkgKiBiaXRTdGF0ZTtcblxuICAgICAgICAgICAgICAgIGVxTWFzayArPSAoMSA8PCBtYXNrQml0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJ1bGVzLnB1c2gobmV3IFJ1bGUoZXFNYXNrLCBtYXNrLCBhY3Rpb24pKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJpdFNldChieXRlLCBpKXtcbiAgICByZXR1cm4gKGJ5dGUgPj4gaSkgJiAxO1xufVxuXG5leHBvcnQge0J5dGVBcnJheSwgQmxvY2tJbnRlcnByZXRlciwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtDZWxsfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5pbXBvcnQge05FSUdIQk9VUkhPT0R9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgUGxhbnR7XG4gICAgY29uc3RydWN0b3IoeCwgd29ybGQsIGdlbm9tZSwgdXNlSW50ZXJuYWxTdGF0ZT1mYWxzZSkge1xuICAgICAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgICAgIHRoaXMuZW5lcmdpc2VkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmNlbGxzID0gW25ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgMCldO1xuICAgICAgICB0aGlzLmdlbm9tZSA9IGdlbm9tZTtcbiAgICAgICAgdGhpcy51c2VJbnRlcm5hbFN0YXRlID0gdXNlSW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5ydWxlcyA9IG51bGw7IC8vIGNhY2hlZCBydWxlc1xuICAgICAgICB0aGlzLmxlYW5vdmVyRW5lcmdpc2VkID0gMDsgLy8gSW5jcmVtZW50YWwgdHJhY2tpbmdcbiAgICB9XG5cbiAgICBnZXROZWlnaGJvdXJob29kKGNlbGwpe1xuICAgICAgICAvLyBSZXR1cm4gdGhlIG5laWdoYm91cmhvb2QgbWFza1xuICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPE5FSUdIQk9VUkhPT0QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIHBvcyA9IE5FSUdIQk9VUkhPT0RbaV07XG4gICAgICAgICAgICB2YXIgeCA9IGNlbGwueCArIHBvc1swXTtcbiAgICAgICAgICAgIHZhciB5ID0gY2VsbC55ICsgcG9zWzFdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBCb3VuZHMgY2hlY2sgaW5zdGVhZCBvZiB0cnktY2F0Y2hcbiAgICAgICAgICAgIGlmICh4ID49IDAgJiYgeCA8IHRoaXMud29ybGQud2lkdGggJiYgeSA+PSAwICYmIHkgPCB0aGlzLndvcmxkLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICAgICAgaWYgKHdvcmxkUG9zIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICAgICAgICAgIG1hc2sgPSBtYXNrIHwgKDEgPDwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXNrO1xuICAgIH1cblxuICAgIGdldFN0YXRlKGNlbGwpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXROZWlnaGJvdXJob29kKGNlbGwpIHwgY2VsbC5pbnRlcm5hbFN0YXRlIHwgKCggY2VsbC5lbmVyZ2lzZWQgPyAxIDogMCkgPDwgMTUpO1xuICAgIH1cblxuICAgIGdyb3coKXtcbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBncm93XG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKDAuOCkpe1xuICAgICAgICAgICAgICAgIHZhciBzcGFjZXMgPSB0aGlzLmdldEdyb3dEaXJlY3Rpb24oY2VsbCk7XG4gICAgICAgICAgICAgICAgaWYoc3BhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gc3BhY2VzW3JhbmRvbUludCgwLCBzcGFjZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR3JvdyB0aGUgcGxhbnQgYnkgb25lIGNlbGwgaWYgcG9zc2libGVcbiAgICAgKiBAcGFyYW0geyp9IGNlbGwgdGhlIGNlbGwgdG8gZ3JvdyBmcm9tXG4gICAgICogQHBhcmFtIHsqfSBkaXJlY3Rpb24gdGhlIGRpcmVjdGlvbiB0byBncm93IGluXG4gICAgICovXG4gICAgZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbil7XG4gICAgICAgIHZhciB4ID0gY2VsbC54K2RpcmVjdGlvblswXSwgeSA9IGNlbGwueStkaXJlY3Rpb25bMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIHNwYWNlIGlzIGNsZWFyXG4gICAgICAgIHZhciBzcGFjZSA9IHRoaXMud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICAgICAgaWYgKHNwYWNlID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGFjZSBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgaWYgKHNwYWNlLnBsYW50ID09PSB0aGlzKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGlzIHBsYW50IHdpbGwga2lsbCB0aGUgb3RoZXJcbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9iYWJpbGl0eS4uLlxuICAgICAgICAgICAgaWYocmFuZG9tUHJvYihzcGFjZS5wbGFudC5nZXRLaWxsUHJvYmFiaWxpdHkoKSkpe1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBzdWNjZWVkZWQuIEtpbGwgY29tcGV0aXRvciBhbmQgY29udGludWUgd2l0aCBncm93dGhcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChzcGFjZS5wbGFudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgZmFpbGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgLy8gZ3JvdyBjZWxsIGluIHRvIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBuZXdfY2VsbCA9IG5ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgeSk7XG4gICAgICAgIHRoaXMuY2VsbHMucHVzaChuZXdfY2VsbCk7XG4gICAgICAgIFxuICAgICAgICAvLyBVcGRhdGUgaW5jcmVtZW50YWwgdHJhY2tpbmdcbiAgICAgICAgY29uc3Qgcm9vdENlbGwgPSB0aGlzLmNlbGxzWzBdO1xuICAgICAgICBjb25zdCBsZSA9IHRoaXMud29ybGQud2lkdGgvMiAtICggKCggMS41KnRoaXMud29ybGQud2lkdGggKSArIG5ld19jZWxsLnggLSByb290Q2VsbC54KSAgJSB0aGlzLndvcmxkLndpZHRoKTtcbiAgICAgICAgdGhpcy5sZWFub3ZlckVuZXJnaXNlZCArPSBsZTtcblxuICAgICAgICB0aGlzLndvcmxkLmFkZENlbGwobmV3X2NlbGwpO1xuICAgIH1cblxuICAgIGdldEtpbGxQcm9iYWJpbGl0eSgpe1xuICAgICAgICByZXR1cm4gMS90aGlzLmVuZXJnaXNlZENvdW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB3aGV0aGVyIHRoaXMgcGxhbnQgc2hvdWxkIGRpZS5cbiAgICAgKiBAcGFyYW0ge30gbmF0dXJhbF9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gZW5lcmd5X2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGVuZXJneSByaWNoIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBsZWFub3Zlcl9mYWN0b3IgZmFjdG9yIHRvIHRoZSBsZWFub3ZlciB0ZXJtXG4gICAgICovXG4gICAgZ2V0RGVhdGhQcm9iYWJpbGl0eShkZWF0aF9mYWN0b3IsIG5hdHVyYWxfZXhwLCBlbmVyZ3lfZXhwLCBsZWFub3Zlcl9mYWN0b3Ipe1xuICAgICAgICB2YXIgbnVtQ2VsbHMgPSB0aGlzLmNlbGxzLmxlbmd0aDtcbiAgICAgICAgXG4gICAgICAgIHZhciBsZWFub3ZlckNlbGxzID0gMi8obnVtQ2VsbHMqKG51bUNlbGxzLTEpKTtcbiAgICAgICAgaWYgKGxlYW5vdmVyQ2VsbHMgPT09IEluZmluaXR5KXtcbiAgICAgICAgICAgIGxlYW5vdmVyQ2VsbHMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYW5vdmVyVGVybSA9IGxlYW5vdmVyQ2VsbHMqTWF0aC5hYnModGhpcy5sZWFub3ZlckVuZXJnaXNlZCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZF9uYXR1cmFsID0gTWF0aC5wb3cobnVtQ2VsbHMsIG5hdHVyYWxfZXhwKTtcbiAgICAgICAgdmFyIGRfZW5lcmd5ID0gTWF0aC5wb3codGhpcy5lbmVyZ2lzZWRDb3VudCsxLCBlbmVyZ3lfZXhwKTtcbiAgICAgICAgdmFyIGRfbGVhbm92ZXIgPSBsZWFub3Zlcl9mYWN0b3IqbGVhbm92ZXJUZXJtO1xuICAgICAgICB2YXIgcERlYXRoID0gZGVhdGhfZmFjdG9yICogZF9uYXR1cmFsICogZF9lbmVyZ3kgKyBkX2xlYW5vdmVyO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJwcm9iXCI6IHBEZWF0aCxcbiAgICAgICAgICAgIFwibmF0dXJhbFwiOiBkX25hdHVyYWwsXG4gICAgICAgICAgICBcImVuZXJneVwiOiBkX2VuZXJneSxcbiAgICAgICAgICAgIFwibGVhbm92ZXJcIjogZF9sZWFub3ZlclxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGxhbnQgfTsiLCJpbXBvcnQgc2VlZHJhbmRvbSBmcm9tIFwic2VlZHJhbmRvbVwiO1xuXG4vKipcbiAqIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byBNYXRoLnJhbmRvbVxuICogQHBhcmFtIHsqfSBzZWVkIGRhdGEgdG8gdXNlIHRvIHNlZWQgYWxsIGZ1dHVyZSBSTkcgY2FsbHNcbiAqL1xuZnVuY3Rpb24gc2VlZFJhbmRvbShzZWVkKXtcbiAgICBzZWVkcmFuZG9tKHNlZWQsIHtnbG9iYWw6IHRydWV9KTtcbn1cblxuLyoqXG4gKiByZXR1cm5zIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiAwIGFuZCBtYXggKGluY2x1c2l2ZSlcbiAqIEBwYXJhbSB7Kn0gbWF4IG1heGltdW0gaW50ZWdlciB0byBnZW5lcmF0ZSBhcyBhIHJhbmRvbSBudW1iZXJcbiAqL1xuZnVuY3Rpb24gcmFuZG9tSW50KG1pbiwgbWF4KXtcbiAgICAvLyBub3RlOiBNYXRoLnJhbmRvbSByZXR1cm5zIGEgcmFuZG9tIG51bWJlciBleGNsdXNpdmUgb2YgMSxcbiAgICAvLyBzbyB0aGVyZSBpcyArMSBpbiB0aGUgYmVsb3cgZXF1YXRpb24gdG8gZW5zdXJlIHRoZSBtYXhpbXVtXG4gICAgLy8gbnVtYmVyIGlzIGNvbnNpZGVyZWQgd2hlbiBmbG9vcmluZyAwLjkuLi4gcmVzdWx0cy5cbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZXMgdGhlIGNoYW5jZSBvZiBhbiBldmVudCBoYXBwZW5pbmcgZ2l2ZW4gcHJvYlxuICogQHBhcmFtIHsqfSBwcm9iIGZyYWN0aW9uIGJldHdlZW4gMCBhbmQgMSBjaGFuY2Ugb2YgdGhlIGV2ZW50IGhhcHBlbmluZ1xuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgZXZlbnQgaGFwcGVucywgZmFsc2UgaWYgbm90XG4gKi9cbmZ1bmN0aW9uIHJhbmRvbVByb2IocHJvYil7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgPD0gcHJvYjtcbn1cblxuZXhwb3J0IHtzZWVkUmFuZG9tLCByYW5kb21JbnQsIHJhbmRvbVByb2J9OyIsImltcG9ydCAqIGFzIHN0YXRzIGZyb20gXCJzdGF0cy1saXRlXCI7XG5cbmZ1bmN0aW9uIGxldmVuc2h0ZWluKGEsIGIpIHtcbiAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiBiLmxlbmd0aDtcbiAgICBpZiAoYi5sZW5ndGggPT09IDApIHJldHVybiBhLmxlbmd0aDtcbiAgICBsZXQgbWF0cml4ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gYi5sZW5ndGg7IGkrKykgbWF0cml4W2ldID0gW2ldO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDw9IGEubGVuZ3RoOyBqKyspIG1hdHJpeFswXVtqXSA9IGo7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoYltpIC0gMV0gPT09IGFbaiAtIDFdKSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gbWF0cml4W2kgLSAxXVtqIC0gMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqXSA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaSAtIDFdW2ogLSAxXSArIDEsIC8vIHN1YnN0aXR1dGlvblxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqIC0gMV0gKyAxLCAvLyBpbnNlcnRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1bal0gKyAxICAvLyBkZWxldGlvblxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0cml4W2IubGVuZ3RoXVthLmxlbmd0aF07XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUFsbGVsZUVudHJvcHkocGxhbnRzKSB7XG4gICAgaWYgKHBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIGNvbnN0IGNvdW50cyA9IG5ldyBBcnJheSgyNTYpLmZpbGwoMCk7XG4gICAgbGV0IHRvdGFsID0gMDtcbiAgICBwbGFudHMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwLmdlbm9tZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY291bnRzW3AuZ2Vub21lW2ldXSsrO1xuICAgICAgICAgICAgdG90YWwrKztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0b3RhbCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgbGV0IGVudHJvcHkgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICAgICAgaWYgKGNvdW50c1tpXSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBjb3VudHNbaV0gLyB0b3RhbDtcbiAgICAgICAgICAgIGVudHJvcHkgLT0gcCAqIE1hdGgubG9nMihwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZW50cm9weTtcbn1cblxuY2xhc3MgU2ltRGF0YXtcblxuICAgIGNvbnN0cnVjdG9yKHNpbXVsYXRpb24pe1xuICAgICAgICB0aGlzLnNpbSA9IHNpbXVsYXRpb247XG4gICAgICAgIHRoaXMuZGF0YSA9IHtcInN0ZXBudW1cIjogW119O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMgPSBbXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicG9wdWxhdGlvblwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInRvdGFsX2NlbGxzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIHAuY2VsbHMubGVuZ3RoLCAwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImVuZXJnaXNlZF9jZWxsc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLmNlbGxzLmZpbHRlcihjID0+IGMuZW5lcmdpc2VkKS5sZW5ndGgsIDApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicGxhbnRfc2l6ZV9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5jZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2Vub21lX3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLmxlbmd0aCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJtdXRfZXhwX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5tdXRfZXhwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X2hlaWdodF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5tYXgoLi4ucC5jZWxscy5tYXAoYyA9PiBjLnkpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbmV0aWNfZGlzdGFuY2VfbWVhblwiLCBBc0lzLCBmdW5jdGlvbihzaW0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGFudHMgPSBzaW0ud29ybGQucGxhbnRzO1xuICAgICAgICAgICAgICAgIGlmIChwbGFudHMubGVuZ3RoIDwgMikgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgbGV0IHN1bURpc3QgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBzYW1wbGVTaXplID0gTWF0aC5taW4oMzAsIHBsYW50cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGxldCBwYWlycyA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzYW1wbGVTaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcDEgPSBwbGFudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGxhbnRzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwMiA9IHBsYW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwbGFudHMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwMSAhPT0gcDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bURpc3QgKz0gbGV2ZW5zaHRlaW4ocDEuZ2Vub21lLCBwMi5nZW5vbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFpcnMrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFpcnMgPiAwID8gc3VtRGlzdCAvIHBhaXJzIDogMDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImFsbGVsZV9lbnRyb3B5XCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxjdWxhdGVBbGxlbGVFbnRyb3B5KHNpbS53b3JsZC5wbGFudHMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb2xsZWN0IGRhdGEgZm9yIHRoZSBjdXJyZW50IHN0ZXBcbiAgICAgKi9cbiAgICByZWNvcmRTdGVwKCl7XG4gICAgICAgIHZhciBzdGVwRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMuZm9yRWFjaChmdW5jdGlvbihjKXtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBjLmNvbGxlY3QodGhpcy5zaW0pO1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihzdGVwRGF0YSwgdmFsdWVzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5wdXNoKHRoaXMuc2ltLnN0ZXBudW0pO1xuICAgICAgICBpZiAodGhpcy5kYXRhW1wic3RlcG51bVwiXS5sZW5ndGggPiBTaW1EYXRhLk1BWF9EQVRBX1BPSU5UUykge1xuICAgICAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5rZXlzKHN0ZXBEYXRhKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAgICAgaWYgKCEoayBpbiB0aGlzLmRhdGEpKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF0YVtrXS5wdXNoKHN0ZXBEYXRhW2tdKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGFba10ubGVuZ3RoID4gU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10uc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMgPSAyMDAwO1xuXG5jbGFzcyBDb2xsZWN0b3J7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZWNscywgY29sbGVjdEZ1bmMpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnR5cGUgPSBuZXcgdHlwZWNscyhuYW1lKTtcbiAgICAgICAgdGhpcy5mdW5jID0gY29sbGVjdEZ1bmM7XG4gICAgfVxuXG4gICAgY29sbGVjdChzaW0pe1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZnVuYyhzaW0pO1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnRyYW5zZm9ybShkYXRhKTtcbiAgICB9XG59XG5cbmNsYXNzIENvbGxlY3RvclR5cGV7XG4gICAgY29uc3RydWN0b3IobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZCBtZXRob2RcIik7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtKGRhdGEpe1xuICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy50cmFuc2Zvcm1EYXRhKGRhdGEpO1xuICAgICAgICB2YXIgdHJhbnNmb3JtZWRfZGF0YSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgICAgICB0cmFuc2Zvcm1lZF9kYXRhW3RoaXMubmFtZSArIGtdID0gdmFsdWVzW2tdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkX2RhdGE7XG4gICAgfVxufVxuXG5jbGFzcyBBc0lzIGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICByZXR1cm4ge1wiXCI6IGRhdGF9O1xuICAgIH1cbn1cblxuY2xhc3MgU3VtbWFyeSBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIm1pblwiOiBNYXRoLm1pbihkYXRhKSwgXCJtZWFuXCI6IHN0YXRzLm1lYW4oZGF0YSksIFwibWF4XCI6IE1hdGgubWF4KGRhdGEpfTtcbiAgICB9XG59XG5leHBvcnQge1NpbURhdGF9OyIsImltcG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1dvcmxkfSBmcm9tIFwiLi93b3JsZC5qc1wiO1xuaW1wb3J0IHtCeXRlQXJyYXksIEJsb2NrSW50ZXJwcmV0ZXIsIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9IGZyb20gXCIuL2dlbm9tZS5qc1wiO1xuXG5jbGFzcyBTaW11bGF0aW9uUGFyYW1ze1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcz17fSl7XG4gICAgICAgIHRoaXMucmFuZG9tX3NlZWQgPSAxO1xuICAgICAgICB0aGlzLnJlY29yZF9pbnRlcnZhbCA9IDEwO1xuICAgICAgICB0aGlzLnN0ZXBzX3Blcl9mcmFtZSA9IDE7XG4gICAgICAgIHRoaXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWwgPSAwO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX3N0cmVuZ3RoID0gMC4xO1xuXG4gICAgICAgIHRoaXMud29ybGRfd2lkdGggPSAyNTA7XG4gICAgICAgIHRoaXMud29ybGRfaGVpZ2h0ID0gNDA7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9wb3B1bGF0aW9uID0gMjUwO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmVyZ3lfcHJvYiA9IDAuNTtcblxuICAgICAgICAvLyBkZWF0aCBwYXJhbXNcbiAgICAgICAgdGhpcy5kZWF0aF9mYWN0b3IgPSAwLjI7XG4gICAgICAgIHRoaXMubmF0dXJhbF9leHAgPSAwO1xuICAgICAgICB0aGlzLmVuZXJneV9leHAgPSAtMi41O1xuICAgICAgICB0aGlzLmxlYW5vdmVyX2ZhY3RvciA9IDAuMjtcblxuICAgICAgICAvLyBtdXRhdGlvbnNcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZV9tb2RlID0gXCJieXRld2lzZVwiO1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlID0gMC4wMDI7XG4gICAgICAgIHRoaXMubXV0X2luc2VydCA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZGVsZXRlID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9mYWN0b3IgPSAxLjU7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9tdXRfZXhwID0gMDtcblxuICAgICAgICB0aGlzLmdlbm9tZV9pbnRlcnByZXRlciA9IFwiYmxvY2tcIjtcbiAgICAgICAgdGhpcy5pbml0aWFsX2dlbm9tZV9sZW5ndGggPSA0MDA7XG5cbiAgICAgICAgLy8gZGl2aWRlLCBmbHlpbmdzZWVkLCBsb2NhbHNlZWQsIG11dCssIG11dC0sIHN0YXRlYml0XG4gICAgICAgIHRoaXMuYWN0aW9uX21hcCA9IFsyMDAsIDIwLCAwLCAxOCwgMTgsIDBdO1xuXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgcGFyYW1zKTtcbiAgICB9XG59XG5cbmNsYXNzIFNpbXVsYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcblxuICAgICAgICAvLyBTZWVkIGFsbCBmdXR1cmUgY2FsbHMgdG8gcmFuZG9tXG4gICAgICAgIC8vIHRoaXMgbWFrZXMgb3V0IHRlc3RzIHJlcHJvZHVjaWJsZSBnaXZlbiB0aGUgc2FtZSBzZWVkIGlzIHVzZWRcbiAgICAgICAgLy8gaW4gZnV0dXJlIGlucHV0IHBhcmFtZXRlcnNcbiAgICAgICAgc2VlZFJhbmRvbSh0aGlzLnBhcmFtcy5yYW5kb21fc2VlZCk7XG5cbiAgICAgICAgdGhpcy53b3JsZCA9IG5ldyBXb3JsZCh0aGlzLnBhcmFtcy53b3JsZF93aWR0aCwgdGhpcy5wYXJhbXMud29ybGRfaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5nZW5vbWVJbnRlcnByZXRlciA9IHRoaXMuZ2V0SW50ZXJwcmV0ZXIoKTtcbiAgICAgICAgdGhpcy5tdXRfdW5pdHMgPSAxO1xuICAgICAgICAvLyBlbnN1cmUgbXV0YXRpb24gdW5pdHMgaXMgY29tcGF0aWJsZSB3aXRoIHRoZSBpbnRlcnByZXRlciB0eXBlXG4gICAgICAgIGlmKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBCbG9ja0ludGVycHJldGVyKXtcbiAgICAgICAgICAgIHRoaXMubXV0X3VuaXRzID0gMjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0ZXBudW0gPSAwO1xuICAgIH1cblxuICAgIGdldEludGVycHJldGVyKCl7XG4gICAgICAgIHN3aXRjaCAodGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyKXtcbiAgICAgICAgY2FzZSBcImJsb2NrXCI6XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJsb2NrSW50ZXJwcmV0ZXIodGhpcy5wYXJhbXMuYWN0aW9uX21hcCk7XG4gICAgICAgIGNhc2UgXCJwcm9tb3RvclwiOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9tb3RvckludGVycHJldGVyKHRoaXMucGFyYW1zLmFjdGlvbl9tYXApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGludGVycHJldGVyICR7dGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyfWApO1xuICAgICAgICB9ICBcbiAgICB9XG5cbiAgICBpbml0X3BvcHVsYXRpb24oKXtcbiAgICAgICAgLy8gcmFuZG9tbHkgY2hvb3NlIHNwb3RzIHRvIHNlZWQgdGhlIHdvcmxkIHdpdGhcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMubmV3U2VlZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgcG9wdWxhdGlvbiBmcm9tIGEgbGlzdCBvZiBzZXJpYWxpemVkIGdlbm9tZSBzdHJpbmdzLFxuICAgICAqIGRyYXdpbmcgd2l0aCByZXBsYWNlbWVudCB1cCB0byBpbml0aWFsX3BvcHVsYXRpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2VyaWFsaXplZEdlbm9tZXNcbiAgICAgKi9cbiAgICBpbml0X3BvcHVsYXRpb25fZnJvbV9nZW5vbWVzKHNlcmlhbGl6ZWRHZW5vbWVzKXtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IHNlcmlhbGl6ZWRHZW5vbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlcmlhbGl6ZWRHZW5vbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgY29uc3QgZ2Vub21lID0gQnl0ZUFycmF5LmRlc2VyaWFsaXplKHN0cik7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ld1NlZWQoKXtcbiAgICAgICAgLy8gY3JlYXRlIGEgcmFuZG9tIGdlbm9tZVxuICAgICAgICB2YXIgZ2Vub21lID0gQnl0ZUFycmF5LnJhbmRvbSh0aGlzLnBhcmFtcy5pbml0aWFsX2dlbm9tZV9sZW5ndGgpO1xuICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lKTtcbiAgICB9XG5cbiAgICBzdGVwKCl7XG4gICAgICAgIHRoaXMuc3RlcG51bSsrO1xuICAgICAgICB0aGlzLnNpbXVsYXRlRGVhdGgoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUxpZ2h0KCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMubXV0YXRlKCk7XG4gICAgfVxuXG4gICAgc2ltdWxhdGVBY3Rpb25zKCl7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53b3JsZC5wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gdGhpcy53b3JsZC5wbGFudHNbaV07XG4gICAgICAgICAgICBpZiAoIXBsYW50LnJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgcGxhbnQucnVsZXMgPSB0aGlzLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcnVsZXMgPSBwbGFudC5ydWxlcztcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGxhbnQuY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxBY3Rpb24ocGxhbnQuY2VsbHNbal0sIHJ1bGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNlbGxBY3Rpb24oY2VsbCwgcnVsZXMpe1xuICAgICAgICB2YXIgc3RhdGU7XG4gICAgICAgIGlmICh0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgQmxvY2tJbnRlcnByZXRlcil7XG4gICAgICAgICAgICBzdGF0ZSA9IGNlbGwucGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBQcm9tb3RvckludGVycHJldGVyKXtcbiAgICAgICAgICAgIHN0YXRlID0gY2VsbC5wbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBydWxlcy5mb3JFYWNoKGZ1bmN0aW9uKHJ1bGUpe1xuICAgICAgICAgICAgLy8gZXhlY3V0ZSBvbmUgYWN0aW9uIHVzaW5nIHRoZSBmaXJzdCBtYXRjaGluZyBydWxlXG4gICAgICAgICAgICAvLyBpZiAocnVsZS5tYXRjaGVzKHN0YXRlKSl7XG4gICAgICAgICAgICBpZiAocnVsZS5tYXRjaGVzKHN0YXRlKSl7XG4gICAgICAgICAgICAgICAgcnVsZS5hY3Rpb24uZXhlY3V0ZShjZWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGNlbGwudXBkYXRlU3RhdGUoKTtcbiAgICB9XG5cbiAgICBtdXRhdGUoKXtcbiAgICAgICAgdmFyIG11dGF0b3IgPSBuZXcgTXV0YXRvcih0aGlzLnBhcmFtcy5tdXRfZmFjdG9yLCB0aGlzLnBhcmFtcy5tdXRfcmVwbGFjZSwgXG4gICAgICAgICAgICB0aGlzLnBhcmFtcy5tdXRfaW5zZXJ0LCB0aGlzLnBhcmFtcy5tdXRfZGVsZXRlLCBcbiAgICAgICAgICAgIDAsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlX21vZGUsIHRoaXMubXV0X3VuaXRzKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndvcmxkLnBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGxhbnQgPSB0aGlzLndvcmxkLnBsYW50c1tpXTtcbiAgICAgICAgICAgIGlmIChtdXRhdG9yLm11dGF0ZShwbGFudC5nZW5vbWUpKSB7XG4gICAgICAgICAgICAgICAgcGxhbnQucnVsZXMgPSBudWxsOyAvLyBJbnZhbGlkYXRlIGNhY2hlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgZWFjaCBwbGFudCdzIGN1cnJlbnQgZGVhdGggcHJvYmFiaWxpdHkgdG8gc2ltdWxhdGVcbiAgICAgKiB3aGV0aGVyIGVhY2ggcGxhbnQgZGllcyBvbiB0aGlzIHN0ZXBcbiAgICAgKi9cbiAgICBzaW11bGF0ZURlYXRoKCl7XG4gICAgICAgIGNvbnN0IGRlYWRfcGxhbnRzID0gW107XG4gICAgICAgIGNvbnN0IHBsYW50cyA9IHRoaXMud29ybGQucGxhbnRzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGxhbnQgPSBwbGFudHNbaV07XG4gICAgICAgICAgICBjb25zdCBkZWF0aFByb2IgPSBwbGFudC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmxlYW5vdmVyX2ZhY3RvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChyYW5kb21Qcm9iKGRlYXRoUHJvYi5wcm9iKSl7XG4gICAgICAgICAgICAgICAgZGVhZF9wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWFkX3BsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy53b3JsZC5raWxsUGxhbnQoZGVhZF9wbGFudHNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGUgbGlnaHQuIFN1bmxpZ2h0IHRyYXZlcnNlcyBmcm9tIHRoZSBjZWlsaW5nIG9mIHRoZSB3b3JsZFxuICAgICAqIGRvd253YXJkcyB2ZXJ0aWNhbGx5LiBJdCBpcyBjYXVnaHQgYnkgYSBwbGFudCBjZWxsIHdpdGggYSBwcm9iYWJpbGl0eVxuICAgICAqIHdoaWNoIGNhdXNlcyB0aGF0IGNlbGwgdG8gYmUgZW5lcmdpc2VkLlxuICAgICAqL1xuICAgIHNpbXVsYXRlTGlnaHQoKXtcbiAgICAgICAgY29uc3QgY29sVG9wcyA9IG5ldyBJbnQxNkFycmF5KHRoaXMud29ybGQud2lkdGgpLmZpbGwoLTEpO1xuICAgICAgICBjb25zdCBwbGFudHMgPSB0aGlzLndvcmxkLnBsYW50cztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNlbGxzID0gcGxhbnRzW2ldLmNlbGxzO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjZWxsc1tqXTtcbiAgICAgICAgICAgICAgICBpZiAoY2VsbC55ID4gY29sVG9wc1tjZWxsLnhdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbFRvcHNbY2VsbC54XSA9IGNlbGwueTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IobGV0IHg9MDsgeDx0aGlzLndvcmxkLndpZHRoOyB4Kyspe1xuICAgICAgICAgICAgY29uc3QgdG9wWSA9IGNvbFRvcHNbeF07XG4gICAgICAgICAgICBpZiAodG9wWSA9PT0gLTEpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBmb3IobGV0IHk9dG9wWTsgeT49MDsgeS0tKXtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gdGhpcy53b3JsZC5jZWxsc1t4XVt5XTtcbiAgICAgICAgICAgICAgICBpZihjZWxsICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocmFuZG9tUHJvYih0aGlzLnBhcmFtcy5lbmVyZ3lfcHJvYikpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5lbmVyZ2lzZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc307IiwiaW1wb3J0IHtTaW11bGF0aW9uLCBTaW11bGF0aW9uUGFyYW1zfSBmcm9tIFwiLi9zaW11bGF0aW9uLmpzXCI7XG5pbXBvcnQge1NpbURhdGF9IGZyb20gXCIuL3NpbWRhdGEuanNcIjtcblxubGV0IHNpbXVsYXRpb24gPSBudWxsO1xubGV0IGRhdGEgPSBudWxsO1xubGV0IHJ1bm5pbmcgPSBmYWxzZTtcbmxldCBjZWxsU2l6ZSA9IDI7XG5jb25zdCBUQVJHRVRfRlBTID0gNjA7XG5jb25zdCBGUkFNRV9JTlRFUlZBTF9NUyA9IDEwMDAgLyBUQVJHRVRfRlBTO1xubGV0IGxhc3RGcmFtZVRpbWUgPSAwO1xuXG5zZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgY29uc3QgbXNnID0gZXZlbnQuZGF0YTtcbiAgICBzd2l0Y2ggKG1zZy50eXBlKSB7XG4gICAgY2FzZSBcImluaXRcIjpcbiAgICAgICAgaW5pdFNpbShtc2cucGFyYW1zLCBtc2cuZ2Vub21lcyB8fCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0YXJ0XCI6XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBsb29wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdG9wXCI6XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0ZXBcIjpcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBwdXNoU3RhdHMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImdldENlbGxcIjpcbiAgICAgICAgc2VuZENlbGxJbmZvKG1zZy54LCBtc2cueSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJkaXN0dXJiXCI6XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2UobXNnLnN0cmVuZ3RoKTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJraWxsQ2VsbFwiOlxuICAgICAgICBraWxsQ2VsbEF0KG1zZy54LCBtc2cueSk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwidXBkYXRlRGlzcGxheVBhcmFtc1wiOlxuICAgICAgICBpZiAoc2ltdWxhdGlvbiAmJiBzaW11bGF0aW9uLnBhcmFtcykge1xuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lID0gbXNnLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnJlY29yZF9pbnRlcnZhbCA9IG1zZy5yZWNvcmRfaW50ZXJ2YWw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImV4cG9ydFwiOlxuICAgICAgICBleHBvcnRHZW5vbWVzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGluaXRTaW0ocGFyYW1zLCBpbXBvcnRlZEdlbm9tZXM9bnVsbCkge1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBjb25zdCBzaW1fcGFyYW1zID0gbmV3IFNpbXVsYXRpb25QYXJhbXMocGFyYW1zKTtcbiAgICBjZWxsU2l6ZSA9IHBhcmFtcy5jZWxsU2l6ZSB8fCA4O1xuICAgIHNpbXVsYXRpb24gPSBuZXcgU2ltdWxhdGlvbihzaW1fcGFyYW1zKTtcbiAgICBkYXRhID0gbmV3IFNpbURhdGEoc2ltdWxhdGlvbik7XG4gICAgaWYgKGltcG9ydGVkR2Vub21lcyAmJiBpbXBvcnRlZEdlbm9tZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbl9mcm9tX2dlbm9tZXMoaW1wb3J0ZWRHZW5vbWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbigpO1xuICAgIH1cbiAgICBwdXNoRnJhbWUoKTtcbiAgICBwdXNoU3RhdHMoKTtcbn1cblxuZnVuY3Rpb24gbG9vcCgpIHtcbiAgICBpZiAoIXJ1bm5pbmcpIHJldHVybjtcblxuICAgIGNvbnN0IHNwZiA9IHNpbXVsYXRpb24ucGFyYW1zLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNwZjsgaSsrKSB7XG4gICAgICAgIGRvU3RlcCgpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgaWYgKG5vdyAtIGxhc3RGcmFtZVRpbWUgPj0gRlJBTUVfSU5URVJWQUxfTVMpIHtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIHB1c2hTdGF0cygpO1xuICAgICAgICBsYXN0RnJhbWVUaW1lID0gbm93O1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQobG9vcCwgMCk7XG59XG5cbmZ1bmN0aW9uIGRvU3RlcCgpIHtcbiAgICBzaW11bGF0aW9uLnN0ZXAoKTtcblxuICAgIC8vIFBlcmlvZGljIGRpc3R1cmJhbmNlXG4gICAgY29uc3QgZGkgPSBzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9pbnRlcnZhbDtcbiAgICBpZiAoZGkgPiAwICYmIHNpbXVsYXRpb24uc3RlcG51bSAlIGRpID09PSAwKSB7XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2Uoc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChzaW11bGF0aW9uLnN0ZXBudW0gJSBzaW11bGF0aW9uLnBhcmFtcy5yZWNvcmRfaW50ZXJ2YWwgPT09IDAgfHwgc2ltdWxhdGlvbi5zdGVwbnVtID09PSAxKSB7XG4gICAgICAgIGRhdGEucmVjb3JkU3RlcCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcHVzaFN0YXRzKCkge1xuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcInN0YXRzXCIsXG4gICAgICAgIGRhdGE6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YS5kYXRhKSksXG4gICAgICAgIHN0ZXBudW06IHNpbXVsYXRpb24uc3RlcG51bVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseURpc3R1cmJhbmNlKHN0cmVuZ3RoKSB7XG4gICAgY29uc3Qgd29ybGQgPSBzaW11bGF0aW9uLndvcmxkO1xuICAgIGNvbnN0IHBsYW50cyA9IHdvcmxkLnBsYW50cztcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGNvbnN0IG51bVRvS2lsbCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3Ioc3RyZW5ndGggKiBwbGFudHMubGVuZ3RoKSk7XG4gICAgLy8gU2h1ZmZsZSBhIHNhbXBsZSBhbmQga2lsbFxuICAgIGNvbnN0IHNodWZmbGVkID0gcGxhbnRzLnNsaWNlKCkuc29ydCgoKSA9PiBNYXRoLnJhbmRvbSgpIC0gMC41KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRvS2lsbCAmJiBpIDwgc2h1ZmZsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2hlY2sgcGxhbnQgc3RpbGwgYWxpdmUgKG5vdCBraWxsZWQgYnkgcHJldmlvdXMgaXRlcmF0aW9uKVxuICAgICAgICBpZiAod29ybGQucGxhbnRzLmluY2x1ZGVzKHNodWZmbGVkW2ldKSkge1xuICAgICAgICAgICAgd29ybGQua2lsbFBsYW50KHNodWZmbGVkW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24ga2lsbENlbGxBdCh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoY2VsbCAmJiBjZWxsLnBsYW50KSB7XG4gICAgICAgIHNpbXVsYXRpb24ud29ybGQua2lsbFBsYW50KGNlbGwucGxhbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZXhwb3J0R2Vub21lcygpIHtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgIHNpbXVsYXRpb24ud29ybGQucGxhbnRzLmZvckVhY2gocGxhbnQgPT4ge1xuICAgICAgICBzZWVuLmFkZChwbGFudC5nZW5vbWUuc2VyaWFsaXplKCkpO1xuICAgIH0pO1xuICAgIGNvbnN0IGdlbm9tZXMgPSBBcnJheS5mcm9tKHNlZW4pO1xuICAgIGNvbnN0IGV4cG9ydEJ1bmRsZSA9IHtcbiAgICAgICAgYWN0aW9uX21hcDogc2ltdWxhdGlvbi5wYXJhbXMuYWN0aW9uX21hcCxcbiAgICAgICAgZ2Vub21lX2ludGVycHJldGVyOiBzaW11bGF0aW9uLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIsXG4gICAgICAgIGdlbm9tZXNcbiAgICB9O1xuICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImV4cG9ydGVkR2Vub21lc1wiLCBidW5kbGU6IGV4cG9ydEJ1bmRsZSB9KTtcbn1cblxuZnVuY3Rpb24gcHVzaEZyYW1lKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpO1xuICAgIC8vIFRyYW5zZmVyIG93bmVyc2hpcCBvZiB0aGUgQXJyYXlCdWZmZXIgZm9yIHplcm8tY29weSBwZXJmb3JtYW5jZVxuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcImZyYW1lXCIsXG4gICAgICAgIGJ1ZmZlcjogcmVzdWx0LmJ1ZmZlci5idWZmZXIsXG4gICAgICAgIHdpZHRoOiByZXN1bHQud2lkdGgsXG4gICAgICAgIGhlaWdodDogcmVzdWx0LmhlaWdodCxcbiAgICAgICAgY2VsbENvdW50OiByZXN1bHQuY2VsbENvdW50LFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9LCBbcmVzdWx0LmJ1ZmZlci5idWZmZXJdKTtcbn1cblxuZnVuY3Rpb24gc2VuZENlbGxJbmZvKHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmICghY2VsbCB8fCAhY2VsbC5wbGFudCB8fCAhY2VsbC5wbGFudC5nZW5vbWUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBsYW50ID0gY2VsbC5wbGFudDtcbiAgICAgICAgY29uc3QgcnVsZXMgPSBzaW11bGF0aW9uLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUpO1xuXG4gICAgICAgIC8vIFVzZSB0aGUgY29ycmVjdCBzdGF0ZSBkZXBlbmRpbmcgb24gaW50ZXJwcmV0ZXIgdHlwZVxuICAgICAgICBsZXQgY2VsbFN0YXRlO1xuICAgICAgICBpZiAoc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyID09PSBcImJsb2NrXCIpIHtcbiAgICAgICAgICAgIGNlbGxTdGF0ZSA9IHBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsU3RhdGUgPSBwbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZWlnaGJvdXJob29kID0gcGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgY29uc3QgZW5lcmdpc2VkID0gY2VsbC5lbmVyZ2lzZWQ7XG5cbiAgICAgICAgLy8gU2VyaWFsaXplIHJ1bGVzIGFzIHN0cnVjdHVyZWQgb2JqZWN0cyBmb3IgcmljaCBVSSByZW5kZXJpbmdcbiAgICAgICAgY29uc3Qgc2VyaWFsaXplZFJ1bGVzID0gcnVsZXMubWFwKChyLCBpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gci5tYXRjaGVzKGNlbGxTdGF0ZSk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb25TdHIgPSByLmFjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgY29uc3QgaXNEaXYgPSBhY3Rpb25TdHIuc3RhcnRzV2l0aChcImRpdmlkZVwiKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyxcbiAgICAgICAgICAgICAgICBzdGF0ZTogci5zdGF0ZSxcbiAgICAgICAgICAgICAgICBlcU1hc2s6IHIuZXFNYXNrLFxuICAgICAgICAgICAgICAgIGFjdGlvblR5cGU6IGlzRGl2ID8gXCJkaXZpZGVcIiA6IGFjdGlvblN0cixcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGlzRGl2ID8gci5hY3Rpb24uZ2V0RGlyZWN0aW9uKCkgOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdSdWxlSW5kZXggPSBzZXJpYWxpemVkUnVsZXMuZmluZEluZGV4KHIgPT4gci5tYXRjaGVzKTtcblxuICAgICAgICBjb25zdCBkZWF0aCA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3JcbiAgICAgICAgKTtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiBcImNlbGxJbmZvXCIsXG4gICAgICAgICAgICBmb3VuZDogdHJ1ZSxcbiAgICAgICAgICAgIGNlbGxTdHI6IGNlbGwudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIG5laWdoYm91cmhvb2QsXG4gICAgICAgICAgICBlbmVyZ2lzZWQsXG4gICAgICAgICAgICBjZWxsU3RhdGUsXG4gICAgICAgICAgICBtYXRjaGluZ1J1bGVJbmRleCxcbiAgICAgICAgICAgIGRlYXRoOiBKU09OLnN0cmluZ2lmeShkZWF0aCksXG4gICAgICAgICAgICBnZW5vbWVMZW5ndGg6IHBsYW50Lmdlbm9tZS5sZW5ndGgsXG4gICAgICAgICAgICBtdXRFeHA6IHBsYW50Lmdlbm9tZS5tdXRfZXhwLFxuICAgICAgICAgICAgcnVsZXM6IHNlcmlhbGl6ZWRSdWxlcyxcbiAgICAgICAgICAgIGludGVycHJldGVyVHlwZTogc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyLFxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQge3JhbmRvbUludH0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1BsYW50fSBmcm9tIFwiLi9wbGFudC5qc1wiO1xuaW1wb3J0IHsgQ2VsbCB9IGZyb20gXCIuL2NlbGwuanNcIjtcblxuY2xhc3MgV29ybGQge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMuY2VsbHMgPSBbXTtcbiAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgd29ybGQgbGF0dGljZSB0byBhbGwgbnVsbHNcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy53aWR0aDsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMuY2VsbHMucHVzaChbXSk7XG4gICAgICAgICAgICBmb3IodmFyIGo9MDsgajx0aGlzLmhlaWdodDsgaisrKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2ldW2pdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxhbnRzID0gW107XG4gICAgICAgIHRoaXMuY2VsbENvdW50ID0gMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyBhcnJheSBvZiB4IHBvc2l0aW9ucyBhdCB5PTAgd2hlcmUgbm8gY2VsbCBleGlzdHNcbiAgICAgKi9cbiAgICBnZXRGbG9vclNwYWNlKCl7XG4gICAgICAgIHZhciBlbXB0eVNwYWNlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLndpZHRoOyBpKyspe1xuICAgICAgICAgICAgaWYodGhpcy5jZWxsc1tpXVswXSA9PT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZW1wdHlTcGFjZXMucHVzaChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZW1wdHlTcGFjZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RyYXRlZ2llcyBmb3Igc293aW5nIGEgc2VlZCBvbiB0aGUgd29ybGQgZmxvb3JcbiAgICAgKiBAcGFyYW0geyp9IGdlbm9tZSB0aGUgZ2Vub21lIHVzZWQgYnkgdGhlIG5ldyBzZWVkXG4gICAgICogQHBhcmFtIHsqfSBuZWFyWCBpZiBub3QgbnVsbCwgdHJ5IHRvIHNvdyBhIHNlZWQgYXMgY2xvc2VcbiAgICAgKiBhcyBwb3NzaWJsZSB0byB0aGlzIGxvY2F0aW9uXG4gICAgICogXG4gICAgICogQHJldHVybiB0cnVlIGlmIGEgc2VlZCB3YXMgc3VjY2VzZnVsbHkgcGxhbnRlZCwgZmFsc2UgaWZcbiAgICAgKiB0aGVyZSB3YXMgbm8gc3BhY2UgdG8gc293IGEgc2VlZC5cbiAgICAgKi9cbiAgICBzZWVkKGdlbm9tZSwgbmVhclgpe1xuICAgICAgICAvLyBmaW5kIGEgcmFuZG9tIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBlbXB0eVNwYWNlcyA9IHRoaXMuZ2V0Rmxvb3JTcGFjZSgpO1xuICAgICAgICBpZihlbXB0eVNwYWNlcy5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobmVhclggIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdFggPSBudWxsO1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RfZGlmZiA9IHRoaXMud2lkdGg7XG4gICAgICAgICAgICBlbXB0eVNwYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHhwb3Mpe1xuICAgICAgICAgICAgICAgIHZhciBkaWZmID0gTWF0aC5hYnMobmVhclgteHBvcyk7XG4gICAgICAgICAgICAgICAgaWYoZGlmZiA8IG5lYXJlc3RfZGlmZil7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RfZGlmZiA9IGRpZmY7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RYID0geHBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc293UGxhbnQoZ2Vub21lLCBuZWFyZXN0WCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4ID0gZW1wdHlTcGFjZXNbcmFuZG9tSW50KDAsIGVtcHR5U3BhY2VzLmxlbmd0aC0xKV07XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW3hdWzBdICE9PSBudWxsKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNwYWNlIGlzIHRha2VuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc293UGxhbnQoZ2Vub21lLCB4KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc293UGxhbnQoZ2Vub21lLCB4KXtcbiAgICAgICAgeCA9IHRoaXMuZ2V0WCh4KTtcbiAgICAgICAgdmFyIHBsYW50ID0gbmV3IFBsYW50KHgsIHRoaXMsIGdlbm9tZSk7XG4gICAgICAgIHRoaXMucGxhbnRzLnB1c2gocGxhbnQpO1xuICAgICAgICB0aGlzLmFkZENlbGwocGxhbnQuY2VsbHNbMF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBwbGFudCBmcm9tIHdvcmxkIHBsYW50IGxpc3QuXG4gICAgICogUmVtb3ZlIGFsbCBjZWxscyBmcm9tIGNlbGwgZ3JpZFxuICAgICAqL1xuICAgIGtpbGxQbGFudChwbGFudCl7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMucGxhbnRzLmluZGV4T2YocGxhbnQpO1xuICAgICAgICBpZiAoaWR4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucGxhbnRzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgdGhpcy5jZWxsQ291bnQgLT0gcGxhbnQuY2VsbHMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudC5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBwbGFudC5jZWxsc1tpXTtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRYKHgpe1xuICAgICAgICBpZih4IDwgMCl7XG4gICAgICAgICAgICB4ID0gdGhpcy53aWR0aCArIHg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggJSB0aGlzLndpZHRoO1xuICAgIH1cblxuICAgIGdldENlbGwoeCwgeSl7XG4gICAgICAgIHJldHVybiB0aGlzLmNlbGxzW3RoaXMuZ2V0WCh4KV1beV07XG4gICAgfVxuXG4gICAgYWRkQ2VsbChjZWxsKXtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldID0gY2VsbDtcbiAgICAgICAgICAgIHRoaXMuY2VsbENvdW50Kys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRQaXhlbEJ1ZmZlcihjZWxsU2l6ZSl7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLndpZHRoICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGggPSB0aGlzLmhlaWdodCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBidWYgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkodyAqIGggKiA0KTtcbiAgICAgICAgY29uc3QgcGxhbnRzID0gdGhpcy5wbGFudHM7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gcGxhbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgW2Jhc2VSLCBiYXNlRywgYmFzZUJdID0gdGhpcy5nZXRCYXNlQ29sb3VyKHBsYW50KTtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtSID0gTWF0aC5yb3VuZChiYXNlUiAqIDAuNyk7XG4gICAgICAgICAgICBjb25zdCBkYXJrRyA9IE1hdGgucm91bmQoYmFzZUcgKiAwLjcpO1xuICAgICAgICAgICAgY29uc3QgZGFya0IgPSBNYXRoLnJvdW5kKGJhc2VCICogMC43KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY2VsbHMgPSBwbGFudC5jZWxscztcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gY2VsbHNbal07XG4gICAgICAgICAgICAgICAgY29uc3QgcjAgPSBjZWxsLmVuZXJnaXNlZCA/IGJhc2VSIDogZGFya1I7XG4gICAgICAgICAgICAgICAgY29uc3QgZzAgPSBjZWxsLmVuZXJnaXNlZCA/IGJhc2VHIDogZGFya0c7XG4gICAgICAgICAgICAgICAgY29uc3QgYjAgPSBjZWxsLmVuZXJnaXNlZCA/IGJhc2VCIDogZGFya0I7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgcHgwID0gY2VsbC54ICogY2VsbFNpemU7XG4gICAgICAgICAgICAgICAgY29uc3QgcHkwID0gKHRoaXMuaGVpZ2h0IC0gMSAtIGNlbGwueSkgKiBjZWxsU2l6ZTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGR5ID0gMDsgZHkgPCBjZWxsU2l6ZTsgZHkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb3dJZHggPSAocHkwICsgZHkpICogdztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZHggPSAwOyBkeCA8IGNlbGxTaXplOyBkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0JvcmRlciA9IGNlbGxTaXplID4gMSAmJiAoZHggPT09IDAgfHwgZHkgPT09IDAgfHwgZHggPT09IGNlbGxTaXplIC0gMSB8fCBkeSA9PT0gY2VsbFNpemUgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkeCA9IChyb3dJZHggKyBweDAgKyBkeCkgKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNCb3JkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4XSAgICAgPSBNYXRoLnJvdW5kKHIwICogMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBNYXRoLnJvdW5kKGcwICogMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMl0gPSBNYXRoLnJvdW5kKGIwICogMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeF0gICAgID0gcjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDFdID0gZzA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDJdID0gYjA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgM10gPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBidWZmZXI6IGJ1Ziwgd2lkdGg6IHcsIGhlaWdodDogaCwgY2VsbENvdW50OiB0aGlzLmNlbGxDb3VudCB9O1xuICAgIH1cblxuICAgIGdldEJhc2VDb2xvdXIocGxhbnQpe1xuICAgICAgICB2YXIgaSA9IHBsYW50LmNlbGxzWzBdLnggJSBjU2NhbGUubGVuZ3RoO1xuICAgICAgICByZXR1cm4gY1NjYWxlW2ldO1xuICAgIH1cbn1cblxuLy8gaHR0cDovL2NvbG9yYnJld2VyMi5vcmcvP3R5cGU9cXVhbGl0YXRpdmUmc2NoZW1lPVNldDMmbj04IOKAlCBhcyByYXcgW1IsRyxCXSB0dXBsZXNcbnZhciBjU2NhbGUgPSBbXG4gICAgWzE0MSwyMTEsMTk5XSxbMjU1LDI1NSwxNzldLFsxOTAsMTg2LDIxOF0sWzI1MSwxMjgsMTE0XSxcbiAgICBbMTI4LDE3NywyMTFdLFsyNTMsMTgwLDk4XSxbMTc5LDIyMiwxMDVdLFsyNTIsMjA1LDIyOV1cbl07XG5cblxuZXhwb3J0IHsgV29ybGQgfTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdGlkOiBtb2R1bGVJZCxcblx0XHRsb2FkZWQ6IGZhbHNlLFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuXHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4vLyB0aGUgc3RhcnR1cCBmdW5jdGlvblxuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcblx0Ly8gVGhpcyBlbnRyeSBtb2R1bGUgZGVwZW5kcyBvbiBvdGhlciBsb2FkZWQgY2h1bmtzIGFuZCBleGVjdXRpb24gbmVlZCB0byBiZSBkZWxheWVkXG5cdHZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKHVuZGVmaW5lZCwgW1widmVuZG9ycy1ub2RlX21vZHVsZXNfc2VlZHJhbmRvbV9pbmRleF9qcy1ub2RlX21vZHVsZXNfc3RhdHMtbGl0ZV9zdGF0c19qc1wiXSwgKCkgPT4gKF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9zaW11bGF0aW9uLndvcmtlci5qc1wiKSkpXG5cdF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8oX193ZWJwYWNrX2V4cG9ydHNfXyk7XG5cdHJldHVybiBfX3dlYnBhY2tfZXhwb3J0c19fO1xufTtcblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5hbWREID0gZnVuY3Rpb24gKCkge1xuXHR0aHJvdyBuZXcgRXJyb3IoJ2RlZmluZSBjYW5ub3QgYmUgdXNlZCBpbmRpcmVjdCcpO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmFtZE8gPSB7fTsiLCJ2YXIgZGVmZXJyZWQgPSBbXTtcbl9fd2VicGFja19yZXF1aXJlX18uTyA9IChyZXN1bHQsIGNodW5rSWRzLCBmbiwgcHJpb3JpdHkpID0+IHtcblx0aWYoY2h1bmtJZHMpIHtcblx0XHRwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG5cdFx0Zm9yKHZhciBpID0gZGVmZXJyZWQubGVuZ3RoOyBpID4gMCAmJiBkZWZlcnJlZFtpIC0gMV1bMl0gPiBwcmlvcml0eTsgaS0tKSBkZWZlcnJlZFtpXSA9IGRlZmVycmVkW2kgLSAxXTtcblx0XHRkZWZlcnJlZFtpXSA9IFtjaHVua0lkcywgZm4sIHByaW9yaXR5XTtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIG5vdEZ1bGZpbGxlZCA9IEluZmluaXR5O1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGRlZmVycmVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIFtjaHVua0lkcywgZm4sIHByaW9yaXR5XSA9IGRlZmVycmVkW2ldO1xuXHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgY2h1bmtJZHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdGlmICgocHJpb3JpdHkgJiAxID09PSAwIHx8IG5vdEZ1bGZpbGxlZCA+PSBwcmlvcml0eSkgJiYgT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5PKS5ldmVyeSgoa2V5KSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXy5PW2tleV0oY2h1bmtJZHNbal0pKSkpIHtcblx0XHRcdFx0Y2h1bmtJZHMuc3BsaWNlKGotLSwgMSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmdWxmaWxsZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYocHJpb3JpdHkgPCBub3RGdWxmaWxsZWQpIG5vdEZ1bGZpbGxlZCA9IHByaW9yaXR5O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZihmdWxmaWxsZWQpIHtcblx0XHRcdGRlZmVycmVkLnNwbGljZShpLS0sIDEpXG5cdFx0XHR2YXIgciA9IGZuKCk7XG5cdFx0XHRpZiAociAhPT0gdW5kZWZpbmVkKSByZXN1bHQgPSByO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmYgPSB7fTtcbi8vIFRoaXMgZmlsZSBjb250YWlucyBvbmx5IHRoZSBlbnRyeSBjaHVuay5cbi8vIFRoZSBjaHVuayBsb2FkaW5nIGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIGNodW5rc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5lID0gKGNodW5rSWQpID0+IHtcblx0cmV0dXJuIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uZikucmVkdWNlKChwcm9taXNlcywga2V5KSA9PiB7XG5cdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mW2tleV0oY2h1bmtJZCwgcHJvbWlzZXMpO1xuXHRcdHJldHVybiBwcm9taXNlcztcblx0fSwgW10pKTtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzIGFuZCBjaHVua3MgdGhhdCB0aGUgZW50cnlwb2ludCBkZXBlbmRzIG9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnUgPSAoY2h1bmtJZCkgPT4ge1xuXHQvLyByZXR1cm4gdXJsIGZvciBmaWxlbmFtZXMgYmFzZWQgb24gdGVtcGxhdGVcblx0cmV0dXJuIFwiXCIgKyBjaHVua0lkICsgXCIuYnVuZGxlLmpzXCI7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubm1kID0gKG1vZHVsZSkgPT4ge1xuXHRtb2R1bGUucGF0aHMgPSBbXTtcblx0aWYgKCFtb2R1bGUuY2hpbGRyZW4pIG1vZHVsZS5jaGlsZHJlbiA9IFtdO1xuXHRyZXR1cm4gbW9kdWxlO1xufTsiLCJ2YXIgc2NyaXB0VXJsO1xuaWYgKF9fd2VicGFja19yZXF1aXJlX18uZy5pbXBvcnRTY3JpcHRzKSBzY3JpcHRVcmwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcubG9jYXRpb24gKyBcIlwiO1xudmFyIGRvY3VtZW50ID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmRvY3VtZW50O1xuaWYgKCFzY3JpcHRVcmwgJiYgZG9jdW1lbnQpIHtcblx0aWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgJiYgZG9jdW1lbnQuY3VycmVudFNjcmlwdC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdTQ1JJUFQnKVxuXHRcdHNjcmlwdFVybCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuXHRpZiAoIXNjcmlwdFVybCkge1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG5cdFx0aWYoc2NyaXB0cy5sZW5ndGgpIHtcblx0XHRcdHZhciBpID0gc2NyaXB0cy5sZW5ndGggLSAxO1xuXHRcdFx0d2hpbGUgKGkgPiAtMSAmJiAoIXNjcmlwdFVybCB8fCAhL15odHRwKHM/KTovLnRlc3Qoc2NyaXB0VXJsKSkpIHNjcmlwdFVybCA9IHNjcmlwdHNbaS0tXS5zcmM7XG5cdFx0fVxuXHR9XG59XG4vLyBXaGVuIHN1cHBvcnRpbmcgYnJvd3NlcnMgd2hlcmUgYW4gYXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCB5b3UgbXVzdCBzcGVjaWZ5IGFuIG91dHB1dC5wdWJsaWNQYXRoIG1hbnVhbGx5IHZpYSBjb25maWd1cmF0aW9uXG4vLyBvciBwYXNzIGFuIGVtcHR5IHN0cmluZyAoXCJcIikgYW5kIHNldCB0aGUgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gdmFyaWFibGUgZnJvbSB5b3VyIGNvZGUgdG8gdXNlIHlvdXIgb3duIGxvZ2ljLlxuaWYgKCFzY3JpcHRVcmwpIHRocm93IG5ldyBFcnJvcihcIkF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xuc2NyaXB0VXJsID0gc2NyaXB0VXJsLnJlcGxhY2UoL15ibG9iOi8sIFwiXCIpLnJlcGxhY2UoLyMuKiQvLCBcIlwiKS5yZXBsYWNlKC9cXD8uKiQvLCBcIlwiKS5yZXBsYWNlKC9cXC9bXlxcL10rJC8sIFwiL1wiKTtcbl9fd2VicGFja19yZXF1aXJlX18ucCA9IHNjcmlwdFVybDsiLCIvLyBubyBiYXNlVVJJXG5cbi8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgY2h1bmtzXG4vLyBcIjFcIiBtZWFucyBcImFscmVhZHkgbG9hZGVkXCJcbnZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG5cdFwic3JjX3NpbXVsYXRpb25fd29ya2VyX2pzXCI6IDFcbn07XG5cbi8vIGltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZ1xudmFyIGluc3RhbGxDaHVuayA9IChkYXRhKSA9PiB7XG5cdHZhciBbY2h1bmtJZHMsIG1vcmVNb2R1bGVzLCBydW50aW1lXSA9IGRhdGE7XG5cdGZvcih2YXIgbW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8obW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcblx0XHR9XG5cdH1cblx0aWYocnVudGltZSkgcnVudGltZShfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblx0d2hpbGUoY2h1bmtJZHMubGVuZ3RoKVxuXHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkcy5wb3AoKV0gPSAxO1xuXHRwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbihkYXRhKTtcbn07XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmYuaSA9IChjaHVua0lkLCBwcm9taXNlcykgPT4ge1xuXHQvLyBcIjFcIiBpcyB0aGUgc2lnbmFsIGZvciBcImFscmVhZHkgbG9hZGVkXCJcblx0aWYoIWluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdGlmKHRydWUpIHsgLy8gYWxsIGNodW5rcyBoYXZlIEpTXG5cdFx0XHRpbXBvcnRTY3JpcHRzKF9fd2VicGFja19yZXF1aXJlX18ucCArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSk7XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgY2h1bmtMb2FkaW5nR2xvYmFsID0gc2VsZltcIndlYnBhY2tDaHVua2xpbmRldm9sXCJdID0gc2VsZltcIndlYnBhY2tDaHVua2xpbmRldm9sXCJdIHx8IFtdO1xudmFyIHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uID0gY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2guYmluZChjaHVua0xvYWRpbmdHbG9iYWwpO1xuY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2ggPSBpbnN0YWxsQ2h1bms7XG5cbi8vIG5vIEhNUlxuXG4vLyBubyBITVIgbWFuaWZlc3QiLCJ2YXIgbmV4dCA9IF9fd2VicGFja19yZXF1aXJlX18ueDtcbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18uZShcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3NlZWRyYW5kb21faW5kZXhfanMtbm9kZV9tb2R1bGVzX3N0YXRzLWxpdGVfc3RhdHNfanNcIikudGhlbihuZXh0KTtcbn07IiwiIiwiLy8gcnVuIHN0YXJ0dXBcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy54KCk7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=