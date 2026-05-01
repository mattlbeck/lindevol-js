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

    execute(cell, stepnum){
        // actions are typically only carried out if the cell has energy
        // and the cell loses energy as a result.
        if (cell.energised){
            var success = this.doAction(cell, stepnum);
            cell.energised = !success;
        }
        
    }

    doAction(cell){

    }
}

class Divide extends Action{

    doAction(cell, stepnum){
        // the 2 least significant bits of the action code
        // determines which direction the divide action is for
        super.doAction(cell, stepnum);
        var direction = this.getDirection();
        cell.plant.growFromCell(cell, direction, stepnum);
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
    doAction(cell, stepnum){
        super.doAction(cell, stepnum);
        return cell.plant.world.seed(cell.plant.genome.copy(), null, stepnum);
    }

    toString(){
        return "flyingseed";
    }
}

class LocalSeed extends Action{
    doAction(cell, stepnum){
        super.doAction(cell, stepnum);
        return cell.plant.world.seed(cell.plant.genome.copy(), cell.x, stepnum);
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
    constructor(x, world, genome, birthStep, useInternalState=false) {
        this.world = world;
        this.energisedCount = 0;
        this.cells = [new _cell_js__WEBPACK_IMPORTED_MODULE_1__.Cell(this, this.world.getX(x), 0)];
        this.genome = genome;
        this.useInternalState = useInternalState;
        this.rules = null; // cached rules
        this.leanoverEnergised = 0; // Incremental tracking
        this.birthStep = birthStep;
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
    growFromCell(cell, direction, stepnum){
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
            
            // Attack occurs
            if (this.world.onAttack) this.world.onAttack();

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
        this.lastStep = 0;
        this.collectors = [
            new Collector("population", AsIs, function(sim){
                return sim.world.plants.length;
            }),
            new Collector("unique_genotypes", AsIs, function(sim){
                const seen = new Set();
                sim.world.plants.forEach(p => seen.add(p.genome.serialize()));
                return seen.size;
            }),
            new Collector("total_cells", AsIs, function(sim){
                return sim.world.cellCount;
            }),
            new Collector("avg_size", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                return sim.world.cellCount / sim.world.plants.length;
            }),
            new Collector("avg_energised", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + p.energisedCount, 0);
                return total / sim.world.plants.length;
            }),
            new Collector("avg_active_genes", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + (p.rules ? p.rules.length : 0), 0);
                return total / sim.world.plants.length;
            }),
            new Collector("avg_age", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + (sim.stepnum - p.birthStep), 0);
                return total / sim.world.plants.length;
            }),
            new Collector("total_seeds", AsIs, function(sim){ return sim.stats.totalSeeds; }),
            new Collector("flying_seeds", AsIs, function(sim){ return sim.stats.flyingSeeds; }),
            new Collector("new_plants", AsIs, function(sim){ return sim.stats.newPlants; }),
            new Collector("deaths", AsIs, function(sim){ return sim.stats.deaths; }),
            new Collector("attacks", AsIs, function(sim){ return sim.stats.attacks; }),
            new Collector("avg_death_prob", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => {
                    return sum + p.getDeathProbability(
                        sim.params.death_factor,
                        sim.params.natural_exp,
                        sim.params.energy_exp,
                        sim.params.leanover_factor
                    ).prob;
                }, 0);
                return total / sim.world.plants.length;
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
                    let maxH = 0;
                    for (let i = 0; i < p.cells.length; i++) if (p.cells[i].y > maxH) maxH = p.cells[i].y;
                    return maxH;
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
        const delta = this.sim.stepnum - this.lastStep;
        this.lastStep = this.sim.stepnum;

        var stepData = {};
        this.collectors.forEach(function(c){
            var values = c.collect(this.sim);
            Object.assign(stepData, values);
        }, this);

        // Normalize rate-based metrics by the number of steps since the last record
        if (delta > 0) {
            const rateKeys = ["new_plants", "deaths", "attacks", "total_seeds", "flying_seeds"];
            rateKeys.forEach(k => {
                if (stepData[k] !== undefined) {
                    stepData[k] /= delta;
                }
            });
        }

        // Reset incremental stats for the next interval
        this.sim.stats.newPlants = 0;
        this.sim.stats.deaths = 0;
        this.sim.stats.attacks = 0;
        this.sim.stats.totalSeeds = 0;
        this.sim.stats.flyingSeeds = 0;

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
        this.stats = { 
            attacks: 0, 
            deaths: 0, 
            totalSeeds: 0, 
            flyingSeeds: 0, 
            newPlants: 0 
        };

        this.world.onPlantBirth = () => { this.stats.newPlants++; };
        this.world.onPlantDeath = () => { this.stats.deaths++; };
        this.world.onAttack = () => { this.stats.attacks++; };
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
            this.world.seed(genome, null, this.stepnum);
        }
    }

    newSeed(){
        // create a random genome
        var genome = _genome_js__WEBPACK_IMPORTED_MODULE_2__.ByteArray.random(this.params.initial_genome_length);
        this.world.seed(genome, null, this.stepnum);
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
        const self = this;
        rules.forEach(function(rule){
            // execute one action using the first matching rule
            if (rule.matches(state)){
                // Track seeds
                if (rule.action.constructor.name === "FlyingSeed") self.stats.flyingSeeds++;
                if (rule.action.constructor.name === "FlyingSeed" || rule.action.constructor.name === "LocalSeed") {
                    self.stats.totalSeeds++;
                }
                rule.action.execute(cell, self.stepnum);
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

        this.onPlantBirth = null;
        this.onPlantDeath = null;
        this.onAttack = null;
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
    seed(genome, nearX, stepnum){
        // find a random empty space
        var emptySpaces = this.getFloorSpace();
        if(emptySpaces.length === 0){
            return false;
        }

        if(nearX !== undefined && nearX !== null){
            var nearestX = null;
            var nearest_diff = this.width;
            emptySpaces.forEach(function(xpos){
                var diff = Math.abs(nearX-xpos);
                if(diff < nearest_diff){
                    nearest_diff = diff;
                    nearestX = xpos;
                }
            });
            this.sowPlant(genome, nearestX, stepnum);
            return true;
        }

        var x = emptySpaces[(0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomInt)(0, emptySpaces.length-1)];
        if (this.cells[x][0] !== null){
            throw new Error("Space is taken");
        }
        this.sowPlant(genome, x, stepnum);
        return true;
    }

    sowPlant(genome, x, stepnum){
        x = this.getX(x);
        var plant = new _plant_js__WEBPACK_IMPORTED_MODULE_1__.Plant(x, this, genome, stepnum);
        this.plants.push(plant);
        this.addCell(plant.cells[0]);
        if (this.onPlantBirth) this.onPlantBirth(plant);
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
            if (this.onPlantDeath) this.onPlantDeath(plant);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEVBQUU7V0FDRixFOzs7OztXQ1JBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7V0NKQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEdBQUc7V0FDSDtXQUNBO1dBQ0EsQ0FBQyxJOzs7OztXQ1BELHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7OztXQ05BO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7V0NKQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxrQzs7Ozs7V0NsQkE7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGFBQWE7V0FDYjtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7O1dBRUE7O1dBRUEsa0I7Ozs7O1dDcENBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1VFSEE7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2xpbmRldm9sL2lnbm9yZWR8L1VzZXJzL21hdHQvbGluZGV2b2wtanMvbm9kZV9tb2R1bGVzL3NlZWRyYW5kb218Y3J5cHRvIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2FjdGlvbnMuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvY2VsbC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9nZW5vbWUuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvcGxhbnQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvcmFuZG9tLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbWRhdGEuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW11bGF0aW9uLndvcmtlci5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy93b3JsZC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvYW1kIGRlZmluZSIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvYW1kIG9wdGlvbnMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2NodW5rIGxvYWRlZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2Vuc3VyZSBjaHVuayIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZ2V0IGphdmFzY3JpcHQgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvcHVibGljUGF0aCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9zdGFydHVwIGNodW5rIGRlcGVuZGVuY2llcyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLyogKGlnbm9yZWQpICovIiwiY29uc3QgTkVJR0hCT1VSSE9PRCA9IFtbLTEsLTFdLCBbMCwtMV0sIFsxLC0xXSwgWy0xLDBdLCBbMSwwXSwgWy0xLDFdLCBbMCwxXSwgWzEsMV1dO1xuY29uc3QgTVVUX0lOQ1JFTUVOVCA9IDAuMDAxO1xuXG5jbGFzcyBBY3Rpb257XG4gICAgY29uc3RydWN0b3IoYWN0aW9uQ29kZSl7XG4gICAgICAgIHRoaXMuY29kZSA9IGFjdGlvbkNvZGU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBleGVjdXRlKGNlbGwsIHN0ZXBudW0pe1xuICAgICAgICAvLyBhY3Rpb25zIGFyZSB0eXBpY2FsbHkgb25seSBjYXJyaWVkIG91dCBpZiB0aGUgY2VsbCBoYXMgZW5lcmd5XG4gICAgICAgIC8vIGFuZCB0aGUgY2VsbCBsb3NlcyBlbmVyZ3kgYXMgYSByZXN1bHQuXG4gICAgICAgIGlmIChjZWxsLmVuZXJnaXNlZCl7XG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9IHRoaXMuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSk7XG4gICAgICAgICAgICBjZWxsLmVuZXJnaXNlZCA9ICFzdWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cblxuICAgIGRvQWN0aW9uKGNlbGwpe1xuXG4gICAgfVxufVxuXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBBY3Rpb257XG5cbiAgICBkb0FjdGlvbihjZWxsLCBzdGVwbnVtKXtcbiAgICAgICAgLy8gdGhlIDIgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBvZiB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgLy8gZGV0ZXJtaW5lcyB3aGljaCBkaXJlY3Rpb24gdGhlIGRpdmlkZSBhY3Rpb24gaXMgZm9yXG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pO1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICAgICAgY2VsbC5wbGFudC5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uLCBzdGVwbnVtKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICB9XG5cbiAgICBnZXREaXJlY3Rpb24oKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMDExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICB2YXIgZGlyZWN0aW9uQ29kZSA9IHRoaXMuY29kZSAmIDc7XG4gICAgICAgIHJldHVybiBORUlHSEJPVVJIT09EW2RpcmVjdGlvbkNvZGVdO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgZGl2aWRlICR7dGhpcy5nZXREaXJlY3Rpb24oKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlUGx1cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgKz0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0K1wiO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlTWludXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwIC09IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dC1cIjtcbiAgICB9XG59XG5cbmNsYXNzIEZseWluZ1NlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCwgc3RlcG51bSl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSwgbnVsbCwgc3RlcG51bSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwiZmx5aW5nc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgTG9jYWxTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsLCBzdGVwbnVtKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCksIGNlbGwueCwgc3RlcG51bSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibG9jYWxzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBTdGF0ZUJpdE4gZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCkge1xuICAgICAgICBjZWxsLm5leHRJbnRlcm5hbFN0YXRlID0gY2VsbC5uZXh0SW50ZXJuYWxTdGF0ZSAmIE1hdGgucG93KDIsIHRoaXMuZ2V0TnRoQml0KCkpO1xuICAgICAgICAvLyB0aGlzIGFjdGlvbiBkb2VzIG5vdCBjb25zdW1lIGVuZXJneVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZ2V0TnRoQml0KCl7XG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIGNvcnJlY3QgYml0c1xuICAgICAgICAvLyAmIHdpdGggMDAwMDExMTEgdG8gbWFzayBvdXQgbGVhc3Qgc2lnIGJpdHNcbiAgICAgICAgcmV0dXJuIHRoaXMuY29kZSAmIDE1O1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgU3RhdGVCaXQgJHt0aGlzLmdldE50aEJpdCgpfWA7XG4gICAgfVxufVxuXG5jbGFzcyBBY3Rpb25NYXAge1xuXG4gICAgY29uc3RydWN0b3IobWFwcGluZywgY29kZVJhbmdlPTI1Nil7XG4gICAgICAgIHRoaXMubWFwcGluZyA9IG1hcHBpbmc7XG4gICAgICAgIHRoaXMuY29kZVJhbmdlID0gY29kZVJhbmdlO1xuICAgICAgICB0aGlzLmFjdGlvbnMgPSBbRGl2aWRlLCBGbHlpbmdTZWVkLCBMb2NhbFNlZWQsIE11dGF0ZVBsdXMsIE11dGF0ZU1pbnVzLCBTdGF0ZUJpdE5dO1xuICAgIH1cblxuICAgIGdldEFjdGlvbihhY3Rpb25Db2RlKXtcbiAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBhY3Rpb24gY29kZSBpbnRvIHRoZSBbMCwgc3VtKSByYW5nZSBzbyB3ZWlnaHRzIGNhbiBiZVxuICAgICAgICAvLyBhbnkgcG9zaXRpdmUgaW50ZWdlcnMgcmF0aGVyIHRoYW4gbmVlZGluZyB0byBzdW0gdG8gY29kZVJhbmdlLlxuICAgICAgICBjb25zdCBzdW0gPSB0aGlzLm1hcHBpbmcucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCk7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRDb2RlID0gTWF0aC5mbG9vcigoYWN0aW9uQ29kZSAvIHRoaXMuY29kZVJhbmdlKSAqIHN1bSk7XG4gICAgICAgIHZhciBtYXBwaW5nQ291bnQgPSAwO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLm1hcHBpbmcubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgbWFwcGluZ0NvdW50ICs9IHRoaXMubWFwcGluZ1tpXTtcbiAgICAgICAgICAgIGlmIChub3JtYWxpemVkQ29kZSA8IG1hcHBpbmdDb3VudCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmFjdGlvbnNbaV0oYWN0aW9uQ29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gRmFsbGJhY2sgZm9yIGZsb2F0aW5nLXBvaW50IGVkZ2UgY2FzZXNcbiAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmFjdGlvbnNbdGhpcy5tYXBwaW5nLmxlbmd0aCAtIDFdKGFjdGlvbkNvZGUpO1xuICAgIH1cblxufVxuXG5leHBvcnQge0RpdmlkZSwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIExvY2FsU2VlZCwgRmx5aW5nU2VlZCwgQWN0aW9uTWFwLCBORUlHSEJPVVJIT09EfTsiLCJcbmNsYXNzIENlbGx7XG4gICAgY29uc3RydWN0b3IocGxhbnQsIHgsIHkpe1xuICAgICAgICB0aGlzLnBsYW50ID0gcGxhbnQ7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMuX2VuZXJnaXNlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmludGVybmFsU3RhdGUgPSAwO1xuICAgICAgICB0aGlzLm5leHRJbnRlcm5hbFN0YXRlID0gMDtcbiAgICB9XG5cbiAgICBnZXQgZW5lcmdpc2VkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5lcmdpc2VkO1xuICAgIH1cblxuICAgIHNldCBlbmVyZ2lzZWQodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2VuZXJnaXNlZCA9PT0gdmFsdWUpIHJldHVybjtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLnBsYW50KSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYW50LmVuZXJnaXNlZENvdW50Kys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVN0YXRlKCl7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IHRoaXMubmV4dEludGVybmFsU3RhdGU7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGRyYXcoY3R4LCB4LCB5LCBzaXplLCBjb2xvdXIpe1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gY29sb3VyO1xuICAgICAgICBjdHguZmlsbFJlY3QoeCwgeSwgc2l6ZSwgc2l6ZSk7XG4gICAgICAgIC8vY3R4LnN0cm9rZVJlY3QoeCwgeSwgc2l6ZSwgc2l6ZSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBDZWxsIGF0ICgke3RoaXMueH0sICR7dGhpcy55fSkgZW5lcmd5OiAke3RoaXMuZW5lcmdpc2VkfWA7XG4gICAgfVxufVxuXG5leHBvcnQge0NlbGx9OyIsImltcG9ydCB7cmFuZG9tSW50LCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7QWN0aW9uTWFwfSBmcm9tIFwiLi9hY3Rpb25zLmpzXCI7XG5cbmNsYXNzIEJ5dGVBcnJheSBleHRlbmRzIEFycmF5e1xuXG4gICAgY29uc3RydWN0b3IobGVuZ3RoPTAsIGluaXRpYWxfbXV0X2V4cD0wKXtcbiAgICAgICAgc3VwZXIobGVuZ3RoKTtcbiAgICAgICAgdGhpcy5tdXRfZXhwID0gaW5pdGlhbF9tdXRfZXhwO1xuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tKGFyciwgbXV0X2V4cD0wKXtcbiAgICAgICAgdmFyIGJhID0gbmV3IEJ5dGVBcnJheShhcnIubGVuZ3RoLCBtdXRfZXhwKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8YmEubGVuZ3RoO2krKyl7XG4gICAgICAgICAgICBiYVtpXSA9IGFycltpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VyaWFsaXplIHRoaXMgZ2Vub21lIHRvIGEgc3RyaW5nOiBcIjxtdXRfZXhwPjs8Ynl0ZTA+LDxieXRlMT4sLi4uXCJcbiAgICAgKi9cbiAgICBzZXJpYWxpemUoKXtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubXV0X2V4cH07JHtBcnJheS5mcm9tKHRoaXMpLmpvaW4oXCIsXCIpfWA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVzZXJpYWxpemUgYSBnZW5vbWUgc3RyaW5nIHByb2R1Y2VkIGJ5IHNlcmlhbGl6ZSgpLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAgICAgKiBAcmV0dXJucyB7Qnl0ZUFycmF5fVxuICAgICAqL1xuICAgIHN0YXRpYyBkZXNlcmlhbGl6ZShzdHIpe1xuICAgICAgICBjb25zdCBwYXJ0cyA9IHN0ci50cmltKCkuc3BsaXQoXCI7XCIpO1xuICAgICAgICBjb25zdCBtdXRfZXhwID0gcGFyc2VGbG9hdChwYXJ0c1swXSk7XG4gICAgICAgIGNvbnN0IGJ5dGVzID0gcGFydHNbMV0uc3BsaXQoXCIsXCIpLm1hcChOdW1iZXIpO1xuICAgICAgICByZXR1cm4gQnl0ZUFycmF5LmZyb20oYnl0ZXMsIG11dF9leHApO1xuICAgIH1cblxuICAgIHN0YXRpYyByYW5kb20obGVuZ3RoKXtcbiAgICAgICAgdmFyIGJhID0gbmV3IEJ5dGVBcnJheShsZW5ndGgpO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gcmFuZG9tSW50KDAsIDI1NSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhO1xuICAgIH1cblxuICAgIGNvcHkoKXtcbiAgICAgICAgdmFyIG5ld0FyciA9IG5ldyBCeXRlQXJyYXkodGhpcy5sZW5ndGgsIHRoaXMubXV0X2V4cCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgbmV3QXJyW2ldID0gdGhpc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3QXJyO1xuICAgIH1cblxufVxuXG5jbGFzcyBNdXRhdG9ye1xuICAgIGNvbnN0cnVjdG9yKHByb2IsIHByb2JfcmVwbGFjZW1lbnQsIHByb2JfaW5zZXJ0aW9uLCBwcm9iX2RlbGV0aW9uLCBwcm9iX2R1cCwgcmVwbGFjZW1lbnRfbW9kZSwgdW5pdHMpe1xuICAgICAgICB0aGlzLnByb2IgPSBwcm9iO1xuICAgICAgICB0aGlzLnBSID0gcHJvYl9yZXBsYWNlbWVudDtcbiAgICAgICAgdGhpcy5wSSA9IHByb2JfaW5zZXJ0aW9uO1xuICAgICAgICB0aGlzLnBEID0gcHJvYl9kZWxldGlvbjtcbiAgICAgICAgdGhpcy5wRHVwID0gcHJvYl9kdXA7XG4gICAgICAgIHRoaXMucFJtb2RlID0gcmVwbGFjZW1lbnRfbW9kZTsgIFxuICAgICAgICB0aGlzLnVuaXRzID0gdW5pdHM7XG4gICAgfVxuXG4gICAgbXV0YXRlKGdlbm9tZSl7XG4gICAgICAgIGxldCBtdXRhdGVkID0gZmFsc2U7XG4gICAgICAgIGlmKHRoaXMubVByb2IodGhpcy5wUiwgZ2Vub21lLm11dF9leHApKXtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZShnZW5vbWUpO1xuICAgICAgICAgICAgbXV0YXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBJLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5pbnNlcnQoZ2Vub21lKTtcbiAgICAgICAgICAgIG11dGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMubVByb2IodGhpcy5wRCwgZ2Vub21lLm11dF9leHApKXtcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlKGdlbm9tZSk7XG4gICAgICAgICAgICBtdXRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbXV0YXRlZDtcbiAgICB9XG5cbiAgICBtUHJvYihwLCBleHApe1xuICAgICAgICByZXR1cm4gcmFuZG9tUHJvYihwICogTWF0aC5wb3coIHRoaXMucHJvYiwgZXhwKSk7XG4gICAgfVxuXG4gICAgcmVwbGFjZShnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIHN3aXRjaCh0aGlzLnBSbW9kZSl7XG4gICAgICAgIGNhc2UgXCJieXRld2lzZVwiOlxuICAgICAgICAgICAgZ2Vub21lW2ldID0gdGhpcy5yYW5kb21DaGFyKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImJpdHdpc2VcIjpcbiAgICAgICAgICAgIGdlbm9tZVtpXSA9IGdlbm9tZVtpXSBeICgxIDw8IHJhbmRvbUludCgwLCA3KSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBtdXRhdGlvbiByZXBsYWNlbWVudCBtb2RlOiAke3RoaXMucFJtb2RlfWApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cblxuICAgIGluc2VydChnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIGZvcih2YXIgbj0wOyBuPHRoaXMudW5pdHM7IG4rKyl7XG4gICAgICAgICAgICBnZW5vbWUuc3BsaWNlKGksIDAsIHRoaXMucmFuZG9tQ2hhcigpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlbGV0ZShnZW5vbWUpe1xuICAgICAgICB2YXIgaSA9IHRoaXMucmFuZG9tUG9zKGdlbm9tZSk7XG4gICAgICAgIGZvcih2YXIgbj0wOyBuPHRoaXMudW5pdHM7IG4rKyl7XG4gICAgICAgICAgICBnZW5vbWUuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmFuZG9tQ2hhcigpe1xuICAgICAgICByZXR1cm4gcmFuZG9tSW50KDAsIDI1NSk7XG4gICAgfVxuXG4gICAgcmFuZG9tUG9zKGdlbm9tZSl7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQoMCwgZ2Vub21lLmxlbmd0aC0xKTtcbiAgICB9XG59XG5cblxuXG5jbGFzcyBSdWxlIHtcbiAgICBjb25zdHJ1Y3RvcihlcU1hc2ssIHN0YXRlLCBhY3Rpb24pe1xuICAgICAgICB0aGlzLmVxTWFzayA9IGVxTWFzaztcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgICAgICB0aGlzLmFjdGlvbiA9IGFjdGlvbjtcbiAgICB9XG5cbiAgICBtYXRjaGVzKHN0YXRlKXtcbiAgICAgICAgdmFyIGVxU3RhdGUgPSBzdGF0ZSAmIHRoaXMuZXFNYXNrO1xuICAgICAgICByZXR1cm4gZXFTdGF0ZSA9PT0gdGhpcy5zdGF0ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5zdGF0ZX0gLT4gJHt0aGlzLmFjdGlvbn1gO1xuICAgIH1cbn1cblxuY2xhc3MgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgLyoqXG4gICAgICogTWV0aG9kcyB0aGF0IGRlY29kZSBnZW5vbWVzIGludG8gcnVsZXNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nLCBjb2RlUmFuZ2U9MjU2KXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbmV3IEFjdGlvbk1hcChtYXBwaW5nLCBjb2RlUmFuZ2UpO1xuICAgIH1cbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5KXtcblxuICAgIH1cbn1cblxuY2xhc3MgQmxvY2tJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcpe1xuICAgICAgICBzdXBlcihtYXBwaW5nLCAyNTYpOyAvLyBhY3Rpb24gYnl0ZSBpcyBmdWxsIDAtMjU1IHJhbmdlXG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBieXRlYXJyYXkubGVuZ3RoOyBpKz0yKXtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLm1hcHBpbmcuZ2V0QWN0aW9uKGJ5dGVhcnJheVtpKzFdKTtcbiAgICAgICAgICAgIHJ1bGVzLnB1c2gobmV3IFJ1bGUoMjU1LCBieXRlYXJyYXlbaV0sIGFjdGlvbikpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmNsYXNzIFByb21vdG9ySW50ZXJwcmV0ZXIgZXh0ZW5kcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nKXtcbiAgICAgICAgc3VwZXIobWFwcGluZywgNjQpOyAvLyB0ZXJtaW5hdG9yIGNvbnRyaWJ1dGVzIGxvd2VyIDYgYml0czogcmFuZ2UgMC02M1xuICAgIH1cbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5KXtcbiAgICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICAgIHZhciBnZW5lcyA9IFtdO1xuICAgICAgICB2YXIgZ2VuZSA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgYyA9IGJ5dGVhcnJheVtpXTtcbiAgICAgICAgICAgIGlmKGJpdFNldChjLCA2KSA9PT0gYml0U2V0KGMsIDcpKXtcbiAgICAgICAgICAgICAgICAvLyBvcGVyYXRvclxuICAgICAgICAgICAgICAgIGlmKGdlbmUubGVuZ3RoPjApe1xuICAgICAgICAgICAgICAgICAgICBnZW5lLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDcpKXtcbiAgICAgICAgICAgICAgICAvLyBwcm9tb3RvclxuICAgICAgICAgICAgICAgIGdlbmUgPSBbY107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIGlmKGJpdFNldChjLCA2KSl7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRlcm1pbmF0b3JcbiAgICAgICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lLnB1c2goYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcy5wdXNoKGdlbmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgZ2VuZXMuZm9yRWFjaChmdW5jdGlvbihnZW5lKXtcbiAgICAgICAgICAgIC8vIGV4dHJhY3QgNiBsZWFzdCBzaWcgYml0cyBmcm9tIHRlcm1pbmF0b3IgYXMgdGhlIGFjdGlvbiBjb2RlXG4gICAgICAgICAgICB2YXIgYWN0aW9uQ29kZSA9IGdlbmVbZ2VuZS5sZW5ndGgtMV0gJiAoKDEgPDwgNikgLSAxKTtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLm1hcHBpbmcuZ2V0QWN0aW9uKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyB0YWtlIGluZm9ybWF0aW9uIGZyb20gb3BlcmF0b3JzIHRvIGNyZWF0ZSBzdGF0ZSBtYXNrXG4gICAgICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgICAgICB2YXIgZXFNYXNrID0gMDsgLy8gc3BlY2lmaWVkIHdoaWNoIGJpdHMgY29udHJpYnV0ZSB0byB0aGUgc3RhdGUgbWFza1xuICAgICAgICAgICAgZm9yKHZhciBpPTE7IGk8Z2VuZS5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gNCBsZWFzdCBzaWcgYml0cyBkZXRlcm1pbmUgdGhlIG1hc2sgaW5kZXhcbiAgICAgICAgICAgICAgICB2YXIgbWFza0JpdCA9IGdlbmVbaV0gJiAoKDEgPDwgNCkgLSAxKTtcblxuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZXMgaWYgdGhlIG1hc2sgYXQgdGhpcyBpbmRleCBpcyBzZXQgdG8gMSBvciAwXG4gICAgICAgICAgICAgICAgdmFyIGJpdFN0YXRlID0gKGdlbmVbaV0gJiAoMSA8PCA0KSkgPj4gNDtcbiAgICAgICAgICAgICAgICBtYXNrICs9ICgxIDw8IG1hc2tCaXQpICogYml0U3RhdGU7XG5cbiAgICAgICAgICAgICAgICBlcU1hc2sgKz0gKDEgPDwgbWFza0JpdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydWxlcy5wdXNoKG5ldyBSdWxlKGVxTWFzaywgbWFzaywgYWN0aW9uKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gcnVsZXM7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBiaXRTZXQoYnl0ZSwgaSl7XG4gICAgcmV0dXJuIChieXRlID4+IGkpICYgMTtcbn1cblxuZXhwb3J0IHtCeXRlQXJyYXksIEJsb2NrSW50ZXJwcmV0ZXIsIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9OyIsImltcG9ydCB7cmFuZG9tSW50LCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7Q2VsbH0gZnJvbSBcIi4vY2VsbC5qc1wiO1xuaW1wb3J0IHtORUlHSEJPVVJIT09EfSBmcm9tIFwiLi9hY3Rpb25zLmpzXCI7XG5cbmNsYXNzIFBsYW50e1xuICAgIGNvbnN0cnVjdG9yKHgsIHdvcmxkLCBnZW5vbWUsIGJpcnRoU3RlcCwgdXNlSW50ZXJuYWxTdGF0ZT1mYWxzZSkge1xuICAgICAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgICAgIHRoaXMuZW5lcmdpc2VkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmNlbGxzID0gW25ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgMCldO1xuICAgICAgICB0aGlzLmdlbm9tZSA9IGdlbm9tZTtcbiAgICAgICAgdGhpcy51c2VJbnRlcm5hbFN0YXRlID0gdXNlSW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5ydWxlcyA9IG51bGw7IC8vIGNhY2hlZCBydWxlc1xuICAgICAgICB0aGlzLmxlYW5vdmVyRW5lcmdpc2VkID0gMDsgLy8gSW5jcmVtZW50YWwgdHJhY2tpbmdcbiAgICAgICAgdGhpcy5iaXJ0aFN0ZXAgPSBiaXJ0aFN0ZXA7XG4gICAgfVxuXG4gICAgZ2V0TmVpZ2hib3VyaG9vZChjZWxsKXtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBuZWlnaGJvdXJob29kIG1hc2tcbiAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxORUlHSEJPVVJIT09ELmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBwb3MgPSBORUlHSEJPVVJIT09EW2ldO1xuICAgICAgICAgICAgdmFyIHggPSBjZWxsLnggKyBwb3NbMF07XG4gICAgICAgICAgICB2YXIgeSA9IGNlbGwueSArIHBvc1sxXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQm91bmRzIGNoZWNrIGluc3RlYWQgb2YgdHJ5LWNhdGNoXG4gICAgICAgICAgICBpZiAoeCA+PSAwICYmIHggPCB0aGlzLndvcmxkLndpZHRoICYmIHkgPj0gMCAmJiB5IDwgdGhpcy53b3JsZC5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgd29ybGRQb3MgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3ldO1xuICAgICAgICAgICAgICAgIGlmICh3b3JsZFBvcyBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgICAgICAgICBtYXNrID0gbWFzayB8ICgxIDw8IGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFzaztcbiAgICB9XG5cbiAgICBnZXRTdGF0ZShjZWxsKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKSB8IGNlbGwuaW50ZXJuYWxTdGF0ZSB8ICgoIGNlbGwuZW5lcmdpc2VkID8gMSA6IDApIDw8IDE1KTtcbiAgICB9XG5cbiAgICBncm93KCl7XG4gICAgICAgIHRoaXMuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gZ3Jvd1xuICAgICAgICAgICAgaWYocmFuZG9tUHJvYigwLjgpKXtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VzID0gdGhpcy5nZXRHcm93RGlyZWN0aW9uKGNlbGwpO1xuICAgICAgICAgICAgICAgIGlmKHNwYWNlcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHNwYWNlc1tyYW5kb21JbnQoMCwgc3BhY2VzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdyb3cgdGhlIHBsYW50IGJ5IG9uZSBjZWxsIGlmIHBvc3NpYmxlXG4gICAgICogQHBhcmFtIHsqfSBjZWxsIHRoZSBjZWxsIHRvIGdyb3cgZnJvbVxuICAgICAqIEBwYXJhbSB7Kn0gZGlyZWN0aW9uIHRoZSBkaXJlY3Rpb24gdG8gZ3JvdyBpblxuICAgICAqL1xuICAgIGdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24sIHN0ZXBudW0pe1xuICAgICAgICB2YXIgeCA9IGNlbGwueCtkaXJlY3Rpb25bMF0sIHkgPSBjZWxsLnkrZGlyZWN0aW9uWzFdO1xuICAgICAgICAvLyBjaGVjayBpZiBzcGFjZSBpcyBjbGVhclxuICAgICAgICB2YXIgc3BhY2UgPSB0aGlzLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgICAgIGlmIChzcGFjZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BhY2UgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgIGlmIChzcGFjZS5wbGFudCA9PT0gdGhpcyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBdHRhY2sgb2NjdXJzXG4gICAgICAgICAgICBpZiAodGhpcy53b3JsZC5vbkF0dGFjaykgdGhpcy53b3JsZC5vbkF0dGFjaygpO1xuXG4gICAgICAgICAgICAvLyB0aGlzIHBsYW50IHdpbGwga2lsbCB0aGUgb3RoZXJcbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9iYWJpbGl0eS4uLlxuICAgICAgICAgICAgaWYocmFuZG9tUHJvYihzcGFjZS5wbGFudC5nZXRLaWxsUHJvYmFiaWxpdHkoKSkpe1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBzdWNjZWVkZWQuIEtpbGwgY29tcGV0aXRvciBhbmQgY29udGludWUgd2l0aCBncm93dGhcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChzcGFjZS5wbGFudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgZmFpbGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgLy8gZ3JvdyBjZWxsIGluIHRvIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBuZXdfY2VsbCA9IG5ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgeSk7XG4gICAgICAgIHRoaXMuY2VsbHMucHVzaChuZXdfY2VsbCk7XG4gICAgICAgIFxuICAgICAgICAvLyBVcGRhdGUgaW5jcmVtZW50YWwgdHJhY2tpbmdcbiAgICAgICAgY29uc3Qgcm9vdENlbGwgPSB0aGlzLmNlbGxzWzBdO1xuICAgICAgICBjb25zdCBsZSA9IHRoaXMud29ybGQud2lkdGgvMiAtICggKCggMS41KnRoaXMud29ybGQud2lkdGggKSArIG5ld19jZWxsLnggLSByb290Q2VsbC54KSAgJSB0aGlzLndvcmxkLndpZHRoKTtcbiAgICAgICAgdGhpcy5sZWFub3ZlckVuZXJnaXNlZCArPSBsZTtcblxuICAgICAgICB0aGlzLndvcmxkLmFkZENlbGwobmV3X2NlbGwpO1xuICAgIH1cblxuICAgIGdldEtpbGxQcm9iYWJpbGl0eSgpe1xuICAgICAgICByZXR1cm4gMS90aGlzLmVuZXJnaXNlZENvdW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB3aGV0aGVyIHRoaXMgcGxhbnQgc2hvdWxkIGRpZS5cbiAgICAgKiBAcGFyYW0ge30gbmF0dXJhbF9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gZW5lcmd5X2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGVuZXJneSByaWNoIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBsZWFub3Zlcl9mYWN0b3IgZmFjdG9yIHRvIHRoZSBsZWFub3ZlciB0ZXJtXG4gICAgICovXG4gICAgZ2V0RGVhdGhQcm9iYWJpbGl0eShkZWF0aF9mYWN0b3IsIG5hdHVyYWxfZXhwLCBlbmVyZ3lfZXhwLCBsZWFub3Zlcl9mYWN0b3Ipe1xuICAgICAgICB2YXIgbnVtQ2VsbHMgPSB0aGlzLmNlbGxzLmxlbmd0aDtcbiAgICAgICAgXG4gICAgICAgIHZhciBsZWFub3ZlckNlbGxzID0gMi8obnVtQ2VsbHMqKG51bUNlbGxzLTEpKTtcbiAgICAgICAgaWYgKGxlYW5vdmVyQ2VsbHMgPT09IEluZmluaXR5KXtcbiAgICAgICAgICAgIGxlYW5vdmVyQ2VsbHMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYW5vdmVyVGVybSA9IGxlYW5vdmVyQ2VsbHMqTWF0aC5hYnModGhpcy5sZWFub3ZlckVuZXJnaXNlZCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZF9uYXR1cmFsID0gTWF0aC5wb3cobnVtQ2VsbHMsIG5hdHVyYWxfZXhwKTtcbiAgICAgICAgdmFyIGRfZW5lcmd5ID0gTWF0aC5wb3codGhpcy5lbmVyZ2lzZWRDb3VudCsxLCBlbmVyZ3lfZXhwKTtcbiAgICAgICAgdmFyIGRfbGVhbm92ZXIgPSBsZWFub3Zlcl9mYWN0b3IqbGVhbm92ZXJUZXJtO1xuICAgICAgICB2YXIgcERlYXRoID0gZGVhdGhfZmFjdG9yICogZF9uYXR1cmFsICogZF9lbmVyZ3kgKyBkX2xlYW5vdmVyO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJwcm9iXCI6IHBEZWF0aCxcbiAgICAgICAgICAgIFwibmF0dXJhbFwiOiBkX25hdHVyYWwsXG4gICAgICAgICAgICBcImVuZXJneVwiOiBkX2VuZXJneSxcbiAgICAgICAgICAgIFwibGVhbm92ZXJcIjogZF9sZWFub3ZlclxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGxhbnQgfTsiLCJpbXBvcnQgc2VlZHJhbmRvbSBmcm9tIFwic2VlZHJhbmRvbVwiO1xuXG4vKipcbiAqIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byBNYXRoLnJhbmRvbVxuICogQHBhcmFtIHsqfSBzZWVkIGRhdGEgdG8gdXNlIHRvIHNlZWQgYWxsIGZ1dHVyZSBSTkcgY2FsbHNcbiAqL1xuZnVuY3Rpb24gc2VlZFJhbmRvbShzZWVkKXtcbiAgICBzZWVkcmFuZG9tKHNlZWQsIHtnbG9iYWw6IHRydWV9KTtcbn1cblxuLyoqXG4gKiByZXR1cm5zIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiAwIGFuZCBtYXggKGluY2x1c2l2ZSlcbiAqIEBwYXJhbSB7Kn0gbWF4IG1heGltdW0gaW50ZWdlciB0byBnZW5lcmF0ZSBhcyBhIHJhbmRvbSBudW1iZXJcbiAqL1xuZnVuY3Rpb24gcmFuZG9tSW50KG1pbiwgbWF4KXtcbiAgICAvLyBub3RlOiBNYXRoLnJhbmRvbSByZXR1cm5zIGEgcmFuZG9tIG51bWJlciBleGNsdXNpdmUgb2YgMSxcbiAgICAvLyBzbyB0aGVyZSBpcyArMSBpbiB0aGUgYmVsb3cgZXF1YXRpb24gdG8gZW5zdXJlIHRoZSBtYXhpbXVtXG4gICAgLy8gbnVtYmVyIGlzIGNvbnNpZGVyZWQgd2hlbiBmbG9vcmluZyAwLjkuLi4gcmVzdWx0cy5cbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZXMgdGhlIGNoYW5jZSBvZiBhbiBldmVudCBoYXBwZW5pbmcgZ2l2ZW4gcHJvYlxuICogQHBhcmFtIHsqfSBwcm9iIGZyYWN0aW9uIGJldHdlZW4gMCBhbmQgMSBjaGFuY2Ugb2YgdGhlIGV2ZW50IGhhcHBlbmluZ1xuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgZXZlbnQgaGFwcGVucywgZmFsc2UgaWYgbm90XG4gKi9cbmZ1bmN0aW9uIHJhbmRvbVByb2IocHJvYil7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgPD0gcHJvYjtcbn1cblxuZXhwb3J0IHtzZWVkUmFuZG9tLCByYW5kb21JbnQsIHJhbmRvbVByb2J9OyIsImltcG9ydCAqIGFzIHN0YXRzIGZyb20gXCJzdGF0cy1saXRlXCI7XG5cbmZ1bmN0aW9uIGxldmVuc2h0ZWluKGEsIGIpIHtcbiAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiBiLmxlbmd0aDtcbiAgICBpZiAoYi5sZW5ndGggPT09IDApIHJldHVybiBhLmxlbmd0aDtcbiAgICBsZXQgbWF0cml4ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gYi5sZW5ndGg7IGkrKykgbWF0cml4W2ldID0gW2ldO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDw9IGEubGVuZ3RoOyBqKyspIG1hdHJpeFswXVtqXSA9IGo7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoYltpIC0gMV0gPT09IGFbaiAtIDFdKSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gbWF0cml4W2kgLSAxXVtqIC0gMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqXSA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaSAtIDFdW2ogLSAxXSArIDEsIC8vIHN1YnN0aXR1dGlvblxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqIC0gMV0gKyAxLCAvLyBpbnNlcnRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1bal0gKyAxICAvLyBkZWxldGlvblxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0cml4W2IubGVuZ3RoXVthLmxlbmd0aF07XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUFsbGVsZUVudHJvcHkocGxhbnRzKSB7XG4gICAgaWYgKHBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIGNvbnN0IGNvdW50cyA9IG5ldyBBcnJheSgyNTYpLmZpbGwoMCk7XG4gICAgbGV0IHRvdGFsID0gMDtcbiAgICBwbGFudHMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwLmdlbm9tZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY291bnRzW3AuZ2Vub21lW2ldXSsrO1xuICAgICAgICAgICAgdG90YWwrKztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0b3RhbCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgbGV0IGVudHJvcHkgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICAgICAgaWYgKGNvdW50c1tpXSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBjb3VudHNbaV0gLyB0b3RhbDtcbiAgICAgICAgICAgIGVudHJvcHkgLT0gcCAqIE1hdGgubG9nMihwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZW50cm9weTtcbn1cblxuY2xhc3MgU2ltRGF0YXtcblxuICAgIGNvbnN0cnVjdG9yKHNpbXVsYXRpb24pe1xuICAgICAgICB0aGlzLnNpbSA9IHNpbXVsYXRpb247XG4gICAgICAgIHRoaXMuZGF0YSA9IHtcInN0ZXBudW1cIjogW119O1xuICAgICAgICB0aGlzLmxhc3RTdGVwID0gMDtcbiAgICAgICAgdGhpcy5jb2xsZWN0b3JzID0gW1xuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBvcHVsYXRpb25cIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJ1bmlxdWVfZ2Vub3R5cGVzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgICBzaW0ud29ybGQucGxhbnRzLmZvckVhY2gocCA9PiBzZWVuLmFkZChwLmdlbm9tZS5zZXJpYWxpemUoKSkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWVuLnNpemU7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJ0b3RhbF9jZWxsc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQuY2VsbENvdW50O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX3NpemVcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQuY2VsbENvdW50IC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfZW5lcmdpc2VkXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIHAuZW5lcmdpc2VkQ291bnQsIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX2FjdGl2ZV9nZW5lc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyAocC5ydWxlcyA/IHAucnVsZXMubGVuZ3RoIDogMCksIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX2FnZVwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyAoc2ltLnN0ZXBudW0gLSBwLmJpcnRoU3RlcCksIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidG90YWxfc2VlZHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXsgcmV0dXJuIHNpbS5zdGF0cy50b3RhbFNlZWRzOyB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJmbHlpbmdfc2VlZHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXsgcmV0dXJuIHNpbS5zdGF0cy5mbHlpbmdTZWVkczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwibmV3X3BsYW50c1wiLCBBc0lzLCBmdW5jdGlvbihzaW0peyByZXR1cm4gc2ltLnN0YXRzLm5ld1BsYW50czsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZGVhdGhzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7IHJldHVybiBzaW0uc3RhdHMuZGVhdGhzOyB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdHRhY2tzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7IHJldHVybiBzaW0uc3RhdHMuYXR0YWNrczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX2RlYXRoX3Byb2JcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VtICsgcC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3JcbiAgICAgICAgICAgICAgICAgICAgKS5wcm9iO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicGxhbnRfc2l6ZV9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5jZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2Vub21lX3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLmxlbmd0aCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJtdXRfZXhwX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5tdXRfZXhwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X2hlaWdodF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWF4SCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcC5jZWxscy5sZW5ndGg7IGkrKykgaWYgKHAuY2VsbHNbaV0ueSA+IG1heEgpIG1heEggPSBwLmNlbGxzW2ldLnk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXhIO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2VuZXRpY19kaXN0YW5jZV9tZWFuXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYW50cyA9IHNpbS53b3JsZC5wbGFudHM7XG4gICAgICAgICAgICAgICAgaWYgKHBsYW50cy5sZW5ndGggPCAyKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBsZXQgc3VtRGlzdCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IHNhbXBsZVNpemUgPSBNYXRoLm1pbigzMCwgcGxhbnRzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhaXJzID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNhbXBsZVNpemU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwMSA9IHBsYW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwbGFudHMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAyID0gcGxhbnRzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBsYW50cy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAxICE9PSBwMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VtRGlzdCArPSBsZXZlbnNodGVpbihwMS5nZW5vbWUsIHAyLmdlbm9tZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWlycysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwYWlycyA+IDAgPyBzdW1EaXN0IC8gcGFpcnMgOiAwO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYWxsZWxlX2VudHJvcHlcIiwgQXNJcywgZnVuY3Rpb24oc2ltKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGN1bGF0ZUFsbGVsZUVudHJvcHkoc2ltLndvcmxkLnBsYW50cyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbGxlY3QgZGF0YSBmb3IgdGhlIGN1cnJlbnQgc3RlcFxuICAgICAqL1xuICAgIHJlY29yZFN0ZXAoKXtcbiAgICAgICAgY29uc3QgZGVsdGEgPSB0aGlzLnNpbS5zdGVwbnVtIC0gdGhpcy5sYXN0U3RlcDtcbiAgICAgICAgdGhpcy5sYXN0U3RlcCA9IHRoaXMuc2ltLnN0ZXBudW07XG5cbiAgICAgICAgdmFyIHN0ZXBEYXRhID0ge307XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGMpe1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGMuY29sbGVjdCh0aGlzLnNpbSk7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHN0ZXBEYXRhLCB2YWx1ZXMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAvLyBOb3JtYWxpemUgcmF0ZS1iYXNlZCBtZXRyaWNzIGJ5IHRoZSBudW1iZXIgb2Ygc3RlcHMgc2luY2UgdGhlIGxhc3QgcmVjb3JkXG4gICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHJhdGVLZXlzID0gW1wibmV3X3BsYW50c1wiLCBcImRlYXRoc1wiLCBcImF0dGFja3NcIiwgXCJ0b3RhbF9zZWVkc1wiLCBcImZseWluZ19zZWVkc1wiXTtcbiAgICAgICAgICAgIHJhdGVLZXlzLmZvckVhY2goayA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN0ZXBEYXRhW2tdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RlcERhdGFba10gLz0gZGVsdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCBpbmNyZW1lbnRhbCBzdGF0cyBmb3IgdGhlIG5leHQgaW50ZXJ2YWxcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMubmV3UGxhbnRzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMuZGVhdGhzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMuYXR0YWNrcyA9IDA7XG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLnRvdGFsU2VlZHMgPSAwO1xuICAgICAgICB0aGlzLnNpbS5zdGF0cy5mbHlpbmdTZWVkcyA9IDA7XG5cbiAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5wdXNoKHRoaXMuc2ltLnN0ZXBudW0pO1xuICAgICAgICBpZiAodGhpcy5kYXRhW1wic3RlcG51bVwiXS5sZW5ndGggPiBTaW1EYXRhLk1BWF9EQVRBX1BPSU5UUykge1xuICAgICAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5rZXlzKHN0ZXBEYXRhKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAgICAgaWYgKCEoayBpbiB0aGlzLmRhdGEpKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF0YVtrXS5wdXNoKHN0ZXBEYXRhW2tdKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGFba10ubGVuZ3RoID4gU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10uc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMgPSAyMDAwO1xuXG5jbGFzcyBDb2xsZWN0b3J7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZWNscywgY29sbGVjdEZ1bmMpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnR5cGUgPSBuZXcgdHlwZWNscyhuYW1lKTtcbiAgICAgICAgdGhpcy5mdW5jID0gY29sbGVjdEZ1bmM7XG4gICAgfVxuXG4gICAgY29sbGVjdChzaW0pe1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZnVuYyhzaW0pO1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnRyYW5zZm9ybShkYXRhKTtcbiAgICB9XG59XG5cbmNsYXNzIENvbGxlY3RvclR5cGV7XG4gICAgY29uc3RydWN0b3IobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZCBtZXRob2RcIik7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtKGRhdGEpe1xuICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy50cmFuc2Zvcm1EYXRhKGRhdGEpO1xuICAgICAgICB2YXIgdHJhbnNmb3JtZWRfZGF0YSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgICAgICB0cmFuc2Zvcm1lZF9kYXRhW3RoaXMubmFtZSArIGtdID0gdmFsdWVzW2tdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkX2RhdGE7XG4gICAgfVxufVxuXG5jbGFzcyBBc0lzIGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICByZXR1cm4ge1wiXCI6IGRhdGF9O1xuICAgIH1cbn1cblxuY2xhc3MgU3VtbWFyeSBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIm1pblwiOiBNYXRoLm1pbihkYXRhKSwgXCJtZWFuXCI6IHN0YXRzLm1lYW4oZGF0YSksIFwibWF4XCI6IE1hdGgubWF4KGRhdGEpfTtcbiAgICB9XG59XG5leHBvcnQge1NpbURhdGF9OyIsImltcG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1dvcmxkfSBmcm9tIFwiLi93b3JsZC5qc1wiO1xuaW1wb3J0IHtCeXRlQXJyYXksIEJsb2NrSW50ZXJwcmV0ZXIsIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9IGZyb20gXCIuL2dlbm9tZS5qc1wiO1xuXG5jbGFzcyBTaW11bGF0aW9uUGFyYW1ze1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcz17fSl7XG4gICAgICAgIHRoaXMucmFuZG9tX3NlZWQgPSAxO1xuICAgICAgICB0aGlzLnJlY29yZF9pbnRlcnZhbCA9IDEwO1xuICAgICAgICB0aGlzLnN0ZXBzX3Blcl9mcmFtZSA9IDE7XG4gICAgICAgIHRoaXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWwgPSAwO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX3N0cmVuZ3RoID0gMC4xO1xuXG4gICAgICAgIHRoaXMud29ybGRfd2lkdGggPSAyNTA7XG4gICAgICAgIHRoaXMud29ybGRfaGVpZ2h0ID0gNDA7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9wb3B1bGF0aW9uID0gMjUwO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmVyZ3lfcHJvYiA9IDAuNTtcblxuICAgICAgICAvLyBkZWF0aCBwYXJhbXNcbiAgICAgICAgdGhpcy5kZWF0aF9mYWN0b3IgPSAwLjI7XG4gICAgICAgIHRoaXMubmF0dXJhbF9leHAgPSAwO1xuICAgICAgICB0aGlzLmVuZXJneV9leHAgPSAtMi41O1xuICAgICAgICB0aGlzLmxlYW5vdmVyX2ZhY3RvciA9IDAuMjtcblxuICAgICAgICAvLyBtdXRhdGlvbnNcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZV9tb2RlID0gXCJieXRld2lzZVwiO1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlID0gMC4wMDI7XG4gICAgICAgIHRoaXMubXV0X2luc2VydCA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZGVsZXRlID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9mYWN0b3IgPSAxLjU7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9tdXRfZXhwID0gMDtcblxuICAgICAgICB0aGlzLmdlbm9tZV9pbnRlcnByZXRlciA9IFwiYmxvY2tcIjtcbiAgICAgICAgdGhpcy5pbml0aWFsX2dlbm9tZV9sZW5ndGggPSA0MDA7XG5cbiAgICAgICAgLy8gZGl2aWRlLCBmbHlpbmdzZWVkLCBsb2NhbHNlZWQsIG11dCssIG11dC0sIHN0YXRlYml0XG4gICAgICAgIHRoaXMuYWN0aW9uX21hcCA9IFsyMDAsIDIwLCAwLCAxOCwgMTgsIDBdO1xuXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgcGFyYW1zKTtcbiAgICB9XG59XG5cbmNsYXNzIFNpbXVsYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcblxuICAgICAgICAvLyBTZWVkIGFsbCBmdXR1cmUgY2FsbHMgdG8gcmFuZG9tXG4gICAgICAgIC8vIHRoaXMgbWFrZXMgb3V0IHRlc3RzIHJlcHJvZHVjaWJsZSBnaXZlbiB0aGUgc2FtZSBzZWVkIGlzIHVzZWRcbiAgICAgICAgLy8gaW4gZnV0dXJlIGlucHV0IHBhcmFtZXRlcnNcbiAgICAgICAgc2VlZFJhbmRvbSh0aGlzLnBhcmFtcy5yYW5kb21fc2VlZCk7XG5cbiAgICAgICAgdGhpcy53b3JsZCA9IG5ldyBXb3JsZCh0aGlzLnBhcmFtcy53b3JsZF93aWR0aCwgdGhpcy5wYXJhbXMud29ybGRfaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5nZW5vbWVJbnRlcnByZXRlciA9IHRoaXMuZ2V0SW50ZXJwcmV0ZXIoKTtcbiAgICAgICAgdGhpcy5tdXRfdW5pdHMgPSAxO1xuICAgICAgICAvLyBlbnN1cmUgbXV0YXRpb24gdW5pdHMgaXMgY29tcGF0aWJsZSB3aXRoIHRoZSBpbnRlcnByZXRlciB0eXBlXG4gICAgICAgIGlmKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBCbG9ja0ludGVycHJldGVyKXtcbiAgICAgICAgICAgIHRoaXMubXV0X3VuaXRzID0gMjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0ZXBudW0gPSAwO1xuICAgICAgICB0aGlzLnN0YXRzID0geyBcbiAgICAgICAgICAgIGF0dGFja3M6IDAsIFxuICAgICAgICAgICAgZGVhdGhzOiAwLCBcbiAgICAgICAgICAgIHRvdGFsU2VlZHM6IDAsIFxuICAgICAgICAgICAgZmx5aW5nU2VlZHM6IDAsIFxuICAgICAgICAgICAgbmV3UGxhbnRzOiAwIFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMud29ybGQub25QbGFudEJpcnRoID0gKCkgPT4geyB0aGlzLnN0YXRzLm5ld1BsYW50cysrOyB9O1xuICAgICAgICB0aGlzLndvcmxkLm9uUGxhbnREZWF0aCA9ICgpID0+IHsgdGhpcy5zdGF0cy5kZWF0aHMrKzsgfTtcbiAgICAgICAgdGhpcy53b3JsZC5vbkF0dGFjayA9ICgpID0+IHsgdGhpcy5zdGF0cy5hdHRhY2tzKys7IH07XG4gICAgfVxuXG4gICAgZ2V0SW50ZXJwcmV0ZXIoKXtcbiAgICAgICAgc3dpdGNoICh0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIpe1xuICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmxvY2tJbnRlcnByZXRlcih0aGlzLnBhcmFtcy5hY3Rpb25fbWFwKTtcbiAgICAgICAgY2FzZSBcInByb21vdG9yXCI6XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21vdG9ySW50ZXJwcmV0ZXIodGhpcy5wYXJhbXMuYWN0aW9uX21hcCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaW50ZXJwcmV0ZXIgJHt0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXJ9YCk7XG4gICAgICAgIH0gIFxuICAgIH1cblxuICAgIGluaXRfcG9wdWxhdGlvbigpe1xuICAgICAgICAvLyByYW5kb21seSBjaG9vc2Ugc3BvdHMgdG8gc2VlZCB0aGUgd29ybGQgd2l0aFxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5wYXJhbXMuaW5pdGlhbF9wb3B1bGF0aW9uOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5uZXdTZWVkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBwb3B1bGF0aW9uIGZyb20gYSBsaXN0IG9mIHNlcmlhbGl6ZWQgZ2Vub21lIHN0cmluZ3MsXG4gICAgICogZHJhd2luZyB3aXRoIHJlcGxhY2VtZW50IHVwIHRvIGluaXRpYWxfcG9wdWxhdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBzZXJpYWxpemVkR2Vub21lc1xuICAgICAqL1xuICAgIGluaXRfcG9wdWxhdGlvbl9mcm9tX2dlbm9tZXMoc2VyaWFsaXplZEdlbm9tZXMpe1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5wYXJhbXMuaW5pdGlhbF9wb3B1bGF0aW9uOyBpKyspe1xuICAgICAgICAgICAgY29uc3Qgc3RyID0gc2VyaWFsaXplZEdlbm9tZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2VyaWFsaXplZEdlbm9tZXMubGVuZ3RoKV07XG4gICAgICAgICAgICBjb25zdCBnZW5vbWUgPSBCeXRlQXJyYXkuZGVzZXJpYWxpemUoc3RyKTtcbiAgICAgICAgICAgIHRoaXMud29ybGQuc2VlZChnZW5vbWUsIG51bGwsIHRoaXMuc3RlcG51bSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXdTZWVkKCl7XG4gICAgICAgIC8vIGNyZWF0ZSBhIHJhbmRvbSBnZW5vbWVcbiAgICAgICAgdmFyIGdlbm9tZSA9IEJ5dGVBcnJheS5yYW5kb20odGhpcy5wYXJhbXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoKTtcbiAgICAgICAgdGhpcy53b3JsZC5zZWVkKGdlbm9tZSwgbnVsbCwgdGhpcy5zdGVwbnVtKTtcbiAgICB9XG5cbiAgICBzdGVwKCl7XG4gICAgICAgIHRoaXMuc3RlcG51bSsrO1xuICAgICAgICB0aGlzLnNpbXVsYXRlRGVhdGgoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUxpZ2h0KCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMubXV0YXRlKCk7XG4gICAgfVxuXG4gICAgc2ltdWxhdGVBY3Rpb25zKCl7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53b3JsZC5wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gdGhpcy53b3JsZC5wbGFudHNbaV07XG4gICAgICAgICAgICBpZiAoIXBsYW50LnJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgcGxhbnQucnVsZXMgPSB0aGlzLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcnVsZXMgPSBwbGFudC5ydWxlcztcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGxhbnQuY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxBY3Rpb24ocGxhbnQuY2VsbHNbal0sIHJ1bGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNlbGxBY3Rpb24oY2VsbCwgcnVsZXMpe1xuICAgICAgICB2YXIgc3RhdGU7XG4gICAgICAgIGlmICh0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgQmxvY2tJbnRlcnByZXRlcil7XG4gICAgICAgICAgICBzdGF0ZSA9IGNlbGwucGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgaW5zdGFuY2VvZiBQcm9tb3RvckludGVycHJldGVyKXtcbiAgICAgICAgICAgIHN0YXRlID0gY2VsbC5wbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgcnVsZXMuZm9yRWFjaChmdW5jdGlvbihydWxlKXtcbiAgICAgICAgICAgIC8vIGV4ZWN1dGUgb25lIGFjdGlvbiB1c2luZyB0aGUgZmlyc3QgbWF0Y2hpbmcgcnVsZVxuICAgICAgICAgICAgaWYgKHJ1bGUubWF0Y2hlcyhzdGF0ZSkpe1xuICAgICAgICAgICAgICAgIC8vIFRyYWNrIHNlZWRzXG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUuYWN0aW9uLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiRmx5aW5nU2VlZFwiKSBzZWxmLnN0YXRzLmZseWluZ1NlZWRzKys7XG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUuYWN0aW9uLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiRmx5aW5nU2VlZFwiIHx8IHJ1bGUuYWN0aW9uLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiTG9jYWxTZWVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGF0cy50b3RhbFNlZWRzKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJ1bGUuYWN0aW9uLmV4ZWN1dGUoY2VsbCwgc2VsZi5zdGVwbnVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGNlbGwudXBkYXRlU3RhdGUoKTtcbiAgICB9XG5cbiAgICBtdXRhdGUoKXtcbiAgICAgICAgdmFyIG11dGF0b3IgPSBuZXcgTXV0YXRvcih0aGlzLnBhcmFtcy5tdXRfZmFjdG9yLCB0aGlzLnBhcmFtcy5tdXRfcmVwbGFjZSwgXG4gICAgICAgICAgICB0aGlzLnBhcmFtcy5tdXRfaW5zZXJ0LCB0aGlzLnBhcmFtcy5tdXRfZGVsZXRlLCBcbiAgICAgICAgICAgIDAsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlX21vZGUsIHRoaXMubXV0X3VuaXRzKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndvcmxkLnBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGxhbnQgPSB0aGlzLndvcmxkLnBsYW50c1tpXTtcbiAgICAgICAgICAgIGlmIChtdXRhdG9yLm11dGF0ZShwbGFudC5nZW5vbWUpKSB7XG4gICAgICAgICAgICAgICAgcGxhbnQucnVsZXMgPSBudWxsOyAvLyBJbnZhbGlkYXRlIGNhY2hlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgZWFjaCBwbGFudCdzIGN1cnJlbnQgZGVhdGggcHJvYmFiaWxpdHkgdG8gc2ltdWxhdGVcbiAgICAgKiB3aGV0aGVyIGVhY2ggcGxhbnQgZGllcyBvbiB0aGlzIHN0ZXBcbiAgICAgKi9cbiAgICBzaW11bGF0ZURlYXRoKCl7XG4gICAgICAgIGNvbnN0IGRlYWRfcGxhbnRzID0gW107XG4gICAgICAgIGNvbnN0IHBsYW50cyA9IHRoaXMud29ybGQucGxhbnRzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGxhbnQgPSBwbGFudHNbaV07XG4gICAgICAgICAgICBjb25zdCBkZWF0aFByb2IgPSBwbGFudC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmxlYW5vdmVyX2ZhY3RvclxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChyYW5kb21Qcm9iKGRlYXRoUHJvYi5wcm9iKSl7XG4gICAgICAgICAgICAgICAgZGVhZF9wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWFkX3BsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy53b3JsZC5raWxsUGxhbnQoZGVhZF9wbGFudHNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGUgbGlnaHQuIFN1bmxpZ2h0IHRyYXZlcnNlcyBmcm9tIHRoZSBjZWlsaW5nIG9mIHRoZSB3b3JsZFxuICAgICAqIGRvd253YXJkcyB2ZXJ0aWNhbGx5LiBJdCBpcyBjYXVnaHQgYnkgYSBwbGFudCBjZWxsIHdpdGggYSBwcm9iYWJpbGl0eVxuICAgICAqIHdoaWNoIGNhdXNlcyB0aGF0IGNlbGwgdG8gYmUgZW5lcmdpc2VkLlxuICAgICAqL1xuICAgIHNpbXVsYXRlTGlnaHQoKXtcbiAgICAgICAgY29uc3QgY29sVG9wcyA9IG5ldyBJbnQxNkFycmF5KHRoaXMud29ybGQud2lkdGgpLmZpbGwoLTEpO1xuICAgICAgICBjb25zdCBwbGFudHMgPSB0aGlzLndvcmxkLnBsYW50cztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNlbGxzID0gcGxhbnRzW2ldLmNlbGxzO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjZWxsc1tqXTtcbiAgICAgICAgICAgICAgICBpZiAoY2VsbC55ID4gY29sVG9wc1tjZWxsLnhdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbFRvcHNbY2VsbC54XSA9IGNlbGwueTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IobGV0IHg9MDsgeDx0aGlzLndvcmxkLndpZHRoOyB4Kyspe1xuICAgICAgICAgICAgY29uc3QgdG9wWSA9IGNvbFRvcHNbeF07XG4gICAgICAgICAgICBpZiAodG9wWSA9PT0gLTEpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBmb3IobGV0IHk9dG9wWTsgeT49MDsgeS0tKXtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gdGhpcy53b3JsZC5jZWxsc1t4XVt5XTtcbiAgICAgICAgICAgICAgICBpZihjZWxsICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocmFuZG9tUHJvYih0aGlzLnBhcmFtcy5lbmVyZ3lfcHJvYikpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5lbmVyZ2lzZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc307IiwiaW1wb3J0IHtTaW11bGF0aW9uLCBTaW11bGF0aW9uUGFyYW1zfSBmcm9tIFwiLi9zaW11bGF0aW9uLmpzXCI7XG5pbXBvcnQge1NpbURhdGF9IGZyb20gXCIuL3NpbWRhdGEuanNcIjtcblxubGV0IHNpbXVsYXRpb24gPSBudWxsO1xubGV0IGRhdGEgPSBudWxsO1xubGV0IHJ1bm5pbmcgPSBmYWxzZTtcbmxldCBjZWxsU2l6ZSA9IDI7XG5jb25zdCBUQVJHRVRfRlBTID0gNjA7XG5jb25zdCBGUkFNRV9JTlRFUlZBTF9NUyA9IDEwMDAgLyBUQVJHRVRfRlBTO1xubGV0IGxhc3RGcmFtZVRpbWUgPSAwO1xuXG5zZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgY29uc3QgbXNnID0gZXZlbnQuZGF0YTtcbiAgICBzd2l0Y2ggKG1zZy50eXBlKSB7XG4gICAgY2FzZSBcImluaXRcIjpcbiAgICAgICAgaW5pdFNpbShtc2cucGFyYW1zLCBtc2cuZ2Vub21lcyB8fCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0YXJ0XCI6XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBsb29wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdG9wXCI6XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0ZXBcIjpcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBwdXNoU3RhdHMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImdldENlbGxcIjpcbiAgICAgICAgc2VuZENlbGxJbmZvKG1zZy54LCBtc2cueSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJkaXN0dXJiXCI6XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2UobXNnLnN0cmVuZ3RoKTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJraWxsQ2VsbFwiOlxuICAgICAgICBraWxsQ2VsbEF0KG1zZy54LCBtc2cueSk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwidXBkYXRlRGlzcGxheVBhcmFtc1wiOlxuICAgICAgICBpZiAoc2ltdWxhdGlvbiAmJiBzaW11bGF0aW9uLnBhcmFtcykge1xuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lID0gbXNnLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnJlY29yZF9pbnRlcnZhbCA9IG1zZy5yZWNvcmRfaW50ZXJ2YWw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImV4cG9ydFwiOlxuICAgICAgICBleHBvcnRHZW5vbWVzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGluaXRTaW0ocGFyYW1zLCBpbXBvcnRlZEdlbm9tZXM9bnVsbCkge1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBjb25zdCBzaW1fcGFyYW1zID0gbmV3IFNpbXVsYXRpb25QYXJhbXMocGFyYW1zKTtcbiAgICBjZWxsU2l6ZSA9IHBhcmFtcy5jZWxsU2l6ZSB8fCA4O1xuICAgIHNpbXVsYXRpb24gPSBuZXcgU2ltdWxhdGlvbihzaW1fcGFyYW1zKTtcbiAgICBkYXRhID0gbmV3IFNpbURhdGEoc2ltdWxhdGlvbik7XG4gICAgaWYgKGltcG9ydGVkR2Vub21lcyAmJiBpbXBvcnRlZEdlbm9tZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbl9mcm9tX2dlbm9tZXMoaW1wb3J0ZWRHZW5vbWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbigpO1xuICAgIH1cbiAgICBwdXNoRnJhbWUoKTtcbiAgICBwdXNoU3RhdHMoKTtcbn1cblxuZnVuY3Rpb24gbG9vcCgpIHtcbiAgICBpZiAoIXJ1bm5pbmcpIHJldHVybjtcblxuICAgIGNvbnN0IHNwZiA9IHNpbXVsYXRpb24ucGFyYW1zLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNwZjsgaSsrKSB7XG4gICAgICAgIGRvU3RlcCgpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgaWYgKG5vdyAtIGxhc3RGcmFtZVRpbWUgPj0gRlJBTUVfSU5URVJWQUxfTVMpIHtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIHB1c2hTdGF0cygpO1xuICAgICAgICBsYXN0RnJhbWVUaW1lID0gbm93O1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQobG9vcCwgMCk7XG59XG5cbmZ1bmN0aW9uIGRvU3RlcCgpIHtcbiAgICBzaW11bGF0aW9uLnN0ZXAoKTtcblxuICAgIC8vIFBlcmlvZGljIGRpc3R1cmJhbmNlXG4gICAgY29uc3QgZGkgPSBzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9pbnRlcnZhbDtcbiAgICBpZiAoZGkgPiAwICYmIHNpbXVsYXRpb24uc3RlcG51bSAlIGRpID09PSAwKSB7XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2Uoc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChzaW11bGF0aW9uLnN0ZXBudW0gJSBzaW11bGF0aW9uLnBhcmFtcy5yZWNvcmRfaW50ZXJ2YWwgPT09IDAgfHwgc2ltdWxhdGlvbi5zdGVwbnVtID09PSAxKSB7XG4gICAgICAgIGRhdGEucmVjb3JkU3RlcCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcHVzaFN0YXRzKCkge1xuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcInN0YXRzXCIsXG4gICAgICAgIGRhdGE6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YS5kYXRhKSksXG4gICAgICAgIHN0ZXBudW06IHNpbXVsYXRpb24uc3RlcG51bVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseURpc3R1cmJhbmNlKHN0cmVuZ3RoKSB7XG4gICAgY29uc3Qgd29ybGQgPSBzaW11bGF0aW9uLndvcmxkO1xuICAgIGNvbnN0IHBsYW50cyA9IHdvcmxkLnBsYW50cztcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGNvbnN0IG51bVRvS2lsbCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3Ioc3RyZW5ndGggKiBwbGFudHMubGVuZ3RoKSk7XG4gICAgLy8gU2h1ZmZsZSBhIHNhbXBsZSBhbmQga2lsbFxuICAgIGNvbnN0IHNodWZmbGVkID0gcGxhbnRzLnNsaWNlKCkuc29ydCgoKSA9PiBNYXRoLnJhbmRvbSgpIC0gMC41KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRvS2lsbCAmJiBpIDwgc2h1ZmZsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2hlY2sgcGxhbnQgc3RpbGwgYWxpdmUgKG5vdCBraWxsZWQgYnkgcHJldmlvdXMgaXRlcmF0aW9uKVxuICAgICAgICBpZiAod29ybGQucGxhbnRzLmluY2x1ZGVzKHNodWZmbGVkW2ldKSkge1xuICAgICAgICAgICAgd29ybGQua2lsbFBsYW50KHNodWZmbGVkW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24ga2lsbENlbGxBdCh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoY2VsbCAmJiBjZWxsLnBsYW50KSB7XG4gICAgICAgIHNpbXVsYXRpb24ud29ybGQua2lsbFBsYW50KGNlbGwucGxhbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZXhwb3J0R2Vub21lcygpIHtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgIHNpbXVsYXRpb24ud29ybGQucGxhbnRzLmZvckVhY2gocGxhbnQgPT4ge1xuICAgICAgICBzZWVuLmFkZChwbGFudC5nZW5vbWUuc2VyaWFsaXplKCkpO1xuICAgIH0pO1xuICAgIGNvbnN0IGdlbm9tZXMgPSBBcnJheS5mcm9tKHNlZW4pO1xuICAgIGNvbnN0IGV4cG9ydEJ1bmRsZSA9IHtcbiAgICAgICAgYWN0aW9uX21hcDogc2ltdWxhdGlvbi5wYXJhbXMuYWN0aW9uX21hcCxcbiAgICAgICAgZ2Vub21lX2ludGVycHJldGVyOiBzaW11bGF0aW9uLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIsXG4gICAgICAgIGdlbm9tZXNcbiAgICB9O1xuICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImV4cG9ydGVkR2Vub21lc1wiLCBidW5kbGU6IGV4cG9ydEJ1bmRsZSB9KTtcbn1cblxuZnVuY3Rpb24gcHVzaEZyYW1lKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpO1xuICAgIC8vIFRyYW5zZmVyIG93bmVyc2hpcCBvZiB0aGUgQXJyYXlCdWZmZXIgZm9yIHplcm8tY29weSBwZXJmb3JtYW5jZVxuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcImZyYW1lXCIsXG4gICAgICAgIGJ1ZmZlcjogcmVzdWx0LmJ1ZmZlci5idWZmZXIsXG4gICAgICAgIHdpZHRoOiByZXN1bHQud2lkdGgsXG4gICAgICAgIGhlaWdodDogcmVzdWx0LmhlaWdodCxcbiAgICAgICAgY2VsbENvdW50OiByZXN1bHQuY2VsbENvdW50LFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9LCBbcmVzdWx0LmJ1ZmZlci5idWZmZXJdKTtcbn1cblxuZnVuY3Rpb24gc2VuZENlbGxJbmZvKHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmICghY2VsbCB8fCAhY2VsbC5wbGFudCB8fCAhY2VsbC5wbGFudC5nZW5vbWUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBsYW50ID0gY2VsbC5wbGFudDtcbiAgICAgICAgY29uc3QgcnVsZXMgPSBzaW11bGF0aW9uLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUpO1xuXG4gICAgICAgIC8vIFVzZSB0aGUgY29ycmVjdCBzdGF0ZSBkZXBlbmRpbmcgb24gaW50ZXJwcmV0ZXIgdHlwZVxuICAgICAgICBsZXQgY2VsbFN0YXRlO1xuICAgICAgICBpZiAoc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyID09PSBcImJsb2NrXCIpIHtcbiAgICAgICAgICAgIGNlbGxTdGF0ZSA9IHBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsU3RhdGUgPSBwbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZWlnaGJvdXJob29kID0gcGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgY29uc3QgZW5lcmdpc2VkID0gY2VsbC5lbmVyZ2lzZWQ7XG5cbiAgICAgICAgLy8gU2VyaWFsaXplIHJ1bGVzIGFzIHN0cnVjdHVyZWQgb2JqZWN0cyBmb3IgcmljaCBVSSByZW5kZXJpbmdcbiAgICAgICAgY29uc3Qgc2VyaWFsaXplZFJ1bGVzID0gcnVsZXMubWFwKChyLCBpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gci5tYXRjaGVzKGNlbGxTdGF0ZSk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb25TdHIgPSByLmFjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgY29uc3QgaXNEaXYgPSBhY3Rpb25TdHIuc3RhcnRzV2l0aChcImRpdmlkZVwiKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyxcbiAgICAgICAgICAgICAgICBzdGF0ZTogci5zdGF0ZSxcbiAgICAgICAgICAgICAgICBlcU1hc2s6IHIuZXFNYXNrLFxuICAgICAgICAgICAgICAgIGFjdGlvblR5cGU6IGlzRGl2ID8gXCJkaXZpZGVcIiA6IGFjdGlvblN0cixcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGlzRGl2ID8gci5hY3Rpb24uZ2V0RGlyZWN0aW9uKCkgOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdSdWxlSW5kZXggPSBzZXJpYWxpemVkUnVsZXMuZmluZEluZGV4KHIgPT4gci5tYXRjaGVzKTtcblxuICAgICAgICBjb25zdCBkZWF0aCA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3JcbiAgICAgICAgKTtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiBcImNlbGxJbmZvXCIsXG4gICAgICAgICAgICBmb3VuZDogdHJ1ZSxcbiAgICAgICAgICAgIGNlbGxTdHI6IGNlbGwudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIG5laWdoYm91cmhvb2QsXG4gICAgICAgICAgICBlbmVyZ2lzZWQsXG4gICAgICAgICAgICBjZWxsU3RhdGUsXG4gICAgICAgICAgICBtYXRjaGluZ1J1bGVJbmRleCxcbiAgICAgICAgICAgIGRlYXRoOiBKU09OLnN0cmluZ2lmeShkZWF0aCksXG4gICAgICAgICAgICBnZW5vbWVMZW5ndGg6IHBsYW50Lmdlbm9tZS5sZW5ndGgsXG4gICAgICAgICAgICBtdXRFeHA6IHBsYW50Lmdlbm9tZS5tdXRfZXhwLFxuICAgICAgICAgICAgcnVsZXM6IHNlcmlhbGl6ZWRSdWxlcyxcbiAgICAgICAgICAgIGludGVycHJldGVyVHlwZTogc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyLFxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQge3JhbmRvbUludH0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1BsYW50fSBmcm9tIFwiLi9wbGFudC5qc1wiO1xuaW1wb3J0IHsgQ2VsbCB9IGZyb20gXCIuL2NlbGwuanNcIjtcblxuY2xhc3MgV29ybGQge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMuY2VsbHMgPSBbXTtcbiAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgd29ybGQgbGF0dGljZSB0byBhbGwgbnVsbHNcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy53aWR0aDsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMuY2VsbHMucHVzaChbXSk7XG4gICAgICAgICAgICBmb3IodmFyIGo9MDsgajx0aGlzLmhlaWdodDsgaisrKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2ldW2pdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxhbnRzID0gW107XG4gICAgICAgIHRoaXMuY2VsbENvdW50ID0gMDtcblxuICAgICAgICB0aGlzLm9uUGxhbnRCaXJ0aCA9IG51bGw7XG4gICAgICAgIHRoaXMub25QbGFudERlYXRoID0gbnVsbDtcbiAgICAgICAgdGhpcy5vbkF0dGFjayA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMgYXJyYXkgb2YgeCBwb3NpdGlvbnMgYXQgeT0wIHdoZXJlIG5vIGNlbGwgZXhpc3RzXG4gICAgICovXG4gICAgZ2V0Rmxvb3JTcGFjZSgpe1xuICAgICAgICB2YXIgZW1wdHlTcGFjZXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy53aWR0aDsgaSsrKXtcbiAgICAgICAgICAgIGlmKHRoaXMuY2VsbHNbaV1bMF0gPT09IG51bGwpe1xuICAgICAgICAgICAgICAgIGVtcHR5U3BhY2VzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVtcHR5U3BhY2VzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0cmF0ZWdpZXMgZm9yIHNvd2luZyBhIHNlZWQgb24gdGhlIHdvcmxkIGZsb29yXG4gICAgICogQHBhcmFtIHsqfSBnZW5vbWUgdGhlIGdlbm9tZSB1c2VkIGJ5IHRoZSBuZXcgc2VlZFxuICAgICAqIEBwYXJhbSB7Kn0gbmVhclggaWYgbm90IG51bGwsIHRyeSB0byBzb3cgYSBzZWVkIGFzIGNsb3NlXG4gICAgICogYXMgcG9zc2libGUgdG8gdGhpcyBsb2NhdGlvblxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiBhIHNlZWQgd2FzIHN1Y2Nlc2Z1bGx5IHBsYW50ZWQsIGZhbHNlIGlmXG4gICAgICogdGhlcmUgd2FzIG5vIHNwYWNlIHRvIHNvdyBhIHNlZWQuXG4gICAgICovXG4gICAgc2VlZChnZW5vbWUsIG5lYXJYLCBzdGVwbnVtKXtcbiAgICAgICAgLy8gZmluZCBhIHJhbmRvbSBlbXB0eSBzcGFjZVxuICAgICAgICB2YXIgZW1wdHlTcGFjZXMgPSB0aGlzLmdldEZsb29yU3BhY2UoKTtcbiAgICAgICAgaWYoZW1wdHlTcGFjZXMubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5lYXJYICE9PSB1bmRlZmluZWQgJiYgbmVhclggIT09IG51bGwpe1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RYID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0X2RpZmYgPSB0aGlzLndpZHRoO1xuICAgICAgICAgICAgZW1wdHlTcGFjZXMuZm9yRWFjaChmdW5jdGlvbih4cG9zKXtcbiAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IE1hdGguYWJzKG5lYXJYLXhwb3MpO1xuICAgICAgICAgICAgICAgIGlmKGRpZmYgPCBuZWFyZXN0X2RpZmYpe1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0X2RpZmYgPSBkaWZmO1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0WCA9IHhwb3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnNvd1BsYW50KGdlbm9tZSwgbmVhcmVzdFgsIHN0ZXBudW0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeCA9IGVtcHR5U3BhY2VzW3JhbmRvbUludCgwLCBlbXB0eVNwYWNlcy5sZW5ndGgtMSldO1xuICAgICAgICBpZiAodGhpcy5jZWxsc1t4XVswXSAhPT0gbnVsbCl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTcGFjZSBpcyB0YWtlblwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNvd1BsYW50KGdlbm9tZSwgeCwgc3RlcG51bSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHNvd1BsYW50KGdlbm9tZSwgeCwgc3RlcG51bSl7XG4gICAgICAgIHggPSB0aGlzLmdldFgoeCk7XG4gICAgICAgIHZhciBwbGFudCA9IG5ldyBQbGFudCh4LCB0aGlzLCBnZW5vbWUsIHN0ZXBudW0pO1xuICAgICAgICB0aGlzLnBsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgdGhpcy5hZGRDZWxsKHBsYW50LmNlbGxzWzBdKTtcbiAgICAgICAgaWYgKHRoaXMub25QbGFudEJpcnRoKSB0aGlzLm9uUGxhbnRCaXJ0aChwbGFudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBsYW50IGZyb20gd29ybGQgcGxhbnQgbGlzdC5cbiAgICAgKiBSZW1vdmUgYWxsIGNlbGxzIGZyb20gY2VsbCBncmlkXG4gICAgICovXG4gICAga2lsbFBsYW50KHBsYW50KXtcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5wbGFudHMuaW5kZXhPZihwbGFudCk7XG4gICAgICAgIGlmIChpZHggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5wbGFudHMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgICAgICB0aGlzLmNlbGxDb3VudCAtPSBwbGFudC5jZWxscy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50LmNlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IHBsYW50LmNlbGxzW2ldO1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9uUGxhbnREZWF0aCkgdGhpcy5vblBsYW50RGVhdGgocGxhbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0WCh4KXtcbiAgICAgICAgaWYoeCA8IDApe1xuICAgICAgICAgICAgeCA9IHRoaXMud2lkdGggKyB4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4ICUgdGhpcy53aWR0aDtcbiAgICB9XG5cbiAgICBnZXRDZWxsKHgsIHkpe1xuICAgICAgICByZXR1cm4gdGhpcy5jZWxsc1t0aGlzLmdldFgoeCldW3ldO1xuICAgIH1cblxuICAgIGFkZENlbGwoY2VsbCl7XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IGNlbGw7XG4gICAgICAgICAgICB0aGlzLmNlbGxDb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpe1xuICAgICAgICBjb25zdCB3ID0gdGhpcy53aWR0aCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBoID0gdGhpcy5oZWlnaHQgKiBjZWxsU2l6ZTtcbiAgICAgICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHcgKiBoICogNCk7XG4gICAgICAgIGNvbnN0IHBsYW50cyA9IHRoaXMucGxhbnRzO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHBsYW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IFtiYXNlUiwgYmFzZUcsIGJhc2VCXSA9IHRoaXMuZ2V0QmFzZUNvbG91cihwbGFudCk7XG4gICAgICAgICAgICBjb25zdCBkYXJrUiA9IE1hdGgucm91bmQoYmFzZVIgKiAwLjcpO1xuICAgICAgICAgICAgY29uc3QgZGFya0cgPSBNYXRoLnJvdW5kKGJhc2VHICogMC43KTtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtCID0gTWF0aC5yb3VuZChiYXNlQiAqIDAuNyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IGNlbGxzID0gcGxhbnQuY2VsbHM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNlbGxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IGNlbGxzW2pdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHIwID0gY2VsbC5lbmVyZ2lzZWQgPyBiYXNlUiA6IGRhcmtSO1xuICAgICAgICAgICAgICAgIGNvbnN0IGcwID0gY2VsbC5lbmVyZ2lzZWQgPyBiYXNlRyA6IGRhcmtHO1xuICAgICAgICAgICAgICAgIGNvbnN0IGIwID0gY2VsbC5lbmVyZ2lzZWQgPyBiYXNlQiA6IGRhcmtCO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHB4MCA9IGNlbGwueCAqIGNlbGxTaXplO1xuICAgICAgICAgICAgICAgIGNvbnN0IHB5MCA9ICh0aGlzLmhlaWdodCAtIDEgLSBjZWxsLnkpICogY2VsbFNpemU7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkeSA9IDA7IGR5IDwgY2VsbFNpemU7IGR5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm93SWR4ID0gKHB5MCArIGR5KSAqIHc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGR4ID0gMDsgZHggPCBjZWxsU2l6ZTsgZHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNCb3JkZXIgPSBjZWxsU2l6ZSA+IDEgJiYgKGR4ID09PSAwIHx8IGR5ID09PSAwIHx8IGR4ID09PSBjZWxsU2l6ZSAtIDEgfHwgZHkgPT09IGNlbGxTaXplIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpZHggPSAocm93SWR4ICsgcHgwICsgZHgpICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQm9yZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeF0gICAgID0gTWF0aC5yb3VuZChyMCAqIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDFdID0gTWF0aC5yb3VuZChnMCAqIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDJdID0gTWF0aC5yb3VuZChiMCAqIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdICAgICA9IHIwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAxXSA9IGcwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IGIwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDNdID0gMjU1O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgYnVmZmVyOiBidWYsIHdpZHRoOiB3LCBoZWlnaHQ6IGgsIGNlbGxDb3VudDogdGhpcy5jZWxsQ291bnQgfTtcbiAgICB9XG5cbiAgICBnZXRCYXNlQ29sb3VyKHBsYW50KXtcbiAgICAgICAgdmFyIGkgPSBwbGFudC5jZWxsc1swXS54ICUgY1NjYWxlLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGNTY2FsZVtpXTtcbiAgICB9XG59XG5cbi8vIGh0dHA6Ly9jb2xvcmJyZXdlcjIub3JnLz90eXBlPXF1YWxpdGF0aXZlJnNjaGVtZT1TZXQzJm49OCDigJQgYXMgcmF3IFtSLEcsQl0gdHVwbGVzXG52YXIgY1NjYWxlID0gW1xuICAgIFsxNDEsMjExLDE5OV0sWzI1NSwyNTUsMTc5XSxbMTkwLDE4NiwyMThdLFsyNTEsMTI4LDExNF0sXG4gICAgWzEyOCwxNzcsMjExXSxbMjUzLDE4MCw5OF0sWzE3OSwyMjIsMTA1XSxbMjUyLDIwNSwyMjldXG5dO1xuXG5cbmV4cG9ydCB7IFdvcmxkIH07IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0bG9hZGVkOiBmYWxzZSxcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuLy8gdGhlIHN0YXJ0dXAgZnVuY3Rpb25cbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5cdC8vIFRoaXMgZW50cnkgbW9kdWxlIGRlcGVuZHMgb24gb3RoZXIgbG9hZGVkIGNodW5rcyBhbmQgZXhlY3V0aW9uIG5lZWQgdG8gYmUgZGVsYXllZFxuXHR2YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyh1bmRlZmluZWQsIFtcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3NlZWRyYW5kb21faW5kZXhfanMtbm9kZV9tb2R1bGVzX3N0YXRzLWxpdGVfc3RhdHNfanNcIl0sICgpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanNcIikpKVxuXHRfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKF9fd2VicGFja19leHBvcnRzX18pO1xuXHRyZXR1cm4gX193ZWJwYWNrX2V4cG9ydHNfXztcbn07XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kRCA9IGZ1bmN0aW9uICgpIHtcblx0dGhyb3cgbmV3IEVycm9yKCdkZWZpbmUgY2Fubm90IGJlIHVzZWQgaW5kaXJlY3QnKTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5hbWRPID0ge307IiwidmFyIGRlZmVycmVkID0gW107XG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8gPSAocmVzdWx0LCBjaHVua0lkcywgZm4sIHByaW9yaXR5KSA9PiB7XG5cdGlmKGNodW5rSWRzKSB7XG5cdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuXHRcdGZvcih2YXIgaSA9IGRlZmVycmVkLmxlbmd0aDsgaSA+IDAgJiYgZGVmZXJyZWRbaSAtIDFdWzJdID4gcHJpb3JpdHk7IGktLSkgZGVmZXJyZWRbaV0gPSBkZWZlcnJlZFtpIC0gMV07XG5cdFx0ZGVmZXJyZWRbaV0gPSBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV07XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBub3RGdWxmaWxsZWQgPSBJbmZpbml0eTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV0gPSBkZWZlcnJlZFtpXTtcblx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpZiAoKHByaW9yaXR5ICYgMSA9PT0gMCB8fCBub3RGdWxmaWxsZWQgPj0gcHJpb3JpdHkpICYmIE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uTykuZXZlcnkoKGtleSkgPT4gKF9fd2VicGFja19yZXF1aXJlX18uT1trZXldKGNodW5rSWRzW2pdKSkpKSB7XG5cdFx0XHRcdGNodW5rSWRzLnNwbGljZShqLS0sIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnVsZmlsbGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmKHByaW9yaXR5IDwgbm90RnVsZmlsbGVkKSBub3RGdWxmaWxsZWQgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoZnVsZmlsbGVkKSB7XG5cdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuXHRcdFx0dmFyIHIgPSBmbigpO1xuXHRcdFx0aWYgKHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vLyBUaGlzIGZpbGUgY29udGFpbnMgb25seSB0aGUgZW50cnkgY2h1bmsuXG4vLyBUaGUgY2h1bmsgbG9hZGluZyBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLmYpLnJlZHVjZSgocHJvbWlzZXMsIGtleSkgPT4ge1xuXHRcdF9fd2VicGFja19yZXF1aXJlX18uZltrZXldKGNodW5rSWQsIHByb21pc2VzKTtcblx0XHRyZXR1cm4gcHJvbWlzZXM7XG5cdH0sIFtdKSk7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rcyBhbmQgY2h1bmtzIHRoYXQgdGhlIGVudHJ5cG9pbnQgZGVwZW5kcyBvblxuX193ZWJwYWNrX3JlcXVpcmVfXy51ID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiBcIlwiICsgY2h1bmtJZCArIFwiLmJ1bmRsZS5qc1wiO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwidmFyIHNjcmlwdFVybDtcbmlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmcuaW1wb3J0U2NyaXB0cykgc2NyaXB0VXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmxvY2F0aW9uICsgXCJcIjtcbnZhciBkb2N1bWVudCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5kb2N1bWVudDtcbmlmICghc2NyaXB0VXJsICYmIGRvY3VtZW50KSB7XG5cdGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0ICYmIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnU0NSSVBUJylcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcblx0aWYgKCFzY3JpcHRVcmwpIHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xuXHRcdGlmKHNjcmlwdHMubGVuZ3RoKSB7XG5cdFx0XHR2YXIgaSA9IHNjcmlwdHMubGVuZ3RoIC0gMTtcblx0XHRcdHdoaWxlIChpID4gLTEgJiYgKCFzY3JpcHRVcmwgfHwgIS9eaHR0cChzPyk6Ly50ZXN0KHNjcmlwdFVybCkpKSBzY3JpcHRVcmwgPSBzY3JpcHRzW2ktLV0uc3JjO1xuXHRcdH1cblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC9eYmxvYjovLCBcIlwiKS5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGNodW5rc1xuLy8gXCIxXCIgbWVhbnMgXCJhbHJlYWR5IGxvYWRlZFwiXG52YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuXHRcInNyY19zaW11bGF0aW9uX3dvcmtlcl9qc1wiOiAxXG59O1xuXG4vLyBpbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmdcbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIgW2NodW5rSWRzLCBtb3JlTW9kdWxlcywgcnVudGltZV0gPSBkYXRhO1xuXHRmb3IodmFyIG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubVttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG5cdFx0fVxuXHR9XG5cdGlmKHJ1bnRpbWUpIHJ1bnRpbWUoX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cdHdoaWxlKGNodW5rSWRzLmxlbmd0aClcblx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZHMucG9wKCldID0gMTtcblx0cGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24oZGF0YSk7XG59O1xuX193ZWJwYWNrX3JlcXVpcmVfXy5mLmkgPSAoY2h1bmtJZCwgcHJvbWlzZXMpID0+IHtcblx0Ly8gXCIxXCIgaXMgdGhlIHNpZ25hbCBmb3IgXCJhbHJlYWR5IGxvYWRlZFwiXG5cdGlmKCFpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRpZih0cnVlKSB7IC8vIGFsbCBjaHVua3MgaGF2ZSBKU1xuXHRcdFx0aW1wb3J0U2NyaXB0cyhfX3dlYnBhY2tfcmVxdWlyZV9fLnAgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLnUoY2h1bmtJZCkpO1xuXHRcdH1cblx0fVxufTtcblxudmFyIGNodW5rTG9hZGluZ0dsb2JhbCA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSB8fCBbXTtcbnZhciBwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbiA9IGNodW5rTG9hZGluZ0dsb2JhbC5wdXNoLmJpbmQoY2h1bmtMb2FkaW5nR2xvYmFsKTtcbmNodW5rTG9hZGluZ0dsb2JhbC5wdXNoID0gaW5zdGFsbENodW5rO1xuXG4vLyBubyBITVJcblxuLy8gbm8gSE1SIG1hbmlmZXN0IiwidmFyIG5leHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLng7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fLmUoXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCIpLnRoZW4obmV4dCk7XG59OyIsIiIsIi8vIHJ1biBzdGFydHVwXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18ueCgpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9