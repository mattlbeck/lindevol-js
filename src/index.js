import 'bootstrap';
import $ from "jquery";
import { Chart, registerables } from 'chart.js';
import { paramInfo } from "./paramInfo.js";
import { SimulationParams } from "./simulation.js";

Chart.register(...registerables);
Chart.defaults.color = '#9ba892';
Chart.defaults.borderColor = 'rgba(181, 204, 168, 0.15)';

// ── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.querySelector("#mainbox");
const ctx = canvas.getContext("2d");
const cellSize = 8;

// ── Web Worker ────────────────────────────────────────────────────────────────
const simWorker = new Worker(new URL('./simulation.worker.js', import.meta.url), { type: 'module' });

simWorker.onmessage = function(event) {
    const msg = event.data;
    switch (msg.type) {
    case "frame":
        renderFrame(msg);
        break;
    case "stats":
        updateCharts(msg.data, msg.stepnum);
        updateStats(msg.stepnum);
        break;
    case "cellInfo":
        renderCellInfo(msg);
        break;
    }
};

simWorker.onerror = function(e) {
    console.error("Worker error:", e);
};

// ── Charts ────────────────────────────────────────────────────────────────────
let charts = {};

function initCharts() {
    Object.values(charts).forEach(c => c.destroy());

    const commonOptions = {
        responsive: true,
        animation: false,
        elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
        scales: { x: { display: true }, y: { display: true } },
        plugins: { legend: { display: true, position: 'top' } }
    };

    charts.population = new Chart(document.getElementById('chart-population'), {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Plants', data: [], borderColor: '#8dc63f', backgroundColor: 'rgba(141, 198, 63, 0.1)' },
            { label: 'Total Cells', data: [], borderColor: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.1)' },
            { label: 'Energised Cells', data: [], borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' }
        ]},
        options: commonOptions
    });

    charts.plantSize = new Chart(document.getElementById('chart-plant-size'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Plant Size', data: [], borderColor: '#38bdf8' }]},
        options: commonOptions
    });

    charts.plantHeight = new Chart(document.getElementById('chart-plant-height'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Plant Height', data: [], borderColor: '#fb923c' }]},
        options: commonOptions
    });

    charts.genomeSize = new Chart(document.getElementById('chart-genome-size'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Genome Size', data: [], borderColor: '#f472b6' }]},
        options: commonOptions
    });

    charts.mutExp = new Chart(document.getElementById('chart-mut-exp'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Mut Exp', data: [], borderColor: '#c084fc' }]},
        options: commonOptions
    });
}

function updateCharts(data, stepnum) {
    const steps = data["stepnum"];

    charts.population.data.labels = steps;
    charts.population.data.datasets[0].data = data["population"];
    charts.population.data.datasets[1].data = data["total_cells"];
    charts.population.data.datasets[2].data = data["energised_cells"];
    charts.population.update();

    charts.plantSize.data.labels = steps;
    charts.plantSize.data.datasets[0].data = data["plant_size_mean"];
    charts.plantSize.update();

    charts.plantHeight.data.labels = steps;
    charts.plantHeight.data.datasets[0].data = data["plant_height_mean"];
    charts.plantHeight.update();

    charts.genomeSize.data.labels = steps;
    charts.genomeSize.data.datasets[0].data = data["genome_size_mean"];
    charts.genomeSize.update();

    charts.mutExp.data.labels = steps;
    charts.mutExp.data.datasets[0].data = data["mut_exp_mean"];
    charts.mutExp.update();
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderFrame(msg) {
    const { buffer, width, height, cellCount, stepnum } = msg;
    canvas.width = width;
    canvas.height = height;

    const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
    ctx.putImageData(imageData, 0, 0);

    document.querySelector("#cellnum").textContent = cellCount;
}

function updateStats(stepnum) {
    document.querySelector("#stepnum").textContent = stepnum;
}

// ── Cell info ─────────────────────────────────────────────────────────────────
let brushMode = false;
let isPainting = false;
let selectedCell = null;

canvas.addEventListener("click", function(event) {
    if (brushMode) return; // brush mode handles its own mouse events
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const cellx = Math.floor(x / cellSize);
    const celly = Math.floor((canvas.height - y) / cellSize);

    selectedCell = [cellx, celly];
    simWorker.postMessage({ type: "getCell", x: cellx, y: celly });
});

function renderCellInfo(msg) {
    const cellinfo = $("#cellinfo");
    if (!msg.found) {
        selectedCell = null;
        cellinfo.html("Click a cell to see info...");
        return;
    }
    cellinfo.empty();
    cellinfo.append(`<p>${msg.cellStr}</p><p>Neighbourhood: ${msg.neighbourhood}</p><p>Rule: ${msg.matching_rule}</p>`);
    cellinfo.append(`<p>Plant death prob ${msg.death} genome length ${msg.genomeLength}</p>`);
    cellinfo.append(`<p>mut exponent: ${msg.mutExp}</p>`);
    msg.rules.forEach(function(r) {
        cellinfo.append(`<p>${r}</p>`);
    });
}

// ── Controls ──────────────────────────────────────────────────────────────────
let run = false;

document.querySelector("#step").addEventListener("click", function() {
    simWorker.postMessage({ type: "step" });
});

$("#run").on("click", function() {
    run = !run;
    $(this).text(run ? "Stop" : "Run");
    $(this).toggleClass("btn-success btn-danger");
    simWorker.postMessage({ type: run ? "start" : "stop" });
});

$("#reload").on("click", function() {
    if (run) {
        run = false;
        $("#run").text("Run").removeClass("btn-danger").addClass("btn-success");
        simWorker.postMessage({ type: "stop" });
    }
    reloadSim();
});

$("#toggle-params").on("click", function() {
    $("#params-content").toggleClass("hidden");
    $(this).find(".toggle-icon").toggleClass("rotated");
});

// ── Disturbance console ───────────────────────────────────────────────────────
$("#toggle-disturbance").on("click", function() {
    $("#disturbance-content").toggleClass("hidden");
    $(this).find(".toggle-icon").toggleClass("rotated");
});

$("#apply-disturbance").on("click", function() {
    simWorker.postMessage({
        type: "updateDisturbance",
        interval: Number($("#d-interval").val()),
        strength: Number($("#d-strength").val())
    });
});

$("#disturb-now").on("click", function() {
    simWorker.postMessage({
        type: "disturb",
        strength: Number($("#d-strength").val())
    });
});

// ── Brush mode ────────────────────────────────────────────────────────────────

$("#brush-toggle").on("click", function() {
    brushMode = !brushMode;
    $(this).toggleClass("active");
    canvas.classList.toggle("brush-mode", brushMode);
});

canvas.addEventListener("mousedown", function(event) {
    if (!brushMode) return;
    isPainting = true;
    erasePlantAt(event);
});

canvas.addEventListener("mousemove", function(event) {
    if (!brushMode || !isPainting) return;
    erasePlantAt(event);
});

canvas.addEventListener("mouseup", function() { isPainting = false; });
canvas.addEventListener("mouseleave", function() { isPainting = false; });

function erasePlantAt(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cellx = Math.floor(x / cellSize);
    const celly = Math.floor((canvas.height - y) / cellSize);
    simWorker.postMessage({ type: "killCell", x: cellx, y: celly });
}

// ── Parameter widgets ─────────────────────────────────────────────────────────
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
            actionMapHtml = `<div class="action-map-grid">${labelHtml}`;
            param.labels.forEach((al, idx) => {
                actionMapHtml += `
                    <div class="form-group">
                        <label>${al}</label>
                        <input type="number" id="w_am_${idx}" class="form-control widget-input action-map-input">
                    </div>`;
            });
            actionMapHtml += `</div>`;
        }
    });

    $("#params-form").html(html + actionMapHtml);

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
            if (params[id] !== undefined) $(`#w_${id}`).val(params[id]);
        });
        if (params.action_map && params.action_map.length === 6) {
            for (let i = 0; i < 6; i++) $(`#w_am_${i}`).val(params.action_map[i]);
        }
    } catch(e) { /* ignore invalid JSON */ }
}

function updateJsonFromWidgets() {
    try {
        let params = {};
        try { params = JSON.parse($("#params").val()); } catch(e) {}
        widgetIds.forEach(id => {
            let val = $(`#w_${id}`).val();
            if (!isNaN(val) && val.trim() !== "") val = Number(val);
            params[id] = val;
        });
        const action_map = [];
        for (let i = 0; i < 6; i++) action_map.push(Number($(`#w_am_${i}`).val()));
        params.action_map = action_map;
        $("#params").val(JSON.stringify(params, null, 4));
    } catch(e) { console.error(e); }
}

$("#params").on("input", function() { updateWidgetsFromJson(); });
$("#params-form").on("input change", ".widget-input", function() { updateJsonFromWidgets(); });

// ── Defaults ──────────────────────────────────────────────────────────────────
const params_p = new SimulationParams({
    "steps_per_frame": 1,
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

$("#params").val(JSON.stringify(params_p, null, 4));
updateWidgetsFromJson();

// ── Reload ────────────────────────────────────────────────────────────────────
function reloadSim() {
    const params = JSON.parse($("#params").val());
    params.cellSize = cellSize;
    initCharts();
    simWorker.postMessage({ type: "init", params });
}

reloadSim();
