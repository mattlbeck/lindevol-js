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
        var stepData = {};
        this.collectors.forEach(function(c){
            var values = c.collect(this.sim);
            Object.assign(stepData, values);
        }, this);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtXQUNBO1dBQ0EsRUFBRTtXQUNGLEU7Ozs7O1dDUkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztXQ0pBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsR0FBRztXQUNIO1dBQ0E7V0FDQSxDQUFDLEk7Ozs7O1dDUEQsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7O1dDTkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztXQ0pBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGtDOzs7OztXQ2xCQTs7V0FFQTtXQUNBO1dBQ0E7V0FDQTtXQUNBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsYUFBYTtXQUNiO1dBQ0E7V0FDQTtXQUNBOztXQUVBO1dBQ0E7V0FDQTs7V0FFQTs7V0FFQSxrQjs7Ozs7V0NwQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7VUVIQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbGluZGV2b2wvaWdub3JlZHwvVXNlcnMvbWF0dC9saW5kZXZvbC1qcy9ub2RlX21vZHVsZXMvc2VlZHJhbmRvbXxjcnlwdG8iLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvYWN0aW9ucy5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9jZWxsLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2dlbm9tZS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9wbGFudC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9yYW5kb20uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltZGF0YS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW11bGF0aW9uLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3dvcmxkLmpzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9hbWQgZGVmaW5lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9hbWQgb3B0aW9ucyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvY2h1bmsgbG9hZGVkIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZW5zdXJlIGNodW5rIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbm9kZSBtb2R1bGUgZGVjb3JhdG9yIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9pbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmciLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3N0YXJ0dXAgY2h1bmsgZGVwZW5kZW5jaWVzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiAoaWdub3JlZCkgKi8iLCJjb25zdCBORUlHSEJPVVJIT09EID0gW1stMSwtMV0sIFswLC0xXSwgWzEsLTFdLCBbLTEsMF0sIFsxLDBdLCBbLTEsMV0sIFswLDFdLCBbMSwxXV07XG5jb25zdCBNVVRfSU5DUkVNRU5UID0gMC4wMDE7XG5cbmNsYXNzIEFjdGlvbntcbiAgICBjb25zdHJ1Y3RvcihhY3Rpb25Db2RlKXtcbiAgICAgICAgdGhpcy5jb2RlID0gYWN0aW9uQ29kZTtcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1zKCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGV4ZWN1dGUoY2VsbCwgc3RlcG51bSl7XG4gICAgICAgIC8vIGFjdGlvbnMgYXJlIHR5cGljYWxseSBvbmx5IGNhcnJpZWQgb3V0IGlmIHRoZSBjZWxsIGhhcyBlbmVyZ3lcbiAgICAgICAgLy8gYW5kIHRoZSBjZWxsIGxvc2VzIGVuZXJneSBhcyBhIHJlc3VsdC5cbiAgICAgICAgaWYgKGNlbGwuZW5lcmdpc2VkKXtcbiAgICAgICAgICAgIHZhciBzdWNjZXNzID0gdGhpcy5kb0FjdGlvbihjZWxsLCBzdGVwbnVtKTtcbiAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gIXN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgZG9BY3Rpb24oY2VsbCl7XG5cbiAgICB9XG59XG5cbmNsYXNzIERpdmlkZSBleHRlbmRzIEFjdGlvbntcblxuICAgIGRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pe1xuICAgICAgICAvLyB0aGUgMiBsZWFzdCBzaWduaWZpY2FudCBiaXRzIG9mIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAvLyBkZXRlcm1pbmVzIHdoaWNoIGRpcmVjdGlvbiB0aGUgZGl2aWRlIGFjdGlvbiBpcyBmb3JcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSk7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLmdldERpcmVjdGlvbigpO1xuICAgICAgICBjZWxsLnBsYW50Lmdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24sIHN0ZXBudW0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1zKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERpcmVjdGlvbigpO1xuICAgIH1cblxuICAgIGdldERpcmVjdGlvbigpe1xuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcbiAgICAgICAgLy8gJiB3aXRoIDAwMDAwMTExIHRvIG1hc2sgb3V0IGxlYXN0IHNpZyBiaXRzXG4gICAgICAgIHZhciBkaXJlY3Rpb25Db2RlID0gdGhpcy5jb2RlICYgNztcbiAgICAgICAgcmV0dXJuIE5FSUdIQk9VUkhPT0RbZGlyZWN0aW9uQ29kZV07XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBkaXZpZGUgJHt0aGlzLmdldERpcmVjdGlvbigpfWA7XG4gICAgfVxufVxuXG5jbGFzcyBNdXRhdGVQbHVzIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgY2VsbC5wbGFudC5nZW5vbWUubXV0X2V4cCArPSBNVVRfSU5DUkVNRU5UO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJtdXQrXCI7XG4gICAgfVxufVxuXG5jbGFzcyBNdXRhdGVNaW51cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgLT0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0LVwiO1xuICAgIH1cbn1cblxuY2xhc3MgRmx5aW5nU2VlZCBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsLCBzdGVwbnVtKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSk7XG4gICAgICAgIHJldHVybiBjZWxsLnBsYW50LndvcmxkLnNlZWQoY2VsbC5wbGFudC5nZW5vbWUuY29weSgpLCBudWxsLCBzdGVwbnVtKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJmbHlpbmdzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBMb2NhbFNlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCwgc3RlcG51bSl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSwgY2VsbC54LCBzdGVwbnVtKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJsb2NhbHNlZWRcIjtcbiAgICB9XG59XG5cbmNsYXNzIFN0YXRlQml0TiBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKSB7XG4gICAgICAgIGNlbGwubmV4dEludGVybmFsU3RhdGUgPSBjZWxsLm5leHRJbnRlcm5hbFN0YXRlICYgTWF0aC5wb3coMiwgdGhpcy5nZXROdGhCaXQoKSk7XG4gICAgICAgIC8vIHRoaXMgYWN0aW9uIGRvZXMgbm90IGNvbnN1bWUgZW5lcmd5XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXROdGhCaXQoKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMTExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICByZXR1cm4gdGhpcy5jb2RlICYgMTU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBTdGF0ZUJpdCAke3RoaXMuZ2V0TnRoQml0KCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIEFjdGlvbk1hcCB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nLCBjb2RlUmFuZ2U9MjU2KXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbWFwcGluZztcbiAgICAgICAgdGhpcy5jb2RlUmFuZ2UgPSBjb2RlUmFuZ2U7XG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IFtEaXZpZGUsIEZseWluZ1NlZWQsIExvY2FsU2VlZCwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIFN0YXRlQml0Tl07XG4gICAgfVxuXG4gICAgZ2V0QWN0aW9uKGFjdGlvbkNvZGUpe1xuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGFjdGlvbiBjb2RlIGludG8gdGhlIFswLCBzdW0pIHJhbmdlIHNvIHdlaWdodHMgY2FuIGJlXG4gICAgICAgIC8vIGFueSBwb3NpdGl2ZSBpbnRlZ2VycyByYXRoZXIgdGhhbiBuZWVkaW5nIHRvIHN1bSB0byBjb2RlUmFuZ2UuXG4gICAgICAgIGNvbnN0IHN1bSA9IHRoaXMubWFwcGluZy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZENvZGUgPSBNYXRoLmZsb29yKChhY3Rpb25Db2RlIC8gdGhpcy5jb2RlUmFuZ2UpICogc3VtKTtcbiAgICAgICAgdmFyIG1hcHBpbmdDb3VudCA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubWFwcGluZy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBtYXBwaW5nQ291bnQgKz0gdGhpcy5tYXBwaW5nW2ldO1xuICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRDb2RlIDwgbWFwcGluZ0NvdW50KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1tpXShhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBGYWxsYmFjayBmb3IgZmxvYXRpbmctcG9pbnQgZWRnZSBjYXNlc1xuICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1t0aGlzLm1hcHBpbmcubGVuZ3RoIC0gMV0oYWN0aW9uQ29kZSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7RGl2aWRlLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgTG9jYWxTZWVkLCBGbHlpbmdTZWVkLCBBY3Rpb25NYXAsIE5FSUdIQk9VUkhPT0R9OyIsIlxuY2xhc3MgQ2VsbHtcbiAgICBjb25zdHJ1Y3RvcihwbGFudCwgeCwgeSl7XG4gICAgICAgIHRoaXMucGxhbnQgPSBwbGFudDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGdldCBlbmVyZ2lzZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmVyZ2lzZWQ7XG4gICAgfVxuXG4gICAgc2V0IGVuZXJnaXNlZCh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fZW5lcmdpc2VkID09PSB2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucGxhbnQpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoKXtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgsIHgsIHksIHNpemUsIGNvbG91cil7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvdXI7XG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgLy9jdHguc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYENlbGwgYXQgKCR7dGhpcy54fSwgJHt0aGlzLnl9KSBlbmVyZ3k6ICR7dGhpcy5lbmVyZ2lzZWR9YDtcbiAgICB9XG59XG5cbmV4cG9ydCB7Q2VsbH07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtBY3Rpb25NYXB9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgQnl0ZUFycmF5IGV4dGVuZHMgQXJyYXl7XG5cbiAgICBjb25zdHJ1Y3RvcihsZW5ndGg9MCwgaW5pdGlhbF9tdXRfZXhwPTApe1xuICAgICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgICB0aGlzLm11dF9leHAgPSBpbml0aWFsX211dF9leHA7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb20oYXJyLCBtdXRfZXhwPTApe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGFyci5sZW5ndGgsIG11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gYXJyW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXJpYWxpemUgdGhpcyBnZW5vbWUgdG8gYSBzdHJpbmc6IFwiPG11dF9leHA+OzxieXRlMD4sPGJ5dGUxPiwuLi5cIlxuICAgICAqL1xuICAgIHNlcmlhbGl6ZSgpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5tdXRfZXhwfTske0FycmF5LmZyb20odGhpcykuam9pbihcIixcIil9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXNlcmlhbGl6ZSBhIGdlbm9tZSBzdHJpbmcgcHJvZHVjZWQgYnkgc2VyaWFsaXplKCkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm5zIHtCeXRlQXJyYXl9XG4gICAgICovXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKHN0cil7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gc3RyLnRyaW0oKS5zcGxpdChcIjtcIik7XG4gICAgICAgIGNvbnN0IG11dF9leHAgPSBwYXJzZUZsb2F0KHBhcnRzWzBdKTtcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBwYXJ0c1sxXS5zcGxpdChcIixcIikubWFwKE51bWJlcik7XG4gICAgICAgIHJldHVybiBCeXRlQXJyYXkuZnJvbShieXRlcywgbXV0X2V4cCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJhbmRvbShsZW5ndGgpe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSByYW5kb21JbnQoMCwgMjU1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgY29weSgpe1xuICAgICAgICB2YXIgbmV3QXJyID0gbmV3IEJ5dGVBcnJheSh0aGlzLmxlbmd0aCwgdGhpcy5tdXRfZXhwKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBuZXdBcnJbaV0gPSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdBcnI7XG4gICAgfVxuXG59XG5cbmNsYXNzIE11dGF0b3J7XG4gICAgY29uc3RydWN0b3IocHJvYiwgcHJvYl9yZXBsYWNlbWVudCwgcHJvYl9pbnNlcnRpb24sIHByb2JfZGVsZXRpb24sIHByb2JfZHVwLCByZXBsYWNlbWVudF9tb2RlLCB1bml0cyl7XG4gICAgICAgIHRoaXMucHJvYiA9IHByb2I7XG4gICAgICAgIHRoaXMucFIgPSBwcm9iX3JlcGxhY2VtZW50O1xuICAgICAgICB0aGlzLnBJID0gcHJvYl9pbnNlcnRpb247XG4gICAgICAgIHRoaXMucEQgPSBwcm9iX2RlbGV0aW9uO1xuICAgICAgICB0aGlzLnBEdXAgPSBwcm9iX2R1cDtcbiAgICAgICAgdGhpcy5wUm1vZGUgPSByZXBsYWNlbWVudF9tb2RlOyAgXG4gICAgICAgIHRoaXMudW5pdHMgPSB1bml0cztcbiAgICB9XG5cbiAgICBtdXRhdGUoZ2Vub21lKXtcbiAgICAgICAgbGV0IG11dGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBSLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlKGdlbm9tZSk7XG4gICAgICAgICAgICBtdXRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEksIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmluc2VydChnZW5vbWUpO1xuICAgICAgICAgICAgbXV0YXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBELCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5kZWxldGUoZ2Vub21lKTtcbiAgICAgICAgICAgIG11dGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtdXRhdGVkO1xuICAgIH1cblxuICAgIG1Qcm9iKHAsIGV4cCl7XG4gICAgICAgIHJldHVybiByYW5kb21Qcm9iKHAgKiBNYXRoLnBvdyggdGhpcy5wcm9iLCBleHApKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgc3dpdGNoKHRoaXMucFJtb2RlKXtcbiAgICAgICAgY2FzZSBcImJ5dGV3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSB0aGlzLnJhbmRvbUNoYXIoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYml0d2lzZVwiOlxuICAgICAgICAgICAgZ2Vub21lW2ldID0gZ2Vub21lW2ldIF4gKDEgPDwgcmFuZG9tSW50KDAsIDcpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG11dGF0aW9uIHJlcGxhY2VtZW50IG1vZGU6ICR7dGhpcy5wUm1vZGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgaW5zZXJ0KGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMCwgdGhpcy5yYW5kb21DaGFyKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVsZXRlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByYW5kb21DaGFyKCl7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQoMCwgMjU1KTtcbiAgICB9XG5cbiAgICByYW5kb21Qb3MoZ2Vub21lKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCBnZW5vbWUubGVuZ3RoLTEpO1xuICAgIH1cbn1cblxuXG5cbmNsYXNzIFJ1bGUge1xuICAgIGNvbnN0cnVjdG9yKGVxTWFzaywgc3RhdGUsIGFjdGlvbil7XG4gICAgICAgIHRoaXMuZXFNYXNrID0gZXFNYXNrO1xuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIHRoaXMuYWN0aW9uID0gYWN0aW9uO1xuICAgIH1cblxuICAgIG1hdGNoZXMoc3RhdGUpe1xuICAgICAgICB2YXIgZXFTdGF0ZSA9IHN0YXRlICYgdGhpcy5lcU1hc2s7XG4gICAgICAgIHJldHVybiBlcVN0YXRlID09PSB0aGlzLnN0YXRlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnN0YXRlfSAtPiAke3RoaXMuYWN0aW9ufWA7XG4gICAgfVxufVxuXG5jbGFzcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICAvKipcbiAgICAgKiBNZXRob2RzIHRoYXQgZGVjb2RlIGdlbm9tZXMgaW50byBydWxlc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcsIGNvZGVSYW5nZT0yNTYpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBuZXcgQWN0aW9uTWFwKG1hcHBpbmcsIGNvZGVSYW5nZSk7XG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuXG4gICAgfVxufVxuXG5jbGFzcyBCbG9ja0ludGVycHJldGVyIGV4dGVuZHMgR2Vub21lSW50ZXJwcmV0ZXJ7XG4gICAgY29uc3RydWN0b3IobWFwcGluZyl7XG4gICAgICAgIHN1cGVyKG1hcHBpbmcsIDI1Nik7IC8vIGFjdGlvbiBieXRlIGlzIGZ1bGwgMC0yNTUgcmFuZ2VcbiAgICB9XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG4gICAgICAgIHZhciBydWxlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrPTIpe1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMubWFwcGluZy5nZXRBY3Rpb24oYnl0ZWFycmF5W2krMV0pO1xuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZSgyNTUsIGJ5dGVhcnJheVtpXSwgYWN0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJ1bGVzO1xuICAgIH1cbn1cblxuY2xhc3MgUHJvbW90b3JJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcpe1xuICAgICAgICBzdXBlcihtYXBwaW5nLCA2NCk7IC8vIHRlcm1pbmF0b3IgY29udHJpYnV0ZXMgbG93ZXIgNiBiaXRzOiByYW5nZSAwLTYzXG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgdmFyIGdlbmVzID0gW107XG4gICAgICAgIHZhciBnZW5lID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgYnl0ZWFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjID0gYnl0ZWFycmF5W2ldO1xuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDYpID09PSBiaXRTZXQoYywgNykpe1xuICAgICAgICAgICAgICAgIC8vIG9wZXJhdG9yXG4gICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihiaXRTZXQoYywgNykpe1xuICAgICAgICAgICAgICAgIC8vIHByb21vdG9yXG4gICAgICAgICAgICAgICAgZ2VuZSA9IFtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgaWYoYml0U2V0KGMsIDYpKXtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGVybWluYXRvclxuICAgICAgICAgICAgICAgICAgICBpZihnZW5lLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVzLnB1c2goZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lID0gW107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBnZW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGdlbmUpe1xuICAgICAgICAgICAgLy8gZXh0cmFjdCA2IGxlYXN0IHNpZyBiaXRzIGZyb20gdGVybWluYXRvciBhcyB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgICAgIHZhciBhY3Rpb25Db2RlID0gZ2VuZVtnZW5lLmxlbmd0aC0xXSAmICgoMSA8PCA2KSAtIDEpO1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHRoaXMubWFwcGluZy5nZXRBY3Rpb24oYWN0aW9uQ29kZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHRha2UgaW5mb3JtYXRpb24gZnJvbSBvcGVyYXRvcnMgdG8gY3JlYXRlIHN0YXRlIG1hc2tcbiAgICAgICAgICAgIHZhciBtYXNrID0gMDtcbiAgICAgICAgICAgIHZhciBlcU1hc2sgPSAwOyAvLyBzcGVjaWZpZWQgd2hpY2ggYml0cyBjb250cmlidXRlIHRvIHRoZSBzdGF0ZSBtYXNrXG4gICAgICAgICAgICBmb3IodmFyIGk9MTsgaTxnZW5lLmxlbmd0aC0xOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyA0IGxlYXN0IHNpZyBiaXRzIGRldGVybWluZSB0aGUgbWFzayBpbmRleFxuICAgICAgICAgICAgICAgIHZhciBtYXNrQml0ID0gZ2VuZVtpXSAmICgoMSA8PCA0KSAtIDEpO1xuXG4gICAgICAgICAgICAgICAgLy8gZGV0ZXJtaW5lcyBpZiB0aGUgbWFzayBhdCB0aGlzIGluZGV4IGlzIHNldCB0byAxIG9yIDBcbiAgICAgICAgICAgICAgICB2YXIgYml0U3RhdGUgPSAoZ2VuZVtpXSAmICgxIDw8IDQpKSA+PiA0O1xuICAgICAgICAgICAgICAgIG1hc2sgKz0gKDEgPDwgbWFza0JpdCkgKiBiaXRTdGF0ZTtcblxuICAgICAgICAgICAgICAgIGVxTWFzayArPSAoMSA8PCBtYXNrQml0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJ1bGVzLnB1c2gobmV3IFJ1bGUoZXFNYXNrLCBtYXNrLCBhY3Rpb24pKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJpdFNldChieXRlLCBpKXtcbiAgICByZXR1cm4gKGJ5dGUgPj4gaSkgJiAxO1xufVxuXG5leHBvcnQge0J5dGVBcnJheSwgQmxvY2tJbnRlcnByZXRlciwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtDZWxsfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5pbXBvcnQge05FSUdIQk9VUkhPT0R9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgUGxhbnR7XG4gICAgY29uc3RydWN0b3IoeCwgd29ybGQsIGdlbm9tZSwgYmlydGhTdGVwLCB1c2VJbnRlcm5hbFN0YXRlPWZhbHNlKSB7XG4gICAgICAgIHRoaXMud29ybGQgPSB3b3JsZDtcbiAgICAgICAgdGhpcy5lbmVyZ2lzZWRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuY2VsbHMgPSBbbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCAwKV07XG4gICAgICAgIHRoaXMuZ2Vub21lID0gZ2Vub21lO1xuICAgICAgICB0aGlzLnVzZUludGVybmFsU3RhdGUgPSB1c2VJbnRlcm5hbFN0YXRlO1xuICAgICAgICB0aGlzLnJ1bGVzID0gbnVsbDsgLy8gY2FjaGVkIHJ1bGVzXG4gICAgICAgIHRoaXMubGVhbm92ZXJFbmVyZ2lzZWQgPSAwOyAvLyBJbmNyZW1lbnRhbCB0cmFja2luZ1xuICAgICAgICB0aGlzLmJpcnRoU3RlcCA9IGJpcnRoU3RlcDtcbiAgICB9XG5cbiAgICBnZXROZWlnaGJvdXJob29kKGNlbGwpe1xuICAgICAgICAvLyBSZXR1cm4gdGhlIG5laWdoYm91cmhvb2QgbWFza1xuICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPE5FSUdIQk9VUkhPT0QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIHBvcyA9IE5FSUdIQk9VUkhPT0RbaV07XG4gICAgICAgICAgICB2YXIgeCA9IGNlbGwueCArIHBvc1swXTtcbiAgICAgICAgICAgIHZhciB5ID0gY2VsbC55ICsgcG9zWzFdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBCb3VuZHMgY2hlY2sgaW5zdGVhZCBvZiB0cnktY2F0Y2hcbiAgICAgICAgICAgIGlmICh4ID49IDAgJiYgeCA8IHRoaXMud29ybGQud2lkdGggJiYgeSA+PSAwICYmIHkgPCB0aGlzLndvcmxkLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICAgICAgaWYgKHdvcmxkUG9zIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICAgICAgICAgIG1hc2sgPSBtYXNrIHwgKDEgPDwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXNrO1xuICAgIH1cblxuICAgIGdldFN0YXRlKGNlbGwpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXROZWlnaGJvdXJob29kKGNlbGwpIHwgY2VsbC5pbnRlcm5hbFN0YXRlIHwgKCggY2VsbC5lbmVyZ2lzZWQgPyAxIDogMCkgPDwgMTUpO1xuICAgIH1cblxuICAgIGdyb3coKXtcbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBncm93XG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKDAuOCkpe1xuICAgICAgICAgICAgICAgIHZhciBzcGFjZXMgPSB0aGlzLmdldEdyb3dEaXJlY3Rpb24oY2VsbCk7XG4gICAgICAgICAgICAgICAgaWYoc3BhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gc3BhY2VzW3JhbmRvbUludCgwLCBzcGFjZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR3JvdyB0aGUgcGxhbnQgYnkgb25lIGNlbGwgaWYgcG9zc2libGVcbiAgICAgKiBAcGFyYW0geyp9IGNlbGwgdGhlIGNlbGwgdG8gZ3JvdyBmcm9tXG4gICAgICogQHBhcmFtIHsqfSBkaXJlY3Rpb24gdGhlIGRpcmVjdGlvbiB0byBncm93IGluXG4gICAgICovXG4gICAgZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbiwgc3RlcG51bSl7XG4gICAgICAgIHZhciB4ID0gY2VsbC54K2RpcmVjdGlvblswXSwgeSA9IGNlbGwueStkaXJlY3Rpb25bMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIHNwYWNlIGlzIGNsZWFyXG4gICAgICAgIHZhciBzcGFjZSA9IHRoaXMud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICAgICAgaWYgKHNwYWNlID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGFjZSBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgaWYgKHNwYWNlLnBsYW50ID09PSB0aGlzKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEF0dGFjayBvY2N1cnNcbiAgICAgICAgICAgIGlmICh0aGlzLndvcmxkLm9uQXR0YWNrKSB0aGlzLndvcmxkLm9uQXR0YWNrKCk7XG5cbiAgICAgICAgICAgIC8vIHRoaXMgcGxhbnQgd2lsbCBraWxsIHRoZSBvdGhlclxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb2JhYmlsaXR5Li4uXG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKHNwYWNlLnBsYW50LmdldEtpbGxQcm9iYWJpbGl0eSgpKSl7XG4gICAgICAgICAgICAgICAgLy8gYXR0YWNrIHN1Y2NlZWRlZC4gS2lsbCBjb21wZXRpdG9yIGFuZCBjb250aW51ZSB3aXRoIGdyb3d0aFxuICAgICAgICAgICAgICAgIHRoaXMud29ybGQua2lsbFBsYW50KHNwYWNlLnBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBmYWlsZWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICAvLyBncm93IGNlbGwgaW4gdG8gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIG5ld19jZWxsID0gbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCB5KTtcbiAgICAgICAgdGhpcy5jZWxscy5wdXNoKG5ld19jZWxsKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFVwZGF0ZSBpbmNyZW1lbnRhbCB0cmFja2luZ1xuICAgICAgICBjb25zdCByb290Q2VsbCA9IHRoaXMuY2VsbHNbMF07XG4gICAgICAgIGNvbnN0IGxlID0gdGhpcy53b3JsZC53aWR0aC8yIC0gKCAoKCAxLjUqdGhpcy53b3JsZC53aWR0aCApICsgbmV3X2NlbGwueCAtIHJvb3RDZWxsLngpICAlIHRoaXMud29ybGQud2lkdGgpO1xuICAgICAgICB0aGlzLmxlYW5vdmVyRW5lcmdpc2VkICs9IGxlO1xuXG4gICAgICAgIHRoaXMud29ybGQuYWRkQ2VsbChuZXdfY2VsbCk7XG4gICAgfVxuXG4gICAgZ2V0S2lsbFByb2JhYmlsaXR5KCl7XG4gICAgICAgIHJldHVybiAxL3RoaXMuZW5lcmdpc2VkQ291bnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIHdoZXRoZXIgdGhpcyBwbGFudCBzaG91bGQgZGllLlxuICAgICAqIEBwYXJhbSB7fSBuYXR1cmFsX2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBlbmVyZ3lfZXhwIGV4cG9uZW50IHRvIHRoZSBudW1iZXIgb2YgZW5lcmd5IHJpY2ggY2VsbHNcbiAgICAgKiBAcGFyYW0geyp9IGxlYW5vdmVyX2ZhY3RvciBmYWN0b3IgdG8gdGhlIGxlYW5vdmVyIHRlcm1cbiAgICAgKi9cbiAgICBnZXREZWF0aFByb2JhYmlsaXR5KGRlYXRoX2ZhY3RvciwgbmF0dXJhbF9leHAsIGVuZXJneV9leHAsIGxlYW5vdmVyX2ZhY3Rvcil7XG4gICAgICAgIHZhciBudW1DZWxscyA9IHRoaXMuY2VsbHMubGVuZ3RoO1xuICAgICAgICBcbiAgICAgICAgdmFyIGxlYW5vdmVyQ2VsbHMgPSAyLyhudW1DZWxscyoobnVtQ2VsbHMtMSkpO1xuICAgICAgICBpZiAobGVhbm92ZXJDZWxscyA9PT0gSW5maW5pdHkpe1xuICAgICAgICAgICAgbGVhbm92ZXJDZWxscyA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVhbm92ZXJUZXJtID0gbGVhbm92ZXJDZWxscypNYXRoLmFicyh0aGlzLmxlYW5vdmVyRW5lcmdpc2VkKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBkX25hdHVyYWwgPSBNYXRoLnBvdyhudW1DZWxscywgbmF0dXJhbF9leHApO1xuICAgICAgICB2YXIgZF9lbmVyZ3kgPSBNYXRoLnBvdyh0aGlzLmVuZXJnaXNlZENvdW50KzEsIGVuZXJneV9leHApO1xuICAgICAgICB2YXIgZF9sZWFub3ZlciA9IGxlYW5vdmVyX2ZhY3RvcipsZWFub3ZlclRlcm07XG4gICAgICAgIHZhciBwRGVhdGggPSBkZWF0aF9mYWN0b3IgKiBkX25hdHVyYWwgKiBkX2VuZXJneSArIGRfbGVhbm92ZXI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInByb2JcIjogcERlYXRoLFxuICAgICAgICAgICAgXCJuYXR1cmFsXCI6IGRfbmF0dXJhbCxcbiAgICAgICAgICAgIFwiZW5lcmd5XCI6IGRfZW5lcmd5LFxuICAgICAgICAgICAgXCJsZWFub3ZlclwiOiBkX2xlYW5vdmVyXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgeyBQbGFudCB9OyIsImltcG9ydCBzZWVkcmFuZG9tIGZyb20gXCJzZWVkcmFuZG9tXCI7XG5cbi8qKlxuICogU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIE1hdGgucmFuZG9tXG4gKiBAcGFyYW0geyp9IHNlZWQgZGF0YSB0byB1c2UgdG8gc2VlZCBhbGwgZnV0dXJlIFJORyBjYWxsc1xuICovXG5mdW5jdGlvbiBzZWVkUmFuZG9tKHNlZWQpe1xuICAgIHNlZWRyYW5kb20oc2VlZCwge2dsb2JhbDogdHJ1ZX0pO1xufVxuXG4vKipcbiAqIHJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIG1heCAoaW5jbHVzaXZlKVxuICogQHBhcmFtIHsqfSBtYXggbWF4aW11bSBpbnRlZ2VyIHRvIGdlbmVyYXRlIGFzIGEgcmFuZG9tIG51bWJlclxuICovXG5mdW5jdGlvbiByYW5kb21JbnQobWluLCBtYXgpe1xuICAgIC8vIG5vdGU6IE1hdGgucmFuZG9tIHJldHVybnMgYSByYW5kb20gbnVtYmVyIGV4Y2x1c2l2ZSBvZiAxLFxuICAgIC8vIHNvIHRoZXJlIGlzICsxIGluIHRoZSBiZWxvdyBlcXVhdGlvbiB0byBlbnN1cmUgdGhlIG1heGltdW1cbiAgICAvLyBudW1iZXIgaXMgY29uc2lkZXJlZCB3aGVuIGZsb29yaW5nIDAuOS4uLiByZXN1bHRzLlxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG4vKipcbiAqIEV2YWx1YXRlcyB0aGUgY2hhbmNlIG9mIGFuIGV2ZW50IGhhcHBlbmluZyBnaXZlbiBwcm9iXG4gKiBAcGFyYW0geyp9IHByb2IgZnJhY3Rpb24gYmV0d2VlbiAwIGFuZCAxIGNoYW5jZSBvZiB0aGUgZXZlbnQgaGFwcGVuaW5nXG4gKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBldmVudCBoYXBwZW5zLCBmYWxzZSBpZiBub3RcbiAqL1xuZnVuY3Rpb24gcmFuZG9tUHJvYihwcm9iKXtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8PSBwcm9iO1xufVxuXG5leHBvcnQge3NlZWRSYW5kb20sIHJhbmRvbUludCwgcmFuZG9tUHJvYn07IiwiaW1wb3J0ICogYXMgc3RhdHMgZnJvbSBcInN0YXRzLWxpdGVcIjtcblxuZnVuY3Rpb24gbGV2ZW5zaHRlaW4oYSwgYikge1xuICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGIubGVuZ3RoO1xuICAgIGlmIChiLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGEubGVuZ3RoO1xuICAgIGxldCBtYXRyaXggPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBiLmxlbmd0aDsgaSsrKSBtYXRyaXhbaV0gPSBbaV07XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPD0gYS5sZW5ndGg7IGorKykgbWF0cml4WzBdW2pdID0gajtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBiLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChiW2kgLSAxXSA9PT0gYVtqIC0gMV0pIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBtYXRyaXhbaSAtIDFdW2ogLSAxXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1baiAtIDFdICsgMSwgLy8gc3Vic3RpdHV0aW9uXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4W2ldW2ogLSAxXSArIDEsIC8vIGluc2VydGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4W2kgLSAxXVtqXSArIDEgIC8vIGRlbGV0aW9uXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRyaXhbYi5sZW5ndGhdW2EubGVuZ3RoXTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlQWxsZWxlRW50cm9weShwbGFudHMpIHtcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgY29uc3QgY291bnRzID0gbmV3IEFycmF5KDI1NikuZmlsbCgwKTtcbiAgICBsZXQgdG90YWwgPSAwO1xuICAgIHBsYW50cy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHAuZ2Vub21lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb3VudHNbcC5nZW5vbWVbaV1dKys7XG4gICAgICAgICAgICB0b3RhbCsrO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRvdGFsID09PSAwKSByZXR1cm4gMDtcbiAgICBsZXQgZW50cm9weSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICAgICAgICBpZiAoY291bnRzW2ldID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcCA9IGNvdW50c1tpXSAvIHRvdGFsO1xuICAgICAgICAgICAgZW50cm9weSAtPSBwICogTWF0aC5sb2cyKHApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbnRyb3B5O1xufVxuXG5jbGFzcyBTaW1EYXRhe1xuXG4gICAgY29uc3RydWN0b3Ioc2ltdWxhdGlvbil7XG4gICAgICAgIHRoaXMuc2ltID0gc2ltdWxhdGlvbjtcbiAgICAgICAgdGhpcy5kYXRhID0ge1wic3RlcG51bVwiOiBbXX07XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycyA9IFtcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwb3B1bGF0aW9uXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidW5pcXVlX2dlbm90eXBlc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgc2ltLndvcmxkLnBsYW50cy5mb3JFYWNoKHAgPT4gc2Vlbi5hZGQocC5nZW5vbWUuc2VyaWFsaXplKCkpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2Vlbi5zaXplO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidG90YWxfY2VsbHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLmNlbGxDb3VudDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19zaXplXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLmNlbGxDb3VudCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX2VuZXJnaXNlZFwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLmVuZXJnaXNlZENvdW50LCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19hY3RpdmVfZ2VuZXNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgKHAucnVsZXMgPyBwLnJ1bGVzLmxlbmd0aCA6IDApLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19hZ2VcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgKHNpbS5zdGVwbnVtIC0gcC5iaXJ0aFN0ZXApLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInRvdGFsX3NlZWRzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7IHJldHVybiBzaW0uc3RhdHMudG90YWxTZWVkczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZmx5aW5nX3NlZWRzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7IHJldHVybiBzaW0uc3RhdHMuZmx5aW5nU2VlZHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcIm5ld19wbGFudHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXsgcmV0dXJuIHNpbS5zdGF0cy5uZXdQbGFudHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImRlYXRoc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0peyByZXR1cm4gc2ltLnN0YXRzLmRlYXRoczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXR0YWNrc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0peyByZXR1cm4gc2ltLnN0YXRzLmF0dGFja3M7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19kZWF0aF9wcm9iXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1bSArIHAuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICAgICAgICAgICAgICkucHJvYjtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuY2VsbHMubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbm9tZV9zaXplX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwibXV0X2V4cF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5nZW5vbWUubXV0X2V4cCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwbGFudF9oZWlnaHRfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1heEggPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHAuY2VsbHMubGVuZ3RoOyBpKyspIGlmIChwLmNlbGxzW2ldLnkgPiBtYXhIKSBtYXhIID0gcC5jZWxsc1tpXS55O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF4SDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbmV0aWNfZGlzdGFuY2VfbWVhblwiLCBBc0lzLCBmdW5jdGlvbihzaW0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGFudHMgPSBzaW0ud29ybGQucGxhbnRzO1xuICAgICAgICAgICAgICAgIGlmIChwbGFudHMubGVuZ3RoIDwgMikgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgbGV0IHN1bURpc3QgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBzYW1wbGVTaXplID0gTWF0aC5taW4oMzAsIHBsYW50cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGxldCBwYWlycyA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzYW1wbGVTaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcDEgPSBwbGFudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGxhbnRzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwMiA9IHBsYW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwbGFudHMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwMSAhPT0gcDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bURpc3QgKz0gbGV2ZW5zaHRlaW4ocDEuZ2Vub21lLCBwMi5nZW5vbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFpcnMrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFpcnMgPiAwID8gc3VtRGlzdCAvIHBhaXJzIDogMDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImFsbGVsZV9lbnRyb3B5XCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxjdWxhdGVBbGxlbGVFbnRyb3B5KHNpbS53b3JsZC5wbGFudHMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb2xsZWN0IGRhdGEgZm9yIHRoZSBjdXJyZW50IHN0ZXBcbiAgICAgKi9cbiAgICByZWNvcmRTdGVwKCl7XG4gICAgICAgIHZhciBzdGVwRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMuZm9yRWFjaChmdW5jdGlvbihjKXtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBjLmNvbGxlY3QodGhpcy5zaW0pO1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihzdGVwRGF0YSwgdmFsdWVzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmVzZXQgaW5jcmVtZW50YWwgc3RhdHMgZm9yIHRoZSBuZXh0IGludGVydmFsXG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLm5ld1BsYW50cyA9IDA7XG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLmRlYXRocyA9IDA7XG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLmF0dGFja3MgPSAwO1xuICAgICAgICB0aGlzLnNpbS5zdGF0cy50b3RhbFNlZWRzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMuZmx5aW5nU2VlZHMgPSAwO1xuXG4gICAgICAgIHRoaXMuZGF0YVtcInN0ZXBudW1cIl0ucHVzaCh0aGlzLnNpbS5zdGVwbnVtKTtcbiAgICAgICAgaWYgKHRoaXMuZGF0YVtcInN0ZXBudW1cIl0ubGVuZ3RoID4gU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YVtcInN0ZXBudW1cIl0uc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBPYmplY3Qua2V5cyhzdGVwRGF0YSkuZm9yRWFjaChmdW5jdGlvbihrKXtcbiAgICAgICAgICAgIGlmICghKGsgaW4gdGhpcy5kYXRhKSl7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhW2tdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRhdGFba10ucHVzaChzdGVwRGF0YVtrXSk7XG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhW2tdLmxlbmd0aCA+IFNpbURhdGEuTUFYX0RBVEFfUE9JTlRTKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhW2tdLnNoaWZ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn1cblNpbURhdGEuTUFYX0RBVEFfUE9JTlRTID0gMjAwMDtcblxuY2xhc3MgQ29sbGVjdG9ye1xuICAgIGNvbnN0cnVjdG9yKG5hbWUsIHR5cGVjbHMsIGNvbGxlY3RGdW5jKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy50eXBlID0gbmV3IHR5cGVjbHMobmFtZSk7XG4gICAgICAgIHRoaXMuZnVuYyA9IGNvbGxlY3RGdW5jO1xuICAgIH1cblxuICAgIGNvbGxlY3Qoc2ltKXtcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLmZ1bmMoc2ltKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZS50cmFuc2Zvcm0oZGF0YSk7XG4gICAgfVxufVxuXG5jbGFzcyBDb2xsZWN0b3JUeXBle1xuICAgIGNvbnN0cnVjdG9yKG5hbWUpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuaW1wbGVtZW50ZWQgbWV0aG9kXCIpO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybShkYXRhKXtcbiAgICAgICAgdmFyIHZhbHVlcyA9IHRoaXMudHJhbnNmb3JtRGF0YShkYXRhKTtcbiAgICAgICAgdmFyIHRyYW5zZm9ybWVkX2RhdGEgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXModmFsdWVzKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAgICAgdHJhbnNmb3JtZWRfZGF0YVt0aGlzLm5hbWUgKyBrXSA9IHZhbHVlc1trXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm1lZF9kYXRhO1xuICAgIH1cbn1cblxuY2xhc3MgQXNJcyBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIlwiOiBkYXRhfTtcbiAgICB9XG59XG5cbmNsYXNzIFN1bW1hcnkgZXh0ZW5kcyBDb2xsZWN0b3JUeXBlIHtcblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSl7XG4gICAgICAgIHJldHVybiB7XCJtaW5cIjogTWF0aC5taW4oZGF0YSksIFwibWVhblwiOiBzdGF0cy5tZWFuKGRhdGEpLCBcIm1heFwiOiBNYXRoLm1heChkYXRhKX07XG4gICAgfVxufVxuZXhwb3J0IHtTaW1EYXRhfTsiLCJpbXBvcnQge3NlZWRSYW5kb20sIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtXb3JsZH0gZnJvbSBcIi4vd29ybGQuanNcIjtcbmltcG9ydCB7Qnl0ZUFycmF5LCBCbG9ja0ludGVycHJldGVyLCBQcm9tb3RvckludGVycHJldGVyLCBNdXRhdG9yfSBmcm9tIFwiLi9nZW5vbWUuanNcIjtcblxuY2xhc3MgU2ltdWxhdGlvblBhcmFtc3tcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXM9e30pe1xuICAgICAgICB0aGlzLnJhbmRvbV9zZWVkID0gMTtcbiAgICAgICAgdGhpcy5yZWNvcmRfaW50ZXJ2YWwgPSAxMDtcbiAgICAgICAgdGhpcy5zdGVwc19wZXJfZnJhbWUgPSAxO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX2ludGVydmFsID0gMDtcbiAgICAgICAgdGhpcy5kaXN0dXJiYW5jZV9zdHJlbmd0aCA9IDAuMTtcblxuICAgICAgICB0aGlzLndvcmxkX3dpZHRoID0gMjUwO1xuICAgICAgICB0aGlzLndvcmxkX2hlaWdodCA9IDQwO1xuICAgICAgICB0aGlzLmluaXRpYWxfcG9wdWxhdGlvbiA9IDI1MDtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW5lcmd5X3Byb2IgPSAwLjU7XG5cbiAgICAgICAgLy8gZGVhdGggcGFyYW1zXG4gICAgICAgIHRoaXMuZGVhdGhfZmFjdG9yID0gMC4yO1xuICAgICAgICB0aGlzLm5hdHVyYWxfZXhwID0gMDtcbiAgICAgICAgdGhpcy5lbmVyZ3lfZXhwID0gLTIuNTtcbiAgICAgICAgdGhpcy5sZWFub3Zlcl9mYWN0b3IgPSAwLjI7XG5cbiAgICAgICAgLy8gbXV0YXRpb25zXG4gICAgICAgIHRoaXMubXV0X3JlcGxhY2VfbW9kZSA9IFwiYnl0ZXdpc2VcIjtcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZSA9IDAuMDAyO1xuICAgICAgICB0aGlzLm11dF9pbnNlcnQgPSAwLjAwMDQ7XG4gICAgICAgIHRoaXMubXV0X2RlbGV0ZSA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZmFjdG9yID0gMS41O1xuICAgICAgICB0aGlzLmluaXRpYWxfbXV0X2V4cCA9IDA7XG5cbiAgICAgICAgdGhpcy5nZW5vbWVfaW50ZXJwcmV0ZXIgPSBcImJsb2NrXCI7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoID0gNDAwO1xuXG4gICAgICAgIC8vIGRpdmlkZSwgZmx5aW5nc2VlZCwgbG9jYWxzZWVkLCBtdXQrLCBtdXQtLCBzdGF0ZWJpdFxuICAgICAgICB0aGlzLmFjdGlvbl9tYXAgPSBbMjAwLCAyMCwgMCwgMTgsIDE4LCAwXTtcblxuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHBhcmFtcyk7XG4gICAgfVxufVxuXG5jbGFzcyBTaW11bGF0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG5cbiAgICAgICAgLy8gU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIHJhbmRvbVxuICAgICAgICAvLyB0aGlzIG1ha2VzIG91dCB0ZXN0cyByZXByb2R1Y2libGUgZ2l2ZW4gdGhlIHNhbWUgc2VlZCBpcyB1c2VkXG4gICAgICAgIC8vIGluIGZ1dHVyZSBpbnB1dCBwYXJhbWV0ZXJzXG4gICAgICAgIHNlZWRSYW5kb20odGhpcy5wYXJhbXMucmFuZG9tX3NlZWQpO1xuXG4gICAgICAgIHRoaXMud29ybGQgPSBuZXcgV29ybGQodGhpcy5wYXJhbXMud29ybGRfd2lkdGgsIHRoaXMucGFyYW1zLndvcmxkX2hlaWdodCk7XG4gICAgICAgIHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgPSB0aGlzLmdldEludGVycHJldGVyKCk7XG4gICAgICAgIHRoaXMubXV0X3VuaXRzID0gMTtcbiAgICAgICAgLy8gZW5zdXJlIG11dGF0aW9uIHVuaXRzIGlzIGNvbXBhdGlibGUgd2l0aCB0aGUgaW50ZXJwcmV0ZXIgdHlwZVxuICAgICAgICBpZih0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgQmxvY2tJbnRlcnByZXRlcil7XG4gICAgICAgICAgICB0aGlzLm11dF91bml0cyA9IDI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGVwbnVtID0gMDtcbiAgICAgICAgdGhpcy5zdGF0cyA9IHsgXG4gICAgICAgICAgICBhdHRhY2tzOiAwLCBcbiAgICAgICAgICAgIGRlYXRoczogMCwgXG4gICAgICAgICAgICB0b3RhbFNlZWRzOiAwLCBcbiAgICAgICAgICAgIGZseWluZ1NlZWRzOiAwLCBcbiAgICAgICAgICAgIG5ld1BsYW50czogMCBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLndvcmxkLm9uUGxhbnRCaXJ0aCA9ICgpID0+IHsgdGhpcy5zdGF0cy5uZXdQbGFudHMrKzsgfTtcbiAgICAgICAgdGhpcy53b3JsZC5vblBsYW50RGVhdGggPSAoKSA9PiB7IHRoaXMuc3RhdHMuZGVhdGhzKys7IH07XG4gICAgICAgIHRoaXMud29ybGQub25BdHRhY2sgPSAoKSA9PiB7IHRoaXMuc3RhdHMuYXR0YWNrcysrOyB9O1xuICAgIH1cblxuICAgIGdldEludGVycHJldGVyKCl7XG4gICAgICAgIHN3aXRjaCAodGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyKXtcbiAgICAgICAgY2FzZSBcImJsb2NrXCI6XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJsb2NrSW50ZXJwcmV0ZXIodGhpcy5wYXJhbXMuYWN0aW9uX21hcCk7XG4gICAgICAgIGNhc2UgXCJwcm9tb3RvclwiOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9tb3RvckludGVycHJldGVyKHRoaXMucGFyYW1zLmFjdGlvbl9tYXApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGludGVycHJldGVyICR7dGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyfWApO1xuICAgICAgICB9ICBcbiAgICB9XG5cbiAgICBpbml0X3BvcHVsYXRpb24oKXtcbiAgICAgICAgLy8gcmFuZG9tbHkgY2hvb3NlIHNwb3RzIHRvIHNlZWQgdGhlIHdvcmxkIHdpdGhcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMubmV3U2VlZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgcG9wdWxhdGlvbiBmcm9tIGEgbGlzdCBvZiBzZXJpYWxpemVkIGdlbm9tZSBzdHJpbmdzLFxuICAgICAqIGRyYXdpbmcgd2l0aCByZXBsYWNlbWVudCB1cCB0byBpbml0aWFsX3BvcHVsYXRpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2VyaWFsaXplZEdlbm9tZXNcbiAgICAgKi9cbiAgICBpbml0X3BvcHVsYXRpb25fZnJvbV9nZW5vbWVzKHNlcmlhbGl6ZWRHZW5vbWVzKXtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IHNlcmlhbGl6ZWRHZW5vbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlcmlhbGl6ZWRHZW5vbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgY29uc3QgZ2Vub21lID0gQnl0ZUFycmF5LmRlc2VyaWFsaXplKHN0cik7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lLCBudWxsLCB0aGlzLnN0ZXBudW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3U2VlZCgpe1xuICAgICAgICAvLyBjcmVhdGUgYSByYW5kb20gZ2Vub21lXG4gICAgICAgIHZhciBnZW5vbWUgPSBCeXRlQXJyYXkucmFuZG9tKHRoaXMucGFyYW1zLmluaXRpYWxfZ2Vub21lX2xlbmd0aCk7XG4gICAgICAgIHRoaXMud29ybGQuc2VlZChnZW5vbWUsIG51bGwsIHRoaXMuc3RlcG51bSk7XG4gICAgfVxuXG4gICAgc3RlcCgpe1xuICAgICAgICB0aGlzLnN0ZXBudW0rKztcbiAgICAgICAgdGhpcy5zaW11bGF0ZURlYXRoKCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVMaWdodCgpO1xuICAgICAgICB0aGlzLnNpbXVsYXRlQWN0aW9ucygpO1xuICAgICAgICB0aGlzLm11dGF0ZSgpO1xuICAgIH1cblxuICAgIHNpbXVsYXRlQWN0aW9ucygpe1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud29ybGQucGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHRoaXMud29ybGQucGxhbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCFwbGFudC5ydWxlcykge1xuICAgICAgICAgICAgICAgIHBsYW50LnJ1bGVzID0gdGhpcy5nZW5vbWVJbnRlcnByZXRlci5pbnRlcnByZXQocGxhbnQuZ2Vub21lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJ1bGVzID0gcGxhbnQucnVsZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBsYW50LmNlbGxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsQWN0aW9uKHBsYW50LmNlbGxzW2pdLCBydWxlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjZWxsQWN0aW9uKGNlbGwsIHJ1bGVzKXtcbiAgICAgICAgdmFyIHN0YXRlO1xuICAgICAgICBpZiAodGhpcy5nZW5vbWVJbnRlcnByZXRlciBpbnN0YW5jZW9mIEJsb2NrSW50ZXJwcmV0ZXIpe1xuICAgICAgICAgICAgc3RhdGUgPSBjZWxsLnBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih0aGlzLmdlbm9tZUludGVycHJldGVyIGluc3RhbmNlb2YgUHJvbW90b3JJbnRlcnByZXRlcil7XG4gICAgICAgICAgICBzdGF0ZSA9IGNlbGwucGxhbnQuZ2V0U3RhdGUoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSl7XG4gICAgICAgICAgICAvLyBleGVjdXRlIG9uZSBhY3Rpb24gdXNpbmcgdGhlIGZpcnN0IG1hdGNoaW5nIHJ1bGVcbiAgICAgICAgICAgIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgICAgICAvLyBUcmFjayBzZWVkc1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkZseWluZ1NlZWRcIikgc2VsZi5zdGF0cy5mbHlpbmdTZWVkcysrO1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkZseWluZ1NlZWRcIiB8fCBydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkxvY2FsU2VlZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3RhdHMudG90YWxTZWVkcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBydWxlLmFjdGlvbi5leGVjdXRlKGNlbGwsIHNlbGYuc3RlcG51bSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBjZWxsLnVwZGF0ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgbXV0YXRlKCl7XG4gICAgICAgIHZhciBtdXRhdG9yID0gbmV3IE11dGF0b3IodGhpcy5wYXJhbXMubXV0X2ZhY3RvciwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2UsIFxuICAgICAgICAgICAgdGhpcy5wYXJhbXMubXV0X2luc2VydCwgdGhpcy5wYXJhbXMubXV0X2RlbGV0ZSwgXG4gICAgICAgICAgICAwLCB0aGlzLnBhcmFtcy5tdXRfcmVwbGFjZV9tb2RlLCB0aGlzLm11dF91bml0cyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53b3JsZC5wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gdGhpcy53b3JsZC5wbGFudHNbaV07XG4gICAgICAgICAgICBpZiAobXV0YXRvci5tdXRhdGUocGxhbnQuZ2Vub21lKSkge1xuICAgICAgICAgICAgICAgIHBsYW50LnJ1bGVzID0gbnVsbDsgLy8gSW52YWxpZGF0ZSBjYWNoZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIGVhY2ggcGxhbnQncyBjdXJyZW50IGRlYXRoIHByb2JhYmlsaXR5IHRvIHNpbXVsYXRlXG4gICAgICogd2hldGhlciBlYWNoIHBsYW50IGRpZXMgb24gdGhpcyBzdGVwXG4gICAgICovXG4gICAgc2ltdWxhdGVEZWF0aCgpe1xuICAgICAgICBjb25zdCBkZWFkX3BsYW50cyA9IFtdO1xuICAgICAgICBjb25zdCBwbGFudHMgPSB0aGlzLndvcmxkLnBsYW50cztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gcGxhbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgZGVhdGhQcm9iID0gcGxhbnQuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3JcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAocmFuZG9tUHJvYihkZWF0aFByb2IucHJvYikpe1xuICAgICAgICAgICAgICAgIGRlYWRfcGxhbnRzLnB1c2gocGxhbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVhZF9wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMud29ybGQua2lsbFBsYW50KGRlYWRfcGxhbnRzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNpbXVsYXRlIGxpZ2h0LiBTdW5saWdodCB0cmF2ZXJzZXMgZnJvbSB0aGUgY2VpbGluZyBvZiB0aGUgd29ybGRcbiAgICAgKiBkb3dud2FyZHMgdmVydGljYWxseS4gSXQgaXMgY2F1Z2h0IGJ5IGEgcGxhbnQgY2VsbCB3aXRoIGEgcHJvYmFiaWxpdHlcbiAgICAgKiB3aGljaCBjYXVzZXMgdGhhdCBjZWxsIHRvIGJlIGVuZXJnaXNlZC5cbiAgICAgKi9cbiAgICBzaW11bGF0ZUxpZ2h0KCl7XG4gICAgICAgIGNvbnN0IGNvbFRvcHMgPSBuZXcgSW50MTZBcnJheSh0aGlzLndvcmxkLndpZHRoKS5maWxsKC0xKTtcbiAgICAgICAgY29uc3QgcGxhbnRzID0gdGhpcy53b3JsZC5wbGFudHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjZWxscyA9IHBsYW50c1tpXS5jZWxscztcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gY2VsbHNbal07XG4gICAgICAgICAgICAgICAgaWYgKGNlbGwueSA+IGNvbFRvcHNbY2VsbC54XSkge1xuICAgICAgICAgICAgICAgICAgICBjb2xUb3BzW2NlbGwueF0gPSBjZWxsLnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGxldCB4PTA7IHg8dGhpcy53b3JsZC53aWR0aDsgeCsrKXtcbiAgICAgICAgICAgIGNvbnN0IHRvcFkgPSBjb2xUb3BzW3hdO1xuICAgICAgICAgICAgaWYgKHRvcFkgPT09IC0xKSBjb250aW51ZTtcblxuICAgICAgICAgICAgZm9yKGxldCB5PXRvcFk7IHk+PTA7IHktLSl7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICAgICAgaWYoY2VsbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJhbmRvbVByb2IodGhpcy5wYXJhbXMuZW5lcmd5X3Byb2IpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQge1NpbXVsYXRpb24sIFNpbXVsYXRpb25QYXJhbXN9OyIsImltcG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc30gZnJvbSBcIi4vc2ltdWxhdGlvbi5qc1wiO1xuaW1wb3J0IHtTaW1EYXRhfSBmcm9tIFwiLi9zaW1kYXRhLmpzXCI7XG5cbmxldCBzaW11bGF0aW9uID0gbnVsbDtcbmxldCBkYXRhID0gbnVsbDtcbmxldCBydW5uaW5nID0gZmFsc2U7XG5sZXQgY2VsbFNpemUgPSAyO1xuY29uc3QgVEFSR0VUX0ZQUyA9IDYwO1xuY29uc3QgRlJBTUVfSU5URVJWQUxfTVMgPSAxMDAwIC8gVEFSR0VUX0ZQUztcbmxldCBsYXN0RnJhbWVUaW1lID0gMDtcblxuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGE7XG4gICAgc3dpdGNoIChtc2cudHlwZSkge1xuICAgIGNhc2UgXCJpbml0XCI6XG4gICAgICAgIGluaXRTaW0obXNnLnBhcmFtcywgbXNnLmdlbm9tZXMgfHwgbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgbG9vcCgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RvcFwiOlxuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGVwXCI6XG4gICAgICAgIGRvU3RlcCgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgcHVzaFN0YXRzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJnZXRDZWxsXCI6XG4gICAgICAgIHNlbmRDZWxsSW5mbyhtc2cueCwgbXNnLnkpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZGlzdHVyYlwiOlxuICAgICAgICBhcHBseURpc3R1cmJhbmNlKG1zZy5zdHJlbmd0aCk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwia2lsbENlbGxcIjpcbiAgICAgICAga2lsbENlbGxBdChtc2cueCwgbXNnLnkpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInVwZGF0ZURpc3BsYXlQYXJhbXNcIjpcbiAgICAgICAgaWYgKHNpbXVsYXRpb24gJiYgc2ltdWxhdGlvbi5wYXJhbXMpIHtcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnN0ZXBzX3Blcl9mcmFtZSA9IG1zZy5zdGVwc19wZXJfZnJhbWU7XG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5yZWNvcmRfaW50ZXJ2YWwgPSBtc2cucmVjb3JkX2ludGVydmFsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJleHBvcnRcIjpcbiAgICAgICAgZXhwb3J0R2Vub21lcygpO1xuICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBpbml0U2ltKHBhcmFtcywgaW1wb3J0ZWRHZW5vbWVzPW51bGwpIHtcbiAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgY29uc3Qgc2ltX3BhcmFtcyA9IG5ldyBTaW11bGF0aW9uUGFyYW1zKHBhcmFtcyk7XG4gICAgY2VsbFNpemUgPSBwYXJhbXMuY2VsbFNpemUgfHwgODtcbiAgICBzaW11bGF0aW9uID0gbmV3IFNpbXVsYXRpb24oc2ltX3BhcmFtcyk7XG4gICAgZGF0YSA9IG5ldyBTaW1EYXRhKHNpbXVsYXRpb24pO1xuICAgIGlmIChpbXBvcnRlZEdlbm9tZXMgJiYgaW1wb3J0ZWRHZW5vbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2ltdWxhdGlvbi5pbml0X3BvcHVsYXRpb25fZnJvbV9nZW5vbWVzKGltcG9ydGVkR2Vub21lcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2ltdWxhdGlvbi5pbml0X3BvcHVsYXRpb24oKTtcbiAgICB9XG4gICAgcHVzaEZyYW1lKCk7XG4gICAgcHVzaFN0YXRzKCk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKSB7XG4gICAgaWYgKCFydW5uaW5nKSByZXR1cm47XG5cbiAgICBjb25zdCBzcGYgPSBzaW11bGF0aW9uLnBhcmFtcy5zdGVwc19wZXJfZnJhbWU7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGY7IGkrKykge1xuICAgICAgICBkb1N0ZXAoKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSBsYXN0RnJhbWVUaW1lID49IEZSQU1FX0lOVEVSVkFMX01TKSB7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBwdXNoU3RhdHMoKTtcbiAgICAgICAgbGFzdEZyYW1lVGltZSA9IG5vdztcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KGxvb3AsIDApO1xufVxuXG5mdW5jdGlvbiBkb1N0ZXAoKSB7XG4gICAgc2ltdWxhdGlvbi5zdGVwKCk7XG5cbiAgICAvLyBQZXJpb2RpYyBkaXN0dXJiYW5jZVxuICAgIGNvbnN0IGRpID0gc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWw7XG4gICAgaWYgKGRpID4gMCAmJiBzaW11bGF0aW9uLnN0ZXBudW0gJSBkaSA9PT0gMCkge1xuICAgICAgICBhcHBseURpc3R1cmJhbmNlKHNpbXVsYXRpb24ucGFyYW1zLmRpc3R1cmJhbmNlX3N0cmVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoc2ltdWxhdGlvbi5zdGVwbnVtICUgc2ltdWxhdGlvbi5wYXJhbXMucmVjb3JkX2ludGVydmFsID09PSAwIHx8IHNpbXVsYXRpb24uc3RlcG51bSA9PT0gMSkge1xuICAgICAgICBkYXRhLnJlY29yZFN0ZXAoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHB1c2hTdGF0cygpIHtcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJzdGF0c1wiLFxuICAgICAgICBkYXRhOiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRhdGEuZGF0YSkpLFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlEaXN0dXJiYW5jZShzdHJlbmd0aCkge1xuICAgIGNvbnN0IHdvcmxkID0gc2ltdWxhdGlvbi53b3JsZDtcbiAgICBjb25zdCBwbGFudHMgPSB3b3JsZC5wbGFudHM7XG4gICAgaWYgKHBsYW50cy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBudW1Ub0tpbGwgPSBNYXRoLm1heCgxLCBNYXRoLmZsb29yKHN0cmVuZ3RoICogcGxhbnRzLmxlbmd0aCkpO1xuICAgIC8vIFNodWZmbGUgYSBzYW1wbGUgYW5kIGtpbGxcbiAgICBjb25zdCBzaHVmZmxlZCA9IHBsYW50cy5zbGljZSgpLnNvcnQoKCkgPT4gTWF0aC5yYW5kb20oKSAtIDAuNSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1Ub0tpbGwgJiYgaSA8IHNodWZmbGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIENoZWNrIHBsYW50IHN0aWxsIGFsaXZlIChub3Qga2lsbGVkIGJ5IHByZXZpb3VzIGl0ZXJhdGlvbilcbiAgICAgICAgaWYgKHdvcmxkLnBsYW50cy5pbmNsdWRlcyhzaHVmZmxlZFtpXSkpIHtcbiAgICAgICAgICAgIHdvcmxkLmtpbGxQbGFudChzaHVmZmxlZFtpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGtpbGxDZWxsQXQoeCwgeSkge1xuICAgIGNvbnN0IGNlbGwgPSBzaW11bGF0aW9uLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgaWYgKGNlbGwgJiYgY2VsbC5wbGFudCkge1xuICAgICAgICBzaW11bGF0aW9uLndvcmxkLmtpbGxQbGFudChjZWxsLnBsYW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGV4cG9ydEdlbm9tZXMoKSB7XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICBzaW11bGF0aW9uLndvcmxkLnBsYW50cy5mb3JFYWNoKHBsYW50ID0+IHtcbiAgICAgICAgc2Vlbi5hZGQocGxhbnQuZ2Vub21lLnNlcmlhbGl6ZSgpKTtcbiAgICB9KTtcbiAgICBjb25zdCBnZW5vbWVzID0gQXJyYXkuZnJvbShzZWVuKTtcbiAgICBjb25zdCBleHBvcnRCdW5kbGUgPSB7XG4gICAgICAgIGFjdGlvbl9tYXA6IHNpbXVsYXRpb24ucGFyYW1zLmFjdGlvbl9tYXAsXG4gICAgICAgIGdlbm9tZV9pbnRlcnByZXRlcjogc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyLFxuICAgICAgICBnZW5vbWVzXG4gICAgfTtcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJleHBvcnRlZEdlbm9tZXNcIiwgYnVuZGxlOiBleHBvcnRCdW5kbGUgfSk7XG59XG5cbmZ1bmN0aW9uIHB1c2hGcmFtZSgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBzaW11bGF0aW9uLndvcmxkLmdldFBpeGVsQnVmZmVyKGNlbGxTaXplKTtcbiAgICAvLyBUcmFuc2ZlciBvd25lcnNoaXAgb2YgdGhlIEFycmF5QnVmZmVyIGZvciB6ZXJvLWNvcHkgcGVyZm9ybWFuY2VcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJmcmFtZVwiLFxuICAgICAgICBidWZmZXI6IHJlc3VsdC5idWZmZXIuYnVmZmVyLFxuICAgICAgICB3aWR0aDogcmVzdWx0LndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHJlc3VsdC5oZWlnaHQsXG4gICAgICAgIGNlbGxDb3VudDogcmVzdWx0LmNlbGxDb3VudCxcbiAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgfSwgW3Jlc3VsdC5idWZmZXIuYnVmZmVyXSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRDZWxsSW5mbyh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoIWNlbGwgfHwgIWNlbGwucGxhbnQgfHwgIWNlbGwucGxhbnQuZ2Vub21lKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBwbGFudCA9IGNlbGwucGxhbnQ7XG4gICAgICAgIGNvbnN0IHJ1bGVzID0gc2ltdWxhdGlvbi5nZW5vbWVJbnRlcnByZXRlci5pbnRlcnByZXQocGxhbnQuZ2Vub21lKTtcblxuICAgICAgICAvLyBVc2UgdGhlIGNvcnJlY3Qgc3RhdGUgZGVwZW5kaW5nIG9uIGludGVycHJldGVyIHR5cGVcbiAgICAgICAgbGV0IGNlbGxTdGF0ZTtcbiAgICAgICAgaWYgKHNpbXVsYXRpb24ucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlciA9PT0gXCJibG9ja1wiKSB7XG4gICAgICAgICAgICBjZWxsU3RhdGUgPSBwbGFudC5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2VsbFN0YXRlID0gcGxhbnQuZ2V0U3RhdGUoY2VsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmVpZ2hib3VyaG9vZCA9IHBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIGNvbnN0IGVuZXJnaXNlZCA9IGNlbGwuZW5lcmdpc2VkO1xuXG4gICAgICAgIC8vIFNlcmlhbGl6ZSBydWxlcyBhcyBzdHJ1Y3R1cmVkIG9iamVjdHMgZm9yIHJpY2ggVUkgcmVuZGVyaW5nXG4gICAgICAgIGNvbnN0IHNlcmlhbGl6ZWRSdWxlcyA9IHJ1bGVzLm1hcCgociwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHIubWF0Y2hlcyhjZWxsU3RhdGUpO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uU3RyID0gci5hY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IGlzRGl2ID0gYWN0aW9uU3RyLnN0YXJ0c1dpdGgoXCJkaXZpZGVcIik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGluZGV4OiBpLFxuICAgICAgICAgICAgICAgIG1hdGNoZXMsXG4gICAgICAgICAgICAgICAgc3RhdGU6IHIuc3RhdGUsXG4gICAgICAgICAgICAgICAgZXFNYXNrOiByLmVxTWFzayxcbiAgICAgICAgICAgICAgICBhY3Rpb25UeXBlOiBpc0RpdiA/IFwiZGl2aWRlXCIgOiBhY3Rpb25TdHIsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc0RpdiA/IHIuYWN0aW9uLmdldERpcmVjdGlvbigpIDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoaW5nUnVsZUluZGV4ID0gc2VyaWFsaXplZFJ1bGVzLmZpbmRJbmRleChyID0+IHIubWF0Y2hlcyk7XG5cbiAgICAgICAgY29uc3QgZGVhdGggPSBwbGFudC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogXCJjZWxsSW5mb1wiLFxuICAgICAgICAgICAgZm91bmQ6IHRydWUsXG4gICAgICAgICAgICBjZWxsU3RyOiBjZWxsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBuZWlnaGJvdXJob29kLFxuICAgICAgICAgICAgZW5lcmdpc2VkLFxuICAgICAgICAgICAgY2VsbFN0YXRlLFxuICAgICAgICAgICAgbWF0Y2hpbmdSdWxlSW5kZXgsXG4gICAgICAgICAgICBkZWF0aDogSlNPTi5zdHJpbmdpZnkoZGVhdGgpLFxuICAgICAgICAgICAgZ2Vub21lTGVuZ3RoOiBwbGFudC5nZW5vbWUubGVuZ3RoLFxuICAgICAgICAgICAgbXV0RXhwOiBwbGFudC5nZW5vbWUubXV0X2V4cCxcbiAgICAgICAgICAgIHJ1bGVzOiBzZXJpYWxpemVkUnVsZXMsXG4gICAgICAgICAgICBpbnRlcnByZXRlclR5cGU6IHNpbXVsYXRpb24ucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcixcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJjZWxsSW5mb1wiLCBmb3VuZDogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtyYW5kb21JbnR9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtQbGFudH0gZnJvbSBcIi4vcGxhbnQuanNcIjtcbmltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5cbmNsYXNzIFdvcmxkIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KXtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHdvcmxkIGxhdHRpY2UgdG8gYWxsIG51bGxzXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzLnB1c2goW10pO1xuICAgICAgICAgICAgZm9yKHZhciBqPTA7IGo8dGhpcy5oZWlnaHQ7IGorKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tpXVtqXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYW50cyA9IFtdO1xuICAgICAgICB0aGlzLmNlbGxDb3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5vblBsYW50QmlydGggPSBudWxsO1xuICAgICAgICB0aGlzLm9uUGxhbnREZWF0aCA9IG51bGw7XG4gICAgICAgIHRoaXMub25BdHRhY2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIGFycmF5IG9mIHggcG9zaXRpb25zIGF0IHk9MCB3aGVyZSBubyBjZWxsIGV4aXN0c1xuICAgICAqL1xuICAgIGdldEZsb29yU3BhY2UoKXtcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICBpZih0aGlzLmNlbGxzW2ldWzBdID09PSBudWxsKXtcbiAgICAgICAgICAgICAgICBlbXB0eVNwYWNlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbXB0eVNwYWNlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdHJhdGVnaWVzIGZvciBzb3dpbmcgYSBzZWVkIG9uIHRoZSB3b3JsZCBmbG9vclxuICAgICAqIEBwYXJhbSB7Kn0gZ2Vub21lIHRoZSBnZW5vbWUgdXNlZCBieSB0aGUgbmV3IHNlZWRcbiAgICAgKiBAcGFyYW0geyp9IG5lYXJYIGlmIG5vdCBudWxsLCB0cnkgdG8gc293IGEgc2VlZCBhcyBjbG9zZVxuICAgICAqIGFzIHBvc3NpYmxlIHRvIHRoaXMgbG9jYXRpb25cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgYSBzZWVkIHdhcyBzdWNjZXNmdWxseSBwbGFudGVkLCBmYWxzZSBpZlxuICAgICAqIHRoZXJlIHdhcyBubyBzcGFjZSB0byBzb3cgYSBzZWVkLlxuICAgICAqL1xuICAgIHNlZWQoZ2Vub21lLCBuZWFyWCwgc3RlcG51bSl7XG4gICAgICAgIC8vIGZpbmQgYSByYW5kb20gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gdGhpcy5nZXRGbG9vclNwYWNlKCk7XG4gICAgICAgIGlmKGVtcHR5U3BhY2VzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZWFyWCAhPT0gdW5kZWZpbmVkICYmIG5lYXJYICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0WCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdF9kaWZmID0gdGhpcy53aWR0aDtcbiAgICAgICAgICAgIGVtcHR5U3BhY2VzLmZvckVhY2goZnVuY3Rpb24oeHBvcyl7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBNYXRoLmFicyhuZWFyWC14cG9zKTtcbiAgICAgICAgICAgICAgICBpZihkaWZmIDwgbmVhcmVzdF9kaWZmKXtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdF9kaWZmID0gZGlmZjtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFggPSB4cG9zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIG5lYXJlc3RYLCBzdGVwbnVtKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHggPSBlbXB0eVNwYWNlc1tyYW5kb21JbnQoMCwgZW1wdHlTcGFjZXMubGVuZ3RoLTEpXTtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbeF1bMF0gIT09IG51bGwpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3BhY2UgaXMgdGFrZW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIHgsIHN0ZXBudW0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzb3dQbGFudChnZW5vbWUsIHgsIHN0ZXBudW0pe1xuICAgICAgICB4ID0gdGhpcy5nZXRYKHgpO1xuICAgICAgICB2YXIgcGxhbnQgPSBuZXcgUGxhbnQoeCwgdGhpcywgZ2Vub21lLCBzdGVwbnVtKTtcbiAgICAgICAgdGhpcy5wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgIHRoaXMuYWRkQ2VsbChwbGFudC5jZWxsc1swXSk7XG4gICAgICAgIGlmICh0aGlzLm9uUGxhbnRCaXJ0aCkgdGhpcy5vblBsYW50QmlydGgocGxhbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBwbGFudCBmcm9tIHdvcmxkIHBsYW50IGxpc3QuXG4gICAgICogUmVtb3ZlIGFsbCBjZWxscyBmcm9tIGNlbGwgZ3JpZFxuICAgICAqL1xuICAgIGtpbGxQbGFudChwbGFudCl7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMucGxhbnRzLmluZGV4T2YocGxhbnQpO1xuICAgICAgICBpZiAoaWR4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucGxhbnRzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgdGhpcy5jZWxsQ291bnQgLT0gcGxhbnQuY2VsbHMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudC5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBwbGFudC5jZWxsc1tpXTtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vblBsYW50RGVhdGgpIHRoaXMub25QbGFudERlYXRoKHBsYW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFgoeCl7XG4gICAgICAgIGlmKHggPCAwKXtcbiAgICAgICAgICAgIHggPSB0aGlzLndpZHRoICsgeDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCAlIHRoaXMud2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0Q2VsbCh4LCB5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2VsbHNbdGhpcy5nZXRYKHgpXVt5XTtcbiAgICB9XG5cbiAgICBhZGRDZWxsKGNlbGwpe1xuICAgICAgICBpZiAodGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gPSBjZWxsO1xuICAgICAgICAgICAgdGhpcy5jZWxsQ291bnQrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFBpeGVsQnVmZmVyKGNlbGxTaXplKXtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMud2lkdGggKiBjZWxsU2l6ZTtcbiAgICAgICAgY29uc3QgaCA9IHRoaXMuaGVpZ2h0ICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OENsYW1wZWRBcnJheSh3ICogaCAqIDQpO1xuICAgICAgICBjb25zdCBwbGFudHMgPSB0aGlzLnBsYW50cztcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGxhbnQgPSBwbGFudHNbaV07XG4gICAgICAgICAgICBjb25zdCBbYmFzZVIsIGJhc2VHLCBiYXNlQl0gPSB0aGlzLmdldEJhc2VDb2xvdXIocGxhbnQpO1xuICAgICAgICAgICAgY29uc3QgZGFya1IgPSBNYXRoLnJvdW5kKGJhc2VSICogMC43KTtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtHID0gTWF0aC5yb3VuZChiYXNlRyAqIDAuNyk7XG4gICAgICAgICAgICBjb25zdCBkYXJrQiA9IE1hdGgucm91bmQoYmFzZUIgKiAwLjcpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBjZWxscyA9IHBsYW50LmNlbGxzO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjZWxsc1tqXTtcbiAgICAgICAgICAgICAgICBjb25zdCByMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZVIgOiBkYXJrUjtcbiAgICAgICAgICAgICAgICBjb25zdCBnMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZUcgOiBkYXJrRztcbiAgICAgICAgICAgICAgICBjb25zdCBiMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZUIgOiBkYXJrQjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBweDAgPSBjZWxsLnggKiBjZWxsU2l6ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBweTAgPSAodGhpcy5oZWlnaHQgLSAxIC0gY2VsbC55KSAqIGNlbGxTaXplO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZHkgPSAwOyBkeSA8IGNlbGxTaXplOyBkeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvd0lkeCA9IChweTAgKyBkeSkgKiB3O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkeCA9IDA7IGR4IDwgY2VsbFNpemU7IGR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQm9yZGVyID0gY2VsbFNpemUgPiAxICYmIChkeCA9PT0gMCB8fCBkeSA9PT0gMCB8fCBkeCA9PT0gY2VsbFNpemUgLSAxIHx8IGR5ID09PSBjZWxsU2l6ZSAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaWR4ID0gKHJvd0lkeCArIHB4MCArIGR4KSAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0JvcmRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdICAgICA9IE1hdGgucm91bmQocjAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAxXSA9IE1hdGgucm91bmQoZzAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IE1hdGgucm91bmQoYjAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4XSAgICAgPSByMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBnMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMl0gPSBiMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAzXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IGJ1ZmZlcjogYnVmLCB3aWR0aDogdywgaGVpZ2h0OiBoLCBjZWxsQ291bnQ6IHRoaXMuY2VsbENvdW50IH07XG4gICAgfVxuXG4gICAgZ2V0QmFzZUNvbG91cihwbGFudCl7XG4gICAgICAgIHZhciBpID0gcGxhbnQuY2VsbHNbMF0ueCAlIGNTY2FsZS5sZW5ndGg7XG4gICAgICAgIHJldHVybiBjU2NhbGVbaV07XG4gICAgfVxufVxuXG4vLyBodHRwOi8vY29sb3JicmV3ZXIyLm9yZy8/dHlwZT1xdWFsaXRhdGl2ZSZzY2hlbWU9U2V0MyZuPTgg4oCUIGFzIHJhdyBbUixHLEJdIHR1cGxlc1xudmFyIGNTY2FsZSA9IFtcbiAgICBbMTQxLDIxMSwxOTldLFsyNTUsMjU1LDE3OV0sWzE5MCwxODYsMjE4XSxbMjUxLDEyOCwxMTRdLFxuICAgIFsxMjgsMTc3LDIxMV0sWzI1MywxODAsOThdLFsxNzksMjIyLDEwNV0sWzI1MiwyMDUsMjI5XVxuXTtcblxuXG5leHBvcnQgeyBXb3JsZCB9OyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdGxvYWRlZDogZmFsc2UsXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG5cdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLy8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbl9fd2VicGFja19yZXF1aXJlX18ubSA9IF9fd2VicGFja19tb2R1bGVzX187XG5cbi8vIHRoZSBzdGFydHVwIGZ1bmN0aW9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuXHQvLyBUaGlzIGVudHJ5IG1vZHVsZSBkZXBlbmRzIG9uIG90aGVyIGxvYWRlZCBjaHVua3MgYW5kIGV4ZWN1dGlvbiBuZWVkIHRvIGJlIGRlbGF5ZWRcblx0dmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8odW5kZWZpbmVkLCBbXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzXCIpKSlcblx0X193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyhfX3dlYnBhY2tfZXhwb3J0c19fKTtcblx0cmV0dXJuIF9fd2VicGFja19leHBvcnRzX187XG59O1xuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmFtZEQgPSBmdW5jdGlvbiAoKSB7XG5cdHRocm93IG5ldyBFcnJvcignZGVmaW5lIGNhbm5vdCBiZSB1c2VkIGluZGlyZWN0Jyk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kTyA9IHt9OyIsInZhciBkZWZlcnJlZCA9IFtdO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5PID0gKHJlc3VsdCwgY2h1bmtJZHMsIGZuLCBwcmlvcml0eSkgPT4ge1xuXHRpZihjaHVua0lkcykge1xuXHRcdHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcblx0XHRmb3IodmFyIGkgPSBkZWZlcnJlZC5sZW5ndGg7IGkgPiAwICYmIGRlZmVycmVkW2kgLSAxXVsyXSA+IHByaW9yaXR5OyBpLS0pIGRlZmVycmVkW2ldID0gZGVmZXJyZWRbaSAtIDFdO1xuXHRcdGRlZmVycmVkW2ldID0gW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldO1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXIgbm90RnVsZmlsbGVkID0gSW5maW5pdHk7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWQubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldID0gZGVmZXJyZWRbaV07XG5cdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaHVua0lkcy5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYgKChwcmlvcml0eSAmIDEgPT09IDAgfHwgbm90RnVsZmlsbGVkID49IHByaW9yaXR5KSAmJiBPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLk8pLmV2ZXJ5KChrZXkpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fLk9ba2V5XShjaHVua0lkc1tqXSkpKSkge1xuXHRcdFx0XHRjaHVua0lkcy5zcGxpY2Uoai0tLCAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZ1bGZpbGxlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZihwcmlvcml0eSA8IG5vdEZ1bGZpbGxlZCkgbm90RnVsZmlsbGVkID0gcHJpb3JpdHk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKGZ1bGZpbGxlZCkge1xuXHRcdFx0ZGVmZXJyZWQuc3BsaWNlKGktLSwgMSlcblx0XHRcdHZhciByID0gZm4oKTtcblx0XHRcdGlmIChyICE9PSB1bmRlZmluZWQpIHJlc3VsdCA9IHI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3MgYW5kIGNodW5rcyB0aGF0IHRoZSBlbnRyeXBvaW50IGRlcGVuZHMgb25cbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5idW5kbGUuanNcIjtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5ubWQgPSAobW9kdWxlKSA9PiB7XG5cdG1vZHVsZS5wYXRocyA9IFtdO1xuXHRpZiAoIW1vZHVsZS5jaGlsZHJlbikgbW9kdWxlLmNoaWxkcmVuID0gW107XG5cdHJldHVybiBtb2R1bGU7XG59OyIsInZhciBzY3JpcHRVcmw7XG5pZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5nLmltcG9ydFNjcmlwdHMpIHNjcmlwdFVybCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5sb2NhdGlvbiArIFwiXCI7XG52YXIgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCAmJiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ1NDUklQVCcpXG5cdFx0c2NyaXB0VXJsID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG5cdGlmICghc2NyaXB0VXJsKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKTtcblx0XHRpZihzY3JpcHRzLmxlbmd0aCkge1xuXHRcdFx0dmFyIGkgPSBzY3JpcHRzLmxlbmd0aCAtIDE7XG5cdFx0XHR3aGlsZSAoaSA+IC0xICYmICghc2NyaXB0VXJsIHx8ICEvXmh0dHAocz8pOi8udGVzdChzY3JpcHRVcmwpKSkgc2NyaXB0VXJsID0gc2NyaXB0c1tpLS1dLnNyYztcblx0XHR9XG5cdH1cbn1cbi8vIFdoZW4gc3VwcG9ydGluZyBicm93c2VycyB3aGVyZSBhbiBhdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIHlvdSBtdXN0IHNwZWNpZnkgYW4gb3V0cHV0LnB1YmxpY1BhdGggbWFudWFsbHkgdmlhIGNvbmZpZ3VyYXRpb25cbi8vIG9yIHBhc3MgYW4gZW1wdHkgc3RyaW5nIChcIlwiKSBhbmQgc2V0IHRoZSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyB2YXJpYWJsZSBmcm9tIHlvdXIgY29kZSB0byB1c2UgeW91ciBvd24gbG9naWMuXG5pZiAoIXNjcmlwdFVybCkgdGhyb3cgbmV3IEVycm9yKFwiQXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXJcIik7XG5zY3JpcHRVcmwgPSBzY3JpcHRVcmwucmVwbGFjZSgvXmJsb2I6LywgXCJcIikucmVwbGFjZSgvIy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcPy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcL1teXFwvXSskLywgXCIvXCIpO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5wID0gc2NyaXB0VXJsOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBjaHVua3Ncbi8vIFwiMVwiIG1lYW5zIFwiYWxyZWFkeSBsb2FkZWRcIlxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJzcmNfc2ltdWxhdGlvbl93b3JrZXJfanNcIjogMVxufTtcblxuLy8gaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0dmFyIFtjaHVua0lkcywgbW9yZU1vZHVsZXMsIHJ1bnRpbWVdID0gZGF0YTtcblx0Zm9yKHZhciBtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG5cdFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLm1bbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHR3aGlsZShjaHVua0lkcy5sZW5ndGgpXG5cdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRzLnBvcCgpXSA9IDE7XG5cdHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uKGRhdGEpO1xufTtcbl9fd2VicGFja19yZXF1aXJlX18uZi5pID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdC8vIFwiMVwiIGlzIHRoZSBzaWduYWwgZm9yIFwiYWxyZWFkeSBsb2FkZWRcIlxuXHRpZighaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG5cdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdGltcG9ydFNjcmlwdHMoX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgX193ZWJwYWNrX3JlcXVpcmVfXy51KGNodW5rSWQpKTtcblx0XHR9XG5cdH1cbn07XG5cbnZhciBjaHVua0xvYWRpbmdHbG9iYWwgPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gfHwgW107XG52YXIgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24gPSBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IGluc3RhbGxDaHVuaztcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdCIsInZhciBuZXh0ID0gX193ZWJwYWNrX3JlcXVpcmVfXy54O1xuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5lKFwidmVuZG9ycy1ub2RlX21vZHVsZXNfc2VlZHJhbmRvbV9pbmRleF9qcy1ub2RlX21vZHVsZXNfc3RhdHMtbGl0ZV9zdGF0c19qc1wiKS50aGVuKG5leHQpO1xufTsiLCIiLCIvLyBydW4gc3RhcnR1cFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLngoKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==