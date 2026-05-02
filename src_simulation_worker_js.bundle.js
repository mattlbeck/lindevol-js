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

    execute(cell, stepnum, params){
        // actions are typically only carried out if the cell has energy
        // and the cell loses energy as a result.
        if (cell.energised){
            var success = this.doAction(cell, stepnum, params);
            cell.energised = !success;
        }
    }

    doAction(cell){

    }
}

class Divide extends Action{

    doAction(cell, stepnum, params){
        // the 2 least significant bits of the action code
        // determines which direction the divide action is for
        super.doAction(cell, stepnum, params);

        if (params && params.sim_mode === "niche") {
            if (cell.plant.nutrientCount < params.nutrient_divide_cost) {
                return false; 
            }
            cell.plant.nutrientCount -= params.nutrient_divide_cost;
        }

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
        // Toggle the bit using XOR
        cell.nextInternalState = cell.nextInternalState ^ (1 << this.getNthBit());
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


class PromotorInterpreter extends GenomeInterpreter{
    constructor(mapping){
        super(mapping, 64); // terminator contributes lower 6 bits: range 0-63
    }
    interpret(bytearray, plant=null){
        var rules = [];
        var behavioralGenes = [];
        var structuralGenes = [];
        var gene = [];
        
        for(var i=0; i < bytearray.length; i++){
            var c = bytearray[i];
            
            if(bitSet(c, 7)){
                // Start of a gene
                gene = [c];
            }
            else if(bitSet(c, 6)){
                // Terminator (End of a gene)
                if(gene.length > 0){
                    gene.push(c);
                    // Bit 5 of the starting promotor determines if it's structural
                    if (bitSet(gene[0], 5)) {
                        structuralGenes.push(gene);
                    } else {
                        behavioralGenes.push(gene);
                    }
                    gene = [];
                }
            } else if (gene.length > 0) {
                gene.push(c);
            }
        }

        // Process Structural Genes (Phenotypic Traits)
        if (plant) {
            structuralGenes.forEach(function(gene) {
                const traitCode = gene[gene.length - 1] & 0x3F;
                const value = (gene.length - 2) * 0.01; // Strength depends on gene length
                
                switch(traitCode % 4) {
                    case 0: plant.traits.leanover = Math.max(0.1, plant.traits.leanover - value); break;
                    case 1: plant.traits.attack = Math.min(5.0, plant.traits.attack + value); break;
                    case 2: plant.traits.efficiency = Math.max(0.1, plant.traits.efficiency - value); break;
                    case 3: plant.traits.death = Math.max(0.1, plant.traits.death - value); break;
                }
            });
        }

        // Process Behavioral Genes (State-Action Rules)
        behavioralGenes.forEach(function(gene){
            // extract 6 least sig bits from terminator as the action code
            var actionCode = gene[gene.length-1] & 0x3F;
            var action = this.mapping.getAction(actionCode);
            
            // take information from operators to create 32-bit state mask
            var mask = 0;
            var eqMask = 0; 
            for(var i=1; i<gene.length-1; i++) {
                // 5 least sig bits determine the mask index (0-31)
                var maskBit = gene[i] & 0x1F;

                // 6th bit determines if we match 1 or 0
                var bitState = (gene[i] & 0x20) >> 5;
                
                // Use unsigned shift logic for 32-bit consistency
                const bitValue = (1 << maskBit) >>> 0;
                if (bitState) {
                    mask = (mask | bitValue) >>> 0;
                }
                eqMask = (eqMask | bitValue) >>> 0;
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
        this.nutrientCount = 10.0; // Start with some nutrients
        this.traits = {
            leanover: 1.0,
            death: 1.0,
            attack: 1.0,
            efficiency: 1.0
        };
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
        const neighborhood = this.getNeighbourhood(cell);
        
        // Basic 16-bit state
        let state = neighborhood | (cell.internalState << 8) | ((cell.energised ? 1 : 0) << 15);
        
        // Niche enhancements (32-bit)
        // Bits 0-7: Neighbor presence (in neighborhood)
        // Bits 8-15: Neighbor Public Bits (Bit 8 of neighbor internalState)
        // Bits 16-23: Neighbor Energy Status
        // Bits 24-30: Self Internal State
        // Bit 31: Self Energised
        
        let neighborSignals = 0;
        let neighborEnergy = 0;
        
        for(var i=0; i<_actions_js__WEBPACK_IMPORTED_MODULE_2__.NEIGHBOURHOOD.length; i++){
            var pos = _actions_js__WEBPACK_IMPORTED_MODULE_2__.NEIGHBOURHOOD[i];
            var x = cell.x + pos[0];
            var y = cell.y + pos[1];
            
            if (x >= 0 && x < this.world.width && y >= 0 && y < this.world.height) {
                var worldPos = this.world.cells[x][y];
                if (worldPos instanceof _cell_js__WEBPACK_IMPORTED_MODULE_1__.Cell){
                    // Check Bit 0 of neighbor's internal state (as their Public Bit)
                    if ((worldPos.internalState & 1) !== 0) {
                        neighborSignals |= (1 << i);
                    }
                    if (worldPos.energised) {
                        neighborEnergy |= (1 << i);
                    }
                }
            }
        }

        // Construct 32-bit state
        // We use unsigned right shift for 32-bit consistency
        state = (neighborhood & 0xFF) | 
                ((neighborSignals & 0xFF) << 8) | 
                ((neighborEnergy & 0xFF) << 16) | 
                ((cell.internalState & 0x7F) << 24) | 
                ((cell.energised ? 1 : 0) << 31);
                
        return state >>> 0; 
    }

    metabolism(params) {
        if (params.sim_mode !== "niche") return;

        // 1. Extraction from roots (y=0)
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            if (cell.y === 0) {
                const available = this.world.soilNutrients[cell.x];
                const amount = Math.min(available, params.nutrient_extract_rate);
                this.nutrientCount += amount;
                this.world.soilNutrients[cell.x] -= amount;
            }
        }

        // 2. Maintenance cost
        // Traits can reduce maintenance cost
        const cost = this.cells.length * params.nutrient_maintenance_cost * this.traits.efficiency;
        this.nutrientCount = Math.max(0, this.nutrientCount - cost);
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

    metabolism(params) {
        if (params.sim_mode !== "niche") return;

        // 1. Extraction from roots (y=0)
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            if (cell.y === 0) {
                const available = this.world.soilNutrients[cell.x];
                const amount = Math.min(available, params.nutrient_extract_rate);
                this.nutrientCount += amount;
                this.world.soilNutrients[cell.x] -= amount;
            }
        }

        // 2. Maintenance cost
        // Traits can reduce maintenance cost
        const cost = this.cells.length * params.nutrient_maintenance_cost * this.traits.efficiency;
        this.nutrientCount = Math.max(0, this.nutrientCount - cost);
    }

    getKillProbability(){
        const baseProb = this.energisedCount > 0 ? 1/this.energisedCount : 1.0;
        return baseProb * this.traits.attack;
    }

    /**
     * Calculate whether this plant should die.
     * @param {} natural_exp exponent to the number of cells
     * @param {*} energy_exp exponent to the number of energy rich cells
     * @param {*} leanover_factor factor to the leanover term
     */
    getDeathProbability(death_factor, natural_exp, energy_exp, leanover_factor, sim_mode="classic"){
        var numCells = this.cells.length;
        
        var leanoverCells = 2/(numCells*(numCells-1));
        if (leanoverCells === Infinity){
            leanoverCells = 0;
        }

        var leanoverTerm = leanoverCells*Math.abs(this.leanoverEnergised);
        
        var d_natural = Math.pow(numCells, natural_exp);
        var d_energy = Math.pow(this.energisedCount+1, energy_exp);
        var d_leanover = (leanover_factor * this.traits.leanover) * leanoverTerm;
        
        // Base probability modified by death trait
        var pDeath = (death_factor * this.traits.death) * d_natural * d_energy + d_leanover;
        
        // Niche mode specific penalties
        if (sim_mode === "niche") {
            // Starvation penalty
            if (this.nutrientCount <= 0 && numCells > 1) {
                pDeath += 0.05; // 5% flat increase if starving
            }
        }

        return {
            "prob": pDeath,
            "natural": d_natural,
            "energy": d_energy,
            "leanover": d_leanover,
            "nutrients": this.nutrientCount
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
                        sim.params.leanover_factor,
                        sim.params.sim_mode
                    ).prob;
                }, 0);
                return total / sim.world.plants.length;
            }),
            new Collector("avg_nutrients", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + p.nutrientCount, 0);
                return total / sim.world.plants.length;
            }),
            new Collector("soil_nutrients", AsIs, function(sim){
                if (!sim.world.soilNutrients || sim.world.soilNutrients.length === 0) return 0;
                const total = sim.world.soilNutrients.reduce((sum, n) => sum + n, 0);
                return total / sim.world.soilNutrients.length;
            }),
            new Collector("avg_traits", AsIs, function(sim){
                if (sim.world.plants.length === 0) return { lean: 1, attack: 1, eff: 1, death: 1 };
                const totals = sim.world.plants.reduce((acc, p) => {
                    acc.lean += p.traits.leanover;
                    acc.attack += p.traits.attack;
                    acc.eff += p.traits.efficiency;
                    acc.death += p.traits.death;
                    return acc;
                }, { lean: 0, attack: 0, eff: 0, death: 0 });
                const n = sim.world.plants.length;
                return {
                    lean: totals.lean / n,
                    attack: totals.attack / n,
                    eff: totals.eff / n,
                    death: totals.death / n
                };
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

        this.genome_interpreter = "promotor";
        this.initial_genome_length = 400;

        // Mode selection
        this.sim_mode = "niche"; // "classic" or "niche"

        // Niche mode: Nutrients
        this.nutrient_max = 100.0;
        this.nutrient_replenish_rate = 1.0;
        this.nutrient_extract_rate = 5.0;
        this.nutrient_maintenance_cost = 0.05; // per cell per step
        this.nutrient_divide_cost = 10.0;

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
        
        // Initialize nutrients in Niche mode
        if (this.params.sim_mode === "niche") {
            this.world.initNutrients(this.params.nutrient_max);
        }

        this.genomeInterpreter = this.getInterpreter();
        this.mut_units = 1;
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
        if (this.params.sim_mode === "niche") {
            this.world.replenishNutrients(this.params.nutrient_replenish_rate);
        }
        this.simulateDeath();
        this.simulateLight();
        this.simulateActions();
        this.mutate();
    }

    simulateActions(){
        for (let i = 0; i < this.world.plants.length; i++) {
            const plant = this.world.plants[i];
            
            // Niche metabolism
            plant.metabolism(this.params);

            if (!plant.rules) {
                plant.rules = this.genomeInterpreter.interpret(plant.genome, plant);
            }
            const rules = plant.rules;
            for (let j = 0; j < plant.cells.length; j++) {
                this.cellAction(plant.cells[j], rules);
            }
        }
    }

    cellAction(cell, rules){
        var state = cell.plant.getState(cell);
        const self = this;
        rules.forEach(function(rule){
            // execute one action using the first matching rule
            if (rule.matches(state)){
                // Track seeds
                if (rule.action.constructor.name === "FlyingSeed") self.stats.flyingSeeds++;
                if (rule.action.constructor.name === "FlyingSeed" || rule.action.constructor.name === "LocalSeed") {
                    self.stats.totalSeeds++;
                }
                rule.action.execute(cell, self.stepnum, self.params);
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
        const rules = simulation.genomeInterpreter.interpret(plant.genome, plant);

        // Use the correct state
        let cellState = plant.getState(cell);
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
            simulation.params.leanover_factor,
            simulation.params.sim_mode
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

        this.soilNutrients = [];
        this.nutrientMax = 0;
    }

    initNutrients(max) {
        this.nutrientMax = max;
        this.soilNutrients = new Array(this.width).fill(max);
    }

    replenishNutrients(rate) {
        for (let x = 0; x < this.width; x++) {
            this.soilNutrients[x] = Math.min(this.nutrientMax, this.soilNutrients[x] + rate);
        }
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

        // Render soil nutrients in background if present
        if (this.soilNutrients && this.soilNutrients.length > 0) {
            for (let x = 0; x < this.width; x++) {
                const n = this.soilNutrients[x] / this.nutrientMax;
                // Dark brown to earthy brown gradient
                const r = Math.round(40 + 40 * n);
                const g = Math.round(30 + 20 * n);
                const b = Math.round(20 + 10 * n);
                
                const px = x * cellSize;
                const py = (this.height - 1) * cellSize; // Bottom row
                for (let dy = 0; dy < cellSize; dy++) {
                    const rowIdx = (py + dy) * w;
                    for (let dx = 0; dx < cellSize; dx++) {
                        const idx = (rowIdx + px + dx) * 4;
                        buf[idx] = r;
                        buf[idx + 1] = g;
                        buf[idx + 2] = b;
                        buf[idx + 3] = 255;
                    }
                }
            }
        }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NpbXVsYXRpb25fd29ya2VyX2pzLmJ1bmRsZS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUIsb0JBQW9CO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDJCQUEyQixpQkFBaUI7QUFDNUM7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQix1QkFBdUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFD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Q0E7V0FDQSxpQkFBaUIscUJBQXFCO1dBQ3RDO1dBQ0E7V0FDQSxrQkFBa0IscUJBQXFCO1dBQ3ZDO1dBQ0E7V0FDQSxLQUFLO1dBQ0w7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1dDM0JBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEVBQUU7V0FDRixFOzs7OztXQ1JBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7V0NKQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEdBQUc7V0FDSDtXQUNBO1dBQ0EsQ0FBQyxJOzs7OztXQ1BELHdGOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RCxFOzs7OztXQ05BO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsRTs7Ozs7V0NKQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxrQzs7Ozs7V0NsQkE7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGFBQWE7V0FDYjtXQUNBO1dBQ0E7V0FDQTs7V0FFQTtXQUNBO1dBQ0E7O1dBRUE7O1dBRUEsa0I7Ozs7O1dDcENBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1VFSEE7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2xpbmRldm9sL2lnbm9yZWR8L1VzZXJzL21hdHQvbGluZGV2b2wtanMvbm9kZV9tb2R1bGVzL3NlZWRyYW5kb218Y3J5cHRvIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2FjdGlvbnMuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvY2VsbC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9nZW5vbWUuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvcGxhbnQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvcmFuZG9tLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbWRhdGEuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW11bGF0aW9uLndvcmtlci5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy93b3JsZC5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvYW1kIGRlZmluZSIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvYW1kIG9wdGlvbnMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2NodW5rIGxvYWRlZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2Vuc3VyZSBjaHVuayIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvZ2V0IGphdmFzY3JpcHQgY2h1bmsgZmlsZW5hbWUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvcHVibGljUGF0aCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9zdGFydHVwIGNodW5rIGRlcGVuZGVuY2llcyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLyogKGlnbm9yZWQpICovIiwiY29uc3QgTkVJR0hCT1VSSE9PRCA9IFtbLTEsLTFdLCBbMCwtMV0sIFsxLC0xXSwgWy0xLDBdLCBbMSwwXSwgWy0xLDFdLCBbMCwxXSwgWzEsMV1dO1xuY29uc3QgTVVUX0lOQ1JFTUVOVCA9IDAuMDAxO1xuXG5jbGFzcyBBY3Rpb257XG4gICAgY29uc3RydWN0b3IoYWN0aW9uQ29kZSl7XG4gICAgICAgIHRoaXMuY29kZSA9IGFjdGlvbkNvZGU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBleGVjdXRlKGNlbGwsIHN0ZXBudW0sIHBhcmFtcyl7XG4gICAgICAgIC8vIGFjdGlvbnMgYXJlIHR5cGljYWxseSBvbmx5IGNhcnJpZWQgb3V0IGlmIHRoZSBjZWxsIGhhcyBlbmVyZ3lcbiAgICAgICAgLy8gYW5kIHRoZSBjZWxsIGxvc2VzIGVuZXJneSBhcyBhIHJlc3VsdC5cbiAgICAgICAgaWYgKGNlbGwuZW5lcmdpc2VkKXtcbiAgICAgICAgICAgIHZhciBzdWNjZXNzID0gdGhpcy5kb0FjdGlvbihjZWxsLCBzdGVwbnVtLCBwYXJhbXMpO1xuICAgICAgICAgICAgY2VsbC5lbmVyZ2lzZWQgPSAhc3VjY2VzcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRvQWN0aW9uKGNlbGwpe1xuXG4gICAgfVxufVxuXG5jbGFzcyBEaXZpZGUgZXh0ZW5kcyBBY3Rpb257XG5cbiAgICBkb0FjdGlvbihjZWxsLCBzdGVwbnVtLCBwYXJhbXMpe1xuICAgICAgICAvLyB0aGUgMiBsZWFzdCBzaWduaWZpY2FudCBiaXRzIG9mIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAvLyBkZXRlcm1pbmVzIHdoaWNoIGRpcmVjdGlvbiB0aGUgZGl2aWRlIGFjdGlvbiBpcyBmb3JcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSwgcGFyYW1zKTtcblxuICAgICAgICBpZiAocGFyYW1zICYmIHBhcmFtcy5zaW1fbW9kZSA9PT0gXCJuaWNoZVwiKSB7XG4gICAgICAgICAgICBpZiAoY2VsbC5wbGFudC5udXRyaWVudENvdW50IDwgcGFyYW1zLm51dHJpZW50X2RpdmlkZV9jb3N0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNlbGwucGxhbnQubnV0cmllbnRDb3VudCAtPSBwYXJhbXMubnV0cmllbnRfZGl2aWRlX2Nvc3Q7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICAgICAgY2VsbC5wbGFudC5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uLCBzdGVwbnVtKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICB9XG5cbiAgICBnZXREaXJlY3Rpb24oKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMDExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICB2YXIgZGlyZWN0aW9uQ29kZSA9IHRoaXMuY29kZSAmIDc7XG4gICAgICAgIHJldHVybiBORUlHSEJPVVJIT09EW2RpcmVjdGlvbkNvZGVdO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgZGl2aWRlICR7dGhpcy5nZXREaXJlY3Rpb24oKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlUGx1cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgKz0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0K1wiO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlTWludXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwIC09IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dC1cIjtcbiAgICB9XG59XG5cbmNsYXNzIEZseWluZ1NlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCwgc3RlcG51bSl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSwgbnVsbCwgc3RlcG51bSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwiZmx5aW5nc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgTG9jYWxTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsLCBzdGVwbnVtKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCksIGNlbGwueCwgc3RlcG51bSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibG9jYWxzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBTdGF0ZUJpdE4gZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCkge1xuICAgICAgICAvLyBUb2dnbGUgdGhlIGJpdCB1c2luZyBYT1JcbiAgICAgICAgY2VsbC5uZXh0SW50ZXJuYWxTdGF0ZSA9IGNlbGwubmV4dEludGVybmFsU3RhdGUgXiAoMSA8PCB0aGlzLmdldE50aEJpdCgpKTtcbiAgICAgICAgLy8gdGhpcyBhY3Rpb24gZG9lcyBub3QgY29uc3VtZSBlbmVyZ3lcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGdldE50aEJpdCgpe1xuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcbiAgICAgICAgLy8gJiB3aXRoIDAwMDAxMTExIHRvIG1hc2sgb3V0IGxlYXN0IHNpZyBiaXRzXG4gICAgICAgIHJldHVybiB0aGlzLmNvZGUgJiAxNTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYFN0YXRlQml0ICR7dGhpcy5nZXROdGhCaXQoKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgQWN0aW9uTWFwIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcsIGNvZGVSYW5nZT0yNTYpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBtYXBwaW5nO1xuICAgICAgICB0aGlzLmNvZGVSYW5nZSA9IGNvZGVSYW5nZTtcbiAgICAgICAgdGhpcy5hY3Rpb25zID0gW0RpdmlkZSwgRmx5aW5nU2VlZCwgTG9jYWxTZWVkLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgU3RhdGVCaXROXTtcbiAgICB9XG5cbiAgICBnZXRBY3Rpb24oYWN0aW9uQ29kZSl7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgYWN0aW9uIGNvZGUgaW50byB0aGUgWzAsIHN1bSkgcmFuZ2Ugc28gd2VpZ2h0cyBjYW4gYmVcbiAgICAgICAgLy8gYW55IHBvc2l0aXZlIGludGVnZXJzIHJhdGhlciB0aGFuIG5lZWRpbmcgdG8gc3VtIHRvIGNvZGVSYW5nZS5cbiAgICAgICAgY29uc3Qgc3VtID0gdGhpcy5tYXBwaW5nLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkQ29kZSA9IE1hdGguZmxvb3IoKGFjdGlvbkNvZGUgLyB0aGlzLmNvZGVSYW5nZSkgKiBzdW0pO1xuICAgICAgICB2YXIgbWFwcGluZ0NvdW50ID0gMDtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5tYXBwaW5nLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG1hcHBpbmdDb3VudCArPSB0aGlzLm1hcHBpbmdbaV07XG4gICAgICAgICAgICBpZiAobm9ybWFsaXplZENvZGUgPCBtYXBwaW5nQ291bnQpe1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5hY3Rpb25zW2ldKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEZhbGxiYWNrIGZvciBmbG9hdGluZy1wb2ludCBlZGdlIGNhc2VzXG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5hY3Rpb25zW3RoaXMubWFwcGluZy5sZW5ndGggLSAxXShhY3Rpb25Db2RlKTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHtEaXZpZGUsIE11dGF0ZVBsdXMsIE11dGF0ZU1pbnVzLCBMb2NhbFNlZWQsIEZseWluZ1NlZWQsIEFjdGlvbk1hcCwgTkVJR0hCT1VSSE9PRH07IiwiXG5jbGFzcyBDZWxse1xuICAgIGNvbnN0cnVjdG9yKHBsYW50LCB4LCB5KXtcbiAgICAgICAgdGhpcy5wbGFudCA9IHBsYW50O1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gMDtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZ2V0IGVuZXJnaXNlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuZXJnaXNlZDtcbiAgICB9XG5cbiAgICBzZXQgZW5lcmdpc2VkKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmVyZ2lzZWQgPT09IHZhbHVlKSByZXR1cm47XG4gICAgICAgIHRoaXMuX2VuZXJnaXNlZCA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5wbGFudCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudCsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYW50LmVuZXJnaXNlZENvdW50LS07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVTdGF0ZSgpe1xuICAgICAgICB0aGlzLmludGVybmFsU3RhdGUgPSB0aGlzLm5leHRJbnRlcm5hbFN0YXRlO1xuICAgICAgICB0aGlzLm5leHRJbnRlcm5hbFN0YXRlID0gMDtcbiAgICB9XG5cbiAgICBkcmF3KGN0eCwgeCwgeSwgc2l6ZSwgY29sb3VyKXtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG91cjtcbiAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgICAgICAvL2N0eC5zdHJva2VSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgQ2VsbCBhdCAoJHt0aGlzLnh9LCAke3RoaXMueX0pIGVuZXJneTogJHt0aGlzLmVuZXJnaXNlZH1gO1xuICAgIH1cbn1cblxuZXhwb3J0IHtDZWxsfTsiLCJpbXBvcnQge3JhbmRvbUludCwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge0FjdGlvbk1hcH0gZnJvbSBcIi4vYWN0aW9ucy5qc1wiO1xuXG5jbGFzcyBCeXRlQXJyYXkgZXh0ZW5kcyBBcnJheXtcblxuICAgIGNvbnN0cnVjdG9yKGxlbmd0aD0wLCBpbml0aWFsX211dF9leHA9MCl7XG4gICAgICAgIHN1cGVyKGxlbmd0aCk7XG4gICAgICAgIHRoaXMubXV0X2V4cCA9IGluaXRpYWxfbXV0X2V4cDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbShhcnIsIG11dF9leHA9MCl7XG4gICAgICAgIHZhciBiYSA9IG5ldyBCeXRlQXJyYXkoYXJyLmxlbmd0aCwgbXV0X2V4cCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSBhcnJbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlcmlhbGl6ZSB0aGlzIGdlbm9tZSB0byBhIHN0cmluZzogXCI8bXV0X2V4cD47PGJ5dGUwPiw8Ynl0ZTE+LC4uLlwiXG4gICAgICovXG4gICAgc2VyaWFsaXplKCl7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm11dF9leHB9OyR7QXJyYXkuZnJvbSh0aGlzKS5qb2luKFwiLFwiKX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlc2VyaWFsaXplIGEgZ2Vub21lIHN0cmluZyBwcm9kdWNlZCBieSBzZXJpYWxpemUoKS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gICAgICogQHJldHVybnMge0J5dGVBcnJheX1cbiAgICAgKi9cbiAgICBzdGF0aWMgZGVzZXJpYWxpemUoc3RyKXtcbiAgICAgICAgY29uc3QgcGFydHMgPSBzdHIudHJpbSgpLnNwbGl0KFwiO1wiKTtcbiAgICAgICAgY29uc3QgbXV0X2V4cCA9IHBhcnNlRmxvYXQocGFydHNbMF0pO1xuICAgICAgICBjb25zdCBieXRlcyA9IHBhcnRzWzFdLnNwbGl0KFwiLFwiKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgcmV0dXJuIEJ5dGVBcnJheS5mcm9tKGJ5dGVzLCBtdXRfZXhwKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmFuZG9tKGxlbmd0aCl7XG4gICAgICAgIHZhciBiYSA9IG5ldyBCeXRlQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8YmEubGVuZ3RoO2krKyl7XG4gICAgICAgICAgICBiYVtpXSA9IHJhbmRvbUludCgwLCAyNTUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICBjb3B5KCl7XG4gICAgICAgIHZhciBuZXdBcnIgPSBuZXcgQnl0ZUFycmF5KHRoaXMubGVuZ3RoLCB0aGlzLm11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG5ld0FycltpXSA9IHRoaXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld0FycjtcbiAgICB9XG5cbn1cblxuY2xhc3MgTXV0YXRvcntcbiAgICBjb25zdHJ1Y3Rvcihwcm9iLCBwcm9iX3JlcGxhY2VtZW50LCBwcm9iX2luc2VydGlvbiwgcHJvYl9kZWxldGlvbiwgcHJvYl9kdXAsIHJlcGxhY2VtZW50X21vZGUsIHVuaXRzKXtcbiAgICAgICAgdGhpcy5wcm9iID0gcHJvYjtcbiAgICAgICAgdGhpcy5wUiA9IHByb2JfcmVwbGFjZW1lbnQ7XG4gICAgICAgIHRoaXMucEkgPSBwcm9iX2luc2VydGlvbjtcbiAgICAgICAgdGhpcy5wRCA9IHByb2JfZGVsZXRpb247XG4gICAgICAgIHRoaXMucER1cCA9IHByb2JfZHVwO1xuICAgICAgICB0aGlzLnBSbW9kZSA9IHJlcGxhY2VtZW50X21vZGU7ICBcbiAgICAgICAgdGhpcy51bml0cyA9IHVuaXRzO1xuICAgIH1cblxuICAgIG11dGF0ZShnZW5vbWUpe1xuICAgICAgICBsZXQgbXV0YXRlZCA9IGZhbHNlO1xuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucFIsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2UoZ2Vub21lKTtcbiAgICAgICAgICAgIG11dGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMubVByb2IodGhpcy5wSSwgZ2Vub21lLm11dF9leHApKXtcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGdlbm9tZSk7XG4gICAgICAgICAgICBtdXRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEQsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShnZW5vbWUpO1xuICAgICAgICAgICAgbXV0YXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG11dGF0ZWQ7XG4gICAgfVxuXG4gICAgbVByb2IocCwgZXhwKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbVByb2IocCAqIE1hdGgucG93KCB0aGlzLnByb2IsIGV4cCkpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBzd2l0Y2godGhpcy5wUm1vZGUpe1xuICAgICAgICBjYXNlIFwiYnl0ZXdpc2VcIjpcbiAgICAgICAgICAgIGdlbm9tZVtpXSA9IHRoaXMucmFuZG9tQ2hhcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJiaXR3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSBnZW5vbWVbaV0gXiAoMSA8PCByYW5kb21JbnQoMCwgNykpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbXV0YXRpb24gcmVwbGFjZW1lbnQgbW9kZTogJHt0aGlzLnBSbW9kZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBpbnNlcnQoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAwLCB0aGlzLnJhbmRvbUNoYXIoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZWxldGUoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJhbmRvbUNoYXIoKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCAyNTUpO1xuICAgIH1cblxuICAgIHJhbmRvbVBvcyhnZW5vbWUpe1xuICAgICAgICByZXR1cm4gcmFuZG9tSW50KDAsIGdlbm9tZS5sZW5ndGgtMSk7XG4gICAgfVxufVxuXG5cblxuY2xhc3MgUnVsZSB7XG4gICAgY29uc3RydWN0b3IoZXFNYXNrLCBzdGF0ZSwgYWN0aW9uKXtcbiAgICAgICAgdGhpcy5lcU1hc2sgPSBlcU1hc2s7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBhY3Rpb247XG4gICAgfVxuXG4gICAgbWF0Y2hlcyhzdGF0ZSl7XG4gICAgICAgIHZhciBlcVN0YXRlID0gc3RhdGUgJiB0aGlzLmVxTWFzaztcbiAgICAgICAgcmV0dXJuIGVxU3RhdGUgPT09IHRoaXMuc3RhdGU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuc3RhdGV9IC0+ICR7dGhpcy5hY3Rpb259YDtcbiAgICB9XG59XG5cbmNsYXNzIEdlbm9tZUludGVycHJldGVye1xuICAgIC8qKlxuICAgICAqIE1ldGhvZHMgdGhhdCBkZWNvZGUgZ2Vub21lcyBpbnRvIHJ1bGVzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWFwcGluZywgY29kZVJhbmdlPTI1Nil7XG4gICAgICAgIHRoaXMubWFwcGluZyA9IG5ldyBBY3Rpb25NYXAobWFwcGluZywgY29kZVJhbmdlKTtcbiAgICB9XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG5cbiAgICB9XG59XG5cblxuY2xhc3MgUHJvbW90b3JJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcpe1xuICAgICAgICBzdXBlcihtYXBwaW5nLCA2NCk7IC8vIHRlcm1pbmF0b3IgY29udHJpYnV0ZXMgbG93ZXIgNiBiaXRzOiByYW5nZSAwLTYzXG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXksIHBsYW50PW51bGwpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgdmFyIGJlaGF2aW9yYWxHZW5lcyA9IFtdO1xuICAgICAgICB2YXIgc3RydWN0dXJhbEdlbmVzID0gW107XG4gICAgICAgIHZhciBnZW5lID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgYyA9IGJ5dGVhcnJheVtpXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDcpKXtcbiAgICAgICAgICAgICAgICAvLyBTdGFydCBvZiBhIGdlbmVcbiAgICAgICAgICAgICAgICBnZW5lID0gW2NdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihiaXRTZXQoYywgNikpe1xuICAgICAgICAgICAgICAgIC8vIFRlcm1pbmF0b3IgKEVuZCBvZiBhIGdlbmUpXG4gICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZS5wdXNoKGMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBCaXQgNSBvZiB0aGUgc3RhcnRpbmcgcHJvbW90b3IgZGV0ZXJtaW5lcyBpZiBpdCdzIHN0cnVjdHVyYWxcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJpdFNldChnZW5lWzBdLCA1KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJhbEdlbmVzLnB1c2goZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZWhhdmlvcmFsR2VuZXMucHVzaChnZW5lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBnZW5lID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChnZW5lLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBnZW5lLnB1c2goYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcm9jZXNzIFN0cnVjdHVyYWwgR2VuZXMgKFBoZW5vdHlwaWMgVHJhaXRzKVxuICAgICAgICBpZiAocGxhbnQpIHtcbiAgICAgICAgICAgIHN0cnVjdHVyYWxHZW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGdlbmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFpdENvZGUgPSBnZW5lW2dlbmUubGVuZ3RoIC0gMV0gJiAweDNGO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gKGdlbmUubGVuZ3RoIC0gMikgKiAwLjAxOyAvLyBTdHJlbmd0aCBkZXBlbmRzIG9uIGdlbmUgbGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc3dpdGNoKHRyYWl0Q29kZSAlIDQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOiBwbGFudC50cmFpdHMubGVhbm92ZXIgPSBNYXRoLm1heCgwLjEsIHBsYW50LnRyYWl0cy5sZWFub3ZlciAtIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTogcGxhbnQudHJhaXRzLmF0dGFjayA9IE1hdGgubWluKDUuMCwgcGxhbnQudHJhaXRzLmF0dGFjayArIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjogcGxhbnQudHJhaXRzLmVmZmljaWVuY3kgPSBNYXRoLm1heCgwLjEsIHBsYW50LnRyYWl0cy5lZmZpY2llbmN5IC0gdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiBwbGFudC50cmFpdHMuZGVhdGggPSBNYXRoLm1heCgwLjEsIHBsYW50LnRyYWl0cy5kZWF0aCAtIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcm9jZXNzIEJlaGF2aW9yYWwgR2VuZXMgKFN0YXRlLUFjdGlvbiBSdWxlcylcbiAgICAgICAgYmVoYXZpb3JhbEdlbmVzLmZvckVhY2goZnVuY3Rpb24oZ2VuZSl7XG4gICAgICAgICAgICAvLyBleHRyYWN0IDYgbGVhc3Qgc2lnIGJpdHMgZnJvbSB0ZXJtaW5hdG9yIGFzIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAgICAgdmFyIGFjdGlvbkNvZGUgPSBnZW5lW2dlbmUubGVuZ3RoLTFdICYgMHgzRjtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLm1hcHBpbmcuZ2V0QWN0aW9uKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyB0YWtlIGluZm9ybWF0aW9uIGZyb20gb3BlcmF0b3JzIHRvIGNyZWF0ZSAzMi1iaXQgc3RhdGUgbWFza1xuICAgICAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICAgICAgdmFyIGVxTWFzayA9IDA7IFxuICAgICAgICAgICAgZm9yKHZhciBpPTE7IGk8Z2VuZS5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gNSBsZWFzdCBzaWcgYml0cyBkZXRlcm1pbmUgdGhlIG1hc2sgaW5kZXggKDAtMzEpXG4gICAgICAgICAgICAgICAgdmFyIG1hc2tCaXQgPSBnZW5lW2ldICYgMHgxRjtcblxuICAgICAgICAgICAgICAgIC8vIDZ0aCBiaXQgZGV0ZXJtaW5lcyBpZiB3ZSBtYXRjaCAxIG9yIDBcbiAgICAgICAgICAgICAgICB2YXIgYml0U3RhdGUgPSAoZ2VuZVtpXSAmIDB4MjApID4+IDU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gVXNlIHVuc2lnbmVkIHNoaWZ0IGxvZ2ljIGZvciAzMi1iaXQgY29uc2lzdGVuY3lcbiAgICAgICAgICAgICAgICBjb25zdCBiaXRWYWx1ZSA9ICgxIDw8IG1hc2tCaXQpID4+PiAwO1xuICAgICAgICAgICAgICAgIGlmIChiaXRTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBtYXNrID0gKG1hc2sgfCBiaXRWYWx1ZSkgPj4+IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVxTWFzayA9IChlcU1hc2sgfCBiaXRWYWx1ZSkgPj4+IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydWxlcy5wdXNoKG5ldyBSdWxlKGVxTWFzaywgbWFzaywgYWN0aW9uKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJpdFNldChieXRlLCBpKXtcbiAgICByZXR1cm4gKGJ5dGUgPj4gaSkgJiAxO1xufVxuXG5leHBvcnQge0J5dGVBcnJheSwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtDZWxsfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5pbXBvcnQge05FSUdIQk9VUkhPT0R9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgUGxhbnR7XG4gICAgY29uc3RydWN0b3IoeCwgd29ybGQsIGdlbm9tZSwgYmlydGhTdGVwLCB1c2VJbnRlcm5hbFN0YXRlPWZhbHNlKSB7XG4gICAgICAgIHRoaXMud29ybGQgPSB3b3JsZDtcbiAgICAgICAgdGhpcy5lbmVyZ2lzZWRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuY2VsbHMgPSBbbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCAwKV07XG4gICAgICAgIHRoaXMuZ2Vub21lID0gZ2Vub21lO1xuICAgICAgICB0aGlzLnVzZUludGVybmFsU3RhdGUgPSB1c2VJbnRlcm5hbFN0YXRlO1xuICAgICAgICB0aGlzLnJ1bGVzID0gbnVsbDsgLy8gY2FjaGVkIHJ1bGVzXG4gICAgICAgIHRoaXMubGVhbm92ZXJFbmVyZ2lzZWQgPSAwOyAvLyBJbmNyZW1lbnRhbCB0cmFja2luZ1xuICAgICAgICB0aGlzLmJpcnRoU3RlcCA9IGJpcnRoU3RlcDtcbiAgICAgICAgdGhpcy5udXRyaWVudENvdW50ID0gMTAuMDsgLy8gU3RhcnQgd2l0aCBzb21lIG51dHJpZW50c1xuICAgICAgICB0aGlzLnRyYWl0cyA9IHtcbiAgICAgICAgICAgIGxlYW5vdmVyOiAxLjAsXG4gICAgICAgICAgICBkZWF0aDogMS4wLFxuICAgICAgICAgICAgYXR0YWNrOiAxLjAsXG4gICAgICAgICAgICBlZmZpY2llbmN5OiAxLjBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBnZXROZWlnaGJvdXJob29kKGNlbGwpe1xuICAgICAgICAvLyBSZXR1cm4gdGhlIG5laWdoYm91cmhvb2QgbWFza1xuICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPE5FSUdIQk9VUkhPT0QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIHBvcyA9IE5FSUdIQk9VUkhPT0RbaV07XG4gICAgICAgICAgICB2YXIgeCA9IGNlbGwueCArIHBvc1swXTtcbiAgICAgICAgICAgIHZhciB5ID0gY2VsbC55ICsgcG9zWzFdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBCb3VuZHMgY2hlY2sgaW5zdGVhZCBvZiB0cnktY2F0Y2hcbiAgICAgICAgICAgIGlmICh4ID49IDAgJiYgeCA8IHRoaXMud29ybGQud2lkdGggJiYgeSA+PSAwICYmIHkgPCB0aGlzLndvcmxkLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICAgICAgaWYgKHdvcmxkUG9zIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICAgICAgICAgIG1hc2sgPSBtYXNrIHwgKDEgPDwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXNrO1xuICAgIH1cblxuICAgIGdldFN0YXRlKGNlbGwpe1xuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSB0aGlzLmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIFxuICAgICAgICAvLyBCYXNpYyAxNi1iaXQgc3RhdGVcbiAgICAgICAgbGV0IHN0YXRlID0gbmVpZ2hib3Job29kIHwgKGNlbGwuaW50ZXJuYWxTdGF0ZSA8PCA4KSB8ICgoY2VsbC5lbmVyZ2lzZWQgPyAxIDogMCkgPDwgMTUpO1xuICAgICAgICBcbiAgICAgICAgLy8gTmljaGUgZW5oYW5jZW1lbnRzICgzMi1iaXQpXG4gICAgICAgIC8vIEJpdHMgMC03OiBOZWlnaGJvciBwcmVzZW5jZSAoaW4gbmVpZ2hib3Job29kKVxuICAgICAgICAvLyBCaXRzIDgtMTU6IE5laWdoYm9yIFB1YmxpYyBCaXRzIChCaXQgOCBvZiBuZWlnaGJvciBpbnRlcm5hbFN0YXRlKVxuICAgICAgICAvLyBCaXRzIDE2LTIzOiBOZWlnaGJvciBFbmVyZ3kgU3RhdHVzXG4gICAgICAgIC8vIEJpdHMgMjQtMzA6IFNlbGYgSW50ZXJuYWwgU3RhdGVcbiAgICAgICAgLy8gQml0IDMxOiBTZWxmIEVuZXJnaXNlZFxuICAgICAgICBcbiAgICAgICAgbGV0IG5laWdoYm9yU2lnbmFscyA9IDA7XG4gICAgICAgIGxldCBuZWlnaGJvckVuZXJneSA9IDA7XG4gICAgICAgIFxuICAgICAgICBmb3IodmFyIGk9MDsgaTxORUlHSEJPVVJIT09ELmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBwb3MgPSBORUlHSEJPVVJIT09EW2ldO1xuICAgICAgICAgICAgdmFyIHggPSBjZWxsLnggKyBwb3NbMF07XG4gICAgICAgICAgICB2YXIgeSA9IGNlbGwueSArIHBvc1sxXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHggPj0gMCAmJiB4IDwgdGhpcy53b3JsZC53aWR0aCAmJiB5ID49IDAgJiYgeSA8IHRoaXMud29ybGQuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHdvcmxkUG9zID0gdGhpcy53b3JsZC5jZWxsc1t4XVt5XTtcbiAgICAgICAgICAgICAgICBpZiAod29ybGRQb3MgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgQml0IDAgb2YgbmVpZ2hib3IncyBpbnRlcm5hbCBzdGF0ZSAoYXMgdGhlaXIgUHVibGljIEJpdClcbiAgICAgICAgICAgICAgICAgICAgaWYgKCh3b3JsZFBvcy5pbnRlcm5hbFN0YXRlICYgMSkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yU2lnbmFscyB8PSAoMSA8PCBpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAod29ybGRQb3MuZW5lcmdpc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvckVuZXJneSB8PSAoMSA8PCBpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbnN0cnVjdCAzMi1iaXQgc3RhdGVcbiAgICAgICAgLy8gV2UgdXNlIHVuc2lnbmVkIHJpZ2h0IHNoaWZ0IGZvciAzMi1iaXQgY29uc2lzdGVuY3lcbiAgICAgICAgc3RhdGUgPSAobmVpZ2hib3Job29kICYgMHhGRikgfCBcbiAgICAgICAgICAgICAgICAoKG5laWdoYm9yU2lnbmFscyAmIDB4RkYpIDw8IDgpIHwgXG4gICAgICAgICAgICAgICAgKChuZWlnaGJvckVuZXJneSAmIDB4RkYpIDw8IDE2KSB8IFxuICAgICAgICAgICAgICAgICgoY2VsbC5pbnRlcm5hbFN0YXRlICYgMHg3RikgPDwgMjQpIHwgXG4gICAgICAgICAgICAgICAgKChjZWxsLmVuZXJnaXNlZCA/IDEgOiAwKSA8PCAzMSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBzdGF0ZSA+Pj4gMDsgXG4gICAgfVxuXG4gICAgbWV0YWJvbGlzbShwYXJhbXMpIHtcbiAgICAgICAgaWYgKHBhcmFtcy5zaW1fbW9kZSAhPT0gXCJuaWNoZVwiKSByZXR1cm47XG5cbiAgICAgICAgLy8gMS4gRXh0cmFjdGlvbiBmcm9tIHJvb3RzICh5PTApXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMuY2VsbHNbaV07XG4gICAgICAgICAgICBpZiAoY2VsbC55ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gdGhpcy53b3JsZC5zb2lsTnV0cmllbnRzW2NlbGwueF07XG4gICAgICAgICAgICAgICAgY29uc3QgYW1vdW50ID0gTWF0aC5taW4oYXZhaWxhYmxlLCBwYXJhbXMubnV0cmllbnRfZXh0cmFjdF9yYXRlKTtcbiAgICAgICAgICAgICAgICB0aGlzLm51dHJpZW50Q291bnQgKz0gYW1vdW50O1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGQuc29pbE51dHJpZW50c1tjZWxsLnhdIC09IGFtb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIE1haW50ZW5hbmNlIGNvc3RcbiAgICAgICAgLy8gVHJhaXRzIGNhbiByZWR1Y2UgbWFpbnRlbmFuY2UgY29zdFxuICAgICAgICBjb25zdCBjb3N0ID0gdGhpcy5jZWxscy5sZW5ndGggKiBwYXJhbXMubnV0cmllbnRfbWFpbnRlbmFuY2VfY29zdCAqIHRoaXMudHJhaXRzLmVmZmljaWVuY3k7XG4gICAgICAgIHRoaXMubnV0cmllbnRDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMubnV0cmllbnRDb3VudCAtIGNvc3QpO1xuICAgIH1cblxuICAgIGdyb3coKXtcbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBncm93XG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKDAuOCkpe1xuICAgICAgICAgICAgICAgIHZhciBzcGFjZXMgPSB0aGlzLmdldEdyb3dEaXJlY3Rpb24oY2VsbCk7XG4gICAgICAgICAgICAgICAgaWYoc3BhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gc3BhY2VzW3JhbmRvbUludCgwLCBzcGFjZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR3JvdyB0aGUgcGxhbnQgYnkgb25lIGNlbGwgaWYgcG9zc2libGVcbiAgICAgKiBAcGFyYW0geyp9IGNlbGwgdGhlIGNlbGwgdG8gZ3JvdyBmcm9tXG4gICAgICogQHBhcmFtIHsqfSBkaXJlY3Rpb24gdGhlIGRpcmVjdGlvbiB0byBncm93IGluXG4gICAgICovXG4gICAgZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbiwgc3RlcG51bSl7XG4gICAgICAgIHZhciB4ID0gY2VsbC54K2RpcmVjdGlvblswXSwgeSA9IGNlbGwueStkaXJlY3Rpb25bMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIHNwYWNlIGlzIGNsZWFyXG4gICAgICAgIHZhciBzcGFjZSA9IHRoaXMud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICAgICAgaWYgKHNwYWNlID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGFjZSBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgaWYgKHNwYWNlLnBsYW50ID09PSB0aGlzKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEF0dGFjayBvY2N1cnNcbiAgICAgICAgICAgIGlmICh0aGlzLndvcmxkLm9uQXR0YWNrKSB0aGlzLndvcmxkLm9uQXR0YWNrKCk7XG5cbiAgICAgICAgICAgIC8vIHRoaXMgcGxhbnQgd2lsbCBraWxsIHRoZSBvdGhlclxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb2JhYmlsaXR5Li4uXG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKHNwYWNlLnBsYW50LmdldEtpbGxQcm9iYWJpbGl0eSgpKSl7XG4gICAgICAgICAgICAgICAgLy8gYXR0YWNrIHN1Y2NlZWRlZC4gS2lsbCBjb21wZXRpdG9yIGFuZCBjb250aW51ZSB3aXRoIGdyb3d0aFxuICAgICAgICAgICAgICAgIHRoaXMud29ybGQua2lsbFBsYW50KHNwYWNlLnBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBmYWlsZWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICAvLyBncm93IGNlbGwgaW4gdG8gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIG5ld19jZWxsID0gbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCB5KTtcbiAgICAgICAgdGhpcy5jZWxscy5wdXNoKG5ld19jZWxsKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFVwZGF0ZSBpbmNyZW1lbnRhbCB0cmFja2luZ1xuICAgICAgICBjb25zdCByb290Q2VsbCA9IHRoaXMuY2VsbHNbMF07XG4gICAgICAgIGNvbnN0IGxlID0gdGhpcy53b3JsZC53aWR0aC8yIC0gKCAoKCAxLjUqdGhpcy53b3JsZC53aWR0aCApICsgbmV3X2NlbGwueCAtIHJvb3RDZWxsLngpICAlIHRoaXMud29ybGQud2lkdGgpO1xuICAgICAgICB0aGlzLmxlYW5vdmVyRW5lcmdpc2VkICs9IGxlO1xuXG4gICAgICAgIHRoaXMud29ybGQuYWRkQ2VsbChuZXdfY2VsbCk7XG4gICAgfVxuXG4gICAgbWV0YWJvbGlzbShwYXJhbXMpIHtcbiAgICAgICAgaWYgKHBhcmFtcy5zaW1fbW9kZSAhPT0gXCJuaWNoZVwiKSByZXR1cm47XG5cbiAgICAgICAgLy8gMS4gRXh0cmFjdGlvbiBmcm9tIHJvb3RzICh5PTApXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMuY2VsbHNbaV07XG4gICAgICAgICAgICBpZiAoY2VsbC55ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gdGhpcy53b3JsZC5zb2lsTnV0cmllbnRzW2NlbGwueF07XG4gICAgICAgICAgICAgICAgY29uc3QgYW1vdW50ID0gTWF0aC5taW4oYXZhaWxhYmxlLCBwYXJhbXMubnV0cmllbnRfZXh0cmFjdF9yYXRlKTtcbiAgICAgICAgICAgICAgICB0aGlzLm51dHJpZW50Q291bnQgKz0gYW1vdW50O1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGQuc29pbE51dHJpZW50c1tjZWxsLnhdIC09IGFtb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIE1haW50ZW5hbmNlIGNvc3RcbiAgICAgICAgLy8gVHJhaXRzIGNhbiByZWR1Y2UgbWFpbnRlbmFuY2UgY29zdFxuICAgICAgICBjb25zdCBjb3N0ID0gdGhpcy5jZWxscy5sZW5ndGggKiBwYXJhbXMubnV0cmllbnRfbWFpbnRlbmFuY2VfY29zdCAqIHRoaXMudHJhaXRzLmVmZmljaWVuY3k7XG4gICAgICAgIHRoaXMubnV0cmllbnRDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMubnV0cmllbnRDb3VudCAtIGNvc3QpO1xuICAgIH1cblxuICAgIGdldEtpbGxQcm9iYWJpbGl0eSgpe1xuICAgICAgICBjb25zdCBiYXNlUHJvYiA9IHRoaXMuZW5lcmdpc2VkQ291bnQgPiAwID8gMS90aGlzLmVuZXJnaXNlZENvdW50IDogMS4wO1xuICAgICAgICByZXR1cm4gYmFzZVByb2IgKiB0aGlzLnRyYWl0cy5hdHRhY2s7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsY3VsYXRlIHdoZXRoZXIgdGhpcyBwbGFudCBzaG91bGQgZGllLlxuICAgICAqIEBwYXJhbSB7fSBuYXR1cmFsX2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBlbmVyZ3lfZXhwIGV4cG9uZW50IHRvIHRoZSBudW1iZXIgb2YgZW5lcmd5IHJpY2ggY2VsbHNcbiAgICAgKiBAcGFyYW0geyp9IGxlYW5vdmVyX2ZhY3RvciBmYWN0b3IgdG8gdGhlIGxlYW5vdmVyIHRlcm1cbiAgICAgKi9cbiAgICBnZXREZWF0aFByb2JhYmlsaXR5KGRlYXRoX2ZhY3RvciwgbmF0dXJhbF9leHAsIGVuZXJneV9leHAsIGxlYW5vdmVyX2ZhY3Rvciwgc2ltX21vZGU9XCJjbGFzc2ljXCIpe1xuICAgICAgICB2YXIgbnVtQ2VsbHMgPSB0aGlzLmNlbGxzLmxlbmd0aDtcbiAgICAgICAgXG4gICAgICAgIHZhciBsZWFub3ZlckNlbGxzID0gMi8obnVtQ2VsbHMqKG51bUNlbGxzLTEpKTtcbiAgICAgICAgaWYgKGxlYW5vdmVyQ2VsbHMgPT09IEluZmluaXR5KXtcbiAgICAgICAgICAgIGxlYW5vdmVyQ2VsbHMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlYW5vdmVyVGVybSA9IGxlYW5vdmVyQ2VsbHMqTWF0aC5hYnModGhpcy5sZWFub3ZlckVuZXJnaXNlZCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZF9uYXR1cmFsID0gTWF0aC5wb3cobnVtQ2VsbHMsIG5hdHVyYWxfZXhwKTtcbiAgICAgICAgdmFyIGRfZW5lcmd5ID0gTWF0aC5wb3codGhpcy5lbmVyZ2lzZWRDb3VudCsxLCBlbmVyZ3lfZXhwKTtcbiAgICAgICAgdmFyIGRfbGVhbm92ZXIgPSAobGVhbm92ZXJfZmFjdG9yICogdGhpcy50cmFpdHMubGVhbm92ZXIpICogbGVhbm92ZXJUZXJtO1xuICAgICAgICBcbiAgICAgICAgLy8gQmFzZSBwcm9iYWJpbGl0eSBtb2RpZmllZCBieSBkZWF0aCB0cmFpdFxuICAgICAgICB2YXIgcERlYXRoID0gKGRlYXRoX2ZhY3RvciAqIHRoaXMudHJhaXRzLmRlYXRoKSAqIGRfbmF0dXJhbCAqIGRfZW5lcmd5ICsgZF9sZWFub3ZlcjtcbiAgICAgICAgXG4gICAgICAgIC8vIE5pY2hlIG1vZGUgc3BlY2lmaWMgcGVuYWx0aWVzXG4gICAgICAgIGlmIChzaW1fbW9kZSA9PT0gXCJuaWNoZVwiKSB7XG4gICAgICAgICAgICAvLyBTdGFydmF0aW9uIHBlbmFsdHlcbiAgICAgICAgICAgIGlmICh0aGlzLm51dHJpZW50Q291bnQgPD0gMCAmJiBudW1DZWxscyA+IDEpIHtcbiAgICAgICAgICAgICAgICBwRGVhdGggKz0gMC4wNTsgLy8gNSUgZmxhdCBpbmNyZWFzZSBpZiBzdGFydmluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwicHJvYlwiOiBwRGVhdGgsXG4gICAgICAgICAgICBcIm5hdHVyYWxcIjogZF9uYXR1cmFsLFxuICAgICAgICAgICAgXCJlbmVyZ3lcIjogZF9lbmVyZ3ksXG4gICAgICAgICAgICBcImxlYW5vdmVyXCI6IGRfbGVhbm92ZXIsXG4gICAgICAgICAgICBcIm51dHJpZW50c1wiOiB0aGlzLm51dHJpZW50Q291bnRcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCB7IFBsYW50IH07IiwiaW1wb3J0IHNlZWRyYW5kb20gZnJvbSBcInNlZWRyYW5kb21cIjtcblxuLyoqXG4gKiBTZWVkIGFsbCBmdXR1cmUgY2FsbHMgdG8gTWF0aC5yYW5kb21cbiAqIEBwYXJhbSB7Kn0gc2VlZCBkYXRhIHRvIHVzZSB0byBzZWVkIGFsbCBmdXR1cmUgUk5HIGNhbGxzXG4gKi9cbmZ1bmN0aW9uIHNlZWRSYW5kb20oc2VlZCl7XG4gICAgc2VlZHJhbmRvbShzZWVkLCB7Z2xvYmFsOiB0cnVlfSk7XG59XG5cbi8qKlxuICogcmV0dXJucyBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgbWF4IChpbmNsdXNpdmUpXG4gKiBAcGFyYW0geyp9IG1heCBtYXhpbXVtIGludGVnZXIgdG8gZ2VuZXJhdGUgYXMgYSByYW5kb20gbnVtYmVyXG4gKi9cbmZ1bmN0aW9uIHJhbmRvbUludChtaW4sIG1heCl7XG4gICAgLy8gbm90ZTogTWF0aC5yYW5kb20gcmV0dXJucyBhIHJhbmRvbSBudW1iZXIgZXhjbHVzaXZlIG9mIDEsXG4gICAgLy8gc28gdGhlcmUgaXMgKzEgaW4gdGhlIGJlbG93IGVxdWF0aW9uIHRvIGVuc3VyZSB0aGUgbWF4aW11bVxuICAgIC8vIG51bWJlciBpcyBjb25zaWRlcmVkIHdoZW4gZmxvb3JpbmcgMC45Li4uIHJlc3VsdHMuXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG59XG5cbi8qKlxuICogRXZhbHVhdGVzIHRoZSBjaGFuY2Ugb2YgYW4gZXZlbnQgaGFwcGVuaW5nIGdpdmVuIHByb2JcbiAqIEBwYXJhbSB7Kn0gcHJvYiBmcmFjdGlvbiBiZXR3ZWVuIDAgYW5kIDEgY2hhbmNlIG9mIHRoZSBldmVudCBoYXBwZW5pbmdcbiAqIEByZXR1cm5zIHRydWUgaWYgdGhlIGV2ZW50IGhhcHBlbnMsIGZhbHNlIGlmIG5vdFxuICovXG5mdW5jdGlvbiByYW5kb21Qcm9iKHByb2Ipe1xuICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDw9IHByb2I7XG59XG5cbmV4cG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tSW50LCByYW5kb21Qcm9ifTsiLCJpbXBvcnQgKiBhcyBzdGF0cyBmcm9tIFwic3RhdHMtbGl0ZVwiO1xuXG5mdW5jdGlvbiBsZXZlbnNodGVpbihhLCBiKSB7XG4gICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gYi5sZW5ndGg7XG4gICAgaWYgKGIubGVuZ3RoID09PSAwKSByZXR1cm4gYS5sZW5ndGg7XG4gICAgbGV0IG1hdHJpeCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGIubGVuZ3RoOyBpKyspIG1hdHJpeFtpXSA9IFtpXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBhLmxlbmd0aDsgaisrKSBtYXRyaXhbMF1bal0gPSBqO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IGIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPD0gYS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGJbaSAtIDFdID09PSBhW2ogLSAxXSkge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqXSA9IG1hdHJpeFtpIC0gMV1baiAtIDFdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICAgICAgbWF0cml4W2kgLSAxXVtqIC0gMV0gKyAxLCAvLyBzdWJzdGl0dXRpb25cbiAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaV1baiAtIDFdICsgMSwgLy8gaW5zZXJ0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaSAtIDFdW2pdICsgMSAgLy8gZGVsZXRpb25cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hdHJpeFtiLmxlbmd0aF1bYS5sZW5ndGhdO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVBbGxlbGVFbnRyb3B5KHBsYW50cykge1xuICAgIGlmIChwbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICBjb25zdCBjb3VudHMgPSBuZXcgQXJyYXkoMjU2KS5maWxsKDApO1xuICAgIGxldCB0b3RhbCA9IDA7XG4gICAgcGxhbnRzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcC5nZW5vbWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvdW50c1twLmdlbm9tZVtpXV0rKztcbiAgICAgICAgICAgIHRvdGFsKys7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodG90YWwgPT09IDApIHJldHVybiAwO1xuICAgIGxldCBlbnRyb3B5ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgICAgIGlmIChjb3VudHNbaV0gPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBwID0gY291bnRzW2ldIC8gdG90YWw7XG4gICAgICAgICAgICBlbnRyb3B5IC09IHAgKiBNYXRoLmxvZzIocCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVudHJvcHk7XG59XG5cbmNsYXNzIFNpbURhdGF7XG5cbiAgICBjb25zdHJ1Y3RvcihzaW11bGF0aW9uKXtcbiAgICAgICAgdGhpcy5zaW0gPSBzaW11bGF0aW9uO1xuICAgICAgICB0aGlzLmRhdGEgPSB7XCJzdGVwbnVtXCI6IFtdfTtcbiAgICAgICAgdGhpcy5sYXN0U3RlcCA9IDA7XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycyA9IFtcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwb3B1bGF0aW9uXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidW5pcXVlX2dlbm90eXBlc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgc2ltLndvcmxkLnBsYW50cy5mb3JFYWNoKHAgPT4gc2Vlbi5hZGQocC5nZW5vbWUuc2VyaWFsaXplKCkpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2Vlbi5zaXplO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidG90YWxfY2VsbHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLmNlbGxDb3VudDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19zaXplXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLmNlbGxDb3VudCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX2VuZXJnaXNlZFwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLmVuZXJnaXNlZENvdW50LCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19hY3RpdmVfZ2VuZXNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgKHAucnVsZXMgPyBwLnJ1bGVzLmxlbmd0aCA6IDApLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19hZ2VcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgKHNpbS5zdGVwbnVtIC0gcC5iaXJ0aFN0ZXApLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInRvdGFsX3NlZWRzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7IHJldHVybiBzaW0uc3RhdHMudG90YWxTZWVkczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZmx5aW5nX3NlZWRzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7IHJldHVybiBzaW0uc3RhdHMuZmx5aW5nU2VlZHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcIm5ld19wbGFudHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXsgcmV0dXJuIHNpbS5zdGF0cy5uZXdQbGFudHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImRlYXRoc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0peyByZXR1cm4gc2ltLnN0YXRzLmRlYXRoczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXR0YWNrc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0peyByZXR1cm4gc2ltLnN0YXRzLmF0dGFja3M7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19kZWF0aF9wcm9iXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1bSArIHAuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMubGVhbm92ZXJfZmFjdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5zaW1fbW9kZVxuICAgICAgICAgICAgICAgICAgICApLnByb2I7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfbnV0cmllbnRzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIHAubnV0cmllbnRDb3VudCwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJzb2lsX251dHJpZW50c1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmICghc2ltLndvcmxkLnNvaWxOdXRyaWVudHMgfHwgc2ltLndvcmxkLnNvaWxOdXRyaWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5zb2lsTnV0cmllbnRzLnJlZHVjZSgoc3VtLCBuKSA9PiBzdW0gKyBuLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQuc29pbE51dHJpZW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfdHJhaXRzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4geyBsZWFuOiAxLCBhdHRhY2s6IDEsIGVmZjogMSwgZGVhdGg6IDEgfTtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbHMgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoYWNjLCBwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFjYy5sZWFuICs9IHAudHJhaXRzLmxlYW5vdmVyO1xuICAgICAgICAgICAgICAgICAgICBhY2MuYXR0YWNrICs9IHAudHJhaXRzLmF0dGFjaztcbiAgICAgICAgICAgICAgICAgICAgYWNjLmVmZiArPSBwLnRyYWl0cy5lZmZpY2llbmN5O1xuICAgICAgICAgICAgICAgICAgICBhY2MuZGVhdGggKz0gcC50cmFpdHMuZGVhdGg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfSwgeyBsZWFuOiAwLCBhdHRhY2s6IDAsIGVmZjogMCwgZGVhdGg6IDAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGxlYW46IHRvdGFscy5sZWFuIC8gbixcbiAgICAgICAgICAgICAgICAgICAgYXR0YWNrOiB0b3RhbHMuYXR0YWNrIC8gbixcbiAgICAgICAgICAgICAgICAgICAgZWZmOiB0b3RhbHMuZWZmIC8gbixcbiAgICAgICAgICAgICAgICAgICAgZGVhdGg6IHRvdGFscy5kZWF0aCAvIG5cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicGxhbnRfc2l6ZV9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5jZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2Vub21lX3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLmxlbmd0aCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJtdXRfZXhwX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5tdXRfZXhwKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X2hlaWdodF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWF4SCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcC5jZWxscy5sZW5ndGg7IGkrKykgaWYgKHAuY2VsbHNbaV0ueSA+IG1heEgpIG1heEggPSBwLmNlbGxzW2ldLnk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXhIO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2VuZXRpY19kaXN0YW5jZV9tZWFuXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYW50cyA9IHNpbS53b3JsZC5wbGFudHM7XG4gICAgICAgICAgICAgICAgaWYgKHBsYW50cy5sZW5ndGggPCAyKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBsZXQgc3VtRGlzdCA9IDA7XG4gICAgICAgICAgICAgICAgbGV0IHNhbXBsZVNpemUgPSBNYXRoLm1pbigzMCwgcGxhbnRzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhaXJzID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNhbXBsZVNpemU7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwMSA9IHBsYW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwbGFudHMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAyID0gcGxhbnRzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBsYW50cy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHAxICE9PSBwMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VtRGlzdCArPSBsZXZlbnNodGVpbihwMS5nZW5vbWUsIHAyLmdlbm9tZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWlycysrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwYWlycyA+IDAgPyBzdW1EaXN0IC8gcGFpcnMgOiAwO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYWxsZWxlX2VudHJvcHlcIiwgQXNJcywgZnVuY3Rpb24oc2ltKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGN1bGF0ZUFsbGVsZUVudHJvcHkoc2ltLndvcmxkLnBsYW50cyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbGxlY3QgZGF0YSBmb3IgdGhlIGN1cnJlbnQgc3RlcFxuICAgICAqL1xuICAgIHJlY29yZFN0ZXAoKXtcbiAgICAgICAgY29uc3QgZGVsdGEgPSB0aGlzLnNpbS5zdGVwbnVtIC0gdGhpcy5sYXN0U3RlcDtcbiAgICAgICAgdGhpcy5sYXN0U3RlcCA9IHRoaXMuc2ltLnN0ZXBudW07XG5cbiAgICAgICAgdmFyIHN0ZXBEYXRhID0ge307XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uKGMpe1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGMuY29sbGVjdCh0aGlzLnNpbSk7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHN0ZXBEYXRhLCB2YWx1ZXMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAvLyBOb3JtYWxpemUgcmF0ZS1iYXNlZCBtZXRyaWNzIGJ5IHRoZSBudW1iZXIgb2Ygc3RlcHMgc2luY2UgdGhlIGxhc3QgcmVjb3JkXG4gICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHJhdGVLZXlzID0gW1wibmV3X3BsYW50c1wiLCBcImRlYXRoc1wiLCBcImF0dGFja3NcIiwgXCJ0b3RhbF9zZWVkc1wiLCBcImZseWluZ19zZWVkc1wiXTtcbiAgICAgICAgICAgIHJhdGVLZXlzLmZvckVhY2goayA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN0ZXBEYXRhW2tdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RlcERhdGFba10gLz0gZGVsdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCBpbmNyZW1lbnRhbCBzdGF0cyBmb3IgdGhlIG5leHQgaW50ZXJ2YWxcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMubmV3UGxhbnRzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMuZGVhdGhzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMuYXR0YWNrcyA9IDA7XG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLnRvdGFsU2VlZHMgPSAwO1xuICAgICAgICB0aGlzLnNpbS5zdGF0cy5mbHlpbmdTZWVkcyA9IDA7XG5cbiAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5wdXNoKHRoaXMuc2ltLnN0ZXBudW0pO1xuICAgICAgICBpZiAodGhpcy5kYXRhW1wic3RlcG51bVwiXS5sZW5ndGggPiBTaW1EYXRhLk1BWF9EQVRBX1BPSU5UUykge1xuICAgICAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5rZXlzKHN0ZXBEYXRhKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAgICAgaWYgKCEoayBpbiB0aGlzLmRhdGEpKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF0YVtrXS5wdXNoKHN0ZXBEYXRhW2tdKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGFba10ubGVuZ3RoID4gU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10uc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMgPSAyMDAwO1xuXG5jbGFzcyBDb2xsZWN0b3J7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZWNscywgY29sbGVjdEZ1bmMpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnR5cGUgPSBuZXcgdHlwZWNscyhuYW1lKTtcbiAgICAgICAgdGhpcy5mdW5jID0gY29sbGVjdEZ1bmM7XG4gICAgfVxuXG4gICAgY29sbGVjdChzaW0pe1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZnVuYyhzaW0pO1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnRyYW5zZm9ybShkYXRhKTtcbiAgICB9XG59XG5cbmNsYXNzIENvbGxlY3RvclR5cGV7XG4gICAgY29uc3RydWN0b3IobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZCBtZXRob2RcIik7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtKGRhdGEpe1xuICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy50cmFuc2Zvcm1EYXRhKGRhdGEpO1xuICAgICAgICB2YXIgdHJhbnNmb3JtZWRfZGF0YSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgICAgICB0cmFuc2Zvcm1lZF9kYXRhW3RoaXMubmFtZSArIGtdID0gdmFsdWVzW2tdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkX2RhdGE7XG4gICAgfVxufVxuXG5jbGFzcyBBc0lzIGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICByZXR1cm4ge1wiXCI6IGRhdGF9O1xuICAgIH1cbn1cblxuY2xhc3MgU3VtbWFyeSBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIm1pblwiOiBNYXRoLm1pbihkYXRhKSwgXCJtZWFuXCI6IHN0YXRzLm1lYW4oZGF0YSksIFwibWF4XCI6IE1hdGgubWF4KGRhdGEpfTtcbiAgICB9XG59XG5leHBvcnQge1NpbURhdGF9OyIsImltcG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1dvcmxkfSBmcm9tIFwiLi93b3JsZC5qc1wiO1xuaW1wb3J0IHtCeXRlQXJyYXksIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9IGZyb20gXCIuL2dlbm9tZS5qc1wiO1xuXG5jbGFzcyBTaW11bGF0aW9uUGFyYW1ze1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcz17fSl7XG4gICAgICAgIHRoaXMucmFuZG9tX3NlZWQgPSAxO1xuICAgICAgICB0aGlzLnJlY29yZF9pbnRlcnZhbCA9IDEwO1xuICAgICAgICB0aGlzLnN0ZXBzX3Blcl9mcmFtZSA9IDE7XG4gICAgICAgIHRoaXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWwgPSAwO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX3N0cmVuZ3RoID0gMC4xO1xuXG4gICAgICAgIHRoaXMud29ybGRfd2lkdGggPSAyNTA7XG4gICAgICAgIHRoaXMud29ybGRfaGVpZ2h0ID0gNDA7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9wb3B1bGF0aW9uID0gMjUwO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmVyZ3lfcHJvYiA9IDAuNTtcblxuICAgICAgICAvLyBkZWF0aCBwYXJhbXNcbiAgICAgICAgdGhpcy5kZWF0aF9mYWN0b3IgPSAwLjI7XG4gICAgICAgIHRoaXMubmF0dXJhbF9leHAgPSAwO1xuICAgICAgICB0aGlzLmVuZXJneV9leHAgPSAtMi41O1xuICAgICAgICB0aGlzLmxlYW5vdmVyX2ZhY3RvciA9IDAuMjtcblxuICAgICAgICAvLyBtdXRhdGlvbnNcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZV9tb2RlID0gXCJieXRld2lzZVwiO1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlID0gMC4wMDI7XG4gICAgICAgIHRoaXMubXV0X2luc2VydCA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZGVsZXRlID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9mYWN0b3IgPSAxLjU7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9tdXRfZXhwID0gMDtcblxuICAgICAgICB0aGlzLmdlbm9tZV9pbnRlcnByZXRlciA9IFwicHJvbW90b3JcIjtcbiAgICAgICAgdGhpcy5pbml0aWFsX2dlbm9tZV9sZW5ndGggPSA0MDA7XG5cbiAgICAgICAgLy8gTW9kZSBzZWxlY3Rpb25cbiAgICAgICAgdGhpcy5zaW1fbW9kZSA9IFwibmljaGVcIjsgLy8gXCJjbGFzc2ljXCIgb3IgXCJuaWNoZVwiXG5cbiAgICAgICAgLy8gTmljaGUgbW9kZTogTnV0cmllbnRzXG4gICAgICAgIHRoaXMubnV0cmllbnRfbWF4ID0gMTAwLjA7XG4gICAgICAgIHRoaXMubnV0cmllbnRfcmVwbGVuaXNoX3JhdGUgPSAxLjA7XG4gICAgICAgIHRoaXMubnV0cmllbnRfZXh0cmFjdF9yYXRlID0gNS4wO1xuICAgICAgICB0aGlzLm51dHJpZW50X21haW50ZW5hbmNlX2Nvc3QgPSAwLjA1OyAvLyBwZXIgY2VsbCBwZXIgc3RlcFxuICAgICAgICB0aGlzLm51dHJpZW50X2RpdmlkZV9jb3N0ID0gMTAuMDtcblxuICAgICAgICAvLyBkaXZpZGUsIGZseWluZ3NlZWQsIGxvY2Fsc2VlZCwgbXV0KywgbXV0LSwgc3RhdGViaXRcbiAgICAgICAgdGhpcy5hY3Rpb25fbWFwID0gWzIwMCwgMjAsIDAsIDE4LCAxOCwgMF07XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBwYXJhbXMpO1xuICAgIH1cbn1cblxuY2xhc3MgU2ltdWxhdGlvbiB7XG4gICAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgICAgIC8vIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byByYW5kb21cbiAgICAgICAgLy8gdGhpcyBtYWtlcyBvdXQgdGVzdHMgcmVwcm9kdWNpYmxlIGdpdmVuIHRoZSBzYW1lIHNlZWQgaXMgdXNlZFxuICAgICAgICAvLyBpbiBmdXR1cmUgaW5wdXQgcGFyYW1ldGVyc1xuICAgICAgICBzZWVkUmFuZG9tKHRoaXMucGFyYW1zLnJhbmRvbV9zZWVkKTtcblxuICAgICAgICB0aGlzLndvcmxkID0gbmV3IFdvcmxkKHRoaXMucGFyYW1zLndvcmxkX3dpZHRoLCB0aGlzLnBhcmFtcy53b3JsZF9oZWlnaHQpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBudXRyaWVudHMgaW4gTmljaGUgbW9kZVxuICAgICAgICBpZiAodGhpcy5wYXJhbXMuc2ltX21vZGUgPT09IFwibmljaGVcIikge1xuICAgICAgICAgICAgdGhpcy53b3JsZC5pbml0TnV0cmllbnRzKHRoaXMucGFyYW1zLm51dHJpZW50X21heCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdlbm9tZUludGVycHJldGVyID0gdGhpcy5nZXRJbnRlcnByZXRlcigpO1xuICAgICAgICB0aGlzLm11dF91bml0cyA9IDE7XG4gICAgICAgIHRoaXMuc3RlcG51bSA9IDA7XG4gICAgICAgIHRoaXMuc3RhdHMgPSB7IFxuICAgICAgICAgICAgYXR0YWNrczogMCwgXG4gICAgICAgICAgICBkZWF0aHM6IDAsIFxuICAgICAgICAgICAgdG90YWxTZWVkczogMCwgXG4gICAgICAgICAgICBmbHlpbmdTZWVkczogMCwgXG4gICAgICAgICAgICBuZXdQbGFudHM6IDAgXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy53b3JsZC5vblBsYW50QmlydGggPSAoKSA9PiB7IHRoaXMuc3RhdHMubmV3UGxhbnRzKys7IH07XG4gICAgICAgIHRoaXMud29ybGQub25QbGFudERlYXRoID0gKCkgPT4geyB0aGlzLnN0YXRzLmRlYXRocysrOyB9O1xuICAgICAgICB0aGlzLndvcmxkLm9uQXR0YWNrID0gKCkgPT4geyB0aGlzLnN0YXRzLmF0dGFja3MrKzsgfTtcbiAgICB9XG5cbiAgICBnZXRJbnRlcnByZXRlcigpe1xuICAgICAgICBzd2l0Y2ggKHRoaXMucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcil7XG4gICAgICAgIGNhc2UgXCJwcm9tb3RvclwiOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9tb3RvckludGVycHJldGVyKHRoaXMucGFyYW1zLmFjdGlvbl9tYXApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGludGVycHJldGVyICR7dGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyfWApO1xuICAgICAgICB9ICBcbiAgICB9XG5cbiAgICBpbml0X3BvcHVsYXRpb24oKXtcbiAgICAgICAgLy8gcmFuZG9tbHkgY2hvb3NlIHNwb3RzIHRvIHNlZWQgdGhlIHdvcmxkIHdpdGhcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMubmV3U2VlZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgcG9wdWxhdGlvbiBmcm9tIGEgbGlzdCBvZiBzZXJpYWxpemVkIGdlbm9tZSBzdHJpbmdzLFxuICAgICAqIGRyYXdpbmcgd2l0aCByZXBsYWNlbWVudCB1cCB0byBpbml0aWFsX3BvcHVsYXRpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2VyaWFsaXplZEdlbm9tZXNcbiAgICAgKi9cbiAgICBpbml0X3BvcHVsYXRpb25fZnJvbV9nZW5vbWVzKHNlcmlhbGl6ZWRHZW5vbWVzKXtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IHNlcmlhbGl6ZWRHZW5vbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlcmlhbGl6ZWRHZW5vbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgY29uc3QgZ2Vub21lID0gQnl0ZUFycmF5LmRlc2VyaWFsaXplKHN0cik7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lLCBudWxsLCB0aGlzLnN0ZXBudW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3U2VlZCgpe1xuICAgICAgICAvLyBjcmVhdGUgYSByYW5kb20gZ2Vub21lXG4gICAgICAgIHZhciBnZW5vbWUgPSBCeXRlQXJyYXkucmFuZG9tKHRoaXMucGFyYW1zLmluaXRpYWxfZ2Vub21lX2xlbmd0aCk7XG4gICAgICAgIHRoaXMud29ybGQuc2VlZChnZW5vbWUsIG51bGwsIHRoaXMuc3RlcG51bSk7XG4gICAgfVxuXG4gICAgc3RlcCgpe1xuICAgICAgICB0aGlzLnN0ZXBudW0rKztcbiAgICAgICAgaWYgKHRoaXMucGFyYW1zLnNpbV9tb2RlID09PSBcIm5pY2hlXCIpIHtcbiAgICAgICAgICAgIHRoaXMud29ybGQucmVwbGVuaXNoTnV0cmllbnRzKHRoaXMucGFyYW1zLm51dHJpZW50X3JlcGxlbmlzaF9yYXRlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNpbXVsYXRlRGVhdGgoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUxpZ2h0KCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMubXV0YXRlKCk7XG4gICAgfVxuXG4gICAgc2ltdWxhdGVBY3Rpb25zKCl7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53b3JsZC5wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gdGhpcy53b3JsZC5wbGFudHNbaV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5pY2hlIG1ldGFib2xpc21cbiAgICAgICAgICAgIHBsYW50Lm1ldGFib2xpc20odGhpcy5wYXJhbXMpO1xuXG4gICAgICAgICAgICBpZiAoIXBsYW50LnJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgcGxhbnQucnVsZXMgPSB0aGlzLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUsIHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJ1bGVzID0gcGxhbnQucnVsZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBsYW50LmNlbGxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsQWN0aW9uKHBsYW50LmNlbGxzW2pdLCBydWxlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjZWxsQWN0aW9uKGNlbGwsIHJ1bGVzKXtcbiAgICAgICAgdmFyIHN0YXRlID0gY2VsbC5wbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSl7XG4gICAgICAgICAgICAvLyBleGVjdXRlIG9uZSBhY3Rpb24gdXNpbmcgdGhlIGZpcnN0IG1hdGNoaW5nIHJ1bGVcbiAgICAgICAgICAgIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgICAgICAvLyBUcmFjayBzZWVkc1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkZseWluZ1NlZWRcIikgc2VsZi5zdGF0cy5mbHlpbmdTZWVkcysrO1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkZseWluZ1NlZWRcIiB8fCBydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkxvY2FsU2VlZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3RhdHMudG90YWxTZWVkcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBydWxlLmFjdGlvbi5leGVjdXRlKGNlbGwsIHNlbGYuc3RlcG51bSwgc2VsZi5wYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgY2VsbC51cGRhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIG11dGF0ZSgpe1xuICAgICAgICB2YXIgbXV0YXRvciA9IG5ldyBNdXRhdG9yKHRoaXMucGFyYW1zLm11dF9mYWN0b3IsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlLCBcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLm11dF9pbnNlcnQsIHRoaXMucGFyYW1zLm11dF9kZWxldGUsIFxuICAgICAgICAgICAgMCwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2VfbW9kZSwgdGhpcy5tdXRfdW5pdHMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud29ybGQucGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHRoaXMud29ybGQucGxhbnRzW2ldO1xuICAgICAgICAgICAgaWYgKG11dGF0b3IubXV0YXRlKHBsYW50Lmdlbm9tZSkpIHtcbiAgICAgICAgICAgICAgICBwbGFudC5ydWxlcyA9IG51bGw7IC8vIEludmFsaWRhdGUgY2FjaGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSBlYWNoIHBsYW50J3MgY3VycmVudCBkZWF0aCBwcm9iYWJpbGl0eSB0byBzaW11bGF0ZVxuICAgICAqIHdoZXRoZXIgZWFjaCBwbGFudCBkaWVzIG9uIHRoaXMgc3RlcFxuICAgICAqL1xuICAgIHNpbXVsYXRlRGVhdGgoKXtcbiAgICAgICAgY29uc3QgZGVhZF9wbGFudHMgPSBbXTtcbiAgICAgICAgY29uc3QgcGxhbnRzID0gdGhpcy53b3JsZC5wbGFudHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHBsYW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGRlYXRoUHJvYiA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHJhbmRvbVByb2IoZGVhdGhQcm9iLnByb2IpKXtcbiAgICAgICAgICAgICAgICBkZWFkX3BsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlYWRfcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChkZWFkX3BsYW50c1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZSBsaWdodC4gU3VubGlnaHQgdHJhdmVyc2VzIGZyb20gdGhlIGNlaWxpbmcgb2YgdGhlIHdvcmxkXG4gICAgICogZG93bndhcmRzIHZlcnRpY2FsbHkuIEl0IGlzIGNhdWdodCBieSBhIHBsYW50IGNlbGwgd2l0aCBhIHByb2JhYmlsaXR5XG4gICAgICogd2hpY2ggY2F1c2VzIHRoYXQgY2VsbCB0byBiZSBlbmVyZ2lzZWQuXG4gICAgICovXG4gICAgc2ltdWxhdGVMaWdodCgpe1xuICAgICAgICBjb25zdCBjb2xUb3BzID0gbmV3IEludDE2QXJyYXkodGhpcy53b3JsZC53aWR0aCkuZmlsbCgtMSk7XG4gICAgICAgIGNvbnN0IHBsYW50cyA9IHRoaXMud29ybGQucGxhbnRzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2VsbHMgPSBwbGFudHNbaV0uY2VsbHM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNlbGxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IGNlbGxzW2pdO1xuICAgICAgICAgICAgICAgIGlmIChjZWxsLnkgPiBjb2xUb3BzW2NlbGwueF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29sVG9wc1tjZWxsLnhdID0gY2VsbC55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihsZXQgeD0wOyB4PHRoaXMud29ybGQud2lkdGg7IHgrKyl7XG4gICAgICAgICAgICBjb25zdCB0b3BZID0gY29sVG9wc1t4XTtcbiAgICAgICAgICAgIGlmICh0b3BZID09PSAtMSkgY29udGludWU7XG5cbiAgICAgICAgICAgIGZvcihsZXQgeT10b3BZOyB5Pj0wOyB5LS0pe1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3ldO1xuICAgICAgICAgICAgICAgIGlmKGNlbGwgIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICBpZihyYW5kb21Qcm9iKHRoaXMucGFyYW1zLmVuZXJneV9wcm9iKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsLmVuZXJnaXNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHtTaW11bGF0aW9uLCBTaW11bGF0aW9uUGFyYW1zfTsiLCJpbXBvcnQge1NpbXVsYXRpb24sIFNpbXVsYXRpb25QYXJhbXN9IGZyb20gXCIuL3NpbXVsYXRpb24uanNcIjtcbmltcG9ydCB7U2ltRGF0YX0gZnJvbSBcIi4vc2ltZGF0YS5qc1wiO1xuXG5sZXQgc2ltdWxhdGlvbiA9IG51bGw7XG5sZXQgZGF0YSA9IG51bGw7XG5sZXQgcnVubmluZyA9IGZhbHNlO1xubGV0IGNlbGxTaXplID0gMjtcbmNvbnN0IFRBUkdFVF9GUFMgPSA2MDtcbmNvbnN0IEZSQU1FX0lOVEVSVkFMX01TID0gMTAwMCAvIFRBUkdFVF9GUFM7XG5sZXQgbGFzdEZyYW1lVGltZSA9IDA7XG5cbnNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBjb25zdCBtc2cgPSBldmVudC5kYXRhO1xuICAgIHN3aXRjaCAobXNnLnR5cGUpIHtcbiAgICBjYXNlIFwiaW5pdFwiOlxuICAgICAgICBpbml0U2ltKG1zZy5wYXJhbXMsIG1zZy5nZW5vbWVzIHx8IG51bGwpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RhcnRcIjpcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGxvb3AoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0b3BcIjpcbiAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RlcFwiOlxuICAgICAgICBkb1N0ZXAoKTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIHB1c2hTdGF0cygpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZ2V0Q2VsbFwiOlxuICAgICAgICBzZW5kQ2VsbEluZm8obXNnLngsIG1zZy55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImRpc3R1cmJcIjpcbiAgICAgICAgYXBwbHlEaXN0dXJiYW5jZShtc2cuc3RyZW5ndGgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImtpbGxDZWxsXCI6XG4gICAgICAgIGtpbGxDZWxsQXQobXNnLngsIG1zZy55KTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJ1cGRhdGVEaXNwbGF5UGFyYW1zXCI6XG4gICAgICAgIGlmIChzaW11bGF0aW9uICYmIHNpbXVsYXRpb24ucGFyYW1zKSB7XG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5zdGVwc19wZXJfZnJhbWUgPSBtc2cuc3RlcHNfcGVyX2ZyYW1lO1xuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMucmVjb3JkX2ludGVydmFsID0gbXNnLnJlY29yZF9pbnRlcnZhbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZXhwb3J0XCI6XG4gICAgICAgIGV4cG9ydEdlbm9tZXMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gaW5pdFNpbShwYXJhbXMsIGltcG9ydGVkR2Vub21lcz1udWxsKSB7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGNvbnN0IHNpbV9wYXJhbXMgPSBuZXcgU2ltdWxhdGlvblBhcmFtcyhwYXJhbXMpO1xuICAgIGNlbGxTaXplID0gcGFyYW1zLmNlbGxTaXplIHx8IDg7XG4gICAgc2ltdWxhdGlvbiA9IG5ldyBTaW11bGF0aW9uKHNpbV9wYXJhbXMpO1xuICAgIGRhdGEgPSBuZXcgU2ltRGF0YShzaW11bGF0aW9uKTtcbiAgICBpZiAoaW1wb3J0ZWRHZW5vbWVzICYmIGltcG9ydGVkR2Vub21lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNpbXVsYXRpb24uaW5pdF9wb3B1bGF0aW9uX2Zyb21fZ2Vub21lcyhpbXBvcnRlZEdlbm9tZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbXVsYXRpb24uaW5pdF9wb3B1bGF0aW9uKCk7XG4gICAgfVxuICAgIHB1c2hGcmFtZSgpO1xuICAgIHB1c2hTdGF0cygpO1xufVxuXG5mdW5jdGlvbiBsb29wKCkge1xuICAgIGlmICghcnVubmluZykgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3BmID0gc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3BmOyBpKyspIHtcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdEZyYW1lVGltZSA+PSBGUkFNRV9JTlRFUlZBTF9NUykge1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgcHVzaFN0YXRzKCk7XG4gICAgICAgIGxhc3RGcmFtZVRpbWUgPSBub3c7XG4gICAgfVxuXG4gICAgc2V0VGltZW91dChsb29wLCAwKTtcbn1cblxuZnVuY3Rpb24gZG9TdGVwKCkge1xuICAgIHNpbXVsYXRpb24uc3RlcCgpO1xuXG4gICAgLy8gUGVyaW9kaWMgZGlzdHVyYmFuY2VcbiAgICBjb25zdCBkaSA9IHNpbXVsYXRpb24ucGFyYW1zLmRpc3R1cmJhbmNlX2ludGVydmFsO1xuICAgIGlmIChkaSA+IDAgJiYgc2ltdWxhdGlvbi5zdGVwbnVtICUgZGkgPT09IDApIHtcbiAgICAgICAgYXBwbHlEaXN0dXJiYW5jZShzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9zdHJlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKHNpbXVsYXRpb24uc3RlcG51bSAlIHNpbXVsYXRpb24ucGFyYW1zLnJlY29yZF9pbnRlcnZhbCA9PT0gMCB8fCBzaW11bGF0aW9uLnN0ZXBudW0gPT09IDEpIHtcbiAgICAgICAgZGF0YS5yZWNvcmRTdGVwKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwdXNoU3RhdHMoKSB7XG4gICAgaWYgKCFkYXRhKSByZXR1cm47XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwic3RhdHNcIixcbiAgICAgICAgZGF0YTogSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhLmRhdGEpKSxcbiAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5RGlzdHVyYmFuY2Uoc3RyZW5ndGgpIHtcbiAgICBjb25zdCB3b3JsZCA9IHNpbXVsYXRpb24ud29ybGQ7XG4gICAgY29uc3QgcGxhbnRzID0gd29ybGQucGxhbnRzO1xuICAgIGlmIChwbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgY29uc3QgbnVtVG9LaWxsID0gTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihzdHJlbmd0aCAqIHBsYW50cy5sZW5ndGgpKTtcbiAgICAvLyBTaHVmZmxlIGEgc2FtcGxlIGFuZCBraWxsXG4gICAgY29uc3Qgc2h1ZmZsZWQgPSBwbGFudHMuc2xpY2UoKS5zb3J0KCgpID0+IE1hdGgucmFuZG9tKCkgLSAwLjUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVG9LaWxsICYmIGkgPCBzaHVmZmxlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBDaGVjayBwbGFudCBzdGlsbCBhbGl2ZSAobm90IGtpbGxlZCBieSBwcmV2aW91cyBpdGVyYXRpb24pXG4gICAgICAgIGlmICh3b3JsZC5wbGFudHMuaW5jbHVkZXMoc2h1ZmZsZWRbaV0pKSB7XG4gICAgICAgICAgICB3b3JsZC5raWxsUGxhbnQoc2h1ZmZsZWRbaV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBraWxsQ2VsbEF0KHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmIChjZWxsICYmIGNlbGwucGxhbnQpIHtcbiAgICAgICAgc2ltdWxhdGlvbi53b3JsZC5raWxsUGxhbnQoY2VsbC5wbGFudCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBleHBvcnRHZW5vbWVzKCkge1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgc2ltdWxhdGlvbi53b3JsZC5wbGFudHMuZm9yRWFjaChwbGFudCA9PiB7XG4gICAgICAgIHNlZW4uYWRkKHBsYW50Lmdlbm9tZS5zZXJpYWxpemUoKSk7XG4gICAgfSk7XG4gICAgY29uc3QgZ2Vub21lcyA9IEFycmF5LmZyb20oc2Vlbik7XG4gICAgY29uc3QgZXhwb3J0QnVuZGxlID0ge1xuICAgICAgICBhY3Rpb25fbWFwOiBzaW11bGF0aW9uLnBhcmFtcy5hY3Rpb25fbWFwLFxuICAgICAgICBnZW5vbWVfaW50ZXJwcmV0ZXI6IHNpbXVsYXRpb24ucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcixcbiAgICAgICAgZ2Vub21lc1xuICAgIH07XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiZXhwb3J0ZWRHZW5vbWVzXCIsIGJ1bmRsZTogZXhwb3J0QnVuZGxlIH0pO1xufVxuXG5mdW5jdGlvbiBwdXNoRnJhbWUoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gc2ltdWxhdGlvbi53b3JsZC5nZXRQaXhlbEJ1ZmZlcihjZWxsU2l6ZSk7XG4gICAgLy8gVHJhbnNmZXIgb3duZXJzaGlwIG9mIHRoZSBBcnJheUJ1ZmZlciBmb3IgemVyby1jb3B5IHBlcmZvcm1hbmNlXG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwiZnJhbWVcIixcbiAgICAgICAgYnVmZmVyOiByZXN1bHQuYnVmZmVyLmJ1ZmZlcixcbiAgICAgICAgd2lkdGg6IHJlc3VsdC53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiByZXN1bHQuaGVpZ2h0LFxuICAgICAgICBjZWxsQ291bnQ6IHJlc3VsdC5jZWxsQ291bnQsXG4gICAgICAgIHN0ZXBudW06IHNpbXVsYXRpb24uc3RlcG51bVxuICAgIH0sIFtyZXN1bHQuYnVmZmVyLmJ1ZmZlcl0pO1xufVxuXG5mdW5jdGlvbiBzZW5kQ2VsbEluZm8oeCwgeSkge1xuICAgIGNvbnN0IGNlbGwgPSBzaW11bGF0aW9uLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgaWYgKCFjZWxsIHx8ICFjZWxsLnBsYW50IHx8ICFjZWxsLnBsYW50Lmdlbm9tZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJjZWxsSW5mb1wiLCBmb3VuZDogZmFsc2UgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGxhbnQgPSBjZWxsLnBsYW50O1xuICAgICAgICBjb25zdCBydWxlcyA9IHNpbXVsYXRpb24uZ2Vub21lSW50ZXJwcmV0ZXIuaW50ZXJwcmV0KHBsYW50Lmdlbm9tZSwgcGxhbnQpO1xuXG4gICAgICAgIC8vIFVzZSB0aGUgY29ycmVjdCBzdGF0ZVxuICAgICAgICBsZXQgY2VsbFN0YXRlID0gcGxhbnQuZ2V0U3RhdGUoY2VsbCk7XG4gICAgICAgIGNvbnN0IG5laWdoYm91cmhvb2QgPSBwbGFudC5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICBjb25zdCBlbmVyZ2lzZWQgPSBjZWxsLmVuZXJnaXNlZDtcblxuICAgICAgICAvLyBTZXJpYWxpemUgcnVsZXMgYXMgc3RydWN0dXJlZCBvYmplY3RzIGZvciByaWNoIFVJIHJlbmRlcmluZ1xuICAgICAgICBjb25zdCBzZXJpYWxpemVkUnVsZXMgPSBydWxlcy5tYXAoKHIsIGkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSByLm1hdGNoZXMoY2VsbFN0YXRlKTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGlvblN0ciA9IHIuYWN0aW9uLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBjb25zdCBpc0RpdiA9IGFjdGlvblN0ci5zdGFydHNXaXRoKFwiZGl2aWRlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpbmRleDogaSxcbiAgICAgICAgICAgICAgICBtYXRjaGVzLFxuICAgICAgICAgICAgICAgIHN0YXRlOiByLnN0YXRlLFxuICAgICAgICAgICAgICAgIGVxTWFzazogci5lcU1hc2ssXG4gICAgICAgICAgICAgICAgYWN0aW9uVHlwZTogaXNEaXYgPyBcImRpdmlkZVwiIDogYWN0aW9uU3RyLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogaXNEaXYgPyByLmFjdGlvbi5nZXREaXJlY3Rpb24oKSA6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXRjaGluZ1J1bGVJbmRleCA9IHNlcmlhbGl6ZWRSdWxlcy5maW5kSW5kZXgociA9PiByLm1hdGNoZXMpO1xuXG4gICAgICAgIGNvbnN0IGRlYXRoID0gcGxhbnQuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmxlYW5vdmVyX2ZhY3RvcixcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnNpbV9tb2RlXG4gICAgICAgICk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogXCJjZWxsSW5mb1wiLFxuICAgICAgICAgICAgZm91bmQ6IHRydWUsXG4gICAgICAgICAgICBjZWxsU3RyOiBjZWxsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBuZWlnaGJvdXJob29kLFxuICAgICAgICAgICAgZW5lcmdpc2VkLFxuICAgICAgICAgICAgY2VsbFN0YXRlLFxuICAgICAgICAgICAgbWF0Y2hpbmdSdWxlSW5kZXgsXG4gICAgICAgICAgICBkZWF0aDogSlNPTi5zdHJpbmdpZnkoZGVhdGgpLFxuICAgICAgICAgICAgZ2Vub21lTGVuZ3RoOiBwbGFudC5nZW5vbWUubGVuZ3RoLFxuICAgICAgICAgICAgbXV0RXhwOiBwbGFudC5nZW5vbWUubXV0X2V4cCxcbiAgICAgICAgICAgIHJ1bGVzOiBzZXJpYWxpemVkUnVsZXMsXG4gICAgICAgICAgICBpbnRlcnByZXRlclR5cGU6IHNpbXVsYXRpb24ucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcixcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJjZWxsSW5mb1wiLCBmb3VuZDogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtyYW5kb21JbnR9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtQbGFudH0gZnJvbSBcIi4vcGxhbnQuanNcIjtcbmltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5cbmNsYXNzIFdvcmxkIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KXtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHdvcmxkIGxhdHRpY2UgdG8gYWxsIG51bGxzXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzLnB1c2goW10pO1xuICAgICAgICAgICAgZm9yKHZhciBqPTA7IGo8dGhpcy5oZWlnaHQ7IGorKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tpXVtqXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYW50cyA9IFtdO1xuICAgICAgICB0aGlzLmNlbGxDb3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5vblBsYW50QmlydGggPSBudWxsO1xuICAgICAgICB0aGlzLm9uUGxhbnREZWF0aCA9IG51bGw7XG4gICAgICAgIHRoaXMub25BdHRhY2sgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuc29pbE51dHJpZW50cyA9IFtdO1xuICAgICAgICB0aGlzLm51dHJpZW50TWF4ID0gMDtcbiAgICB9XG5cbiAgICBpbml0TnV0cmllbnRzKG1heCkge1xuICAgICAgICB0aGlzLm51dHJpZW50TWF4ID0gbWF4O1xuICAgICAgICB0aGlzLnNvaWxOdXRyaWVudHMgPSBuZXcgQXJyYXkodGhpcy53aWR0aCkuZmlsbChtYXgpO1xuICAgIH1cblxuICAgIHJlcGxlbmlzaE51dHJpZW50cyhyYXRlKSB7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICB0aGlzLnNvaWxOdXRyaWVudHNbeF0gPSBNYXRoLm1pbih0aGlzLm51dHJpZW50TWF4LCB0aGlzLnNvaWxOdXRyaWVudHNbeF0gKyByYXRlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIGFycmF5IG9mIHggcG9zaXRpb25zIGF0IHk9MCB3aGVyZSBubyBjZWxsIGV4aXN0c1xuICAgICAqL1xuICAgIGdldEZsb29yU3BhY2UoKXtcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICBpZih0aGlzLmNlbGxzW2ldWzBdID09PSBudWxsKXtcbiAgICAgICAgICAgICAgICBlbXB0eVNwYWNlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbXB0eVNwYWNlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdHJhdGVnaWVzIGZvciBzb3dpbmcgYSBzZWVkIG9uIHRoZSB3b3JsZCBmbG9vclxuICAgICAqIEBwYXJhbSB7Kn0gZ2Vub21lIHRoZSBnZW5vbWUgdXNlZCBieSB0aGUgbmV3IHNlZWRcbiAgICAgKiBAcGFyYW0geyp9IG5lYXJYIGlmIG5vdCBudWxsLCB0cnkgdG8gc293IGEgc2VlZCBhcyBjbG9zZVxuICAgICAqIGFzIHBvc3NpYmxlIHRvIHRoaXMgbG9jYXRpb25cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgYSBzZWVkIHdhcyBzdWNjZXNmdWxseSBwbGFudGVkLCBmYWxzZSBpZlxuICAgICAqIHRoZXJlIHdhcyBubyBzcGFjZSB0byBzb3cgYSBzZWVkLlxuICAgICAqL1xuICAgIHNlZWQoZ2Vub21lLCBuZWFyWCwgc3RlcG51bSl7XG4gICAgICAgIC8vIGZpbmQgYSByYW5kb20gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gdGhpcy5nZXRGbG9vclNwYWNlKCk7XG4gICAgICAgIGlmKGVtcHR5U3BhY2VzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZWFyWCAhPT0gdW5kZWZpbmVkICYmIG5lYXJYICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0WCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdF9kaWZmID0gdGhpcy53aWR0aDtcbiAgICAgICAgICAgIGVtcHR5U3BhY2VzLmZvckVhY2goZnVuY3Rpb24oeHBvcyl7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBNYXRoLmFicyhuZWFyWC14cG9zKTtcbiAgICAgICAgICAgICAgICBpZihkaWZmIDwgbmVhcmVzdF9kaWZmKXtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdF9kaWZmID0gZGlmZjtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFggPSB4cG9zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIG5lYXJlc3RYLCBzdGVwbnVtKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHggPSBlbXB0eVNwYWNlc1tyYW5kb21JbnQoMCwgZW1wdHlTcGFjZXMubGVuZ3RoLTEpXTtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbeF1bMF0gIT09IG51bGwpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3BhY2UgaXMgdGFrZW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIHgsIHN0ZXBudW0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzb3dQbGFudChnZW5vbWUsIHgsIHN0ZXBudW0pe1xuICAgICAgICB4ID0gdGhpcy5nZXRYKHgpO1xuICAgICAgICB2YXIgcGxhbnQgPSBuZXcgUGxhbnQoeCwgdGhpcywgZ2Vub21lLCBzdGVwbnVtKTtcbiAgICAgICAgdGhpcy5wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgIHRoaXMuYWRkQ2VsbChwbGFudC5jZWxsc1swXSk7XG4gICAgICAgIGlmICh0aGlzLm9uUGxhbnRCaXJ0aCkgdGhpcy5vblBsYW50QmlydGgocGxhbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBwbGFudCBmcm9tIHdvcmxkIHBsYW50IGxpc3QuXG4gICAgICogUmVtb3ZlIGFsbCBjZWxscyBmcm9tIGNlbGwgZ3JpZFxuICAgICAqL1xuICAgIGtpbGxQbGFudChwbGFudCl7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMucGxhbnRzLmluZGV4T2YocGxhbnQpO1xuICAgICAgICBpZiAoaWR4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucGxhbnRzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgdGhpcy5jZWxsQ291bnQgLT0gcGxhbnQuY2VsbHMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudC5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBwbGFudC5jZWxsc1tpXTtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vblBsYW50RGVhdGgpIHRoaXMub25QbGFudERlYXRoKHBsYW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFgoeCl7XG4gICAgICAgIGlmKHggPCAwKXtcbiAgICAgICAgICAgIHggPSB0aGlzLndpZHRoICsgeDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCAlIHRoaXMud2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0Q2VsbCh4LCB5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2VsbHNbdGhpcy5nZXRYKHgpXVt5XTtcbiAgICB9XG5cbiAgICBhZGRDZWxsKGNlbGwpe1xuICAgICAgICBpZiAodGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gPSBjZWxsO1xuICAgICAgICAgICAgdGhpcy5jZWxsQ291bnQrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFBpeGVsQnVmZmVyKGNlbGxTaXplKXtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMud2lkdGggKiBjZWxsU2l6ZTtcbiAgICAgICAgY29uc3QgaCA9IHRoaXMuaGVpZ2h0ICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OENsYW1wZWRBcnJheSh3ICogaCAqIDQpO1xuICAgICAgICBjb25zdCBwbGFudHMgPSB0aGlzLnBsYW50cztcblxuICAgICAgICAvLyBSZW5kZXIgc29pbCBudXRyaWVudHMgaW4gYmFja2dyb3VuZCBpZiBwcmVzZW50XG4gICAgICAgIGlmICh0aGlzLnNvaWxOdXRyaWVudHMgJiYgdGhpcy5zb2lsTnV0cmllbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IHRoaXMuc29pbE51dHJpZW50c1t4XSAvIHRoaXMubnV0cmllbnRNYXg7XG4gICAgICAgICAgICAgICAgLy8gRGFyayBicm93biB0byBlYXJ0aHkgYnJvd24gZ3JhZGllbnRcbiAgICAgICAgICAgICAgICBjb25zdCByID0gTWF0aC5yb3VuZCg0MCArIDQwICogbik7XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IE1hdGgucm91bmQoMzAgKyAyMCAqIG4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBNYXRoLnJvdW5kKDIwICsgMTAgKiBuKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBweCA9IHggKiBjZWxsU2l6ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBweSA9ICh0aGlzLmhlaWdodCAtIDEpICogY2VsbFNpemU7IC8vIEJvdHRvbSByb3dcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkeSA9IDA7IGR5IDwgY2VsbFNpemU7IGR5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm93SWR4ID0gKHB5ICsgZHkpICogdztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZHggPSAwOyBkeCA8IGNlbGxTaXplOyBkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpZHggPSAocm93SWR4ICsgcHggKyBkeCkgKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeF0gPSByO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDFdID0gZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IGI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgM10gPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGxhbnQgPSBwbGFudHNbaV07XG4gICAgICAgICAgICBjb25zdCBbYmFzZVIsIGJhc2VHLCBiYXNlQl0gPSB0aGlzLmdldEJhc2VDb2xvdXIocGxhbnQpO1xuICAgICAgICAgICAgY29uc3QgZGFya1IgPSBNYXRoLnJvdW5kKGJhc2VSICogMC43KTtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtHID0gTWF0aC5yb3VuZChiYXNlRyAqIDAuNyk7XG4gICAgICAgICAgICBjb25zdCBkYXJrQiA9IE1hdGgucm91bmQoYmFzZUIgKiAwLjcpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBjZWxscyA9IHBsYW50LmNlbGxzO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjZWxsc1tqXTtcbiAgICAgICAgICAgICAgICBjb25zdCByMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZVIgOiBkYXJrUjtcbiAgICAgICAgICAgICAgICBjb25zdCBnMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZUcgOiBkYXJrRztcbiAgICAgICAgICAgICAgICBjb25zdCBiMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZUIgOiBkYXJrQjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBweDAgPSBjZWxsLnggKiBjZWxsU2l6ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBweTAgPSAodGhpcy5oZWlnaHQgLSAxIC0gY2VsbC55KSAqIGNlbGxTaXplO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZHkgPSAwOyBkeSA8IGNlbGxTaXplOyBkeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvd0lkeCA9IChweTAgKyBkeSkgKiB3O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkeCA9IDA7IGR4IDwgY2VsbFNpemU7IGR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQm9yZGVyID0gY2VsbFNpemUgPiAxICYmIChkeCA9PT0gMCB8fCBkeSA9PT0gMCB8fCBkeCA9PT0gY2VsbFNpemUgLSAxIHx8IGR5ID09PSBjZWxsU2l6ZSAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaWR4ID0gKHJvd0lkeCArIHB4MCArIGR4KSAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0JvcmRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdICAgICA9IE1hdGgucm91bmQocjAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAxXSA9IE1hdGgucm91bmQoZzAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IE1hdGgucm91bmQoYjAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4XSAgICAgPSByMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBnMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMl0gPSBiMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAzXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IGJ1ZmZlcjogYnVmLCB3aWR0aDogdywgaGVpZ2h0OiBoLCBjZWxsQ291bnQ6IHRoaXMuY2VsbENvdW50IH07XG4gICAgfVxuXG4gICAgZ2V0QmFzZUNvbG91cihwbGFudCl7XG4gICAgICAgIHZhciBpID0gcGxhbnQuY2VsbHNbMF0ueCAlIGNTY2FsZS5sZW5ndGg7XG4gICAgICAgIHJldHVybiBjU2NhbGVbaV07XG4gICAgfVxufVxuXG4vLyBodHRwOi8vY29sb3JicmV3ZXIyLm9yZy8/dHlwZT1xdWFsaXRhdGl2ZSZzY2hlbWU9U2V0MyZuPTgg4oCUIGFzIHJhdyBbUixHLEJdIHR1cGxlc1xudmFyIGNTY2FsZSA9IFtcbiAgICBbMTQxLDIxMSwxOTldLFsyNTUsMjU1LDE3OV0sWzE5MCwxODYsMjE4XSxbMjUxLDEyOCwxMTRdLFxuICAgIFsxMjgsMTc3LDIxMV0sWzI1MywxODAsOThdLFsxNzksMjIyLDEwNV0sWzI1MiwyMDUsMjI5XVxuXTtcblxuXG5leHBvcnQgeyBXb3JsZCB9OyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdGxvYWRlZDogZmFsc2UsXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG5cdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLy8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbl9fd2VicGFja19yZXF1aXJlX18ubSA9IF9fd2VicGFja19tb2R1bGVzX187XG5cbi8vIHRoZSBzdGFydHVwIGZ1bmN0aW9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuXHQvLyBUaGlzIGVudHJ5IG1vZHVsZSBkZXBlbmRzIG9uIG90aGVyIGxvYWRlZCBjaHVua3MgYW5kIGV4ZWN1dGlvbiBuZWVkIHRvIGJlIGRlbGF5ZWRcblx0dmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8odW5kZWZpbmVkLCBbXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzXCIpKSlcblx0X193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyhfX3dlYnBhY2tfZXhwb3J0c19fKTtcblx0cmV0dXJuIF9fd2VicGFja19leHBvcnRzX187XG59O1xuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmFtZEQgPSBmdW5jdGlvbiAoKSB7XG5cdHRocm93IG5ldyBFcnJvcignZGVmaW5lIGNhbm5vdCBiZSB1c2VkIGluZGlyZWN0Jyk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kTyA9IHt9OyIsInZhciBkZWZlcnJlZCA9IFtdO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5PID0gKHJlc3VsdCwgY2h1bmtJZHMsIGZuLCBwcmlvcml0eSkgPT4ge1xuXHRpZihjaHVua0lkcykge1xuXHRcdHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcblx0XHRmb3IodmFyIGkgPSBkZWZlcnJlZC5sZW5ndGg7IGkgPiAwICYmIGRlZmVycmVkW2kgLSAxXVsyXSA+IHByaW9yaXR5OyBpLS0pIGRlZmVycmVkW2ldID0gZGVmZXJyZWRbaSAtIDFdO1xuXHRcdGRlZmVycmVkW2ldID0gW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldO1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXIgbm90RnVsZmlsbGVkID0gSW5maW5pdHk7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWQubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldID0gZGVmZXJyZWRbaV07XG5cdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaHVua0lkcy5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYgKChwcmlvcml0eSAmIDEgPT09IDAgfHwgbm90RnVsZmlsbGVkID49IHByaW9yaXR5KSAmJiBPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLk8pLmV2ZXJ5KChrZXkpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fLk9ba2V5XShjaHVua0lkc1tqXSkpKSkge1xuXHRcdFx0XHRjaHVua0lkcy5zcGxpY2Uoai0tLCAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZ1bGZpbGxlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZihwcmlvcml0eSA8IG5vdEZ1bGZpbGxlZCkgbm90RnVsZmlsbGVkID0gcHJpb3JpdHk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKGZ1bGZpbGxlZCkge1xuXHRcdFx0ZGVmZXJyZWQuc3BsaWNlKGktLSwgMSlcblx0XHRcdHZhciByID0gZm4oKTtcblx0XHRcdGlmIChyICE9PSB1bmRlZmluZWQpIHJlc3VsdCA9IHI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3MgYW5kIGNodW5rcyB0aGF0IHRoZSBlbnRyeXBvaW50IGRlcGVuZHMgb25cbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5idW5kbGUuanNcIjtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5ubWQgPSAobW9kdWxlKSA9PiB7XG5cdG1vZHVsZS5wYXRocyA9IFtdO1xuXHRpZiAoIW1vZHVsZS5jaGlsZHJlbikgbW9kdWxlLmNoaWxkcmVuID0gW107XG5cdHJldHVybiBtb2R1bGU7XG59OyIsInZhciBzY3JpcHRVcmw7XG5pZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5nLmltcG9ydFNjcmlwdHMpIHNjcmlwdFVybCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5sb2NhdGlvbiArIFwiXCI7XG52YXIgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCAmJiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ1NDUklQVCcpXG5cdFx0c2NyaXB0VXJsID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG5cdGlmICghc2NyaXB0VXJsKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKTtcblx0XHRpZihzY3JpcHRzLmxlbmd0aCkge1xuXHRcdFx0dmFyIGkgPSBzY3JpcHRzLmxlbmd0aCAtIDE7XG5cdFx0XHR3aGlsZSAoaSA+IC0xICYmICghc2NyaXB0VXJsIHx8ICEvXmh0dHAocz8pOi8udGVzdChzY3JpcHRVcmwpKSkgc2NyaXB0VXJsID0gc2NyaXB0c1tpLS1dLnNyYztcblx0XHR9XG5cdH1cbn1cbi8vIFdoZW4gc3VwcG9ydGluZyBicm93c2VycyB3aGVyZSBhbiBhdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIHlvdSBtdXN0IHNwZWNpZnkgYW4gb3V0cHV0LnB1YmxpY1BhdGggbWFudWFsbHkgdmlhIGNvbmZpZ3VyYXRpb25cbi8vIG9yIHBhc3MgYW4gZW1wdHkgc3RyaW5nIChcIlwiKSBhbmQgc2V0IHRoZSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyB2YXJpYWJsZSBmcm9tIHlvdXIgY29kZSB0byB1c2UgeW91ciBvd24gbG9naWMuXG5pZiAoIXNjcmlwdFVybCkgdGhyb3cgbmV3IEVycm9yKFwiQXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXJcIik7XG5zY3JpcHRVcmwgPSBzY3JpcHRVcmwucmVwbGFjZSgvXmJsb2I6LywgXCJcIikucmVwbGFjZSgvIy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcPy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcL1teXFwvXSskLywgXCIvXCIpO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5wID0gc2NyaXB0VXJsOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBjaHVua3Ncbi8vIFwiMVwiIG1lYW5zIFwiYWxyZWFkeSBsb2FkZWRcIlxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJzcmNfc2ltdWxhdGlvbl93b3JrZXJfanNcIjogMVxufTtcblxuLy8gaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0dmFyIFtjaHVua0lkcywgbW9yZU1vZHVsZXMsIHJ1bnRpbWVdID0gZGF0YTtcblx0Zm9yKHZhciBtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG5cdFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLm1bbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHR3aGlsZShjaHVua0lkcy5sZW5ndGgpXG5cdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRzLnBvcCgpXSA9IDE7XG5cdHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uKGRhdGEpO1xufTtcbl9fd2VicGFja19yZXF1aXJlX18uZi5pID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdC8vIFwiMVwiIGlzIHRoZSBzaWduYWwgZm9yIFwiYWxyZWFkeSBsb2FkZWRcIlxuXHRpZighaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG5cdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdGltcG9ydFNjcmlwdHMoX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgX193ZWJwYWNrX3JlcXVpcmVfXy51KGNodW5rSWQpKTtcblx0XHR9XG5cdH1cbn07XG5cbnZhciBjaHVua0xvYWRpbmdHbG9iYWwgPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gfHwgW107XG52YXIgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24gPSBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IGluc3RhbGxDaHVuaztcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdCIsInZhciBuZXh0ID0gX193ZWJwYWNrX3JlcXVpcmVfXy54O1xuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5lKFwidmVuZG9ycy1ub2RlX21vZHVsZXNfc2VlZHJhbmRvbV9pbmRleF9qcy1ub2RlX21vZHVsZXNfc3RhdHMtbGl0ZV9zdGF0c19qc1wiKS50aGVuKG5leHQpO1xufTsiLCIiLCIvLyBydW4gc3RhcnR1cFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLngoKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==