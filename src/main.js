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
const celebration = document.getElementById("celebration");

const renderer = new Renderer(canvas);
let model = new PercolationModel(parseInt(gridSizeSlider.value, 10), gridTypeSelect.value);
let wasPercolating = false;
let isSimulating = false;
let simulationInterval = null;
let animationQueue = [];
// Suivi de l'état de la simulation (valeur actuelle de p)
let simulationCurrentP = null;

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
  // Ajuster la taille du lot et le délai selon la taille de la grille
  // Plus la grille est grande, plus on traite de sites par lot et moins on attend
  const gridSize = model.size;
  const batchSize = Math.max(20, Math.floor(gridSize * 1.5)); // Beaucoup plus de sites par lot pour grandes grilles
  const delay = Math.max(0, Math.floor(15 - (gridSize - 10) * 0.3)); // Délai beaucoup plus réduit pour grandes grilles
  
  const batch = animationQueue.splice(0, batchSize);
  for (const { row, col } of batch) {
    model.openSite(row, col);
  }
  // Dessiner une seule fois après le lot entier pour plus de performance
  renderer.draw(model);
  updateStatus();
  
  if (animationQueue.length > 0) {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    requestAnimationFrame(() => processAnimationQueue());
  } else {
    renderer.draw(model);
    updateStatus();
  }
}

function resetModel() {
  stopSimulation(true);
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
  stopSimulation(true);
  
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
  stopSimulation(true);
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
  stopSimulation(true);
  resetModel();
});

gridTypeSelect.addEventListener("change", () => {
  resetModel();
});

btnSimulate.addEventListener("click", () => {
  if (isSimulating) {
    // Pause la simulation mais garde la valeur actuelle de p
    stopSimulation(false);
  } else {
    startSimulation();
  }
});

function startSimulation() {
  if (isSimulating) return;
  isSimulating = true;
  btnSimulate.textContent = "Arrêter";
  btnSimulate.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";

  // Si c'est le premier démarrage de la simulation, on repart de 0 avec une grille vide
  if (simulationCurrentP === null) {
    model.reset(model.size, model.gridType);
    renderer.draw(model);
    updateStatus();
    simulationCurrentP = 0;
  }

  const targetP = 1;
  const step = 0.01;
  const delay = 100; // ms entre chaque étape
  
  simulationInterval = setInterval(() => {
    // Incrémenter p en évitant les erreurs d'arrondi flottant
    simulationCurrentP = Math.min(
      targetP,
      parseFloat((simulationCurrentP + step).toFixed(2))
    );

    // Mettre à jour le slider et les labels
    probSlider.value = simulationCurrentP.toFixed(2);
    updateLabels();
    
    // Ouvrir des sites progressivement
    const allCoords = model.getAllCoordinates();
    const closed = model.closedSites();

    // Cas 1 : plus de sites à ouvrir, on stoppe
    if (closed.length === 0) {
      // Plus de sites à ouvrir : fin de simulation
      stopSimulation(true);
      return;
    }

    // Cas 2 : on a atteint p = 1.00 -> ouvrir tous les sites restants pour terminer plein à 100%
    if (simulationCurrentP >= targetP) {
      for (const idx of closed) {
        let row, col;
        if (model.gridType === "hex") {
          const coords = model.getAllCoordinates();
          if (idx < coords.length) {
            [row, col] = coords[idx];
          } else {
            continue;
          }
        } else {
          row = Math.floor(idx / model.size);
          col = idx % model.size;
        }
        model.openSite(row, col);
      }
      redraw();
      stopSimulation(true);
      return;
    }
    
    // Cas général : p < 1, ouvrir quelques sites à chaque étape pour animation fluide
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

function stopSimulation(resetProgress = false) {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  isSimulating = false;
  if (resetProgress) {
    simulationCurrentP = null;
  }
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
        // Afficher temporairement pour calculer la taille
        tooltipDiv.style.visibility = 'hidden';
        tooltipDiv.style.display = 'block';
        const rect = trigger.getBoundingClientRect();
        const tooltipRect = tooltipDiv.getBoundingClientRect();
        const left = rect.left + (rect.width / 2);
        const top = rect.top - tooltipRect.height - 8;
        tooltipDiv.style.left = `${left}px`;
        tooltipDiv.style.top = `${top}px`;
        tooltipDiv.style.transform = 'translateX(-50%)';
        tooltipDiv.style.visibility = 'visible';
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

// Initial - s'assurer que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateLabels();
    resetModel();
    setupTooltips();
  });
} else {
  updateLabels();
  resetModel();
  setupTooltips();
}


