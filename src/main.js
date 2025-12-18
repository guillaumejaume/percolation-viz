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
let model = new PercolationModel(parseInt(gridSizeSlider.value, 10));

function updateLabels() {
  gridSizeLabel.textContent = `${gridSizeSlider.value} × ${gridSizeSlider.value}`;
  probLabel.textContent = probSlider.value;
}

function updateStatus() {
  const percolates = model.percolates();
  statusPercolates.textContent = percolates ? "Oui" : "Non";
  statusPercolates.style.color = percolates ? "#22c55e" : "#f97316";
  statusOpenCount.textContent = model.openCount.toString();

  // Met à jour le seuil théorique en fonction du type de grille sélectionné.
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
  renderer.drawSquareGrid(model);
  updateStatus();
}

function resetModel() {
  const size = parseInt(gridSizeSlider.value, 10);
  model.reset(size);
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
  const size = model.size;
  const row = Math.floor(idx / size);
  const col = idx % size;
  model.openSite(row, col);
  redraw();
});

btnReset.addEventListener("click", () => {
  resetModel();
});

// Currently only square grid is implemented; the dropdown is future-proofed.
gridTypeSelect.addEventListener("change", () => {
  // For now, re-use the same square model and redraw.
  resetModel();
});

// Initial
updateLabels();
resetModel();


