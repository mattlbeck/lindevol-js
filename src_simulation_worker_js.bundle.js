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
SimData.MAX_DATA_POINTS = 500;

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
let lastStatsTime = 0;
const STATS_INTERVAL_MS = 100;

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
        pushStats();
    }
}

function pushStats() {
    if (!data) return;
    self.postMessage({
        type: "stats",
        data: data.data,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NpbXVsYXRpb25fd29ya2VyX2pzLmJ1bmRsZS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUIsb0JBQW9CO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDJCQUEyQixpQkFBaUI7QUFDNUM7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQix1QkFBdUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFD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Q0E7V0FDQTtXQUNBO1dBQ0EsaUJBQWlCLHFCQUFxQjtXQUN0QztXQUNBO1dBQ0Esa0JBQWtCLHFCQUFxQjtXQUN2QztXQUNBO1dBQ0EsS0FBSztXQUNMO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztXQzNCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxFQUFFO1dBQ0YsRTs7Ozs7V0NSQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1dDSkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxHQUFHO1dBQ0g7V0FDQTtXQUNBLENBQUMsSTs7Ozs7V0NQRCx3Rjs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0QsRTs7Ozs7V0NOQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEU7Ozs7O1dDSkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esa0M7Ozs7O1dDbEJBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxhQUFhO1dBQ2I7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBOztXQUVBOztXQUVBLGtCOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztVRUhBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9saW5kZXZvbC9pZ25vcmVkfC9Vc2Vycy9tYXR0L2xpbmRldm9sLWpzL25vZGVfbW9kdWxlcy9zZWVkcmFuZG9tfGNyeXB0byIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9hY3Rpb25zLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2NlbGwuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvZ2Vub21lLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3BsYW50LmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3JhbmRvbS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW1kYXRhLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvd29ybGQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBkZWZpbmUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBvcHRpb25zIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9ub2RlIG1vZHVsZSBkZWNvcmF0b3IiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3B1YmxpY1BhdGgiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2ltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvc3RhcnR1cCBjaHVuayBkZXBlbmRlbmNpZXMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIChpZ25vcmVkKSAqLyIsImNvbnN0IE5FSUdIQk9VUkhPT0QgPSBbWy0xLC0xXSwgWzAsLTFdLCBbMSwtMV0sIFstMSwwXSwgWzEsMF0sIFstMSwxXSwgWzAsMV0sIFsxLDFdXTtcbmNvbnN0IE1VVF9JTkNSRU1FTlQgPSAwLjAwMTtcblxuY2xhc3MgQWN0aW9ue1xuICAgIGNvbnN0cnVjdG9yKGFjdGlvbkNvZGUpe1xuICAgICAgICB0aGlzLmNvZGUgPSBhY3Rpb25Db2RlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZXhlY3V0ZShjZWxsLCBzdGVwbnVtLCBwYXJhbXMpe1xuICAgICAgICAvLyBhY3Rpb25zIGFyZSB0eXBpY2FsbHkgb25seSBjYXJyaWVkIG91dCBpZiB0aGUgY2VsbCBoYXMgZW5lcmd5XG4gICAgICAgIC8vIGFuZCB0aGUgY2VsbCBsb3NlcyBlbmVyZ3kgYXMgYSByZXN1bHQuXG4gICAgICAgIGlmIChjZWxsLmVuZXJnaXNlZCl7XG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9IHRoaXMuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSwgcGFyYW1zKTtcbiAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gIXN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkb0FjdGlvbihjZWxsKXtcblxuICAgIH1cbn1cblxuY2xhc3MgRGl2aWRlIGV4dGVuZHMgQWN0aW9ue1xuXG4gICAgZG9BY3Rpb24oY2VsbCwgc3RlcG51bSwgcGFyYW1zKXtcbiAgICAgICAgLy8gdGhlIDIgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBvZiB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgLy8gZGV0ZXJtaW5lcyB3aGljaCBkaXJlY3Rpb24gdGhlIGRpdmlkZSBhY3Rpb24gaXMgZm9yXG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwsIHN0ZXBudW0sIHBhcmFtcyk7XG5cbiAgICAgICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMuc2ltX21vZGUgPT09IFwibmljaGVcIikge1xuICAgICAgICAgICAgaWYgKGNlbGwucGxhbnQubnV0cmllbnRDb3VudCA8IHBhcmFtcy5udXRyaWVudF9kaXZpZGVfY29zdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjZWxsLnBsYW50Lm51dHJpZW50Q291bnQgLT0gcGFyYW1zLm51dHJpZW50X2RpdmlkZV9jb3N0O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbiwgc3RlcG51bSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgZ2V0RGlyZWN0aW9uKCl7XG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIGNvcnJlY3QgYml0c1xuICAgICAgICAvLyAmIHdpdGggMDAwMDAxMTEgdG8gbWFzayBvdXQgbGVhc3Qgc2lnIGJpdHNcbiAgICAgICAgdmFyIGRpcmVjdGlvbkNvZGUgPSB0aGlzLmNvZGUgJiA3O1xuICAgICAgICByZXR1cm4gTkVJR0hCT1VSSE9PRFtkaXJlY3Rpb25Db2RlXTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYGRpdmlkZSAke3RoaXMuZ2V0RGlyZWN0aW9uKCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIE11dGF0ZVBsdXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwICs9IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dCtcIjtcbiAgICB9XG59XG5cbmNsYXNzIE11dGF0ZU1pbnVzIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgY2VsbC5wbGFudC5nZW5vbWUubXV0X2V4cCAtPSBNVVRfSU5DUkVNRU5UO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJtdXQtXCI7XG4gICAgfVxufVxuXG5jbGFzcyBGbHlpbmdTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsLCBzdGVwbnVtKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCksIG51bGwsIHN0ZXBudW0pO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcImZseWluZ3NlZWRcIjtcbiAgICB9XG59XG5cbmNsYXNzIExvY2FsU2VlZCBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsLCBzdGVwbnVtKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSk7XG4gICAgICAgIHJldHVybiBjZWxsLnBsYW50LndvcmxkLnNlZWQoY2VsbC5wbGFudC5nZW5vbWUuY29weSgpLCBjZWxsLngsIHN0ZXBudW0pO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcImxvY2Fsc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgU3RhdGVCaXROIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpIHtcbiAgICAgICAgLy8gVG9nZ2xlIHRoZSBiaXQgdXNpbmcgWE9SXG4gICAgICAgIGNlbGwubmV4dEludGVybmFsU3RhdGUgPSBjZWxsLm5leHRJbnRlcm5hbFN0YXRlIF4gKDEgPDwgdGhpcy5nZXROdGhCaXQoKSk7XG4gICAgICAgIC8vIHRoaXMgYWN0aW9uIGRvZXMgbm90IGNvbnN1bWUgZW5lcmd5XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXROdGhCaXQoKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMTExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICByZXR1cm4gdGhpcy5jb2RlICYgMTU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBTdGF0ZUJpdCAke3RoaXMuZ2V0TnRoQml0KCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIEFjdGlvbk1hcCB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nLCBjb2RlUmFuZ2U9MjU2KXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbWFwcGluZztcbiAgICAgICAgdGhpcy5jb2RlUmFuZ2UgPSBjb2RlUmFuZ2U7XG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IFtEaXZpZGUsIEZseWluZ1NlZWQsIExvY2FsU2VlZCwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIFN0YXRlQml0Tl07XG4gICAgfVxuXG4gICAgZ2V0QWN0aW9uKGFjdGlvbkNvZGUpe1xuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGFjdGlvbiBjb2RlIGludG8gdGhlIFswLCBzdW0pIHJhbmdlIHNvIHdlaWdodHMgY2FuIGJlXG4gICAgICAgIC8vIGFueSBwb3NpdGl2ZSBpbnRlZ2VycyByYXRoZXIgdGhhbiBuZWVkaW5nIHRvIHN1bSB0byBjb2RlUmFuZ2UuXG4gICAgICAgIGNvbnN0IHN1bSA9IHRoaXMubWFwcGluZy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZENvZGUgPSBNYXRoLmZsb29yKChhY3Rpb25Db2RlIC8gdGhpcy5jb2RlUmFuZ2UpICogc3VtKTtcbiAgICAgICAgdmFyIG1hcHBpbmdDb3VudCA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubWFwcGluZy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBtYXBwaW5nQ291bnQgKz0gdGhpcy5tYXBwaW5nW2ldO1xuICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRDb2RlIDwgbWFwcGluZ0NvdW50KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1tpXShhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBGYWxsYmFjayBmb3IgZmxvYXRpbmctcG9pbnQgZWRnZSBjYXNlc1xuICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1t0aGlzLm1hcHBpbmcubGVuZ3RoIC0gMV0oYWN0aW9uQ29kZSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7RGl2aWRlLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgTG9jYWxTZWVkLCBGbHlpbmdTZWVkLCBBY3Rpb25NYXAsIE5FSUdIQk9VUkhPT0R9OyIsIlxuY2xhc3MgQ2VsbHtcbiAgICBjb25zdHJ1Y3RvcihwbGFudCwgeCwgeSl7XG4gICAgICAgIHRoaXMucGxhbnQgPSBwbGFudDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGdldCBlbmVyZ2lzZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmVyZ2lzZWQ7XG4gICAgfVxuXG4gICAgc2V0IGVuZXJnaXNlZCh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fZW5lcmdpc2VkID09PSB2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucGxhbnQpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoKXtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgsIHgsIHksIHNpemUsIGNvbG91cil7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvdXI7XG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgLy9jdHguc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYENlbGwgYXQgKCR7dGhpcy54fSwgJHt0aGlzLnl9KSBlbmVyZ3k6ICR7dGhpcy5lbmVyZ2lzZWR9YDtcbiAgICB9XG59XG5cbmV4cG9ydCB7Q2VsbH07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtBY3Rpb25NYXB9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgQnl0ZUFycmF5IGV4dGVuZHMgQXJyYXl7XG5cbiAgICBjb25zdHJ1Y3RvcihsZW5ndGg9MCwgaW5pdGlhbF9tdXRfZXhwPTApe1xuICAgICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgICB0aGlzLm11dF9leHAgPSBpbml0aWFsX211dF9leHA7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb20oYXJyLCBtdXRfZXhwPTApe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGFyci5sZW5ndGgsIG11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gYXJyW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXJpYWxpemUgdGhpcyBnZW5vbWUgdG8gYSBzdHJpbmc6IFwiPG11dF9leHA+OzxieXRlMD4sPGJ5dGUxPiwuLi5cIlxuICAgICAqL1xuICAgIHNlcmlhbGl6ZSgpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5tdXRfZXhwfTske0FycmF5LmZyb20odGhpcykuam9pbihcIixcIil9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXNlcmlhbGl6ZSBhIGdlbm9tZSBzdHJpbmcgcHJvZHVjZWQgYnkgc2VyaWFsaXplKCkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm5zIHtCeXRlQXJyYXl9XG4gICAgICovXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKHN0cil7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gc3RyLnRyaW0oKS5zcGxpdChcIjtcIik7XG4gICAgICAgIGNvbnN0IG11dF9leHAgPSBwYXJzZUZsb2F0KHBhcnRzWzBdKTtcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBwYXJ0c1sxXS5zcGxpdChcIixcIikubWFwKE51bWJlcik7XG4gICAgICAgIHJldHVybiBCeXRlQXJyYXkuZnJvbShieXRlcywgbXV0X2V4cCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJhbmRvbShsZW5ndGgpe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSByYW5kb21JbnQoMCwgMjU1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgY29weSgpe1xuICAgICAgICB2YXIgbmV3QXJyID0gbmV3IEJ5dGVBcnJheSh0aGlzLmxlbmd0aCwgdGhpcy5tdXRfZXhwKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBuZXdBcnJbaV0gPSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdBcnI7XG4gICAgfVxuXG59XG5cbmNsYXNzIE11dGF0b3J7XG4gICAgY29uc3RydWN0b3IocHJvYiwgcHJvYl9yZXBsYWNlbWVudCwgcHJvYl9pbnNlcnRpb24sIHByb2JfZGVsZXRpb24sIHByb2JfZHVwLCByZXBsYWNlbWVudF9tb2RlLCB1bml0cyl7XG4gICAgICAgIHRoaXMucHJvYiA9IHByb2I7XG4gICAgICAgIHRoaXMucFIgPSBwcm9iX3JlcGxhY2VtZW50O1xuICAgICAgICB0aGlzLnBJID0gcHJvYl9pbnNlcnRpb247XG4gICAgICAgIHRoaXMucEQgPSBwcm9iX2RlbGV0aW9uO1xuICAgICAgICB0aGlzLnBEdXAgPSBwcm9iX2R1cDtcbiAgICAgICAgdGhpcy5wUm1vZGUgPSByZXBsYWNlbWVudF9tb2RlOyAgXG4gICAgICAgIHRoaXMudW5pdHMgPSB1bml0cztcbiAgICB9XG5cbiAgICBtdXRhdGUoZ2Vub21lKXtcbiAgICAgICAgbGV0IG11dGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBSLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlKGdlbm9tZSk7XG4gICAgICAgICAgICBtdXRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEksIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmluc2VydChnZW5vbWUpO1xuICAgICAgICAgICAgbXV0YXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBELCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5kZWxldGUoZ2Vub21lKTtcbiAgICAgICAgICAgIG11dGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtdXRhdGVkO1xuICAgIH1cblxuICAgIG1Qcm9iKHAsIGV4cCl7XG4gICAgICAgIHJldHVybiByYW5kb21Qcm9iKHAgKiBNYXRoLnBvdyggdGhpcy5wcm9iLCBleHApKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgc3dpdGNoKHRoaXMucFJtb2RlKXtcbiAgICAgICAgY2FzZSBcImJ5dGV3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSB0aGlzLnJhbmRvbUNoYXIoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYml0d2lzZVwiOlxuICAgICAgICAgICAgZ2Vub21lW2ldID0gZ2Vub21lW2ldIF4gKDEgPDwgcmFuZG9tSW50KDAsIDcpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG11dGF0aW9uIHJlcGxhY2VtZW50IG1vZGU6ICR7dGhpcy5wUm1vZGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgaW5zZXJ0KGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMCwgdGhpcy5yYW5kb21DaGFyKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVsZXRlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByYW5kb21DaGFyKCl7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQoMCwgMjU1KTtcbiAgICB9XG5cbiAgICByYW5kb21Qb3MoZ2Vub21lKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCBnZW5vbWUubGVuZ3RoLTEpO1xuICAgIH1cbn1cblxuXG5cbmNsYXNzIFJ1bGUge1xuICAgIGNvbnN0cnVjdG9yKGVxTWFzaywgc3RhdGUsIGFjdGlvbil7XG4gICAgICAgIHRoaXMuZXFNYXNrID0gZXFNYXNrO1xuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIHRoaXMuYWN0aW9uID0gYWN0aW9uO1xuICAgIH1cblxuICAgIG1hdGNoZXMoc3RhdGUpe1xuICAgICAgICB2YXIgZXFTdGF0ZSA9IHN0YXRlICYgdGhpcy5lcU1hc2s7XG4gICAgICAgIHJldHVybiBlcVN0YXRlID09PSB0aGlzLnN0YXRlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnN0YXRlfSAtPiAke3RoaXMuYWN0aW9ufWA7XG4gICAgfVxufVxuXG5jbGFzcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICAvKipcbiAgICAgKiBNZXRob2RzIHRoYXQgZGVjb2RlIGdlbm9tZXMgaW50byBydWxlc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcsIGNvZGVSYW5nZT0yNTYpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBuZXcgQWN0aW9uTWFwKG1hcHBpbmcsIGNvZGVSYW5nZSk7XG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuXG4gICAgfVxufVxuXG5cbmNsYXNzIFByb21vdG9ySW50ZXJwcmV0ZXIgZXh0ZW5kcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nKXtcbiAgICAgICAgc3VwZXIobWFwcGluZywgNjQpOyAvLyB0ZXJtaW5hdG9yIGNvbnRyaWJ1dGVzIGxvd2VyIDYgYml0czogcmFuZ2UgMC02M1xuICAgIH1cbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5LCBwbGFudD1udWxsKXtcbiAgICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICAgIHZhciBiZWhhdmlvcmFsR2VuZXMgPSBbXTtcbiAgICAgICAgdmFyIHN0cnVjdHVyYWxHZW5lcyA9IFtdO1xuICAgICAgICB2YXIgZ2VuZSA9IFtdO1xuICAgICAgICBcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBieXRlYXJyYXkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGMgPSBieXRlYXJyYXlbaV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKGJpdFNldChjLCA3KSl7XG4gICAgICAgICAgICAgICAgLy8gU3RhcnQgb2YgYSBnZW5lXG4gICAgICAgICAgICAgICAgZ2VuZSA9IFtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoYml0U2V0KGMsIDYpKXtcbiAgICAgICAgICAgICAgICAvLyBUZXJtaW5hdG9yIChFbmQgb2YgYSBnZW5lKVxuICAgICAgICAgICAgICAgIGlmKGdlbmUubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQml0IDUgb2YgdGhlIHN0YXJ0aW5nIHByb21vdG9yIGRldGVybWluZXMgaWYgaXQncyBzdHJ1Y3R1cmFsXG4gICAgICAgICAgICAgICAgICAgIGlmIChiaXRTZXQoZ2VuZVswXSwgNSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cnVjdHVyYWxHZW5lcy5wdXNoKGdlbmUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVoYXZpb3JhbEdlbmVzLnB1c2goZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZ2VuZSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ2VuZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgZ2VuZS5wdXNoKGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvY2VzcyBTdHJ1Y3R1cmFsIEdlbmVzIChQaGVub3R5cGljIFRyYWl0cylcbiAgICAgICAgaWYgKHBsYW50KSB7XG4gICAgICAgICAgICBzdHJ1Y3R1cmFsR2VuZXMuZm9yRWFjaChmdW5jdGlvbihnZW5lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhaXRDb2RlID0gZ2VuZVtnZW5lLmxlbmd0aCAtIDFdICYgMHgzRjtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IChnZW5lLmxlbmd0aCAtIDIpICogMC4wMTsgLy8gU3RyZW5ndGggZGVwZW5kcyBvbiBnZW5lIGxlbmd0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHN3aXRjaCh0cmFpdENvZGUgJSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMDogcGxhbnQudHJhaXRzLmxlYW5vdmVyID0gTWF0aC5tYXgoMC4xLCBwbGFudC50cmFpdHMubGVhbm92ZXIgLSB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IHBsYW50LnRyYWl0cy5hdHRhY2sgPSBNYXRoLm1pbig1LjAsIHBsYW50LnRyYWl0cy5hdHRhY2sgKyB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IHBsYW50LnRyYWl0cy5lZmZpY2llbmN5ID0gTWF0aC5tYXgoMC4xLCBwbGFudC50cmFpdHMuZWZmaWNpZW5jeSAtIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogcGxhbnQudHJhaXRzLmRlYXRoID0gTWF0aC5tYXgoMC4xLCBwbGFudC50cmFpdHMuZGVhdGggLSB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvY2VzcyBCZWhhdmlvcmFsIEdlbmVzIChTdGF0ZS1BY3Rpb24gUnVsZXMpXG4gICAgICAgIGJlaGF2aW9yYWxHZW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGdlbmUpe1xuICAgICAgICAgICAgLy8gZXh0cmFjdCA2IGxlYXN0IHNpZyBiaXRzIGZyb20gdGVybWluYXRvciBhcyB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgICAgIHZhciBhY3Rpb25Db2RlID0gZ2VuZVtnZW5lLmxlbmd0aC0xXSAmIDB4M0Y7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5tYXBwaW5nLmdldEFjdGlvbihhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gdGFrZSBpbmZvcm1hdGlvbiBmcm9tIG9wZXJhdG9ycyB0byBjcmVhdGUgMzItYml0IHN0YXRlIG1hc2tcbiAgICAgICAgICAgIHZhciBtYXNrID0gMDtcbiAgICAgICAgICAgIHZhciBlcU1hc2sgPSAwOyBcbiAgICAgICAgICAgIGZvcih2YXIgaT0xOyBpPGdlbmUubGVuZ3RoLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIDUgbGVhc3Qgc2lnIGJpdHMgZGV0ZXJtaW5lIHRoZSBtYXNrIGluZGV4ICgwLTMxKVxuICAgICAgICAgICAgICAgIHZhciBtYXNrQml0ID0gZ2VuZVtpXSAmIDB4MUY7XG5cbiAgICAgICAgICAgICAgICAvLyA2dGggYml0IGRldGVybWluZXMgaWYgd2UgbWF0Y2ggMSBvciAwXG4gICAgICAgICAgICAgICAgdmFyIGJpdFN0YXRlID0gKGdlbmVbaV0gJiAweDIwKSA+PiA1O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFVzZSB1bnNpZ25lZCBzaGlmdCBsb2dpYyBmb3IgMzItYml0IGNvbnNpc3RlbmN5XG4gICAgICAgICAgICAgICAgY29uc3QgYml0VmFsdWUgPSAoMSA8PCBtYXNrQml0KSA+Pj4gMDtcbiAgICAgICAgICAgICAgICBpZiAoYml0U3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFzayA9IChtYXNrIHwgYml0VmFsdWUpID4+PiAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlcU1hc2sgPSAoZXFNYXNrIHwgYml0VmFsdWUpID4+PiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZShlcU1hc2ssIG1hc2ssIGFjdGlvbikpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcnVsZXM7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBiaXRTZXQoYnl0ZSwgaSl7XG4gICAgcmV0dXJuIChieXRlID4+IGkpICYgMTtcbn1cblxuZXhwb3J0IHtCeXRlQXJyYXksIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9OyIsImltcG9ydCB7cmFuZG9tSW50LCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7Q2VsbH0gZnJvbSBcIi4vY2VsbC5qc1wiO1xuaW1wb3J0IHtORUlHSEJPVVJIT09EfSBmcm9tIFwiLi9hY3Rpb25zLmpzXCI7XG5cbmNsYXNzIFBsYW50e1xuICAgIGNvbnN0cnVjdG9yKHgsIHdvcmxkLCBnZW5vbWUsIGJpcnRoU3RlcCwgdXNlSW50ZXJuYWxTdGF0ZT1mYWxzZSkge1xuICAgICAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgICAgIHRoaXMuZW5lcmdpc2VkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmNlbGxzID0gW25ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgMCldO1xuICAgICAgICB0aGlzLmdlbm9tZSA9IGdlbm9tZTtcbiAgICAgICAgdGhpcy51c2VJbnRlcm5hbFN0YXRlID0gdXNlSW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5ydWxlcyA9IG51bGw7IC8vIGNhY2hlZCBydWxlc1xuICAgICAgICB0aGlzLmxlYW5vdmVyRW5lcmdpc2VkID0gMDsgLy8gSW5jcmVtZW50YWwgdHJhY2tpbmdcbiAgICAgICAgdGhpcy5iaXJ0aFN0ZXAgPSBiaXJ0aFN0ZXA7XG4gICAgICAgIHRoaXMubnV0cmllbnRDb3VudCA9IDEwLjA7IC8vIFN0YXJ0IHdpdGggc29tZSBudXRyaWVudHNcbiAgICAgICAgdGhpcy50cmFpdHMgPSB7XG4gICAgICAgICAgICBsZWFub3ZlcjogMS4wLFxuICAgICAgICAgICAgZGVhdGg6IDEuMCxcbiAgICAgICAgICAgIGF0dGFjazogMS4wLFxuICAgICAgICAgICAgZWZmaWNpZW5jeTogMS4wXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZ2V0TmVpZ2hib3VyaG9vZChjZWxsKXtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBuZWlnaGJvdXJob29kIG1hc2tcbiAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxORUlHSEJPVVJIT09ELmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBwb3MgPSBORUlHSEJPVVJIT09EW2ldO1xuICAgICAgICAgICAgdmFyIHggPSBjZWxsLnggKyBwb3NbMF07XG4gICAgICAgICAgICB2YXIgeSA9IGNlbGwueSArIHBvc1sxXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQm91bmRzIGNoZWNrIGluc3RlYWQgb2YgdHJ5LWNhdGNoXG4gICAgICAgICAgICBpZiAoeCA+PSAwICYmIHggPCB0aGlzLndvcmxkLndpZHRoICYmIHkgPj0gMCAmJiB5IDwgdGhpcy53b3JsZC5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgd29ybGRQb3MgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3ldO1xuICAgICAgICAgICAgICAgIGlmICh3b3JsZFBvcyBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgICAgICAgICBtYXNrID0gbWFzayB8ICgxIDw8IGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFzaztcbiAgICB9XG5cbiAgICBnZXRTdGF0ZShjZWxsKXtcbiAgICAgICAgY29uc3QgbmVpZ2hib3Job29kID0gdGhpcy5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICBcbiAgICAgICAgLy8gQmFzaWMgMTYtYml0IHN0YXRlXG4gICAgICAgIGxldCBzdGF0ZSA9IG5laWdoYm9yaG9vZCB8IChjZWxsLmludGVybmFsU3RhdGUgPDwgOCkgfCAoKGNlbGwuZW5lcmdpc2VkID8gMSA6IDApIDw8IDE1KTtcbiAgICAgICAgXG4gICAgICAgIC8vIE5pY2hlIGVuaGFuY2VtZW50cyAoMzItYml0KVxuICAgICAgICAvLyBCaXRzIDAtNzogTmVpZ2hib3IgcHJlc2VuY2UgKGluIG5laWdoYm9yaG9vZClcbiAgICAgICAgLy8gQml0cyA4LTE1OiBOZWlnaGJvciBQdWJsaWMgQml0cyAoQml0IDggb2YgbmVpZ2hib3IgaW50ZXJuYWxTdGF0ZSlcbiAgICAgICAgLy8gQml0cyAxNi0yMzogTmVpZ2hib3IgRW5lcmd5IFN0YXR1c1xuICAgICAgICAvLyBCaXRzIDI0LTMwOiBTZWxmIEludGVybmFsIFN0YXRlXG4gICAgICAgIC8vIEJpdCAzMTogU2VsZiBFbmVyZ2lzZWRcbiAgICAgICAgXG4gICAgICAgIGxldCBuZWlnaGJvclNpZ25hbHMgPSAwO1xuICAgICAgICBsZXQgbmVpZ2hib3JFbmVyZ3kgPSAwO1xuICAgICAgICBcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8TkVJR0hCT1VSSE9PRC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgcG9zID0gTkVJR0hCT1VSSE9PRFtpXTtcbiAgICAgICAgICAgIHZhciB4ID0gY2VsbC54ICsgcG9zWzBdO1xuICAgICAgICAgICAgdmFyIHkgPSBjZWxsLnkgKyBwb3NbMV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh4ID49IDAgJiYgeCA8IHRoaXMud29ybGQud2lkdGggJiYgeSA+PSAwICYmIHkgPCB0aGlzLndvcmxkLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICAgICAgaWYgKHdvcmxkUG9zIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIEJpdCAwIG9mIG5laWdoYm9yJ3MgaW50ZXJuYWwgc3RhdGUgKGFzIHRoZWlyIFB1YmxpYyBCaXQpXG4gICAgICAgICAgICAgICAgICAgIGlmICgod29ybGRQb3MuaW50ZXJuYWxTdGF0ZSAmIDEpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvclNpZ25hbHMgfD0gKDEgPDwgaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmxkUG9zLmVuZXJnaXNlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JFbmVyZ3kgfD0gKDEgPDwgaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb25zdHJ1Y3QgMzItYml0IHN0YXRlXG4gICAgICAgIC8vIFdlIHVzZSB1bnNpZ25lZCByaWdodCBzaGlmdCBmb3IgMzItYml0IGNvbnNpc3RlbmN5XG4gICAgICAgIHN0YXRlID0gKG5laWdoYm9yaG9vZCAmIDB4RkYpIHwgXG4gICAgICAgICAgICAgICAgKChuZWlnaGJvclNpZ25hbHMgJiAweEZGKSA8PCA4KSB8IFxuICAgICAgICAgICAgICAgICgobmVpZ2hib3JFbmVyZ3kgJiAweEZGKSA8PCAxNikgfCBcbiAgICAgICAgICAgICAgICAoKGNlbGwuaW50ZXJuYWxTdGF0ZSAmIDB4N0YpIDw8IDI0KSB8IFxuICAgICAgICAgICAgICAgICgoY2VsbC5lbmVyZ2lzZWQgPyAxIDogMCkgPDwgMzEpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gc3RhdGUgPj4+IDA7IFxuICAgIH1cblxuICAgIG1ldGFib2xpc20ocGFyYW1zKSB7XG4gICAgICAgIGlmIChwYXJhbXMuc2ltX21vZGUgIT09IFwibmljaGVcIikgcmV0dXJuO1xuXG4gICAgICAgIC8vIDEuIEV4dHJhY3Rpb24gZnJvbSByb290cyAoeT0wKVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgICAgICAgICAgaWYgKGNlbGwueSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IHRoaXMud29ybGQuc29pbE51dHJpZW50c1tjZWxsLnhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFtb3VudCA9IE1hdGgubWluKGF2YWlsYWJsZSwgcGFyYW1zLm51dHJpZW50X2V4dHJhY3RfcmF0ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5udXRyaWVudENvdW50ICs9IGFtb3VudDtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLnNvaWxOdXRyaWVudHNbY2VsbC54XSAtPSBhbW91bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBNYWludGVuYW5jZSBjb3N0XG4gICAgICAgIC8vIFRyYWl0cyBjYW4gcmVkdWNlIG1haW50ZW5hbmNlIGNvc3RcbiAgICAgICAgY29uc3QgY29zdCA9IHRoaXMuY2VsbHMubGVuZ3RoICogcGFyYW1zLm51dHJpZW50X21haW50ZW5hbmNlX2Nvc3QgKiB0aGlzLnRyYWl0cy5lZmZpY2llbmN5O1xuICAgICAgICB0aGlzLm51dHJpZW50Q291bnQgPSBNYXRoLm1heCgwLCB0aGlzLm51dHJpZW50Q291bnQgLSBjb3N0KTtcbiAgICB9XG5cbiAgICBncm93KCl7XG4gICAgICAgIHRoaXMuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gZ3Jvd1xuICAgICAgICAgICAgaWYocmFuZG9tUHJvYigwLjgpKXtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VzID0gdGhpcy5nZXRHcm93RGlyZWN0aW9uKGNlbGwpO1xuICAgICAgICAgICAgICAgIGlmKHNwYWNlcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHNwYWNlc1tyYW5kb21JbnQoMCwgc3BhY2VzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdyb3cgdGhlIHBsYW50IGJ5IG9uZSBjZWxsIGlmIHBvc3NpYmxlXG4gICAgICogQHBhcmFtIHsqfSBjZWxsIHRoZSBjZWxsIHRvIGdyb3cgZnJvbVxuICAgICAqIEBwYXJhbSB7Kn0gZGlyZWN0aW9uIHRoZSBkaXJlY3Rpb24gdG8gZ3JvdyBpblxuICAgICAqL1xuICAgIGdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24sIHN0ZXBudW0pe1xuICAgICAgICB2YXIgeCA9IGNlbGwueCtkaXJlY3Rpb25bMF0sIHkgPSBjZWxsLnkrZGlyZWN0aW9uWzFdO1xuICAgICAgICAvLyBjaGVjayBpZiBzcGFjZSBpcyBjbGVhclxuICAgICAgICB2YXIgc3BhY2UgPSB0aGlzLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgICAgIGlmIChzcGFjZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BhY2UgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgIGlmIChzcGFjZS5wbGFudCA9PT0gdGhpcyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBdHRhY2sgb2NjdXJzXG4gICAgICAgICAgICBpZiAodGhpcy53b3JsZC5vbkF0dGFjaykgdGhpcy53b3JsZC5vbkF0dGFjaygpO1xuXG4gICAgICAgICAgICAvLyB0aGlzIHBsYW50IHdpbGwga2lsbCB0aGUgb3RoZXJcbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9iYWJpbGl0eS4uLlxuICAgICAgICAgICAgaWYocmFuZG9tUHJvYihzcGFjZS5wbGFudC5nZXRLaWxsUHJvYmFiaWxpdHkoKSkpe1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBzdWNjZWVkZWQuIEtpbGwgY29tcGV0aXRvciBhbmQgY29udGludWUgd2l0aCBncm93dGhcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChzcGFjZS5wbGFudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgZmFpbGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgLy8gZ3JvdyBjZWxsIGluIHRvIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBuZXdfY2VsbCA9IG5ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgeSk7XG4gICAgICAgIHRoaXMuY2VsbHMucHVzaChuZXdfY2VsbCk7XG4gICAgICAgIFxuICAgICAgICAvLyBVcGRhdGUgaW5jcmVtZW50YWwgdHJhY2tpbmdcbiAgICAgICAgY29uc3Qgcm9vdENlbGwgPSB0aGlzLmNlbGxzWzBdO1xuICAgICAgICBjb25zdCBsZSA9IHRoaXMud29ybGQud2lkdGgvMiAtICggKCggMS41KnRoaXMud29ybGQud2lkdGggKSArIG5ld19jZWxsLnggLSByb290Q2VsbC54KSAgJSB0aGlzLndvcmxkLndpZHRoKTtcbiAgICAgICAgdGhpcy5sZWFub3ZlckVuZXJnaXNlZCArPSBsZTtcblxuICAgICAgICB0aGlzLndvcmxkLmFkZENlbGwobmV3X2NlbGwpO1xuICAgIH1cblxuICAgIG1ldGFib2xpc20ocGFyYW1zKSB7XG4gICAgICAgIGlmIChwYXJhbXMuc2ltX21vZGUgIT09IFwibmljaGVcIikgcmV0dXJuO1xuXG4gICAgICAgIC8vIDEuIEV4dHJhY3Rpb24gZnJvbSByb290cyAoeT0wKVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgICAgICAgICAgaWYgKGNlbGwueSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IHRoaXMud29ybGQuc29pbE51dHJpZW50c1tjZWxsLnhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFtb3VudCA9IE1hdGgubWluKGF2YWlsYWJsZSwgcGFyYW1zLm51dHJpZW50X2V4dHJhY3RfcmF0ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5udXRyaWVudENvdW50ICs9IGFtb3VudDtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLnNvaWxOdXRyaWVudHNbY2VsbC54XSAtPSBhbW91bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBNYWludGVuYW5jZSBjb3N0XG4gICAgICAgIC8vIFRyYWl0cyBjYW4gcmVkdWNlIG1haW50ZW5hbmNlIGNvc3RcbiAgICAgICAgY29uc3QgY29zdCA9IHRoaXMuY2VsbHMubGVuZ3RoICogcGFyYW1zLm51dHJpZW50X21haW50ZW5hbmNlX2Nvc3QgKiB0aGlzLnRyYWl0cy5lZmZpY2llbmN5O1xuICAgICAgICB0aGlzLm51dHJpZW50Q291bnQgPSBNYXRoLm1heCgwLCB0aGlzLm51dHJpZW50Q291bnQgLSBjb3N0KTtcbiAgICB9XG5cbiAgICBnZXRLaWxsUHJvYmFiaWxpdHkoKXtcbiAgICAgICAgY29uc3QgYmFzZVByb2IgPSB0aGlzLmVuZXJnaXNlZENvdW50ID4gMCA/IDEvdGhpcy5lbmVyZ2lzZWRDb3VudCA6IDEuMDtcbiAgICAgICAgcmV0dXJuIGJhc2VQcm9iICogdGhpcy50cmFpdHMuYXR0YWNrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB3aGV0aGVyIHRoaXMgcGxhbnQgc2hvdWxkIGRpZS5cbiAgICAgKiBAcGFyYW0ge30gbmF0dXJhbF9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gZW5lcmd5X2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGVuZXJneSByaWNoIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBsZWFub3Zlcl9mYWN0b3IgZmFjdG9yIHRvIHRoZSBsZWFub3ZlciB0ZXJtXG4gICAgICovXG4gICAgZ2V0RGVhdGhQcm9iYWJpbGl0eShkZWF0aF9mYWN0b3IsIG5hdHVyYWxfZXhwLCBlbmVyZ3lfZXhwLCBsZWFub3Zlcl9mYWN0b3IsIHNpbV9tb2RlPVwiY2xhc3NpY1wiKXtcbiAgICAgICAgdmFyIG51bUNlbGxzID0gdGhpcy5jZWxscy5sZW5ndGg7XG4gICAgICAgIFxuICAgICAgICB2YXIgbGVhbm92ZXJDZWxscyA9IDIvKG51bUNlbGxzKihudW1DZWxscy0xKSk7XG4gICAgICAgIGlmIChsZWFub3ZlckNlbGxzID09PSBJbmZpbml0eSl7XG4gICAgICAgICAgICBsZWFub3ZlckNlbGxzID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWFub3ZlclRlcm0gPSBsZWFub3ZlckNlbGxzKk1hdGguYWJzKHRoaXMubGVhbm92ZXJFbmVyZ2lzZWQpO1xuICAgICAgICBcbiAgICAgICAgdmFyIGRfbmF0dXJhbCA9IE1hdGgucG93KG51bUNlbGxzLCBuYXR1cmFsX2V4cCk7XG4gICAgICAgIHZhciBkX2VuZXJneSA9IE1hdGgucG93KHRoaXMuZW5lcmdpc2VkQ291bnQrMSwgZW5lcmd5X2V4cCk7XG4gICAgICAgIHZhciBkX2xlYW5vdmVyID0gKGxlYW5vdmVyX2ZhY3RvciAqIHRoaXMudHJhaXRzLmxlYW5vdmVyKSAqIGxlYW5vdmVyVGVybTtcbiAgICAgICAgXG4gICAgICAgIC8vIEJhc2UgcHJvYmFiaWxpdHkgbW9kaWZpZWQgYnkgZGVhdGggdHJhaXRcbiAgICAgICAgdmFyIHBEZWF0aCA9IChkZWF0aF9mYWN0b3IgKiB0aGlzLnRyYWl0cy5kZWF0aCkgKiBkX25hdHVyYWwgKiBkX2VuZXJneSArIGRfbGVhbm92ZXI7XG4gICAgICAgIFxuICAgICAgICAvLyBOaWNoZSBtb2RlIHNwZWNpZmljIHBlbmFsdGllc1xuICAgICAgICBpZiAoc2ltX21vZGUgPT09IFwibmljaGVcIikge1xuICAgICAgICAgICAgLy8gU3RhcnZhdGlvbiBwZW5hbHR5XG4gICAgICAgICAgICBpZiAodGhpcy5udXRyaWVudENvdW50IDw9IDAgJiYgbnVtQ2VsbHMgPiAxKSB7XG4gICAgICAgICAgICAgICAgcERlYXRoICs9IDAuMDU7IC8vIDUlIGZsYXQgaW5jcmVhc2UgaWYgc3RhcnZpbmdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInByb2JcIjogcERlYXRoLFxuICAgICAgICAgICAgXCJuYXR1cmFsXCI6IGRfbmF0dXJhbCxcbiAgICAgICAgICAgIFwiZW5lcmd5XCI6IGRfZW5lcmd5LFxuICAgICAgICAgICAgXCJsZWFub3ZlclwiOiBkX2xlYW5vdmVyLFxuICAgICAgICAgICAgXCJudXRyaWVudHNcIjogdGhpcy5udXRyaWVudENvdW50XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgeyBQbGFudCB9OyIsImltcG9ydCBzZWVkcmFuZG9tIGZyb20gXCJzZWVkcmFuZG9tXCI7XG5cbi8qKlxuICogU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIE1hdGgucmFuZG9tXG4gKiBAcGFyYW0geyp9IHNlZWQgZGF0YSB0byB1c2UgdG8gc2VlZCBhbGwgZnV0dXJlIFJORyBjYWxsc1xuICovXG5mdW5jdGlvbiBzZWVkUmFuZG9tKHNlZWQpe1xuICAgIHNlZWRyYW5kb20oc2VlZCwge2dsb2JhbDogdHJ1ZX0pO1xufVxuXG4vKipcbiAqIHJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIG1heCAoaW5jbHVzaXZlKVxuICogQHBhcmFtIHsqfSBtYXggbWF4aW11bSBpbnRlZ2VyIHRvIGdlbmVyYXRlIGFzIGEgcmFuZG9tIG51bWJlclxuICovXG5mdW5jdGlvbiByYW5kb21JbnQobWluLCBtYXgpe1xuICAgIC8vIG5vdGU6IE1hdGgucmFuZG9tIHJldHVybnMgYSByYW5kb20gbnVtYmVyIGV4Y2x1c2l2ZSBvZiAxLFxuICAgIC8vIHNvIHRoZXJlIGlzICsxIGluIHRoZSBiZWxvdyBlcXVhdGlvbiB0byBlbnN1cmUgdGhlIG1heGltdW1cbiAgICAvLyBudW1iZXIgaXMgY29uc2lkZXJlZCB3aGVuIGZsb29yaW5nIDAuOS4uLiByZXN1bHRzLlxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG4vKipcbiAqIEV2YWx1YXRlcyB0aGUgY2hhbmNlIG9mIGFuIGV2ZW50IGhhcHBlbmluZyBnaXZlbiBwcm9iXG4gKiBAcGFyYW0geyp9IHByb2IgZnJhY3Rpb24gYmV0d2VlbiAwIGFuZCAxIGNoYW5jZSBvZiB0aGUgZXZlbnQgaGFwcGVuaW5nXG4gKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBldmVudCBoYXBwZW5zLCBmYWxzZSBpZiBub3RcbiAqL1xuZnVuY3Rpb24gcmFuZG9tUHJvYihwcm9iKXtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8PSBwcm9iO1xufVxuXG5leHBvcnQge3NlZWRSYW5kb20sIHJhbmRvbUludCwgcmFuZG9tUHJvYn07IiwiaW1wb3J0ICogYXMgc3RhdHMgZnJvbSBcInN0YXRzLWxpdGVcIjtcblxuZnVuY3Rpb24gbGV2ZW5zaHRlaW4oYSwgYikge1xuICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGIubGVuZ3RoO1xuICAgIGlmIChiLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGEubGVuZ3RoO1xuICAgIGxldCBtYXRyaXggPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBiLmxlbmd0aDsgaSsrKSBtYXRyaXhbaV0gPSBbaV07XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPD0gYS5sZW5ndGg7IGorKykgbWF0cml4WzBdW2pdID0gajtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBiLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChiW2kgLSAxXSA9PT0gYVtqIC0gMV0pIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBtYXRyaXhbaSAtIDFdW2ogLSAxXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1baiAtIDFdICsgMSwgLy8gc3Vic3RpdHV0aW9uXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4W2ldW2ogLSAxXSArIDEsIC8vIGluc2VydGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4W2kgLSAxXVtqXSArIDEgIC8vIGRlbGV0aW9uXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRyaXhbYi5sZW5ndGhdW2EubGVuZ3RoXTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlQWxsZWxlRW50cm9weShwbGFudHMpIHtcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgY29uc3QgY291bnRzID0gbmV3IEFycmF5KDI1NikuZmlsbCgwKTtcbiAgICBsZXQgdG90YWwgPSAwO1xuICAgIHBsYW50cy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHAuZ2Vub21lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb3VudHNbcC5nZW5vbWVbaV1dKys7XG4gICAgICAgICAgICB0b3RhbCsrO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRvdGFsID09PSAwKSByZXR1cm4gMDtcbiAgICBsZXQgZW50cm9weSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICAgICAgICBpZiAoY291bnRzW2ldID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcCA9IGNvdW50c1tpXSAvIHRvdGFsO1xuICAgICAgICAgICAgZW50cm9weSAtPSBwICogTWF0aC5sb2cyKHApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbnRyb3B5O1xufVxuXG5jbGFzcyBTaW1EYXRhe1xuXG4gICAgY29uc3RydWN0b3Ioc2ltdWxhdGlvbil7XG4gICAgICAgIHRoaXMuc2ltID0gc2ltdWxhdGlvbjtcbiAgICAgICAgdGhpcy5kYXRhID0ge1wic3RlcG51bVwiOiBbXX07XG4gICAgICAgIHRoaXMubGFzdFN0ZXAgPSAwO1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMgPSBbXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicG9wdWxhdGlvblwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInVuaXF1ZV9nZW5vdHlwZXNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgICAgIHNpbS53b3JsZC5wbGFudHMuZm9yRWFjaChwID0+IHNlZW4uYWRkKHAuZ2Vub21lLnNlcmlhbGl6ZSgpKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlZW4uc2l6ZTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInRvdGFsX2NlbGxzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5jZWxsQ291bnQ7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfc2l6ZVwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5jZWxsQ291bnQgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19lbmVyZ2lzZWRcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgcC5lbmVyZ2lzZWRDb3VudCwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfYWN0aXZlX2dlbmVzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIChwLnJ1bGVzID8gcC5ydWxlcy5sZW5ndGggOiAwKSwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfYWdlXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIChzaW0uc3RlcG51bSAtIHAuYmlydGhTdGVwKSwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJ0b3RhbF9zZWVkc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0peyByZXR1cm4gc2ltLnN0YXRzLnRvdGFsU2VlZHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImZseWluZ19zZWVkc1wiLCBBc0lzLCBmdW5jdGlvbihzaW0peyByZXR1cm4gc2ltLnN0YXRzLmZseWluZ1NlZWRzOyB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJuZXdfcGxhbnRzXCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSl7IHJldHVybiBzaW0uc3RhdHMubmV3UGxhbnRzOyB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJkZWF0aHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXsgcmV0dXJuIHNpbS5zdGF0cy5kZWF0aHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF0dGFja3NcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXsgcmV0dXJuIHNpbS5zdGF0cy5hdHRhY2tzOyB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfZGVhdGhfcHJvYlwiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdW0gKyBwLmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLmxlYW5vdmVyX2ZhY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMuc2ltX21vZGVcbiAgICAgICAgICAgICAgICAgICAgKS5wcm9iO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX251dHJpZW50c1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLm51dHJpZW50Q291bnQsIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwic29pbF9udXRyaWVudHNcIiwgQXNJcywgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoIXNpbS53b3JsZC5zb2lsTnV0cmllbnRzIHx8IHNpbS53b3JsZC5zb2lsTnV0cmllbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQuc29pbE51dHJpZW50cy5yZWR1Y2UoKHN1bSwgbikgPT4gc3VtICsgbiwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnNvaWxOdXRyaWVudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX3RyYWl0c1wiLCBBc0lzLCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgbGVhbjogMSwgYXR0YWNrOiAxLCBlZmY6IDEsIGRlYXRoOiAxIH07XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWxzID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKGFjYywgcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhY2MubGVhbiArPSBwLnRyYWl0cy5sZWFub3ZlcjtcbiAgICAgICAgICAgICAgICAgICAgYWNjLmF0dGFjayArPSBwLnRyYWl0cy5hdHRhY2s7XG4gICAgICAgICAgICAgICAgICAgIGFjYy5lZmYgKz0gcC50cmFpdHMuZWZmaWNpZW5jeTtcbiAgICAgICAgICAgICAgICAgICAgYWNjLmRlYXRoICs9IHAudHJhaXRzLmRlYXRoO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sIHsgbGVhbjogMCwgYXR0YWNrOiAwLCBlZmY6IDAsIGRlYXRoOiAwIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG4gPSBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBsZWFuOiB0b3RhbHMubGVhbiAvIG4sXG4gICAgICAgICAgICAgICAgICAgIGF0dGFjazogdG90YWxzLmF0dGFjayAvIG4sXG4gICAgICAgICAgICAgICAgICAgIGVmZjogdG90YWxzLmVmZiAvIG4sXG4gICAgICAgICAgICAgICAgICAgIGRlYXRoOiB0b3RhbHMuZGVhdGggLyBuXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuY2VsbHMubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbm9tZV9zaXplX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbihzaW0pe1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFswXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5tYXAocCA9PiBwLmdlbm9tZS5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwibXV0X2V4cF9cIiwgU3VtbWFyeSwgZnVuY3Rpb24oc2ltKXtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5nZW5vbWUubXV0X2V4cCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwbGFudF9oZWlnaHRfXCIsIFN1bW1hcnksIGZ1bmN0aW9uKHNpbSl7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1heEggPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHAuY2VsbHMubGVuZ3RoOyBpKyspIGlmIChwLmNlbGxzW2ldLnkgPiBtYXhIKSBtYXhIID0gcC5jZWxsc1tpXS55O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF4SDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbmV0aWNfZGlzdGFuY2VfbWVhblwiLCBBc0lzLCBmdW5jdGlvbihzaW0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGFudHMgPSBzaW0ud29ybGQucGxhbnRzO1xuICAgICAgICAgICAgICAgIGlmIChwbGFudHMubGVuZ3RoIDwgMikgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgbGV0IHN1bURpc3QgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBzYW1wbGVTaXplID0gTWF0aC5taW4oMzAsIHBsYW50cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGxldCBwYWlycyA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzYW1wbGVTaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcDEgPSBwbGFudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGxhbnRzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwMiA9IHBsYW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwbGFudHMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwMSAhPT0gcDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bURpc3QgKz0gbGV2ZW5zaHRlaW4ocDEuZ2Vub21lLCBwMi5nZW5vbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFpcnMrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFpcnMgPiAwID8gc3VtRGlzdCAvIHBhaXJzIDogMDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImFsbGVsZV9lbnRyb3B5XCIsIEFzSXMsIGZ1bmN0aW9uKHNpbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxjdWxhdGVBbGxlbGVFbnRyb3B5KHNpbS53b3JsZC5wbGFudHMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb2xsZWN0IGRhdGEgZm9yIHRoZSBjdXJyZW50IHN0ZXBcbiAgICAgKi9cbiAgICByZWNvcmRTdGVwKCl7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gdGhpcy5zaW0uc3RlcG51bSAtIHRoaXMubGFzdFN0ZXA7XG4gICAgICAgIHRoaXMubGFzdFN0ZXAgPSB0aGlzLnNpbS5zdGVwbnVtO1xuXG4gICAgICAgIHZhciBzdGVwRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMuZm9yRWFjaChmdW5jdGlvbihjKXtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBjLmNvbGxlY3QodGhpcy5zaW0pO1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihzdGVwRGF0YSwgdmFsdWVzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gTm9ybWFsaXplIHJhdGUtYmFzZWQgbWV0cmljcyBieSB0aGUgbnVtYmVyIG9mIHN0ZXBzIHNpbmNlIHRoZSBsYXN0IHJlY29yZFxuICAgICAgICBpZiAoZGVsdGEgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCByYXRlS2V5cyA9IFtcIm5ld19wbGFudHNcIiwgXCJkZWF0aHNcIiwgXCJhdHRhY2tzXCIsIFwidG90YWxfc2VlZHNcIiwgXCJmbHlpbmdfc2VlZHNcIl07XG4gICAgICAgICAgICByYXRlS2V5cy5mb3JFYWNoKGsgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdGVwRGF0YVtrXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ZXBEYXRhW2tdIC89IGRlbHRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgaW5jcmVtZW50YWwgc3RhdHMgZm9yIHRoZSBuZXh0IGludGVydmFsXG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLm5ld1BsYW50cyA9IDA7XG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLmRlYXRocyA9IDA7XG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLmF0dGFja3MgPSAwO1xuICAgICAgICB0aGlzLnNpbS5zdGF0cy50b3RhbFNlZWRzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMuZmx5aW5nU2VlZHMgPSAwO1xuXG4gICAgICAgIHRoaXMuZGF0YVtcInN0ZXBudW1cIl0ucHVzaCh0aGlzLnNpbS5zdGVwbnVtKTtcbiAgICAgICAgaWYgKHRoaXMuZGF0YVtcInN0ZXBudW1cIl0ubGVuZ3RoID4gU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YVtcInN0ZXBudW1cIl0uc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBPYmplY3Qua2V5cyhzdGVwRGF0YSkuZm9yRWFjaChmdW5jdGlvbihrKXtcbiAgICAgICAgICAgIGlmICghKGsgaW4gdGhpcy5kYXRhKSl7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhW2tdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRhdGFba10ucHVzaChzdGVwRGF0YVtrXSk7XG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhW2tdLmxlbmd0aCA+IFNpbURhdGEuTUFYX0RBVEFfUE9JTlRTKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhW2tdLnNoaWZ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn1cblNpbURhdGEuTUFYX0RBVEFfUE9JTlRTID0gNTAwO1xuXG5jbGFzcyBDb2xsZWN0b3J7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZWNscywgY29sbGVjdEZ1bmMpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnR5cGUgPSBuZXcgdHlwZWNscyhuYW1lKTtcbiAgICAgICAgdGhpcy5mdW5jID0gY29sbGVjdEZ1bmM7XG4gICAgfVxuXG4gICAgY29sbGVjdChzaW0pe1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZnVuYyhzaW0pO1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnRyYW5zZm9ybShkYXRhKTtcbiAgICB9XG59XG5cbmNsYXNzIENvbGxlY3RvclR5cGV7XG4gICAgY29uc3RydWN0b3IobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZCBtZXRob2RcIik7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtKGRhdGEpe1xuICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy50cmFuc2Zvcm1EYXRhKGRhdGEpO1xuICAgICAgICB2YXIgdHJhbnNmb3JtZWRfZGF0YSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgICAgICB0cmFuc2Zvcm1lZF9kYXRhW3RoaXMubmFtZSArIGtdID0gdmFsdWVzW2tdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkX2RhdGE7XG4gICAgfVxufVxuXG5jbGFzcyBBc0lzIGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpe1xuICAgICAgICByZXR1cm4ge1wiXCI6IGRhdGF9O1xuICAgIH1cbn1cblxuY2xhc3MgU3VtbWFyeSBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKXtcbiAgICAgICAgcmV0dXJuIHtcIm1pblwiOiBNYXRoLm1pbihkYXRhKSwgXCJtZWFuXCI6IHN0YXRzLm1lYW4oZGF0YSksIFwibWF4XCI6IE1hdGgubWF4KGRhdGEpfTtcbiAgICB9XG59XG5leHBvcnQge1NpbURhdGF9OyIsImltcG9ydCB7c2VlZFJhbmRvbSwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1dvcmxkfSBmcm9tIFwiLi93b3JsZC5qc1wiO1xuaW1wb3J0IHtCeXRlQXJyYXksIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9IGZyb20gXCIuL2dlbm9tZS5qc1wiO1xuXG5jbGFzcyBTaW11bGF0aW9uUGFyYW1ze1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcz17fSl7XG4gICAgICAgIHRoaXMucmFuZG9tX3NlZWQgPSAxO1xuICAgICAgICB0aGlzLnJlY29yZF9pbnRlcnZhbCA9IDEwO1xuICAgICAgICB0aGlzLnN0ZXBzX3Blcl9mcmFtZSA9IDE7XG4gICAgICAgIHRoaXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWwgPSAwO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX3N0cmVuZ3RoID0gMC4xO1xuXG4gICAgICAgIHRoaXMud29ybGRfd2lkdGggPSAyNTA7XG4gICAgICAgIHRoaXMud29ybGRfaGVpZ2h0ID0gNDA7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9wb3B1bGF0aW9uID0gMjUwO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmVyZ3lfcHJvYiA9IDAuNTtcblxuICAgICAgICAvLyBkZWF0aCBwYXJhbXNcbiAgICAgICAgdGhpcy5kZWF0aF9mYWN0b3IgPSAwLjI7XG4gICAgICAgIHRoaXMubmF0dXJhbF9leHAgPSAwO1xuICAgICAgICB0aGlzLmVuZXJneV9leHAgPSAtMi41O1xuICAgICAgICB0aGlzLmxlYW5vdmVyX2ZhY3RvciA9IDAuMjtcblxuICAgICAgICAvLyBtdXRhdGlvbnNcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZV9tb2RlID0gXCJieXRld2lzZVwiO1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlID0gMC4wMDI7XG4gICAgICAgIHRoaXMubXV0X2luc2VydCA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZGVsZXRlID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9mYWN0b3IgPSAxLjU7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9tdXRfZXhwID0gMDtcblxuICAgICAgICB0aGlzLmdlbm9tZV9pbnRlcnByZXRlciA9IFwicHJvbW90b3JcIjtcbiAgICAgICAgdGhpcy5pbml0aWFsX2dlbm9tZV9sZW5ndGggPSA0MDA7XG5cbiAgICAgICAgLy8gTW9kZSBzZWxlY3Rpb25cbiAgICAgICAgdGhpcy5zaW1fbW9kZSA9IFwibmljaGVcIjsgLy8gXCJjbGFzc2ljXCIgb3IgXCJuaWNoZVwiXG5cbiAgICAgICAgLy8gTmljaGUgbW9kZTogTnV0cmllbnRzXG4gICAgICAgIHRoaXMubnV0cmllbnRfbWF4ID0gMTAwLjA7XG4gICAgICAgIHRoaXMubnV0cmllbnRfcmVwbGVuaXNoX3JhdGUgPSAxLjA7XG4gICAgICAgIHRoaXMubnV0cmllbnRfZXh0cmFjdF9yYXRlID0gNS4wO1xuICAgICAgICB0aGlzLm51dHJpZW50X21haW50ZW5hbmNlX2Nvc3QgPSAwLjA1OyAvLyBwZXIgY2VsbCBwZXIgc3RlcFxuICAgICAgICB0aGlzLm51dHJpZW50X2RpdmlkZV9jb3N0ID0gMTAuMDtcblxuICAgICAgICAvLyBkaXZpZGUsIGZseWluZ3NlZWQsIGxvY2Fsc2VlZCwgbXV0KywgbXV0LSwgc3RhdGViaXRcbiAgICAgICAgdGhpcy5hY3Rpb25fbWFwID0gWzIwMCwgMjAsIDAsIDE4LCAxOCwgMF07XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBwYXJhbXMpO1xuICAgIH1cbn1cblxuY2xhc3MgU2ltdWxhdGlvbiB7XG4gICAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgICAgIC8vIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byByYW5kb21cbiAgICAgICAgLy8gdGhpcyBtYWtlcyBvdXQgdGVzdHMgcmVwcm9kdWNpYmxlIGdpdmVuIHRoZSBzYW1lIHNlZWQgaXMgdXNlZFxuICAgICAgICAvLyBpbiBmdXR1cmUgaW5wdXQgcGFyYW1ldGVyc1xuICAgICAgICBzZWVkUmFuZG9tKHRoaXMucGFyYW1zLnJhbmRvbV9zZWVkKTtcblxuICAgICAgICB0aGlzLndvcmxkID0gbmV3IFdvcmxkKHRoaXMucGFyYW1zLndvcmxkX3dpZHRoLCB0aGlzLnBhcmFtcy53b3JsZF9oZWlnaHQpO1xuICAgICAgICBcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBudXRyaWVudHMgaW4gTmljaGUgbW9kZVxuICAgICAgICBpZiAodGhpcy5wYXJhbXMuc2ltX21vZGUgPT09IFwibmljaGVcIikge1xuICAgICAgICAgICAgdGhpcy53b3JsZC5pbml0TnV0cmllbnRzKHRoaXMucGFyYW1zLm51dHJpZW50X21heCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdlbm9tZUludGVycHJldGVyID0gdGhpcy5nZXRJbnRlcnByZXRlcigpO1xuICAgICAgICB0aGlzLm11dF91bml0cyA9IDE7XG4gICAgICAgIHRoaXMuc3RlcG51bSA9IDA7XG4gICAgICAgIHRoaXMuc3RhdHMgPSB7IFxuICAgICAgICAgICAgYXR0YWNrczogMCwgXG4gICAgICAgICAgICBkZWF0aHM6IDAsIFxuICAgICAgICAgICAgdG90YWxTZWVkczogMCwgXG4gICAgICAgICAgICBmbHlpbmdTZWVkczogMCwgXG4gICAgICAgICAgICBuZXdQbGFudHM6IDAgXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy53b3JsZC5vblBsYW50QmlydGggPSAoKSA9PiB7IHRoaXMuc3RhdHMubmV3UGxhbnRzKys7IH07XG4gICAgICAgIHRoaXMud29ybGQub25QbGFudERlYXRoID0gKCkgPT4geyB0aGlzLnN0YXRzLmRlYXRocysrOyB9O1xuICAgICAgICB0aGlzLndvcmxkLm9uQXR0YWNrID0gKCkgPT4geyB0aGlzLnN0YXRzLmF0dGFja3MrKzsgfTtcbiAgICB9XG5cbiAgICBnZXRJbnRlcnByZXRlcigpe1xuICAgICAgICBzd2l0Y2ggKHRoaXMucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcil7XG4gICAgICAgIGNhc2UgXCJwcm9tb3RvclwiOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9tb3RvckludGVycHJldGVyKHRoaXMucGFyYW1zLmFjdGlvbl9tYXApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGludGVycHJldGVyICR7dGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyfWApO1xuICAgICAgICB9ICBcbiAgICB9XG5cbiAgICBpbml0X3BvcHVsYXRpb24oKXtcbiAgICAgICAgLy8gcmFuZG9tbHkgY2hvb3NlIHNwb3RzIHRvIHNlZWQgdGhlIHdvcmxkIHdpdGhcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMubmV3U2VlZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGlzZSB0aGUgcG9wdWxhdGlvbiBmcm9tIGEgbGlzdCBvZiBzZXJpYWxpemVkIGdlbm9tZSBzdHJpbmdzLFxuICAgICAqIGRyYXdpbmcgd2l0aCByZXBsYWNlbWVudCB1cCB0byBpbml0aWFsX3BvcHVsYXRpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2VyaWFsaXplZEdlbm9tZXNcbiAgICAgKi9cbiAgICBpbml0X3BvcHVsYXRpb25fZnJvbV9nZW5vbWVzKHNlcmlhbGl6ZWRHZW5vbWVzKXtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRoaXMucGFyYW1zLmluaXRpYWxfcG9wdWxhdGlvbjsgaSsrKXtcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IHNlcmlhbGl6ZWRHZW5vbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlcmlhbGl6ZWRHZW5vbWVzLmxlbmd0aCldO1xuICAgICAgICAgICAgY29uc3QgZ2Vub21lID0gQnl0ZUFycmF5LmRlc2VyaWFsaXplKHN0cik7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lLCBudWxsLCB0aGlzLnN0ZXBudW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3U2VlZCgpe1xuICAgICAgICAvLyBjcmVhdGUgYSByYW5kb20gZ2Vub21lXG4gICAgICAgIHZhciBnZW5vbWUgPSBCeXRlQXJyYXkucmFuZG9tKHRoaXMucGFyYW1zLmluaXRpYWxfZ2Vub21lX2xlbmd0aCk7XG4gICAgICAgIHRoaXMud29ybGQuc2VlZChnZW5vbWUsIG51bGwsIHRoaXMuc3RlcG51bSk7XG4gICAgfVxuXG4gICAgc3RlcCgpe1xuICAgICAgICB0aGlzLnN0ZXBudW0rKztcbiAgICAgICAgaWYgKHRoaXMucGFyYW1zLnNpbV9tb2RlID09PSBcIm5pY2hlXCIpIHtcbiAgICAgICAgICAgIHRoaXMud29ybGQucmVwbGVuaXNoTnV0cmllbnRzKHRoaXMucGFyYW1zLm51dHJpZW50X3JlcGxlbmlzaF9yYXRlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNpbXVsYXRlRGVhdGgoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUxpZ2h0KCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMubXV0YXRlKCk7XG4gICAgfVxuXG4gICAgc2ltdWxhdGVBY3Rpb25zKCl7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53b3JsZC5wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gdGhpcy53b3JsZC5wbGFudHNbaV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5pY2hlIG1ldGFib2xpc21cbiAgICAgICAgICAgIHBsYW50Lm1ldGFib2xpc20odGhpcy5wYXJhbXMpO1xuXG4gICAgICAgICAgICBpZiAoIXBsYW50LnJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgcGxhbnQucnVsZXMgPSB0aGlzLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUsIHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJ1bGVzID0gcGxhbnQucnVsZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBsYW50LmNlbGxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsQWN0aW9uKHBsYW50LmNlbGxzW2pdLCBydWxlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjZWxsQWN0aW9uKGNlbGwsIHJ1bGVzKXtcbiAgICAgICAgdmFyIHN0YXRlID0gY2VsbC5wbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSl7XG4gICAgICAgICAgICAvLyBleGVjdXRlIG9uZSBhY3Rpb24gdXNpbmcgdGhlIGZpcnN0IG1hdGNoaW5nIHJ1bGVcbiAgICAgICAgICAgIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgICAgICAvLyBUcmFjayBzZWVkc1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkZseWluZ1NlZWRcIikgc2VsZi5zdGF0cy5mbHlpbmdTZWVkcysrO1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkZseWluZ1NlZWRcIiB8fCBydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkxvY2FsU2VlZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3RhdHMudG90YWxTZWVkcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBydWxlLmFjdGlvbi5leGVjdXRlKGNlbGwsIHNlbGYuc3RlcG51bSwgc2VsZi5wYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgY2VsbC51cGRhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIG11dGF0ZSgpe1xuICAgICAgICB2YXIgbXV0YXRvciA9IG5ldyBNdXRhdG9yKHRoaXMucGFyYW1zLm11dF9mYWN0b3IsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlLCBcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLm11dF9pbnNlcnQsIHRoaXMucGFyYW1zLm11dF9kZWxldGUsIFxuICAgICAgICAgICAgMCwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2VfbW9kZSwgdGhpcy5tdXRfdW5pdHMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud29ybGQucGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHRoaXMud29ybGQucGxhbnRzW2ldO1xuICAgICAgICAgICAgaWYgKG11dGF0b3IubXV0YXRlKHBsYW50Lmdlbm9tZSkpIHtcbiAgICAgICAgICAgICAgICBwbGFudC5ydWxlcyA9IG51bGw7IC8vIEludmFsaWRhdGUgY2FjaGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSBlYWNoIHBsYW50J3MgY3VycmVudCBkZWF0aCBwcm9iYWJpbGl0eSB0byBzaW11bGF0ZVxuICAgICAqIHdoZXRoZXIgZWFjaCBwbGFudCBkaWVzIG9uIHRoaXMgc3RlcFxuICAgICAqL1xuICAgIHNpbXVsYXRlRGVhdGgoKXtcbiAgICAgICAgY29uc3QgZGVhZF9wbGFudHMgPSBbXTtcbiAgICAgICAgY29uc3QgcGxhbnRzID0gdGhpcy53b3JsZC5wbGFudHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHBsYW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGRlYXRoUHJvYiA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubGVhbm92ZXJfZmFjdG9yXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHJhbmRvbVByb2IoZGVhdGhQcm9iLnByb2IpKXtcbiAgICAgICAgICAgICAgICBkZWFkX3BsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlYWRfcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChkZWFkX3BsYW50c1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaW11bGF0ZSBsaWdodC4gU3VubGlnaHQgdHJhdmVyc2VzIGZyb20gdGhlIGNlaWxpbmcgb2YgdGhlIHdvcmxkXG4gICAgICogZG93bndhcmRzIHZlcnRpY2FsbHkuIEl0IGlzIGNhdWdodCBieSBhIHBsYW50IGNlbGwgd2l0aCBhIHByb2JhYmlsaXR5XG4gICAgICogd2hpY2ggY2F1c2VzIHRoYXQgY2VsbCB0byBiZSBlbmVyZ2lzZWQuXG4gICAgICovXG4gICAgc2ltdWxhdGVMaWdodCgpe1xuICAgICAgICBjb25zdCBjb2xUb3BzID0gbmV3IEludDE2QXJyYXkodGhpcy53b3JsZC53aWR0aCkuZmlsbCgtMSk7XG4gICAgICAgIGNvbnN0IHBsYW50cyA9IHRoaXMud29ybGQucGxhbnRzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2VsbHMgPSBwbGFudHNbaV0uY2VsbHM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNlbGxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IGNlbGxzW2pdO1xuICAgICAgICAgICAgICAgIGlmIChjZWxsLnkgPiBjb2xUb3BzW2NlbGwueF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29sVG9wc1tjZWxsLnhdID0gY2VsbC55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihsZXQgeD0wOyB4PHRoaXMud29ybGQud2lkdGg7IHgrKyl7XG4gICAgICAgICAgICBjb25zdCB0b3BZID0gY29sVG9wc1t4XTtcbiAgICAgICAgICAgIGlmICh0b3BZID09PSAtMSkgY29udGludWU7XG5cbiAgICAgICAgICAgIGZvcihsZXQgeT10b3BZOyB5Pj0wOyB5LS0pe1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3ldO1xuICAgICAgICAgICAgICAgIGlmKGNlbGwgIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICBpZihyYW5kb21Qcm9iKHRoaXMucGFyYW1zLmVuZXJneV9wcm9iKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsLmVuZXJnaXNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHtTaW11bGF0aW9uLCBTaW11bGF0aW9uUGFyYW1zfTsiLCJpbXBvcnQge1NpbXVsYXRpb24sIFNpbXVsYXRpb25QYXJhbXN9IGZyb20gXCIuL3NpbXVsYXRpb24uanNcIjtcbmltcG9ydCB7U2ltRGF0YX0gZnJvbSBcIi4vc2ltZGF0YS5qc1wiO1xuXG5sZXQgc2ltdWxhdGlvbiA9IG51bGw7XG5sZXQgZGF0YSA9IG51bGw7XG5sZXQgcnVubmluZyA9IGZhbHNlO1xubGV0IGNlbGxTaXplID0gMjtcbmNvbnN0IFRBUkdFVF9GUFMgPSA2MDtcbmNvbnN0IEZSQU1FX0lOVEVSVkFMX01TID0gMTAwMCAvIFRBUkdFVF9GUFM7XG5sZXQgbGFzdEZyYW1lVGltZSA9IDA7XG5sZXQgbGFzdFN0YXRzVGltZSA9IDA7XG5jb25zdCBTVEFUU19JTlRFUlZBTF9NUyA9IDEwMDtcblxuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGNvbnN0IG1zZyA9IGV2ZW50LmRhdGE7XG4gICAgc3dpdGNoIChtc2cudHlwZSkge1xuICAgIGNhc2UgXCJpbml0XCI6XG4gICAgICAgIGluaXRTaW0obXNnLnBhcmFtcywgbXNnLmdlbm9tZXMgfHwgbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgbG9vcCgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RvcFwiOlxuICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdGVwXCI6XG4gICAgICAgIGRvU3RlcCgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgcHVzaFN0YXRzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJnZXRDZWxsXCI6XG4gICAgICAgIHNlbmRDZWxsSW5mbyhtc2cueCwgbXNnLnkpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZGlzdHVyYlwiOlxuICAgICAgICBhcHBseURpc3R1cmJhbmNlKG1zZy5zdHJlbmd0aCk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwia2lsbENlbGxcIjpcbiAgICAgICAga2lsbENlbGxBdChtc2cueCwgbXNnLnkpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInVwZGF0ZURpc3BsYXlQYXJhbXNcIjpcbiAgICAgICAgaWYgKHNpbXVsYXRpb24gJiYgc2ltdWxhdGlvbi5wYXJhbXMpIHtcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnN0ZXBzX3Blcl9mcmFtZSA9IG1zZy5zdGVwc19wZXJfZnJhbWU7XG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5yZWNvcmRfaW50ZXJ2YWwgPSBtc2cucmVjb3JkX2ludGVydmFsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJleHBvcnRcIjpcbiAgICAgICAgZXhwb3J0R2Vub21lcygpO1xuICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBpbml0U2ltKHBhcmFtcywgaW1wb3J0ZWRHZW5vbWVzPW51bGwpIHtcbiAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgY29uc3Qgc2ltX3BhcmFtcyA9IG5ldyBTaW11bGF0aW9uUGFyYW1zKHBhcmFtcyk7XG4gICAgY2VsbFNpemUgPSBwYXJhbXMuY2VsbFNpemUgfHwgODtcbiAgICBzaW11bGF0aW9uID0gbmV3IFNpbXVsYXRpb24oc2ltX3BhcmFtcyk7XG4gICAgZGF0YSA9IG5ldyBTaW1EYXRhKHNpbXVsYXRpb24pO1xuICAgIGlmIChpbXBvcnRlZEdlbm9tZXMgJiYgaW1wb3J0ZWRHZW5vbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2ltdWxhdGlvbi5pbml0X3BvcHVsYXRpb25fZnJvbV9nZW5vbWVzKGltcG9ydGVkR2Vub21lcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2ltdWxhdGlvbi5pbml0X3BvcHVsYXRpb24oKTtcbiAgICB9XG4gICAgcHVzaEZyYW1lKCk7XG4gICAgcHVzaFN0YXRzKCk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKSB7XG4gICAgaWYgKCFydW5uaW5nKSByZXR1cm47XG5cbiAgICBjb25zdCBzcGYgPSBzaW11bGF0aW9uLnBhcmFtcy5zdGVwc19wZXJfZnJhbWU7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGY7IGkrKykge1xuICAgICAgICBkb1N0ZXAoKTtcbiAgICB9XG5cbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSBsYXN0RnJhbWVUaW1lID49IEZSQU1FX0lOVEVSVkFMX01TKSB7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBsYXN0RnJhbWVUaW1lID0gbm93O1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQobG9vcCwgMCk7XG59XG5cbmZ1bmN0aW9uIGRvU3RlcCgpIHtcbiAgICBzaW11bGF0aW9uLnN0ZXAoKTtcblxuICAgIC8vIFBlcmlvZGljIGRpc3R1cmJhbmNlXG4gICAgY29uc3QgZGkgPSBzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9pbnRlcnZhbDtcbiAgICBpZiAoZGkgPiAwICYmIHNpbXVsYXRpb24uc3RlcG51bSAlIGRpID09PSAwKSB7XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2Uoc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChzaW11bGF0aW9uLnN0ZXBudW0gJSBzaW11bGF0aW9uLnBhcmFtcy5yZWNvcmRfaW50ZXJ2YWwgPT09IDAgfHwgc2ltdWxhdGlvbi5zdGVwbnVtID09PSAxKSB7XG4gICAgICAgIGRhdGEucmVjb3JkU3RlcCgpO1xuICAgICAgICBwdXNoU3RhdHMoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHB1c2hTdGF0cygpIHtcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJzdGF0c1wiLFxuICAgICAgICBkYXRhOiBkYXRhLmRhdGEsXG4gICAgICAgIHN0ZXBudW06IHNpbXVsYXRpb24uc3RlcG51bVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseURpc3R1cmJhbmNlKHN0cmVuZ3RoKSB7XG4gICAgY29uc3Qgd29ybGQgPSBzaW11bGF0aW9uLndvcmxkO1xuICAgIGNvbnN0IHBsYW50cyA9IHdvcmxkLnBsYW50cztcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGNvbnN0IG51bVRvS2lsbCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3Ioc3RyZW5ndGggKiBwbGFudHMubGVuZ3RoKSk7XG4gICAgLy8gU2h1ZmZsZSBhIHNhbXBsZSBhbmQga2lsbFxuICAgIGNvbnN0IHNodWZmbGVkID0gcGxhbnRzLnNsaWNlKCkuc29ydCgoKSA9PiBNYXRoLnJhbmRvbSgpIC0gMC41KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRvS2lsbCAmJiBpIDwgc2h1ZmZsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2hlY2sgcGxhbnQgc3RpbGwgYWxpdmUgKG5vdCBraWxsZWQgYnkgcHJldmlvdXMgaXRlcmF0aW9uKVxuICAgICAgICBpZiAod29ybGQucGxhbnRzLmluY2x1ZGVzKHNodWZmbGVkW2ldKSkge1xuICAgICAgICAgICAgd29ybGQua2lsbFBsYW50KHNodWZmbGVkW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24ga2lsbENlbGxBdCh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoY2VsbCAmJiBjZWxsLnBsYW50KSB7XG4gICAgICAgIHNpbXVsYXRpb24ud29ybGQua2lsbFBsYW50KGNlbGwucGxhbnQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZXhwb3J0R2Vub21lcygpIHtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgIHNpbXVsYXRpb24ud29ybGQucGxhbnRzLmZvckVhY2gocGxhbnQgPT4ge1xuICAgICAgICBzZWVuLmFkZChwbGFudC5nZW5vbWUuc2VyaWFsaXplKCkpO1xuICAgIH0pO1xuICAgIGNvbnN0IGdlbm9tZXMgPSBBcnJheS5mcm9tKHNlZW4pO1xuICAgIGNvbnN0IGV4cG9ydEJ1bmRsZSA9IHtcbiAgICAgICAgYWN0aW9uX21hcDogc2ltdWxhdGlvbi5wYXJhbXMuYWN0aW9uX21hcCxcbiAgICAgICAgZ2Vub21lX2ludGVycHJldGVyOiBzaW11bGF0aW9uLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIsXG4gICAgICAgIGdlbm9tZXNcbiAgICB9O1xuICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImV4cG9ydGVkR2Vub21lc1wiLCBidW5kbGU6IGV4cG9ydEJ1bmRsZSB9KTtcbn1cblxuZnVuY3Rpb24gcHVzaEZyYW1lKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpO1xuICAgIC8vIFRyYW5zZmVyIG93bmVyc2hpcCBvZiB0aGUgQXJyYXlCdWZmZXIgZm9yIHplcm8tY29weSBwZXJmb3JtYW5jZVxuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcImZyYW1lXCIsXG4gICAgICAgIGJ1ZmZlcjogcmVzdWx0LmJ1ZmZlci5idWZmZXIsXG4gICAgICAgIHdpZHRoOiByZXN1bHQud2lkdGgsXG4gICAgICAgIGhlaWdodDogcmVzdWx0LmhlaWdodCxcbiAgICAgICAgY2VsbENvdW50OiByZXN1bHQuY2VsbENvdW50LFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9LCBbcmVzdWx0LmJ1ZmZlci5idWZmZXJdKTtcbn1cblxuZnVuY3Rpb24gc2VuZENlbGxJbmZvKHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmICghY2VsbCB8fCAhY2VsbC5wbGFudCB8fCAhY2VsbC5wbGFudC5nZW5vbWUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBsYW50ID0gY2VsbC5wbGFudDtcbiAgICAgICAgY29uc3QgcnVsZXMgPSBzaW11bGF0aW9uLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUsIHBsYW50KTtcblxuICAgICAgICAvLyBVc2UgdGhlIGNvcnJlY3Qgc3RhdGVcbiAgICAgICAgbGV0IGNlbGxTdGF0ZSA9IHBsYW50LmdldFN0YXRlKGNlbGwpO1xuICAgICAgICBjb25zdCBuZWlnaGJvdXJob29kID0gcGxhbnQuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgY29uc3QgZW5lcmdpc2VkID0gY2VsbC5lbmVyZ2lzZWQ7XG5cbiAgICAgICAgLy8gU2VyaWFsaXplIHJ1bGVzIGFzIHN0cnVjdHVyZWQgb2JqZWN0cyBmb3IgcmljaCBVSSByZW5kZXJpbmdcbiAgICAgICAgY29uc3Qgc2VyaWFsaXplZFJ1bGVzID0gcnVsZXMubWFwKChyLCBpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gci5tYXRjaGVzKGNlbGxTdGF0ZSk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb25TdHIgPSByLmFjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgY29uc3QgaXNEaXYgPSBhY3Rpb25TdHIuc3RhcnRzV2l0aChcImRpdmlkZVwiKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgICAgbWF0Y2hlcyxcbiAgICAgICAgICAgICAgICBzdGF0ZTogci5zdGF0ZSxcbiAgICAgICAgICAgICAgICBlcU1hc2s6IHIuZXFNYXNrLFxuICAgICAgICAgICAgICAgIGFjdGlvblR5cGU6IGlzRGl2ID8gXCJkaXZpZGVcIiA6IGFjdGlvblN0cixcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGlzRGl2ID8gci5hY3Rpb24uZ2V0RGlyZWN0aW9uKCkgOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdSdWxlSW5kZXggPSBzZXJpYWxpemVkUnVsZXMuZmluZEluZGV4KHIgPT4gci5tYXRjaGVzKTtcblxuICAgICAgICBjb25zdCBkZWF0aCA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5uYXR1cmFsX2V4cCxcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3IsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5zaW1fbW9kZVxuICAgICAgICApO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6IFwiY2VsbEluZm9cIixcbiAgICAgICAgICAgIGZvdW5kOiB0cnVlLFxuICAgICAgICAgICAgY2VsbFN0cjogY2VsbC50b1N0cmluZygpLFxuICAgICAgICAgICAgbmVpZ2hib3VyaG9vZCxcbiAgICAgICAgICAgIGVuZXJnaXNlZCxcbiAgICAgICAgICAgIGNlbGxTdGF0ZSxcbiAgICAgICAgICAgIG1hdGNoaW5nUnVsZUluZGV4LFxuICAgICAgICAgICAgZGVhdGg6IEpTT04uc3RyaW5naWZ5KGRlYXRoKSxcbiAgICAgICAgICAgIGdlbm9tZUxlbmd0aDogcGxhbnQuZ2Vub21lLmxlbmd0aCxcbiAgICAgICAgICAgIG11dEV4cDogcGxhbnQuZ2Vub21lLm11dF9leHAsXG4gICAgICAgICAgICBydWxlczogc2VyaWFsaXplZFJ1bGVzLFxuICAgICAgICAgICAgaW50ZXJwcmV0ZXJUeXBlOiBzaW11bGF0aW9uLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIsXG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY2VsbEluZm9cIiwgZm91bmQ6IGZhbHNlLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7cmFuZG9tSW50fSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7UGxhbnR9IGZyb20gXCIuL3BsYW50LmpzXCI7XG5pbXBvcnQgeyBDZWxsIH0gZnJvbSBcIi4vY2VsbC5qc1wiO1xuXG5jbGFzcyBXb3JsZCB7XG4gICAgY29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCl7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5jZWxscyA9IFtdO1xuICAgICAgICAvLyBpbml0aWFsaXNlIHRoZSB3b3JsZCBsYXR0aWNlIHRvIGFsbCBudWxsc1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLndpZHRoOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5jZWxscy5wdXNoKFtdKTtcbiAgICAgICAgICAgIGZvcih2YXIgaj0wOyBqPHRoaXMuaGVpZ2h0OyBqKyspe1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbHNbaV1bal0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGFudHMgPSBbXTtcbiAgICAgICAgdGhpcy5jZWxsQ291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMub25QbGFudEJpcnRoID0gbnVsbDtcbiAgICAgICAgdGhpcy5vblBsYW50RGVhdGggPSBudWxsO1xuICAgICAgICB0aGlzLm9uQXR0YWNrID0gbnVsbDtcblxuICAgICAgICB0aGlzLnNvaWxOdXRyaWVudHMgPSBbXTtcbiAgICAgICAgdGhpcy5udXRyaWVudE1heCA9IDA7XG4gICAgfVxuXG4gICAgaW5pdE51dHJpZW50cyhtYXgpIHtcbiAgICAgICAgdGhpcy5udXRyaWVudE1heCA9IG1heDtcbiAgICAgICAgdGhpcy5zb2lsTnV0cmllbnRzID0gbmV3IEFycmF5KHRoaXMud2lkdGgpLmZpbGwobWF4KTtcbiAgICB9XG5cbiAgICByZXBsZW5pc2hOdXRyaWVudHMocmF0ZSkge1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgdGhpcy5zb2lsTnV0cmllbnRzW3hdID0gTWF0aC5taW4odGhpcy5udXRyaWVudE1heCwgdGhpcy5zb2lsTnV0cmllbnRzW3hdICsgcmF0ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyBhcnJheSBvZiB4IHBvc2l0aW9ucyBhdCB5PTAgd2hlcmUgbm8gY2VsbCBleGlzdHNcbiAgICAgKi9cbiAgICBnZXRGbG9vclNwYWNlKCl7XG4gICAgICAgIHZhciBlbXB0eVNwYWNlcyA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLndpZHRoOyBpKyspe1xuICAgICAgICAgICAgaWYodGhpcy5jZWxsc1tpXVswXSA9PT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZW1wdHlTcGFjZXMucHVzaChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZW1wdHlTcGFjZXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RyYXRlZ2llcyBmb3Igc293aW5nIGEgc2VlZCBvbiB0aGUgd29ybGQgZmxvb3JcbiAgICAgKiBAcGFyYW0geyp9IGdlbm9tZSB0aGUgZ2Vub21lIHVzZWQgYnkgdGhlIG5ldyBzZWVkXG4gICAgICogQHBhcmFtIHsqfSBuZWFyWCBpZiBub3QgbnVsbCwgdHJ5IHRvIHNvdyBhIHNlZWQgYXMgY2xvc2VcbiAgICAgKiBhcyBwb3NzaWJsZSB0byB0aGlzIGxvY2F0aW9uXG4gICAgICogXG4gICAgICogQHJldHVybiB0cnVlIGlmIGEgc2VlZCB3YXMgc3VjY2VzZnVsbHkgcGxhbnRlZCwgZmFsc2UgaWZcbiAgICAgKiB0aGVyZSB3YXMgbm8gc3BhY2UgdG8gc293IGEgc2VlZC5cbiAgICAgKi9cbiAgICBzZWVkKGdlbm9tZSwgbmVhclgsIHN0ZXBudW0pe1xuICAgICAgICAvLyBmaW5kIGEgcmFuZG9tIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBlbXB0eVNwYWNlcyA9IHRoaXMuZ2V0Rmxvb3JTcGFjZSgpO1xuICAgICAgICBpZihlbXB0eVNwYWNlcy5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobmVhclggIT09IHVuZGVmaW5lZCAmJiBuZWFyWCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdFggPSBudWxsO1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RfZGlmZiA9IHRoaXMud2lkdGg7XG4gICAgICAgICAgICBlbXB0eVNwYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHhwb3Mpe1xuICAgICAgICAgICAgICAgIHZhciBkaWZmID0gTWF0aC5hYnMobmVhclgteHBvcyk7XG4gICAgICAgICAgICAgICAgaWYoZGlmZiA8IG5lYXJlc3RfZGlmZil7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RfZGlmZiA9IGRpZmY7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RYID0geHBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc293UGxhbnQoZ2Vub21lLCBuZWFyZXN0WCwgc3RlcG51bSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4ID0gZW1wdHlTcGFjZXNbcmFuZG9tSW50KDAsIGVtcHR5U3BhY2VzLmxlbmd0aC0xKV07XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW3hdWzBdICE9PSBudWxsKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNwYWNlIGlzIHRha2VuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc293UGxhbnQoZ2Vub21lLCB4LCBzdGVwbnVtKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgc293UGxhbnQoZ2Vub21lLCB4LCBzdGVwbnVtKXtcbiAgICAgICAgeCA9IHRoaXMuZ2V0WCh4KTtcbiAgICAgICAgdmFyIHBsYW50ID0gbmV3IFBsYW50KHgsIHRoaXMsIGdlbm9tZSwgc3RlcG51bSk7XG4gICAgICAgIHRoaXMucGxhbnRzLnB1c2gocGxhbnQpO1xuICAgICAgICB0aGlzLmFkZENlbGwocGxhbnQuY2VsbHNbMF0pO1xuICAgICAgICBpZiAodGhpcy5vblBsYW50QmlydGgpIHRoaXMub25QbGFudEJpcnRoKHBsYW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgcGxhbnQgZnJvbSB3b3JsZCBwbGFudCBsaXN0LlxuICAgICAqIFJlbW92ZSBhbGwgY2VsbHMgZnJvbSBjZWxsIGdyaWRcbiAgICAgKi9cbiAgICBraWxsUGxhbnQocGxhbnQpe1xuICAgICAgICBjb25zdCBpZHggPSB0aGlzLnBsYW50cy5pbmRleE9mKHBsYW50KTtcbiAgICAgICAgaWYgKGlkeCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnBsYW50cy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgICAgIHRoaXMuY2VsbENvdW50IC09IHBsYW50LmNlbGxzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhbnQuY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gcGxhbnQuY2VsbHNbaV07XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub25QbGFudERlYXRoKSB0aGlzLm9uUGxhbnREZWF0aChwbGFudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRYKHgpe1xuICAgICAgICBpZih4IDwgMCl7XG4gICAgICAgICAgICB4ID0gdGhpcy53aWR0aCArIHg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggJSB0aGlzLndpZHRoO1xuICAgIH1cblxuICAgIGdldENlbGwoeCwgeSl7XG4gICAgICAgIHJldHVybiB0aGlzLmNlbGxzW3RoaXMuZ2V0WCh4KV1beV07XG4gICAgfVxuXG4gICAgYWRkQ2VsbChjZWxsKXtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldID0gY2VsbDtcbiAgICAgICAgICAgIHRoaXMuY2VsbENvdW50Kys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRQaXhlbEJ1ZmZlcihjZWxsU2l6ZSl7XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLndpZHRoICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGggPSB0aGlzLmhlaWdodCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBidWYgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkodyAqIGggKiA0KTtcbiAgICAgICAgY29uc3QgcGxhbnRzID0gdGhpcy5wbGFudHM7XG5cbiAgICAgICAgLy8gUmVuZGVyIHNvaWwgbnV0cmllbnRzIGluIGJhY2tncm91bmQgaWYgcHJlc2VudFxuICAgICAgICBpZiAodGhpcy5zb2lsTnV0cmllbnRzICYmIHRoaXMuc29pbE51dHJpZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB0aGlzLnNvaWxOdXRyaWVudHNbeF0gLyB0aGlzLm51dHJpZW50TWF4O1xuICAgICAgICAgICAgICAgIC8vIERhcmsgYnJvd24gdG8gZWFydGh5IGJyb3duIGdyYWRpZW50XG4gICAgICAgICAgICAgICAgY29uc3QgciA9IE1hdGgucm91bmQoNDAgKyA0MCAqIG4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGcgPSBNYXRoLnJvdW5kKDMwICsgMjAgKiBuKTtcbiAgICAgICAgICAgICAgICBjb25zdCBiID0gTWF0aC5yb3VuZCgyMCArIDEwICogbik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgcHggPSB4ICogY2VsbFNpemU7XG4gICAgICAgICAgICAgICAgY29uc3QgcHkgPSAodGhpcy5oZWlnaHQgLSAxKSAqIGNlbGxTaXplOyAvLyBCb3R0b20gcm93XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZHkgPSAwOyBkeSA8IGNlbGxTaXplOyBkeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvd0lkeCA9IChweSArIGR5KSAqIHc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGR4ID0gMDsgZHggPCBjZWxsU2l6ZTsgZHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaWR4ID0gKHJvd0lkeCArIHB4ICsgZHgpICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdID0gcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAxXSA9IGc7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMl0gPSBiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDNdID0gMjU1O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gcGxhbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgW2Jhc2VSLCBiYXNlRywgYmFzZUJdID0gdGhpcy5nZXRCYXNlQ29sb3VyKHBsYW50KTtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtSID0gTWF0aC5yb3VuZChiYXNlUiAqIDAuNyk7XG4gICAgICAgICAgICBjb25zdCBkYXJrRyA9IE1hdGgucm91bmQoYmFzZUcgKiAwLjcpO1xuICAgICAgICAgICAgY29uc3QgZGFya0IgPSBNYXRoLnJvdW5kKGJhc2VCICogMC43KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgY2VsbHMgPSBwbGFudC5jZWxscztcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gY2VsbHNbal07XG4gICAgICAgICAgICAgICAgY29uc3QgcjAgPSBjZWxsLmVuZXJnaXNlZCA/IGJhc2VSIDogZGFya1I7XG4gICAgICAgICAgICAgICAgY29uc3QgZzAgPSBjZWxsLmVuZXJnaXNlZCA/IGJhc2VHIDogZGFya0c7XG4gICAgICAgICAgICAgICAgY29uc3QgYjAgPSBjZWxsLmVuZXJnaXNlZCA/IGJhc2VCIDogZGFya0I7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgcHgwID0gY2VsbC54ICogY2VsbFNpemU7XG4gICAgICAgICAgICAgICAgY29uc3QgcHkwID0gKHRoaXMuaGVpZ2h0IC0gMSAtIGNlbGwueSkgKiBjZWxsU2l6ZTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGR5ID0gMDsgZHkgPCBjZWxsU2l6ZTsgZHkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb3dJZHggPSAocHkwICsgZHkpICogdztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZHggPSAwOyBkeCA8IGNlbGxTaXplOyBkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0JvcmRlciA9IGNlbGxTaXplID4gMSAmJiAoZHggPT09IDAgfHwgZHkgPT09IDAgfHwgZHggPT09IGNlbGxTaXplIC0gMSB8fCBkeSA9PT0gY2VsbFNpemUgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkeCA9IChyb3dJZHggKyBweDAgKyBkeCkgKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNCb3JkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4XSAgICAgPSBNYXRoLnJvdW5kKHIwICogMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBNYXRoLnJvdW5kKGcwICogMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMl0gPSBNYXRoLnJvdW5kKGIwICogMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeF0gICAgID0gcjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDFdID0gZzA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDJdID0gYjA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgM10gPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBidWZmZXI6IGJ1Ziwgd2lkdGg6IHcsIGhlaWdodDogaCwgY2VsbENvdW50OiB0aGlzLmNlbGxDb3VudCB9O1xuICAgIH1cblxuICAgIGdldEJhc2VDb2xvdXIocGxhbnQpe1xuICAgICAgICB2YXIgaSA9IHBsYW50LmNlbGxzWzBdLnggJSBjU2NhbGUubGVuZ3RoO1xuICAgICAgICByZXR1cm4gY1NjYWxlW2ldO1xuICAgIH1cbn1cblxuLy8gaHR0cDovL2NvbG9yYnJld2VyMi5vcmcvP3R5cGU9cXVhbGl0YXRpdmUmc2NoZW1lPVNldDMmbj04IOKAlCBhcyByYXcgW1IsRyxCXSB0dXBsZXNcbnZhciBjU2NhbGUgPSBbXG4gICAgWzE0MSwyMTEsMTk5XSxbMjU1LDI1NSwxNzldLFsxOTAsMTg2LDIxOF0sWzI1MSwxMjgsMTE0XSxcbiAgICBbMTI4LDE3NywyMTFdLFsyNTMsMTgwLDk4XSxbMTc5LDIyMiwxMDVdLFsyNTIsMjA1LDIyOV1cbl07XG5cblxuZXhwb3J0IHsgV29ybGQgfTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdGlkOiBtb2R1bGVJZCxcblx0XHRsb2FkZWQ6IGZhbHNlLFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuXHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbi8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBfX3dlYnBhY2tfbW9kdWxlc19fO1xuXG4vLyB0aGUgc3RhcnR1cCBmdW5jdGlvblxuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcblx0Ly8gVGhpcyBlbnRyeSBtb2R1bGUgZGVwZW5kcyBvbiBvdGhlciBsb2FkZWQgY2h1bmtzIGFuZCBleGVjdXRpb24gbmVlZCB0byBiZSBkZWxheWVkXG5cdHZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKHVuZGVmaW5lZCwgW1widmVuZG9ycy1ub2RlX21vZHVsZXNfc2VlZHJhbmRvbV9pbmRleF9qcy1ub2RlX21vZHVsZXNfc3RhdHMtbGl0ZV9zdGF0c19qc1wiXSwgKCkgPT4gKF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9zaW11bGF0aW9uLndvcmtlci5qc1wiKSkpXG5cdF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8oX193ZWJwYWNrX2V4cG9ydHNfXyk7XG5cdHJldHVybiBfX3dlYnBhY2tfZXhwb3J0c19fO1xufTtcblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5hbWREID0gZnVuY3Rpb24gKCkge1xuXHR0aHJvdyBuZXcgRXJyb3IoJ2RlZmluZSBjYW5ub3QgYmUgdXNlZCBpbmRpcmVjdCcpO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmFtZE8gPSB7fTsiLCJ2YXIgZGVmZXJyZWQgPSBbXTtcbl9fd2VicGFja19yZXF1aXJlX18uTyA9IChyZXN1bHQsIGNodW5rSWRzLCBmbiwgcHJpb3JpdHkpID0+IHtcblx0aWYoY2h1bmtJZHMpIHtcblx0XHRwcmlvcml0eSA9IHByaW9yaXR5IHx8IDA7XG5cdFx0Zm9yKHZhciBpID0gZGVmZXJyZWQubGVuZ3RoOyBpID4gMCAmJiBkZWZlcnJlZFtpIC0gMV1bMl0gPiBwcmlvcml0eTsgaS0tKSBkZWZlcnJlZFtpXSA9IGRlZmVycmVkW2kgLSAxXTtcblx0XHRkZWZlcnJlZFtpXSA9IFtjaHVua0lkcywgZm4sIHByaW9yaXR5XTtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIG5vdEZ1bGZpbGxlZCA9IEluZmluaXR5O1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGRlZmVycmVkLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIFtjaHVua0lkcywgZm4sIHByaW9yaXR5XSA9IGRlZmVycmVkW2ldO1xuXHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgY2h1bmtJZHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdGlmICgocHJpb3JpdHkgJiAxID09PSAwIHx8IG5vdEZ1bGZpbGxlZCA+PSBwcmlvcml0eSkgJiYgT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5PKS5ldmVyeSgoa2V5KSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXy5PW2tleV0oY2h1bmtJZHNbal0pKSkpIHtcblx0XHRcdFx0Y2h1bmtJZHMuc3BsaWNlKGotLSwgMSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmdWxmaWxsZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYocHJpb3JpdHkgPCBub3RGdWxmaWxsZWQpIG5vdEZ1bGZpbGxlZCA9IHByaW9yaXR5O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZihmdWxmaWxsZWQpIHtcblx0XHRcdGRlZmVycmVkLnNwbGljZShpLS0sIDEpXG5cdFx0XHR2YXIgciA9IGZuKCk7XG5cdFx0XHRpZiAociAhPT0gdW5kZWZpbmVkKSByZXN1bHQgPSByO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmYgPSB7fTtcbi8vIFRoaXMgZmlsZSBjb250YWlucyBvbmx5IHRoZSBlbnRyeSBjaHVuay5cbi8vIFRoZSBjaHVuayBsb2FkaW5nIGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIGNodW5rc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5lID0gKGNodW5rSWQpID0+IHtcblx0cmV0dXJuIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uZikucmVkdWNlKChwcm9taXNlcywga2V5KSA9PiB7XG5cdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mW2tleV0oY2h1bmtJZCwgcHJvbWlzZXMpO1xuXHRcdHJldHVybiBwcm9taXNlcztcblx0fSwgW10pKTtcbn07IiwiLy8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzIGFuZCBjaHVua3MgdGhhdCB0aGUgZW50cnlwb2ludCBkZXBlbmRzIG9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnUgPSAoY2h1bmtJZCkgPT4ge1xuXHQvLyByZXR1cm4gdXJsIGZvciBmaWxlbmFtZXMgYmFzZWQgb24gdGVtcGxhdGVcblx0cmV0dXJuIFwiXCIgKyBjaHVua0lkICsgXCIuYnVuZGxlLmpzXCI7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubm1kID0gKG1vZHVsZSkgPT4ge1xuXHRtb2R1bGUucGF0aHMgPSBbXTtcblx0aWYgKCFtb2R1bGUuY2hpbGRyZW4pIG1vZHVsZS5jaGlsZHJlbiA9IFtdO1xuXHRyZXR1cm4gbW9kdWxlO1xufTsiLCJ2YXIgc2NyaXB0VXJsO1xuaWYgKF9fd2VicGFja19yZXF1aXJlX18uZy5pbXBvcnRTY3JpcHRzKSBzY3JpcHRVcmwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcubG9jYXRpb24gKyBcIlwiO1xudmFyIGRvY3VtZW50ID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmRvY3VtZW50O1xuaWYgKCFzY3JpcHRVcmwgJiYgZG9jdW1lbnQpIHtcblx0aWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgJiYgZG9jdW1lbnQuY3VycmVudFNjcmlwdC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdTQ1JJUFQnKVxuXHRcdHNjcmlwdFVybCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuXHRpZiAoIXNjcmlwdFVybCkge1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG5cdFx0aWYoc2NyaXB0cy5sZW5ndGgpIHtcblx0XHRcdHZhciBpID0gc2NyaXB0cy5sZW5ndGggLSAxO1xuXHRcdFx0d2hpbGUgKGkgPiAtMSAmJiAoIXNjcmlwdFVybCB8fCAhL15odHRwKHM/KTovLnRlc3Qoc2NyaXB0VXJsKSkpIHNjcmlwdFVybCA9IHNjcmlwdHNbaS0tXS5zcmM7XG5cdFx0fVxuXHR9XG59XG4vLyBXaGVuIHN1cHBvcnRpbmcgYnJvd3NlcnMgd2hlcmUgYW4gYXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCB5b3UgbXVzdCBzcGVjaWZ5IGFuIG91dHB1dC5wdWJsaWNQYXRoIG1hbnVhbGx5IHZpYSBjb25maWd1cmF0aW9uXG4vLyBvciBwYXNzIGFuIGVtcHR5IHN0cmluZyAoXCJcIikgYW5kIHNldCB0aGUgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gdmFyaWFibGUgZnJvbSB5b3VyIGNvZGUgdG8gdXNlIHlvdXIgb3duIGxvZ2ljLlxuaWYgKCFzY3JpcHRVcmwpIHRocm93IG5ldyBFcnJvcihcIkF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xuc2NyaXB0VXJsID0gc2NyaXB0VXJsLnJlcGxhY2UoL15ibG9iOi8sIFwiXCIpLnJlcGxhY2UoLyMuKiQvLCBcIlwiKS5yZXBsYWNlKC9cXD8uKiQvLCBcIlwiKS5yZXBsYWNlKC9cXC9bXlxcL10rJC8sIFwiL1wiKTtcbl9fd2VicGFja19yZXF1aXJlX18ucCA9IHNjcmlwdFVybDsiLCIvLyBubyBiYXNlVVJJXG5cbi8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgY2h1bmtzXG4vLyBcIjFcIiBtZWFucyBcImFscmVhZHkgbG9hZGVkXCJcbnZhciBpbnN0YWxsZWRDaHVua3MgPSB7XG5cdFwic3JjX3NpbXVsYXRpb25fd29ya2VyX2pzXCI6IDFcbn07XG5cbi8vIGltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZ1xudmFyIGluc3RhbGxDaHVuayA9IChkYXRhKSA9PiB7XG5cdHZhciBbY2h1bmtJZHMsIG1vcmVNb2R1bGVzLCBydW50aW1lXSA9IGRhdGE7XG5cdGZvcih2YXIgbW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8obW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcblx0XHR9XG5cdH1cblx0aWYocnVudGltZSkgcnVudGltZShfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblx0d2hpbGUoY2h1bmtJZHMubGVuZ3RoKVxuXHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkcy5wb3AoKV0gPSAxO1xuXHRwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbihkYXRhKTtcbn07XG5fX3dlYnBhY2tfcmVxdWlyZV9fLmYuaSA9IChjaHVua0lkLCBwcm9taXNlcykgPT4ge1xuXHQvLyBcIjFcIiBpcyB0aGUgc2lnbmFsIGZvciBcImFscmVhZHkgbG9hZGVkXCJcblx0aWYoIWluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuXHRcdGlmKHRydWUpIHsgLy8gYWxsIGNodW5rcyBoYXZlIEpTXG5cdFx0XHRpbXBvcnRTY3JpcHRzKF9fd2VicGFja19yZXF1aXJlX18ucCArIF9fd2VicGFja19yZXF1aXJlX18udShjaHVua0lkKSk7XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgY2h1bmtMb2FkaW5nR2xvYmFsID0gc2VsZltcIndlYnBhY2tDaHVua2xpbmRldm9sXCJdID0gc2VsZltcIndlYnBhY2tDaHVua2xpbmRldm9sXCJdIHx8IFtdO1xudmFyIHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uID0gY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2guYmluZChjaHVua0xvYWRpbmdHbG9iYWwpO1xuY2h1bmtMb2FkaW5nR2xvYmFsLnB1c2ggPSBpbnN0YWxsQ2h1bms7XG5cbi8vIG5vIEhNUlxuXG4vLyBubyBITVIgbWFuaWZlc3QiLCJ2YXIgbmV4dCA9IF9fd2VicGFja19yZXF1aXJlX18ueDtcbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18uZShcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3NlZWRyYW5kb21faW5kZXhfanMtbm9kZV9tb2R1bGVzX3N0YXRzLWxpdGVfc3RhdHNfanNcIikudGhlbihuZXh0KTtcbn07IiwiIiwiLy8gcnVuIHN0YXJ0dXBcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy54KCk7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=