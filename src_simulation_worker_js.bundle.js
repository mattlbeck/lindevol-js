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
        cell.plant.growFromCell(cell, direction, stepnum, params);
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
    growFromCell(cell, direction, stepnum, params = null){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX3NpbXVsYXRpb25fd29ya2VyX2pzLmJ1bmRsZS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNBQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUIsb0JBQW9CO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDJCQUEyQixpQkFBaUI7QUFDNUM7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQix1QkFBdUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFD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V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esa0M7Ozs7O1dDbEJBOztXQUVBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQSxhQUFhO1dBQ2I7V0FDQTtXQUNBO1dBQ0E7O1dBRUE7V0FDQTtXQUNBOztXQUVBOztXQUVBLGtCOzs7OztXQ3BDQTtXQUNBO1dBQ0E7V0FDQSxFOzs7OztVRUhBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9saW5kZXZvbC9pZ25vcmVkfC9Vc2Vycy9tYXR0L2xpbmRldm9sLWpzL25vZGVfbW9kdWxlcy9zZWVkcmFuZG9tfGNyeXB0byIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9hY3Rpb25zLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL2NlbGwuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvZ2Vub21lLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3BsYW50LmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3JhbmRvbS5qcyIsIndlYnBhY2s6Ly9saW5kZXZvbC8uL3NyYy9zaW1kYXRhLmpzIiwid2VicGFjazovL2xpbmRldm9sLy4vc3JjL3NpbXVsYXRpb24uanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvLi9zcmMvd29ybGQuanMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBkZWZpbmUiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2FtZCBvcHRpb25zIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9jaHVuayBsb2FkZWQiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9lbnN1cmUgY2h1bmsiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2dldCBqYXZhc2NyaXB0IGNodW5rIGZpbGVuYW1lIiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2xpbmRldm9sL3dlYnBhY2svcnVudGltZS9ub2RlIG1vZHVsZSBkZWNvcmF0b3IiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL3B1YmxpY1BhdGgiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9ydW50aW1lL2ltcG9ydFNjcmlwdHMgY2h1bmsgbG9hZGluZyIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3J1bnRpbWUvc3RhcnR1cCBjaHVuayBkZXBlbmRlbmNpZXMiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9saW5kZXZvbC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vbGluZGV2b2wvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIChpZ25vcmVkKSAqLyIsImNvbnN0IE5FSUdIQk9VUkhPT0QgPSBbWy0xLC0xXSwgWzAsLTFdLCBbMSwtMV0sIFstMSwwXSwgWzEsMF0sIFstMSwxXSwgWzAsMV0sIFsxLDFdXTtcbmNvbnN0IE1VVF9JTkNSRU1FTlQgPSAwLjAwMTtcblxuY2xhc3MgQWN0aW9ue1xuICAgIGNvbnN0cnVjdG9yKGFjdGlvbkNvZGUpe1xuICAgICAgICB0aGlzLmNvZGUgPSBhY3Rpb25Db2RlO1xuICAgIH1cblxuICAgIGdldCBwYXJhbXMoKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZXhlY3V0ZShjZWxsLCBzdGVwbnVtLCBwYXJhbXMpe1xuICAgICAgICAvLyBhY3Rpb25zIGFyZSB0eXBpY2FsbHkgb25seSBjYXJyaWVkIG91dCBpZiB0aGUgY2VsbCBoYXMgZW5lcmd5XG4gICAgICAgIC8vIGFuZCB0aGUgY2VsbCBsb3NlcyBlbmVyZ3kgYXMgYSByZXN1bHQuXG4gICAgICAgIGlmIChjZWxsLmVuZXJnaXNlZCl7XG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9IHRoaXMuZG9BY3Rpb24oY2VsbCwgc3RlcG51bSwgcGFyYW1zKTtcbiAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gIXN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkb0FjdGlvbihjZWxsKXtcblxuICAgIH1cbn1cblxuY2xhc3MgRGl2aWRlIGV4dGVuZHMgQWN0aW9ue1xuXG4gICAgZG9BY3Rpb24oY2VsbCwgc3RlcG51bSwgcGFyYW1zKXtcbiAgICAgICAgLy8gdGhlIDIgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBvZiB0aGUgYWN0aW9uIGNvZGVcbiAgICAgICAgLy8gZGV0ZXJtaW5lcyB3aGljaCBkaXJlY3Rpb24gdGhlIGRpdmlkZSBhY3Rpb24gaXMgZm9yXG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwsIHN0ZXBudW0sIHBhcmFtcyk7XG5cbiAgICAgICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMuc2ltX21vZGUgPT09IFwibmljaGVcIikge1xuICAgICAgICAgICAgaWYgKGNlbGwucGxhbnQubnV0cmllbnRDb3VudCA8IHBhcmFtcy5udXRyaWVudF9kaXZpZGVfY29zdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjZWxsLnBsYW50Lm51dHJpZW50Q291bnQgLT0gcGFyYW1zLm51dHJpZW50X2RpdmlkZV9jb3N0O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMuZ2V0RGlyZWN0aW9uKCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbiwgc3RlcG51bSwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtcygpe1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREaXJlY3Rpb24oKTtcbiAgICB9XG5cbiAgICBnZXREaXJlY3Rpb24oKXtcbiAgICAgICAgLy8gZXh0cmFjdCB0aGUgY29ycmVjdCBiaXRzXG4gICAgICAgIC8vICYgd2l0aCAwMDAwMDExMSB0byBtYXNrIG91dCBsZWFzdCBzaWcgYml0c1xuICAgICAgICB2YXIgZGlyZWN0aW9uQ29kZSA9IHRoaXMuY29kZSAmIDc7XG4gICAgICAgIHJldHVybiBORUlHSEJPVVJIT09EW2RpcmVjdGlvbkNvZGVdO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgZGl2aWRlICR7dGhpcy5nZXREaXJlY3Rpb24oKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlUGx1cyBleHRlbmRzIEFjdGlvbntcbiAgICBkb0FjdGlvbihjZWxsKXtcbiAgICAgICAgc3VwZXIuZG9BY3Rpb24oY2VsbCk7XG4gICAgICAgIGNlbGwucGxhbnQuZ2Vub21lLm11dF9leHAgKz0gTVVUX0lOQ1JFTUVOVDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibXV0K1wiO1xuICAgIH1cbn1cblxuY2xhc3MgTXV0YXRlTWludXMgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwpO1xuICAgICAgICBjZWxsLnBsYW50Lmdlbm9tZS5tdXRfZXhwIC09IE1VVF9JTkNSRU1FTlQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBcIm11dC1cIjtcbiAgICB9XG59XG5cbmNsYXNzIEZseWluZ1NlZWQgZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCwgc3RlcG51bSl7XG4gICAgICAgIHN1cGVyLmRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pO1xuICAgICAgICByZXR1cm4gY2VsbC5wbGFudC53b3JsZC5zZWVkKGNlbGwucGxhbnQuZ2Vub21lLmNvcHkoKSwgbnVsbCwgc3RlcG51bSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwiZmx5aW5nc2VlZFwiO1xuICAgIH1cbn1cblxuY2xhc3MgTG9jYWxTZWVkIGV4dGVuZHMgQWN0aW9ue1xuICAgIGRvQWN0aW9uKGNlbGwsIHN0ZXBudW0pe1xuICAgICAgICBzdXBlci5kb0FjdGlvbihjZWxsLCBzdGVwbnVtKTtcbiAgICAgICAgcmV0dXJuIGNlbGwucGxhbnQud29ybGQuc2VlZChjZWxsLnBsYW50Lmdlbm9tZS5jb3B5KCksIGNlbGwueCwgc3RlcG51bSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIFwibG9jYWxzZWVkXCI7XG4gICAgfVxufVxuXG5jbGFzcyBTdGF0ZUJpdE4gZXh0ZW5kcyBBY3Rpb257XG4gICAgZG9BY3Rpb24oY2VsbCkge1xuICAgICAgICAvLyBUb2dnbGUgdGhlIGJpdCB1c2luZyBYT1JcbiAgICAgICAgY2VsbC5uZXh0SW50ZXJuYWxTdGF0ZSA9IGNlbGwubmV4dEludGVybmFsU3RhdGUgXiAoMSA8PCB0aGlzLmdldE50aEJpdCgpKTtcbiAgICAgICAgLy8gdGhpcyBhY3Rpb24gZG9lcyBub3QgY29uc3VtZSBlbmVyZ3lcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGdldE50aEJpdCgpe1xuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcbiAgICAgICAgLy8gJiB3aXRoIDAwMDAxMTExIHRvIG1hc2sgb3V0IGxlYXN0IHNpZyBiaXRzXG4gICAgICAgIHJldHVybiB0aGlzLmNvZGUgJiAxNTtcbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICByZXR1cm4gYFN0YXRlQml0ICR7dGhpcy5nZXROdGhCaXQoKX1gO1xuICAgIH1cbn1cblxuY2xhc3MgQWN0aW9uTWFwIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcsIGNvZGVSYW5nZT0yNTYpe1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBtYXBwaW5nO1xuICAgICAgICB0aGlzLmNvZGVSYW5nZSA9IGNvZGVSYW5nZTtcbiAgICAgICAgdGhpcy5hY3Rpb25zID0gW0RpdmlkZSwgRmx5aW5nU2VlZCwgTG9jYWxTZWVkLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51cywgU3RhdGVCaXROXTtcbiAgICB9XG5cbiAgICBnZXRBY3Rpb24oYWN0aW9uQ29kZSl7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgYWN0aW9uIGNvZGUgaW50byB0aGUgWzAsIHN1bSkgcmFuZ2Ugc28gd2VpZ2h0cyBjYW4gYmVcbiAgICAgICAgLy8gYW55IHBvc2l0aXZlIGludGVnZXJzIHJhdGhlciB0aGFuIG5lZWRpbmcgdG8gc3VtIHRvIGNvZGVSYW5nZS5cbiAgICAgICAgY29uc3Qgc3VtID0gdGhpcy5tYXBwaW5nLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkQ29kZSA9IE1hdGguZmxvb3IoKGFjdGlvbkNvZGUgLyB0aGlzLmNvZGVSYW5nZSkgKiBzdW0pO1xuICAgICAgICB2YXIgbWFwcGluZ0NvdW50ID0gMDtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5tYXBwaW5nLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG1hcHBpbmdDb3VudCArPSB0aGlzLm1hcHBpbmdbaV07XG4gICAgICAgICAgICBpZiAobm9ybWFsaXplZENvZGUgPCBtYXBwaW5nQ291bnQpe1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5hY3Rpb25zW2ldKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEZhbGxiYWNrIGZvciBmbG9hdGluZy1wb2ludCBlZGdlIGNhc2VzXG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5hY3Rpb25zW3RoaXMubWFwcGluZy5sZW5ndGggLSAxXShhY3Rpb25Db2RlKTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IHtEaXZpZGUsIE11dGF0ZVBsdXMsIE11dGF0ZU1pbnVzLCBMb2NhbFNlZWQsIEZseWluZ1NlZWQsIEFjdGlvbk1hcCwgTkVJR0hCT1VSSE9PRH07IiwiXG5jbGFzcyBDZWxse1xuICAgIGNvbnN0cnVjdG9yKHBsYW50LCB4LCB5KXtcbiAgICAgICAgdGhpcy5wbGFudCA9IHBsYW50O1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLl9lbmVyZ2lzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gMDtcbiAgICAgICAgdGhpcy5uZXh0SW50ZXJuYWxTdGF0ZSA9IDA7XG4gICAgfVxuXG4gICAgZ2V0IGVuZXJnaXNlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuZXJnaXNlZDtcbiAgICB9XG5cbiAgICBzZXQgZW5lcmdpc2VkKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9lbmVyZ2lzZWQgPT09IHZhbHVlKSByZXR1cm47XG4gICAgICAgIHRoaXMuX2VuZXJnaXNlZCA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5wbGFudCkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFudC5lbmVyZ2lzZWRDb3VudCsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYW50LmVuZXJnaXNlZENvdW50LS07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVTdGF0ZSgpe1xuICAgICAgICB0aGlzLmludGVybmFsU3RhdGUgPSB0aGlzLm5leHRJbnRlcm5hbFN0YXRlO1xuICAgICAgICB0aGlzLm5leHRJbnRlcm5hbFN0YXRlID0gMDtcbiAgICB9XG5cbiAgICBkcmF3KGN0eCwgeCwgeSwgc2l6ZSwgY29sb3VyKXtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG91cjtcbiAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgICAgICAvL2N0eC5zdHJva2VSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHJldHVybiBgQ2VsbCBhdCAoJHt0aGlzLnh9LCAke3RoaXMueX0pIGVuZXJneTogJHt0aGlzLmVuZXJnaXNlZH1gO1xuICAgIH1cbn1cblxuZXhwb3J0IHtDZWxsfTsiLCJpbXBvcnQge3JhbmRvbUludCwgcmFuZG9tUHJvYn0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge0FjdGlvbk1hcH0gZnJvbSBcIi4vYWN0aW9ucy5qc1wiO1xuXG5jbGFzcyBCeXRlQXJyYXkgZXh0ZW5kcyBBcnJheXtcblxuICAgIGNvbnN0cnVjdG9yKGxlbmd0aD0wLCBpbml0aWFsX211dF9leHA9MCl7XG4gICAgICAgIHN1cGVyKGxlbmd0aCk7XG4gICAgICAgIHRoaXMubXV0X2V4cCA9IGluaXRpYWxfbXV0X2V4cDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbShhcnIsIG11dF9leHA9MCl7XG4gICAgICAgIHZhciBiYSA9IG5ldyBCeXRlQXJyYXkoYXJyLmxlbmd0aCwgbXV0X2V4cCk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGJhLmxlbmd0aDtpKyspe1xuICAgICAgICAgICAgYmFbaV0gPSBhcnJbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlcmlhbGl6ZSB0aGlzIGdlbm9tZSB0byBhIHN0cmluZzogXCI8bXV0X2V4cD47PGJ5dGUwPiw8Ynl0ZTE+LC4uLlwiXG4gICAgICovXG4gICAgc2VyaWFsaXplKCl7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm11dF9leHB9OyR7QXJyYXkuZnJvbSh0aGlzKS5qb2luKFwiLFwiKX1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlc2VyaWFsaXplIGEgZ2Vub21lIHN0cmluZyBwcm9kdWNlZCBieSBzZXJpYWxpemUoKS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gICAgICogQHJldHVybnMge0J5dGVBcnJheX1cbiAgICAgKi9cbiAgICBzdGF0aWMgZGVzZXJpYWxpemUoc3RyKXtcbiAgICAgICAgY29uc3QgcGFydHMgPSBzdHIudHJpbSgpLnNwbGl0KFwiO1wiKTtcbiAgICAgICAgY29uc3QgbXV0X2V4cCA9IHBhcnNlRmxvYXQocGFydHNbMF0pO1xuICAgICAgICBjb25zdCBieXRlcyA9IHBhcnRzWzFdLnNwbGl0KFwiLFwiKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgcmV0dXJuIEJ5dGVBcnJheS5mcm9tKGJ5dGVzLCBtdXRfZXhwKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmFuZG9tKGxlbmd0aCl7XG4gICAgICAgIHZhciBiYSA9IG5ldyBCeXRlQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8YmEubGVuZ3RoO2krKyl7XG4gICAgICAgICAgICBiYVtpXSA9IHJhbmRvbUludCgwLCAyNTUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYTtcbiAgICB9XG5cbiAgICBjb3B5KCl7XG4gICAgICAgIHZhciBuZXdBcnIgPSBuZXcgQnl0ZUFycmF5KHRoaXMubGVuZ3RoLCB0aGlzLm11dF9leHApO1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIG5ld0FycltpXSA9IHRoaXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld0FycjtcbiAgICB9XG5cbn1cblxuY2xhc3MgTXV0YXRvcntcbiAgICBjb25zdHJ1Y3Rvcihwcm9iLCBwcm9iX3JlcGxhY2VtZW50LCBwcm9iX2luc2VydGlvbiwgcHJvYl9kZWxldGlvbiwgcHJvYl9kdXAsIHJlcGxhY2VtZW50X21vZGUsIHVuaXRzKXtcbiAgICAgICAgdGhpcy5wcm9iID0gcHJvYjtcbiAgICAgICAgdGhpcy5wUiA9IHByb2JfcmVwbGFjZW1lbnQ7XG4gICAgICAgIHRoaXMucEkgPSBwcm9iX2luc2VydGlvbjtcbiAgICAgICAgdGhpcy5wRCA9IHByb2JfZGVsZXRpb247XG4gICAgICAgIHRoaXMucER1cCA9IHByb2JfZHVwO1xuICAgICAgICB0aGlzLnBSbW9kZSA9IHJlcGxhY2VtZW50X21vZGU7ICBcbiAgICAgICAgdGhpcy51bml0cyA9IHVuaXRzO1xuICAgIH1cblxuICAgIG11dGF0ZShnZW5vbWUpe1xuICAgICAgICBsZXQgbXV0YXRlZCA9IGZhbHNlO1xuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucFIsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2UoZ2Vub21lKTtcbiAgICAgICAgICAgIG11dGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMubVByb2IodGhpcy5wSSwgZ2Vub21lLm11dF9leHApKXtcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGdlbm9tZSk7XG4gICAgICAgICAgICBtdXRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm1Qcm9iKHRoaXMucEQsIGdlbm9tZS5tdXRfZXhwKSl7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShnZW5vbWUpO1xuICAgICAgICAgICAgbXV0YXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG11dGF0ZWQ7XG4gICAgfVxuXG4gICAgbVByb2IocCwgZXhwKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbVByb2IocCAqIE1hdGgucG93KCB0aGlzLnByb2IsIGV4cCkpO1xuICAgIH1cblxuICAgIHJlcGxhY2UoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBzd2l0Y2godGhpcy5wUm1vZGUpe1xuICAgICAgICBjYXNlIFwiYnl0ZXdpc2VcIjpcbiAgICAgICAgICAgIGdlbm9tZVtpXSA9IHRoaXMucmFuZG9tQ2hhcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJiaXR3aXNlXCI6XG4gICAgICAgICAgICBnZW5vbWVbaV0gPSBnZW5vbWVbaV0gXiAoMSA8PCByYW5kb21JbnQoMCwgNykpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbXV0YXRpb24gcmVwbGFjZW1lbnQgbW9kZTogJHt0aGlzLnBSbW9kZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBpbnNlcnQoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAwLCB0aGlzLnJhbmRvbUNoYXIoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZWxldGUoZ2Vub21lKXtcbiAgICAgICAgdmFyIGkgPSB0aGlzLnJhbmRvbVBvcyhnZW5vbWUpO1xuICAgICAgICBmb3IodmFyIG49MDsgbjx0aGlzLnVuaXRzOyBuKyspe1xuICAgICAgICAgICAgZ2Vub21lLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJhbmRvbUNoYXIoKXtcbiAgICAgICAgcmV0dXJuIHJhbmRvbUludCgwLCAyNTUpO1xuICAgIH1cblxuICAgIHJhbmRvbVBvcyhnZW5vbWUpe1xuICAgICAgICByZXR1cm4gcmFuZG9tSW50KDAsIGdlbm9tZS5sZW5ndGgtMSk7XG4gICAgfVxufVxuXG5cblxuY2xhc3MgUnVsZSB7XG4gICAgY29uc3RydWN0b3IoZXFNYXNrLCBzdGF0ZSwgYWN0aW9uKXtcbiAgICAgICAgdGhpcy5lcU1hc2sgPSBlcU1hc2s7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBhY3Rpb247XG4gICAgfVxuXG4gICAgbWF0Y2hlcyhzdGF0ZSl7XG4gICAgICAgIHZhciBlcVN0YXRlID0gc3RhdGUgJiB0aGlzLmVxTWFzaztcbiAgICAgICAgcmV0dXJuIGVxU3RhdGUgPT09IHRoaXMuc3RhdGU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuc3RhdGV9IC0+ICR7dGhpcy5hY3Rpb259YDtcbiAgICB9XG59XG5cbmNsYXNzIEdlbm9tZUludGVycHJldGVye1xuICAgIC8qKlxuICAgICAqIE1ldGhvZHMgdGhhdCBkZWNvZGUgZ2Vub21lcyBpbnRvIHJ1bGVzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWFwcGluZywgY29kZVJhbmdlPTI1Nil7XG4gICAgICAgIHRoaXMubWFwcGluZyA9IG5ldyBBY3Rpb25NYXAobWFwcGluZywgY29kZVJhbmdlKTtcbiAgICB9XG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XG5cbiAgICB9XG59XG5cblxuY2xhc3MgUHJvbW90b3JJbnRlcnByZXRlciBleHRlbmRzIEdlbm9tZUludGVycHJldGVye1xuICAgIGNvbnN0cnVjdG9yKG1hcHBpbmcpe1xuICAgICAgICBzdXBlcihtYXBwaW5nLCA2NCk7IC8vIHRlcm1pbmF0b3IgY29udHJpYnV0ZXMgbG93ZXIgNiBiaXRzOiByYW5nZSAwLTYzXG4gICAgfVxuICAgIGludGVycHJldChieXRlYXJyYXksIHBsYW50PW51bGwpe1xuICAgICAgICB2YXIgcnVsZXMgPSBbXTtcbiAgICAgICAgdmFyIGJlaGF2aW9yYWxHZW5lcyA9IFtdO1xuICAgICAgICB2YXIgc3RydWN0dXJhbEdlbmVzID0gW107XG4gICAgICAgIHZhciBnZW5lID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgYyA9IGJ5dGVhcnJheVtpXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoYml0U2V0KGMsIDcpKXtcbiAgICAgICAgICAgICAgICAvLyBTdGFydCBvZiBhIGdlbmVcbiAgICAgICAgICAgICAgICBnZW5lID0gW2NdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihiaXRTZXQoYywgNikpe1xuICAgICAgICAgICAgICAgIC8vIFRlcm1pbmF0b3IgKEVuZCBvZiBhIGdlbmUpXG4gICAgICAgICAgICAgICAgaWYoZ2VuZS5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgZ2VuZS5wdXNoKGMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBCaXQgNSBvZiB0aGUgc3RhcnRpbmcgcHJvbW90b3IgZGV0ZXJtaW5lcyBpZiBpdCdzIHN0cnVjdHVyYWxcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJpdFNldChnZW5lWzBdLCA1KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RydWN0dXJhbEdlbmVzLnB1c2goZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZWhhdmlvcmFsR2VuZXMucHVzaChnZW5lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBnZW5lID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChnZW5lLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBnZW5lLnB1c2goYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcm9jZXNzIFN0cnVjdHVyYWwgR2VuZXMgKFBoZW5vdHlwaWMgVHJhaXRzKVxuICAgICAgICBpZiAocGxhbnQpIHtcbiAgICAgICAgICAgIHN0cnVjdHVyYWxHZW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGdlbmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFpdENvZGUgPSBnZW5lW2dlbmUubGVuZ3RoIC0gMV0gJiAweDNGO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gKGdlbmUubGVuZ3RoIC0gMikgKiAwLjAxOyAvLyBTdHJlbmd0aCBkZXBlbmRzIG9uIGdlbmUgbGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc3dpdGNoKHRyYWl0Q29kZSAlIDQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOiBwbGFudC50cmFpdHMubGVhbm92ZXIgPSBNYXRoLm1heCgwLjEsIHBsYW50LnRyYWl0cy5sZWFub3ZlciAtIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTogcGxhbnQudHJhaXRzLmF0dGFjayA9IE1hdGgubWluKDUuMCwgcGxhbnQudHJhaXRzLmF0dGFjayArIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjogcGxhbnQudHJhaXRzLmVmZmljaWVuY3kgPSBNYXRoLm1heCgwLjEsIHBsYW50LnRyYWl0cy5lZmZpY2llbmN5IC0gdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiBwbGFudC50cmFpdHMuZGVhdGggPSBNYXRoLm1heCgwLjEsIHBsYW50LnRyYWl0cy5kZWF0aCAtIHZhbHVlKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcm9jZXNzIEJlaGF2aW9yYWwgR2VuZXMgKFN0YXRlLUFjdGlvbiBSdWxlcylcbiAgICAgICAgYmVoYXZpb3JhbEdlbmVzLmZvckVhY2goZnVuY3Rpb24oZ2VuZSl7XG4gICAgICAgICAgICAvLyBleHRyYWN0IDYgbGVhc3Qgc2lnIGJpdHMgZnJvbSB0ZXJtaW5hdG9yIGFzIHRoZSBhY3Rpb24gY29kZVxuICAgICAgICAgICAgdmFyIGFjdGlvbkNvZGUgPSBnZW5lW2dlbmUubGVuZ3RoLTFdICYgMHgzRjtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSB0aGlzLm1hcHBpbmcuZ2V0QWN0aW9uKGFjdGlvbkNvZGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyB0YWtlIGluZm9ybWF0aW9uIGZyb20gb3BlcmF0b3JzIHRvIGNyZWF0ZSAzMi1iaXQgc3RhdGUgbWFza1xuICAgICAgICAgICAgdmFyIG1hc2sgPSAwO1xuICAgICAgICAgICAgdmFyIGVxTWFzayA9IDA7IFxuICAgICAgICAgICAgZm9yKHZhciBpPTE7IGk8Z2VuZS5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gNSBsZWFzdCBzaWcgYml0cyBkZXRlcm1pbmUgdGhlIG1hc2sgaW5kZXggKDAtMzEpXG4gICAgICAgICAgICAgICAgdmFyIG1hc2tCaXQgPSBnZW5lW2ldICYgMHgxRjtcblxuICAgICAgICAgICAgICAgIC8vIDZ0aCBiaXQgZGV0ZXJtaW5lcyBpZiB3ZSBtYXRjaCAxIG9yIDBcbiAgICAgICAgICAgICAgICB2YXIgYml0U3RhdGUgPSAoZ2VuZVtpXSAmIDB4MjApID4+IDU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gVXNlIHVuc2lnbmVkIHNoaWZ0IGxvZ2ljIGZvciAzMi1iaXQgY29uc2lzdGVuY3lcbiAgICAgICAgICAgICAgICBjb25zdCBiaXRWYWx1ZSA9ICgxIDw8IG1hc2tCaXQpID4+PiAwO1xuICAgICAgICAgICAgICAgIGlmIChiaXRTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBtYXNrID0gKG1hc2sgfCBiaXRWYWx1ZSkgPj4+IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVxTWFzayA9IChlcU1hc2sgfCBiaXRWYWx1ZSkgPj4+IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydWxlcy5wdXNoKG5ldyBSdWxlKGVxTWFzaywgbWFzaywgYWN0aW9uKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBydWxlcztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJpdFNldChieXRlLCBpKXtcbiAgICByZXR1cm4gKGJ5dGUgPj4gaSkgJiAxO1xufVxuXG5leHBvcnQge0J5dGVBcnJheSwgUHJvbW90b3JJbnRlcnByZXRlciwgTXV0YXRvcn07IiwiaW1wb3J0IHtyYW5kb21JbnQsIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtDZWxsfSBmcm9tIFwiLi9jZWxsLmpzXCI7XG5pbXBvcnQge05FSUdIQk9VUkhPT0R9IGZyb20gXCIuL2FjdGlvbnMuanNcIjtcblxuY2xhc3MgUGxhbnR7XG4gICAgY29uc3RydWN0b3IoeCwgd29ybGQsIGdlbm9tZSwgYmlydGhTdGVwLCB1c2VJbnRlcm5hbFN0YXRlPWZhbHNlKSB7XG4gICAgICAgIHRoaXMud29ybGQgPSB3b3JsZDtcbiAgICAgICAgdGhpcy5lbmVyZ2lzZWRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuY2VsbHMgPSBbbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCAwKV07XG4gICAgICAgIHRoaXMuZ2Vub21lID0gZ2Vub21lO1xuICAgICAgICB0aGlzLnVzZUludGVybmFsU3RhdGUgPSB1c2VJbnRlcm5hbFN0YXRlO1xuICAgICAgICB0aGlzLnJ1bGVzID0gbnVsbDsgLy8gY2FjaGVkIHJ1bGVzXG4gICAgICAgIHRoaXMubGVhbm92ZXJFbmVyZ2lzZWQgPSAwOyAvLyBJbmNyZW1lbnRhbCB0cmFja2luZ1xuICAgICAgICB0aGlzLmJpcnRoU3RlcCA9IGJpcnRoU3RlcDtcbiAgICAgICAgdGhpcy5udXRyaWVudENvdW50ID0gMTAuMDsgLy8gU3RhcnQgd2l0aCBzb21lIG51dHJpZW50c1xuICAgICAgICB0aGlzLnRyYWl0cyA9IHtcbiAgICAgICAgICAgIGxlYW5vdmVyOiAxLjAsXG4gICAgICAgICAgICBkZWF0aDogMS4wLFxuICAgICAgICAgICAgYXR0YWNrOiAxLjAsXG4gICAgICAgICAgICBlZmZpY2llbmN5OiAxLjBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBnZXROZWlnaGJvdXJob29kKGNlbGwpe1xuICAgICAgICAvLyBSZXR1cm4gdGhlIG5laWdoYm91cmhvb2QgbWFza1xuICAgICAgICB2YXIgbWFzayA9IDA7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPE5FSUdIQk9VUkhPT0QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIHBvcyA9IE5FSUdIQk9VUkhPT0RbaV07XG4gICAgICAgICAgICB2YXIgeCA9IGNlbGwueCArIHBvc1swXTtcbiAgICAgICAgICAgIHZhciB5ID0gY2VsbC55ICsgcG9zWzFdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBCb3VuZHMgY2hlY2sgaW5zdGVhZCBvZiB0cnktY2F0Y2hcbiAgICAgICAgICAgIGlmICh4ID49IDAgJiYgeCA8IHRoaXMud29ybGQud2lkdGggJiYgeSA+PSAwICYmIHkgPCB0aGlzLndvcmxkLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICAgICAgaWYgKHdvcmxkUG9zIGluc3RhbmNlb2YgQ2VsbCl7XG4gICAgICAgICAgICAgICAgICAgIG1hc2sgPSBtYXNrIHwgKDEgPDwgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXNrO1xuICAgIH1cblxuICAgIGdldFN0YXRlKGNlbGwpe1xuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2QgPSB0aGlzLmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIFxuICAgICAgICAvLyBCYXNpYyAxNi1iaXQgc3RhdGVcbiAgICAgICAgbGV0IHN0YXRlID0gbmVpZ2hib3Job29kIHwgKGNlbGwuaW50ZXJuYWxTdGF0ZSA8PCA4KSB8ICgoY2VsbC5lbmVyZ2lzZWQgPyAxIDogMCkgPDwgMTUpO1xuICAgICAgICBcbiAgICAgICAgLy8gTmljaGUgZW5oYW5jZW1lbnRzICgzMi1iaXQpXG4gICAgICAgIC8vIEJpdHMgMC03OiBOZWlnaGJvciBwcmVzZW5jZSAoaW4gbmVpZ2hib3Job29kKVxuICAgICAgICAvLyBCaXRzIDgtMTU6IE5laWdoYm9yIFB1YmxpYyBCaXRzIChCaXQgOCBvZiBuZWlnaGJvciBpbnRlcm5hbFN0YXRlKVxuICAgICAgICAvLyBCaXRzIDE2LTIzOiBOZWlnaGJvciBFbmVyZ3kgU3RhdHVzXG4gICAgICAgIC8vIEJpdHMgMjQtMzA6IFNlbGYgSW50ZXJuYWwgU3RhdGVcbiAgICAgICAgLy8gQml0IDMxOiBTZWxmIEVuZXJnaXNlZFxuICAgICAgICBcbiAgICAgICAgbGV0IG5laWdoYm9yU2lnbmFscyA9IDA7XG4gICAgICAgIGxldCBuZWlnaGJvckVuZXJneSA9IDA7XG4gICAgICAgIFxuICAgICAgICBmb3IodmFyIGk9MDsgaTxORUlHSEJPVVJIT09ELmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBwb3MgPSBORUlHSEJPVVJIT09EW2ldO1xuICAgICAgICAgICAgdmFyIHggPSBjZWxsLnggKyBwb3NbMF07XG4gICAgICAgICAgICB2YXIgeSA9IGNlbGwueSArIHBvc1sxXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHggPj0gMCAmJiB4IDwgdGhpcy53b3JsZC53aWR0aCAmJiB5ID49IDAgJiYgeSA8IHRoaXMud29ybGQuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHdvcmxkUG9zID0gdGhpcy53b3JsZC5jZWxsc1t4XVt5XTtcbiAgICAgICAgICAgICAgICBpZiAod29ybGRQb3MgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgQml0IDAgb2YgbmVpZ2hib3IncyBpbnRlcm5hbCBzdGF0ZSAoYXMgdGhlaXIgUHVibGljIEJpdClcbiAgICAgICAgICAgICAgICAgICAgaWYgKCh3b3JsZFBvcy5pbnRlcm5hbFN0YXRlICYgMSkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9yU2lnbmFscyB8PSAoMSA8PCBpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAod29ybGRQb3MuZW5lcmdpc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvckVuZXJneSB8PSAoMSA8PCBpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbnN0cnVjdCAzMi1iaXQgc3RhdGVcbiAgICAgICAgLy8gV2UgdXNlIHVuc2lnbmVkIHJpZ2h0IHNoaWZ0IGZvciAzMi1iaXQgY29uc2lzdGVuY3lcbiAgICAgICAgc3RhdGUgPSAobmVpZ2hib3Job29kICYgMHhGRikgfCBcbiAgICAgICAgICAgICAgICAoKG5laWdoYm9yU2lnbmFscyAmIDB4RkYpIDw8IDgpIHwgXG4gICAgICAgICAgICAgICAgKChuZWlnaGJvckVuZXJneSAmIDB4RkYpIDw8IDE2KSB8IFxuICAgICAgICAgICAgICAgICgoY2VsbC5pbnRlcm5hbFN0YXRlICYgMHg3RikgPDwgMjQpIHwgXG4gICAgICAgICAgICAgICAgKChjZWxsLmVuZXJnaXNlZCA/IDEgOiAwKSA8PCAzMSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBzdGF0ZSA+Pj4gMDsgXG4gICAgfVxuXG4gICAgbWV0YWJvbGlzbShwYXJhbXMpIHtcbiAgICAgICAgaWYgKHBhcmFtcy5zaW1fbW9kZSAhPT0gXCJuaWNoZVwiKSByZXR1cm47XG5cbiAgICAgICAgLy8gMS4gRXh0cmFjdGlvbiBmcm9tIHJvb3RzICh5PTApXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMuY2VsbHNbaV07XG4gICAgICAgICAgICBpZiAoY2VsbC55ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gdGhpcy53b3JsZC5zb2lsTnV0cmllbnRzW2NlbGwueF07XG4gICAgICAgICAgICAgICAgY29uc3QgYW1vdW50ID0gTWF0aC5taW4oYXZhaWxhYmxlLCBwYXJhbXMubnV0cmllbnRfZXh0cmFjdF9yYXRlKTtcbiAgICAgICAgICAgICAgICB0aGlzLm51dHJpZW50Q291bnQgKz0gYW1vdW50O1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGQuc29pbE51dHJpZW50c1tjZWxsLnhdIC09IGFtb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIE1haW50ZW5hbmNlIGNvc3RcbiAgICAgICAgLy8gVHJhaXRzIGNhbiByZWR1Y2UgbWFpbnRlbmFuY2UgY29zdFxuICAgICAgICBjb25zdCBjb3N0ID0gdGhpcy5jZWxscy5sZW5ndGggKiBwYXJhbXMubnV0cmllbnRfbWFpbnRlbmFuY2VfY29zdCAqIHRoaXMudHJhaXRzLmVmZmljaWVuY3k7XG4gICAgICAgIHRoaXMubnV0cmllbnRDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMubnV0cmllbnRDb3VudCAtIGNvc3QpO1xuICAgIH1cblxuICAgIGdyb3coKXtcbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBncm93XG4gICAgICAgICAgICBpZihyYW5kb21Qcm9iKDAuOCkpe1xuICAgICAgICAgICAgICAgIHZhciBzcGFjZXMgPSB0aGlzLmdldEdyb3dEaXJlY3Rpb24oY2VsbCk7XG4gICAgICAgICAgICAgICAgaWYoc3BhY2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gc3BhY2VzW3JhbmRvbUludCgwLCBzcGFjZXMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24gIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm93RnJvbUNlbGwoY2VsbCwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR3JvdyB0aGUgcGxhbnQgYnkgb25lIGNlbGwgaWYgcG9zc2libGVcbiAgICAgKiBAcGFyYW0geyp9IGNlbGwgdGhlIGNlbGwgdG8gZ3JvdyBmcm9tXG4gICAgICogQHBhcmFtIHsqfSBkaXJlY3Rpb24gdGhlIGRpcmVjdGlvbiB0byBncm93IGluXG4gICAgICovXG4gICAgZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbiwgc3RlcG51bSwgcGFyYW1zID0gbnVsbCl7XG4gICAgICAgIHZhciB4ID0gY2VsbC54K2RpcmVjdGlvblswXSwgeSA9IGNlbGwueStkaXJlY3Rpb25bMV07XG4gICAgICAgIC8vIGNoZWNrIGlmIHNwYWNlIGlzIGNsZWFyXG4gICAgICAgIHZhciBzcGFjZSA9IHRoaXMud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICAgICAgaWYgKHNwYWNlID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGFjZSBpbnN0YW5jZW9mIENlbGwpe1xuICAgICAgICAgICAgaWYgKHNwYWNlLnBsYW50ID09PSB0aGlzKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEF0dGFjayBvY2N1cnNcbiAgICAgICAgICAgIGlmICh0aGlzLndvcmxkLm9uQXR0YWNrKSB0aGlzLndvcmxkLm9uQXR0YWNrKCk7XG5cbiAgICAgICAgICAgIC8vIHRoaXMgcGxhbnQgd2lsbCBraWxsIHRoZSBvdGhlciB3aXRoIGEgcHJvYmFiaWxpdHlcbiAgICAgICAgICAgIC8vIGRldGVybWluZWQgYnkgZGVmZW5kZXIncyBlbmVyZ3kgYW5kIGF0dGFja2VyJ3MgYXR0YWNrIHRyYWl0XG4gICAgICAgICAgICBjb25zdCBzdWNjZXNzUHJvYiA9IHNwYWNlLnBsYW50LmdldEtpbGxQcm9iYWJpbGl0eSgpICogdGhpcy5nZXRBdHRhY2tCb251cygpO1xuICAgICAgICAgICAgaWYocmFuZG9tUHJvYihzdWNjZXNzUHJvYikpe1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBzdWNjZWVkZWQuIEtpbGwgY29tcGV0aXRvciBhbmQgY29udGludWUgd2l0aCBncm93dGhcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLmtpbGxQbGFudChzcGFjZS5wbGFudCwgcGFyYW1zID8gcGFyYW1zLm51dHJpZW50X3JlY3ljbGluZ19mYWN0b3IgOiAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGF0dGFjayBmYWlsZWRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICAvLyBncm93IGNlbGwgaW4gdG8gZW1wdHkgc3BhY2VcbiAgICAgICAgdmFyIG5ld19jZWxsID0gbmV3IENlbGwodGhpcywgdGhpcy53b3JsZC5nZXRYKHgpLCB5KTtcbiAgICAgICAgdGhpcy5jZWxscy5wdXNoKG5ld19jZWxsKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFVwZGF0ZSBpbmNyZW1lbnRhbCB0cmFja2luZ1xuICAgICAgICBjb25zdCByb290Q2VsbCA9IHRoaXMuY2VsbHNbMF07XG4gICAgICAgIGNvbnN0IGxlID0gdGhpcy53b3JsZC53aWR0aC8yIC0gKCAoKCAxLjUqdGhpcy53b3JsZC53aWR0aCApICsgbmV3X2NlbGwueCAtIHJvb3RDZWxsLngpICAlIHRoaXMud29ybGQud2lkdGgpO1xuICAgICAgICB0aGlzLmxlYW5vdmVyRW5lcmdpc2VkICs9IGxlO1xuXG4gICAgICAgIHRoaXMud29ybGQuYWRkQ2VsbChuZXdfY2VsbCk7XG4gICAgfVxuXG4gICAgbWV0YWJvbGlzbShwYXJhbXMpIHtcbiAgICAgICAgaWYgKHBhcmFtcy5zaW1fbW9kZSAhPT0gXCJuaWNoZVwiKSByZXR1cm47XG5cbiAgICAgICAgLy8gVGFyZ2V0IHN0b3JlIGlzIDEweCB0aGUgY3VycmVudCBtYWludGVuYW5jZSBjb3N0XG4gICAgICAgIGNvbnN0IGJhc2VNYWludCA9IHRoaXMuY2VsbHMubGVuZ3RoICogcGFyYW1zLm51dHJpZW50X21haW50ZW5hbmNlX2Nvc3Q7XG4gICAgICAgIGNvbnN0IHRhcmdldFN0b3JlID0gYmFzZU1haW50ICogMTAuMDtcbiAgICAgICAgY29uc3QgaHVuZ2VyID0gTWF0aC5tYXgoMC4xLCBNYXRoLm1pbigxLjAsIDEuMCAtICh0aGlzLm51dHJpZW50Q291bnQgLyAodGFyZ2V0U3RvcmUgKyAwLjEpKSkpO1xuXG4gICAgICAgIC8vIDEuIEV4dHJhY3Rpb24gZnJvbSByb290cyAoeT0wKVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgICAgICAgICAgaWYgKGNlbGwueSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IHRoaXMud29ybGQuc29pbE51dHJpZW50c1tjZWxsLnhdO1xuICAgICAgICAgICAgICAgIGxldCBleHRyYWN0UmF0ZSA9IHBhcmFtcy5udXRyaWVudF9leHRyYWN0X3JhdGUgKiBodW5nZXI7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbGV0IGFjdHVhbEFtb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgLy8gQWN0aXZlIEV4dHJhY3Rpb246IGNvbnN1bWVzIGVuZXJneSBmb3IgaGlnaGVyIHJhdGVcbiAgICAgICAgICAgICAgICBpZiAoY2VsbC5lbmVyZ2lzZWQgJiYgaHVuZ2VyID4gMC4yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNlbGwuZW5lcmdpc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbEFtb3VudCA9IE1hdGgubWluKGF2YWlsYWJsZSwgZXh0cmFjdFJhdGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhc3NpdmUgRXh0cmFjdGlvbjogc2xvdyBidXQgZnJlZVxuICAgICAgICAgICAgICAgICAgICBhY3R1YWxBbW91bnQgPSBNYXRoLm1pbihhdmFpbGFibGUsIGV4dHJhY3RSYXRlICogMC4xKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLm51dHJpZW50Q291bnQgKz0gYWN0dWFsQW1vdW50O1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGQuc29pbE51dHJpZW50c1tjZWxsLnhdIC09IGFjdHVhbEFtb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIE1haW50ZW5hbmNlIGNvc3RcbiAgICAgICAgLy8gVHJhaXRzIGNhbiByZWR1Y2UgbWFpbnRlbmFuY2UgY29zdFxuICAgICAgICBjb25zdCBjb3N0ID0gYmFzZU1haW50ICogdGhpcy50cmFpdHMuZWZmaWNpZW5jeTtcbiAgICAgICAgdGhpcy5udXRyaWVudENvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5udXRyaWVudENvdW50IC0gY29zdCk7XG4gICAgfVxuXG4gICAgZ2V0S2lsbFByb2JhYmlsaXR5KCl7XG4gICAgICAgIC8vIFByb2JhYmlsaXR5IHRoYXQgVEhJUyBwbGFudCBpcyBraWxsZWQgKGRlZmVuZGVyJ3Mgc3RhdHMpXG4gICAgICAgIC8vIE1vcmUgZW5lcmd5ID0gaGFyZGVyIHRvIGtpbGxcbiAgICAgICAgcmV0dXJuIHRoaXMuZW5lcmdpc2VkQ291bnQgPiAwID8gMS90aGlzLmVuZXJnaXNlZENvdW50IDogMS4wO1xuICAgIH1cblxuICAgIGdldEF0dGFja0JvbnVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFpdHMuYXR0YWNrO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZSB3aGV0aGVyIHRoaXMgcGxhbnQgc2hvdWxkIGRpZS5cbiAgICAgKiBAcGFyYW0ge30gbmF0dXJhbF9leHAgZXhwb25lbnQgdG8gdGhlIG51bWJlciBvZiBjZWxsc1xuICAgICAqIEBwYXJhbSB7Kn0gZW5lcmd5X2V4cCBleHBvbmVudCB0byB0aGUgbnVtYmVyIG9mIGVuZXJneSByaWNoIGNlbGxzXG4gICAgICogQHBhcmFtIHsqfSBsZWFub3Zlcl9mYWN0b3IgZmFjdG9yIHRvIHRoZSBsZWFub3ZlciB0ZXJtXG4gICAgICovXG4gICAgZ2V0RGVhdGhQcm9iYWJpbGl0eShkZWF0aF9mYWN0b3IsIG5hdHVyYWxfZXhwLCBlbmVyZ3lfZXhwLCBsZWFub3Zlcl9mYWN0b3IsIHNpbV9tb2RlPVwiY2xhc3NpY1wiKXtcbiAgICAgICAgdmFyIG51bUNlbGxzID0gdGhpcy5jZWxscy5sZW5ndGg7XG4gICAgICAgIFxuICAgICAgICB2YXIgbGVhbm92ZXJDZWxscyA9IDIvKG51bUNlbGxzKihudW1DZWxscy0xKSk7XG4gICAgICAgIGlmIChsZWFub3ZlckNlbGxzID09PSBJbmZpbml0eSl7XG4gICAgICAgICAgICBsZWFub3ZlckNlbGxzID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWFub3ZlclRlcm0gPSBsZWFub3ZlckNlbGxzKk1hdGguYWJzKHRoaXMubGVhbm92ZXJFbmVyZ2lzZWQpO1xuICAgICAgICBcbiAgICAgICAgdmFyIGRfbmF0dXJhbCA9IE1hdGgucG93KG51bUNlbGxzLCBuYXR1cmFsX2V4cCk7XG4gICAgICAgIHZhciBkX2VuZXJneSA9IE1hdGgucG93KHRoaXMuZW5lcmdpc2VkQ291bnQrMSwgZW5lcmd5X2V4cCk7XG4gICAgICAgIHZhciBkX2xlYW5vdmVyID0gKGxlYW5vdmVyX2ZhY3RvciAqIHRoaXMudHJhaXRzLmxlYW5vdmVyKSAqIGxlYW5vdmVyVGVybTtcbiAgICAgICAgXG4gICAgICAgIC8vIEJhc2UgcHJvYmFiaWxpdHkgbW9kaWZpZWQgYnkgZGVhdGggdHJhaXRcbiAgICAgICAgdmFyIHBEZWF0aCA9IChkZWF0aF9mYWN0b3IgKiB0aGlzLnRyYWl0cy5kZWF0aCkgKiBkX25hdHVyYWwgKiBkX2VuZXJneSArIGRfbGVhbm92ZXI7XG4gICAgICAgIFxuICAgICAgICAvLyBOaWNoZSBtb2RlIHNwZWNpZmljIHBlbmFsdGllc1xuICAgICAgICBpZiAoc2ltX21vZGUgPT09IFwibmljaGVcIikge1xuICAgICAgICAgICAgLy8gU3RhcnZhdGlvbiBwZW5hbHR5XG4gICAgICAgICAgICBpZiAodGhpcy5udXRyaWVudENvdW50IDw9IDAgJiYgbnVtQ2VsbHMgPiAxKSB7XG4gICAgICAgICAgICAgICAgcERlYXRoICs9IDAuMDU7IC8vIDUlIGZsYXQgaW5jcmVhc2UgaWYgc3RhcnZpbmdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBcInByb2JcIjogcERlYXRoLFxuICAgICAgICAgICAgXCJuYXR1cmFsXCI6IGRfbmF0dXJhbCxcbiAgICAgICAgICAgIFwiZW5lcmd5XCI6IGRfZW5lcmd5LFxuICAgICAgICAgICAgXCJsZWFub3ZlclwiOiBkX2xlYW5vdmVyLFxuICAgICAgICAgICAgXCJudXRyaWVudHNcIjogdGhpcy5udXRyaWVudENvdW50XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgeyBQbGFudCB9OyIsImltcG9ydCBzZWVkcmFuZG9tIGZyb20gXCJzZWVkcmFuZG9tXCI7XG5cbi8qKlxuICogU2VlZCBhbGwgZnV0dXJlIGNhbGxzIHRvIE1hdGgucmFuZG9tXG4gKiBAcGFyYW0geyp9IHNlZWQgZGF0YSB0byB1c2UgdG8gc2VlZCBhbGwgZnV0dXJlIFJORyBjYWxsc1xuICovXG5mdW5jdGlvbiBzZWVkUmFuZG9tKHNlZWQpe1xuICAgIHNlZWRyYW5kb20oc2VlZCwge2dsb2JhbDogdHJ1ZX0pO1xufVxuXG4vKipcbiAqIHJldHVybnMgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIG1heCAoaW5jbHVzaXZlKVxuICogQHBhcmFtIHsqfSBtYXggbWF4aW11bSBpbnRlZ2VyIHRvIGdlbmVyYXRlIGFzIGEgcmFuZG9tIG51bWJlclxuICovXG5mdW5jdGlvbiByYW5kb21JbnQobWluLCBtYXgpe1xuICAgIC8vIG5vdGU6IE1hdGgucmFuZG9tIHJldHVybnMgYSByYW5kb20gbnVtYmVyIGV4Y2x1c2l2ZSBvZiAxLFxuICAgIC8vIHNvIHRoZXJlIGlzICsxIGluIHRoZSBiZWxvdyBlcXVhdGlvbiB0byBlbnN1cmUgdGhlIG1heGltdW1cbiAgICAvLyBudW1iZXIgaXMgY29uc2lkZXJlZCB3aGVuIGZsb29yaW5nIDAuOS4uLiByZXN1bHRzLlxuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG4vKipcbiAqIEV2YWx1YXRlcyB0aGUgY2hhbmNlIG9mIGFuIGV2ZW50IGhhcHBlbmluZyBnaXZlbiBwcm9iXG4gKiBAcGFyYW0geyp9IHByb2IgZnJhY3Rpb24gYmV0d2VlbiAwIGFuZCAxIGNoYW5jZSBvZiB0aGUgZXZlbnQgaGFwcGVuaW5nXG4gKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBldmVudCBoYXBwZW5zLCBmYWxzZSBpZiBub3RcbiAqL1xuZnVuY3Rpb24gcmFuZG9tUHJvYihwcm9iKXtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSA8PSBwcm9iO1xufVxuXG5leHBvcnQge3NlZWRSYW5kb20sIHJhbmRvbUludCwgcmFuZG9tUHJvYn07IiwiaW1wb3J0ICogYXMgc3RhdHMgZnJvbSBcInN0YXRzLWxpdGVcIjtcblxuZnVuY3Rpb24gbGV2ZW5zaHRlaW4oYSwgYikge1xuICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGIubGVuZ3RoO1xuICAgIGlmIChiLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGEubGVuZ3RoO1xuICAgIGxldCBtYXRyaXggPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBiLmxlbmd0aDsgaSsrKSBtYXRyaXhbaV0gPSBbaV07XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPD0gYS5sZW5ndGg7IGorKykgbWF0cml4WzBdW2pdID0gajtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBiLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAxOyBqIDw9IGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChiW2kgLSAxXSA9PT0gYVtqIC0gMV0pIHtcbiAgICAgICAgICAgICAgICBtYXRyaXhbaV1bal0gPSBtYXRyaXhbaSAtIDFdW2ogLSAxXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWF0cml4W2ldW2pdID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeFtpIC0gMV1baiAtIDFdICsgMSwgLy8gc3Vic3RpdHV0aW9uXG4gICAgICAgICAgICAgICAgICAgIE1hdGgubWluKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4W2ldW2ogLSAxXSArIDEsIC8vIGluc2VydGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4W2kgLSAxXVtqXSArIDEgIC8vIGRlbGV0aW9uXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRyaXhbYi5sZW5ndGhdW2EubGVuZ3RoXTtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlQWxsZWxlRW50cm9weShwbGFudHMpIHtcbiAgICBpZiAocGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgY29uc3QgY291bnRzID0gbmV3IEFycmF5KDI1NikuZmlsbCgwKTtcbiAgICBsZXQgdG90YWwgPSAwO1xuICAgIHBsYW50cy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHAuZ2Vub21lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb3VudHNbcC5nZW5vbWVbaV1dKys7XG4gICAgICAgICAgICB0b3RhbCsrO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRvdGFsID09PSAwKSByZXR1cm4gMDtcbiAgICBsZXQgZW50cm9weSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICAgICAgICBpZiAoY291bnRzW2ldID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcCA9IGNvdW50c1tpXSAvIHRvdGFsO1xuICAgICAgICAgICAgZW50cm9weSAtPSBwICogTWF0aC5sb2cyKHApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbnRyb3B5O1xufVxuXG5jbGFzcyBTaW1EYXRhIHtcblxuICAgIGNvbnN0cnVjdG9yKHNpbXVsYXRpb24pIHtcbiAgICAgICAgdGhpcy5zaW0gPSBzaW11bGF0aW9uO1xuICAgICAgICB0aGlzLmRhdGEgPSB7IFwic3RlcG51bVwiOiBbXSB9O1xuICAgICAgICB0aGlzLmxhc3RTdGVwID0gMDtcbiAgICAgICAgdGhpcy5jb2xsZWN0b3JzID0gW1xuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBvcHVsYXRpb25cIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInVuaXF1ZV9nZW5vdHlwZXNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgc2ltLndvcmxkLnBsYW50cy5mb3JFYWNoKHAgPT4gc2Vlbi5hZGQocC5nZW5vbWUuc2VyaWFsaXplKCkpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2Vlbi5zaXplO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwidG90YWxfY2VsbHNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW0ud29ybGQuY2VsbENvdW50O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX3NpemVcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5jZWxsQ291bnQgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19lbmVyZ2lzZWRcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLmVuZXJnaXNlZENvdW50LCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG90YWwgLyBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z19hY3RpdmVfZ2VuZXNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyAocC5ydWxlcyA/IHAucnVsZXMubGVuZ3RoIDogMCksIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX2FnZVwiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIChzaW0uc3RlcG51bSAtIHAuYmlydGhTdGVwKSwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJ0b3RhbF9zZWVkc1wiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7IHJldHVybiBzaW0uc3RhdHMudG90YWxTZWVkczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZmx5aW5nX3NlZWRzXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHsgcmV0dXJuIHNpbS5zdGF0cy5mbHlpbmdTZWVkczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwibmV3X3BsYW50c1wiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7IHJldHVybiBzaW0uc3RhdHMubmV3UGxhbnRzOyB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJkZWF0aHNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkgeyByZXR1cm4gc2ltLnN0YXRzLmRlYXRoczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXR0YWNrc1wiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7IHJldHVybiBzaW0uc3RhdHMuYXR0YWNrczsgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX2RlYXRoX3Byb2JcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWwgPSBzaW0ud29ybGQucGxhbnRzLnJlZHVjZSgoc3VtLCBwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdW0gKyBwLmdldERlYXRoUHJvYmFiaWxpdHkoXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLmRlYXRoX2ZhY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLmVuZXJneV9leHAsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW0ucGFyYW1zLmxlYW5vdmVyX2ZhY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbS5wYXJhbXMuc2ltX21vZGVcbiAgICAgICAgICAgICAgICAgICAgKS5wcm9iO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5wbGFudHMubGVuZ3RoO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiYXZnX251dHJpZW50c1wiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpbS53b3JsZC5wbGFudHMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbCA9IHNpbS53b3JsZC5wbGFudHMucmVkdWNlKChzdW0sIHApID0+IHN1bSArIHAubnV0cmllbnRDb3VudCwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvdGFsIC8gc2ltLndvcmxkLnBsYW50cy5sZW5ndGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJzb2lsX251dHJpZW50c1wiLCBBc0lzLCBmdW5jdGlvbiAoc2ltKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzaW0ud29ybGQuc29pbE51dHJpZW50cyB8fCBzaW0ud29ybGQuc29pbE51dHJpZW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gc2ltLndvcmxkLnNvaWxOdXRyaWVudHMucmVkdWNlKChzdW0sIG4pID0+IHN1bSArIG4sIDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0b3RhbCAvIHNpbS53b3JsZC5zb2lsTnV0cmllbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImF2Z190cmFpdHNcIiwgQXNJcywgZnVuY3Rpb24gKHNpbSkge1xuICAgICAgICAgICAgICAgIGlmIChzaW0ud29ybGQucGxhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgbGVhbjogMSwgYXR0YWNrOiAxLCBlZmY6IDEsIGRlYXRoOiAxIH07XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWxzID0gc2ltLndvcmxkLnBsYW50cy5yZWR1Y2UoKGFjYywgcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhY2MubGVhbiArPSBwLnRyYWl0cy5sZWFub3ZlcjtcbiAgICAgICAgICAgICAgICAgICAgYWNjLmF0dGFjayArPSBwLnRyYWl0cy5hdHRhY2s7XG4gICAgICAgICAgICAgICAgICAgIGFjYy5lZmYgKz0gcC50cmFpdHMuZWZmaWNpZW5jeTtcbiAgICAgICAgICAgICAgICAgICAgYWNjLmRlYXRoICs9IHAudHJhaXRzLmRlYXRoO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sIHsgbGVhbjogMCwgYXR0YWNrOiAwLCBlZmY6IDAsIGRlYXRoOiAwIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG4gPSBzaW0ud29ybGQucGxhbnRzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBsZWFuOiB0b3RhbHMubGVhbiAvIG4sXG4gICAgICAgICAgICAgICAgICAgIGF0dGFjazogdG90YWxzLmF0dGFjayAvIG4sXG4gICAgICAgICAgICAgICAgICAgIGVmZjogdG90YWxzLmVmZiAvIG4sXG4gICAgICAgICAgICAgICAgICAgIGRlYXRoOiB0b3RhbHMuZGVhdGggLyBuXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcInBsYW50X3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5jZWxscy5sZW5ndGgpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2Vub21lX3NpemVfXCIsIFN1bW1hcnksIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5nZW5vbWUubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcIm11dF9leHBfXCIsIFN1bW1hcnksIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4gcC5nZW5vbWUubXV0X2V4cCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBDb2xsZWN0b3IoXCJwbGFudF9oZWlnaHRfXCIsIFN1bW1hcnksIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoc2ltLndvcmxkLnBsYW50cy5sZW5ndGggPT09IDApIHJldHVybiBbMF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbS53b3JsZC5wbGFudHMubWFwKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWF4SCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcC5jZWxscy5sZW5ndGg7IGkrKykgaWYgKHAuY2VsbHNbaV0ueSA+IG1heEgpIG1heEggPSBwLmNlbGxzW2ldLnk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXhIO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgQ29sbGVjdG9yKFwiZ2VuZXRpY19kaXN0YW5jZV9tZWFuXCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwbGFudHMgPSBzaW0ud29ybGQucGxhbnRzO1xuICAgICAgICAgICAgICAgIGlmIChwbGFudHMubGVuZ3RoIDwgMikgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgbGV0IHN1bURpc3QgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBzYW1wbGVTaXplID0gTWF0aC5taW4oMzAsIHBsYW50cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGxldCBwYWlycyA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzYW1wbGVTaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcDEgPSBwbGFudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcGxhbnRzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwMiA9IHBsYW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwbGFudHMubGVuZ3RoKV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwMSAhPT0gcDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bURpc3QgKz0gbGV2ZW5zaHRlaW4ocDEuZ2Vub21lLCBwMi5nZW5vbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFpcnMrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFpcnMgPiAwID8gc3VtRGlzdCAvIHBhaXJzIDogMDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IENvbGxlY3RvcihcImFsbGVsZV9lbnRyb3B5XCIsIEFzSXMsIGZ1bmN0aW9uIChzaW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsY3VsYXRlQWxsZWxlRW50cm9weShzaW0ud29ybGQucGxhbnRzKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29sbGVjdCBkYXRhIGZvciB0aGUgY3VycmVudCBzdGVwXG4gICAgICovXG4gICAgcmVjb3JkU3RlcCgpIHtcbiAgICAgICAgY29uc3QgZGVsdGEgPSB0aGlzLnNpbS5zdGVwbnVtIC0gdGhpcy5sYXN0U3RlcDtcbiAgICAgICAgdGhpcy5sYXN0U3RlcCA9IHRoaXMuc2ltLnN0ZXBudW07XG5cbiAgICAgICAgdmFyIHN0ZXBEYXRhID0ge307XG4gICAgICAgIHRoaXMuY29sbGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gYy5jb2xsZWN0KHRoaXMuc2ltKTtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oc3RlcERhdGEsIHZhbHVlcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vIE5vcm1hbGl6ZSByYXRlLWJhc2VkIG1ldHJpY3MgYnkgdGhlIG51bWJlciBvZiBzdGVwcyBzaW5jZSB0aGUgbGFzdCByZWNvcmRcbiAgICAgICAgaWYgKGRlbHRhID4gMCkge1xuICAgICAgICAgICAgY29uc3QgcmF0ZUtleXMgPSBbXCJuZXdfcGxhbnRzXCIsIFwiZGVhdGhzXCIsIFwiYXR0YWNrc1wiLCBcInRvdGFsX3NlZWRzXCIsIFwiZmx5aW5nX3NlZWRzXCJdO1xuICAgICAgICAgICAgcmF0ZUtleXMuZm9yRWFjaChrID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3RlcERhdGFba10gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzdGVwRGF0YVtrXSAvPSBkZWx0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlc2V0IGluY3JlbWVudGFsIHN0YXRzIGZvciB0aGUgbmV4dCBpbnRlcnZhbFxuICAgICAgICB0aGlzLnNpbS5zdGF0cy5uZXdQbGFudHMgPSAwO1xuICAgICAgICB0aGlzLnNpbS5zdGF0cy5kZWF0aHMgPSAwO1xuICAgICAgICB0aGlzLnNpbS5zdGF0cy5hdHRhY2tzID0gMDtcbiAgICAgICAgdGhpcy5zaW0uc3RhdHMudG90YWxTZWVkcyA9IDA7XG4gICAgICAgIHRoaXMuc2ltLnN0YXRzLmZseWluZ1NlZWRzID0gMDtcblxuICAgICAgICB0aGlzLmRhdGFbXCJzdGVwbnVtXCJdLnB1c2godGhpcy5zaW0uc3RlcG51bSk7XG4gICAgICAgIGlmICh0aGlzLmRhdGFbXCJzdGVwbnVtXCJdLmxlbmd0aCA+IFNpbURhdGEuTUFYX0RBVEFfUE9JTlRTKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGFbXCJzdGVwbnVtXCJdLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmtleXMoc3RlcERhdGEpLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgIGlmICghKGsgaW4gdGhpcy5kYXRhKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVtrXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kYXRhW2tdLnB1c2goc3RlcERhdGFba10pO1xuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVtrXS5sZW5ndGggPiBTaW1EYXRhLk1BWF9EQVRBX1BPSU5UUykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVtrXS5zaGlmdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG59XG5TaW1EYXRhLk1BWF9EQVRBX1BPSU5UUyA9IDIwMDA7XG5cbmNsYXNzIENvbGxlY3RvciB7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZWNscywgY29sbGVjdEZ1bmMpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy50eXBlID0gbmV3IHR5cGVjbHMobmFtZSk7XG4gICAgICAgIHRoaXMuZnVuYyA9IGNvbGxlY3RGdW5jO1xuICAgIH1cblxuICAgIGNvbGxlY3Qoc2ltKSB7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5mdW5jKHNpbSk7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUudHJhbnNmb3JtKGRhdGEpO1xuICAgIH1cbn1cblxuY2xhc3MgQ29sbGVjdG9yVHlwZSB7XG4gICAgY29uc3RydWN0b3IobmFtZSkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmltcGxlbWVudGVkIG1ldGhvZFwiKTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm0oZGF0YSkge1xuICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy50cmFuc2Zvcm1EYXRhKGRhdGEpO1xuICAgICAgICB2YXIgdHJhbnNmb3JtZWRfZGF0YSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybWVkX2RhdGFbdGhpcy5uYW1lICsga10gPSB2YWx1ZXNba107XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtZWRfZGF0YTtcbiAgICB9XG59XG5cbmNsYXNzIEFzSXMgZXh0ZW5kcyBDb2xsZWN0b3JUeXBlIHtcblxuICAgIHRyYW5zZm9ybURhdGEoZGF0YSkge1xuICAgICAgICByZXR1cm4geyBcIlwiOiBkYXRhIH07XG4gICAgfVxufVxuXG5jbGFzcyBTdW1tYXJ5IGV4dGVuZHMgQ29sbGVjdG9yVHlwZSB7XG5cbiAgICB0cmFuc2Zvcm1EYXRhKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHsgXCJtaW5cIjogTWF0aC5taW4oZGF0YSksIFwibWVhblwiOiBzdGF0cy5tZWFuKGRhdGEpLCBcIm1heFwiOiBNYXRoLm1heChkYXRhKSB9O1xuICAgIH1cbn1cbmV4cG9ydCB7IFNpbURhdGEgfTsiLCJpbXBvcnQge3NlZWRSYW5kb20sIHJhbmRvbVByb2J9IGZyb20gXCIuL3JhbmRvbS5qc1wiO1xuaW1wb3J0IHtXb3JsZH0gZnJvbSBcIi4vd29ybGQuanNcIjtcbmltcG9ydCB7Qnl0ZUFycmF5LCBQcm9tb3RvckludGVycHJldGVyLCBNdXRhdG9yfSBmcm9tIFwiLi9nZW5vbWUuanNcIjtcblxuY2xhc3MgU2ltdWxhdGlvblBhcmFtc3tcbiAgICBjb25zdHJ1Y3RvcihwYXJhbXM9e30pe1xuICAgICAgICB0aGlzLnJhbmRvbV9zZWVkID0gMTtcbiAgICAgICAgdGhpcy5yZWNvcmRfaW50ZXJ2YWwgPSAxMDtcbiAgICAgICAgdGhpcy5zdGVwc19wZXJfZnJhbWUgPSAxO1xuICAgICAgICB0aGlzLmRpc3R1cmJhbmNlX2ludGVydmFsID0gMDtcbiAgICAgICAgdGhpcy5kaXN0dXJiYW5jZV9zdHJlbmd0aCA9IDAuMTtcblxuICAgICAgICB0aGlzLndvcmxkX3dpZHRoID0gMjUwO1xuICAgICAgICB0aGlzLndvcmxkX2hlaWdodCA9IDQwO1xuICAgICAgICB0aGlzLmluaXRpYWxfcG9wdWxhdGlvbiA9IDUwO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbmVyZ3lfcHJvYiA9IDAuNTtcblxuICAgICAgICAvLyBkZWF0aCBwYXJhbXNcbiAgICAgICAgdGhpcy5kZWF0aF9mYWN0b3IgPSAwLjI7XG4gICAgICAgIHRoaXMubmF0dXJhbF9leHAgPSAwO1xuICAgICAgICB0aGlzLmVuZXJneV9leHAgPSAtMi41O1xuICAgICAgICB0aGlzLmxlYW5vdmVyX2ZhY3RvciA9IDAuMjtcblxuICAgICAgICAvLyBtdXRhdGlvbnNcbiAgICAgICAgdGhpcy5tdXRfcmVwbGFjZV9tb2RlID0gXCJieXRld2lzZVwiO1xuICAgICAgICB0aGlzLm11dF9yZXBsYWNlID0gMC4wMDI7XG4gICAgICAgIHRoaXMubXV0X2luc2VydCA9IDAuMDAwNDtcbiAgICAgICAgdGhpcy5tdXRfZGVsZXRlID0gMC4wMDA0O1xuICAgICAgICB0aGlzLm11dF9mYWN0b3IgPSAxLjU7XG4gICAgICAgIHRoaXMuaW5pdGlhbF9tdXRfZXhwID0gMDtcblxuICAgICAgICB0aGlzLmdlbm9tZV9pbnRlcnByZXRlciA9IFwicHJvbW90b3JcIjtcbiAgICAgICAgdGhpcy5pbml0aWFsX2dlbm9tZV9sZW5ndGggPSA0MDA7XG5cbiAgICAgICAgLy8gTW9kZSBzZWxlY3Rpb25cbiAgICAgICAgdGhpcy5zaW1fbW9kZSA9IFwibmljaGVcIjsgLy8gXCJjbGFzc2ljXCIgb3IgXCJuaWNoZVwiXG5cbiAgICAgICAgLy8gTmljaGUgbW9kZTogTnV0cmllbnRzXG4gICAgICAgIHRoaXMubnV0cmllbnRfbWF4ID0gMTAwLjA7XG4gICAgICAgIHRoaXMubnV0cmllbnRfcmVwbGVuaXNoX3JhdGUgPSAxLjA7XG4gICAgICAgIHRoaXMubnV0cmllbnRfZXh0cmFjdF9yYXRlID0gNS4wO1xuICAgICAgICB0aGlzLm51dHJpZW50X21haW50ZW5hbmNlX2Nvc3QgPSAwLjAyOyAvLyBwZXIgY2VsbCBwZXIgc3RlcFxuICAgICAgICB0aGlzLm51dHJpZW50X2RpdmlkZV9jb3N0ID0gMi4wO1xuICAgICAgICBcbiAgICAgICAgLy8gRHluYW1pYyBTb2lsIFBhcmFtc1xuICAgICAgICB0aGlzLm51dHJpZW50X3BhdGNoaW5lc3MgPSAwLjU7ICAgICAgICAgLy8gMCAodW5pZm9ybSkgdG8gMSAoaGlnaCB2YXJpYW5jZSlcbiAgICAgICAgdGhpcy5udXRyaWVudF9kaWZmdXNpb25fcmF0ZSA9IDAuMTsgICAgLy8gMCB0byAxXG4gICAgICAgIHRoaXMubnV0cmllbnRfcmVjeWNsaW5nX2ZhY3RvciA9IDAuNTsgIC8vIDAgdG8gMVxuICAgICAgICB0aGlzLm51dHJpZW50X3NlYXNvbmFsaXR5X2FtcCA9IDAuNTsgICAvLyAwIChvZmYpIHRvIDFcbiAgICAgICAgdGhpcy5udXRyaWVudF9zZWFzb25hbGl0eV9mcmVxID0gMC4wMDE7XG5cbiAgICAgICAgLy8gZGl2aWRlLCBmbHlpbmdzZWVkLCBsb2NhbHNlZWQsIG11dCssIG11dC0sIHN0YXRlYml0XG4gICAgICAgIHRoaXMuYWN0aW9uX21hcCA9IFsyMDAsIDIwLCAwLCAxOCwgMTgsIDBdO1xuXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgcGFyYW1zKTtcbiAgICB9XG59XG5cbmNsYXNzIFNpbXVsYXRpb24ge1xuICAgIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcblxuICAgICAgICAvLyBTZWVkIGFsbCBmdXR1cmUgY2FsbHMgdG8gcmFuZG9tXG4gICAgICAgIC8vIHRoaXMgbWFrZXMgb3V0IHRlc3RzIHJlcHJvZHVjaWJsZSBnaXZlbiB0aGUgc2FtZSBzZWVkIGlzIHVzZWRcbiAgICAgICAgLy8gaW4gZnV0dXJlIGlucHV0IHBhcmFtZXRlcnNcbiAgICAgICAgc2VlZFJhbmRvbSh0aGlzLnBhcmFtcy5yYW5kb21fc2VlZCk7XG5cbiAgICAgICAgdGhpcy53b3JsZCA9IG5ldyBXb3JsZCh0aGlzLnBhcmFtcy53b3JsZF93aWR0aCwgdGhpcy5wYXJhbXMud29ybGRfaGVpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgbnV0cmllbnRzIGluIE5pY2hlIG1vZGVcbiAgICAgICAgaWYgKHRoaXMucGFyYW1zLnNpbV9tb2RlID09PSBcIm5pY2hlXCIpIHtcbiAgICAgICAgICAgIHRoaXMud29ybGQuaW5pdE51dHJpZW50cyh0aGlzLnBhcmFtcy5udXRyaWVudF9tYXgsIHRoaXMucGFyYW1zLm51dHJpZW50X3BhdGNoaW5lc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nZW5vbWVJbnRlcnByZXRlciA9IHRoaXMuZ2V0SW50ZXJwcmV0ZXIoKTtcbiAgICAgICAgdGhpcy5tdXRfdW5pdHMgPSAxO1xuICAgICAgICB0aGlzLnN0ZXBudW0gPSAwO1xuICAgICAgICB0aGlzLnN0YXRzID0geyBcbiAgICAgICAgICAgIGF0dGFja3M6IDAsIFxuICAgICAgICAgICAgZGVhdGhzOiAwLCBcbiAgICAgICAgICAgIHRvdGFsU2VlZHM6IDAsIFxuICAgICAgICAgICAgZmx5aW5nU2VlZHM6IDAsIFxuICAgICAgICAgICAgbmV3UGxhbnRzOiAwIFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMud29ybGQub25QbGFudEJpcnRoID0gKCkgPT4geyB0aGlzLnN0YXRzLm5ld1BsYW50cysrOyB9O1xuICAgICAgICB0aGlzLndvcmxkLm9uUGxhbnREZWF0aCA9ICgpID0+IHsgdGhpcy5zdGF0cy5kZWF0aHMrKzsgfTtcbiAgICAgICAgdGhpcy53b3JsZC5vbkF0dGFjayA9ICgpID0+IHsgdGhpcy5zdGF0cy5hdHRhY2tzKys7IH07XG4gICAgfVxuXG4gICAgZ2V0SW50ZXJwcmV0ZXIoKXtcbiAgICAgICAgc3dpdGNoICh0aGlzLnBhcmFtcy5nZW5vbWVfaW50ZXJwcmV0ZXIpe1xuICAgICAgICBjYXNlIFwicHJvbW90b3JcIjpcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbW90b3JJbnRlcnByZXRlcih0aGlzLnBhcmFtcy5hY3Rpb25fbWFwKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBpbnRlcnByZXRlciAke3RoaXMucGFyYW1zLmdlbm9tZV9pbnRlcnByZXRlcn1gKTtcbiAgICAgICAgfSAgXG4gICAgfVxuXG4gICAgaW5pdF9wb3B1bGF0aW9uKCl7XG4gICAgICAgIC8vIHJhbmRvbWx5IGNob29zZSBzcG90cyB0byBzZWVkIHRoZSB3b3JsZCB3aXRoXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLnBhcmFtcy5pbml0aWFsX3BvcHVsYXRpb247IGkrKyl7XG4gICAgICAgICAgICB0aGlzLm5ld1NlZWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpc2UgdGhlIHBvcHVsYXRpb24gZnJvbSBhIGxpc3Qgb2Ygc2VyaWFsaXplZCBnZW5vbWUgc3RyaW5ncyxcbiAgICAgKiBkcmF3aW5nIHdpdGggcmVwbGFjZW1lbnQgdXAgdG8gaW5pdGlhbF9wb3B1bGF0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IHNlcmlhbGl6ZWRHZW5vbWVzXG4gICAgICovXG4gICAgaW5pdF9wb3B1bGF0aW9uX2Zyb21fZ2Vub21lcyhzZXJpYWxpemVkR2Vub21lcyl7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLnBhcmFtcy5pbml0aWFsX3BvcHVsYXRpb247IGkrKyl7XG4gICAgICAgICAgICBjb25zdCBzdHIgPSBzZXJpYWxpemVkR2Vub21lc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzZXJpYWxpemVkR2Vub21lcy5sZW5ndGgpXTtcbiAgICAgICAgICAgIGNvbnN0IGdlbm9tZSA9IEJ5dGVBcnJheS5kZXNlcmlhbGl6ZShzdHIpO1xuICAgICAgICAgICAgdGhpcy53b3JsZC5zZWVkKGdlbm9tZSwgbnVsbCwgdGhpcy5zdGVwbnVtKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5ld1NlZWQoKXtcbiAgICAgICAgLy8gY3JlYXRlIGEgcmFuZG9tIGdlbm9tZVxuICAgICAgICB2YXIgZ2Vub21lID0gQnl0ZUFycmF5LnJhbmRvbSh0aGlzLnBhcmFtcy5pbml0aWFsX2dlbm9tZV9sZW5ndGgpO1xuICAgICAgICB0aGlzLndvcmxkLnNlZWQoZ2Vub21lLCBudWxsLCB0aGlzLnN0ZXBudW0pO1xuICAgIH1cblxuICAgIHN0ZXAoKXtcbiAgICAgICAgdGhpcy5zdGVwbnVtKys7XG4gICAgICAgIGlmICh0aGlzLnBhcmFtcy5zaW1fbW9kZSA9PT0gXCJuaWNoZVwiKSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkLnJlcGxlbmlzaE51dHJpZW50cyhcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5udXRyaWVudF9yZXBsZW5pc2hfcmF0ZSwgXG4gICAgICAgICAgICAgICAgdGhpcy5zdGVwbnVtLCBcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5udXRyaWVudF9zZWFzb25hbGl0eV9hbXAsIFxuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1zLm51dHJpZW50X3NlYXNvbmFsaXR5X2ZyZXFcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLndvcmxkLmRpZmZ1c2VOdXRyaWVudHModGhpcy5wYXJhbXMubnV0cmllbnRfZGlmZnVzaW9uX3JhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2ltdWxhdGVEZWF0aCgpO1xuICAgICAgICB0aGlzLnNpbXVsYXRlTGlnaHQoKTtcbiAgICAgICAgdGhpcy5zaW11bGF0ZUFjdGlvbnMoKTtcbiAgICAgICAgdGhpcy5tdXRhdGUoKTtcbiAgICB9XG5cbiAgICBzaW11bGF0ZUFjdGlvbnMoKXtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndvcmxkLnBsYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGxhbnQgPSB0aGlzLndvcmxkLnBsYW50c1tpXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gTmljaGUgbWV0YWJvbGlzbVxuICAgICAgICAgICAgcGxhbnQubWV0YWJvbGlzbSh0aGlzLnBhcmFtcyk7XG5cbiAgICAgICAgICAgIGlmICghcGxhbnQucnVsZXMpIHtcbiAgICAgICAgICAgICAgICBwbGFudC5ydWxlcyA9IHRoaXMuZ2Vub21lSW50ZXJwcmV0ZXIuaW50ZXJwcmV0KHBsYW50Lmdlbm9tZSwgcGxhbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcnVsZXMgPSBwbGFudC5ydWxlcztcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGxhbnQuY2VsbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxBY3Rpb24ocGxhbnQuY2VsbHNbal0sIHJ1bGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNlbGxBY3Rpb24oY2VsbCwgcnVsZXMpe1xuICAgICAgICB2YXIgc3RhdGUgPSBjZWxsLnBsYW50LmdldFN0YXRlKGNlbGwpO1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgcnVsZXMuZm9yRWFjaChmdW5jdGlvbihydWxlKXtcbiAgICAgICAgICAgIC8vIGV4ZWN1dGUgb25lIGFjdGlvbiB1c2luZyB0aGUgZmlyc3QgbWF0Y2hpbmcgcnVsZVxuICAgICAgICAgICAgaWYgKHJ1bGUubWF0Y2hlcyhzdGF0ZSkpe1xuICAgICAgICAgICAgICAgIC8vIFRyYWNrIHNlZWRzXG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUuYWN0aW9uLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiRmx5aW5nU2VlZFwiKSBzZWxmLnN0YXRzLmZseWluZ1NlZWRzKys7XG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUuYWN0aW9uLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiRmx5aW5nU2VlZFwiIHx8IHJ1bGUuYWN0aW9uLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiTG9jYWxTZWVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGF0cy50b3RhbFNlZWRzKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJ1bGUuYWN0aW9uLmV4ZWN1dGUoY2VsbCwgc2VsZi5zdGVwbnVtLCBzZWxmLnBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBjZWxsLnVwZGF0ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgbXV0YXRlKCl7XG4gICAgICAgIHZhciBtdXRhdG9yID0gbmV3IE11dGF0b3IodGhpcy5wYXJhbXMubXV0X2ZhY3RvciwgdGhpcy5wYXJhbXMubXV0X3JlcGxhY2UsIFxuICAgICAgICAgICAgdGhpcy5wYXJhbXMubXV0X2luc2VydCwgdGhpcy5wYXJhbXMubXV0X2RlbGV0ZSwgXG4gICAgICAgICAgICAwLCB0aGlzLnBhcmFtcy5tdXRfcmVwbGFjZV9tb2RlLCB0aGlzLm11dF91bml0cyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53b3JsZC5wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gdGhpcy53b3JsZC5wbGFudHNbaV07XG4gICAgICAgICAgICBpZiAobXV0YXRvci5tdXRhdGUocGxhbnQuZ2Vub21lKSkge1xuICAgICAgICAgICAgICAgIHBsYW50LnJ1bGVzID0gbnVsbDsgLy8gSW52YWxpZGF0ZSBjYWNoZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIGVhY2ggcGxhbnQncyBjdXJyZW50IGRlYXRoIHByb2JhYmlsaXR5IHRvIHNpbXVsYXRlXG4gICAgICogd2hldGhlciBlYWNoIHBsYW50IGRpZXMgb24gdGhpcyBzdGVwXG4gICAgICovXG4gICAgc2ltdWxhdGVEZWF0aCgpe1xuICAgICAgICBjb25zdCBkZWFkX3BsYW50cyA9IFtdO1xuICAgICAgICBjb25zdCBwbGFudHMgPSB0aGlzLndvcmxkLnBsYW50cztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBsYW50ID0gcGxhbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgZGVhdGhQcm9iID0gcGxhbnQuZ2V0RGVhdGhQcm9iYWJpbGl0eShcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5kZWF0aF9mYWN0b3IsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuZW5lcmd5X2V4cCxcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtcy5sZWFub3Zlcl9mYWN0b3IsXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbXMuc2ltX21vZGVcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAocmFuZG9tUHJvYihkZWF0aFByb2IucHJvYikpe1xuICAgICAgICAgICAgICAgIGRlYWRfcGxhbnRzLnB1c2gocGxhbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVhZF9wbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMud29ybGQua2lsbFBsYW50KGRlYWRfcGxhbnRzW2ldLCB0aGlzLnBhcmFtcy5zaW1fbW9kZSA9PT0gXCJuaWNoZVwiID8gdGhpcy5wYXJhbXMubnV0cmllbnRfcmVjeWNsaW5nX2ZhY3RvciA6IDApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGUgbGlnaHQuIFN1bmxpZ2h0IHRyYXZlcnNlcyBmcm9tIHRoZSBjZWlsaW5nIG9mIHRoZSB3b3JsZFxuICAgICAqIGRvd253YXJkcyB2ZXJ0aWNhbGx5LiBJdCBpcyBjYXVnaHQgYnkgYSBwbGFudCBjZWxsIHdpdGggYSBwcm9iYWJpbGl0eVxuICAgICAqIHdoaWNoIGNhdXNlcyB0aGF0IGNlbGwgdG8gYmUgZW5lcmdpc2VkLlxuICAgICAqL1xuICAgIHNpbXVsYXRlTGlnaHQoKXtcbiAgICAgICAgY29uc3QgY29sVG9wcyA9IG5ldyBJbnQxNkFycmF5KHRoaXMud29ybGQud2lkdGgpLmZpbGwoLTEpO1xuICAgICAgICBjb25zdCBwbGFudHMgPSB0aGlzLndvcmxkLnBsYW50cztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNlbGxzID0gcGxhbnRzW2ldLmNlbGxzO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjZWxscy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBjZWxsc1tqXTtcbiAgICAgICAgICAgICAgICBpZiAoY2VsbC55ID4gY29sVG9wc1tjZWxsLnhdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbFRvcHNbY2VsbC54XSA9IGNlbGwueTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IobGV0IHg9MDsgeDx0aGlzLndvcmxkLndpZHRoOyB4Kyspe1xuICAgICAgICAgICAgY29uc3QgdG9wWSA9IGNvbFRvcHNbeF07XG4gICAgICAgICAgICBpZiAodG9wWSA9PT0gLTEpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBmb3IobGV0IHk9dG9wWTsgeT49MDsgeS0tKXtcbiAgICAgICAgICAgICAgICBjb25zdCBjZWxsID0gdGhpcy53b3JsZC5jZWxsc1t4XVt5XTtcbiAgICAgICAgICAgICAgICBpZihjZWxsICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocmFuZG9tUHJvYih0aGlzLnBhcmFtcy5lbmVyZ3lfcHJvYikpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5lbmVyZ2lzZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB7U2ltdWxhdGlvbiwgU2ltdWxhdGlvblBhcmFtc307IiwiaW1wb3J0IHtTaW11bGF0aW9uLCBTaW11bGF0aW9uUGFyYW1zfSBmcm9tIFwiLi9zaW11bGF0aW9uLmpzXCI7XG5pbXBvcnQge1NpbURhdGF9IGZyb20gXCIuL3NpbWRhdGEuanNcIjtcblxubGV0IHNpbXVsYXRpb24gPSBudWxsO1xubGV0IGRhdGEgPSBudWxsO1xubGV0IHJ1bm5pbmcgPSBmYWxzZTtcbmxldCBjZWxsU2l6ZSA9IDI7XG5jb25zdCBUQVJHRVRfRlBTID0gNjA7XG5jb25zdCBGUkFNRV9JTlRFUlZBTF9NUyA9IDEwMDAgLyBUQVJHRVRfRlBTO1xubGV0IGxhc3RGcmFtZVRpbWUgPSAwO1xubGV0IGxhc3RTdGF0c1RpbWUgPSAwO1xuY29uc3QgU1RBVFNfSU5URVJWQUxfTVMgPSAxMDA7XG5cbnNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBjb25zdCBtc2cgPSBldmVudC5kYXRhO1xuICAgIHN3aXRjaCAobXNnLnR5cGUpIHtcbiAgICBjYXNlIFwiaW5pdFwiOlxuICAgICAgICBpbml0U2ltKG1zZy5wYXJhbXMsIG1zZy5nZW5vbWVzIHx8IG51bGwpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RhcnRcIjpcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGxvb3AoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0b3BcIjpcbiAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RlcFwiOlxuICAgICAgICBkb1N0ZXAoKTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIHB1c2hTdGF0cygpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZ2V0Q2VsbFwiOlxuICAgICAgICBzZW5kQ2VsbEluZm8obXNnLngsIG1zZy55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImRpc3R1cmJcIjpcbiAgICAgICAgYXBwbHlEaXN0dXJiYW5jZShtc2cuc3RyZW5ndGgpO1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImtpbGxDZWxsXCI6XG4gICAgICAgIGtpbGxDZWxsQXQobXNnLngsIG1zZy55KTtcbiAgICAgICAgcHVzaEZyYW1lKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJ1cGRhdGVEaXNwbGF5UGFyYW1zXCI6XG4gICAgICAgIGlmIChzaW11bGF0aW9uICYmIHNpbXVsYXRpb24ucGFyYW1zKSB7XG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5zdGVwc19wZXJfZnJhbWUgPSBtc2cuc3RlcHNfcGVyX2ZyYW1lO1xuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMucmVjb3JkX2ludGVydmFsID0gbXNnLnJlY29yZF9pbnRlcnZhbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwiZXhwb3J0XCI6XG4gICAgICAgIGV4cG9ydEdlbm9tZXMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gaW5pdFNpbShwYXJhbXMsIGltcG9ydGVkR2Vub21lcz1udWxsKSB7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGNvbnN0IHNpbV9wYXJhbXMgPSBuZXcgU2ltdWxhdGlvblBhcmFtcyhwYXJhbXMpO1xuICAgIGNlbGxTaXplID0gcGFyYW1zLmNlbGxTaXplIHx8IDg7XG4gICAgc2ltdWxhdGlvbiA9IG5ldyBTaW11bGF0aW9uKHNpbV9wYXJhbXMpO1xuICAgIGRhdGEgPSBuZXcgU2ltRGF0YShzaW11bGF0aW9uKTtcbiAgICBpZiAoaW1wb3J0ZWRHZW5vbWVzICYmIGltcG9ydGVkR2Vub21lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNpbXVsYXRpb24uaW5pdF9wb3B1bGF0aW9uX2Zyb21fZ2Vub21lcyhpbXBvcnRlZEdlbm9tZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbXVsYXRpb24uaW5pdF9wb3B1bGF0aW9uKCk7XG4gICAgfVxuICAgIHB1c2hGcmFtZSgpO1xuICAgIHB1c2hTdGF0cygpO1xufVxuXG5mdW5jdGlvbiBsb29wKCkge1xuICAgIGlmICghcnVubmluZykgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3BmID0gc2ltdWxhdGlvbi5wYXJhbXMuc3RlcHNfcGVyX2ZyYW1lO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3BmOyBpKyspIHtcbiAgICAgICAgZG9TdGVwKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdEZyYW1lVGltZSA+PSBGUkFNRV9JTlRFUlZBTF9NUykge1xuICAgICAgICBwdXNoRnJhbWUoKTtcbiAgICAgICAgbGFzdEZyYW1lVGltZSA9IG5vdztcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KGxvb3AsIDApO1xufVxuXG5mdW5jdGlvbiBkb1N0ZXAoKSB7XG4gICAgc2ltdWxhdGlvbi5zdGVwKCk7XG5cbiAgICAvLyBQZXJpb2RpYyBkaXN0dXJiYW5jZVxuICAgIGNvbnN0IGRpID0gc2ltdWxhdGlvbi5wYXJhbXMuZGlzdHVyYmFuY2VfaW50ZXJ2YWw7XG4gICAgaWYgKGRpID4gMCAmJiBzaW11bGF0aW9uLnN0ZXBudW0gJSBkaSA9PT0gMCkge1xuICAgICAgICBhcHBseURpc3R1cmJhbmNlKHNpbXVsYXRpb24ucGFyYW1zLmRpc3R1cmJhbmNlX3N0cmVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoc2ltdWxhdGlvbi5zdGVwbnVtICUgc2ltdWxhdGlvbi5wYXJhbXMucmVjb3JkX2ludGVydmFsID09PSAwIHx8IHNpbXVsYXRpb24uc3RlcG51bSA9PT0gMSkge1xuICAgICAgICBkYXRhLnJlY29yZFN0ZXAoKTtcbiAgICAgICAgcHVzaFN0YXRzKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwdXNoU3RhdHMoKSB7XG4gICAgaWYgKCFkYXRhKSByZXR1cm47XG4gICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwic3RhdHNcIixcbiAgICAgICAgZGF0YTogZGF0YS5kYXRhLFxuICAgICAgICBzdGVwbnVtOiBzaW11bGF0aW9uLnN0ZXBudW1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlEaXN0dXJiYW5jZShzdHJlbmd0aCkge1xuICAgIGNvbnN0IHdvcmxkID0gc2ltdWxhdGlvbi53b3JsZDtcbiAgICBjb25zdCBwbGFudHMgPSB3b3JsZC5wbGFudHM7XG4gICAgaWYgKHBsYW50cy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBudW1Ub0tpbGwgPSBNYXRoLm1heCgxLCBNYXRoLmZsb29yKHN0cmVuZ3RoICogcGxhbnRzLmxlbmd0aCkpO1xuICAgIC8vIFNodWZmbGUgYSBzYW1wbGUgYW5kIGtpbGxcbiAgICBjb25zdCBzaHVmZmxlZCA9IHBsYW50cy5zbGljZSgpLnNvcnQoKCkgPT4gTWF0aC5yYW5kb20oKSAtIDAuNSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1Ub0tpbGwgJiYgaSA8IHNodWZmbGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIENoZWNrIHBsYW50IHN0aWxsIGFsaXZlIChub3Qga2lsbGVkIGJ5IHByZXZpb3VzIGl0ZXJhdGlvbilcbiAgICAgICAgaWYgKHdvcmxkLnBsYW50cy5pbmNsdWRlcyhzaHVmZmxlZFtpXSkpIHtcbiAgICAgICAgICAgIHdvcmxkLmtpbGxQbGFudChzaHVmZmxlZFtpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGtpbGxDZWxsQXQoeCwgeSkge1xuICAgIGNvbnN0IGNlbGwgPSBzaW11bGF0aW9uLndvcmxkLmdldENlbGwoeCwgeSk7XG4gICAgaWYgKGNlbGwgJiYgY2VsbC5wbGFudCkge1xuICAgICAgICBzaW11bGF0aW9uLndvcmxkLmtpbGxQbGFudChjZWxsLnBsYW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGV4cG9ydEdlbm9tZXMoKSB7XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICBzaW11bGF0aW9uLndvcmxkLnBsYW50cy5mb3JFYWNoKHBsYW50ID0+IHtcbiAgICAgICAgc2Vlbi5hZGQocGxhbnQuZ2Vub21lLnNlcmlhbGl6ZSgpKTtcbiAgICB9KTtcbiAgICBjb25zdCBnZW5vbWVzID0gQXJyYXkuZnJvbShzZWVuKTtcbiAgICBjb25zdCBleHBvcnRCdW5kbGUgPSB7XG4gICAgICAgIGFjdGlvbl9tYXA6IHNpbXVsYXRpb24ucGFyYW1zLmFjdGlvbl9tYXAsXG4gICAgICAgIGdlbm9tZV9pbnRlcnByZXRlcjogc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyLFxuICAgICAgICBnZW5vbWVzXG4gICAgfTtcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJleHBvcnRlZEdlbm9tZXNcIiwgYnVuZGxlOiBleHBvcnRCdW5kbGUgfSk7XG59XG5cbmZ1bmN0aW9uIHB1c2hGcmFtZSgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBzaW11bGF0aW9uLndvcmxkLmdldFBpeGVsQnVmZmVyKGNlbGxTaXplKTtcbiAgICAvLyBUcmFuc2ZlciBvd25lcnNoaXAgb2YgdGhlIEFycmF5QnVmZmVyIGZvciB6ZXJvLWNvcHkgcGVyZm9ybWFuY2VcbiAgICBzZWxmLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJmcmFtZVwiLFxuICAgICAgICBidWZmZXI6IHJlc3VsdC5idWZmZXIuYnVmZmVyLFxuICAgICAgICB3aWR0aDogcmVzdWx0LndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHJlc3VsdC5oZWlnaHQsXG4gICAgICAgIGNlbGxDb3VudDogcmVzdWx0LmNlbGxDb3VudCxcbiAgICAgICAgc3RlcG51bTogc2ltdWxhdGlvbi5zdGVwbnVtXG4gICAgfSwgW3Jlc3VsdC5idWZmZXIuYnVmZmVyXSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRDZWxsSW5mbyh4LCB5KSB7XG4gICAgY29uc3QgY2VsbCA9IHNpbXVsYXRpb24ud29ybGQuZ2V0Q2VsbCh4LCB5KTtcbiAgICBpZiAoIWNlbGwgfHwgIWNlbGwucGxhbnQgfHwgIWNlbGwucGxhbnQuZ2Vub21lKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBwbGFudCA9IGNlbGwucGxhbnQ7XG4gICAgICAgIGNvbnN0IHJ1bGVzID0gc2ltdWxhdGlvbi5nZW5vbWVJbnRlcnByZXRlci5pbnRlcnByZXQocGxhbnQuZ2Vub21lLCBwbGFudCk7XG5cbiAgICAgICAgLy8gVXNlIHRoZSBjb3JyZWN0IHN0YXRlXG4gICAgICAgIGxldCBjZWxsU3RhdGUgPSBwbGFudC5nZXRTdGF0ZShjZWxsKTtcbiAgICAgICAgY29uc3QgbmVpZ2hib3VyaG9vZCA9IHBsYW50LmdldE5laWdoYm91cmhvb2QoY2VsbCk7XG4gICAgICAgIGNvbnN0IGVuZXJnaXNlZCA9IGNlbGwuZW5lcmdpc2VkO1xuXG4gICAgICAgIC8vIFNlcmlhbGl6ZSBydWxlcyBhcyBzdHJ1Y3R1cmVkIG9iamVjdHMgZm9yIHJpY2ggVUkgcmVuZGVyaW5nXG4gICAgICAgIGNvbnN0IHNlcmlhbGl6ZWRSdWxlcyA9IHJ1bGVzLm1hcCgociwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHIubWF0Y2hlcyhjZWxsU3RhdGUpO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uU3RyID0gci5hY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IGlzRGl2ID0gYWN0aW9uU3RyLnN0YXJ0c1dpdGgoXCJkaXZpZGVcIik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGluZGV4OiBpLFxuICAgICAgICAgICAgICAgIG1hdGNoZXMsXG4gICAgICAgICAgICAgICAgc3RhdGU6IHIuc3RhdGUsXG4gICAgICAgICAgICAgICAgZXFNYXNrOiByLmVxTWFzayxcbiAgICAgICAgICAgICAgICBhY3Rpb25UeXBlOiBpc0RpdiA/IFwiZGl2aWRlXCIgOiBhY3Rpb25TdHIsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBpc0RpdiA/IHIuYWN0aW9uLmdldERpcmVjdGlvbigpIDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoaW5nUnVsZUluZGV4ID0gc2VyaWFsaXplZFJ1bGVzLmZpbmRJbmRleChyID0+IHIubWF0Y2hlcyk7XG5cbiAgICAgICAgY29uc3QgZGVhdGggPSBwbGFudC5nZXREZWF0aFByb2JhYmlsaXR5KFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuZGVhdGhfZmFjdG9yLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubmF0dXJhbF9leHAsXG4gICAgICAgICAgICBzaW11bGF0aW9uLnBhcmFtcy5lbmVyZ3lfZXhwLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMubGVhbm92ZXJfZmFjdG9yLFxuICAgICAgICAgICAgc2ltdWxhdGlvbi5wYXJhbXMuc2ltX21vZGVcbiAgICAgICAgKTtcbiAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiBcImNlbGxJbmZvXCIsXG4gICAgICAgICAgICBmb3VuZDogdHJ1ZSxcbiAgICAgICAgICAgIGNlbGxTdHI6IGNlbGwudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIG5laWdoYm91cmhvb2QsXG4gICAgICAgICAgICBlbmVyZ2lzZWQsXG4gICAgICAgICAgICBjZWxsU3RhdGUsXG4gICAgICAgICAgICBtYXRjaGluZ1J1bGVJbmRleCxcbiAgICAgICAgICAgIGRlYXRoOiBKU09OLnN0cmluZ2lmeShkZWF0aCksXG4gICAgICAgICAgICBnZW5vbWVMZW5ndGg6IHBsYW50Lmdlbm9tZS5sZW5ndGgsXG4gICAgICAgICAgICBtdXRFeHA6IHBsYW50Lmdlbm9tZS5tdXRfZXhwLFxuICAgICAgICAgICAgcnVsZXM6IHNlcmlhbGl6ZWRSdWxlcyxcbiAgICAgICAgICAgIGludGVycHJldGVyVHlwZTogc2ltdWxhdGlvbi5wYXJhbXMuZ2Vub21lX2ludGVycHJldGVyLFxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNlbGxJbmZvXCIsIGZvdW5kOiBmYWxzZSwgZXJyb3I6IGUubWVzc2FnZSB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQge3JhbmRvbUludH0gZnJvbSBcIi4vcmFuZG9tLmpzXCI7XG5pbXBvcnQge1BsYW50fSBmcm9tIFwiLi9wbGFudC5qc1wiO1xuaW1wb3J0IHsgQ2VsbCB9IGZyb20gXCIuL2NlbGwuanNcIjtcblxuY2xhc3MgV29ybGQge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpe1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMuY2VsbHMgPSBbXTtcbiAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgd29ybGQgbGF0dGljZSB0byBhbGwgbnVsbHNcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy53aWR0aDsgaSsrKXtcbiAgICAgICAgICAgIHRoaXMuY2VsbHMucHVzaChbXSk7XG4gICAgICAgICAgICBmb3IodmFyIGo9MDsgajx0aGlzLmhlaWdodDsgaisrKXtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2ldW2pdID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxhbnRzID0gW107XG4gICAgICAgIHRoaXMuY2VsbENvdW50ID0gMDtcblxuICAgICAgICB0aGlzLm9uUGxhbnRCaXJ0aCA9IG51bGw7XG4gICAgICAgIHRoaXMub25QbGFudERlYXRoID0gbnVsbDtcbiAgICAgICAgdGhpcy5vbkF0dGFjayA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zb2lsTnV0cmllbnRzID0gW107XG4gICAgICAgIHRoaXMubnV0cmllbnRNYXggPSAwO1xuICAgIH1cblxuICAgIGluaXROdXRyaWVudHMobWF4LCBwYXRjaGluZXNzID0gMCkge1xuICAgICAgICB0aGlzLm51dHJpZW50TWF4ID0gbWF4O1xuICAgICAgICB0aGlzLnNvaWxOdXRyaWVudHMgPSBuZXcgQXJyYXkodGhpcy53aWR0aCk7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAvLyBWYXJpYXRpb24gdXNpbmcgc2luZSB3YXZlcyB0byBjcmVhdGUgXCJob3RzcG90c1wiXG4gICAgICAgICAgICBjb25zdCB2YXJpYXRpb24gPSBwYXRjaGluZXNzICogKE1hdGguc2luKHggKiAwLjEpICogMC41ICsgTWF0aC5zaW4oeCAqIDAuMDMpICogMC41KTtcbiAgICAgICAgICAgIHRoaXMuc29pbE51dHJpZW50c1t4XSA9IG1heCAqICgxLjAgKyB2YXJpYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVwbGVuaXNoTnV0cmllbnRzKHJhdGUsIHN0ZXBudW0sIGFtcCA9IDAsIGZyZXEgPSAwLjAwMSkge1xuICAgICAgICAvLyBBcHBseSBzZWFzb25hbGl0eSBtdWx0aXBsaWVyXG4gICAgICAgIGNvbnN0IHNlYXNvbmFsaXR5ID0gMS4wICsgYW1wICogTWF0aC5zaW4oc3RlcG51bSAqIGZyZXEpO1xuICAgICAgICBjb25zdCBhY3R1YWxSYXRlID0gcmF0ZSAqIHNlYXNvbmFsaXR5O1xuXG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICB0aGlzLnNvaWxOdXRyaWVudHNbeF0gPSBNYXRoLm1pbih0aGlzLm51dHJpZW50TWF4ICogMiwgdGhpcy5zb2lsTnV0cmllbnRzW3hdICsgYWN0dWFsUmF0ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkaWZmdXNlTnV0cmllbnRzKHJhdGUpIHtcbiAgICAgICAgaWYgKHJhdGUgPD0gMCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBuZXh0U29pbCA9IFsuLi50aGlzLnNvaWxOdXRyaWVudHNdO1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHRoaXMud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgY29uc3QgbGVmdCA9ICh4IC0gMSArIHRoaXMud2lkdGgpICUgdGhpcy53aWR0aDtcbiAgICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gKHggKyAxKSAlIHRoaXMud2lkdGg7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEF2ZXJhZ2Ugd2l0aCBuZWlnaGJvcnNcbiAgICAgICAgICAgIGNvbnN0IGZsdXggPSAodGhpcy5zb2lsTnV0cmllbnRzW2xlZnRdICsgdGhpcy5zb2lsTnV0cmllbnRzW3JpZ2h0XSAtIDIgKiB0aGlzLnNvaWxOdXRyaWVudHNbeF0pICogcmF0ZSAqIDAuNTtcbiAgICAgICAgICAgIG5leHRTb2lsW3hdICs9IGZsdXg7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb2lsTnV0cmllbnRzID0gbmV4dFNvaWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMgYXJyYXkgb2YgeCBwb3NpdGlvbnMgYXQgeT0wIHdoZXJlIG5vIGNlbGwgZXhpc3RzXG4gICAgICovXG4gICAgZ2V0Rmxvb3JTcGFjZSgpe1xuICAgICAgICB2YXIgZW1wdHlTcGFjZXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy53aWR0aDsgaSsrKXtcbiAgICAgICAgICAgIGlmKHRoaXMuY2VsbHNbaV1bMF0gPT09IG51bGwpe1xuICAgICAgICAgICAgICAgIGVtcHR5U3BhY2VzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVtcHR5U3BhY2VzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0cmF0ZWdpZXMgZm9yIHNvd2luZyBhIHNlZWQgb24gdGhlIHdvcmxkIGZsb29yXG4gICAgICogQHBhcmFtIHsqfSBnZW5vbWUgdGhlIGdlbm9tZSB1c2VkIGJ5IHRoZSBuZXcgc2VlZFxuICAgICAqIEBwYXJhbSB7Kn0gbmVhclggaWYgbm90IG51bGwsIHRyeSB0byBzb3cgYSBzZWVkIGFzIGNsb3NlXG4gICAgICogYXMgcG9zc2libGUgdG8gdGhpcyBsb2NhdGlvblxuICAgICAqIFxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiBhIHNlZWQgd2FzIHN1Y2Nlc2Z1bGx5IHBsYW50ZWQsIGZhbHNlIGlmXG4gICAgICogdGhlcmUgd2FzIG5vIHNwYWNlIHRvIHNvdyBhIHNlZWQuXG4gICAgICovXG4gICAgc2VlZChnZW5vbWUsIG5lYXJYLCBzdGVwbnVtKXtcbiAgICAgICAgLy8gZmluZCBhIHJhbmRvbSBlbXB0eSBzcGFjZVxuICAgICAgICB2YXIgZW1wdHlTcGFjZXMgPSB0aGlzLmdldEZsb29yU3BhY2UoKTtcbiAgICAgICAgaWYoZW1wdHlTcGFjZXMubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5lYXJYICE9PSB1bmRlZmluZWQgJiYgbmVhclggIT09IG51bGwpe1xuICAgICAgICAgICAgdmFyIG5lYXJlc3RYID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBuZWFyZXN0X2RpZmYgPSB0aGlzLndpZHRoO1xuICAgICAgICAgICAgZW1wdHlTcGFjZXMuZm9yRWFjaChmdW5jdGlvbih4cG9zKXtcbiAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IE1hdGguYWJzKG5lYXJYLXhwb3MpO1xuICAgICAgICAgICAgICAgIGlmKGRpZmYgPCBuZWFyZXN0X2RpZmYpe1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0X2RpZmYgPSBkaWZmO1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0WCA9IHhwb3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnNvd1BsYW50KGdlbm9tZSwgbmVhcmVzdFgsIHN0ZXBudW0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeCA9IGVtcHR5U3BhY2VzW3JhbmRvbUludCgwLCBlbXB0eVNwYWNlcy5sZW5ndGgtMSldO1xuICAgICAgICBpZiAodGhpcy5jZWxsc1t4XVswXSAhPT0gbnVsbCl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTcGFjZSBpcyB0YWtlblwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNvd1BsYW50KGdlbm9tZSwgeCwgc3RlcG51bSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHNvd1BsYW50KGdlbm9tZSwgeCwgc3RlcG51bSl7XG4gICAgICAgIHggPSB0aGlzLmdldFgoeCk7XG4gICAgICAgIHZhciBwbGFudCA9IG5ldyBQbGFudCh4LCB0aGlzLCBnZW5vbWUsIHN0ZXBudW0pO1xuICAgICAgICB0aGlzLnBsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgdGhpcy5hZGRDZWxsKHBsYW50LmNlbGxzWzBdKTtcbiAgICAgICAgaWYgKHRoaXMub25QbGFudEJpcnRoKSB0aGlzLm9uUGxhbnRCaXJ0aChwbGFudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBsYW50IGZyb20gd29ybGQgcGxhbnQgbGlzdC5cbiAgICAgKiBSZW1vdmUgYWxsIGNlbGxzIGZyb20gY2VsbCBncmlkXG4gICAgICovXG4gICAga2lsbFBsYW50KHBsYW50LCByZWN5Y2xpbmdGYWN0b3IgPSAwKSB7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMucGxhbnRzLmluZGV4T2YocGxhbnQpO1xuICAgICAgICBpZiAoaWR4ID4gLTEpIHtcbiAgICAgICAgICAgIC8vIFJlY3ljbGluZyBsb2dpY1xuICAgICAgICAgICAgaWYgKHJlY3ljbGluZ0ZhY3RvciA+IDAgJiYgdGhpcy5zb2lsTnV0cmllbnRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmlvbWFzc0JvbnVzID0gcGxhbnQuY2VsbHMubGVuZ3RoICogMC41O1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsVG9SZXR1cm4gPSAocGxhbnQubnV0cmllbnRDb3VudCArIGJpb21hc3NCb251cykgKiByZWN5Y2xpbmdGYWN0b3I7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdENvbHVtbnMgPSBwbGFudC5jZWxscy5maWx0ZXIoYyA9PiBjLnkgPT09IDApLm1hcChjID0+IGMueCk7XG4gICAgICAgICAgICAgICAgaWYgKHJvb3RDb2x1bW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGVyQ29sdW1uID0gdG90YWxUb1JldHVybiAvIHJvb3RDb2x1bW5zLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgcm9vdENvbHVtbnMuZm9yRWFjaCh4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc29pbE51dHJpZW50c1t4XSArPSBwZXJDb2x1bW47XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5wbGFudHMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgICAgICB0aGlzLmNlbGxDb3VudCAtPSBwbGFudC5jZWxscy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYW50LmNlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IHBsYW50LmNlbGxzW2ldO1xuICAgICAgICAgICAgICAgIHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9uUGxhbnREZWF0aCkgdGhpcy5vblBsYW50RGVhdGgocGxhbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0WCh4KXtcbiAgICAgICAgaWYoeCA8IDApe1xuICAgICAgICAgICAgeCA9IHRoaXMud2lkdGggKyB4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4ICUgdGhpcy53aWR0aDtcbiAgICB9XG5cbiAgICBnZXRDZWxsKHgsIHkpe1xuICAgICAgICByZXR1cm4gdGhpcy5jZWxsc1t0aGlzLmdldFgoeCldW3ldO1xuICAgIH1cblxuICAgIGFkZENlbGwoY2VsbCl7XG4gICAgICAgIGlmICh0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IGNlbGw7XG4gICAgICAgICAgICB0aGlzLmNlbGxDb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0UGl4ZWxCdWZmZXIoY2VsbFNpemUpe1xuICAgICAgICBjb25zdCB3ID0gdGhpcy53aWR0aCAqIGNlbGxTaXplO1xuICAgICAgICBjb25zdCBoID0gdGhpcy5oZWlnaHQgKiBjZWxsU2l6ZTtcbiAgICAgICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHcgKiBoICogNCk7XG4gICAgICAgIGNvbnN0IHBsYW50cyA9IHRoaXMucGxhbnRzO1xuXG4gICAgICAgIC8vIFJlbmRlciBzb2lsIG51dHJpZW50cyBpbiBiYWNrZ3JvdW5kIGlmIHByZXNlbnRcbiAgICAgICAgaWYgKHRoaXMuc29pbE51dHJpZW50cyAmJiB0aGlzLnNvaWxOdXRyaWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLndpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuID0gdGhpcy5zb2lsTnV0cmllbnRzW3hdIC8gdGhpcy5udXRyaWVudE1heDtcbiAgICAgICAgICAgICAgICAvLyBEYXJrIGJyb3duIHRvIGVhcnRoeSBicm93biBncmFkaWVudFxuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBNYXRoLnJvdW5kKDQwICsgNDAgKiBuKTtcbiAgICAgICAgICAgICAgICBjb25zdCBnID0gTWF0aC5yb3VuZCgzMCArIDIwICogbik7XG4gICAgICAgICAgICAgICAgY29uc3QgYiA9IE1hdGgucm91bmQoMjAgKyAxMCAqIG4pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHB4ID0geCAqIGNlbGxTaXplO1xuICAgICAgICAgICAgICAgIGNvbnN0IHB5ID0gKHRoaXMuaGVpZ2h0IC0gMSkgKiBjZWxsU2l6ZTsgLy8gQm90dG9tIHJvd1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGR5ID0gMDsgZHkgPCBjZWxsU2l6ZTsgZHkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByb3dJZHggPSAocHkgKyBkeSkgKiB3O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkeCA9IDA7IGR4IDwgY2VsbFNpemU7IGR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkeCA9IChyb3dJZHggKyBweCArIGR4KSAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4XSA9IHI7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZbaWR4ICsgMV0gPSBnO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDJdID0gYjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAzXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwbGFudCA9IHBsYW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IFtiYXNlUiwgYmFzZUcsIGJhc2VCXSA9IHRoaXMuZ2V0QmFzZUNvbG91cihwbGFudCk7XG4gICAgICAgICAgICBjb25zdCBkYXJrUiA9IE1hdGgucm91bmQoYmFzZVIgKiAwLjcpO1xuICAgICAgICAgICAgY29uc3QgZGFya0cgPSBNYXRoLnJvdW5kKGJhc2VHICogMC43KTtcbiAgICAgICAgICAgIGNvbnN0IGRhcmtCID0gTWF0aC5yb3VuZChiYXNlQiAqIDAuNyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IGNlbGxzID0gcGxhbnQuY2VsbHM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNlbGxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IGNlbGxzW2pdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHIwID0gY2VsbC5lbmVyZ2lzZWQgPyBiYXNlUiA6IGRhcmtSO1xuICAgICAgICAgICAgICAgIGNvbnN0IGcwID0gY2VsbC5lbmVyZ2lzZWQgPyBiYXNlRyA6IGRhcmtHO1xuICAgICAgICAgICAgICAgIGNvbnN0IGIwID0gY2VsbC5lbmVyZ2lzZWQgPyBiYXNlQiA6IGRhcmtCO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHB4MCA9IGNlbGwueCAqIGNlbGxTaXplO1xuICAgICAgICAgICAgICAgIGNvbnN0IHB5MCA9ICh0aGlzLmhlaWdodCAtIDEgLSBjZWxsLnkpICogY2VsbFNpemU7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkeSA9IDA7IGR5IDwgY2VsbFNpemU7IGR5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm93SWR4ID0gKHB5MCArIGR5KSAqIHc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGR4ID0gMDsgZHggPCBjZWxsU2l6ZTsgZHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNCb3JkZXIgPSBjZWxsU2l6ZSA+IDEgJiYgKGR4ID09PSAwIHx8IGR5ID09PSAwIHx8IGR4ID09PSBjZWxsU2l6ZSAtIDEgfHwgZHkgPT09IGNlbGxTaXplIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpZHggPSAocm93SWR4ICsgcHgwICsgZHgpICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQm9yZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeF0gICAgID0gTWF0aC5yb3VuZChyMCAqIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDFdID0gTWF0aC5yb3VuZChnMCAqIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDJdID0gTWF0aC5yb3VuZChiMCAqIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHhdICAgICA9IHIwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAxXSA9IGcwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZltpZHggKyAyXSA9IGIwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmW2lkeCArIDNdID0gMjU1O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgYnVmZmVyOiBidWYsIHdpZHRoOiB3LCBoZWlnaHQ6IGgsIGNlbGxDb3VudDogdGhpcy5jZWxsQ291bnQgfTtcbiAgICB9XG5cbiAgICBnZXRCYXNlQ29sb3VyKHBsYW50KXtcbiAgICAgICAgdmFyIGkgPSBwbGFudC5jZWxsc1swXS54ICUgY1NjYWxlLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGNTY2FsZVtpXTtcbiAgICB9XG59XG5cbi8vIGh0dHA6Ly9jb2xvcmJyZXdlcjIub3JnLz90eXBlPXF1YWxpdGF0aXZlJnNjaGVtZT1TZXQzJm49OCDigJQgYXMgcmF3IFtSLEcsQl0gdHVwbGVzXG52YXIgY1NjYWxlID0gW1xuICAgIFsxNDEsMjExLDE5OV0sWzI1NSwyNTUsMTc5XSxbMTkwLDE4NiwyMThdLFsyNTEsMTI4LDExNF0sXG4gICAgWzEyOCwxNzcsMjExXSxbMjUzLDE4MCw5OF0sWzE3OSwyMjIsMTA1XSxbMjUyLDIwNSwyMjldXG5dO1xuXG5cbmV4cG9ydCB7IFdvcmxkIH07IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0bG9hZGVkOiBmYWxzZSxcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcblx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuX193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcblxuLy8gdGhlIHN0YXJ0dXAgZnVuY3Rpb25cbl9fd2VicGFja19yZXF1aXJlX18ueCA9ICgpID0+IHtcblx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5cdC8vIFRoaXMgZW50cnkgbW9kdWxlIGRlcGVuZHMgb24gb3RoZXIgbG9hZGVkIGNodW5rcyBhbmQgZXhlY3V0aW9uIG5lZWQgdG8gYmUgZGVsYXllZFxuXHR2YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18uTyh1bmRlZmluZWQsIFtcInZlbmRvcnMtbm9kZV9tb2R1bGVzX3NlZWRyYW5kb21faW5kZXhfanMtbm9kZV9tb2R1bGVzX3N0YXRzLWxpdGVfc3RhdHNfanNcIl0sICgpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvc2ltdWxhdGlvbi53b3JrZXIuanNcIikpKVxuXHRfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXy5PKF9fd2VicGFja19leHBvcnRzX18pO1xuXHRyZXR1cm4gX193ZWJwYWNrX2V4cG9ydHNfXztcbn07XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uYW1kRCA9IGZ1bmN0aW9uICgpIHtcblx0dGhyb3cgbmV3IEVycm9yKCdkZWZpbmUgY2Fubm90IGJlIHVzZWQgaW5kaXJlY3QnKTtcbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5hbWRPID0ge307IiwidmFyIGRlZmVycmVkID0gW107XG5fX3dlYnBhY2tfcmVxdWlyZV9fLk8gPSAocmVzdWx0LCBjaHVua0lkcywgZm4sIHByaW9yaXR5KSA9PiB7XG5cdGlmKGNodW5rSWRzKSB7XG5cdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuXHRcdGZvcih2YXIgaSA9IGRlZmVycmVkLmxlbmd0aDsgaSA+IDAgJiYgZGVmZXJyZWRbaSAtIDFdWzJdID4gcHJpb3JpdHk7IGktLSkgZGVmZXJyZWRbaV0gPSBkZWZlcnJlZFtpIC0gMV07XG5cdFx0ZGVmZXJyZWRbaV0gPSBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV07XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBub3RGdWxmaWxsZWQgPSBJbmZpbml0eTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBbY2h1bmtJZHMsIGZuLCBwcmlvcml0eV0gPSBkZWZlcnJlZFtpXTtcblx0XHR2YXIgZnVsZmlsbGVkID0gdHJ1ZTtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpZiAoKHByaW9yaXR5ICYgMSA9PT0gMCB8fCBub3RGdWxmaWxsZWQgPj0gcHJpb3JpdHkpICYmIE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uTykuZXZlcnkoKGtleSkgPT4gKF9fd2VicGFja19yZXF1aXJlX18uT1trZXldKGNodW5rSWRzW2pdKSkpKSB7XG5cdFx0XHRcdGNodW5rSWRzLnNwbGljZShqLS0sIDEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnVsZmlsbGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmKHByaW9yaXR5IDwgbm90RnVsZmlsbGVkKSBub3RGdWxmaWxsZWQgPSBwcmlvcml0eTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoZnVsZmlsbGVkKSB7XG5cdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuXHRcdFx0dmFyIHIgPSBmbigpO1xuXHRcdFx0aWYgKHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vLyBUaGlzIGZpbGUgY29udGFpbnMgb25seSB0aGUgZW50cnkgY2h1bmsuXG4vLyBUaGUgY2h1bmsgbG9hZGluZyBmdW5jdGlvbiBmb3IgYWRkaXRpb25hbCBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLmYpLnJlZHVjZSgocHJvbWlzZXMsIGtleSkgPT4ge1xuXHRcdF9fd2VicGFja19yZXF1aXJlX18uZltrZXldKGNodW5rSWQsIHByb21pc2VzKTtcblx0XHRyZXR1cm4gcHJvbWlzZXM7XG5cdH0sIFtdKSk7XG59OyIsIi8vIFRoaXMgZnVuY3Rpb24gYWxsb3cgdG8gcmVmZXJlbmNlIGFzeW5jIGNodW5rcyBhbmQgY2h1bmtzIHRoYXQgdGhlIGVudHJ5cG9pbnQgZGVwZW5kcyBvblxuX193ZWJwYWNrX3JlcXVpcmVfXy51ID0gKGNodW5rSWQpID0+IHtcblx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG5cdHJldHVybiBcIlwiICsgY2h1bmtJZCArIFwiLmJ1bmRsZS5qc1wiO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5tZCA9IChtb2R1bGUpID0+IHtcblx0bW9kdWxlLnBhdGhzID0gW107XG5cdGlmICghbW9kdWxlLmNoaWxkcmVuKSBtb2R1bGUuY2hpbGRyZW4gPSBbXTtcblx0cmV0dXJuIG1vZHVsZTtcbn07IiwidmFyIHNjcmlwdFVybDtcbmlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmcuaW1wb3J0U2NyaXB0cykgc2NyaXB0VXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmxvY2F0aW9uICsgXCJcIjtcbnZhciBkb2N1bWVudCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5kb2N1bWVudDtcbmlmICghc2NyaXB0VXJsICYmIGRvY3VtZW50KSB7XG5cdGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0ICYmIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQudGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSAnU0NSSVBUJylcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcblx0aWYgKCFzY3JpcHRVcmwpIHtcblx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xuXHRcdGlmKHNjcmlwdHMubGVuZ3RoKSB7XG5cdFx0XHR2YXIgaSA9IHNjcmlwdHMubGVuZ3RoIC0gMTtcblx0XHRcdHdoaWxlIChpID4gLTEgJiYgKCFzY3JpcHRVcmwgfHwgIS9eaHR0cChzPyk6Ly50ZXN0KHNjcmlwdFVybCkpKSBzY3JpcHRVcmwgPSBzY3JpcHRzW2ktLV0uc3JjO1xuXHRcdH1cblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC9eYmxvYjovLCBcIlwiKS5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiLy8gbm8gYmFzZVVSSVxuXG4vLyBvYmplY3QgdG8gc3RvcmUgbG9hZGVkIGNodW5rc1xuLy8gXCIxXCIgbWVhbnMgXCJhbHJlYWR5IGxvYWRlZFwiXG52YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuXHRcInNyY19zaW11bGF0aW9uX3dvcmtlcl9qc1wiOiAxXG59O1xuXG4vLyBpbXBvcnRTY3JpcHRzIGNodW5rIGxvYWRpbmdcbnZhciBpbnN0YWxsQ2h1bmsgPSAoZGF0YSkgPT4ge1xuXHR2YXIgW2NodW5rSWRzLCBtb3JlTW9kdWxlcywgcnVudGltZV0gPSBkYXRhO1xuXHRmb3IodmFyIG1vZHVsZUlkIGluIG1vcmVNb2R1bGVzKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKG1vcmVNb2R1bGVzLCBtb2R1bGVJZCkpIHtcblx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubVttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG5cdFx0fVxuXHR9XG5cdGlmKHJ1bnRpbWUpIHJ1bnRpbWUoX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cdHdoaWxlKGNodW5rSWRzLmxlbmd0aClcblx0XHRpbnN0YWxsZWRDaHVua3NbY2h1bmtJZHMucG9wKCldID0gMTtcblx0cGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24oZGF0YSk7XG59O1xuX193ZWJwYWNrX3JlcXVpcmVfXy5mLmkgPSAoY2h1bmtJZCwgcHJvbWlzZXMpID0+IHtcblx0Ly8gXCIxXCIgaXMgdGhlIHNpZ25hbCBmb3IgXCJhbHJlYWR5IGxvYWRlZFwiXG5cdGlmKCFpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcblx0XHRpZih0cnVlKSB7IC8vIGFsbCBjaHVua3MgaGF2ZSBKU1xuXHRcdFx0aW1wb3J0U2NyaXB0cyhfX3dlYnBhY2tfcmVxdWlyZV9fLnAgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLnUoY2h1bmtJZCkpO1xuXHRcdH1cblx0fVxufTtcblxudmFyIGNodW5rTG9hZGluZ0dsb2JhbCA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtsaW5kZXZvbFwiXSB8fCBbXTtcbnZhciBwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbiA9IGNodW5rTG9hZGluZ0dsb2JhbC5wdXNoLmJpbmQoY2h1bmtMb2FkaW5nR2xvYmFsKTtcbmNodW5rTG9hZGluZ0dsb2JhbC5wdXNoID0gaW5zdGFsbENodW5rO1xuXG4vLyBubyBITVJcblxuLy8gbm8gSE1SIG1hbmlmZXN0IiwidmFyIG5leHQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLng7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnggPSAoKSA9PiB7XG5cdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fLmUoXCJ2ZW5kb3JzLW5vZGVfbW9kdWxlc19zZWVkcmFuZG9tX2luZGV4X2pzLW5vZGVfbW9kdWxlc19zdGF0cy1saXRlX3N0YXRzX2pzXCIpLnRoZW4obmV4dCk7XG59OyIsIiIsIi8vIHJ1biBzdGFydHVwXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18ueCgpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9