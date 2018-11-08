/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/actions.js":
/*!************************!*\
  !*** ./src/actions.js ***!
  \************************/
/*! exports provided: Divide, MutatePlus, MutateMinus, LocalSeed, FlyingSeed, ActionMap, NEIGHBOURHOOD */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Divide", function() { return Divide; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MutatePlus", function() { return MutatePlus; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MutateMinus", function() { return MutateMinus; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LocalSeed", function() { return LocalSeed; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FlyingSeed", function() { return FlyingSeed; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ActionMap", function() { return ActionMap; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NEIGHBOURHOOD", function() { return NEIGHBOURHOOD; });
var NEIGHBOURHOOD = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]];

class Action{
    constructor(actionCode){
        this.code = actionCode;
    }

    get params(){
        return 0;
    }

    execute(cell){

    }
}

class Divide extends Action{

    execute(cell){
        // the 2 least significant bits of the action code
        // determines which direction the divide action is for
        direction = this.getDirection();
        cell.plant.growFromCell(cell, direction);
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
}

class MutatePlus extends Action{
    execute(cell){
        // cell.plant.mutate
    }
}

class MutateMinus extends Action{
    execute(cell){
        // cell.plant.mutate
    }
}

class FlyingSeed extends Action{
    execute(cell){
        // cell.plant.seed
    }
}

class LocalSeed extends Action{
    execute(cell){
        // cell.plant.seed
    }
}

class ActionMap {

    constructor(mapping=[224, 0, 0, 16, 16, 0]){
        this.mapping = mapping;
        this.actions = [Divide, FlyingSeed, LocalSeed, MutatePlus, MutateMinus];
    }

    getAction(actionCode){
        for(var i=0; i<this.mapping.length; i++){
            if (actionCode < this.mapping[i]){
                return new this.actions[i](actionCode);
            }

        }
    }
}



/***/ }),

/***/ "./src/cell.js":
/*!*********************!*\
  !*** ./src/cell.js ***!
  \*********************/
/*! exports provided: Cell */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Cell", function() { return Cell; });

class Cell{
    constructor(plant, x, y){
        this.plant = plant
        this.x = x;
        this.y = y;
        this.energised = true;
    }

    draw(ctx, x, y, size, colour){
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, size, size);
        ctx.strokeRect(x, y, size, size);
    }
}



/***/ }),

/***/ "./src/genome.js":
/*!***********************!*\
  !*** ./src/genome.js ***!
  \***********************/
/*! exports provided: ByteArray, GenomeInterpreter */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ByteArray", function() { return ByteArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GenomeInterpreter", function() { return GenomeInterpreter; });
/* harmony import */ var _actions_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./actions.js */ "./src/actions.js");


class ByteArray extends Uint8Array{

    constructor(bytes=null, length=0){
        if (bytes){
            if (typeof(bytes) === "string"){
                super(bytes.split(''))
            }
            else{
                super(bytes)
            }
        }
        else{
            super(length)
        }
    }

    static random(length){
        var ba = new ByteArray(length)
        for(var i=0; i<ba.length;i++){
            ba[i] = Math.floor(Math.random()*255)
        }
        return ba
    }

}



class Rule {
    constructor(state, action){
        this.state = state;
        this.action = action;
    }
}

class GenomeInterpreter{
    /**
     * Methods that decode genomes into rules
     */
    constructor(mapping=[224, 0, 0, 16, 16, 0]){
        this.mapping = new _actions_js__WEBPACK_IMPORTED_MODULE_0__["ActionMap"](mapping)
    }
    
    interpret(bytearray){
        var rules = []
        for(var i=0; i < bytearray.length; i+=2){
            var action = this.mapping.getAction(bytearray[i+1])
            rules.push(new Rule(bytearray[i], action))
        }
        return rules
    }
}



/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _world_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./world.js */ "./src/world.js");



var canvas = document.querySelector("#mainbox");
var ctx = canvas.getContext("2d");

// control
document.querySelector("#step").addEventListener("click", function (){
    simStep();
});

var cellSize = 10;

var world = new _world_js__WEBPACK_IMPORTED_MODULE_0__["World"](Math.floor(canvas.width/cellSize), Math.floor(canvas.height/cellSize));
console.log(world)
// randomly choose spots to seed the world with
for (var i=0; i<60; i++){
    var x = Math.floor(Math.random()*world.width);
    world.seed(x);
}

function drawScreen(){
    ctx.strokeStyle = "black";
    
    world.draw(ctx, canvas.width, canvas.height, cellSize);
}

function gameLoop(){
    world.step();
    drawScreen();
    window.requestAnimationFrame(gameLoop);
}


function simStep(){
    world.step();
    drawScreen();
}

drawScreen()



/***/ }),

/***/ "./src/plant.js":
/*!**********************!*\
  !*** ./src/plant.js ***!
  \**********************/
/*! exports provided: Plant */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Plant", function() { return Plant; });
/* harmony import */ var _cell_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./cell.js */ "./src/cell.js");

var NEIGHBOURHOOD = __webpack_require__(/*! ./actions.js */ "./src/actions.js").NEIGHBOURHOOD
class Plant{
    constructor(x, world, genome) {
        this.world = world;
        this.cells = [new _cell_js__WEBPACK_IMPORTED_MODULE_0__["Cell"](this, x, 0)];
        this.genome = genome
    }

    getNeighbourhood(cell){
        // Return the neighbourhood mask
        var mask = 0
        for(var i=0; i<NEIGHBOURHOOD.length; i++){
            var pos = NEIGHBOURHOOD[i];
            var x = cell.x + pos[0];
            var y = cell.y + pos[1];
            try{
                var worldPos = this.world.cells[x][y];
            }
            catch {
                continue;
            }
            if (worldPos instanceof _cell_js__WEBPACK_IMPORTED_MODULE_0__["Cell"]){
                mask = mask | Math.pow(2, i);
            }
        }
        return mask;
    }

    grow(){
        this.cells.forEach(function(cell){
            // 50% chance to grow
            if(Math.random() > 0.8){
                var spaces = this.getGrowDirection(cell);
                if(spaces.length > 0){
                    var direction = spaces[Math.floor(Math.random()*spaces.length)];
                    if (direction !== null){
                        this.growFromCell(cell, direction);
                    }
                }
            }
        }, this);
    }

    action(genomeInterpreter){
        this.cells.forEach(function(cell){
            var rules = genomeInterpreter.interpret(this.genome);
            var mask = this.getNeighbourhood(cell);
            rules.forEach(function(rule){
                if (rule.mask === mask){
                    rule.action.execute(this);
                }
            }, this);
        }, this);

    }

    /**
     * Grow the plant by one cell
     * @param {*} cell the cell to grow from
     * @param {*} direction the direction to grow in
     */
    growFromCell(cell, direction){
        var new_cell = new _cell_js__WEBPACK_IMPORTED_MODULE_0__["Cell"](this, cell.x+direction[0], cell.y+direction[1]);
        this.cells.push(new_cell);
        this.world.addCell(new_cell);
    }

    draw(ctx) {

    }
}



/***/ }),

/***/ "./src/world.js":
/*!**********************!*\
  !*** ./src/world.js ***!
  \**********************/
/*! exports provided: World */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "World", function() { return World; });
/* harmony import */ var _plant_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./plant.js */ "./src/plant.js");
/* harmony import */ var _genome_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./genome.js */ "./src/genome.js");



class World {
    constructor(width, height){
        this.width = width;
        this.height = height;

        this.cells = [];
        for(var i=0; i<this.width; i++){
            this.cells.push([]);
            for(var j=0; j<this.height; j++){
                this.cells[i][j] = null;
            }
        }

        this.plants = [];
        this.genomeInterpreter = new _genome_js__WEBPACK_IMPORTED_MODULE_1__["GenomeInterpreter"]()
    }

    seed(x){
        // Create a new plant seed on the world floor
        var g = _genome_js__WEBPACK_IMPORTED_MODULE_1__["ByteArray"].random(20);
        var plant = new _plant_js__WEBPACK_IMPORTED_MODULE_0__["Plant"](x, this, g);
        this.plants.push(plant);
        this.cells[x][0] = plant.cells[0];
    }

    getCell(x, y){
        try {
            cell = this.cells[x][y];
            if(cell === undefined){
                throw ""
            }
            return cell
        }
        catch(error) {
            throw "world coordinates out of bounds when adding cell";
        } 
    }

    addCell(cell){
        try {
            if (this.cells[cell.x][cell.y] !== undefined) {
                this.cells[cell.x][cell.y] = cell;
            }
            else {
                throw "";
            }
        }
        catch(error) {
            throw "world coordinates out of bounds when adding cell";
        }
    }

    step(){
        this.plants.forEach(function(plant){
            plant.action(this.genomeInterpreter);
        }, this);
    }

    draw(ctx, width, height, cellSize){
        this.plants.forEach(function(plant){
            plant.cells.forEach(function(cell){
                var x = cell.x * cellSize;
                var y = cellSize * (this.height - cell.y);
                // console.log("Draw " + [x, y]);
                cell.draw(ctx, x, y - cellSize, cellSize, "gray");
            }, this);
        }, this);
    }
}



/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FjdGlvbnMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NlbGwuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2dlbm9tZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BsYW50LmpzIiwid2VicGFjazovLy8uL3NyYy93b3JsZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBeUMsaUNBQWlDO0FBQzFFLHdIQUFnSCxtQkFBbUIsRUFBRTtBQUNySTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOzs7QUFHQTtBQUNBOzs7Ozs7Ozs7Ozs7O0FDbEZBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FB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IG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCJ2YXIgTkVJR0hCT1VSSE9PRCA9IFtbLTEsLTFdLCBbMCwtMV0sIFsxLC0xXSwgWy0xLDBdLCBbMSwwXSwgWy0xLDFdLCBbMCwxXSwgWzEsMV1dO1xyXG5cclxuY2xhc3MgQWN0aW9ue1xyXG4gICAgY29uc3RydWN0b3IoYWN0aW9uQ29kZSl7XHJcbiAgICAgICAgdGhpcy5jb2RlID0gYWN0aW9uQ29kZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgcGFyYW1zKCl7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZShjZWxsKXtcclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIERpdmlkZSBleHRlbmRzIEFjdGlvbntcclxuXHJcbiAgICBleGVjdXRlKGNlbGwpe1xyXG4gICAgICAgIC8vIHRoZSAyIGxlYXN0IHNpZ25pZmljYW50IGJpdHMgb2YgdGhlIGFjdGlvbiBjb2RlXHJcbiAgICAgICAgLy8gZGV0ZXJtaW5lcyB3aGljaCBkaXJlY3Rpb24gdGhlIGRpdmlkZSBhY3Rpb24gaXMgZm9yXHJcbiAgICAgICAgZGlyZWN0aW9uID0gdGhpcy5nZXREaXJlY3Rpb24oKTtcclxuICAgICAgICBjZWxsLnBsYW50Lmdyb3dGcm9tQ2VsbChjZWxsLCBkaXJlY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBwYXJhbXMoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXREaXJlY3Rpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXREaXJlY3Rpb24oKXtcclxuICAgICAgICAvLyBleHRyYWN0IHRoZSBjb3JyZWN0IGJpdHNcclxuICAgICAgICAvLyAmIHdpdGggMDAwMDAxMTEgdG8gbWFzayBvdXQgbGVhc3Qgc2lnIGJpdHNcclxuICAgICAgICB2YXIgZGlyZWN0aW9uQ29kZSA9IHRoaXMuY29kZSAmIDc7XHJcbiAgICAgICAgcmV0dXJuIE5FSUdIQk9VUkhPT0RbZGlyZWN0aW9uQ29kZV07XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE11dGF0ZVBsdXMgZXh0ZW5kcyBBY3Rpb257XHJcbiAgICBleGVjdXRlKGNlbGwpe1xyXG4gICAgICAgIC8vIGNlbGwucGxhbnQubXV0YXRlXHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIE11dGF0ZU1pbnVzIGV4dGVuZHMgQWN0aW9ue1xyXG4gICAgZXhlY3V0ZShjZWxsKXtcclxuICAgICAgICAvLyBjZWxsLnBsYW50Lm11dGF0ZVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBGbHlpbmdTZWVkIGV4dGVuZHMgQWN0aW9ue1xyXG4gICAgZXhlY3V0ZShjZWxsKXtcclxuICAgICAgICAvLyBjZWxsLnBsYW50LnNlZWRcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTG9jYWxTZWVkIGV4dGVuZHMgQWN0aW9ue1xyXG4gICAgZXhlY3V0ZShjZWxsKXtcclxuICAgICAgICAvLyBjZWxsLnBsYW50LnNlZWRcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQWN0aW9uTWFwIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nPVsyMjQsIDAsIDAsIDE2LCAxNiwgMF0pe1xyXG4gICAgICAgIHRoaXMubWFwcGluZyA9IG1hcHBpbmc7XHJcbiAgICAgICAgdGhpcy5hY3Rpb25zID0gW0RpdmlkZSwgRmx5aW5nU2VlZCwgTG9jYWxTZWVkLCBNdXRhdGVQbHVzLCBNdXRhdGVNaW51c107XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWN0aW9uKGFjdGlvbkNvZGUpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMubWFwcGluZy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGlmIChhY3Rpb25Db2RlIDwgdGhpcy5tYXBwaW5nW2ldKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgdGhpcy5hY3Rpb25zW2ldKGFjdGlvbkNvZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHtEaXZpZGUsIE11dGF0ZVBsdXMsIE11dGF0ZU1pbnVzLCBMb2NhbFNlZWQsIEZseWluZ1NlZWQsIEFjdGlvbk1hcCwgTkVJR0hCT1VSSE9PRH07IiwiXG5jbGFzcyBDZWxse1xuICAgIGNvbnN0cnVjdG9yKHBsYW50LCB4LCB5KXtcbiAgICAgICAgdGhpcy5wbGFudCA9IHBsYW50XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMuZW5lcmdpc2VkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBkcmF3KGN0eCwgeCwgeSwgc2l6ZSwgY29sb3VyKXtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG91cjtcbiAgICAgICAgY3R4LmZpbGxSZWN0KHgsIHksIHNpemUsIHNpemUpO1xuICAgICAgICBjdHguc3Ryb2tlUmVjdCh4LCB5LCBzaXplLCBzaXplKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7Q2VsbH07IiwiaW1wb3J0IHtBY3Rpb25NYXB9IGZyb20gXCIuL2FjdGlvbnMuanNcIlxyXG5cclxuY2xhc3MgQnl0ZUFycmF5IGV4dGVuZHMgVWludDhBcnJheXtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihieXRlcz1udWxsLCBsZW5ndGg9MCl7XHJcbiAgICAgICAgaWYgKGJ5dGVzKXtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZihieXRlcykgPT09IFwic3RyaW5nXCIpe1xyXG4gICAgICAgICAgICAgICAgc3VwZXIoYnl0ZXMuc3BsaXQoJycpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICBzdXBlcihieXRlcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICBzdXBlcihsZW5ndGgpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByYW5kb20obGVuZ3RoKXtcclxuICAgICAgICB2YXIgYmEgPSBuZXcgQnl0ZUFycmF5KGxlbmd0aClcclxuICAgICAgICBmb3IodmFyIGk9MDsgaTxiYS5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgYmFbaV0gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMjU1KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYmFcclxuICAgIH1cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY2xhc3MgUnVsZSB7XHJcbiAgICBjb25zdHJ1Y3RvcihzdGF0ZSwgYWN0aW9uKXtcclxuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XHJcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBhY3Rpb247XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEdlbm9tZUludGVycHJldGVye1xyXG4gICAgLyoqXHJcbiAgICAgKiBNZXRob2RzIHRoYXQgZGVjb2RlIGdlbm9tZXMgaW50byBydWxlc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihtYXBwaW5nPVsyMjQsIDAsIDAsIDE2LCAxNiwgMF0pe1xyXG4gICAgICAgIHRoaXMubWFwcGluZyA9IG5ldyBBY3Rpb25NYXAobWFwcGluZylcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW50ZXJwcmV0KGJ5dGVhcnJheSl7XHJcbiAgICAgICAgdmFyIHJ1bGVzID0gW11cclxuICAgICAgICBmb3IodmFyIGk9MDsgaSA8IGJ5dGVhcnJheS5sZW5ndGg7IGkrPTIpe1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uID0gdGhpcy5tYXBwaW5nLmdldEFjdGlvbihieXRlYXJyYXlbaSsxXSlcclxuICAgICAgICAgICAgcnVsZXMucHVzaChuZXcgUnVsZShieXRlYXJyYXlbaV0sIGFjdGlvbikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBydWxlc1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQge0J5dGVBcnJheSwgR2Vub21lSW50ZXJwcmV0ZXJ9OyIsIlxuaW1wb3J0IHtXb3JsZH0gZnJvbSBcIi4vd29ybGQuanNcIjtcblxudmFyIGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWFpbmJveFwiKTtcbnZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4vLyBjb250cm9sXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N0ZXBcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uICgpe1xuICAgIHNpbVN0ZXAoKTtcbn0pO1xuXG52YXIgY2VsbFNpemUgPSAxMDtcblxudmFyIHdvcmxkID0gbmV3IFdvcmxkKE1hdGguZmxvb3IoY2FudmFzLndpZHRoL2NlbGxTaXplKSwgTWF0aC5mbG9vcihjYW52YXMuaGVpZ2h0L2NlbGxTaXplKSk7XG5jb25zb2xlLmxvZyh3b3JsZClcbi8vIHJhbmRvbWx5IGNob29zZSBzcG90cyB0byBzZWVkIHRoZSB3b3JsZCB3aXRoXG5mb3IgKHZhciBpPTA7IGk8NjA7IGkrKyl7XG4gICAgdmFyIHggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqd29ybGQud2lkdGgpO1xuICAgIHdvcmxkLnNlZWQoeCk7XG59XG5cbmZ1bmN0aW9uIGRyYXdTY3JlZW4oKXtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgXG4gICAgd29ybGQuZHJhdyhjdHgsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCwgY2VsbFNpemUpO1xufVxuXG5mdW5jdGlvbiBnYW1lTG9vcCgpe1xuICAgIHdvcmxkLnN0ZXAoKTtcbiAgICBkcmF3U2NyZWVuKCk7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShnYW1lTG9vcCk7XG59XG5cblxuZnVuY3Rpb24gc2ltU3RlcCgpe1xuICAgIHdvcmxkLnN0ZXAoKTtcbiAgICBkcmF3U2NyZWVuKCk7XG59XG5cbmRyYXdTY3JlZW4oKVxuXG4iLCJpbXBvcnQge0NlbGx9IGZyb20gXCIuL2NlbGwuanNcIjtcbnZhciBORUlHSEJPVVJIT09EID0gcmVxdWlyZShcIi4vYWN0aW9ucy5qc1wiKS5ORUlHSEJPVVJIT09EXG5jbGFzcyBQbGFudHtcbiAgICBjb25zdHJ1Y3Rvcih4LCB3b3JsZCwgZ2Vub21lKSB7XG4gICAgICAgIHRoaXMud29ybGQgPSB3b3JsZDtcbiAgICAgICAgdGhpcy5jZWxscyA9IFtuZXcgQ2VsbCh0aGlzLCB4LCAwKV07XG4gICAgICAgIHRoaXMuZ2Vub21lID0gZ2Vub21lXG4gICAgfVxuXG4gICAgZ2V0TmVpZ2hib3VyaG9vZChjZWxsKXtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBuZWlnaGJvdXJob29kIG1hc2tcbiAgICAgICAgdmFyIG1hc2sgPSAwXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPE5FSUdIQk9VUkhPT0QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIHBvcyA9IE5FSUdIQk9VUkhPT0RbaV07XG4gICAgICAgICAgICB2YXIgeCA9IGNlbGwueCArIHBvc1swXTtcbiAgICAgICAgICAgIHZhciB5ID0gY2VsbC55ICsgcG9zWzFdO1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHZhciB3b3JsZFBvcyA9IHRoaXMud29ybGQuY2VsbHNbeF1beV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod29ybGRQb3MgaW5zdGFuY2VvZiBDZWxsKXtcbiAgICAgICAgICAgICAgICBtYXNrID0gbWFzayB8IE1hdGgucG93KDIsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXNrO1xuICAgIH1cblxuICAgIGdyb3coKXtcbiAgICAgICAgdGhpcy5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgLy8gNTAlIGNoYW5jZSB0byBncm93XG4gICAgICAgICAgICBpZihNYXRoLnJhbmRvbSgpID4gMC44KXtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VzID0gdGhpcy5nZXRHcm93RGlyZWN0aW9uKGNlbGwpO1xuICAgICAgICAgICAgICAgIGlmKHNwYWNlcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHNwYWNlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqc3BhY2VzLmxlbmd0aCldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlyZWN0aW9uICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIGFjdGlvbihnZW5vbWVJbnRlcnByZXRlcil7XG4gICAgICAgIHRoaXMuY2VsbHMuZm9yRWFjaChmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgICAgIHZhciBydWxlcyA9IGdlbm9tZUludGVycHJldGVyLmludGVycHJldCh0aGlzLmdlbm9tZSk7XG4gICAgICAgICAgICB2YXIgbWFzayA9IHRoaXMuZ2V0TmVpZ2hib3VyaG9vZChjZWxsKTtcbiAgICAgICAgICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSl7XG4gICAgICAgICAgICAgICAgaWYgKHJ1bGUubWFzayA9PT0gbWFzayl7XG4gICAgICAgICAgICAgICAgICAgIHJ1bGUuYWN0aW9uLmV4ZWN1dGUodGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR3JvdyB0aGUgcGxhbnQgYnkgb25lIGNlbGxcbiAgICAgKiBAcGFyYW0geyp9IGNlbGwgdGhlIGNlbGwgdG8gZ3JvdyBmcm9tXG4gICAgICogQHBhcmFtIHsqfSBkaXJlY3Rpb24gdGhlIGRpcmVjdGlvbiB0byBncm93IGluXG4gICAgICovXG4gICAgZ3Jvd0Zyb21DZWxsKGNlbGwsIGRpcmVjdGlvbil7XG4gICAgICAgIHZhciBuZXdfY2VsbCA9IG5ldyBDZWxsKHRoaXMsIGNlbGwueCtkaXJlY3Rpb25bMF0sIGNlbGwueStkaXJlY3Rpb25bMV0pO1xuICAgICAgICB0aGlzLmNlbGxzLnB1c2gobmV3X2NlbGwpO1xuICAgICAgICB0aGlzLndvcmxkLmFkZENlbGwobmV3X2NlbGwpO1xuICAgIH1cblxuICAgIGRyYXcoY3R4KSB7XG5cbiAgICB9XG59XG5cbmV4cG9ydCB7IFBsYW50IH07IiwiaW1wb3J0IHtQbGFudH0gZnJvbSBcIi4vcGxhbnQuanNcIjtcbmltcG9ydCB7Qnl0ZUFycmF5LCBHZW5vbWVJbnRlcnByZXRlcn0gZnJvbSBcIi4vZ2Vub21lLmpzXCI7XG5cbmNsYXNzIFdvcmxkIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KXtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgICAgICB0aGlzLmNlbGxzID0gW107XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMud2lkdGg7IGkrKyl7XG4gICAgICAgICAgICB0aGlzLmNlbGxzLnB1c2goW10pO1xuICAgICAgICAgICAgZm9yKHZhciBqPTA7IGo8dGhpcy5oZWlnaHQ7IGorKyl7XG4gICAgICAgICAgICAgICAgdGhpcy5jZWxsc1tpXVtqXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYW50cyA9IFtdO1xuICAgICAgICB0aGlzLmdlbm9tZUludGVycHJldGVyID0gbmV3IEdlbm9tZUludGVycHJldGVyKClcbiAgICB9XG5cbiAgICBzZWVkKHgpe1xuICAgICAgICAvLyBDcmVhdGUgYSBuZXcgcGxhbnQgc2VlZCBvbiB0aGUgd29ybGQgZmxvb3JcbiAgICAgICAgdmFyIGcgPSBCeXRlQXJyYXkucmFuZG9tKDIwKTtcbiAgICAgICAgdmFyIHBsYW50ID0gbmV3IFBsYW50KHgsIHRoaXMsIGcpO1xuICAgICAgICB0aGlzLnBsYW50cy5wdXNoKHBsYW50KTtcbiAgICAgICAgdGhpcy5jZWxsc1t4XVswXSA9IHBsYW50LmNlbGxzWzBdO1xuICAgIH1cblxuICAgIGdldENlbGwoeCwgeSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjZWxsID0gdGhpcy5jZWxsc1t4XVt5XTtcbiAgICAgICAgICAgIGlmKGNlbGwgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNlbGxcbiAgICAgICAgfVxuICAgICAgICBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgXCJ3b3JsZCBjb29yZGluYXRlcyBvdXQgb2YgYm91bmRzIHdoZW4gYWRkaW5nIGNlbGxcIjtcbiAgICAgICAgfSBcbiAgICB9XG5cbiAgICBhZGRDZWxsKGNlbGwpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2VsbHNbY2VsbC54XVtjZWxsLnldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNlbGxzW2NlbGwueF1bY2VsbC55XSA9IGNlbGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBcIndvcmxkIGNvb3JkaW5hdGVzIG91dCBvZiBib3VuZHMgd2hlbiBhZGRpbmcgY2VsbFwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RlcCgpe1xuICAgICAgICB0aGlzLnBsYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBsYW50KXtcbiAgICAgICAgICAgIHBsYW50LmFjdGlvbih0aGlzLmdlbm9tZUludGVycHJldGVyKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgsIHdpZHRoLCBoZWlnaHQsIGNlbGxTaXplKXtcbiAgICAgICAgdGhpcy5wbGFudHMuZm9yRWFjaChmdW5jdGlvbihwbGFudCl7XG4gICAgICAgICAgICBwbGFudC5jZWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICAgICAgICAgIHZhciB4ID0gY2VsbC54ICogY2VsbFNpemU7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBjZWxsU2l6ZSAqICh0aGlzLmhlaWdodCAtIGNlbGwueSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJEcmF3IFwiICsgW3gsIHldKTtcbiAgICAgICAgICAgICAgICBjZWxsLmRyYXcoY3R4LCB4LCB5IC0gY2VsbFNpemUsIGNlbGxTaXplLCBcImdyYXlcIik7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuXG5leHBvcnQgeyBXb3JsZCB9OyJdLCJzb3VyY2VSb290IjoiIn0=