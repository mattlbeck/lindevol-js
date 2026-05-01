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

let zoomLevel = 1.0;
let fitScreen = false;

function applyZoom() {
    if (fitScreen) {
        canvas.style.width = "100%";
        canvas.style.height = "auto";
    } else {
        canvas.style.width = `${canvas.width * zoomLevel}px`;
        canvas.style.height = `${canvas.height * zoomLevel}px`;
    }
}

$("#zoom-out").on("click", function() { fitScreen = false; zoomLevel = Math.max(0.1, zoomLevel - 0.25); applyZoom(); });
$("#zoom-in").on("click", function() { fitScreen = false; zoomLevel += 0.25; applyZoom(); });
$("#zoom-reset").on("click", function() { fitScreen = false; zoomLevel = 1.0; applyZoom(); });
$("#zoom-fit").on("click", function() { fitScreen = true; applyZoom(); });

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
    case "exportedGenomes":
        handleExportedGenomes(msg.genomes);
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

    charts.geneticDistance = new Chart(document.getElementById('chart-genetic-distance'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Pairwise Distance', data: [], borderColor: '#facc15' }]},
        options: commonOptions
    });

    charts.alleleEntropy = new Chart(document.getElementById('chart-allele-entropy'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Shannon Entropy (Bits)', data: [], borderColor: '#2dd4bf' }]},
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

    charts.geneticDistance.data.labels = steps;
    charts.geneticDistance.data.datasets[0].data = data["genetic_distance_mean"];
    charts.geneticDistance.update();

    charts.alleleEntropy.data.labels = steps;
    charts.alleleEntropy.data.datasets[0].data = data["allele_entropy"];
    charts.alleleEntropy.update();
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderFrame(msg) {
    const { buffer, width, height, cellCount, stepnum } = msg;
    canvas.width = width;
    canvas.height = height;
    
    applyZoom();

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const physicalX = (event.clientX - rect.left) * scaleX;
    const physicalY = (event.clientY - rect.top) * scaleY;

    const cellx = Math.floor(physicalX / cellSize);
    const celly = Math.floor((canvas.height - physicalY) / cellSize);

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

$("#toggle-display").on("click", function() {
    $("#display-content").toggleClass("hidden");
    $(this).find(".toggle-icon").toggleClass("rotated");
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

$("#disturb-now").on("click", function() {
    simWorker.postMessage({
        type: "disturb",
        strength: Number($("#d-strength").val())
    });
});

$("#steps-per-frame, #record-interval").on("input change", function() {
    simWorker.postMessage({
        type: "updateDisplayParams",
        steps_per_frame: Number($("#steps-per-frame").val()) || 1,
        record_interval: Number($("#record-interval").val()) || 10
    });
});

// ── Genome panel ──────────────────────────────────────────────────────────────
$("#toggle-genomes").on("click", function() {
    const content = $("#genomes-content");
    const isHidden = content.css("display") === "none";
    content.css("display", isHidden ? "block" : "none");
    $(this).find(".toggle-icon").text(isHidden ? "▼" : "▶");
});

$("#btn-export-genomes").on("click", function() {
    $("#genomes-status").text("Exporting...");
    simWorker.postMessage({ type: "export" });
});

function handleExportedGenomes(genomes) {
    $("#genome-textarea").val(genomes.join("\n"));
    $("#genomes-status").text(`Exported ${genomes.length} unique genome${genomes.length === 1 ? "" : "s"}.`);
}

$("#btn-import-genomes").on("click", function() {
    const lines = $("#genome-textarea").val().split("\n").map(s => s.trim()).filter(s => s.length > 0);
    if (lines.length === 0) {
        $("#genomes-status").text("No genomes to import.");
        return;
    }
    if (run) {
        run = false;
        $("#run").text("Run").removeClass("btn-danger").addClass("btn-success");
        simWorker.postMessage({ type: "stop" });
    }
    $("#genomes-status").text(`Seeding simulation with ${lines.length} genome${lines.length === 1 ? "" : "s"}...`);
    const params = JSON.parse($("#params").val());
    params.cellSize = cellSize;
    params.steps_per_frame = Number($("#steps-per-frame").val()) || 1;
    params.record_interval = Number($("#record-interval").val()) || 10;
    initCharts();
    simWorker.postMessage({ type: "init", params, genomes: lines });
});

$("#btn-copy-genomes").on("click", function() {
    const text = $("#genome-textarea").val();
    navigator.clipboard.writeText(text).then(() => {
        const btn = $(this);
        btn.text("✅");
        setTimeout(() => btn.text("📋"), 1500);
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const physicalX = (event.clientX - rect.left) * scaleX;
    const physicalY = (event.clientY - rect.top) * scaleY;
    const cellx = Math.floor(physicalX / cellSize);
    const celly = Math.floor((canvas.height - physicalY) / cellSize);
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
        if (params.disturbance_interval !== undefined) $("#d-interval").val(params.disturbance_interval);
        if (params.disturbance_strength !== undefined) $("#d-strength").val(params.disturbance_strength);
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
        params.disturbance_interval = Number($("#d-interval").val());
        params.disturbance_strength = Number($("#d-strength").val());
        $("#params").val(JSON.stringify(params, null, 4));
    } catch(e) { console.error(e); }
}

$("#params").on("input", function() { updateWidgetsFromJson(); });
$("#params-form").on("input change", ".widget-input", function() { updateJsonFromWidgets(); });
$("#d-interval, #d-strength").on("input change", function() { updateJsonFromWidgets(); });

// ── Defaults ──────────────────────────────────────────────────────────────────
const params_p = new SimulationParams({
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
    "energy_exp": -2.5,
    "disturbance_interval": 0,
    "disturbance_strength": 0.1
});

$("#params").val(JSON.stringify(params_p, null, 4));
updateWidgetsFromJson();

// ── Reload ────────────────────────────────────────────────────────────────────
function reloadSim() {
    const params = JSON.parse($("#params").val());
    params.cellSize = cellSize;
    params.steps_per_frame = Number($("#steps-per-frame").val()) || 1;
    params.record_interval = Number($("#record-interval").val()) || 10;
    initCharts();
    simWorker.postMessage({ type: "init", params });
}

reloadSim();
