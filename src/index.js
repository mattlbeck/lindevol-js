import 'bootstrap';
import {Simulation, SimulationParams} from "./simulation.js";
import {SimData} from "./simdata.js";
import { Cell } from "./cell.js";
import $ from "jquery";

var canvas = document.querySelector("#mainbox");
var ctx = canvas.getContext("2d");
var canvasOffset = 0.5;
ctx.translate(canvasOffset, canvasOffset);

// control
document.querySelector("#step").addEventListener("click", function (){
    simStep();
});
var run = false;
$("#run").on("click", function (){
    run = !run;
    $(this).text(run ? "Stop" : "Run");
    $(this).toggleClass("btn-success btn-danger");
    if(run){
        gameLoop();
    }
});
$("#reload").on("click", function(){
    reloadSim();
})

var selectedCell = null;

function updateCellFocus(){
    if (selectedCell !== null){
        var cell = simulation.world.getCell(selectedCell[0], selectedCell[1]);
        if (cell instanceof Cell && cell.plant && cell.plant.genome){
            try {
                var rules = simulation.genomeInterpreter.interpret(cell.plant.genome);
                var neighbourhood = cell.plant.getNeighbourhood(cell);
                var matching_rule = "None";
                for(var i=0; i<rules.length; i++){
                    if(rules[i].state === neighbourhood){
                        matching_rule = `#${i} ${rules[i]}`;
                    }
                }
                var death = cell.plant.getDeathProbability(simulation.params.death_factor, simulation.params.natural_exp, simulation.params.energy_exp, simulation.params.leanover_factor);
                var cellinfo = $("#cellinfo");
                cellinfo.empty();
                cellinfo.append(`<p>${cell.toString()}</p><p>Neighbourhood: ${neighbourhood}</p><p>Rule: ${matching_rule}</p>`);
                cellinfo.append(`<p>Plant death prob ${JSON.stringify(death)} genome length ${cell.plant.genome.length}</p>`);
                cellinfo.append(`<p>mut exponent:${cell.plant.genome.mut_exp}</p>`);
                rules.forEach(function(rule){
                    cellinfo.append(`<p>${rule.toString()}</p>`);
                });
            } catch (e) {
                console.error("Error updating cell focus:", e);
            }
        } else {
            selectedCell = null;
            $("#cellinfo").html("Click a cell to see info...");
        }
    }
}

canvas.addEventListener("click", function(event){
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    var cellx = Math.floor(x / cellSize);
    var celly = simulation.world.height - 1 - Math.floor(y / cellSize);

    var cell = simulation.world.getCell(cellx, celly);
    if (cell instanceof Cell){
        selectedCell = [cellx, celly];
        updateCellFocus();
    } else {
        selectedCell = null;
        $("#cellinfo").html("Click a cell to see info...");
    }
});

var cellSize = 8;

// Lindevol P params
var params_p = new SimulationParams({
    "world_width": 500,
    "initial_population": 500,
    "genome_interpreter": "promotor",
    "initial_genome_length": 50,
    "mut_replace_mode": "bytewise",
    "mut_replace": 0.002,
    "mut_insert": 0.0004,
    "mut_delete": 0.0004,
    "mut_factor": 1.5,
    "action_map": [32, 4, 4, 4, 4, 16],
    "death_factor": 0.32,
    "leanover_factor": 0.15,
    "energy_exp": -2.5
});

// Lindevol C params
var params_c = new SimulationParams({
    "genome_interpreter": "block",
    "initial_genome_length": 400,
    "mut_replace_mode": "bitwise",
    "mut_replace": 0.001,
    "action_map": [200, 21, 0, 18, 18, 0],
    "death_factor": 0.2
});

import { paramInfo } from "./paramInfo.js";

function buildWidgets() {
    let html = "";
    let actionMapHtml = "";
    
    paramInfo.forEach(param => {
        let attrs = "";
        for (let key in param.attrs) {
            attrs += ` ${key}="${param.attrs[key]}"`;
        }
        
        let labelHtml = `
            <div class="param-label-container">
                <label>${param.label}</label>
                <div class="info-icon" title="Toggle description">?</div>
            </div>
            <div class="param-description">${param.description}</div>
        `;

        let inputHtml = "";
        if (param.type === "select") {
            inputHtml = `<select id="w_${param.id}" class="custom-select widget-input"${attrs}>`;
            param.options.forEach(opt => {
                inputHtml += `<option value="${opt}">${opt}</option>`;
            });
            inputHtml += `</select>`;
            html += `<div class="form-group">${labelHtml}${inputHtml}</div>`;
        } else if (param.type === "number") {
            inputHtml = `<input type="number" id="w_${param.id}" class="form-control widget-input"${attrs}>`;
            html += `<div class="form-group">${labelHtml}${inputHtml}</div>`;
        } else if (param.type === "array") {
            actionMapHtml = `
                <div class="action-map-grid">
                    ${labelHtml}
            `;
            param.labels.forEach((al, idx) => {
                actionMapHtml += `
                    <div class="form-group">
                        <label>${al}</label>
                        <input type="number" id="w_am_${idx}" class="form-control widget-input action-map-input">
                    </div>
                `;
            });
            actionMapHtml += `</div>`;
        }
    });
    
    $("#params-form").html(html + actionMapHtml);
    
    // Bind toggle
    $(".info-icon").on("click", function() {
        $(this).parent().next(".param-description").toggleClass("show");
    });
}

buildWidgets();

const widgetIds = paramInfo.filter(p => p.type !== "array").map(p => p.id);

function updateWidgetsFromJson() {
    try {
        const params = JSON.parse($("#params").val());
        widgetIds.forEach(id => {
            if (params[id] !== undefined) {
                $(`#w_${id}`).val(params[id]);
            }
        });
        if (params.action_map && params.action_map.length === 6) {
            for(let i=0; i<6; i++) {
                $(`#w_am_${i}`).val(params.action_map[i]);
            }
        }
    } catch(e) {
        // ignore invalid JSON while typing
    }
}

function updateJsonFromWidgets() {
    try {
        let params = {};
        try { params = JSON.parse($("#params").val()); } catch(e) {}
        
        widgetIds.forEach(id => {
            let val = $(`#w_${id}`).val();
            if (!isNaN(val) && val.trim() !== "") {
                val = Number(val);
            }
            params[id] = val;
        });
        
        let action_map = [];
        for(let i=0; i<6; i++) {
            action_map.push(Number($(`#w_am_${i}`).val()));
        }
        params.action_map = action_map;
        
        $("#params").val(JSON.stringify(params, null, 4));
    } catch(e) {
        console.error(e);
    }
}

$("#params").on("input", function() {
    updateWidgetsFromJson();
});

// Since widgets are dynamically generated, use delegation or bind after build
$("#params-form").on("input change", ".widget-input", function() {
    updateJsonFromWidgets();
});

// Initialize with Lindevol P params
$("#params").val(JSON.stringify(params_p, null, 4));
updateWidgetsFromJson();

var simulation;
var data;
function reloadSim(){
    var params = JSON.parse($("#params").val());
    var sim_params = new SimulationParams(params);
    simulation = new Simulation(sim_params);
    data = new SimData(simulation);
    simulation.init_population();
    
    // dynamically resize canvas to match world size
    canvas.width = simulation.world.width * cellSize;
    canvas.height = simulation.world.height * cellSize;
    ctx.translate(canvasOffset, canvasOffset);

    drawScreen();
}


function drawScreen(){
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    simulation.world.draw(ctx, cellSize);
    ctx.restore();
}

function gameLoop(){
    simStep();
    if(run){
        window.requestAnimationFrame(gameLoop);
    }
}

function updateStats(){
    document.querySelector("#stepnum").textContent = simulation.stepnum;
}

function simStep(){
    simulation.step();
    data.recordStep();
    updateCellFocus();
    updateStats();
    drawScreen();
}

reloadSim()
gameLoop();
