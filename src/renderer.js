// Simple square-grid renderer on a square canvas.
// Colors: closed = dark gray, open = cyan, percolating = bright green.

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height || rect.width);
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.size = size;
  }

  clear() {
    // Slightly lighter than the page background so the grid pops.
    this.ctx.fillStyle = "#020617";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawSquareGrid(model) {
    const n = model.size;
    const w = this.size;
    const cellSize = w / n;
    const percolates = model.percolates();
    const clusterMask = percolates ? model.percolatingClusterMask() : null;

    this.clear();

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const idx = model.index(row, col);
        let fill;
        if (!model.open[idx]) {
          // Closed site: dark gray so you can still see the lattice.
          fill = "#111827";
        } else if (clusterMask && clusterMask[idx]) {
          // Percolating cluster: vivid green.
          fill = "#22c55e";
        } else {
          // Open but not in percolating cluster: bright cyan/blue.
          fill = "#06b6d4";
        }
        const x = col * cellSize;
        const y = row * cellSize;
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Grid lines – lighter and slightly thicker for visibility.
    this.ctx.strokeStyle = "rgba(148,163,184,0.7)";
    this.ctx.lineWidth = 0.7;
    for (let i = 0; i <= n; i++) {
      const pos = i * cellSize + 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, w);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(w, pos);
      this.ctx.stroke();
    }
  }
}


