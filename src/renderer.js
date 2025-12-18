// Renderer for square, triangular, and hexagonal grids.
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
    this.ctx.fillStyle = "#020617";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw(model) {
    if (model.gridType === "square") {
      this.drawSquareGrid(model);
    } else if (model.gridType === "triangular") {
      this.drawTriangularGrid(model);
    } else if (model.gridType === "hex") {
      this.drawHexGrid(model);
    }
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
          fill = "#111827";
        } else if (clusterMask && clusterMask[idx]) {
          fill = "#22c55e";
        } else {
          fill = "#06b6d4";
        }
        const x = col * cellSize;
        const y = row * cellSize;
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Grid lines
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

  drawTriangularGrid(model) {
    const n = model.size;
    const w = this.size;
    const cellSize = w / n;
    const percolates = model.percolates();
    const clusterMask = percolates ? model.percolatingClusterMask() : null;

    this.clear();

    // Draw triangular lattice sites as circles
    const radius = cellSize * 0.35;
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const idx = model.index(row, col);
        let fill;
        if (!model.open[idx]) {
          fill = "#111827";
        } else if (clusterMask && clusterMask[idx]) {
          fill = "#22c55e";
        } else {
          fill = "#06b6d4";
        }
        
        const x = (col + 0.5) * cellSize;
        const y = (row + 0.5) * cellSize;
        
        this.ctx.fillStyle = fill;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Draw connections for open sites
    this.ctx.strokeStyle = "rgba(148,163,184,0.4)";
    this.ctx.lineWidth = 1;
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const idx = model.index(row, col);
        if (!model.open[idx]) continue;
        
        const x1 = (col + 0.5) * cellSize;
        const y1 = (row + 0.5) * cellSize;
        
        for (const [r2, c2] of model.neighbors(row, col)) {
          if (model.isOpen(r2, c2)) {
            const x2 = (c2 + 0.5) * cellSize;
            const y2 = (r2 + 0.5) * cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
          }
        }
      }
    }
  }

  drawHexGrid(model) {
    const n = model.size;
    const w = this.size;
    const h = this.size;
    const percolates = model.percolates();
    const clusterMask = percolates ? model.percolatingClusterMask() : null;

    // Calculate hex size to fit the grid
    const hexRadius = Math.min(w, h) / (n * 1.8);
    const hexWidth = hexRadius * Math.sqrt(3);

    this.clear();

    // Draw hexagons
    for (const [row, col] of model.getAllCoordinates()) {
      const idx = model.index(row, col);
      let fill;
      if (!model.open[idx]) {
        fill = "#111827";
      } else if (clusterMask && clusterMask[idx]) {
        fill = "#22c55e";
      } else {
        fill = "#06b6d4";
      }

      const isOddRow = row % 2 === 1;
      const x = hexWidth * (col + 0.5) + (isOddRow ? hexWidth / 2 : 0);
      const y = hexRadius * (row * 1.5 + 1);

      // Center the grid
      const offsetX = (w - hexWidth * (n - 0.5)) / 2;
      const offsetY = (h - hexRadius * (n * 1.5 + 0.5)) / 2;

      this._drawHexagon(x + offsetX, y + offsetY, hexRadius, fill);
    }

    // Draw hex borders
    this.ctx.strokeStyle = "rgba(148,163,184,0.5)";
    this.ctx.lineWidth = 0.8;
    for (const [row, col] of model.getAllCoordinates()) {
      const idx = model.index(row, col);
      if (!model.open[idx]) continue;

      const isOddRow = row % 2 === 1;
      const hexWidth = hexRadius * Math.sqrt(3);
      const x = hexWidth * (col + 0.5) + (isOddRow ? hexWidth / 2 : 0);
      const y = hexRadius * (row * 1.5 + 1);

      const offsetX = (w - hexWidth * (n - 0.5)) / 2;
      const offsetY = (h - hexRadius * (n * 1.5 + 0.5)) / 2;

      this._drawHexagon(x + offsetX, y + offsetY, hexRadius, null, true);
    }
  }

  _drawHexagon(x, y, radius, fillColor, strokeOnly = false) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }
    this.ctx.closePath();
    
    if (fillColor && !strokeOnly) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }
    if (strokeOnly) {
      this.ctx.stroke();
    }
  }
}


