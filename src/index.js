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

$("#zoom-out").on("click", function () { fitScreen = false; zoomLevel = Math.max(0.1, zoomLevel - 0.25); applyZoom(); });
$("#zoom-in").on("click", function () { fitScreen = false; zoomLevel += 0.25; applyZoom(); });
$("#zoom-reset").on("click", function () { fitScreen = false; zoomLevel = 1.0; applyZoom(); });
$("#zoom-fit").on("click", function () { fitScreen = true; applyZoom(); });

// ── Web Worker ────────────────────────────────────────────────────────────────
const simWorker = new Worker(new URL('./simulation.worker.js', import.meta.url), { type: 'module' });

simWorker.onmessage = function (event) {
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
            handleExportedGenomes(msg.bundle);
            break;
    }
};

simWorker.onerror = function (e) {
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
        data: {
            labels: [], datasets: [
                { label: 'Plants', data: [], borderColor: '#8dc63f', backgroundColor: 'rgba(141, 198, 63, 0.1)' },
                { label: 'Total Cells', data: [], borderColor: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.1)' },
                { label: 'Energised Cells', data: [], borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' }
            ]
        },
        options: commonOptions
    });

    charts.plantSize = new Chart(document.getElementById('chart-plant-size'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Plant Size', data: [], borderColor: '#38bdf8' }] },
        options: commonOptions
    });

    charts.plantHeight = new Chart(document.getElementById('chart-plant-height'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Plant Height', data: [], borderColor: '#fb923c' }] },
        options: commonOptions
    });

    charts.genomeSize = new Chart(document.getElementById('chart-genome-size'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Genome Size', data: [], borderColor: '#f472b6' }] },
        options: commonOptions
    });

    charts.mutExp = new Chart(document.getElementById('chart-mut-exp'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Mut Exp', data: [], borderColor: '#c084fc' }] },
        options: commonOptions
    });

    charts.geneticDistance = new Chart(document.getElementById('chart-genetic-distance'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Mean Pairwise Distance', data: [], borderColor: '#facc15' }] },
        options: commonOptions
    });

    charts.alleleEntropy = new Chart(document.getElementById('chart-allele-entropy'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Shannon Entropy (Bits)', data: [], borderColor: '#2dd4bf' }] },
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

canvas.addEventListener("click", function (event) {
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

    const generatePictogram = (state, eqMask, direction = null) => {
        const getCellHtml = (bitIndex, pos) => {
            let classes = ["pictogram-cell"];
            if (bitIndex === "center") {
                classes.push("center");
            } else {
                if (direction && direction[0] === pos[0] && direction[1] === pos[1]) {
                    classes.push("divide-target");
                } else {
                    const bitMask = Math.pow(2, bitIndex);
                    if (eqMask !== undefined) {
                        if ((eqMask & bitMask) === 0) {
                            classes.push("any");
                        } else if ((state & bitMask) !== 0) {
                            classes.push("filled");
                        }
                    } else {
                        if ((state & bitMask) !== 0) {
                            classes.push("filled");
                        }
                    }
                }
            }
            return `<div class="${classes.join(" ")}"></div>`;
        };

        return `
            <div class="pictogram">
                ${getCellHtml(5, [-1, 1])}${getCellHtml(6, [0, 1])}${getCellHtml(7, [1, 1])}
                ${getCellHtml(3, [-1, 0])}${getCellHtml("center", [0, 0])}${getCellHtml(4, [1, 0])}
                ${getCellHtml(0, [-1, -1])}${getCellHtml(1, [0, -1])}${getCellHtml(2, [1, -1])}
            </div>
        `;
    };

    // Header info
    cellinfo.append(`<p style="margin-bottom:8px"><strong>${msg.cellStr}</strong></p>`);

    // State pictogram
    const statePicHtml = generatePictogram(msg.cellState, undefined);
    let stateInfoHtml = `
        <div style="display:flex; align-items:center; margin-bottom:12px;">
            ${statePicHtml}
            <div>
                <div style="font-size:0.85em; color:var(--text-muted)">Current State</div>
                <div style="font-family:var(--font-mono); font-size:0.8em">Energised: ${msg.energised}</div>
            </div>
        </div>
    `;
    cellinfo.append(stateInfoHtml);

    // Plant details
    cellinfo.append(`
        <div style="font-size:0.85em; color:var(--text-muted); margin-bottom:12px;">
            <p style="margin:2px 0">Death Prob: ${msg.death}</p>
            <p style="margin:2px 0">Genome Length: ${msg.genomeLength} | Mut Exp: ${msg.mutExp}</p>
        </div>
    `);

    // Rules
    const rulesHeader = $(`
        <div>
            <div style="display:flex; align-items:center; margin-bottom:6px;">
                <div style="font-weight:600;">Genome Rules:</div>
                <div class="info-icon" style="margin-left:6px; font-size:0.8em; cursor:pointer;" title="Click to toggle explanation" id="toggle-rule-info">?</div>
            </div>
            <div id="rule-info-content" style="display:none; font-size:0.8em; color:var(--text-muted); background:rgba(255,255,255,0.05); padding:6px; border-radius:4px; margin-bottom:8px; line-height:1.4;">
                <div style="margin-bottom:4px"><strong>Pictogram Legend:</strong></div>
                <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px">
                    <div class="pictogram-cell filled" style="width:10px; height:10px; display:inline-block;"></div> Required filled space
                </div>
                <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px">
                    <div class="pictogram-cell any" style="width:10px; height:10px; display:inline-block;"></div> Ignored space (don't care)
                </div>
                <div style="display:flex; align-items:center; gap:4px; margin-bottom:2px">
                    <div class="pictogram-cell divide-target" style="width:10px; height:10px; display:inline-block;"></div> Divide target direction
                </div>
                <div style="margin-top:6px; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px;">
                    <strong>Highlighted rows</strong> indicate rules whose conditions match the current state. The first matched rule will be executed next step if the cell has energy.
                </div>
            </div>
        </div>
    `);

    rulesHeader.find("#toggle-rule-info").on("click", function () {
        rulesHeader.find("#rule-info-content").toggle();
    });

    cellinfo.append(rulesHeader);

    const rulesContainer = $('<div style="max-height: 250px; overflow-y: auto; padding-right: 4px;"></div>');
    msg.rules.forEach(function (r) {
        const pic = generatePictogram(r.state, r.eqMask, r.direction);
        const matchClass = r.matches ? "matching" : "";
        const ruleHtml = `
            <div class="rule-item ${matchClass}">
                ${pic}
                <span>#${r.index}</span>
                <span class="rule-action">${r.actionType}</span>
            </div>
        `;
        rulesContainer.append(ruleHtml);
    });
    cellinfo.append(rulesContainer);
}

// ── Controls ──────────────────────────────────────────────────────────────────
let run = false;

document.querySelector("#step").addEventListener("click", function () {
    simWorker.postMessage({ type: "step" });
});

$("#run").on("click", function () {
    run = !run;
    $(this).text(run ? "Stop" : "Run");
    $(this).toggleClass("btn-success btn-danger");
    simWorker.postMessage({ type: run ? "start" : "stop" });
});

// Track whether the form params are in sync with the running simulation
let activeParams = null;  // params actually used by the running sim

function markParamsDirty() {
    if (!activeParams) return;
    const currentJson = $("#params").val();
    const isDirty = currentJson !== JSON.stringify(activeParams, null, 4);
    $("#params-dirty-badge").toggle(isDirty);
    // Apply amber glow to the params toggle button as a subtle indicator
    $("#toggle-params").toggleClass("params-panel-dirty", isDirty);
}

$("#reload").on("click", function () {
    if (run) {
        run = false;
        $("#run").text("Run").removeClass("btn-danger").addClass("btn-success");
        simWorker.postMessage({ type: "stop" });
    }
    reloadSim();
});

$("#btn-apply-restart").on("click", function () {
    if (run) {
        run = false;
        $("#run").text("Run").removeClass("btn-danger").addClass("btn-success");
        simWorker.postMessage({ type: "stop" });
    }
    applyAndRestart();
});

$("#toggle-display").on("click", function () {
    $("#display-content").toggleClass("hidden");
    $(this).find(".toggle-icon").toggleClass("rotated");
});

$("#toggle-params").on("click", function () {
    $("#params-content").toggleClass("hidden");
    $(this).find(".toggle-icon").toggleClass("rotated");
});

// ── Disturbance console ───────────────────────────────────────────────────────
$("#toggle-disturbance").on("click", function () {
    $("#disturbance-content").toggleClass("hidden");
    $(this).find(".toggle-icon").toggleClass("rotated");
});

$("#disturb-now").on("click", function () {
    simWorker.postMessage({
        type: "disturb",
        strength: Number($("#d-strength").val())
    });
});

$("#steps-per-frame, #record-interval").on("input change", function () {
    simWorker.postMessage({
        type: "updateDisplayParams",
        steps_per_frame: Number($("#steps-per-frame").val()) || 1,
        record_interval: Number($("#record-interval").val()) || 10
    });
});

// ── Genome panel ──────────────────────────────────────────────────────────────
$("#toggle-genomes").on("click", function () {
    const content = $("#genomes-content");
    const isHidden = content.css("display") === "none";
    content.css("display", isHidden ? "block" : "none");
    $(this).find(".toggle-icon").text(isHidden ? "▼" : "▶");
});

$("#btn-export-genomes").on("click", function () {
    $("#genomes-status").text("Exporting...");
    simWorker.postMessage({ type: "export" });
});

function handleExportedGenomes(bundle) {
    // Write the bundle as formatted JSON into the textarea
    $("#genome-textarea").val(JSON.stringify(bundle, null, 2));
    $("#genomes-status").text(`Exported ${bundle.genomes.length} unique genome${bundle.genomes.length === 1 ? "" : "s"}.`);
}

$("#btn-import-genomes").on("click", function () {
    const raw = $("#genome-textarea").val().trim();
    if (!raw) {
        $("#genomes-status").text("No genomes to import.");
        return;
    }

    // Try to parse as JSON bundle (new format)
    let genomeLines = [];
    let bundleActionMap = null;
    let bundleInterpreter = null;
    try {
        const bundle = JSON.parse(raw);
        if (bundle.genomes && Array.isArray(bundle.genomes)) {
            genomeLines = bundle.genomes;
            bundleActionMap = bundle.action_map || null;
            bundleInterpreter = bundle.genome_interpreter || null;
        } else {
            throw new Error("Not a genome bundle");
        }
    } catch (e) {
        // Fall back: treat as plain-text one-genome-per-line (legacy format)
        genomeLines = raw.split("\n").map(s => s.trim()).filter(s => s.length > 0);
    }

    if (genomeLines.length === 0) {
        $("#genomes-status").text("No genomes found in the textarea.");
        return;
    }

    // Check for action_map / interpreter mismatch
    if (bundleActionMap || bundleInterpreter) {
        const currentParams = JSON.parse($("#params").val());
        const amMismatch = bundleActionMap &&
            JSON.stringify(bundleActionMap) !== JSON.stringify(currentParams.action_map);
        const interpMismatch = bundleInterpreter &&
            bundleInterpreter !== currentParams.genome_interpreter;

        if (amMismatch || interpMismatch) {
            const details = [];
            if (amMismatch) details.push(`action_map: [${bundleActionMap}]`);
            if (interpMismatch) details.push(`interpreter: ${bundleInterpreter}`);

            const msg = `⚠️ Parameter mismatch detected.\n\nThe imported genomes use:\n${details.join("\n")}\n\nUpdate simulation parameters to match? (Otherwise, bytes will be reinterpreted under current settings)`;

            if (confirm(msg)) {
                const params = JSON.parse($("#params").val());
                if (bundleActionMap) params.action_map = bundleActionMap;
                if (bundleInterpreter) params.genome_interpreter = bundleInterpreter;
                $("#params").val(JSON.stringify(params, null, 4));
                updateWidgetsFromJson();
                $("#genomes-status").text("Updated parameters to match imported genomes.");
            }
        }
    }

    const proceed = () => {
        if (run) {
            run = false;
            $("#run").text("Run").removeClass("btn-danger").addClass("btn-success");
            simWorker.postMessage({ type: "stop" });
        }
        $("#genomes-status").text(`Seeding simulation with ${genomeLines.length} genome${genomeLines.length === 1 ? "" : "s"}...`);
        const params = JSON.parse($("#params").val());
        activeParams = params;
        initCharts();
        simWorker.postMessage({ type: "init", params: prepareWorkerParams(params), genomes: genomeLines });
        markParamsDirty();
    };

    proceed();
});

$("#btn-copy-genomes").on("click", function () {
    const text = $("#genome-textarea").val();
    navigator.clipboard.writeText(text).then(() => {
        const btn = $(this);
        btn.text("✅");
        setTimeout(() => btn.text("📋"), 1500);
    });
});

// ── Brush mode ────────────────────────────────────────────────────────────────

$("#brush-toggle").on("click", function () {
    brushMode = !brushMode;
    $(this).toggleClass("active");
    canvas.classList.toggle("brush-mode", brushMode);
});

canvas.addEventListener("mousedown", function (event) {
    if (!brushMode) return;
    isPainting = true;
    erasePlantAt(event);
});

canvas.addEventListener("mousemove", function (event) {
    if (!brushMode || !isPainting) return;
    erasePlantAt(event);
});

canvas.addEventListener("mouseup", function () { isPainting = false; });
canvas.addEventListener("mouseleave", function () { isPainting = false; });

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

    $(".info-icon").on("click", function () {
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
        if (params.steps_per_frame !== undefined) $("#steps-per-frame").val(params.steps_per_frame);
        if (params.record_interval !== undefined) $("#record-interval").val(params.record_interval);
    } catch (e) { /* ignore invalid JSON */ }
}

function updateJsonFromWidgets() {
    try {
        let params = {};
        try { params = JSON.parse($("#params").val()); } catch (e) { }
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
        params.steps_per_frame = Number($("#steps-per-frame").val());
        params.record_interval = Number($("#record-interval").val());
        $("#params").val(JSON.stringify(params, null, 4));
    } catch (e) { console.error(e); }
}

$("#params").on("input", function () { updateWidgetsFromJson(); markParamsDirty(); });
$("#params-form").on("input change", ".widget-input", function () { updateJsonFromWidgets(); markParamsDirty(); });
$("#d-interval, #d-strength, #steps-per-frame, #record-interval").on("input change", function () { updateJsonFromWidgets(); markParamsDirty(); });

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

// ── Reload / Restart ──────────────────────────────────────────────────────────
function prepareWorkerParams(params) {
    return {
        ...params,
        cellSize: cellSize,
        steps_per_frame: Number($("#steps-per-frame").val()) || 1,
        record_interval: Number($("#record-interval").val()) || 10
    };
}

function reloadSim() {
    if (!activeParams) {
        applyAndRestart();
        return;
    }
    // Restart with CURRENTLY ACTIVE parameters (not necessarily what is in the form)
    initCharts();
    simWorker.postMessage({ type: "init", params: prepareWorkerParams(activeParams) });
    markParamsDirty();
}

function applyAndRestart() {
    // Read new parameters from the form/JSON panel
    try {
        const params = JSON.parse($("#params").val());
        activeParams = params;
        initCharts();
        simWorker.postMessage({ type: "init", params: prepareWorkerParams(activeParams) });
        markParamsDirty();
    } catch (e) {
        alert("Invalid JSON in parameters. Please fix before applying.");
    }
}

applyAndRestart();
