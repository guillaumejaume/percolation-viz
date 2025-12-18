import { PercolationModel } from "./percolationModel.js";
import { Renderer } from "./renderer.js";

const canvas = document.getElementById("percolation-canvas");
const gridTypeSelect = document.getElementById("grid-type");
const gridSizeSlider = document.getElementById("grid-size");
const gridSizeLabel = document.getElementById("grid-size-label");
const probSlider = document.getElementById("occupation-prob");
const probLabel = document.getElementById("occupation-prob-label");
const btnRandomize = document.getElementById("btn-randomize");
const btnStep = document.getElementById("btn-step");
const btnReset = document.getElementById("btn-reset");
const statusPercolates = document.getElementById("status-percolates");
const statusOpenCount = document.getElementById("status-open-count");
const statusThreshold = document.getElementById("status-threshold");

const renderer = new Renderer(canvas);
let model = new PercolationModel(parseInt(gridSizeSlider.value, 10), gridTypeSelect.value);

function updateLabels() {
  gridSizeLabel.textContent = `${gridSizeSlider.value} × ${gridSizeSlider.value}`;
  probLabel.textContent = probSlider.value;
}

function updateStatus() {
  const percolates = model.percolates();
  statusPercolates.textContent = percolates ? "Oui" : "Non";
  statusPercolates.style.color = percolates ? "#22c55e" : "#f97316";
  statusOpenCount.textContent = model.openCount.toString();

  const type = gridTypeSelect.value;
  let text;
  if (type === "square") {
    text = "≈ 0,593 (grille carrée)";
  } else if (type === "triangular") {
    text = "0,5 (grille triangulaire)";
  } else if (type === "hex") {
    text = "≈ 0,697 (grille hexagonale)";
  } else {
    text = "—";
  }
  statusThreshold.textContent = text;
}

function redraw() {
  renderer.draw(model);
  updateStatus();
}

function resetModel() {
  const size = parseInt(gridSizeSlider.value, 10);
  const gridType = gridTypeSelect.value;
  model.reset(size, gridType);
  redraw();
}

// Event wiring
gridSizeSlider.addEventListener("input", () => {
  updateLabels();
  resetModel();
});

probSlider.addEventListener("input", () => {
  updateLabels();
});

btnRandomize.addEventListener("click", () => {
  const p = parseFloat(probSlider.value);
  model.randomize(p);
  redraw();
});

btnStep.addEventListener("click", () => {
  const closed = model.closedSites();
  if (closed.length === 0) return;
  const idx = closed[Math.floor(Math.random() * closed.length)];
  
  // Convert index to coordinates
  const coords = model.getAllCoordinates();
  if (idx < coords.length) {
    const [row, col] = coords[idx];
    model.openSite(row, col);
    redraw();
  }
});

btnReset.addEventListener("click", () => {
  resetModel();
});

gridTypeSelect.addEventListener("change", () => {
  resetModel();
});

// Initial
updateLabels();
resetModel();


