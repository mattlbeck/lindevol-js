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

            // this plant will kill the other with a probability
            // determined by defender's energy and attacker's attack trait
            const successProb = space.plant.getKillProbability() * this.getAttackBonus();
            if((0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomProb)(successProb)){
                // attack succeeded. Kill competitor and continue with growth
                this.world.killPlant(space.plant, params ? params.nutrient_recycling_factor : 0);
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

        // Target store is 10x the current maintenance cost
        const baseMaint = this.cells.length * params.nutrient_maintenance_cost;
        const targetStore = baseMaint * 10.0;
        const hunger = Math.max(0.1, Math.min(1.0, 1.0 - (this.nutrientCount / (targetStore + 0.1))));

        // 1. Extraction from roots (y=0)
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            if (cell.y === 0) {
                const available = this.world.soilNutrients[cell.x];
                let extractRate = params.nutrient_extract_rate * hunger;
                
                let actualAmount = 0;
                // Active Extraction: consumes energy for higher rate
                if (cell.energised && hunger > 0.2) {
                    cell.energised = false;
                    actualAmount = Math.min(available, extractRate);
                } else {
                    // Passive Extraction: slow but free
                    actualAmount = Math.min(available, extractRate * 0.1);
                }

                this.nutrientCount += actualAmount;
                this.world.soilNutrients[cell.x] -= actualAmount;
            }
        }

        // 2. Maintenance cost
        // Traits can reduce maintenance cost
        const cost = baseMaint * this.traits.efficiency;
        this.nutrientCount = Math.max(0, this.nutrientCount - cost);
    }

    getKillProbability(){
        // Probability that THIS plant is killed (defender's stats)
        // More energy = harder to kill
        return this.energisedCount > 0 ? 1/this.energisedCount : 1.0;
    }

    getAttackBonus() {
        return this.traits.attack;
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

class SimData {

    constructor(simulation) {
        this.sim = simulation;
        this.data = { "stepnum": [] };
        this.lastStep = 0;
        this.collectors = [
            new Collector("population", AsIs, function (sim) {
                return sim.world.plants.length;
            }),
            new Collector("unique_genotypes", AsIs, function (sim) {
                const seen = new Set();
                sim.world.plants.forEach(p => seen.add(p.genome.serialize()));
                return seen.size;
            }),
            new Collector("total_cells", AsIs, function (sim) {
                return sim.world.cellCount;
            }),
            new Collector("avg_size", AsIs, function (sim) {
                if (sim.world.plants.length === 0) return 0;
                return sim.world.cellCount / sim.world.plants.length;
            }),
            new Collector("avg_energised", AsIs, function (sim) {
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + p.energisedCount, 0);
                return total / sim.world.plants.length;
            }),
            new Collector("avg_active_genes", AsIs, function (sim) {
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + (p.rules ? p.rules.length : 0), 0);
                return total / sim.world.plants.length;
            }),
            new Collector("avg_age", AsIs, function (sim) {
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + (sim.stepnum - p.birthStep), 0);
                return total / sim.world.plants.length;
            }),
            new Collector("total_seeds", AsIs, function (sim) { return sim.stats.totalSeeds; }),
            new Collector("flying_seeds", AsIs, function (sim) { return sim.stats.flyingSeeds; }),
            new Collector("new_plants", AsIs, function (sim) { return sim.stats.newPlants; }),
            new Collector("deaths", AsIs, function (sim) { return sim.stats.deaths; }),
            new Collector("attacks", AsIs, function (sim) { return sim.stats.attacks; }),
            new Collector("avg_death_prob", AsIs, function (sim) {
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
            new Collector("avg_nutrients", AsIs, function (sim) {
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + p.nutrientCount, 0);
                return total / sim.world.plants.length;
            }),
            new Collector("soil_nutrients", AsIs, function (sim) {
                if (!sim.world.soilNutrients || sim.world.soilNutrients.length === 0) return 0;
                const total = sim.world.soilNutrients.reduce((sum, n) => sum + n, 0);
                return total / sim.world.soilNutrients.length;
            }),
            new Collector("avg_traits", AsIs, function (sim) {
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
            new Collector("plant_size_", Summary, function (sim) {
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.cells.length);
            }),
            new Collector("genome_size_", Summary, function (sim) {
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.genome.length);
            }),
            new Collector("mut_exp_", Summary, function (sim) {
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.genome.mut_exp);
            }),
            new Collector("plant_height_", Summary, function (sim) {
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => {
                    let maxH = 0;
                    for (let i = 0; i < p.cells.length; i++) if (p.cells[i].y > maxH) maxH = p.cells[i].y;
                    return maxH;
                });
            }),
            new Collector("genetic_distance_mean", AsIs, function (sim) {
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
            new Collector("allele_entropy", AsIs, function (sim) {
                return calculateAlleleEntropy(sim.world.plants);
            })
        ];
    }

    /**
     * Collect data for the current step
     */
    recordStep() {
        const delta = this.sim.stepnum - this.lastStep;
        this.lastStep = this.sim.stepnum;

        var stepData = {};
        this.collectors.forEach(function (c) {
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
        Object.keys(stepData).forEach(function (k) {
            if (!(k in this.data)) {
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

class Collector {
    constructor(name, typecls, collectFunc) {
        this.name = name;
        this.type = new typecls(name);
        this.func = collectFunc;
    }

    collect(sim) {
        var data = this.func(sim);
        return this.type.transform(data);
    }
}

class CollectorType {
    constructor(name) {
        this.name = name;
    }

    transformData(data) {
        throw new Error("Unimplemented method");
    }

    transform(data) {
        var values = this.transformData(data);
        var transformed_data = {};
        Object.keys(values).forEach(function (k) {
            transformed_data[this.name + k] = values[k];
        }, this);
        return transformed_data;
    }
}

class AsIs extends CollectorType {

    transformData(data) {
        return { "": data };
    }
}

class Summary extends CollectorType {

    transformData(data) {
        return { "min": Math.min(data), "mean": stats_lite__WEBPACK_IMPORTED_MODULE_0__.mean(data), "max": Math.max(data) };
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
        this.initial_population = 50;
        
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
        this.nutrient_maintenance_cost = 0.02; // per cell per step
        this.nutrient_divide_cost = 2.0;
        
        // Dynamic Soil Params
        this.nutrient_patchiness = 0.5;         // 0 (uniform) to 1 (high variance)
        this.nutrient_diffusion_rate = 0.1;    // 0 to 1
        this.nutrient_recycling_factor = 0.5;  // 0 to 1
        this.nutrient_seasonality_amp = 0.5;   // 0 (off) to 1
        this.nutrient_seasonality_freq = 0.001;

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
            this.world.initNutrients(this.params.nutrient_max, this.params.nutrient_patchiness);
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
            this.world.replenishNutrients(
                this.params.nutrient_replenish_rate, 
                this.stepnum, 
                this.params.nutrient_seasonality_amp, 
                this.params.nutrient_seasonality_freq
            );
            this.world.diffuseNutrients(this.params.nutrient_diffusion_rate);
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
                this.params.leanover_factor,
                this.params.sim_mode
            );
            if ((0,_random_js__WEBPACK_IMPORTED_MODULE_0__.randomProb)(deathProb.prob)){
                dead_plants.push(plant);
            }
        }
        for (let i = 0; i < dead_plants.length; i++) {
            this.world.killPlant(dead_plants[i], this.params.sim_mode === "niche" ? this.params.nutrient_recycling_factor : 0);
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

    initNutrients(max, patchiness = 0) {
        this.nutrientMax = max;
        this.soilNutrients = new Array(this.width);
        for (let x = 0; x < this.width; x++) {
            // Variation using sine waves to create "hotspots"
            const variation = patchiness * (Math.sin(x * 0.1) * 0.5 + Math.sin(x * 0.03) * 0.5);
            this.soilNutrients[x] = max * (1.0 + variation);
        }
    }

    replenishNutrients(rate, stepnum, amp = 0, freq = 0.001) {
        // Apply seasonality multiplier
        const seasonality = 1.0 + amp * Math.sin(stepnum * freq);
        const actualRate = rate * seasonality;

        for (let x = 0; x < this.width; x++) {
            this.soilNutrients[x] = Math.min(this.nutrientMax * 2, this.soilNutrients[x] + actualRate);
        }
    }

    diffuseNutrients(rate) {
        if (rate <= 0) return;
        const nextSoil = [...this.soilNutrients];
        for (let x = 0; x < this.width; x++) {
            const left = (x - 1 + this.width) % this.width;
            const right = (x + 1) % this.width;
            
            // Average with neighbors
            const flux = (this.soilNutrients[left] + this.soilNutrients[right] - 2 * this.soilNutrients[x]) * rate * 0.5;
            nextSoil[x] += flux;
        }
        this.soilNutrients = nextSoil;
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
    killPlant(plant, recyclingFactor = 0) {
        const idx = this.plants.indexOf(plant);
        if (idx > -1) {
            // Recycling logic
            if (recyclingFactor > 0 && this.soilNutrients) {
                const biomassBonus = plant.cells.length * 0.5;
                const totalToReturn = (plant.nutrientCount + biomassBonus) * recyclingFactor;
                const rootColumns = plant.cells.filter(c => c.y === 0).map(c => c.x);
                if (rootColumns.length > 0) {
                    const perColumn = totalToReturn / rootColumns.length;
                    rootColumns.forEach(x => {
                        this.soilNutrients[x] += perColumn;
                    });
                }
            }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NpbXVsYXRpb25fd29ya2VyX2pzLmJ1bmRsZS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUIsb0JBQW9CO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDJCQUEyQixpQkFBaUI7QUFDNUM7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQix1QkFBdUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFD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V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esa0M7Ozs7O1dDbEJBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxhQUFhO1dBQ2I7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBOztXQUVBOztXQUVBLGtCOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztVRUhBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9saW5kZXZvbC9pZ25vcmVkfC9Vc2Vycy9tYXR0L2xpbmRldm9sLWpzL25vZGVfbW9kdWxlcy9zZWVkcmFuZG9tfGNyeXB0byIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9hY3Rpb25zLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2NlbGwuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvZ2Vub21lLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3BsYW50LmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3JhbmRvbS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW1kYXRhLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvd29ybGQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBkZWZpbmUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBvcHRpb25zIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9ub2RlIG1vZHVsZSBkZWNvcmF0b3IiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3B1YmxpY1BhdGgiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2ltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvc3RhcnR1cCBjaHVuayBkZXBlbmRlbmNpZXMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIChpZ25vcmVkKSAqLyIsImNvbnN0IE5FSUdIQk9VUkhPT0QgPSBbWy0xLC0xXSwgWzAsLTFdLCBbMSwtMV0sIFstMSwwXSwgWzEsMF0sIFstMSwxXSwgWzAsMV0sIFsxLDFdXTtcbmNvbnN0IE1VVF9JTkNSRU1FTlQgPSAwLjAwMTtcblxuY2xhc3MgQWN0aW9ue1xuICAgIGNvbnN0cnVjdG9yKGFjdGlvbkNvZGUpe1xuICAgICAgICB0aGlzLmNvZGUgPSBhY3Rpb25Db2RlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZXhlY3V0ZShjZWxsLCBzdGVwbnVtLCBwYXJhbXMpe1xuICAgICAgICAvLyBhY3Rpb25zIGFyZSB0eXBpY2FsbHkgb25seSBjYXJyaWVkIG91dCBpZiB0aGUgY2VsbCBoYXMgZW5lcmd5XG4gICAgICAgIC8vIGFuZCB0aGUgY2VsbCBsb3NlcyBlbmVyZ3kgYXMgYSByZXN1bHQuXG4gICAgICAgIGlmIChjZWxsLmVuZXJnaXNlZCl7XG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9IHRoaXMuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSwgcGFyYW1zKTtcbiAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gIXN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkb0FjdGlvbihjZWxsKXtcblxuICAgIH1cbn1cblxuY2xhc3MgRGl2aWRlIGV4dGVuZHMgQWN0aW9ue1xuXG4gICAgZG9BY3Rpb24oY2VsbCwgc3RlcG51bSwgcGFyYW1zKXtcbiAgICAgICAgLy8gdGhlIDIgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBvZiB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgLy8gZGV0ZXJtaW5lcyB3aGljaCBkaXJlY3Rpb24gdGhlIGRpdmlkZSBhY3Rpb24gaXMgZm9yXG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwsIHN0ZXBudW0sIHBhcmFtcyk7XG5cbiAgICAgICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMuc2ltX21vZGUgPT09IFwibmljaGVcIikge1xuICAgICAgICAgICAgaWYgKGNlbGwucGxhbnQubnV0cmllbnRDb3VudCA8IHBhcmFtcy5udXRyaWVudF9kaXZpZGVfY29zdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjZWxsLnBsYW50Lm51dHJpZW50Q291bnQgLT0gcGFyYW1zLm51dHJpZW50X2RpdmlkZV9jb3N0O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbiwgc3RlcG51bSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgZ2V0RGlyZWN0aW9uKCl7XG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIGNvcnJlY3QgYml0c1xuICAgICAgICAvLyAmIHdpdGggMDAwMDAxMTEgdG8gbWFzayBvdXQgbGVhc3Qgc2lnIGJpdHNcbiAgICAgICAgdmFyIGRpcmVjdGlvbkNvZGUgPSB0aGlzLmNvZGUgJiA3O1xuICAgICAgICByZXR1cm4gTkVJR0hCT1VSSE9PRFtkaXJlY3Rpb25Db2RlXTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYGRpdmlkZSAke3RoaXMuZ2V0RGlyZWN0aW9uKCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIE11dGF0ZVBsdXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwICs9IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dCtcIjtcbiAgICB9XG59XG5cbmNsYXNzIE11dGF0ZU1pbnVzIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsKTtcbiAgICAgICAgY2VsbC5wbGFudC5nZW5vbWUubXV0X2V4cCAtPSBNVVRfSU5DUkVNRU5UO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gXCJtdXQtXCI7XG4gICAgfVxufVxuXG5jbGFzcyBGbHlpbmdTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsLCBzdGVwbnVtKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCksIG51bGwsIHN0ZXBudW0pO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcImZseWluZ3NlZWRcIjtcbiAgICB9XG59XG5cbmNsYXNzIExvY2FsU2VlZCBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsLCBzdGVwbnVtKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSk7XG4gICAgICAgIHJldHVybiBjZWxsLnBsYW50LndvcmxkLnNlZWQoY2VsbC5wbGFudC5nZW5vbWUuY29weSgpLCBjZWxsLngsIHN0ZXBudW0pO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcImxvY2Fsc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgU3RhdGVCaXROIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwpIHtcbiAgICAgICAgLy8gVG9nZ2xlIHRoZSBiaXQgdXNpbmcgWE9SXG4gICAgICAgIGNlbGwubmV4dEludGVybmFsU3RhdGUgPSBjZWxsLm5leHRJbnRlcm5hbFN0YXRlIF4gKDEgPDwgdGhpcy5nZXROdGhCaXQoKSk7XG4gICAgICAgIC8vIHRoaXMgYWN0aW9uIGRvZXMgbm90IGNvbnN1bWUgZW5lcmd5XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXROdGhCaXQoKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMTExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICByZXR1cm4gdGhpcy5jb2RlICYgMTU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGBTdGF0ZUJpdCAke3RoaXMuZ2V0TnRoQml0KCl9YDtcbiAgICB9XG59XG5cbmNsYXNzIEFjdGlvbk1hcCB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nLCBjb2RlUmFuZ2U9MjU2KXtcbiAgICAgICAgdGhpcy5tYXBwaW5nID0gbWFwcGluZztcbiAgICAgICAgdGhpcy5jb2RlUmFuZ2UgPSBjb2RlUmFuZ2U7XG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IFtEaXZpZGUsIEZseWluZ1NlZWQsIExvY2FsU2VlZCwgTXV0YXRlUGx1cywgTXV0YXRlTWludXMsIFN0YXRlQml0Tl07XG4gICAgfVxuXG4gICAgZ2V0QWN0aW9uKGFjdGlvbkNvZGUpe1xuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGFjdGlvbiBjb2RlIGludG8gdGhlIFswLCBzdW0pIHJhbmdlIHNvIHdlaWdodHMgY2FuIGJlXG4gICAgICAgIC8vIGFueSBwb3NpdGl2ZSBpbnRlZ2VycyByYXRoZXIgdGhhbiBuZWVkaW5nIHRvIHN1bSB0byBjb2RlUmFuZ2UuXG4gICAgICAgIGNvbnN0IHN1bSA9IHRoaXMubWFwcGluZy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZENvZGUgPSBNYXRoLmZsb29yKChhY3Rpb25Db2RlIC8gdGhpcy5jb2RlUmFuZ2UpICogc3VtKTtcbiAgICAgICAgdmFyIG1hcHBpbmdDb3VudCA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubWFwcGluZy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBtYXBwaW5nQ291bnQgKz0gdGhpcy5tYXBwaW5nW2ldO1xuICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRDb2RlIDwgbWFwcGluZ0NvdW50KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1tpXShhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBGYWxsYmFjayBmb3IgZmxvYXRpbmctcG9pbnQgZWRnZSBjYXNlc1xuICAgICAgICByZXR1cm4gbmV3IHRoaXMuYWN0aW9uc1t0aGlzLm1hcHBpbmcubGVuZ3RoIC0gMV0oYWN0aW9uQ29kZSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7RGl2aWRlLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgTG9jYWxTZWVkLCBGbHlpbmdTZWVkLCBBY3Rpb25NYXAsIE5FSUdIQk9VUkhPT0R9OyIsIlxuY2xhc3MgQ2VsbHtcbiAgICBjb25zdHJ1Y3RvcihwbGFudCwgeCwgeSl7XG4gICAgICAgIHRoaXMucGxhbnQgPSBwbGFudDtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy5fZW5lcmdpc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgICAgIHRoaXMubmV4dEludGVybmFsU3RhdGUgPSAwO1xuICAgIH1cblxuICAgIGdldCBlbmVyZ2lzZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmVyZ2lzZWQ7XG4gICAgfVxuXG4gICAgc2V0IGVuZXJnaXNlZCh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fZW5lcmdpc2VkID09PSB2YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucGxhbnQpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbnQuZW5lcmdpc2VkQ291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlU3RhdGUoKXtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgsIHgsIHksIHNpemUsIGNvbG91cil7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvdXI7XG4gICAgICAgIGN0eC5maWxsUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICAgICAgLy9jdHguc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYENlbGwgYXQgKCR7dGhpcy54fSwgJHt0aGlzLnl9KSBlbmVyZ3k6ICR7dGhpcy5lbmVyZ2lzZWR9YDtcbiAgICB9XG59XG5cbmV4cG9ydCB7Q2VsbH07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtBY3Rpb25NYXB9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgQnl0ZUFycmF5IGV4dGVuZHMgQXJyYXl7XG5cbiAgICBjb25zdHJ1Y3RvcihsZW5ndGg9MCwgaW5pdGlhbF9tdXRfZXhwPTApe1xuICAgICAgICBzdXBlcihsZW5ndGgpO1xuICAgICAgICB0aGlzLm11dF9leHAgPSBpbml0aWFsX211dF9leHA7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb20oYXJyLCBtdXRfZXhwPTApe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGFyci5sZW5ndGgsIG11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcbiAgICAgICAgICAgIGJhW2ldID0gYXJyW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXJpYWxpemUgdGhpcyBnZW5vbWUgdG8gYSBzdHJpbmc6IFwiPG11dF9leHA+OzxieXRlMD4sPGJ5dGUxPiwuLi5cIlxuICAgICAqL1xuICAgIHNlcmlhbGl6ZSgpe1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5tdXRfZXhwfTske0FycmF5LmZyb20odGhpcykuam9pbihcIixcIil9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXNlcmlhbGl6ZSBhIGdlbm9tZSBzdHJpbmcgcHJvZHVjZWQgYnkgc2VyaWFsaXplKCkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm5zIHtCeXRlQXJyYXl9XG4gICAgICovXG4gICAgc3RhdGljIGRlc2VyaWFsaXplKHN0cil7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gc3RyLnRyaW0oKS5zcGxpdChcIjtcIik7XG4gICAgICAgIGNvbnN0IG11dF9leHAgPSBwYXJzZUZsb2F0KHBhcnRzWzBdKTtcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBwYXJ0c1sxXS5zcGxpdChcIixcIikubWFwKE51bWJlcik7XG4gICAgICAgIHJldHVybiBCeXRlQXJyYXkuZnJvbShieXRlcywgbXV0X2V4cCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJhbmRvbShsZW5ndGgpe1xuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGxlbmd0aCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSByYW5kb21JbnQoMCwgMjU1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmE7XG4gICAgfVxuXG4gICAgY29weSgpe1xuICAgICAgICB2YXIgbmV3QXJyID0gbmV3IEJ5dGVBcnJheSh0aGlzLmxlbmd0aCwgdGhpcy5tdXRfZXhwKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBuZXdBcnJbaV0gPSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdBcnI7XG4gICAgfVxuXG59XG5cbmNsYXNzIE11dGF0b3J7XG4gICAgY29uc3RydWN0b3IocHJvYiwgcHJvYl9yZXBsYWNlbWVudCwgcHJvYl9pbnNlcnRpb24sIHByb2JfZGVsZXRpb24sIHByb2JfZHVwLCByZXBsYWNlbWVudF9tb2RlLCB1bml0cyl7XG4gICAgICAgIHRoaXMucHJvYiA9IHByb2I7XG4gICAgICAgIHRoaXMucFIgPSBwcm9iX3JlcGxhY2VtZW50O1xuICAgICAgICB0aGlzLnBJID0gcHJvYl9pbnNlcnRpb247XG4gICAgICAgIHRoaXMucEQgPSBwcm9iX2RlbGV0aW9uO1xuICAgICAgICB0aGlzLnBEdXAgPSBwcm9iX2R1cDtcbiAgICAgICAgdGhpcy5wUm1vZGUgPSByZXBsYWNlbWVudF9tb2RlOyAgXG4gICAgICAgIHRoaXMudW5pdHMgPSB1bml0cztcbiAgICB9XG5cbiAgICBtdXRhdGUoZ2Vub21lKXtcbiAgICAgICAgbGV0IG11dGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBSLCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlKGdlbm9tZSk7XG4gICAgICAgICAgICBtdXRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEksIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmluc2VydChnZW5vbWUpO1xuICAgICAgICAgICAgbXV0YXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5tUHJvYih0aGlzLnBELCBnZW5vbWUubXV0X2V4cCkpe1xuICAgICAgICAgICAgdGhpcy5kZWxldGUoZ2Vub21lKTtcbiAgICAgICAgICAgIG11dGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtdXRhdGVkO1xuICAgIH1cblxuICAgIG1Qcm9iKHAsIGV4cCl7XG4gICAgICAgIHJldHVybiByYW5kb21Qcm9iKHAgKiBNYXRoLnBvdyggdGhpcy5wcm9iLCBleHApKTtcbiAgICB9XG5cbiAgICByZXBsYWNlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgc3dpdGNoKHRoaXMucFJtb2RlKXtcbiAgICAgICAgY2FzZSBcImJ5dGV3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSB0aGlzLnJhbmRvbUNoYXIoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYml0d2lzZVwiOlxuICAgICAgICAgICAgZ2Vub21lW2ldID0gZ2Vub21lW2ldIF4gKDEgPDwgcmFuZG9tSW50KDAsIDcpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG11dGF0aW9uIHJlcGxhY2VtZW50IG1vZGU6ICR7dGhpcy5wUm1vZGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuXG4gICAgaW5zZXJ0KGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMCwgdGhpcy5yYW5kb21DaGFyKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVsZXRlKGdlbm9tZSl7XG4gICAgICAgIHZhciBpID0gdGhpcy5yYW5kb21Qb3MoZ2Vub21lKTtcbiAgICAgICAgZm9yKHZhciBuPTA7IG48dGhpcy51bml0czsgbisrKXtcbiAgICAgICAgICAgIGdlbm9tZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByYW5kb21DaGFyKCl7XG4gICAgICAgIHJldHVybiByYW5kb21JbnQoMCwgMjU1KTtcbiAgICB9XG5cbiAgICByYW5kb21Qb3MoZ2Vub21lKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCBnZW5vbWUubGVuZ3RoLTEpO1xuICAgIH1cbn1cblxuXG5cbmNsYXNzIFJ1bGUge1xuICAgIGNvbnN0cnVjdG9yKGVxTWFzaywgc3RhdGUsIGFjdGlvbil7XG4gICAgICAgIHRoaXMuZXFNYXNrID0gZXFNYXNrO1xuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIHRoaXMuYWN0aW9uID0gYWN0aW9uO1xuICAgIH1cblxuICAgIG1hdGNoZXMoc3RhdGUpe1xuICAgICAgICB2YXIgZXFTdGF0ZSA9IHN0YXRlICYgdGhpcy5lcU1hc2s7XG4gICAgICAgIHJldHVybiBlcVN0YXRlID09PSB0aGlzLnN0YXRlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnN0YXRlfSAtPiAke3RoaXMuYWN0aW9ufWA7XG4gICAgfVxufVxuXG5jbGFzcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICAvKipcbiAgICAgKiBNZXRob2RzIHRoYXQgZGVjb2RlIGdlbm9tZXMgaW50byBydWxlc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcsIGNvZGVSYW5nZT0yNTYpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBuZXcgQWN0aW9uTWFwKG1hcHBpbmcsIGNvZGVSYW5nZSk7XG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXkpe1xuXG4gICAgfVxufVxuXG5cbmNsYXNzIFByb21vdG9ySW50ZXJwcmV0ZXIgZXh0ZW5kcyBHZW5vbWVJbnRlcnByZXRlcntcbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nKXtcbiAgICAgICAgc3VwZXIobWFwcGluZywgNjQpOyAvLyB0ZXJtaW5hdG9yIGNvbnRyaWJ1dGVzIGxvd2VyIDYgYml0czogcmFuZ2UgMC02M1xuICAgIH1cbiAgICBpbnRlcnByZXQoYnl0ZWFycmF5LCBwbGFudD1udWxsKXtcbiAgICAgICAgdmFyIHJ1bGVzID0gW107XG4gICAgICAgIHZhciBiZWhhdmlvcmFsR2VuZXMgPSBbXTtcbiAgICAgICAgdmFyIHN0cnVjdHVyYWxHZW5lcyA9IFtdO1xuICAgICAgICB2YXIgZ2VuZSA9IFtdO1xuICAgICAgICBcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBieXRlYXJyYXkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGMgPSBieXRlYXJyYXlbaV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKGJpdFNldChjLCA3KSl7XG4gICAgICAgICAgICAgICAgLy8gU3RhcnQgb2YgYSBnZW5lXG4gICAgICAgICAgICAgICAgZ2VuZSA9IFtjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoYml0U2V0KGMsIDYpKXtcbiAgICAgICAgICAgICAgICAvLyBUZXJtaW5hdG9yIChFbmQgb2YgYSBnZW5lKVxuICAgICAgICAgICAgICAgIGlmKGdlbmUubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIGdlbmUucHVzaChjKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQml0IDUgb2YgdGhlIHN0YXJ0aW5nIHByb21vdG9yIGRldGVybWluZXMgaWYgaXQncyBzdHJ1Y3R1cmFsXG4gICAgICAgICAgICAgICAgICAgIGlmIChiaXRTZXQoZ2VuZVswXSwgNSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cnVjdHVyYWxHZW5lcy5wdXNoKGdlbmUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVoYXZpb3JhbEdlbmVzLnB1c2goZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZ2VuZSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ2VuZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgZ2VuZS5wdXNoKGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvY2VzcyBTdHJ1Y3R1cmFsIEdlbmVzIChQaGVub3R5cGljIFRyYWl0cylcbiAgICAgICAgaWYgKHBsYW50KSB7XG4gICAgICAgICAgICBzdHJ1Y3R1cmFsR2VuZXMuZm9yRWFjaChmdW5jdGlvbihnZW5lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhaXRDb2RlID0gZ2VuZVtnZW5lLmxlbmd0aCAtIDFdICYgMHgzRjtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IChnZW5lLmxlbmd0aCAtIDIpICogMC4wMTsgLy8gU3RyZW5ndGggZGVwZW5kcyBvbiBnZW5lIGxlbmd0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHN3aXRjaCh0cmFpdENvZGUgJSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMDogcGxhbnQudHJhaXRzLmxlYW5vdmVyID0gTWF0aC5tYXgoMC4xLCBwbGFudC50cmFpdHMubGVhbm92ZXIgLSB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IHBsYW50LnRyYWl0cy5hdHRhY2sgPSBNYXRoLm1pbig1LjAsIHBsYW50LnRyYWl0cy5hdHRhY2sgKyB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IHBsYW50LnRyYWl0cy5lZmZpY2llbmN5ID0gTWF0aC5tYXgoMC4xLCBwbGFudC50cmFpdHMuZWZmaWNpZW5jeSAtIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogcGxhbnQudHJhaXRzLmRlYXRoID0gTWF0aC5tYXgoMC4xLCBwbGFudC50cmFpdHMuZGVhdGggLSB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJvY2VzcyBCZWhhdmlvcmFsIEdlbmVzIChTdGF0ZS1BY3Rpb24gUnVsZXMpXG4gICAgICAgIGJlaGF2aW9yYWxHZW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGdlbmUpe1xuICAgICAgICAgICAgLy8gZXh0cmFjdCA2IGxlYXN0IHNpZyBiaXRzIGZyb20gdGVybWluYXRvciBhcyB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgICAgIHZhciBhY3Rpb25Db2RlID0gZ2VuZVtnZW5lLmxlbmd0aC0xXSAmIDB4M0Y7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5tYXBwaW5nLmdldEFjdGlvbihhY3Rpb25Db2RlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gdGFrZSBpbmZvcm1hdGlvbiBmcm9tIG9wZXJhdG9ycyB0byBjcmVhdGUgMzItYml0IHN0YXRlIG1hc2tcbiAgICAgICAgICAgIHZhciBtYXNrID0gMDtcbiAgICAgICAgICAgIHZhciBlcU1hc2sgPSAwOyBcbiAgICAgICAgICAgIGZvcih2YXIgaT0xOyBpPGdlbmUubGVuZ3RoLTE7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIDUgbGVhc3Qgc2lnIGJpdHMgZGV0ZXJtaW5lIHRoZSBtYXNrIGluZGV4ICgwLTMxKVxuICAgICAgICAgICAgICAgIHZhciBtYXNrQml0ID0gZ2VuZVtpXSAmIDB4MUY7XG5cbiAgICAgICAgICAgICAgICAvLyA2dGggYml0IGRldGVybWluZXMgaWYgd2UgbWF0Y2ggMSBvciAwXG4gICAgICAgICAgICAgICAgdmFyIGJpdFN0YXRlID0gKGdlbmVbaV0gJiAweDIwKSA+PiA1O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFVzZSB1bnNpZ25lZCBzaGlmdCBsb2dpYyBmb3IgMzItYml0IGNvbnNpc3RlbmN5XG4gICAgICAgICAgICAgICAgY29uc3QgYml0VmFsdWUgPSAoMSA8PCBtYXNrQml0KSA+Pj4gMDtcbiAgICAgICAgICAgICAgICBpZiAoYml0U3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFzayA9IChtYXNrIHwgYml0VmFsdWUpID4+PiAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlcU1hc2sgPSAoZXFNYXNrIHwgYml0VmFsdWUpID4+PiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZShlcU1hc2ssIG1hc2ssIGFjdGlvbikpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcnVsZXM7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBiaXRTZXQoYnl0ZSwgaSl7XG4gICAgcmV0dXJuIChieXRlID4+IGkpICYgMTtcbn1cblxuZXhwb3J0IHtCeXRlQXJyYXksIFByb21vdG9ySW50ZXJwcmV0ZXIsIE11dGF0b3J9OyIsImltcG9ydCB7cmFuZG9tSW50LCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7Q2VsbH0gZnJvbSBcIi4vY2VsbC5qc1wiO1xuaW1wb3J0IHtORUlHSEJPVVJIT09EfSBmcm9tIFwiLi9hY3Rpb25zLmpzXCI7XG5cbmNsYXNzIFBsYW50e1xuICAgIGNvbnN0cnVjdG9yKHgsIHdvcmxkLCBnZW5vbWUsIGJpcnRoU3RlcCwgdXNlSW50ZXJuYWxTdGF0ZT1mYWxzZSkge1xuICAgICAgICB0aGlzLndvcmxkID0gd29ybGQ7XG4gICAgICAgIHRoaXMuZW5lcmdpc2VkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmNlbGxzID0gW25ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgMCldO1xuICAgICAgICB0aGlzLmdlbm9tZSA9IGdlbm9tZTtcbiAgICAgICAgdGhpcy51c2VJbnRlcm5hbFN0YXRlID0gdXNlSW50ZXJuYWxTdGF0ZTtcbiAgICAgICAgdGhpcy5ydWxlcyA9IG51bGw7IC8vIGNhY2hlZCBydWxlc1xuICAgICAgICB0aGlzLmxlYW5vdmVyRW5lcmdpc2VkID0gMDsgLy8gSW5jcmVtZW50YWwgdHJhY2tpbmdcbiAgICAgICAgdGhpcy5iaXJ0aFN0ZXAgPSBiaXJ0aFN0ZXA7XG4gICAgICAgIHRoaXMubnV0cmllbnRDb3VudCA9IDEwLjA7IC8vIFN0YXJ0IHdpdGggc29tZSBudXRyaWVudHNcbiAgICAgICAgdGhpcy50cmFpdHMgPSB7XG4gICAgICAgICAgICBsZWFub3ZlcjogMS4wLFxuICAgICAgICAgICAgZGVhdGg6IDEuMCxcbiAgICAgICAgICAgIGF0dGFjazogMS4wLFxuICAgICAgICAgICAgZWZmaWNpZW5jeTogMS4wXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZ2V0TmVpZ2hib3VyaG9vZChjZWxsKXtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBuZWlnaGJvdXJob29kIG1hc2tcbiAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTxORUlHSEJPVVJIT09ELmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBwb3MgPSBORUlHSEJPVVJIT09EW2ldO1xuICAgICAgICAgICAgdmFyIHggPSBjZWxsLnggKyBwb3NbMF07XG4gICAgICAgICAgICB2YXIgeSA9IGNlbGwueSArIHBvc1sxXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQm91bmRzIGNoZWNrIGluc3RlYWQgb2YgdHJ5LWNhdGNoXG4gICAgICAgICAgICBpZiAoeCA+PSAwICYmIHggPCB0aGlzLndvcmxkLndpZHRoICYmIHkgPj0gMCAmJiB5IDwgdGhpcy53b3JsZC5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgd29ybGRQb3MgPSB0aGlzLndvcmxkLmNlbGxzW3hdW3ldO1xuICAgICAgICAgICAgICAgIGlmICh3b3JsZFBvcyBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgICAgICAgICBtYXNrID0gbWFzayB8ICgxIDw8IGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFzaztcbiAgICB9XG5cbiAgICBnZXRTdGF0ZShjZWxsKXtcbiAgICAgICAgY29uc3QgbmVpZ2hib3Job29kID0gdGhpcy5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICBcbiAgICAgICAgLy8gQmFzaWMgMTYtYml0IHN0YXRlXG4gICAgICAgIGxldCBzdGF0ZSA9IG5laWdoYm9yaG9vZCB8IChjZWxsLmludGVybmFsU3RhdGUgPDwgOCkgfCAoKGNlbGwuZW5lcmdpc2VkID8gMSA6IDApIDw8IDE1KTtcbiAgICAgICAgXG4gICAgICAgIC8vIE5pY2hlIGVuaGFuY2VtZW50cyAoMzItYml0KVxuICAgICAgICAvLyBCaXRzIDAtNzogTmVpZ2hib3IgcHJlc2VuY2UgKGluIG5laWdoYm9yaG9vZClcbiAgICAgICAgLy8gQml0cyA4LTE1OiBOZWlnaGJvciBQdWJsaWMgQml0cyAoQml0IDggb2YgbmVpZ2hib3IgaW50ZXJuYWxTdGF0ZSlcbiAgICAgICAgLy8gQml0cyAxNi0yMzogTmVpZ2hib3IgRW5lcmd5IFN0YXR1c1xuICAgICAgICAvLyBCaXRzIDI0LTMwOiBTZWxmIEludGVybmFsIFN0YXRlXG4gICAgICAgIC8vIEJpdCAzMTogU2VsZiBFbmVyZ2lzZWRcbiAgICAgICAgXG4gICAgICAgIGxldCBuZWlnaGJvclNpZ25hbHMgPSAwO1xuICAgICAgICBsZXQgbmVpZ2hib3JFbmVyZ3kgPSAwO1xuICAgICAgICBcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8TkVJR0hCT1VSSE9PRC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgcG9zID0gTkVJR0hCT1VSSE9PRFtpXTtcbiAgICAgICAgICAgIHZhciB4ID0gY2VsbC54ICsgcG9zWzBdO1xuICAgICAgICAgICAgdmFyIHkgPSBjZWxsLnkgKyBwb3NbMV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh4ID49IDAgJiYgeCA8IHRoaXMud29ybGQud2lkdGggJiYgeSA+PSAwICYmIHkgPCB0aGlzLndvcmxkLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICAgICAgaWYgKHdvcmxkUG9zIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIEJpdCAwIG9mIG5laWdoYm9yJ3MgaW50ZXJuYWwgc3RhdGUgKGFzIHRoZWlyIFB1YmxpYyBCaXQpXG4gICAgICAgICAgICAgICAgICAgIGlmICgod29ybGRQb3MuaW50ZXJuYWxTdGF0ZSAmIDEpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvclNpZ25hbHMgfD0gKDEgPDwgaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmxkUG9zLmVuZXJnaXNlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JFbmVyZ3kgfD0gKDEgPDwgaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb25zdHJ1Y3QgMzItYml0IHN0YXRlXG4gICAgICAgIC8vIFdlIHVzZSB1bnNpZ25lZCByaWdodCBzaGlmdCBmb3IgMzItYml0IGNvbnNpc3RlbmN5XG4gICAgICAgIHN0YXRlID0gKG5laWdoYm9yaG9vZCAmIDB4RkYpIHwgXG4gICAgICAgICAgICAgICAgKChuZWlnaGJvclNpZ25hbHMgJiAweEZGKSA8PCA4KSB8IFxuICAgICAgICAgICAgICAgICgobmVpZ2hib3JFbmVyZ3kgJiAweEZGKSA8PCAxNikgfCBcbiAgICAgICAgICAgICAgICAoKGNlbGwuaW50ZXJuYWxTdGF0ZSAmIDB4N0YpIDw8IDI0KSB8IFxuICAgICAgICAgICAgICAgICgoY2VsbC5lbmVyZ2lzZWQgPyAxIDogMCkgPDwgMzEpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gc3RhdGUgPj4+IDA7IFxuICAgIH1cblxuICAgIG1ldGFib2xpc20ocGFyYW1zKSB7XG4gICAgICAgIGlmIChwYXJhbXMuc2ltX21vZGUgIT09IFwibmljaGVcIikgcmV0dXJuO1xuXG4gICAgICAgIC8vIDEuIEV4dHJhY3Rpb24gZnJvbSByb290cyAoeT0wKVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgICAgICAgICAgaWYgKGNlbGwueSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IHRoaXMud29ybGQuc29pbE51dHJpZW50c1tjZWxsLnhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFtb3VudCA9IE1hdGgubWluKGF2YWlsYWJsZSwgcGFyYW1zLm51dHJpZW50X2V4dHJhY3RfcmF0ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5udXRyaWVudENvdW50ICs9IGFtb3VudDtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLnNvaWxOdXRyaWVudHNbY2VsbC54XSAtPSBhbW91bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBNYWludGVuYW5jZSBjb3N0XG4gICAgICAgIC8vIFRyYWl0cyBjYW4gcmVkdWNlIG1haW50ZW5hbmNlIGNvc3RcbiAgICAgICAgY29uc3QgY29zdCA9IHRoaXMuY2VsbHMubGVuZ3RoICogcGFyYW1zLm51dHJpZW50X21haW50ZW5hbmNlX2Nvc3QgKiB0aGlzLnRyYWl0cy5lZmZpY2llbmN5O1xuICAgICAgICB0aGlzLm51dHJpZW50Q291bnQgPSBNYXRoLm1heCgwLCB0aGlzLm51dHJpZW50Q291bnQgLSBjb3N0KTtcbiAgICB9XG5cbiAgICBncm93KCl7XG4gICAgICAgIHRoaXMuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIC8vIDUwJSBjaGFuY2UgdG8gZ3Jvd1xuICAgICAgICAgICAgaWYocmFuZG9tUHJvYigwLjgpKXtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VzID0gdGhpcy5nZXRHcm93RGlyZWN0aW9uKGNlbGwpO1xuICAgICAgICAgICAgICAgIGlmKHNwYWNlcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHNwYWNlc1tyYW5kb21JbnQoMCwgc3BhY2VzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdyb3cgdGhlIHBsYW50IGJ5IG9uZSBjZWxsIGlmIHBvc3NpYmxlXG4gICAgICogQHBhcmFtIHsqfSBjZWxsIHRoZSBjZWxsIHRvIGdyb3cgZnJvbVxuICAgICAqIEBwYXJhbSB7Kn0gZGlyZWN0aW9uIHRoZSBkaXJlY3Rpb24gdG8gZ3JvdyBpblxuICAgICAqL1xuICAgIGdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24sIHN0ZXBudW0pe1xuICAgICAgICB2YXIgeCA9IGNlbGwueCtkaXJlY3Rpb25bMF0sIHkgPSBjZWxsLnkrZGlyZWN0aW9uWzFdO1xuICAgICAgICAvLyBjaGVjayBpZiBzcGFjZSBpcyBjbGVhclxuICAgICAgICB2YXIgc3BhY2UgPSB0aGlzLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgICAgIGlmIChzcGFjZSA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BhY2UgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgIGlmIChzcGFjZS5wbGFudCA9PT0gdGhpcyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBdHRhY2sgb2NjdXJzXG4gICAgICAgICAgICBpZiAodGhpcy53b3JsZC5vbkF0dGFjaykgdGhpcy53b3JsZC5vbkF0dGFjaygpO1xuXG4gICAgICAgICAgICAvLyB0aGlzIHBsYW50IHdpbGwga2lsbCB0aGUgb3RoZXIgd2l0aCBhIHByb2JhYmlsaXR5XG4gICAgICAgICAgICAvLyBkZXRlcm1pbmVkIGJ5IGRlZmVuZGVyJ3MgZW5lcmd5IGFuZCBhdHRhY2tlcidzIGF0dGFjayB0cmFpdFxuICAgICAgICAgICAgY29uc3Qgc3VjY2Vzc1Byb2IgPSBzcGFjZS5wbGFudC5nZXRLaWxsUHJvYmFiaWxpdHkoKSAqIHRoaXMuZ2V0QXR0YWNrQm9udXMoKTtcbiAgICAgICAgICAgIGlmKHJhbmRvbVByb2Ioc3VjY2Vzc1Byb2IpKXtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgc3VjY2VlZGVkLiBLaWxsIGNvbXBldGl0b3IgYW5kIGNvbnRpbnVlIHdpdGggZ3Jvd3RoXG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZC5raWxsUGxhbnQoc3BhY2UucGxhbnQsIHBhcmFtcyA/IHBhcmFtcy5udXRyaWVudF9yZWN5Y2xpbmdfZmFjdG9yIDogMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhdHRhY2sgZmFpbGVkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgLy8gZ3JvdyBjZWxsIGluIHRvIGVtcHR5IHNwYWNlXG4gICAgICAgIHZhciBuZXdfY2VsbCA9IG5ldyBDZWxsKHRoaXMsIHRoaXMud29ybGQuZ2V0WCh4KSwgeSk7XG4gICAgICAgIHRoaXMuY2VsbHMucHVzaChuZXdfY2VsbCk7XG4gICAgICAgIFxuICAgICAgICAvLyBVcGRhdGUgaW5jcmVtZW50YWwgdHJhY2tpbmdcbiAgICAgICAgY29uc3Qgcm9vdENlbGwgPSB0aGlzLmNlbGxzWzBdO1xuICAgICAgICBjb25zdCBsZSA9IHRoaXMud29ybGQud2lkdGgvMiAtICggKCggMS41KnRoaXMud29ybGQud2lkdGggKSArIG5ld19jZWxsLnggLSByb290Q2VsbC54KSAgJSB0aGlzLndvcmxkLndpZHRoKTtcbiAgICAgICAgdGhpcy5sZWFub3ZlckVuZXJnaXNlZCArPSBsZTtcblxuICAgICAgICB0aGlzLndvcmxkLmFkZENlbGwobmV3X2NlbGwpO1xuICAgIH1cblxuICAgIG1ldGFib2xpc20ocGFyYW1zKSB7XG4gICAgICAgIGlmIChwYXJhbXMuc2ltX21vZGUgIT09IFwibmljaGVcIikgcmV0dXJuO1xuXG4gICAgICAgIC8vIFRhcmdldCBzdG9yZSBpcyAxMHggdGhlIGN1cnJlbnQgbWFpbnRlbmFuY2UgY29zdFxuICAgICAgICBjb25zdCBiYXNlTWFpbnQgPSB0aGlzLmNlbGxzLmxlbmd0aCAqIHBhcmFtcy5udXRyaWVudF9tYWludGVuYW5jZV9jb3N0O1xuICAgICAgICBjb25zdCB0YXJnZXRTdG9yZSA9IGJhc2VNYWludCAqIDEwLjA7XG4gICAgICAgIGNvbnN0IGh1bmdlciA9IE1hdGgubWF4KDAuMSwgTWF0aC5taW4oMS4wLCAxLjAgLSAodGhpcy5udXRyaWVudENvdW50IC8gKHRhcmdldFN0b3JlICsgMC4xKSkpKTtcblxuICAgICAgICAvLyAxLiBFeHRyYWN0aW9uIGZyb20gcm9vdHMgKHk9MClcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjZWxsID0gdGhpcy5jZWxsc1tpXTtcbiAgICAgICAgICAgIGlmIChjZWxsLnkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhdmFpbGFibGUgPSB0aGlzLndvcmxkLnNvaWxOdXRyaWVudHNbY2VsbC54XTtcbiAgICAgICAgICAgICAgICBsZXQgZXh0cmFjdFJhdGUgPSBwYXJhbXMubnV0cmllbnRfZXh0cmFjdF9yYXRlICogaHVuZ2VyO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGxldCBhY3R1YWxBbW91bnQgPSAwO1xuICAgICAgICAgICAgICAgIC8vIEFjdGl2ZSBFeHRyYWN0aW9uOiBjb25zdW1lcyBlbmVyZ3kgZm9yIGhpZ2hlciByYXRlXG4gICAgICAgICAgICAgICAgaWYgKGNlbGwuZW5lcmdpc2VkICYmIGh1bmdlciA+IDAuMikge1xuICAgICAgICAgICAgICAgICAgICBjZWxsLmVuZXJnaXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBhY3R1YWxBbW91bnQgPSBNYXRoLm1pbihhdmFpbGFibGUsIGV4dHJhY3RSYXRlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBQYXNzaXZlIEV4dHJhY3Rpb246IHNsb3cgYnV0IGZyZWVcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsQW1vdW50ID0gTWF0aC5taW4oYXZhaWxhYmxlLCBleHRyYWN0UmF0ZSAqIDAuMSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5udXRyaWVudENvdW50ICs9IGFjdHVhbEFtb3VudDtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLnNvaWxOdXRyaWVudHNbY2VsbC54XSAtPSBhY3R1YWxBbW91bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiBNYWludGVuYW5jZSBjb3N0XG4gICAgICAgIC8vIFRyYWl0cyBjYW4gcmVkdWNlIG1haW50ZW5hbmNlIGNvc3RcbiAgICAgICAgY29uc3QgY29zdCA9IGJhc2VNYWludCAqIHRoaXMudHJhaXRzLmVmZmljaWVuY3k7XG4gICAgICAgIHRoaXMubnV0cmllbnRDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMubnV0cmllbnRDb3VudCAtIGNvc3QpO1xuICAgIH1cblxuICAgIGdldEtpbGxQcm9iYWJpbGl0eSgpe1xuICAgICAgICAvLyBQcm9iYWJpbGl0eSB0aGF0IFRISVMgcGxhbnQgaXMga2lsbGVkIChkZWZlbmRlcidzIHN0YXRzKVxuICAgICAgICAvLyBNb3JlIGVuZXJneSA9IGhhcmRlciB0byBraWxsXG4gICAgICAgIHJldHVybiB0aGlzLmVuZXJnaXNlZENvdW50ID4gMCA/IDEvdGhpcy5lbmVyZ2lzZWRDb3VudCA6IDEuMDtcbiAgICB9XG5cbiAgICBnZXRBdHRhY2tCb251cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhaXRzLmF0dGFjaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGUgd2hldGhlciB0aGlzIHBsYW50IHNob3VsZCBkaWUuXG4gICAgICogQHBhcmFtIHt9IG5hdHVyYWxfZXhwIGV4cG9uZW50IHRvIHRoZSBudW1iZXIgb2YgY2VsbHNcbiAgICAgKiBAcGFyYW0geyp9IGVuZXJneV9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBlbmVyZ3kgcmljaCBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gbGVhbm92ZXJfZmFjdG9yIGZhY3RvciB0byB0aGUgbGVhbm92ZXIgdGVybVxuICAgICAqL1xuICAgIGdldERlYXRoUHJvYmFiaWxpdHkoZGVhdGhfZmFjdG9yLCBuYXR1cmFsX2V4cCwgZW5lcmd5X2V4cCwgbGVhbm92ZXJfZmFjdG9yLCBzaW1fbW9kZT1cImNsYXNzaWNcIil7XG4gICAgICAgIHZhciBudW1DZWxscyA9IHRoaXMuY2VsbHMubGVuZ3RoO1xuICAgICAgICBcbiAgICAgICAgdmFyIGxlYW5vdmVyQ2VsbHMgPSAyLyhudW1DZWxscyoobnVtQ2VsbHMtMSkpO1xuICAgICAgICBpZiAobGVhbm92ZXJDZWxscyA9PT0gSW5maW5pdHkpe1xuICAgICAgICAgICAgbGVhbm92ZXJDZWxscyA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVhbm92ZXJUZXJtID0gbGVhbm92ZXJDZWxscypNYXRoLmFicyh0aGlzLmxlYW5vdmVyRW5lcmdpc2VkKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBkX25hdHVyYWwgPSBNYXRoLnBvdyhudW1DZWxscywgbmF0dXJhbF9leHApO1xuICAgICAgICB2YXIgZF9lbmVyZ3kgPSBNYXRoLnBvdyh0aGlzLmVuZXJnaXNlZENvdW50KzEsIGVuZXJneV9leHApO1xuICAgICAgICB2YXIgZF9sZWFub3ZlciA9IChsZWFub3Zlcl9mYWN0b3IgKiB0aGlzLnRyYWl0cy5sZWFub3ZlcikgKiBsZWFub3ZlclRlcm07XG4gICAgICAgIFxuICAgICAgICAvLyBCYXNlIHByb2JhYmlsaXR5IG1vZGlmaWVkIGJ5IGRlYXRoIHRyYWl0XG4gICAgICAgIHZhciBwRGVhdGggPSAoZGVhdGhfZmFjdG9yICogdGhpcy50cmFpdHMuZGVhdGgpICogZF9uYXR1cmFsICogZF9lbmVyZ3kgKyBkX2xlYW5vdmVyO1xuICAgICAgICBcbiAgICAgICAgLy8gTmljaGUgbW9kZSBzcGVjaWZpYyBwZW5hbHRpZXNcbiAgICAgICAgaWYgKHNpbV9tb2RlID09PSBcIm5pY2hlXCIpIHtcbiAgICAgICAgICAgIC8vIFN0YXJ2YXRpb24gcGVuYWx0eVxuICAgICAgICAgICAgaWYgKHRoaXMubnV0cmllbnRDb3VudCA8PSAwICYmIG51bUNlbGxzID4gMSkge1xuICAgICAgICAgICAgICAgIHBEZWF0aCArPSAwLjA1OyAvLyA1JSBmbGF0IGluY3JlYXNlIGlmIHN0YXJ2aW5nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgXCJwcm9iXCI6IHBEZWF0aCxcbiAgICAgICAgICAgIFwibmF0dXJhbFwiOiBkX25hdHVyYWwsXG4gICAgICAgICAgICBcImVuZXJneVwiOiBkX2VuZXJneSxcbiAgICAgICAgICAgIFwibGVhbm92ZXJcIjogZF9sZWFub3ZlcixcbiAgICAgICAgICAgIFwibnV0cmllbnRzXCI6IHRoaXMubnV0cmllbnRDb3VudFxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IHsgUGxhbnQgfTsiLCJpbXBvcnQgc2VlZHJhbmRvbSBmcm9tIFwic2VlZHJhbmRvbVwiO1xuXG4vKipcbiAqIFNlZWQgYWxsIGZ1dHVyZSBjYWxscyB0byBNYXRoLnJhbmRvbVxuICogQHBhcmFtIHsqfSBzZWVkIGRhdGEgdG8gdXNlIHRvIHNlZWQgYWxsIGZ1dHVyZSBSTkcgY2FsbHNcbiAqL1xuZnVuY3Rpb24gc2VlZFJhbmRvbShzZWVkKXtcbiAgICBzZWVkcmFuZG9tKHNlZWQsIHtnbG9iYWw6IHRydWV9KTtcbn1cblxuLyoqXG4gKiByZXR1cm5zIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiAwIGFuZCBtYXggKGluY2x1c2l2ZSlcbiAqIEBwYXJhbSB7Kn0gbWF4IG1heGltdW0gaW50ZWdlciB0byBnZW5lcmF0ZSBhcyBhIHJhbmRvbSBudW1iZXJcbiAqL1xuZnVuY3Rpb24gcmFuZG9tSW50KG1pbiwgbWF4KXtcbiAgICAvLyBub3RlOiBNYXRoLnJhbmRvbSByZXR1cm5zIGEgcmFuZG9tIG51bWJlciBleGNsdXNpdmUgb2YgMSxcbiAgICAvLyBzbyB0aGVyZSBpcyArMSBpbiB0aGUgYmVsb3cgZXF1YXRpb24gdG8gZW5zdXJlIHRoZSBtYXhpbXVtXG4gICAgLy8gbnVtYmVyIGlzIGNvbnNpZGVyZWQgd2hlbiBmbG9vcmluZyAwLjkuLi4gcmVzdWx0cy5cbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZXMgdGhlIGNoYW5jZSBvZiBhbiBldmVudCBoYXBwZW5pbmcgZ2l2ZW4gcHJvYlxuICogQHBhcmFtIHsqfSBwcm9iIGZyYWN0aW9uIGJldHdlZW4gMCBhbmQgMSBjaGFuY2Ugb2YgdGhlIGV2ZW50IGhhcHBlbmluZ1xuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgZXZlbnQgaGFwcGVucywgZmFsc2UgaWYgbm90XG4gKi9cbmZ1bmN0aW9uIHJhbmRvbVByb2IocHJvYil7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgPD0gcHJvYjtcbn1cblxuZXhwb3J0IHtzZWVkUmFuZG9tLCByYW5kb21JbnQsIHJhbmRvbVByb2J9OyIsImltcG9ydCAqIGFzIHN0YXRzIGZyb20gXCJzdGF0cy1saXRlXCI7XG5cbmZ1bmN0aW9uIGxldmVuc2h0ZWluKGEsIGIpIHtcbiAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiBiLmxlbmd0aDtcbiAgICBpZiAoYi5sZW5ndGggPT09IDApIHJldHVybiBhLmxlbmd0aDtcbiAgICBsZXQgbWF0cml4ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gYi5sZW5ndGg7IGkrKykgbWF0cml4W2ldID0gW2ldO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDw9IGEubGVuZ3RoOyBqKyspIG1hdHJpeFswXVtqXSA9IGo7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gYi5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8PSBhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoYltpIC0gMV0gPT09IGFbaiAtIDFdKSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gbWF0cml4W2kgLSAxXVtqIC0gMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqXSA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICBtYXRyaXhbaSAtIDFdW2ogLSAxXSArIDEsIC8vIHN1YnN0aXR1dGlvblxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpXVtqIC0gMV0gKyAxLCAvLyBpbnNlcnRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1bal0gKyAxICAvLyBkZWxldGlvblxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0cml4W2IubGVuZ3RoXVthLmxlbmd0aF07XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUFsbGVsZUVudHJvcHkocGxhbnRzKSB7XG4gICAgaWYgKHBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIGNvbnN0IGNvdW50cyA9IG5ldyBBcnJheSgyNTYpLmZpbGwoMCk7XG4gICAgbGV0IHRvdGFsID0gMDtcbiAgICBwbGFudHMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwLmdlbm9tZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY291bnRzW3AuZ2Vub21lW2ldXSsrO1xuICAgICAgICAgICAgdG90YWwrKztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0b3RhbCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgbGV0IGVudHJvcHkgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICAgICAgaWYgKGNvdW50c1tpXSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBjb3VudHNbaV0gLyB0b3RhbDtcbiAgICAgICAgICAgIGVudHJvcHkgLT0gcCAqIE1hdGgubG9nMihwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZW50cm9weTtcbn1cblxuY2xhc3MgU2ltRGF0YSB7XG5cbiAgICBjb25zdHJ1Y3RvcihzaW11bGF0aW9uKSB7XG4gICAgICAgIHRoaXMuc2ltID0gc2ltdWxhdGlvbjtcbiAgICAgICAgdGhpcy5kYXRhID0geyBcInN0ZXBudW1cIjogW10gfTtcbiAgICAgICAgdGhpcy5sYXN0U3RlcCA9IDA7XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycyA9IFtcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwb3B1bGF0aW9uXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJ1bmlxdWVfZ2Vub3R5cGVzXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgICAgIHNpbS53b3JsZC5wbGFudHMuZm9yRWFjaChwID0+IHNlZW4uYWRkKHAuZ2Vub21lLnNlcmlhbGl6ZSgpKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlZW4uc2l6ZTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInRvdGFsX2NlbGxzXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2ltLndvcmxkLmNlbGxDb3VudDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19zaXplXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQuY2VsbENvdW50IC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfZW5lcmdpc2VkXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgcC5lbmVyZ2lzZWRDb3VudCwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfYWN0aXZlX2dlbmVzXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgKHAucnVsZXMgPyBwLnJ1bGVzLmxlbmd0aCA6IDApLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19hZ2VcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyAoc2ltLnN0ZXBudW0gLSBwLmJpcnRoU3RlcCksIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidG90YWxfc2VlZHNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkgeyByZXR1cm4gc2ltLnN0YXRzLnRvdGFsU2VlZHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImZseWluZ19zZWVkc1wiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7IHJldHVybiBzaW0uc3RhdHMuZmx5aW5nU2VlZHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcIm5ld19wbGFudHNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkgeyByZXR1cm4gc2ltLnN0YXRzLm5ld1BsYW50czsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZGVhdGhzXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHsgcmV0dXJuIHNpbS5zdGF0cy5kZWF0aHM7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF0dGFja3NcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkgeyByZXR1cm4gc2ltLnN0YXRzLmF0dGFja3M7IH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19kZWF0aF9wcm9iXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKHN1bSwgcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VtICsgcC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2ltLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLnNpbV9tb2RlXG4gICAgICAgICAgICAgICAgICAgICkucHJvYjtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19udXRyaWVudHNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLm51dHJpZW50Q291bnQsIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwic29pbF9udXRyaWVudHNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGlmICghc2ltLndvcmxkLnNvaWxOdXRyaWVudHMgfHwgc2ltLndvcmxkLnNvaWxOdXRyaWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5zb2lsTnV0cmllbnRzLnJlZHVjZSgoc3VtLCBuKSA9PiBzdW0gKyBuLCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQuc29pbE51dHJpZW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhdmdfdHJhaXRzXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiB7IGxlYW46IDEsIGF0dGFjazogMSwgZWZmOiAxLCBkZWF0aDogMSB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFscyA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChhY2MsIHApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWNjLmxlYW4gKz0gcC50cmFpdHMubGVhbm92ZXI7XG4gICAgICAgICAgICAgICAgICAgIGFjYy5hdHRhY2sgKz0gcC50cmFpdHMuYXR0YWNrO1xuICAgICAgICAgICAgICAgICAgICBhY2MuZWZmICs9IHAudHJhaXRzLmVmZmljaWVuY3k7XG4gICAgICAgICAgICAgICAgICAgIGFjYy5kZWF0aCArPSBwLnRyYWl0cy5kZWF0aDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LCB7IGxlYW46IDAsIGF0dGFjazogMCwgZWZmOiAwLCBkZWF0aDogMCB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBuID0gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbGVhbjogdG90YWxzLmxlYW4gLyBuLFxuICAgICAgICAgICAgICAgICAgICBhdHRhY2s6IHRvdGFscy5hdHRhY2sgLyBuLFxuICAgICAgICAgICAgICAgICAgICBlZmY6IHRvdGFscy5lZmYgLyBuLFxuICAgICAgICAgICAgICAgICAgICBkZWF0aDogdG90YWxzLmRlYXRoIC8gblxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwbGFudF9zaXplX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuY2VsbHMubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbm9tZV9zaXplX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLmxlbmd0aCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJtdXRfZXhwX1wiLCBTdW1tYXJ5LCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHAuZ2Vub21lLm11dF9leHApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwicGxhbnRfaGVpZ2h0X1wiLCBTdW1tYXJ5LCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gWzBdO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLm1hcChwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1heEggPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHAuY2VsbHMubGVuZ3RoOyBpKyspIGlmIChwLmNlbGxzW2ldLnkgPiBtYXhIKSBtYXhIID0gcC5jZWxsc1tpXS55O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF4SDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImdlbmV0aWNfZGlzdGFuY2VfbWVhblwiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGxhbnRzID0gc2ltLndvcmxkLnBsYW50cztcbiAgICAgICAgICAgICAgICBpZiAocGxhbnRzLmxlbmd0aCA8IDIpIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGxldCBzdW1EaXN0ID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgc2FtcGxlU2l6ZSA9IE1hdGgubWluKDMwLCBwbGFudHMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBsZXQgcGFpcnMgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2FtcGxlU2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHAxID0gcGxhbnRzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBsYW50cy5sZW5ndGgpXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcDIgPSBwbGFudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGxhbnRzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBpZiAocDEgIT09IHAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1EaXN0ICs9IGxldmVuc2h0ZWluKHAxLmdlbm9tZSwgcDIuZ2Vub21lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhaXJzKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhaXJzID4gMCA/IHN1bURpc3QgLyBwYWlycyA6IDA7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJhbGxlbGVfZW50cm9weVwiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGN1bGF0ZUFsbGVsZUVudHJvcHkoc2ltLndvcmxkLnBsYW50cyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbGxlY3QgZGF0YSBmb3IgdGhlIGN1cnJlbnQgc3RlcFxuICAgICAqL1xuICAgIHJlY29yZFN0ZXAoKSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gdGhpcy5zaW0uc3RlcG51bSAtIHRoaXMubGFzdFN0ZXA7XG4gICAgICAgIHRoaXMubGFzdFN0ZXAgPSB0aGlzLnNpbS5zdGVwbnVtO1xuXG4gICAgICAgIHZhciBzdGVwRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLmNvbGxlY3RvcnMuZm9yRWFjaChmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGMuY29sbGVjdCh0aGlzLnNpbSk7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHN0ZXBEYXRhLCB2YWx1ZXMpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAvLyBOb3JtYWxpemUgcmF0ZS1iYXNlZCBtZXRyaWNzIGJ5IHRoZSBudW1iZXIgb2Ygc3RlcHMgc2luY2UgdGhlIGxhc3QgcmVjb3JkXG4gICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHJhdGVLZXlzID0gW1wibmV3X3BsYW50c1wiLCBcImRlYXRoc1wiLCBcImF0dGFja3NcIiwgXCJ0b3RhbF9zZWVkc1wiLCBcImZseWluZ19zZWVkc1wiXTtcbiAgICAgICAgICAgIHJhdGVLZXlzLmZvckVhY2goayA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN0ZXBEYXRhW2tdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RlcERhdGFba10gLz0gZGVsdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXNldCBpbmNyZW1lbnRhbCBzdGF0cyBmb3IgdGhlIG5leHQgaW50ZXJ2YWxcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMubmV3UGxhbnRzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMuZGVhdGhzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMuYXR0YWNrcyA9IDA7XG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLnRvdGFsU2VlZHMgPSAwO1xuICAgICAgICB0aGlzLnNpbS5zdGF0cy5mbHlpbmdTZWVkcyA9IDA7XG5cbiAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5wdXNoKHRoaXMuc2ltLnN0ZXBudW0pO1xuICAgICAgICBpZiAodGhpcy5kYXRhW1wic3RlcG51bVwiXS5sZW5ndGggPiBTaW1EYXRhLk1BWF9EQVRBX1BPSU5UUykge1xuICAgICAgICAgICAgdGhpcy5kYXRhW1wic3RlcG51bVwiXS5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5rZXlzKHN0ZXBEYXRhKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICBpZiAoIShrIGluIHRoaXMuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF0YVtrXS5wdXNoKHN0ZXBEYXRhW2tdKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGFba10ubGVuZ3RoID4gU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFba10uc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuU2ltRGF0YS5NQVhfREFUQV9QT0lOVFMgPSAyMDAwO1xuXG5jbGFzcyBDb2xsZWN0b3Ige1xuICAgIGNvbnN0cnVjdG9yKG5hbWUsIHR5cGVjbHMsIGNvbGxlY3RGdW5jKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMudHlwZSA9IG5ldyB0eXBlY2xzKG5hbWUpO1xuICAgICAgICB0aGlzLmZ1bmMgPSBjb2xsZWN0RnVuYztcbiAgICB9XG5cbiAgICBjb2xsZWN0KHNpbSkge1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZnVuYyhzaW0pO1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnRyYW5zZm9ybShkYXRhKTtcbiAgICB9XG59XG5cbmNsYXNzIENvbGxlY3RvclR5cGUge1xuICAgIGNvbnN0cnVjdG9yKG5hbWUpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5pbXBsZW1lbnRlZCBtZXRob2RcIik7XG4gICAgfVxuXG4gICAgdHJhbnNmb3JtKGRhdGEpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IHRoaXMudHJhbnNmb3JtRGF0YShkYXRhKTtcbiAgICAgICAgdmFyIHRyYW5zZm9ybWVkX2RhdGEgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXModmFsdWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICB0cmFuc2Zvcm1lZF9kYXRhW3RoaXMubmFtZSArIGtdID0gdmFsdWVzW2tdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybWVkX2RhdGE7XG4gICAgfVxufVxuXG5jbGFzcyBBc0lzIGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHsgXCJcIjogZGF0YSB9O1xuICAgIH1cbn1cblxuY2xhc3MgU3VtbWFyeSBleHRlbmRzIENvbGxlY3RvclR5cGUge1xuXG4gICAgdHJhbnNmb3JtRGF0YShkYXRhKSB7XG4gICAgICAgIHJldHVybiB7IFwibWluXCI6IE1hdGgubWluKGRhdGEpLCBcIm1lYW5cIjogc3RhdHMubWVhbihkYXRhKSwgXCJtYXhcIjogTWF0aC5tYXgoZGF0YSkgfTtcbiAgICB9XG59XG5leHBvcnQgeyBTaW1EYXRhIH07IiwiaW1wb3J0IHtzZWVkUmFuZG9tLCByYW5kb21Qcm9ifSBmcm9tIFwiLi9yYW5kb20uanNcIjtcbmltcG9ydCB7V29ybGR9IGZyb20gXCIuL3dvcmxkLmpzXCI7XG5pbXBvcnQge0J5dGVBcnJheSwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn0gZnJvbSBcIi4vZ2Vub21lLmpzXCI7XG5cbmNsYXNzIFNpbXVsYXRpb25QYXJhbXN7XG4gICAgY29uc3RydWN0b3IocGFyYW1zPXt9KXtcbiAgICAgICAgdGhpcy5yYW5kb21fc2VlZCA9IDE7XG4gICAgICAgIHRoaXMucmVjb3JkX2ludGVydmFsID0gMTA7XG4gICAgICAgIHRoaXMuc3RlcHNfcGVyX2ZyYW1lID0gMTtcbiAgICAgICAgdGhpcy5kaXN0dXJiYW5jZV9pbnRlcnZhbCA9IDA7XG4gICAgICAgIHRoaXMuZGlzdHVyYmFuY2Vfc3RyZW5ndGggPSAwLjE7XG5cbiAgICAgICAgdGhpcy53b3JsZF93aWR0aCA9IDI1MDtcbiAgICAgICAgdGhpcy53b3JsZF9oZWlnaHQgPSA0MDtcbiAgICAgICAgdGhpcy5pbml0aWFsX3BvcHVsYXRpb24gPSA1MDtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZW5lcmd5X3Byb2IgPSAwLjU7XG5cbiAgICAgICAgLy8gZGVhdGggcGFyYW1zXG4gICAgICAgIHRoaXMuZGVhdGhfZmFjdG9yID0gMC4yO1xuICAgICAgICB0aGlzLm5hdHVyYWxfZXhwID0gMDtcbiAgICAgICAgdGhpcy5lbmVyZ3lfZXhwID0gLTIuNTtcbiAgICAgICAgdGhpcy5sZWFub3Zlcl9mYWN0b3IgPSAwLjI7XG5cbiAgICAgICAgLy8gbXV0YXRpb25zXG4gICAgICAgIHRoaXMubXV0X3JlcGxhY2VfbW9kZSA9IFwiYnl0ZXdpc2VcIjtcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZSA9IDAuMDAyO1xuICAgICAgICB0aGlzLm11dF9pbnNlcnQgPSAwLjAwMDQ7XG4gICAgICAgIHRoaXMubXV0X2RlbGV0ZSA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZmFjdG9yID0gMS41O1xuICAgICAgICB0aGlzLmluaXRpYWxfbXV0X2V4cCA9IDA7XG5cbiAgICAgICAgdGhpcy5nZW5vbWVfaW50ZXJwcmV0ZXIgPSBcInByb21vdG9yXCI7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoID0gNDAwO1xuXG4gICAgICAgIC8vIE1vZGUgc2VsZWN0aW9uXG4gICAgICAgIHRoaXMuc2ltX21vZGUgPSBcIm5pY2hlXCI7IC8vIFwiY2xhc3NpY1wiIG9yIFwibmljaGVcIlxuXG4gICAgICAgIC8vIE5pY2hlIG1vZGU6IE51dHJpZW50c1xuICAgICAgICB0aGlzLm51dHJpZW50X21heCA9IDEwMC4wO1xuICAgICAgICB0aGlzLm51dHJpZW50X3JlcGxlbmlzaF9yYXRlID0gMS4wO1xuICAgICAgICB0aGlzLm51dHJpZW50X2V4dHJhY3RfcmF0ZSA9IDUuMDtcbiAgICAgICAgdGhpcy5udXRyaWVudF9tYWludGVuYW5jZV9jb3N0ID0gMC4wMjsgLy8gcGVyIGNlbGwgcGVyIHN0ZXBcbiAgICAgICAgdGhpcy5udXRyaWVudF9kaXZpZGVfY29zdCA9IDIuMDtcbiAgICAgICAgXG4gICAgICAgIC8vIER5bmFtaWMgU29pbCBQYXJhbXNcbiAgICAgICAgdGhpcy5udXRyaWVudF9wYXRjaGluZXNzID0gMC41OyAgICAgICAgIC8vIDAgKHVuaWZvcm0pIHRvIDEgKGhpZ2ggdmFyaWFuY2UpXG4gICAgICAgIHRoaXMubnV0cmllbnRfZGlmZnVzaW9uX3JhdGUgPSAwLjE7ICAgIC8vIDAgdG8gMVxuICAgICAgICB0aGlzLm51dHJpZW50X3JlY3ljbGluZ19mYWN0b3IgPSAwLjU7ICAvLyAwIHRvIDFcbiAgICAgICAgdGhpcy5udXRyaWVudF9zZWFzb25hbGl0eV9hbXAgPSAwLjU7ICAgLy8gMCAob2ZmKSB0byAxXG4gICAgICAgIHRoaXMubnV0cmllbnRfc2Vhc29uYWxpdHlfZnJlcSA9IDAuMDAxO1xuXG4gICAgICAgIC8vIGRpdmlkZSwgZmx5aW5nc2VlZCwgbG9jYWxzZWVkLCBtdXQrLCBtdXQtLCBzdGF0ZWJpdFxuICAgICAgICB0aGlzLmFjdGlvbl9tYXAgPSBbMjAwLCAyMCwgMCwgMTgsIDE4LCAwXTtcblxuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHBhcmFtcyk7XG4gICAgfVxufVxuXG5jbGFzcyBTaW11bGF0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG5cbiAgICAgICAgLy8gU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIHJhbmRvbVxuICAgICAgICAvLyB0aGlzIG1ha2VzIG91dCB0ZXN0cyByZXByb2R1Y2libGUgZ2l2ZW4gdGhlIHNhbWUgc2VlZCBpcyB1c2VkXG4gICAgICAgIC8vIGluIGZ1dHVyZSBpbnB1dCBwYXJhbWV0ZXJzXG4gICAgICAgIHNlZWRSYW5kb20odGhpcy5wYXJhbXMucmFuZG9tX3NlZWQpO1xuXG4gICAgICAgIHRoaXMud29ybGQgPSBuZXcgV29ybGQodGhpcy5wYXJhbXMud29ybGRfd2lkdGgsIHRoaXMucGFyYW1zLndvcmxkX2hlaWdodCk7XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0aWFsaXplIG51dHJpZW50cyBpbiBOaWNoZSBtb2RlXG4gICAgICAgIGlmICh0aGlzLnBhcmFtcy5zaW1fbW9kZSA9PT0gXCJuaWNoZVwiKSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkLmluaXROdXRyaWVudHModGhpcy5wYXJhbXMubnV0cmllbnRfbWF4LCB0aGlzLnBhcmFtcy5udXRyaWVudF9wYXRjaGluZXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIgPSB0aGlzLmdldEludGVycHJldGVyKCk7XG4gICAgICAgIHRoaXMubXV0X3VuaXRzID0gMTtcbiAgICAgICAgdGhpcy5zdGVwbnVtID0gMDtcbiAgICAgICAgdGhpcy5zdGF0cyA9IHsgXG4gICAgICAgICAgICBhdHRhY2tzOiAwLCBcbiAgICAgICAgICAgIGRlYXRoczogMCwgXG4gICAgICAgICAgICB0b3RhbFNlZWRzOiAwLCBcbiAgICAgICAgICAgIGZseWluZ1NlZWRzOiAwLCBcbiAgICAgICAgICAgIG5ld1BsYW50czogMCBcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLndvcmxkLm9uUGxhbnRCaXJ0aCA9ICgpID0+IHsgdGhpcy5zdGF0cy5uZXdQbGFudHMrKzsgfTtcbiAgICAgICAgdGhpcy53b3JsZC5vblBsYW50RGVhdGggPSAoKSA9PiB7IHRoaXMuc3RhdHMuZGVhdGhzKys7IH07XG4gICAgICAgIHRoaXMud29ybGQub25BdHRhY2sgPSAoKSA9PiB7IHRoaXMuc3RhdHMuYXR0YWNrcysrOyB9O1xuICAgIH1cblxuICAgIGdldEludGVycHJldGVyKCl7XG4gICAgICAgIHN3aXRjaCAodGhpcy5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyKXtcbiAgICAgICAgY2FzZSBcInByb21vdG9yXCI6XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21vdG9ySW50ZXJwcmV0ZXIodGhpcy5wYXJhbXMuYWN0aW9uX21hcCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaW50ZXJwcmV0ZXIgJHt0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXJ9YCk7XG4gICAgICAgIH0gIFxuICAgIH1cblxuICAgIGluaXRfcG9wdWxhdGlvbigpe1xuICAgICAgICAvLyByYW5kb21seSBjaG9vc2Ugc3BvdHMgdG8gc2VlZCB0aGUgd29ybGQgd2l0aFxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5wYXJhbXMuaW5pdGlhbF9wb3B1bGF0aW9uOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5uZXdTZWVkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBwb3B1bGF0aW9uIGZyb20gYSBsaXN0IG9mIHNlcmlhbGl6ZWQgZ2Vub21lIHN0cmluZ3MsXG4gICAgICogZHJhd2luZyB3aXRoIHJlcGxhY2VtZW50IHVwIHRvIGluaXRpYWxfcG9wdWxhdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBzZXJpYWxpemVkR2Vub21lc1xuICAgICAqL1xuICAgIGluaXRfcG9wdWxhdGlvbl9mcm9tX2dlbm9tZXMoc2VyaWFsaXplZEdlbm9tZXMpe1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhpcy5wYXJhbXMuaW5pdGlhbF9wb3B1bGF0aW9uOyBpKyspe1xuICAgICAgICAgICAgY29uc3Qgc3RyID0gc2VyaWFsaXplZEdlbm9tZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2VyaWFsaXplZEdlbm9tZXMubGVuZ3RoKV07XG4gICAgICAgICAgICBjb25zdCBnZW5vbWUgPSBCeXRlQXJyYXkuZGVzZXJpYWxpemUoc3RyKTtcbiAgICAgICAgICAgIHRoaXMud29ybGQuc2VlZChnZW5vbWUsIG51bGwsIHRoaXMuc3RlcG51bSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXdTZWVkKCl7XG4gICAgICAgIC8vIGNyZWF0ZSBhIHJhbmRvbSBnZW5vbWVcbiAgICAgICAgdmFyIGdlbm9tZSA9IEJ5dGVBcnJheS5yYW5kb20odGhpcy5wYXJhbXMuaW5pdGlhbF9nZW5vbWVfbGVuZ3RoKTtcbiAgICAgICAgdGhpcy53b3JsZC5zZWVkKGdlbm9tZSwgbnVsbCwgdGhpcy5zdGVwbnVtKTtcbiAgICB9XG5cbiAgICBzdGVwKCl7XG4gICAgICAgIHRoaXMuc3RlcG51bSsrO1xuICAgICAgICBpZiAodGhpcy5wYXJhbXMuc2ltX21vZGUgPT09IFwibmljaGVcIikge1xuICAgICAgICAgICAgdGhpcy53b3JsZC5yZXBsZW5pc2hOdXRyaWVudHMoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubnV0cmllbnRfcmVwbGVuaXNoX3JhdGUsIFxuICAgICAgICAgICAgICAgIHRoaXMuc3RlcG51bSwgXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubnV0cmllbnRfc2Vhc29uYWxpdHlfYW1wLCBcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5udXRyaWVudF9zZWFzb25hbGl0eV9mcmVxXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy53b3JsZC5kaWZmdXNlTnV0cmllbnRzKHRoaXMucGFyYW1zLm51dHJpZW50X2RpZmZ1c2lvbl9yYXRlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNpbXVsYXRlRGVhdGgoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUxpZ2h0KCk7XG4gICAgICAgIHRoaXMuc2ltdWxhdGVBY3Rpb25zKCk7XG4gICAgICAgIHRoaXMubXV0YXRlKCk7XG4gICAgfVxuXG4gICAgc2ltdWxhdGVBY3Rpb25zKCl7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53b3JsZC5wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gdGhpcy53b3JsZC5wbGFudHNbaV07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5pY2hlIG1ldGFib2xpc21cbiAgICAgICAgICAgIHBsYW50Lm1ldGFib2xpc20odGhpcy5wYXJhbXMpO1xuXG4gICAgICAgICAgICBpZiAoIXBsYW50LnJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgcGxhbnQucnVsZXMgPSB0aGlzLmdlbm9tZUludGVycHJldGVyLmludGVycHJldChwbGFudC5nZW5vbWUsIHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJ1bGVzID0gcGxhbnQucnVsZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBsYW50LmNlbGxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsQWN0aW9uKHBsYW50LmNlbGxzW2pdLCBydWxlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjZWxsQWN0aW9uKGNlbGwsIHJ1bGVzKXtcbiAgICAgICAgdmFyIHN0YXRlID0gY2VsbC5wbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSl7XG4gICAgICAgICAgICAvLyBleGVjdXRlIG9uZSBhY3Rpb24gdXNpbmcgdGhlIGZpcnN0IG1hdGNoaW5nIHJ1bGVcbiAgICAgICAgICAgIGlmIChydWxlLm1hdGNoZXMoc3RhdGUpKXtcbiAgICAgICAgICAgICAgICAvLyBUcmFjayBzZWVkc1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkZseWluZ1NlZWRcIikgc2VsZi5zdGF0cy5mbHlpbmdTZWVkcysrO1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkZseWluZ1NlZWRcIiB8fCBydWxlLmFjdGlvbi5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIkxvY2FsU2VlZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3RhdHMudG90YWxTZWVkcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBydWxlLmFjdGlvbi5leGVjdXRlKGNlbGwsIHNlbGYuc3RlcG51bSwgc2VsZi5wYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgY2VsbC51cGRhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIG11dGF0ZSgpe1xuICAgICAgICB2YXIgbXV0YXRvciA9IG5ldyBNdXRhdG9yKHRoaXMucGFyYW1zLm11dF9mYWN0b3IsIHRoaXMucGFyYW1zLm11dF9yZXBsYWNlLCBcbiAgICAgICAgICAgIHRoaXMucGFyYW1zLm11dF9pbnNlcnQsIHRoaXMucGFyYW1zLm11dF9kZWxldGUsIFxuICAgICAgICAgICAgMCwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2VfbW9kZSwgdGhpcy5tdXRfdW5pdHMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud29ybGQucGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHRoaXMud29ybGQucGxhbnRzW2ldO1xuICAgICAgICAgICAgaWYgKG11dGF0b3IubXV0YXRlKHBsYW50Lmdlbm9tZSkpIHtcbiAgICAgICAgICAgICAgICBwbGFudC5ydWxlcyA9IG51bGw7IC8vIEludmFsaWRhdGUgY2FjaGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSBlYWNoIHBsYW50J3MgY3VycmVudCBkZWF0aCBwcm9iYWJpbGl0eSB0byBzaW11bGF0ZVxuICAgICAqIHdoZXRoZXIgZWFjaCBwbGFudCBkaWVzIG9uIHRoaXMgc3RlcFxuICAgICAqL1xuICAgIHNpbXVsYXRlRGVhdGgoKXtcbiAgICAgICAgY29uc3QgZGVhZF9wbGFudHMgPSBbXTtcbiAgICAgICAgY29uc3QgcGxhbnRzID0gdGhpcy53b3JsZC5wbGFudHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHBsYW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGRlYXRoUHJvYiA9IHBsYW50LmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubGVhbm92ZXJfZmFjdG9yLFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLnNpbV9tb2RlXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKHJhbmRvbVByb2IoZGVhdGhQcm9iLnByb2IpKXtcbiAgICAgICAgICAgICAgICBkZWFkX3BsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlYWRfcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChkZWFkX3BsYW50c1tpXSwgdGhpcy5wYXJhbXMuc2ltX21vZGUgPT09IFwibmljaGVcIiA/IHRoaXMucGFyYW1zLm51dHJpZW50X3JlY3ljbGluZ19mYWN0b3IgOiAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNpbXVsYXRlIGxpZ2h0LiBTdW5saWdodCB0cmF2ZXJzZXMgZnJvbSB0aGUgY2VpbGluZyBvZiB0aGUgd29ybGRcbiAgICAgKiBkb3dud2FyZHMgdmVydGljYWxseS4gSXQgaXMgY2F1Z2h0IGJ5IGEgcGxhbnQgY2VsbCB3aXRoIGEgcHJvYmFiaWxpdHlcbiAgICAgKiB3aGljaCBjYXVzZXMgdGhhdCBjZWxsIHRvIGJlIGVuZXJnaXNlZC5cbiAgICAgKi9cbiAgICBzaW11bGF0ZUxpZ2h0KCl7XG4gICAgICAgIGNvbnN0IGNvbFRvcHMgPSBuZXcgSW50MTZBcnJheSh0aGlzLndvcmxkLndpZHRoKS5maWxsKC0xKTtcbiAgICAgICAgY29uc3QgcGxhbnRzID0gdGhpcy53b3JsZC5wbGFudHM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjZWxscyA9IHBsYW50c1tpXS5jZWxscztcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gY2VsbHNbal07XG4gICAgICAgICAgICAgICAgaWYgKGNlbGwueSA+IGNvbFRvcHNbY2VsbC54XSkge1xuICAgICAgICAgICAgICAgICAgICBjb2xUb3BzW2NlbGwueF0gPSBjZWxsLnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGxldCB4PTA7IHg8dGhpcy53b3JsZC53aWR0aDsgeCsrKXtcbiAgICAgICAgICAgIGNvbnN0IHRvcFkgPSBjb2xUb3BzW3hdO1xuICAgICAgICAgICAgaWYgKHRvcFkgPT09IC0xKSBjb250aW51ZTtcblxuICAgICAgICAgICAgZm9yKGxldCB5PXRvcFk7IHk+PTA7IHktLSl7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICAgICAgaWYoY2VsbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJhbmRvbVByb2IodGhpcy5wYXJhbXMuZW5lcmd5X3Byb2IpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQge1NpbXVsYXRpb24sIFNpbXVsYXRpb25QYXJhbXN9OyIsImltcG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc30gZnJvbSBcIi4vc2ltdWxhdGlvbi5qc1wiO1xuaW1wb3J0IHtTaW1EYXRhfSBmcm9tIFwiLi9zaW1kYXRhLmpzXCI7XG5cbmxldCBzaW11bGF0aW9uID0gbnVsbDtcbmxldCBkYXRhID0gbnVsbDtcbmxldCBydW5uaW5nID0gZmFsc2U7XG5sZXQgY2VsbFNpemUgPSAyO1xuY29uc3QgVEFSR0VUX0ZQUyA9IDYwO1xuY29uc3QgRlJBTUVfSU5URVJWQUxfTVMgPSAxMDAwIC8gVEFSR0VUX0ZQUztcbmxldCBsYXN0RnJhbWVUaW1lID0gMDtcbmxldCBsYXN0U3RhdHNUaW1lID0gMDtcbmNvbnN0IFNUQVRTX0lOVEVSVkFMX01TID0gMTAwO1xuXG5zZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgY29uc3QgbXNnID0gZXZlbnQuZGF0YTtcbiAgICBzd2l0Y2ggKG1zZy50eXBlKSB7XG4gICAgY2FzZSBcImluaXRcIjpcbiAgICAgICAgaW5pdFNpbShtc2cucGFyYW1zLCBtc2cuZ2Vub21lcyB8fCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0YXJ0XCI6XG4gICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBsb29wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdG9wXCI6XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0ZXBcIjpcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBwdXNoU3RhdHMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImdldENlbGxcIjpcbiAgICAgICAgc2VuZENlbGxJbmZvKG1zZy54LCBtc2cueSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJkaXN0dXJiXCI6XG4gICAgICAgIGFwcGx5RGlzdHVyYmFuY2UobXNnLnN0cmVuZ3RoKTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJraWxsQ2VsbFwiOlxuICAgICAgICBraWxsQ2VsbEF0KG1zZy54LCBtc2cueSk7XG4gICAgICAgIHB1c2hGcmFtZSgpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwidXBkYXRlRGlzcGxheVBhcmFtc1wiOlxuICAgICAgICBpZiAoc2ltdWxhdGlvbiAmJiBzaW11bGF0aW9uLnBhcmFtcykge1xuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lID0gbXNnLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnJlY29yZF9pbnRlcnZhbCA9IG1zZy5yZWNvcmRfaW50ZXJ2YWw7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImV4cG9ydFwiOlxuICAgICAgICBleHBvcnRHZW5vbWVzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGluaXRTaW0ocGFyYW1zLCBpbXBvcnRlZEdlbm9tZXM9bnVsbCkge1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBjb25zdCBzaW1fcGFyYW1zID0gbmV3IFNpbXVsYXRpb25QYXJhbXMocGFyYW1zKTtcbiAgICBjZWxsU2l6ZSA9IHBhcmFtcy5jZWxsU2l6ZSB8fCA4O1xuICAgIHNpbXVsYXRpb24gPSBuZXcgU2ltdWxhdGlvbihzaW1fcGFyYW1zKTtcbiAgICBkYXRhID0gbmV3IFNpbURhdGEoc2ltdWxhdGlvbik7XG4gICAgaWYgKGltcG9ydGVkR2Vub21lcyAmJiBpbXBvcnRlZEdlbm9tZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbl9mcm9tX2dlbm9tZXMoaW1wb3J0ZWRHZW5vbWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0aW9uLmluaXRfcG9wdWxhdGlvbigpO1xuICAgIH1cbiAgICBwdXNoRnJhbWUoKTtcbiAgICBwdXNoU3RhdHMoKTtcbn1cblxuZnVuY3Rpb24gbG9vcCgpIHtcbiAgICBpZiAoIXJ1bm5pbmcpIHJldHVybjtcblxuICAgIGNvbnN0IHNwZiA9IHNpbXVsYXRpb24ucGFyYW1zLnN0ZXBzX3Blcl9mcmFtZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNwZjsgaSsrKSB7XG4gICAgICAgIGRvU3RlcCgpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgaWYgKG5vdyAtIGxhc3RGcmFtZVRpbWUgPj0gRlJBTUVfSU5URVJWQUxfTVMpIHtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGxhc3RGcmFtZVRpbWUgPSBub3c7XG4gICAgfVxuXG4gICAgc2V0VGltZW91dChsb29wLCAwKTtcbn1cblxuZnVuY3Rpb24gZG9TdGVwKCkge1xuICAgIHNpbXVsYXRpb24uc3RlcCgpO1xuXG4gICAgLy8gUGVyaW9kaWMgZGlzdHVyYmFuY2VcbiAgICBjb25zdCBkaSA9IHNpbXVsYXRpb24ucGFyYW1zLmRpc3R1cmJhbmNlX2ludGVydmFsO1xuICAgIGlmIChkaSA+IDAgJiYgc2ltdWxhdGlvbi5zdGVwbnVtICUgZGkgPT09IDApIHtcbiAgICAgICAgYXBwbHlEaXN0dXJiYW5jZShzaW11bGF0aW9uLnBhcmFtcy5kaXN0dXJiYW5jZV9zdHJlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKHNpbXVsYXRpb24uc3RlcG51bSAlIHNpbXVsYXRpb24ucGFyYW1zLnJlY29yZF9pbnRlcnZhbCA9PT0gMCB8fCBzaW11bGF0aW9uLnN0ZXBudW0gPT09IDEpIHtcbiAgICAgICAgZGF0YS5yZWNvcmRTdGVwKCk7XG4gICAgICAgIHB1c2hTdGF0cygpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcHVzaFN0YXRzKCkge1xuICAgIGlmICghZGF0YSkgcmV0dXJuO1xuICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcInN0YXRzXCIsXG4gICAgICAgIGRhdGE6IGRhdGEuZGF0YSxcbiAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5RGlzdHVyYmFuY2Uoc3RyZW5ndGgpIHtcbiAgICBjb25zdCB3b3JsZCA9IHNpbXVsYXRpb24ud29ybGQ7XG4gICAgY29uc3QgcGxhbnRzID0gd29ybGQucGxhbnRzO1xuICAgIGlmIChwbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgY29uc3QgbnVtVG9LaWxsID0gTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihzdHJlbmd0aCAqIHBsYW50cy5sZW5ndGgpKTtcbiAgICAvLyBTaHVmZmxlIGEgc2FtcGxlIGFuZCBraWxsXG4gICAgY29uc3Qgc2h1ZmZsZWQgPSBwbGFudHMuc2xpY2UoKS5zb3J0KCgpID0+IE1hdGgucmFuZG9tKCkgLSAwLjUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVG9LaWxsICYmIGkgPCBzaHVmZmxlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBDaGVjayBwbGFudCBzdGlsbCBhbGl2ZSAobm90IGtpbGxlZCBieSBwcmV2aW91cyBpdGVyYXRpb24pXG4gICAgICAgIGlmICh3b3JsZC5wbGFudHMuaW5jbHVkZXMoc2h1ZmZsZWRbaV0pKSB7XG4gICAgICAgICAgICB3b3JsZC5raWxsUGxhbnQoc2h1ZmZsZWRbaV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBraWxsQ2VsbEF0KHgsIHkpIHtcbiAgICBjb25zdCBjZWxsID0gc2ltdWxhdGlvbi53b3JsZC5nZXRDZWxsKHgsIHkpO1xuICAgIGlmIChjZWxsICYmIGNlbGwucGxhbnQpIHtcbiAgICAgICAgc2ltdWxhdGlvbi53b3JsZC5raWxsUGxhbnQoY2VsbC5wbGFudCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBleHBvcnRHZW5vbWVzKCkge1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgc2ltdWxhdGlvbi53b3JsZC5wbGFudHMuZm9yRWFjaChwbGFudCA9PiB7XG4gICAgICAgIHNlZW4uYWRkKHBsYW50Lmdlbm9tZS5zZXJpYWxpemUoKSk7XG4gICAgfSk7XG4gICAgY29uc3QgZ2Vub21lcyA9IEFycmF5LmZyb20oc2Vlbik7XG4gICAgY29uc3QgZXhwb3J0QnVuZGxlID0ge1xuICAgICAgICBhY3Rpb25fbWFwOiBzaW11bGF0aW9uLnBhcmFtcy5hY3Rpb25fbWFwLFxuICAgICAgICBnZW5vbWVfaW50ZXJwcmV0ZXI6IHNpbXVsYXRpb24ucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcixcbiAgICAgICAgZ2Vub21lc1xuICAgIH07XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiZXhwb3J0ZWRHZW5vbWVzXCIsIGJ1bmRsZTogZXhwb3J0QnVuZGxlIH0pO1xufVxuXG5mdW5jdGlvbiBwdXNoRnJhbWUoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gc2ltdWxhdGlvbi53b3JsZC5nZXRQaXhlbEJ1ZmZlcihjZWxsU2l6ZSk7XG4gICAgLy8gVHJhbnNmZXIgb3duZXJzaGlwIG9mIHRoZSBBcnJheUJ1ZmZlciBmb3IgemVyby1jb3B5IHBlcmZvcm1hbmNlXG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwiZnJhbWVcIixcbiAgICAgICAgYnVmZmVyOiByZXN1bHQuYnVmZmVyLmJ1ZmZlcixcbiAgICAgICAgd2lkdGg6IHJlc3VsdC53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiByZXN1bHQuaGVpZ2h0LFxuICAgICAgICBjZWxsQ291bnQ6IHJlc3VsdC5jZWxsQ291bnQsXG4gICAgICAgIHN0ZXBudW06IHNpbXVsYXRpb24uc3RlcG51bVxuICAgIH0sIFtyZXN1bHQuYnVmZmVyLmJ1ZmZlcl0pO1xufVxuXG5mdW5jdGlvbiBzZW5kQ2VsbEluZm8oeCwgeSkge1xuICAgIGNvbnN0IGNlbGwgPSBzaW11bGF0aW9uLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgaWYgKCFjZWxsIHx8ICFjZWxsLnBsYW50IHx8ICFjZWxsLnBsYW50Lmdlbm9tZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJjZWxsSW5mb1wiLCBmb3VuZDogZmFsc2UgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGxhbnQgPSBjZWxsLnBsYW50O1xuICAgICAgICBjb25zdCBydWxlcyA9IHNpbXVsYXRpb24uZ2Vub21lSW50ZXJwcmV0ZXIuaW50ZXJwcmV0KHBsYW50Lmdlbm9tZSwgcGxhbnQpO1xuXG4gICAgICAgIC8vIFVzZSB0aGUgY29ycmVjdCBzdGF0ZVxuICAgICAgICBsZXQgY2VsbFN0YXRlID0gcGxhbnQuZ2V0U3RhdGUoY2VsbCk7XG4gICAgICAgIGNvbnN0IG5laWdoYm91cmhvb2QgPSBwbGFudC5nZXROZWlnaGJvdXJob29kKGNlbGwpO1xuICAgICAgICBjb25zdCBlbmVyZ2lzZWQgPSBjZWxsLmVuZXJnaXNlZDtcblxuICAgICAgICAvLyBTZXJpYWxpemUgcnVsZXMgYXMgc3RydWN0dXJlZCBvYmplY3RzIGZvciByaWNoIFVJIHJlbmRlcmluZ1xuICAgICAgICBjb25zdCBzZXJpYWxpemVkUnVsZXMgPSBydWxlcy5tYXAoKHIsIGkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSByLm1hdGNoZXMoY2VsbFN0YXRlKTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGlvblN0ciA9IHIuYWN0aW9uLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBjb25zdCBpc0RpdiA9IGFjdGlvblN0ci5zdGFydHNXaXRoKFwiZGl2aWRlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpbmRleDogaSxcbiAgICAgICAgICAgICAgICBtYXRjaGVzLFxuICAgICAgICAgICAgICAgIHN0YXRlOiByLnN0YXRlLFxuICAgICAgICAgICAgICAgIGVxTWFzazogci5lcU1hc2ssXG4gICAgICAgICAgICAgICAgYWN0aW9uVHlwZTogaXNEaXYgPyBcImRpdmlkZVwiIDogYWN0aW9uU3RyLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogaXNEaXYgPyByLmFjdGlvbi5nZXREaXJlY3Rpb24oKSA6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBtYXRjaGluZ1J1bGVJbmRleCA9IHNlcmlhbGl6ZWRSdWxlcy5maW5kSW5kZXgociA9PiByLm1hdGNoZXMpO1xuXG4gICAgICAgIGNvbnN0IGRlYXRoID0gcGxhbnQuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLm5hdHVyYWxfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLmxlYW5vdmVyX2ZhY3RvcixcbiAgICAgICAgICAgIHNpbXVsYXRpb24ucGFyYW1zLnNpbV9tb2RlXG4gICAgICAgICk7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgdHlwZTogXCJjZWxsSW5mb1wiLFxuICAgICAgICAgICAgZm91bmQ6IHRydWUsXG4gICAgICAgICAgICBjZWxsU3RyOiBjZWxsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBuZWlnaGJvdXJob29kLFxuICAgICAgICAgICAgZW5lcmdpc2VkLFxuICAgICAgICAgICAgY2VsbFN0YXRlLFxuICAgICAgICAgICAgbWF0Y2hpbmdSdWxlSW5kZXgsXG4gICAgICAgICAgICBkZWF0aDogSlNPTi5zdHJpbmdpZnkoZGVhdGgpLFxuICAgICAgICAgICAgZ2Vub21lTGVuZ3RoOiBwbGFudC5nZW5vbWUubGVuZ3RoLFxuICAgICAgICAgICAgbXV0RXhwOiBwbGFudC5nZW5vbWUubXV0X2V4cCxcbiAgICAgICAgICAgIHJ1bGVzOiBzZXJpYWxpemVkUnVsZXMsXG4gICAgICAgICAgICBpbnRlcnByZXRlclR5cGU6IHNpbXVsYXRpb24ucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcixcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJjZWxsSW5mb1wiLCBmb3VuZDogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtyYW5kb21JbnR9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtQbGFudH0gZnJvbSBcIi4vcGxhbnQuanNcIjtcbmltcG9ydCB7IENlbGwgfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5cbmNsYXNzIFdvcmxkIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KXtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIHdvcmxkIGxhdHRpY2UgdG8gYWxsIG51bGxzXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzLnB1c2goW10pO1xuICAgICAgICAgICAgZm9yKHZhciBqPTA7IGo8dGhpcy5oZWlnaHQ7IGorKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tpXVtqXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYW50cyA9IFtdO1xuICAgICAgICB0aGlzLmNlbGxDb3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5vblBsYW50QmlydGggPSBudWxsO1xuICAgICAgICB0aGlzLm9uUGxhbnREZWF0aCA9IG51bGw7XG4gICAgICAgIHRoaXMub25BdHRhY2sgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuc29pbE51dHJpZW50cyA9IFtdO1xuICAgICAgICB0aGlzLm51dHJpZW50TWF4ID0gMDtcbiAgICB9XG5cbiAgICBpbml0TnV0cmllbnRzKG1heCwgcGF0Y2hpbmVzcyA9IDApIHtcbiAgICAgICAgdGhpcy5udXRyaWVudE1heCA9IG1heDtcbiAgICAgICAgdGhpcy5zb2lsTnV0cmllbnRzID0gbmV3IEFycmF5KHRoaXMud2lkdGgpO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgLy8gVmFyaWF0aW9uIHVzaW5nIHNpbmUgd2F2ZXMgdG8gY3JlYXRlIFwiaG90c3BvdHNcIlxuICAgICAgICAgICAgY29uc3QgdmFyaWF0aW9uID0gcGF0Y2hpbmVzcyAqIChNYXRoLnNpbih4ICogMC4xKSAqIDAuNSArIE1hdGguc2luKHggKiAwLjAzKSAqIDAuNSk7XG4gICAgICAgICAgICB0aGlzLnNvaWxOdXRyaWVudHNbeF0gPSBtYXggKiAoMS4wICsgdmFyaWF0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlcGxlbmlzaE51dHJpZW50cyhyYXRlLCBzdGVwbnVtLCBhbXAgPSAwLCBmcmVxID0gMC4wMDEpIHtcbiAgICAgICAgLy8gQXBwbHkgc2Vhc29uYWxpdHkgbXVsdGlwbGllclxuICAgICAgICBjb25zdCBzZWFzb25hbGl0eSA9IDEuMCArIGFtcCAqIE1hdGguc2luKHN0ZXBudW0gKiBmcmVxKTtcbiAgICAgICAgY29uc3QgYWN0dWFsUmF0ZSA9IHJhdGUgKiBzZWFzb25hbGl0eTtcblxuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgdGhpcy5zb2lsTnV0cmllbnRzW3hdID0gTWF0aC5taW4odGhpcy5udXRyaWVudE1heCAqIDIsIHRoaXMuc29pbE51dHJpZW50c1t4XSArIGFjdHVhbFJhdGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGlmZnVzZU51dHJpZW50cyhyYXRlKSB7XG4gICAgICAgIGlmIChyYXRlIDw9IDApIHJldHVybjtcbiAgICAgICAgY29uc3QgbmV4dFNvaWwgPSBbLi4udGhpcy5zb2lsTnV0cmllbnRzXTtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLndpZHRoOyB4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IGxlZnQgPSAoeCAtIDEgKyB0aGlzLndpZHRoKSAlIHRoaXMud2lkdGg7XG4gICAgICAgICAgICBjb25zdCByaWdodCA9ICh4ICsgMSkgJSB0aGlzLndpZHRoO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBdmVyYWdlIHdpdGggbmVpZ2hib3JzXG4gICAgICAgICAgICBjb25zdCBmbHV4ID0gKHRoaXMuc29pbE51dHJpZW50c1tsZWZ0XSArIHRoaXMuc29pbE51dHJpZW50c1tyaWdodF0gLSAyICogdGhpcy5zb2lsTnV0cmllbnRzW3hdKSAqIHJhdGUgKiAwLjU7XG4gICAgICAgICAgICBuZXh0U29pbFt4XSArPSBmbHV4O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc29pbE51dHJpZW50cyA9IG5leHRTb2lsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIGFycmF5IG9mIHggcG9zaXRpb25zIGF0IHk9MCB3aGVyZSBubyBjZWxsIGV4aXN0c1xuICAgICAqL1xuICAgIGdldEZsb29yU3BhY2UoKXtcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICBpZih0aGlzLmNlbGxzW2ldWzBdID09PSBudWxsKXtcbiAgICAgICAgICAgICAgICBlbXB0eVNwYWNlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbXB0eVNwYWNlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdHJhdGVnaWVzIGZvciBzb3dpbmcgYSBzZWVkIG9uIHRoZSB3b3JsZCBmbG9vclxuICAgICAqIEBwYXJhbSB7Kn0gZ2Vub21lIHRoZSBnZW5vbWUgdXNlZCBieSB0aGUgbmV3IHNlZWRcbiAgICAgKiBAcGFyYW0geyp9IG5lYXJYIGlmIG5vdCBudWxsLCB0cnkgdG8gc293IGEgc2VlZCBhcyBjbG9zZVxuICAgICAqIGFzIHBvc3NpYmxlIHRvIHRoaXMgbG9jYXRpb25cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgYSBzZWVkIHdhcyBzdWNjZXNmdWxseSBwbGFudGVkLCBmYWxzZSBpZlxuICAgICAqIHRoZXJlIHdhcyBubyBzcGFjZSB0byBzb3cgYSBzZWVkLlxuICAgICAqL1xuICAgIHNlZWQoZ2Vub21lLCBuZWFyWCwgc3RlcG51bSl7XG4gICAgICAgIC8vIGZpbmQgYSByYW5kb20gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIGVtcHR5U3BhY2VzID0gdGhpcy5nZXRGbG9vclNwYWNlKCk7XG4gICAgICAgIGlmKGVtcHR5U3BhY2VzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZWFyWCAhPT0gdW5kZWZpbmVkICYmIG5lYXJYICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0WCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgbmVhcmVzdF9kaWZmID0gdGhpcy53aWR0aDtcbiAgICAgICAgICAgIGVtcHR5U3BhY2VzLmZvckVhY2goZnVuY3Rpb24oeHBvcyl7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBNYXRoLmFicyhuZWFyWC14cG9zKTtcbiAgICAgICAgICAgICAgICBpZihkaWZmIDwgbmVhcmVzdF9kaWZmKXtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdF9kaWZmID0gZGlmZjtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdFggPSB4cG9zO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIG5lYXJlc3RYLCBzdGVwbnVtKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHggPSBlbXB0eVNwYWNlc1tyYW5kb21JbnQoMCwgZW1wdHlTcGFjZXMubGVuZ3RoLTEpXTtcbiAgICAgICAgaWYgKHRoaXMuY2VsbHNbeF1bMF0gIT09IG51bGwpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3BhY2UgaXMgdGFrZW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb3dQbGFudChnZW5vbWUsIHgsIHN0ZXBudW0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzb3dQbGFudChnZW5vbWUsIHgsIHN0ZXBudW0pe1xuICAgICAgICB4ID0gdGhpcy5nZXRYKHgpO1xuICAgICAgICB2YXIgcGxhbnQgPSBuZXcgUGxhbnQoeCwgdGhpcywgZ2Vub21lLCBzdGVwbnVtKTtcbiAgICAgICAgdGhpcy5wbGFudHMucHVzaChwbGFudCk7XG4gICAgICAgIHRoaXMuYWRkQ2VsbChwbGFudC5jZWxsc1swXSk7XG4gICAgICAgIGlmICh0aGlzLm9uUGxhbnRCaXJ0aCkgdGhpcy5vblBsYW50QmlydGgocGxhbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBwbGFudCBmcm9tIHdvcmxkIHBsYW50IGxpc3QuXG4gICAgICogUmVtb3ZlIGFsbCBjZWxscyBmcm9tIGNlbGwgZ3JpZFxuICAgICAqL1xuICAgIGtpbGxQbGFudChwbGFudCwgcmVjeWNsaW5nRmFjdG9yID0gMCkge1xuICAgICAgICBjb25zdCBpZHggPSB0aGlzLnBsYW50cy5pbmRleE9mKHBsYW50KTtcbiAgICAgICAgaWYgKGlkeCA+IC0xKSB7XG4gICAgICAgICAgICAvLyBSZWN5Y2xpbmcgbG9naWNcbiAgICAgICAgICAgIGlmIChyZWN5Y2xpbmdGYWN0b3IgPiAwICYmIHRoaXMuc29pbE51dHJpZW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJpb21hc3NCb251cyA9IHBsYW50LmNlbGxzLmxlbmd0aCAqIDAuNTtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFRvUmV0dXJuID0gKHBsYW50Lm51dHJpZW50Q291bnQgKyBiaW9tYXNzQm9udXMpICogcmVjeWNsaW5nRmFjdG9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RDb2x1bW5zID0gcGxhbnQuY2VsbHMuZmlsdGVyKGMgPT4gYy55ID09PSAwKS5tYXAoYyA9PiBjLngpO1xuICAgICAgICAgICAgICAgIGlmIChyb290Q29sdW1ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBlckNvbHVtbiA9IHRvdGFsVG9SZXR1cm4gLyByb290Q29sdW1ucy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RDb2x1bW5zLmZvckVhY2goeCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNvaWxOdXRyaWVudHNbeF0gKz0gcGVyQ29sdW1uO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucGxhbnRzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgdGhpcy5jZWxsQ291bnQgLT0gcGxhbnQuY2VsbHMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudC5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBwbGFudC5jZWxsc1tpXTtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vblBsYW50RGVhdGgpIHRoaXMub25QbGFudERlYXRoKHBsYW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFgoeCl7XG4gICAgICAgIGlmKHggPCAwKXtcbiAgICAgICAgICAgIHggPSB0aGlzLndpZHRoICsgeDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCAlIHRoaXMud2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0Q2VsbCh4LCB5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2VsbHNbdGhpcy5nZXRYKHgpXVt5XTtcbiAgICB9XG5cbiAgICBhZGRDZWxsKGNlbGwpe1xuICAgICAgICBpZiAodGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jZWxsc1tjZWxsLnhdW2NlbGwueV0gPSBjZWxsO1xuICAgICAgICAgICAgdGhpcy5jZWxsQ291bnQrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFBpeGVsQnVmZmVyKGNlbGxTaXplKXtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMud2lkdGggKiBjZWxsU2l6ZTtcbiAgICAgICAgY29uc3QgaCA9IHRoaXMuaGVpZ2h0ICogY2VsbFNpemU7XG4gICAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OENsYW1wZWRBcnJheSh3ICogaCAqIDQpO1xuICAgICAgICBjb25zdCBwbGFudHMgPSB0aGlzLnBsYW50cztcblxuICAgICAgICAvLyBSZW5kZXIgc29pbCBudXRyaWVudHMgaW4gYmFja2dyb3VuZCBpZiBwcmVzZW50XG4gICAgICAgIGlmICh0aGlzLnNvaWxOdXRyaWVudHMgJiYgdGhpcy5zb2lsTnV0cmllbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IHRoaXMuc29pbE51dHJpZW50c1t4XSAvIHRoaXMubnV0cmllbnRNYXg7XG4gICAgICAgICAgICAgICAgLy8gRGFyayBicm93biB0byBlYXJ0aHkgYnJvd24gZ3JhZGllbnRcbiAgICAgICAgICAgICAgICBjb25zdCByID0gTWF0aC5yb3VuZCg0MCArIDQwICogbik7XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IE1hdGgucm91bmQoMzAgKyAyMCAqIG4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBNYXRoLnJvdW5kKDIwICsgMTAgKiBuKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBweCA9IHggKiBjZWxsU2l6ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBweSA9ICh0aGlzLmhlaWdodCAtIDEpICogY2VsbFNpemU7IC8vIEJvdHRvbSByb3dcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkeSA9IDA7IGR5IDwgY2VsbFNpemU7IGR5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm93SWR4ID0gKHB5ICsgZHkpICogdztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZHggPSAwOyBkeCA8IGNlbGxTaXplOyBkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpZHggPSAocm93SWR4ICsgcHggKyBkeCkgKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeF0gPSByO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDFdID0gZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IGI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgM10gPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGxhbnQgPSBwbGFudHNbaV07XG4gICAgICAgICAgICBjb25zdCBbYmFzZVIsIGJhc2VHLCBiYXNlQl0gPSB0aGlzLmdldEJhc2VDb2xvdXIocGxhbnQpO1xuICAgICAgICAgICAgY29uc3QgZGFya1IgPSBNYXRoLnJvdW5kKGJhc2VSICogMC43KTtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtHID0gTWF0aC5yb3VuZChiYXNlRyAqIDAuNyk7XG4gICAgICAgICAgICBjb25zdCBkYXJrQiA9IE1hdGgucm91bmQoYmFzZUIgKiAwLjcpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBjZWxscyA9IHBsYW50LmNlbGxzO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjZWxsc1tqXTtcbiAgICAgICAgICAgICAgICBjb25zdCByMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZVIgOiBkYXJrUjtcbiAgICAgICAgICAgICAgICBjb25zdCBnMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZUcgOiBkYXJrRztcbiAgICAgICAgICAgICAgICBjb25zdCBiMCA9IGNlbGwuZW5lcmdpc2VkID8gYmFzZUIgOiBkYXJrQjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBweDAgPSBjZWxsLnggKiBjZWxsU2l6ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBweTAgPSAodGhpcy5oZWlnaHQgLSAxIC0gY2VsbC55KSAqIGNlbGxTaXplO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZHkgPSAwOyBkeSA8IGNlbGxTaXplOyBkeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvd0lkeCA9IChweTAgKyBkeSkgKiB3O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkeCA9IDA7IGR4IDwgY2VsbFNpemU7IGR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQm9yZGVyID0gY2VsbFNpemUgPiAxICYmIChkeCA9PT0gMCB8fCBkeSA9PT0gMCB8fCBkeCA9PT0gY2VsbFNpemUgLSAxIHx8IGR5ID09PSBjZWxsU2l6ZSAtIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaWR4ID0gKHJvd0lkeCArIHB4MCArIGR4KSAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0JvcmRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdICAgICA9IE1hdGgucm91bmQocjAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAxXSA9IE1hdGgucm91bmQoZzAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IE1hdGgucm91bmQoYjAgKiAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4XSAgICAgPSByMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBnMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMl0gPSBiMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAzXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7IGJ1ZmZlcjogYnVmLCB3aWR0aDogdywgaGVpZ2h0OiBoLCBjZWxsQ291bnQ6IHRoaXMuY2VsbENvdW50IH07XG4gICAgfVxuXG4gICAgZ2V0QmFzZUNvbG91cihwbGFudCl7XG4gICAgICAgIHZhciBpID0gcGxhbnQuY2VsbHNbMF0ueCAlIGNTY2FsZS5sZW5ndGg7XG4gICAgICAgIHJldHVybiBjU2NhbGVbaV07XG4gICAgfVxufVxuXG4vLyBodHRwOi8vY29sb3JicmV3ZXIyLm9yZy8/dHlwZT1xdWFsaXRhdGl2ZSZzY2hlbWU9U2V0MyZuPTgg4oCUIGFzIHJhdyBbUixHLEJdIHR1cGxlc1xudmFyIGNTY2FsZSA9IFtcbiAgICBbMTQxLDIxMSwxOTldLFsyNTUsMjU1LDE3OV0sWzE5MCwxODYsMjE4XSxbMjUxLDEyOCwxMTRdLFxuICAgIFsxMjgsMTc3LDIxMV0sWzI1MywxODAsOThdLFsxNzksMjIyLDEwNV0sWzI1MiwyMDUsMjI5XVxuXTtcblxuXG5leHBvcnQgeyBXb3JsZCB9OyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0aWQ6IG1vZHVsZUlkLFxuXHRcdGxvYWRlZDogZmFsc2UsXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG5cdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLy8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbl9fd2VicGFja19yZXF1aXJlX18ubSA9IF9fd2VicGFja19tb2R1bGVzX187XG5cbi8vIHRoZSBzdGFydHVwIGZ1bmN0aW9uXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuXHQvLyBUaGlzIGVudHJ5IG1vZHVsZSBkZXBlbmRzIG9uIG90aGVyIGxvYWRlZCBjaHVua3MgYW5kIGV4ZWN1dGlvbiBuZWVkIHRvIGJlIGRlbGF5ZWRcblx0dmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLk8odW5kZWZpbmVkLCBbXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCJdLCAoKSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL3NpbXVsYXRpb24ud29ya2VyLmpzXCIpKSlcblx0X193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyhfX3dlYnBhY2tfZXhwb3J0c19fKTtcblx0cmV0dXJuIF9fd2VicGFja19leHBvcnRzX187XG59O1xuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmFtZEQgPSBmdW5jdGlvbiAoKSB7XG5cdHRocm93IG5ldyBFcnJvcignZGVmaW5lIGNhbm5vdCBiZSB1c2VkIGluZGlyZWN0Jyk7XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kTyA9IHt9OyIsInZhciBkZWZlcnJlZCA9IFtdO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5PID0gKHJlc3VsdCwgY2h1bmtJZHMsIGZuLCBwcmlvcml0eSkgPT4ge1xuXHRpZihjaHVua0lkcykge1xuXHRcdHByaW9yaXR5ID0gcHJpb3JpdHkgfHwgMDtcblx0XHRmb3IodmFyIGkgPSBkZWZlcnJlZC5sZW5ndGg7IGkgPiAwICYmIGRlZmVycmVkW2kgLSAxXVsyXSA+IHByaW9yaXR5OyBpLS0pIGRlZmVycmVkW2ldID0gZGVmZXJyZWRbaSAtIDFdO1xuXHRcdGRlZmVycmVkW2ldID0gW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldO1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXIgbm90RnVsZmlsbGVkID0gSW5maW5pdHk7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZGVmZXJyZWQubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldID0gZGVmZXJyZWRbaV07XG5cdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaHVua0lkcy5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYgKChwcmlvcml0eSAmIDEgPT09IDAgfHwgbm90RnVsZmlsbGVkID49IHByaW9yaXR5KSAmJiBPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLk8pLmV2ZXJ5KChrZXkpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fLk9ba2V5XShjaHVua0lkc1tqXSkpKSkge1xuXHRcdFx0XHRjaHVua0lkcy5zcGxpY2Uoai0tLCAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZ1bGZpbGxlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZihwcmlvcml0eSA8IG5vdEZ1bGZpbGxlZCkgbm90RnVsZmlsbGVkID0gcHJpb3JpdHk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKGZ1bGZpbGxlZCkge1xuXHRcdFx0ZGVmZXJyZWQuc3BsaWNlKGktLSwgMSlcblx0XHRcdHZhciByID0gZm4oKTtcblx0XHRcdGlmIChyICE9PSB1bmRlZmluZWQpIHJlc3VsdCA9IHI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZiA9IHt9O1xuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLy8gVGhlIGNodW5rIGxvYWRpbmcgZnVuY3Rpb24gZm9yIGFkZGl0aW9uYWwgY2h1bmtzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmUgPSAoY2h1bmtJZCkgPT4ge1xuXHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcblx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmZba2V5XShjaHVua0lkLCBwcm9taXNlcyk7XG5cdFx0cmV0dXJuIHByb21pc2VzO1xuXHR9LCBbXSkpO1xufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3MgYW5kIGNodW5rcyB0aGF0IHRoZSBlbnRyeXBvaW50IGRlcGVuZHMgb25cbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5idW5kbGUuanNcIjtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5ubWQgPSAobW9kdWxlKSA9PiB7XG5cdG1vZHVsZS5wYXRocyA9IFtdO1xuXHRpZiAoIW1vZHVsZS5jaGlsZHJlbikgbW9kdWxlLmNoaWxkcmVuID0gW107XG5cdHJldHVybiBtb2R1bGU7XG59OyIsInZhciBzY3JpcHRVcmw7XG5pZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5nLmltcG9ydFNjcmlwdHMpIHNjcmlwdFVybCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5sb2NhdGlvbiArIFwiXCI7XG52YXIgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCAmJiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ1NDUklQVCcpXG5cdFx0c2NyaXB0VXJsID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG5cdGlmICghc2NyaXB0VXJsKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKTtcblx0XHRpZihzY3JpcHRzLmxlbmd0aCkge1xuXHRcdFx0dmFyIGkgPSBzY3JpcHRzLmxlbmd0aCAtIDE7XG5cdFx0XHR3aGlsZSAoaSA+IC0xICYmICghc2NyaXB0VXJsIHx8ICEvXmh0dHAocz8pOi8udGVzdChzY3JpcHRVcmwpKSkgc2NyaXB0VXJsID0gc2NyaXB0c1tpLS1dLnNyYztcblx0XHR9XG5cdH1cbn1cbi8vIFdoZW4gc3VwcG9ydGluZyBicm93c2VycyB3aGVyZSBhbiBhdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIHlvdSBtdXN0IHNwZWNpZnkgYW4gb3V0cHV0LnB1YmxpY1BhdGggbWFudWFsbHkgdmlhIGNvbmZpZ3VyYXRpb25cbi8vIG9yIHBhc3MgYW4gZW1wdHkgc3RyaW5nIChcIlwiKSBhbmQgc2V0IHRoZSBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyB2YXJpYWJsZSBmcm9tIHlvdXIgY29kZSB0byB1c2UgeW91ciBvd24gbG9naWMuXG5pZiAoIXNjcmlwdFVybCkgdGhyb3cgbmV3IEVycm9yKFwiQXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXJcIik7XG5zY3JpcHRVcmwgPSBzY3JpcHRVcmwucmVwbGFjZSgvXmJsb2I6LywgXCJcIikucmVwbGFjZSgvIy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcPy4qJC8sIFwiXCIpLnJlcGxhY2UoL1xcL1teXFwvXSskLywgXCIvXCIpO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5wID0gc2NyaXB0VXJsOyIsIi8vIG5vIGJhc2VVUklcblxuLy8gb2JqZWN0IHRvIHN0b3JlIGxvYWRlZCBjaHVua3Ncbi8vIFwiMVwiIG1lYW5zIFwiYWxyZWFkeSBsb2FkZWRcIlxudmFyIGluc3RhbGxlZENodW5rcyA9IHtcblx0XCJzcmNfc2ltdWxhdGlvbl93b3JrZXJfanNcIjogMVxufTtcblxuLy8gaW1wb3J0U2NyaXB0cyBjaHVuayBsb2FkaW5nXG52YXIgaW5zdGFsbENodW5rID0gKGRhdGEpID0+IHtcblx0dmFyIFtjaHVua0lkcywgbW9yZU1vZHVsZXMsIHJ1bnRpbWVdID0gZGF0YTtcblx0Zm9yKHZhciBtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhtb3JlTW9kdWxlcywgbW9kdWxlSWQpKSB7XG5cdFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLm1bbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuXHRcdH1cblx0fVxuXHRpZihydW50aW1lKSBydW50aW1lKF9fd2VicGFja19yZXF1aXJlX18pO1xuXHR3aGlsZShjaHVua0lkcy5sZW5ndGgpXG5cdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRzLnBvcCgpXSA9IDE7XG5cdHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uKGRhdGEpO1xufTtcbl9fd2VicGFja19yZXF1aXJlX18uZi5pID0gKGNodW5rSWQsIHByb21pc2VzKSA9PiB7XG5cdC8vIFwiMVwiIGlzIHRoZSBzaWduYWwgZm9yIFwiYWxyZWFkeSBsb2FkZWRcIlxuXHRpZighaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdKSB7XG5cdFx0aWYodHJ1ZSkgeyAvLyBhbGwgY2h1bmtzIGhhdmUgSlNcblx0XHRcdGltcG9ydFNjcmlwdHMoX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgX193ZWJwYWNrX3JlcXVpcmVfXy51KGNodW5rSWQpKTtcblx0XHR9XG5cdH1cbn07XG5cbnZhciBjaHVua0xvYWRpbmdHbG9iYWwgPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gPSBzZWxmW1wid2VicGFja0NodW5rbGluZGV2b2xcIl0gfHwgW107XG52YXIgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24gPSBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCk7XG5jaHVua0xvYWRpbmdHbG9iYWwucHVzaCA9IGluc3RhbGxDaHVuaztcblxuLy8gbm8gSE1SXG5cbi8vIG5vIEhNUiBtYW5pZmVzdCIsInZhciBuZXh0ID0gX193ZWJwYWNrX3JlcXVpcmVfXy54O1xuX193ZWJwYWNrX3JlcXVpcmVfXy54ID0gKCkgPT4ge1xuXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5lKFwidmVuZG9ycy1ub2RlX21vZHVsZXNfc2VlZHJhbmRvbV9pbmRleF9qcy1ub2RlX21vZHVsZXNfc3RhdHMtbGl0ZV9zdGF0c19qc1wiKS50aGVuKG5leHQpO1xufTsiLCIiLCIvLyBydW4gc3RhcnR1cFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLngoKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==