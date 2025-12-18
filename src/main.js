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
const btnSimulate = document.getElementById("btn-simulate");
const statusPercolates = document.getElementById("status-percolates");
const statusOpenCount = document.getElementById("status-open-count");
const statusThreshold = document.getElementById("status-threshold");
const celebration = document.getElementById("celebration");

const renderer = new Renderer(canvas);
let model = new PercolationModel(parseInt(gridSizeSlider.value, 10), gridTypeSelect.value);
let wasPercolating = false;
let isSimulating = false;
let simulationInterval = null;
let animationQueue = [];

function updateLabels() {
  gridSizeLabel.textContent = `${gridSizeSlider.value} × ${gridSizeSlider.value}`;
  probLabel.textContent = probSlider.value;
}

function updateStatus() {
  const percolates = model.percolates();
  statusPercolates.textContent = percolates ? "Oui" : "Non";
  statusPercolates.style.color = percolates ? "#22c55e" : "#f97316";
  statusOpenCount.textContent = model.openCount.toString();

  // Détecter quand la percolation se produit pour la célébration
  if (percolates && !wasPercolating) {
    triggerCelebration();
  }
  wasPercolating = percolates;

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

function triggerCelebration() {
  celebration.classList.remove("hidden");
  setTimeout(() => {
    celebration.classList.add("hidden");
  }, 2000);
}

function redraw(animated = false) {
  if (animated && animationQueue.length > 0) {
    processAnimationQueue();
  } else {
    renderer.draw(model);
    updateStatus();
  }
}

async function processAnimationQueue() {
  const batch = animationQueue.splice(0, 10); // Traiter par lots de 10
  for (const { row, col } of batch) {
    model.openSite(row, col);
    renderer.draw(model);
    updateStatus();
    await new Promise(resolve => setTimeout(resolve, 20)); // 20ms entre chaque site
  }
  if (animationQueue.length > 0) {
    requestAnimationFrame(() => processAnimationQueue());
  } else {
    renderer.draw(model);
    updateStatus();
  }
}

function resetModel() {
  stopSimulation();
  animationQueue = [];
  wasPercolating = false;
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
  if (isSimulating) return;
  const p = parseFloat(probSlider.value);
  stopSimulation();
  
  // Animation progressive
  model.reset(model.size, model.gridType);
  renderer.draw(model);
  updateStatus();
  
  const allCoords = model.getAllCoordinates();
  const sitesToOpen = [];
  for (const [row, col] of allCoords) {
    if (Math.random() < p) {
      sitesToOpen.push({ row, col });
    }
  }
  
  // Mélanger pour animation aléatoire
  for (let i = sitesToOpen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sitesToOpen[i], sitesToOpen[j]] = [sitesToOpen[j], sitesToOpen[i]];
  }
  
  animationQueue = sitesToOpen;
  processAnimationQueue();
});

btnStep.addEventListener("click", () => {
  if (isSimulating) return;
  stopSimulation();
  const closed = model.closedSites();
  if (closed.length === 0) return;
  const idx = closed[Math.floor(Math.random() * closed.length)];
  
  // Convert index to coordinates based on grid type
  let row, col;
  if (model.gridType === "hex") {
    // For hex, use the stored coordinates
    const coords = model.getAllCoordinates();
    if (idx < coords.length) {
      [row, col] = coords[idx];
    } else {
      return;
    }
  } else {
    // For square/triangular, simple conversion
    row = Math.floor(idx / model.size);
    col = idx % model.size;
  }
  
  // Animation d'ouverture
  animationQueue = [{ row, col }];
  processAnimationQueue();
});

btnReset.addEventListener("click", () => {
  stopSimulation();
  resetModel();
});

gridTypeSelect.addEventListener("change", () => {
  resetModel();
});

btnSimulate.addEventListener("click", () => {
  if (isSimulating) {
    stopSimulation();
  } else {
    startSimulation();
  }
});

function startSimulation() {
  if (isSimulating) return;
  isSimulating = true;
  btnSimulate.textContent = "Arrêter";
  btnSimulate.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
  
  model.reset(model.size, model.gridType);
  renderer.draw(model);
  updateStatus();
  
  let currentP = 0;
  const targetP = 1;
  const step = 0.01;
  const delay = 100; // ms entre chaque étape
  
  simulationInterval = setInterval(() => {
    currentP += step;
    if (currentP > targetP) {
      stopSimulation();
      return;
    }
    
    probSlider.value = currentP.toFixed(2);
    updateLabels();
    
    // Ouvrir des sites progressivement
    const allCoords = model.getAllCoordinates();
    const closed = model.closedSites();
    if (closed.length === 0) {
      stopSimulation();
      return;
    }
    
    // Ouvrir quelques sites à chaque étape pour animation fluide
    const sitesToOpenThisStep = Math.max(1, Math.floor(closed.length * step * 2));
    for (let i = 0; i < sitesToOpenThisStep && closed.length > 0; i++) {
      const randomIdx = Math.floor(Math.random() * closed.length);
      const siteIdx = closed[randomIdx];
      
      let row, col;
      if (model.gridType === "hex") {
        const coords = model.getAllCoordinates();
        if (siteIdx < coords.length) {
          [row, col] = coords[siteIdx];
        } else {
          continue;
        }
      } else {
        row = Math.floor(siteIdx / model.size);
        col = siteIdx % model.size;
      }
      
      model.openSite(row, col);
    }
    
    redraw();
  }, delay);
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  isSimulating = false;
  btnSimulate.textContent = "Simulation";
  btnSimulate.style.background = "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #22c55e 100%)";
}

// Gestion des tooltips avec position fixe
function setupTooltips() {
  const tooltipTriggers = document.querySelectorAll('.tooltip-trigger, button[data-tooltip]');
  
  tooltipTriggers.forEach(trigger => {
    const tooltipText = trigger.getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    // Créer un élément tooltip
    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'tooltip-popup';
    tooltipDiv.textContent = tooltipText;
    document.body.appendChild(tooltipDiv);
    
    const isButton = trigger.tagName === 'BUTTON';
    let mouseMoveHandler = null;
    
    trigger.addEventListener('mouseenter', () => {
      tooltipDiv.style.display = 'block';
      
      if (isButton) {
        // Pour les boutons, suivre le curseur en bas à droite
        mouseMoveHandler = (e) => {
          const offset = 10; // Distance du curseur
          tooltipDiv.style.left = `${e.clientX + offset}px`;
          tooltipDiv.style.top = `${e.clientY + offset}px`;
          tooltipDiv.style.transform = 'none'; // Pas de centrage pour les boutons
        };
        document.addEventListener('mousemove', mouseMoveHandler);
      } else {
        // Pour les autres tooltips, positionner au-dessus du trigger
        const rect = trigger.getBoundingClientRect();
        const tooltipRect = tooltipDiv.getBoundingClientRect();
        const left = rect.left + (rect.width / 2);
        const top = rect.top - tooltipRect.height - 8;
        tooltipDiv.style.left = `${left}px`;
        tooltipDiv.style.top = `${top}px`;
        tooltipDiv.style.transform = 'translateX(-50%)';
      }
    });
    
    trigger.addEventListener('mouseleave', () => {
      tooltipDiv.style.display = 'none';
      if (mouseMoveHandler) {
        document.removeEventListener('mousemove', mouseMoveHandler);
        mouseMoveHandler = null;
      }
    });
  });
}

// Initial
updateLabels();
resetModel();
setupTooltips();


