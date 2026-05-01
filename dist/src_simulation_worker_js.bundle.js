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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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OztXQ1BELHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7OztXQ05BO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7V0NKQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxrQzs7Ozs7V0NsQkE7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGFBQWE7V0FDYjtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7O1dBRUE7O1dBRUEsa0I7Ozs7O1dDcENBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1VFSEE7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2xpbmRldm9sL2lnbm9yZWR8L1VzZXJzL21hdHQvbGluZGV2b2wtanMvbm9kZV9tb2R1bGVzL3NlZWRyYW5kb218Y3J5cHRvIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2FjdGlvbnMuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvY2VsbC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9nZW5vbWUuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvcGxhbnQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvcmFuZG9tLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbWRhdGEuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW11bGF0aW9uLndvcmtlci5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy93b3JsZC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvYW1kIGRlZmluZSIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvYW1kIG9wdGlvbnMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2NodW5rIGxvYWRlZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2Vuc3VyZSBjaHVuayIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZ2V0IGphdmFzY3JpcHQgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvcHVibGljUGF0aCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9zdGFydHVwIGNodW5rIGRlcGVuZGVuY2llcyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLyogKGlnbm9yZWQpICovIiwiY29uc3QgTkVJR0hCT1VSSE9PRCA9IFtbLTEsLTFdLCBbMCwtMV0sIFsxLC0xXSwgWy0xLDBdLCBbMSwwXSwgWy0xLDFdLCBbMCwxXSwgWzEsMV1dO1xuY29uc3QgTVVUX0lOQ1JFTUVOVCA9IDAuMDAxO1xuXG5jbGFzcyBBY3Rpb257XG4gICAgY29uc3RydWN0b3IoYWN0aW9uQ29kZSl7XG4gICAgICAgIHRoaXMuY29kZSA9IGFjdGlvbkNvZGU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBleGVjdXRlKGNlbGwpe1xuICAgICAgICAvLyBhY3Rpb25zIGFyZSB0eXBpY2FsbHkgb25seSBjYXJyaWVkIG91dCBpZiB0aGUgY2VsbCBoYXMgZW5lcmd5XG4gICAgICAgIC8vIGFuZCB0aGUgY2VsbCBsb3NlcyBlbmVyZ3kgYXMgYSByZXN1bHQuXG4gICAgICAgIGlmIChjZWxsLmVuZXJnaXNlZCl7XG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9IHRoaXMuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgICAgICBjZWxsLmVuZXJnaXNlZCA9ICFzdWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cblxuICAgIGRvQWN0aW9uKGNlbGwpe1xuXG4gICAgfVxufVxuXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBBY3Rpb257XG5cbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgLy8gdGhlIDIgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBvZiB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgLy8gZGV0ZXJtaW5lcyB3aGljaCBkaXJlY3Rpb24gdGhlIGRpdmlkZSBhY3Rpb24gaXMgZm9yXG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICAgICAgY2VsbC5wbGFudC5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICB9XG5cbiAgICBnZXREaXJlY3Rpb24oKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMDExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICB2YXIgZGlyZWN0aW9uQ29kZSA9IHRoaXMuY29kZSAmIDc7XG4gICAgICAgIHJldHVybiBORUlHSEJPVVJIT09EW2RpcmVjdGlvbkNvZGVdO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgZGl2aWRlICR7dGhpcy5nZXREaXJlY3Rpb24oKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlUGx1cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgKz0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0K1wiO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlTWludXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwIC09IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dC1cIjtcbiAgICB9XG59XG5cbmNsYXNzIEZseWluZ1NlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwiZmx5aW5nc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgTG9jYWxTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCksIGNlbGwueCk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibG9jYWxzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBTdGF0ZUJpdE4gZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCkge1xuICAgICAgICBjZWxsLm5leHRJbnRlcm5hbFN0YXRlID0gY2VsbC5uZXh0SW50ZXJuYWxTdGF0ZSAmIE1hdGgucG93KDIsIHRoaXMuZ2V0TnRoQml0KCkpO1xuICAgICAgICAvLyB0aGlzIGFjdGlvbiBkb2VzIG5vdCBjb25zdW1lIGVuZXJneVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZ2V0TnRoQml0KCl7XG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIGNvcnJlY3QgYml0c1xuICAgICAgICAvLyAmIHdpdGggMDAwMDExMTEgdG8gbWFzayBvdXQgbGVhc3Qgc2lnIGJpdHNcbiAgICAgICAgcmV0dXJuIHRoaXMuY29kZSAmIDE1O1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgU3RhdGVCaXQgJHt0aGlzLmdldE50aEJpdCgpfWA7XG4gICAgfVxufVxuXG5jbGFzcyBBY3Rpb25NYXAge1xuXG4gICAgY29uc3RydWN0b3IobWFwcGluZyl7XG4gICAgICAgIHRoaXMubWFwcGluZyA9IG1hcHBpbmc7XG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IFtEaXZpZGUsIEZseWluZ1NlZWQsIExvY2FsU2VlZCwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIFN0YXRlQml0Tl07XG4gICAgfVxuXG4gICAgZ2V0QWN0aW9uKGFjdGlvbkNvZGUpe1xuICAgICAgICB2YXIgbWFwcGluZ0NvdW50ID0gMDtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5tYXBwaW5nLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG1hcHBpbmdDb3VudCArPSB0aGlzLm1hcHBpbmdbaV07XG4gICAgICAgICAgICBpZiAoYWN0aW9uQ29kZSA8IG1hcHBpbmdDb3VudCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmFjdGlvbnNbaV0oYWN0aW9uQ29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgYEFjdGlvbiBjb2RlICR7YWN0aW9uQ29kZX0gZG9lcyBub3QgbWFwIHRvIGFuIGFjdGlvbmA7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7RGl2aWRlLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgTG9jYWxTZWVkLCBGbHlpbmdTZWVkLCBBY3Rpb25NYXAsIE5FSUdIQk9VUkhPT0R9OyIsIlxuY2xhc3MgQ2VsbHtcbiAgICBjb25zdHJ1Y3RvcihwbGFudCwgeCwgeSl7XG4gICAgICAgIHRoaXMucGxhbnQgPSBwbGFudDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGdldCBlbmVyZ2lzZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmVyZ2lzZWQ7XG4gICAgfVxuXG4gICAgc2V0IGVuZXJnaXNlZCh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fZW5lcmdpc2VkID09PSB2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucGxhbnQpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoKXtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgsIHgsIHksIHNpemUsIGNvbG91cil7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvdXI7XG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgLy9jdHguc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYENlbGwgYXQgKCR7dGhpcy54fSwgJHt0aGlzLnl9KSBlbmVyZ3k6ICR7dGhpcy5lbmVyZ2lzZWR9YDtcbiAgICB9XG59XG5cbmV4cG9ydCB7Q2VsbH07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtBY3Rpb25NYXB9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgQnl0ZUFycmF5IGV4dGVuZHMgQXJyYXl7XG5cbiAgICBjb25zdHJ1Y3RvcihsZW5ndGg9MCwgaW5pdGlhbF9tdXRfZXhwPTApe1xuICAgICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgICB0aGlzLm11dF9leHAgPSBpbml0aWFsX211dF9leHA7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb20oYXJyLCBtdXRfZXhwPTApe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGFyci5sZW5ndGgsIG11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gYXJyW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXJpYWxpemUgdGhpcyBnZW5vbWUgdG8gYSBzdHJpbmc6IFwiPG11dF9leHA+OzxieXRlMD4sPGJ5dGUxPiwuLi5cIlxuICAgICAqL1xuICAgIHNlcmlhbGl6ZSgpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5tdXRfZXhwfTske0FycmF5LmZyb20odGhpcykuam9pbihcIixcIil9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXNlcmlhbGl6ZSBhIGdlbm9tZSBzdHJpbmcgcHJvZHVjZWQgYnkgc2VyaWFsaXplKCkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm5zIHtCeXRlQXJyYXl9XG4gICAgICovXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKHN0cil7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gc3RyLnRyaW0oKS5zcGxpdChcIjtcIik7XG4gICAgICAgIGNvbnN0IG11dF9leHAgPSBwYXJzZUZsb2F0KHBhcnRzWzBdKTtcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBwYXJ0c1sxXS5zcGxpdChcIixcIikubWFwKE51bWJlcik7XG4gICAgICAgIHJldHVybiBCeXRlQXJyYXkuZnJvbShieXRlcywgbXV0X2V4cCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJhbmRvbShsZW5ndGgpe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSByYW5kb21JbnQoMCwgMjU1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgY29weSgpe1xuICAgICAgICB2YXIgbmV3QXJyID0gbmV3IEJ5dGVBcnJheSh0aGlzLmxlbmd0aCwgdGhpcy5tdXRfZXhwKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBuZXdBcnJbaV0gPSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdBcnI7XG4gICAgfVxuXG59XG5cbmNsYXNzIE11dGF0b3J7XG4gICAgY29uc3RydWN0b3IocHJvYiwgcHJvYl9yZXBsYWNlbWVudCwgcHJvYl9pbnNlcnRpb24sIHByb2JfZGVsZXRpb24sIHByb2JfZHVwLCByZXBsYWNlbWVudF9tb2RlLCB1bml0cyl7XG4gICAgICAgIHRoaXMucHJvYiA9IHByb2I7XG4gICAgICAgIHRoaXMucFIgPSBwcm9iX3JlcGxhY2VtZW50O1xuICAgICAgICB0aGlzLnBJID0gcHJvYl9pbnNlcnRpb247XG4gICAgICAgIHRoaXMucEQgPSBwcm9iX2RlbGV0aW9uO1xuICAgICAgICB0aGlzLnBEdXAgPSBwcm9iX2R1cDtcbiAgICAgICAgdGhpcy5wUm1vZGUgPSByZXBsYWNlbWVudF9tb2RlOyAgXG4gICAgICAgIHRoaXMudW5pdHMgPSB1bml0cztcbiAgICB9XG5cbiAgICBtdXRhdGUoZ2Vub21lKXtcbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBSLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlKGdlbm9tZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBJLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5pbnNlcnQoZ2Vub21lKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEQsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShnZW5vbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbVByb2IocCwgZXhwKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbVByb2IocCAqIE1hdGgucG93KCB0aGlzLnByb2IsIGV4cCkpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBzd2l0Y2godGhpcy5wUm1vZGUpe1xuICAgICAgICBjYXNlIFwiYnl0ZXdpc2VcIjpcbiAgICAgICAgICAgIGdlbm9tZVtpXSA9IHRoaXMucmFuZG9tQ2hhcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJiaXR3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSBnZW5vbWVbaV0gXiBNYXRoLnBvdygyLCByYW5kb21JbnQoMCwgNykpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbXV0YXRpb24gcmVwbGFjZW1lbnQgbW9kZTogJHt0aGlzLnBSbW9kZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBpbnNlcnQoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAwLCB0aGlzLnJhbmRvbUNoYXIoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZWxldGUoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJhbmRvbUNoYXIoKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCAyNTUpO1xuICAgIH1cblxuICAgIHJhbmRvbVBvcyhnZW5vbWUpe1xuICAgICAgICByZXR1cm4gcmFuZG9tSW50KDAsIGdlbm9tZS5sZW5ndGgtMSk7XG4gICAgfVxufVxuXG5cblxuY2xhc3MgUnVsZSB7XG4gICAgY29uc3RydWN0b3IoZXFNYXNrLCBzdGF0ZSwgYWN0aW9uKXtcbiAgICAgICAgdGhpcy5lcU1hc2sgPSBlcU1hc2s7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBhY3Rpb247XG4gICAgfVxuXG4gICAgbWF0Y2hlcyhzdGF0ZSl7XG4gICAgICAgIHZhciBlcVN0YXRlID0gc3RhdGUgJiB0aGlzLmVxTWFzaztcbiAgICAgICAgcmV0dXJuIGVxU3RhdGUgPT09IHRoaXMuc3RhdGU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuc3RhdGV9IC0+ICR7dGhpcy5hY3Rpb259YDtcbiAgICB9XG59XG5cbmNsYXNzIEdlbm9tZUludGVycHJldGVye1xuICAgIC8qKlxuICAgICAqIE1ldGhvZHMgdGhhdCBkZWNvZGUgZ2Vub21lcyBpbnRvIHJ1bGVzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWFwcGluZyl7XG4gICAgICAgIHRoaXMubWFwcGluZyA9IG5ldyBBY3Rpb25NYXAobWFwcGluZyk7XG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuXG4gICAgfVxufVxuXG5jbGFzcyBCbG9ja0ludGVycHJldGVyIGV4dGVuZHMgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG4gICAgICAgIHZhciBydWxlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrPTIpe1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMubWFwcGluZy5nZXRBY3Rpb24oYnl0ZWFycmF5W2krMV0pO1xuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZSgyNTUsIGJ5dGVhcnJheVtpXSwgYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ1bGVzO1xuICAgIH1cbn1cblxuY2xhc3MgUHJvbW90b3JJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgdmFyIGdlbmVzID0gW107XG4gICAgICAgIHZhciBnZW5lID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgYnl0ZWFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjID0gYnl0ZWFycmF5W2ldO1xuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDYpID09PSBiaXRTZXQoYywgNykpe1xuICAgICAgICAgICAgICAgIC8vIG9wZXJhdG9yXG4gICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihiaXRTZXQoYywgNykpe1xuICAgICAgICAgICAgICAgIC8vIHByb21vdG9yXG4gICAgICAgICAgICAgICAgZ2VuZSA9IFtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgaWYoYml0U2V0KGMsIDYpKXtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGVybWluYXRvclxuICAgICAgICAgICAgICAgICAgICBpZihnZW5lLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVzLnB1c2goZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lID0gW107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBnZW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGdlbmUpe1xuICAgICAgICAgICAgLy8gZXh0cmFjdCA2IGxlYXN0IHNpZyBiaXRzIGZyb20gdGVybWluYXRvciBhcyB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgICAgIHZhciBhY3Rpb25Db2RlID0gZ2VuZVtnZW5lLmxlbmd0aC0xXSAmIChNYXRoLnBvdygyLCA2KSAtIDEpO1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMubWFwcGluZy5nZXRBY3Rpb24oYWN0aW9uQ29kZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHRha2UgaW5mb3JtYXRpb24gZnJvbSBvcGVyYXRvcnMgdG8gY3JlYXRlIHN0YXRlIG1hc2tcbiAgICAgICAgICAgIHZhciBtYXNrID0gMDtcbiAgICAgICAgICAgIHZhciBlcU1hc2sgPSAwOyAvLyBzcGVjaWZpZWQgd2hpY2ggYml0cyBjb250cmlidXRlIHRvIHRoZSBzdGF0ZSBtYXNrXG4gICAgICAgICAgICBmb3IodmFyIGk9MTsgaTxnZW5lLmxlbmd0aC0xOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyA0IGxlYXN0IHNpZyBiaXRzIGRldGVybWluZSB0aGUgbWFzayBpbmRleFxuICAgICAgICAgICAgICAgIHZhciBtYXNrQml0ID0gZ2VuZVtpXSAmIChNYXRoLnBvdygyLCA0KSAtIDEpO1xuXG4gICAgICAgICAgICAgICAgLy8gZGV0ZXJtaW5lcyBpZiB0aGUgbWFzayBhdCB0aGlzIGluZGV4IGlzIHNldCB0byAxIG9yIDBcbiAgICAgICAgICAgICAgICB2YXIgYml0U3RhdGUgPSAoZ2VuZVtpXSAmIE1hdGgucG93KDIsIDQpKSA+PiA0O1xuICAgICAgICAgICAgICAgIG1hc2sgKz0gTWF0aC5wb3coMiwgbWFza0JpdCkqYml0U3RhdGU7XG5cbiAgICAgICAgICAgICAgICBlcU1hc2sgKz0gTWF0aC5wb3coMiwgbWFza0JpdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydWxlcy5wdXNoKG5ldyBSdWxlKGVxTWFzaywgbWFzaywgYWN0aW9uKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gcnVsZXM7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBiaXRTZXQoYnl0ZSwgaSl7XG4gICAgcmV0dXJuIChieXRlICYgTWF0aC5wb3coMiwgaSkpID4+IGk7XG59XG5cbmV4cG9ydCB7Qnl0ZUFycmF5LCBCbG9ja0ludGVycHJldGVyLCBQcm9tb3RvckludGVycHJldGVyLCBNdXRhdG9yfTsiLCJpbXBvcnQge3JhbmRvbUludCwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge0NlbGx9IGZyb20gXCIuL2NlbGwuanNcIjtcbmltcG9ydCB7TkVJR0hCT1VSSE9PRH0gZnJvbSBcIi4vYWN0aW9ucy5qc1wiO1xuXG5jbGFzcyBQbGFudHtcbiAgICBjb25zdHJ1Y3Rvcih4LCB3b3JsZCwgZ2Vub21lLCB1c2VJbnRlcm5hbFN0YXRlPWZhbHNlKSB7XG4gICAgICAgIHRoaXMud29ybGQgPSB3b3JsZDtcbiAgICAgICAgdGhpcy5lbmVyZ2lzZWRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuY2VsbHMgPSBbbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCAwKV07XG4gICAgICAgIHRoaXMuZ2Vub21lID0gZ2Vub21lO1xuICAgICAgICB0aGlzLnVzZUludGVybmFsU3RhdGUgPSB1c2VJbnRlcm5hbFN0YXRlO1xuICAgIH1cblxuICAgIGdldE5laWdoYm91cmhvb2QoY2VsbCl7XG4gICAgICAgIC8vIFJldHVybiB0aGUgbmVpZ2hib3VyaG9vZCBtYXNrXG4gICAgICAgIHZhciBtYXNrID0gMDtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8TkVJR0hCT1VSSE9PRC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgcG9zID0gTkVJR0hCT1VSSE9PRFtpXTtcbiAgICAgICAgICAgIHZhciB4ID0gY2VsbC54ICsgcG9zWzBdO1xuICAgICAgICAgICAgdmFyIHkgPSBjZWxsLnkgKyBwb3NbMV07XG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgdmFyIHdvcmxkUG9zID0gdGhpcy53b3JsZC5jZWxsc1t4XVt5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoKGVycm9yKXtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3b3JsZFBvcyBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgICAgIG1hc2sgPSBtYXNrIHwgTWF0aC5wb3coMiwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hc2s7XG4gICAgfVxuXG4gICAgZ2V0U3RhdGUoY2VsbCl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldE5laWdoYm91cmhvb2QoY2VsbCkgfCBjZWxsLmludGVybmFsU3RhdGUgfCAoTWF0aC5wb3coMiwgMTUpICogKCBjZWxsLmVuZXJnaXNlZCA/IDEgOiAwKSk7XG4gICAgfVxuXG4gICAgZ3Jvdygpe1xuICAgICAgICB0aGlzLmNlbGxzLmZvckVhY2goZnVuY3Rpb24oY2VsbCl7XG4gICAgICAgICAgICAvLyA1MCUgY2hhbmNlIHRvIGdyb3dcbiAgICAgICAgICAgIGlmKHJhbmRvbVByb2IoMC44KSl7XG4gICAgICAgICAgICAgICAgdmFyIHNwYWNlcyA9IHRoaXMuZ2V0R3Jvd0RpcmVjdGlvbihjZWxsKTtcbiAgICAgICAgICAgICAgICBpZihzcGFjZXMubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSBzcGFjZXNbcmFuZG9tSW50KDAsIHNwYWNlcy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdGlvbiAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHcm93IHRoZSBwbGFudCBieSBvbmUgY2VsbCBpZiBwb3NzaWJsZVxuICAgICAqIEBwYXJhbSB7Kn0gY2VsbCB0aGUgY2VsbCB0byBncm93IGZyb21cbiAgICAgKiBAcGFyYW0geyp9IGRpcmVjdGlvbiB0aGUgZGlyZWN0aW9uIHRvIGdyb3cgaW5cbiAgICAgKi9cbiAgICBncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKXtcbiAgICAgICAgdmFyIHggPSBjZWxsLngrZGlyZWN0aW9uWzBdLCB5ID0gY2VsbC55K2RpcmVjdGlvblsxXTtcbiAgICAgICAgLy8gY2hlY2sgaWYgc3BhY2UgaXMgY2xlYXJcbiAgICAgICAgdmFyIHNwYWNlID0gdGhpcy53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgICAgICBpZiAoc3BhY2UgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNwYWNlIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICBpZiAoc3BhY2UucGxhbnQgPT09IHRoaXMpe1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRoaXMgcGxhbnQgd2lsbCBraWxsIHRoZSBvdGhlclxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb2JhYmlsaXR5Li4uXG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKHNwYWNlLnBsYW50LmdldEtpbGxQcm9iYWJpbGl0eSgpKSl7XG4gICAgICAgICAgICAgICAgLy8gYXR0YWNrIHN1Y2NlZWRlZC4gS2lsbCBjb21wZXRpdG9yIGFuZCBjb250aW51ZSB3aXRoIGdyb3d0aFxuICAgICAgICAgICAgICAgIHRoaXMud29ybGQua2lsbFBsYW50KHNwYWNlLnBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBmYWlsZWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICAvLyBncm93IGNlbGwgaW4gdG8gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIG5ld19jZWxsID0gbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCB5KTtcbiAgICAgICAgdGhpcy5jZWxscy5wdXNoKG5ld19jZWxsKTtcbiAgICAgICAgdGhpcy53b3JsZC5hZGRDZWxsKG5ld19jZWxsKTtcbiAgICB9XG5cbiAgICBnZXRLaWxsUHJvYmFiaWxpdHkoKXtcbiAgICAgICAgcmV0dXJuIDEvdGhpcy5lbmVyZ2lzZWRDb3VudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgd2hldGhlciB0aGlzIHBsYW50IHNob3VsZCBkaWUuXG4gICAgICogQHBhcmFtIHt9IG5hdHVyYWxfZXhwIGV4cG9uZW50IHRvIHRoZSBudW1iZXIgb2YgY2VsbHNcbiAgICAgKiBAcGFyYW0geyp9IGVuZXJneV9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBlbmVyZ3kgcmljaCBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gbGVhbm92ZXJfZmFjdG9yIGZhY3RvciB0byB0aGUgbGVhbm92ZXIgdGVybVxuICAgICAqL1xuICAgIGdldERlYXRoUHJvYmFiaWxpdHkoZGVhdGhfZmFjdG9yLCBuYXR1cmFsX2V4cCwgZW5lcmd5X2V4cCwgbGVhbm92ZXJfZmFjdG9yKXtcbiAgICAgICAgdmFyIG51bUNlbGxzID0gdGhpcy5jZWxscy5sZW5ndGg7XG4gICAgICAgIHZhciBsZWFub3ZlckVuZXJnaXNlZCA9IDA7XG4gICAgICAgIHZhciByb290Q2VsbCA9IHRoaXMuY2VsbHNbMF07XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMuY2VsbHMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgICAgICAgICAgdmFyIGxlID0gdGhpcy53b3JsZC53aWR0aC8yIC0gKCAoKCAxLjUqdGhpcy53b3JsZC53aWR0aCApICsgY2VsbC54IC0gcm9vdENlbGwueCkgICUgdGhpcy53b3JsZC53aWR0aCk7XG4gICAgICAgICAgICBsZWFub3ZlckVuZXJnaXNlZCArPSBsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWFub3ZlckNlbGxzID0gMi8obnVtQ2VsbHMqKG51bUNlbGxzLTEpKTtcbiAgICAgICAgaWYgKGxlYW5vdmVyQ2VsbHMgPT09IEluZmluaXR5KXtcbiAgICAgICAgICAgIGxlYW5vdmVyQ2VsbHMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYW5vdmVyVGVybSA9IGxlYW5vdmVyQ2VsbHMqTWF0aC5hYnMobGVhbm92ZXJFbmVyZ2lzZWQpO1xuICAgICAgICBcbiAgICAgICAgdmFyIGRfbmF0dXJhbCA9IE1hdGgucG93KG51bUNlbGxzLCBuYXR1cmFsX2V4cCk7XG4gICAgICAgIHZhciBkX2VuZXJneSA9IE1hdGgucG93KHRoaXMuZW5lcmdpc2VkQ291bnQrMSwgZW5lcmd5X2V4cCk7XG4gICAgICAgIHZhciBkX2xlYW5vdmVyID0gbGVhbm92ZXJfZmFjdG9yKmxlYW5vdmVyVGVybTtcbiAgICAgICAgdmFyIHBEZWF0aCA9IGRlYXRoX2ZhY3RvciAqIGRfbmF0dXJhbCAqIGRfZW5lcmd5ICsgZF9sZWFub3ZlcjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwicHJvYlwiOiBwRGVhdGgsXG4gICAgICAgICAgICBcIm5hdHVyYWxcIjogZF9uYXR1cmFsLFxuICAgICAgICAgICAgXCJlbmVyZ3lcIjogZF9lbmVyZ3ksXG4gICAgICAgICAgICBcImxlYW5vdmVyXCI6IGRfbGVhbm92ZXJcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFBsYW50IH07IiwiaW1wb3J0IHNlZWRyYW5kb20gZnJvbSBcInNlZWRyYW5kb21cIjtcblxuLyoqXG4gKiBTZWVkIGFsbCBmdXR1cmUgY2FsbHMgdG8gTWF0aC5yYW5kb21cbiAqIEBwYXJhbSB7Kn0gc2VlZCBkYXRhIHRvIHVzZSB0byBzZWVkIGFsbCBmdXR1cmUgUk5HIGNhbGxzXG4gKi9cbmZ1bmN0aW9uIHNlZWRSYW5kb20oc2VlZCl7XG4gICAgc2VlZHJhbmRvbShzZWVkLCB7Z2xvYmFsOiB0cnVlfSk7XG59XG5cbi8qKlxuICogcmV0dXJucyBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgbWF4IChpbmNsdXNpdmUpXG4gKiBAcGFyYW0geyp9IG1heCBtYXhpbXVtIGludGVnZXIgdG8gZ2VuZXJhdGUgYXMgYSByYW5kb20gbnVtYmVyXG4gKi9cbmZ1bmN0aW9uIHJhbmRvbUludChtaW4sIG1heCl7XG4gICAgLy8gbm90ZTogTWF0aC5yYW5kb20gcmV0dXJucyBhIHJhbmRvbSBudW1iZXIgZXhjbHVzaXZlIG9mIDEsXG4gICAgLy8gc28gdGhlcmUgaXMgKzEgaW4gdGhlIGJlbG93IGVxdWF0aW9uIHRvIGVuc3VyZSB0aGUgbWF4aW11bVxuICAgIC8vIG51bWJlciBpcyBjb25zaWRlcmVkIHdoZW4gZmxvb3JpbmcgMC45Li4uIHJlc3VsdHMuXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG59XG5cbi8qKlxuICogRXZhbHVhdGVzIHRoZSBjaGFuY2Ugb2YgYW4gZXZlbnQgaGFwcGVuaW5nIGdpdmVuIHByb2JcbiAqIEBwYXJhbSB7Kn0gcHJvYiBmcmFjdGlvbiBiZXR3ZWVuIDAgYW5kIDEgY2hhbmNlIG9mIHRoZSBldmVudCBoYXBwZW5pbmdcbiAqIEByZXR1cm5zIHRydWUgaWYgdGhlIGV2ZW50IGhhcHBlbnMsIGZhbHNlIGlmIG5vdFxuICovXG5mdW5jdGlvbiByYW5kb21Qcm9iKHByb2Ipe1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDw9IHByb2I7XG59XG5cbmV4cG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tSW50LCByYW5kb21Qcm9ifTsiLCJpbXBvcnQgKiBhcyBzdGF0cyBmcm9tIFwic3RhdHMtbGl0ZVwiO1xuXG5mdW5jdGlvbiBsZXZlbnNodGVpbihhLCBiKSB7XG4gICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gYi5sZW5ndGg7XG4gICAgaWYgKGIubGVuZ3RoID09PSAwKSByZXR1cm4gYS5sZW5ndGg7XG4gICAgbGV0IG1hdHJpeCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGIubGVuZ3RoOyBpKyspIG1hdHJpeFtpXSA9IFtpXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBhLmxlbmd0aDsgaisrKSBtYXRyaXhbMF1bal0gPSBqO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IGIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gYS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGJbaSAtIDFdID09PSBhW2ogLSAxXSkge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqXSA9IG1hdHJpeFtpIC0gMV1baiAtIDFdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICAgICAgbWF0cml4W2kgLSAxXVtqIC0gMV0gKyAxLCAvLyBzdWJzdGl0dXRpb25cbiAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaV1baiAtIDFdICsgMSwgLy8gaW5zZXJ0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaSAtIDFdW2pdICsgMSAgLy8gZGVsZXRpb25cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hdHJpeFtiLmxlbmd0aF1bYS5sZW5ndGhdO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVBbGxlbGVFbnRyb3B5KHBsYW50cykge1xuICAgIGlmIChwbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICBjb25zdCBjb3VudHMgPSBuZXcgQXJyYXkoMjU2KS5maWxsKDApO1xuICAgIGxldCB0b3RhbCA9IDA7XG4gICAgcGxhbnRzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcC5nZW5vbWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvdW50c1twLmdlbm9tZVtpXV0rKztcbiAgICAgICAgICAgIHRvdGFsKys7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodG90YWwgPT09IDApIHJldHVybiAwO1xuICAgIGxldCBlbnRyb3B5ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgICAgIGlmIChjb3VudHNbaV0gPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gY291bnRzW2ldIC8gdG90YWw7XG4gICAgICAgICAgICBlbnRyb3B5IC09IHAgKiBNYXRoLmxvZzIocCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVudHJvcHk7XG59XG5cbmNsYXNzIFNpbURhdGF7XG5cbiAgICBjb25zdHJ1Y3RvcihzaW11bGF0aW9uKXtcbiAgICAgICAgdGhpcy5zaW0gPSBzaW11bGF0aW9uO1xuICAgICAgICB0aGlzLmRhdGEgPSB7XCJzdGVwbnVtXCI6IFtdfTtcbiAgICAgICAgdGhpcy5jb2xsZWN0b3JzID0gW1xuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBvcHVsYXRpb25cIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJ0b3RhbF9jZWxsc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLmNlbGxzLmxlbmd0aCwgMCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJlbmVyZ2lzZWRfY2VsbHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgcC5jZWxscy5maWx0ZXIoYyA9PiBjLmVuZXJnaXNlZCkubGVuZ3RoLCAwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuY2VsbHMubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbm9tZV9zaXplX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwibXV0X2V4cF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5nZW5vbWUubXV0X2V4cCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwbGFudF9oZWlnaHRfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KC4uLnAuY2VsbHMubWFwKGMgPT4gYy55KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJnZW5ldGljX2Rpc3RhbmNlX21lYW5cIiwgQXNJcywgZnVuY3Rpb24oc2ltKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGxhbnRzID0gc2ltLndvcmxkLnBsYW50cztcbiAgICAgICAgICAgICAgICBpZiAocGxhbnRzLmxlbmd0aCA8IDIpIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGxldCBzdW1EaXN0ID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgc2FtcGxlU2l6ZSA9IE1hdGgubWluKDMwLCBwbGFudHMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFpcnMgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2FtcGxlU2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAxID0gcGxhbnRzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBsYW50cy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcDIgPSBwbGFudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGxhbnRzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBpZiAocDEgIT09IHAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1EaXN0ICs9IGxldmVuc2h0ZWluKHAxLmdlbm9tZSwgcDIuZ2Vub21lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhaXJzKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhaXJzID4gMCA/IHN1bURpc3QgLyBwYWlycyA6IDA7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhbGxlbGVfZW50cm9weVwiLCBBc0lzLCBmdW5jdGlvbihzaW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsY3VsYXRlQWxsZWxlRW50cm9weShzaW0ud29ybGQucGxhbnRzKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29sbGVjdCBkYXRhIGZvciB0aGUgY3VycmVudCBzdGVwXG4gICAgICovXG4gICAgcmVjb3JkU3RlcCgpe1xuICAgICAgICB2YXIgc3RlcERhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5jb2xsZWN0b3JzLmZvckVhY2goZnVuY3Rpb24oYyl7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gYy5jb2xsZWN0KHRoaXMuc2ltKTtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oc3RlcERhdGEsIHZhbHVlcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuZGF0YVtcInN0ZXBudW1cIl0ucHVzaCh0aGlzLnNpbS5zdGVwbnVtKTtcbiAgICAgICAgaWYgKHRoaXMuZGF0YVtcInN0ZXBudW1cIl0ubGVuZ3RoID4gU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YVtcInN0ZXBudW1cIl0uc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBPYmplY3Qua2V5cyhzdGVwRGF0YSkuZm9yRWFjaChmdW5jdGlvbihrKXtcbiAgICAgICAgICAgIGlmICghKGsgaW4gdGhpcy5kYXRhKSl7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhW2tdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRhdGFba10ucHVzaChzdGVwRGF0YVtrXSk7XG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhW2tdLmxlbmd0aCA+IFNpbURhdGEuTUFYX0RBVEFfUE9JTlRTKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhW2tdLnNoaWZ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn1cblNpbURhdGEuTUFYX0RBVEFfUE9JTlRTID0gMjAwMDtcblxuY2xhc3MgQ29sbGVjdG9ye1xuICAgIGNvbnN0cnVjdG9yKG5hbWUsIHR5cGVjbHMsIGNvbGxlY3RGdW5jKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy50eXBlID0gbmV3IHR5cGVjbHMobmFtZSk7XG4gICAgICAgIHRoaXMuZnVuYyA9IGNvbGxlY3RGdW5jO1xuICAgIH1cblxuICAgIGNvbGxlY3Qoc2ltKXtcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLmZ1bmMoc2ltKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZS50cmFuc2Zvcm0oZGF0YSk7XG4gICAgfVxufVxuXG5jbGFzcyBDb2xsZWN0b3JUeXBle1xuICAgIGNvbnN0cnVjdG9yKG5hbWUpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuaW1wbGVtZW50ZWQgbWV0aG9kXCIpO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybShkYXRhKXtcbiAgICAgICAgdmFyIHZhbHVlcyA9IHRoaXMudHJhbnNmb3JtRGF0YShkYXRhKTtcbiAgICAgICAgdmFyIHRyYW5zZm9ybWVkX2RhdGEgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXModmFsdWVzKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAgICAgdHJhbnNmb3JtZWRfZGF0YVt0aGlzLm5hbWUgKyBrXSA9IHZhbHVlc1trXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1lZF9kYXRhO1xuICAgIH1cbn1cblxuY2xhc3MgQXNJcyBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIlwiOiBkYXRhfTtcbiAgICB9XG59XG5cbmNsYXNzIFN1bW1hcnkgZXh0ZW5kcyBDb2xsZWN0b3JUeXBlIHtcblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSl7XG4gICAgICAgIHJldHVybiB7XCJtaW5cIjogTWF0aC5taW4oZGF0YSksIFwibWVhblwiOiBzdGF0cy5tZWFuKGRhdGEpLCBcIm1heFwiOiBNYXRoLm1heChkYXRhKX07XG4gICAgfVxufVxuZXhwb3J0IHtTaW1EYXRhfTsiLCJpbXBvcnQge3NlZWRSYW5kb20sIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtXb3JsZH0gZnJvbSBcIi4vd29ybGQuanNcIjtcbmltcG9ydCB7Qnl0ZUFycmF5LCBCbG9ja0ludGVycHJldGVyLCBQcm9tb3RvckludGVycHJldGVyLCBNdXRhdG9yfSBmcm9tIFwiLi9nZW5vbWUuanNcIjtcblxuY2xhc3MgU2ltdWxhdGlvblBhcmFtc3tcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXM9e30pe1xuICAgICAgICB0aGlzLnJhbmRvbV9zZWVkID0gMTtcbiAgICAgICAgdGhpcy5yZWNvcmRfaW50ZXJ2YWwgPSAxMDtcbiAgICAgICAgdGhpcy5zdGVwc19wZXJfZnJhbWUgPSAxO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX2ludGVydmFsID0gMDtcbiAgICAgICAgdGhpcy5kaXN0dXJiYW5jZV9zdHJlbmd0aCA9IDAuMTtcblxuICAgICAgICB0aGlzLndvcmxkX3dpZHRoID0gMjUwO1xuICAgICAgICB0aGlzLndvcmxkX2hlaWdodCA9IDQwO1xuICAgICAgICB0aGlzLmluaXRpYWxfcG9wdWxhdGlvbiA9IDI1MDtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW5lcmd5X3Byb2IgPSAwLjU7XG5cbiAgICAgICAgLy8gZGVhdGggcGFyYW1zXG4gICAgICAgIHRoaXMuZGVhdGhfZmFjdG9yID0gMC4yO1xuICAgICAgICB0aGlzLm5hdHVyYWxfZXhwID0gMDtcbiAgICAgICAgdGhpcy5lbmVyZ3lfZXhwID0gLTIuNTtcbiAgICAgICAgdGhpcy5sZWFub3Zlcl9mYWN0b3IgPSAwLjI7XG5cbiAgICAgICAgLy8gbXV0YXRpb25zXG4gICAgICAgIHRoaXMubXV0X3JlcGxhY2VfbW9kZSA9IFwiYnl0ZXdpc2VcIjtcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZSA9IDAuMDAyO1xuICAgICAgICB0aGlzLm11dF9pbnNlcnQgPSAwLjAwMDQ7XG4gICAgICAgIHRoaXMubXV0X2RlbGV0ZSA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZmFjdG9yID0gMS41O1xuICAgICAgICB0aGlzLmluaXRpYWxfbXV0X2V4cCA9IDA7XG5cbiAgICAgICAgdGhpcy5nZW5vbWVfaW50ZXJwcmV0ZXIgPSBcImJsb2NrXCI7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoID0gNDAwO1xuXG4gICAgICAgIC8vIGRpdmlkZSwgZmx5aW5nc2VlZCwgbG9jYWxzZWVkLCBtdXQrLCBtdXQtLCBzdGF0ZWJpdFxuICAgICAgICB0aGlzLmFjdGlvbl9tYXAgPSBbMjAwLCAyMCwgMCwgMTgsIDE4LCAwXTtcblxuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHBhcmFtcyk7XG4gICAgfVxufVxuXG5jbGFzcyBTaW11bGF0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG5cbiAgICAgICAgLy8gU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIHJhbmRvbVxuICAgICAgICAvLyB0aGlzIG1ha2VzIG91dCB0ZXN0cyByZXByb2R1Y2libGUgZ2l2ZW4gdGhlIHNhbWUgc2VlZCBpcyB1c2VkXG4gICAgICAgIC8vIGluIGZ1dHVyZSBpbnB1dCBwYXJhbWV0ZXJzXG4gICAgICAgIHNlZWRSYW5kb20odGhpcy5wYXJhbXMucmFuZG9tX3NlZWQpO1xuXG4gICAgICAgIHRoaXMud29ybGQgPSBuZXcgV29ybGQodGhpcy5wYXJhbXMud29ybGRfd2lkdGgsIHRoaXMucGFyYW1zLndvcmxkX2hlaWdodCk7XG4gICAgICAgIHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgPSB0aGlzLmdldEludGVycHJldGVyKCk7XG4gICAgICAgIHRoaXMubXV0X3VuaXRzID0gMTtcbiAgICAgICAgLy8gZW5zdXJlIG11dGF0aW9uIHVuaXRzIGlzIGNvbXBhdGlibGUgd2l0aCB0aGUgaW50ZXJwcmV0ZXIgdHlwZVxuICAgICAgICBpZih0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgQmxvY2tJbnRlcnByZXRlcil7XG4gICAgICAgICAgICB0aGlzLm11dF91bml0cyA9IDI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGVwbnVtID0gMDtcbiAgICB9XG5cbiAgICBnZXRJbnRlcnByZXRlcigpe1xuICAgICAgICBzd2l0Y2ggKHRoaXMucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcil7XG4gICAgICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCbG9ja0ludGVycHJldGVyKHRoaXMucGFyYW1zLmFjdGlvbl9tYXApO1xuICAgICAgICBjYXNlIFwicHJvbW90b3JcIjpcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbW90b3JJbnRlcnByZXRlcih0aGlzLnBhcmFtcy5hY3Rpb25fbWFwKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBpbnRlcnByZXRlciAke3RoaXMucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcn1gKTtcbiAgICAgICAgfSAgXG4gICAgfVxuXG4gICAgaW5pdF9wb3B1bGF0aW9uKCl7XG4gICAgICAgIC8vIHJhbmRvbWx5IGNob29zZSBzcG90cyB0byBzZWVkIHRoZSB3b3JsZCB3aXRoXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLnBhcmFtcy5pbml0aWFsX3BvcHVsYXRpb247IGkrKyl7XG4gICAgICAgICAgICB0aGlzLm5ld1NlZWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIHBvcHVsYXRpb24gZnJvbSBhIGxpc3Qgb2Ygc2VyaWFsaXplZCBnZW5vbWUgc3RyaW5ncyxcbiAgICAgKiBkcmF3aW5nIHdpdGggcmVwbGFjZW1lbnQgdXAgdG8gaW5pdGlhbF9wb3B1bGF0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IHNlcmlhbGl6ZWRHZW5vbWVzXG4gICAgICovXG4gICAgaW5pdF9wb3B1bGF0aW9uX2Zyb21fZ2Vub21lcyhzZXJpYWxpemVkR2Vub21lcyl7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLnBhcmFtcy5pbml0aWFsX3BvcHVsYXRpb247IGkrKyl7XG4gICAgICAgICAgICBjb25zdCBzdHIgPSBzZXJpYWxpemVkR2Vub21lc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzZXJpYWxpemVkR2Vub21lcy5sZW5ndGgpXTtcbiAgICAgICAgICAgIGNvbnN0IGdlbm9tZSA9IEJ5dGVBcnJheS5kZXNlcmlhbGl6ZShzdHIpO1xuICAgICAgICAgICAgdGhpcy53b3JsZC5zZWVkKGdlbm9tZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXdTZWVkKCl7XG4gICAgICAgIC8vIGNyZWF0ZSBhIHJhbmRvbSBnZW5vbWVcbiAgICAgICAgdmFyIGdlbm9tZSA9IEJ5dGVBcnJheS5yYW5kb20odGhpcy5wYXJhbXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoKTtcbiAgICAgICAgdGhpcy53b3JsZC5zZWVkKGdlbm9tZSk7XG4gICAgfVxuXG4gICAgc3RlcCgpe1xuICAgICAgICB0aGlzLnN0ZXBudW0rKztcbiAgICAgICAgdGhpcy5zaW11bGF0ZURlYXRoKCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVMaWdodCgpO1xuICAgICAgICB0aGlzLnNpbXVsYXRlQWN0aW9ucygpO1xuICAgICAgICB0aGlzLm11dGF0ZSgpO1xuICAgIH1cblxuICAgIHNpbXVsYXRlQWN0aW9ucygpe1xuICAgICAgICB0aGlzLndvcmxkLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIHZhciBydWxlcyA9IHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIuaW50ZXJwcmV0KHBsYW50Lmdlbm9tZSk7XG4gICAgICAgICAgICBwbGFudC5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbEFjdGlvbihjZWxsLCBydWxlcyk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgY2VsbEFjdGlvbihjZWxsLCBydWxlcyl7XG4gICAgICAgIHZhciBzdGF0ZTtcbiAgICAgICAgaWYgKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBCbG9ja0ludGVycHJldGVyKXtcbiAgICAgICAgICAgIHN0YXRlID0gY2VsbC5wbGFudC5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIFByb21vdG9ySW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgc3RhdGUgPSBjZWxsLnBsYW50LmdldFN0YXRlKGNlbGwpO1xuICAgICAgICB9XG4gICAgICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSl7XG4gICAgICAgICAgICAvLyBleGVjdXRlIG9uZSBhY3Rpb24gdXNpbmcgdGhlIGZpcnN0IG1hdGNoaW5nIHJ1bGVcbiAgICAgICAgICAgIC8vIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgICAgICBydWxlLmFjdGlvbi5leGVjdXRlKGNlbGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgY2VsbC51cGRhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIG11dGF0ZSgpe1xuICAgICAgICB2YXIgbXV0YXRvciA9IG5ldyBNdXRhdG9yKHRoaXMucGFyYW1zLm11dF9mYWN0b3IsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlLCBcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLm11dF9pbnNlcnQsIHRoaXMucGFyYW1zLm11dF9kZWxldGUsIFxuICAgICAgICAgICAgMCwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2VfbW9kZSwgdGhpcy5tdXRfdW5pdHMpO1xuICAgICAgICB0aGlzLndvcmxkLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIG11dGF0b3IubXV0YXRlKHBsYW50Lmdlbm9tZSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSBlYWNoIHBsYW50J3MgY3VycmVudCBkZWF0aCBwcm9iYWJpbGl0eSB0byBzaW11bGF0ZVxuICAgICAqIHdoZXRoZXIgZWFjaCBwbGFudCBkaWVzIG9uIHRoaXMgc3RlcFxuICAgICAqL1xuICAgIHNpbXVsYXRlRGVhdGgoKXtcbiAgICAgICAgdmFyIGRlYWRfcGxhbnRzID0gW107XG4gICAgICAgIHRoaXMud29ybGQucGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgdmFyIGRlYXRoUHJvYiA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHJhbmRvbVByb2IoZGVhdGhQcm9iLnByb2IpKXtcbiAgICAgICAgICAgICAgICBkZWFkX3BsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGRlYWRfcGxhbnRzLmZvckVhY2goZnVuY3Rpb24ocGxhbnQpe1xuICAgICAgICAgICAgdGhpcy53b3JsZC5raWxsUGxhbnQocGxhbnQpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZSBsaWdodC4gU3VubGlnaHQgdHJhdmVyc2VzIGZyb20gdGhlIGNlaWxpbmcgb2YgdGhlIHdvcmxkXG4gICAgICogZG93bndhcmRzIHZlcnRpY2FsbHkuIEl0IGlzIGNhdWdodCBieSBhIHBsYW50IGNlbGwgd2l0aCBhIHByb2JhYmlsaXR5XG4gICAgICogd2hpY2ggY2F1c2VzIHRoYXQgY2VsbCB0byBiZSBlbmVyZ2lzZWQuXG4gICAgICovXG4gICAgc2ltdWxhdGVMaWdodCgpe1xuICAgICAgICBmb3IodmFyIHg9MDsgeDx0aGlzLndvcmxkLndpZHRoOyB4Kyspe1xuICAgICAgICAgICAgZm9yKHZhciB5PTA7IHk8dGhpcy53b3JsZC5oZWlnaHQ7IHkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3RoaXMud29ybGQuaGVpZ2h0LXktMV07XG4gICAgICAgICAgICAgICAgaWYoY2VsbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJhbmRvbVByb2IodGhpcy5wYXJhbXMuZW5lcmd5X3Byb2IpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQge1NpbXVsYXRpb24sIFNpbXVsYXRpb25QYXJhbXN9OyIsImltcG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc30gZnJvbSBcIi4vc2ltdWxhdGlvbi5qc1wiO1xuaW1wb3J0IHtTaW1EYXRhfSBmcm9tIFwiLi9zaW1kYXRhLmpzXCI7XG5cbmxldCBzaW11bGF0aW9uID0gbnVsbDtcbmxldCBkYXRhID0gbnVsbDtcbmxldCBydW5uaW5nID0gZmFsc2U7XG5sZXQgY2VsbFNpemUgPSA4O1xuY29uc3QgVEFSR0VUX0ZQUyA9IDYwO1xuY29uc3QgRlJBTUVfSU5URVJWQUxfTVMgPSAxMDAwIC8gVEFSR0VUX0ZQUztcbmxldCBsYXN0RnJhbWVUaW1lID0gMDtcblxuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGE7XG4gICAgc3dpdGNoIChtc2cudHlwZSkge1xuICAgIGNhc2UgXCJpbml0XCI6XG4gICAgICAgIGluaXRTaW0obXNnLnBhcmFtcywgbXNnLmdlbm9tZXMgfHwgbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgbG9vcCgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RvcFwiOlxuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGVwXCI6XG4gICAgICAgIGRvU3RlcCgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgcHVzaFN0YXRzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJnZXRDZWxsXCI6XG4gICAgICAgIHNlbmRDZWxsSW5mbyhtc2cueCwgbXNnLnkpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZGlzdHVyYlwiOlxuICAgICAgICBhcHBseURpc3R1cmJhbmNlKG1zZy5zdHJlbmd0aCk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwia2lsbENlbGxcIjpcbiAgICAgICAga2lsbENlbGxBdChtc2cueCwgbXNnLnkpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInVwZGF0ZURpc3BsYXlQYXJhbXNcIjpcbiAgICAgICAgaWYgKHNpbXVsYXRpb24gJiYgc2ltdWxhdGlvbi5wYXJhbXMpIHtcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnN0ZXBzX3Blcl9mcmFtZSA9IG1zZy5zdGVwc19wZXJfZnJhbWU7XG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5yZWNvcmRfaW50ZXJ2YWwgPSBtc2cucmVjb3JkX2ludGVydmFsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJleHBvcnRcIjpcbiAgICAgICAgZXhwb3J0R2Vub21lcygpO1xuICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBpbml0U2ltKHBhcmFtcywgaW1wb3J0ZWRHZW5vbWVzPW51bGwpIHtcbiAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgY29uc3Qgc2ltX3BhcmFtcyA9IG5ldyBTaW11bGF0aW9uUGFyYW1zKHBhcmFtcyk7XG4gICAgY2VsbFNpemUgPSBwYXJhbXMuY2VsbFNpemUgfHwgODtcbiAgICBzaW11bGF0aW9uID0gbmV3IFNpbXVsYXRpb24oc2ltX3BhcmFtcyk7XG4gICAgZGF0YSA9IG5ldyBTaW1EYXRhKHNpbXVsYXRpb24pO1xuICAgIGlmIChpbXBvcnRlZEdlbm9tZXMgJiYgaW1wb3J0ZWRHZW5vbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2ltdWxhdGlvbi5pbml0X3BvcHVsYXRpb25fZnJvbV9nZW5vbWVzKGltcG9ydGVkR2Vub21lcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2ltdWxhdGlvbi5pbml0X3BvcHVsYXRpb24oKTtcbiAgICB9XG4gICAgcHVzaEZyYW1lKCk7XG4gICAgcHVzaFN0YXRzKCk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKSB7XG4gICAgaWYgKCFydW5uaW5nKSByZXR1cm47XG5cbiAgICBjb25zdCBzcGYgPSBzaW11bGF0aW9uLnBhcmFtcy5zdGVwc19wZXJfZnJhbWU7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGY7IGkrKykge1xuICAgICAgICBkb1N0ZXAoKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSBsYXN0RnJhbWVUaW1lID49IEZSQU1FX0lOVEVSVkFMX01TKSB7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBwdXNoU3RhdHMoKTtcbiAgICAgICAgbGFzdEZyYW1lVGltZSA9IG5vdztcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KGxvb3AsIDApO1xufVxuXG5mdW5jdGlvbiBkb1N0ZXAoKSB7XG4gICAgc2ltdWxhdGlvbi5zdGVwKCk7XG5cbiAgICAvLyBQZXJpb2RpYyBkaXN0dXJiYW5jZVxuICAgIGNvbnN0IGRpID0gc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWw7XG4gICAgaWYgKGRpID4gMCAmJiBzaW11bGF0aW9uLnN0ZXBudW0gJSBkaSA9PT0gMCkge1xuICAgICAgICBhcHBseURpc3R1cmJhbmNlKHNpbXVsYXRpb24ucGFyYW1zLmRpc3R1cmJhbmNlX3N0cmVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoc2ltdWxhdGlvbi5zdGVwbnVtICUgc2ltdWxhdGlvbi5wYXJhbXMucmVjb3JkX2ludGVydmFsID09PSAwIHx8IHNpbXVsYXRpb24uc3RlcG51bSA9PT0gMSkge1xuICAgICAgICBkYXRhLnJlY29yZFN0ZXAoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHB1c2hTdGF0cygpIHtcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJzdGF0c1wiLFxuICAgICAgICBkYXRhOiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRhdGEuZGF0YSkpLFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlEaXN0dXJiYW5jZShzdHJlbmd0aCkge1xuICAgIGNvbnN0IHdvcmxkID0gc2ltdWxhdGlvbi53b3JsZDtcbiAgICBjb25zdCBwbGFudHMgPSB3b3JsZC5wbGFudHM7XG4gICAgaWYgKHBsYW50cy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBudW1Ub0tpbGwgPSBNYXRoLm1heCgxLCBNYXRoLmZsb29yKHN0cmVuZ3RoICogcGxhbnRzLmxlbmd0aCkpO1xuICAgIC8vIFNodWZmbGUgYSBzYW1wbGUgYW5kIGtpbGxcbiAgICBjb25zdCBzaHVmZmxlZCA9IHBsYW50cy5zbGljZSgpLnNvcnQoKCkgPT4gTWF0aC5yYW5kb20oKSAtIDAuNSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1Ub0tpbGwgJiYgaSA8IHNodWZmbGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIENoZWNrIHBsYW50IHN0aWxsIGFsaXZlIChub3Qga2lsbGVkIGJ5IHByZXZpb3VzIGl0ZXJhdGlvbilcbiAgICAgICAgaWYgKHdvcmxkLnBsYW50cy5pbmNsdWRlcyhzaHVmZmxlZFtpXSkpIHtcbiAgICAgICAgICAgIHdvcmxkLmtpbGxQbGFudChzaHVmZmxlZFtpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGtpbGxDZWxsQXQoeCwgeSkge1xuICAgIGNvbnN0IGNlbGwgPSBzaW11bGF0aW9uLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgaWYgKGNlbGwgJiYgY2VsbC5wbGFudCkge1xuICAgICAgICBzaW11bGF0aW9uLndvcmxkLmtpbGxQbGFudChjZWxsLnBsYW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGV4cG9ydEdlbm9tZXMoKSB7XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICBzaW11bGF0aW9uLndvcmxkLnBsYW50cy5mb3JFYWNoKHBsYW50ID0+IHtcbiAgICAgICAgc2Vlbi5hZGQocGxhbnQuZ2Vub21lLnNlcmlhbGl6ZSgpKTtcbiAgICB9KTtcbiAgICBjb25zdCBnZW5vbWVzID0gQXJyYXkuZnJvbShzZWVuKTtcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJleHBvcnRlZEdlbm9tZXNcIiwgZ2Vub21lcyB9KTtcbn1cblxuZnVuY3Rpb24gcHVzaEZyYW1lKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpO1xuICAgIC8vIFRyYW5zZmVyIG93bmVyc2hpcCBvZiB0aGUgQXJyYXlCdWZmZXIgZm9yIHplcm8tY29weSBwZXJmb3JtYW5jZVxuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcImZyYW1lXCIsXG4gICAgICAgIGJ1ZmZlcjogcmVzdWx0LmJ1ZmZlci5idWZmZXIsXG4gICAgICAgIHdpZHRoOiByZXN1bHQud2lkdGgsXG4gICAgICAgIGhlaWdodDogcmVzdWx0LmhlaWdodCxcbiAgICAgICAgY2VsbENvdW50OiByZXN1bHQuY2VsbENvdW50LFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9LCBbcmVzdWx0LmJ1ZmZlci5idWZmZXJdKTtcbn1cblxuZnVuY3Rpb24gc2VuZENlbGxJbmZvKHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmICghY2VsbCB8fCAhY2VsbC5wbGFudCB8fCAhY2VsbC5wbGFudC5nZW5vbWUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBsYW50ID0gY2VsbC5wbGFudDtcbiAgICAgICAgY29uc3QgcnVsZXMgPSBzaW11bGF0aW9uLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUpO1xuICAgICAgICBjb25zdCBuZWlnaGJvdXJob29kID0gcGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgbGV0IG1hdGNoaW5nX3J1bGUgPSBcIk5vbmVcIjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHJ1bGVzW2ldLnN0YXRlID09PSBuZWlnaGJvdXJob29kKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2hpbmdfcnVsZSA9IGAjJHtpfSAke3J1bGVzW2ldfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVhdGggPSBwbGFudC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogXCJjZWxsSW5mb1wiLFxuICAgICAgICAgICAgZm91bmQ6IHRydWUsXG4gICAgICAgICAgICBjZWxsU3RyOiBjZWxsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBuZWlnaGJvdXJob29kLFxuICAgICAgICAgICAgbWF0Y2hpbmdfcnVsZSxcbiAgICAgICAgICAgIGRlYXRoOiBKU09OLnN0cmluZ2lmeShkZWF0aCksXG4gICAgICAgICAgICBnZW5vbWVMZW5ndGg6IHBsYW50Lmdlbm9tZS5sZW5ndGgsXG4gICAgICAgICAgICBtdXRFeHA6IHBsYW50Lmdlbm9tZS5tdXRfZXhwLFxuICAgICAgICAgICAgcnVsZXM6IHJ1bGVzLm1hcChyID0+IHIudG9TdHJpbmcoKSlcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJjZWxsSW5mb1wiLCBmb3VuZDogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtyYW5kb21JbnR9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtQbGFudH0gZnJvbSBcIi4vcGxhbnQuanNcIjtcbmltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5cbmNsYXNzIFdvcmxkIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KXtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHdvcmxkIGxhdHRpY2UgdG8gYWxsIG51bGxzXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzLnB1c2goW10pO1xuICAgICAgICAgICAgZm9yKHZhciBqPTA7IGo8dGhpcy5oZWlnaHQ7IGorKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tpXVtqXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYW50cyA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIGFycmF5IG9mIHggcG9zaXRpb25zIGF0IHk9MCB3aGVyZSBubyBjZWxsIGV4aXN0c1xuICAgICAqL1xuICAgIGdldEZsb29yU3BhY2UoKXtcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICBpZih0aGlzLmNlbGxzW2ldWzBdID09PSBudWxsKXtcbiAgICAgICAgICAgICAgICBlbXB0eVNwYWNlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbXB0eVNwYWNlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdHJhdGVnaWVzIGZvciBzb3dpbmcgYSBzZWVkIG9uIHRoZSB3b3JsZCBmbG9vclxuICAgICAqIEBwYXJhbSB7Kn0gZ2Vub21lIHRoZSBnZW5vbWUgdXNlZCBieSB0aGUgbmV3IHNlZWRcbiAgICAgKiBAcGFyYW0geyp9IG5lYXJYIGlmIG5vdCBudWxsLCB0cnkgdG8gc293IGEgc2VlZCBhcyBjbG9zZVxuICAgICAqIGFzIHBvc3NpYmxlIHRvIHRoaXMgbG9jYXRpb25cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgYSBzZWVkIHdhcyBzdWNjZXNmdWxseSBwbGFudGVkLCBmYWxzZSBpZlxuICAgICAqIHRoZXJlIHdhcyBubyBzcGFjZSB0byBzb3cgYSBzZWVkLlxuICAgICAqL1xuICAgIHNlZWQoZ2Vub21lLCBuZWFyWCl7XG4gICAgICAgIC8vIGZpbmQgYSByYW5kb20gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gdGhpcy5nZXRGbG9vclNwYWNlKCk7XG4gICAgICAgIGlmKGVtcHR5U3BhY2VzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZWFyWCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0WCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdF9kaWZmID0gdGhpcy53aWR0aDtcbiAgICAgICAgICAgIGVtcHR5U3BhY2VzLmZvckVhY2goZnVuY3Rpb24oeHBvcyl7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBNYXRoLmFicyhuZWFyWC14cG9zKTtcbiAgICAgICAgICAgICAgICBpZihkaWZmIDwgbmVhcmVzdF9kaWZmKXtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdF9kaWZmID0gZGlmZjtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFggPSB4cG9zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIG5lYXJlc3RYKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHggPSBlbXB0eVNwYWNlc1tyYW5kb21JbnQoMCwgZW1wdHlTcGFjZXMubGVuZ3RoLTEpXTtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbeF1bMF0gIT09IG51bGwpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3BhY2UgaXMgdGFrZW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIHgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzb3dQbGFudChnZW5vbWUsIHgpe1xuICAgICAgICB4ID0gdGhpcy5nZXRYKHgpO1xuICAgICAgICB2YXIgcGxhbnQgPSBuZXcgUGxhbnQoeCwgdGhpcywgZ2Vub21lKTtcbiAgICAgICAgdGhpcy5wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgIHRoaXMuYWRkQ2VsbChwbGFudC5jZWxsc1swXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBsYW50IGZyb20gd29ybGQgcGxhbnQgbGlzdC5cbiAgICAgKiBSZW1vdmUgYWxsIGNlbGxzIGZyb20gY2VsbCBncmlkXG4gICAgICovXG4gICAga2lsbFBsYW50KHBsYW50KXtcbiAgICAgICAgdGhpcy5wbGFudHMuc3BsaWNlKHRoaXMucGxhbnRzLmluZGV4T2YocGxhbnQpLCAxKTtcbiAgICAgICAgcGxhbnQuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldID0gbnVsbDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0WCh4KXtcbiAgICAgICAgaWYoeCA8IDApe1xuICAgICAgICAgICAgeCA9IHRoaXMud2lkdGggKyB4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4ICUgdGhpcy53aWR0aDtcbiAgICB9XG5cbiAgICBnZXRDZWxsKHgsIHkpe1xuICAgICAgICByZXR1cm4gdGhpcy5jZWxsc1t0aGlzLmdldFgoeCldW3ldO1xuICAgIH1cblxuICAgIGFkZENlbGwoY2VsbCl7XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IGNlbGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRQaXhlbEJ1ZmZlcihjZWxsU2l6ZSl7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLndpZHRoICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGggPSB0aGlzLmhlaWdodCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBidWYgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkodyAqIGggKiA0KTsgLy8gUkdCQSwgaW5pdGlhbGl6ZWQgdG8gMCAodHJhbnNwYXJlbnQvYmxhY2spXG5cbiAgICAgICAgdGhpcy5wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICBjb25zdCBbYmFzZVIsIGJhc2VHLCBiYXNlQl0gPSB0aGlzLmdldEJhc2VDb2xvdXIocGxhbnQpO1xuICAgICAgICAgICAgcGxhbnQuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2wgPSBjZWxsLmVuZXJnaXNlZFxuICAgICAgICAgICAgICAgICAgICA/IFtiYXNlUiwgYmFzZUcsIGJhc2VCXVxuICAgICAgICAgICAgICAgICAgICA6IFtNYXRoLnJvdW5kKGJhc2VSICogMC43KSwgTWF0aC5yb3VuZChiYXNlRyAqIDAuNyksIE1hdGgucm91bmQoYmFzZUIgKiAwLjcpXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHB4MCA9IGNlbGwueCAqIGNlbGxTaXplO1xuICAgICAgICAgICAgICAgIC8vIHdvcmxkIHk9MCBpcyBncm91bmQgKGJvdHRvbSksIGNhbnZhcyB5PTAgaXMgdG9wXG4gICAgICAgICAgICAgICAgY29uc3QgcHkwID0gKHRoaXMuaGVpZ2h0IC0gMSAtIGNlbGwueSkgKiBjZWxsU2l6ZTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGR5ID0gMDsgZHkgPCBjZWxsU2l6ZTsgZHkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkeCA9IDA7IGR4IDwgY2VsbFNpemU7IGR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYXcgMXB4IGJvcmRlcjogZGFya2VuIGVkZ2UgcGl4ZWxzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0JvcmRlciA9IGR4ID09PSAwIHx8IGR5ID09PSAwIHx8IGR4ID09PSBjZWxsU2l6ZSAtIDEgfHwgZHkgPT09IGNlbGxTaXplIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGlzQm9yZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBbTWF0aC5yb3VuZChjb2xbMF0gKiAwLjUpLCBNYXRoLnJvdW5kKGNvbFsxXSAqIDAuNSksIE1hdGgucm91bmQoY29sWzJdICogMC41KV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGNvbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkeCA9ICgocHkwICsgZHkpICogdyArIChweDAgKyBkeCkpICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdICAgICA9IHI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBnO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDJdID0gYjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAzXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4geyBidWZmZXI6IGJ1Ziwgd2lkdGg6IHcsIGhlaWdodDogaCwgY2VsbENvdW50OiB0aGlzLnBsYW50cy5yZWR1Y2UoKHMscCk9PnMrcC5jZWxscy5sZW5ndGgsMCkgfTtcbiAgICB9XG5cbiAgICBnZXRCYXNlQ29sb3VyKHBsYW50KXtcbiAgICAgICAgdmFyIGkgPSBwbGFudC5jZWxsc1swXS54ICUgY1NjYWxlLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGNTY2FsZVtpXTtcbiAgICB9XG59XG5cbi8vIGh0dHA6Ly9jb2xvcmJyZXdlcjIub3JnLz90eXBlPXF1YWxpdGF0aXZlJnNjaGVtZT1TZXQzJm49OCDigJQgYXMgcmF3IFtSLEcsQl0gdHVwbGVzXG52YXIgY1NjYWxlID0gW1xuICAgIFsxNDEsMjExLDE5OV0sWzI1NSwyNTUsMTc5XSxbMTkwLDE4NiwyMThdLFsyNTEsMTI4LDExNF0sXG4gICAgWzEyOCwxNzcsMjExXSxbMjUzLDE4MCw5OF0sWzE3OSwyMjIsMTA1XSxbMjUyLDIwNSwyMjldXG5dO1xuXG5cbmV4cG9ydCB7IFdvcmxkIH07IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0bG9hZGVkOiBmYWxzZSxcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuLy8gdGhlIHN0YXJ0dXAgZnVuY3Rpb25cbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5cdC8vIFRoaXMgZW50cnkgbW9kdWxlIGRlcGVuZHMgb24gb3RoZXIgbG9hZGVkIGNodW5rcyBhbmQgZXhlY3V0aW9uIG5lZWQgdG8gYmUgZGVsYXllZFxuXHR2YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyh1bmRlZmluZWQsIFtcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3NlZWRyYW5kb21faW5kZXhfanMtbm9kZV9tb2R1bGVzX3N0YXRzLWxpdGVfc3RhdHNfanNcIl0sICgpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanNcIikpKVxuXHRfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKF9fd2VicGFja19leHBvcnRzX18pO1xuXHRyZXR1cm4gX193ZWJwYWNrX2V4cG9ydHNfXztcbn07XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kRCA9IGZ1bmN0aW9uICgpIHtcblx0dGhyb3cgbmV3IEVycm9yKCdkZWZpbmUgY2Fubm90IGJlIHVzZWQgaW5kaXJlY3QnKTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5hbWRPID0ge307IiwidmFyIGRlZmVycmVkID0gW107XG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8gPSAocmVzdWx0LCBjaHVua0lkcywgZm4sIHByaW9yaXR5KSA9PiB7XG5cdGlmKGNodW5rSWRzKSB7XG5cdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuXHRcdGZvcih2YXIgaSA9IGRlZmVycmVkLmxlbmd0aDsgaSA+IDAgJiYgZGVmZXJyZWRbaSAtIDFdWzJdID4gcHJpb3JpdHk7IGktLSkgZGVmZXJyZWRbaV0gPSBkZWZlcnJlZFtpIC0gMV07XG5cdFx0ZGVmZXJyZWRbaV0gPSBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV07XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBub3RGdWxmaWxsZWQgPSBJbmZpbml0eTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV0gPSBkZWZlcnJlZFtpXTtcblx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpZiAoKHByaW9yaXR5ICYgMSA9PT0gMCB8fCBub3RGdWxmaWxsZWQgPj0gcHJpb3JpdHkpICYmIE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uTykuZXZlcnkoKGtleSkgPT4gKF9fd2VicGFja19yZXF1aXJlX18uT1trZXldKGNodW5rSWRzW2pdKSkpKSB7XG5cdFx0XHRcdGNodW5rSWRzLnNwbGljZShqLS0sIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnVsZmlsbGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmKHByaW9yaXR5IDwgbm90RnVsZmlsbGVkKSBub3RGdWxmaWxsZWQgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoZnVsZmlsbGVkKSB7XG5cdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuXHRcdFx0dmFyIHIgPSBmbigpO1xuXHRcdFx0aWYgKHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vLyBUaGlzIGZpbGUgY29udGFpbnMgb25seSB0aGUgZW50cnkgY2h1bmsuXG4vLyBUaGUgY2h1bmsgbG9hZGluZyBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLmYpLnJlZHVjZSgocHJvbWlzZXMsIGtleSkgPT4ge1xuXHRcdF9fd2VicGFja19yZXF1aXJlX18uZltrZXldKGNodW5rSWQsIHByb21pc2VzKTtcblx0XHRyZXR1cm4gcHJvbWlzZXM7XG5cdH0sIFtdKSk7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rcyBhbmQgY2h1bmtzIHRoYXQgdGhlIGVudHJ5cG9pbnQgZGVwZW5kcyBvblxuX193ZWJwYWNrX3JlcXVpcmVfXy51ID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiBcIlwiICsgY2h1bmtJZCArIFwiLmJ1bmRsZS5qc1wiO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwidmFyIHNjcmlwdFVybDtcbmlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmcuaW1wb3J0U2NyaXB0cykgc2NyaXB0VXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmxvY2F0aW9uICsgXCJcIjtcbnZhciBkb2N1bWVudCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5kb2N1bWVudDtcbmlmICghc2NyaXB0VXJsICYmIGRvY3VtZW50KSB7XG5cdGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0ICYmIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnU0NSSVBUJylcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcblx0aWYgKCFzY3JpcHRVcmwpIHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xuXHRcdGlmKHNjcmlwdHMubGVuZ3RoKSB7XG5cdFx0XHR2YXIgaSA9IHNjcmlwdHMubGVuZ3RoIC0gMTtcblx0XHRcdHdoaWxlIChpID4gLTEgJiYgKCFzY3JpcHRVcmwgfHwgIS9eaHR0cChzPyk6Ly50ZXN0KHNjcmlwdFVybCkpKSBzY3JpcHRVcmwgPSBzY3JpcHRzW2ktLV0uc3JjO1xuXHRcdH1cblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC9eYmxvYjovLCBcIlwiKS5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGNodW5rc1xuLy8gXCIxXCIgbWVhbnMgXCJhbHJlYWR5IGxvYWRlZFwiXG52YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuXHRcInNyY19zaW11bGF0aW9uX3dvcmtlcl9qc1wiOiAxXG59O1xuXG4vLyBpbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmdcbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIgW2NodW5rSWRzLCBtb3JlTW9kdWxlcywgcnVudGltZV0gPSBkYXRhO1xuXHRmb3IodmFyIG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubVttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG5cdFx0fVxuXHR9XG5cdGlmKHJ1bnRpbWUpIHJ1bnRpbWUoX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cdHdoaWxlKGNodW5rSWRzLmxlbmd0aClcblx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZHMucG9wKCldID0gMTtcblx0cGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24oZGF0YSk7XG59O1xuX193ZWJwYWNrX3JlcXVpcmVfXy5mLmkgPSAoY2h1bmtJZCwgcHJvbWlzZXMpID0+IHtcblx0Ly8gXCIxXCIgaXMgdGhlIHNpZ25hbCBmb3IgXCJhbHJlYWR5IGxvYWRlZFwiXG5cdGlmKCFpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRpZih0cnVlKSB7IC8vIGFsbCBjaHVua3MgaGF2ZSBKU1xuXHRcdFx0aW1wb3J0U2NyaXB0cyhfX3dlYnBhY2tfcmVxdWlyZV9fLnAgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLnUoY2h1bmtJZCkpO1xuXHRcdH1cblx0fVxufTtcblxudmFyIGNodW5rTG9hZGluZ0dsb2JhbCA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSB8fCBbXTtcbnZhciBwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbiA9IGNodW5rTG9hZGluZ0dsb2JhbC5wdXNoLmJpbmQoY2h1bmtMb2FkaW5nR2xvYmFsKTtcbmNodW5rTG9hZGluZ0dsb2JhbC5wdXNoID0gaW5zdGFsbENodW5rO1xuXG4vLyBubyBITVJcblxuLy8gbm8gSE1SIG1hbmlmZXN0IiwidmFyIG5leHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLng7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fLmUoXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCIpLnRoZW4obmV4dCk7XG59OyIsIiIsIi8vIHJ1biBzdGFydHVwXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18ueCgpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9