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
    const h = this.size;
    const cellSize = Math.min(w, h) / n;
    const percolates = model.percolates();
    const clusterMask = percolates ? model.percolatingClusterMask() : null;

    this.clear();

    // Center the grid
    const totalWidth = n * cellSize;
    const totalHeight = n * cellSize;
    const offsetX = (w - totalWidth) / 2;
    const offsetY = (h - totalHeight) / 2;

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
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Grid lines - white for visibility
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= n; i++) {
      const pos = offsetX + i * cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, offsetY);
      this.ctx.lineTo(pos, offsetY + totalHeight);
      this.ctx.stroke();
    }
    for (let i = 0; i <= n; i++) {
      const pos = offsetY + i * cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX, pos);
      this.ctx.lineTo(offsetX + totalWidth, pos);
      this.ctx.stroke();
    }
  }

  drawTriangularGrid(model) {
    const n = model.size;
    const w = this.size;
    const h = this.size;
    const percolates = model.percolates();
    const clusterMask = percolates ? model.percolatingClusterMask() : null;

    this.clear();

    // For proper triangular tessellation:
    // - Each triangle row has height = triangleHeight
    // - Triangle side = 2 * triangleHeight / sqrt(3)
    // - Triangles interlock: up triangles share base with down triangles
    const triangleHeight = h / n;
    const triangleSide = (2 * triangleHeight) / Math.sqrt(3);
    const triangleWidth = triangleSide;

    // Calculate total width for centering
    // Even rows span: n * triangleWidth
    // Odd rows span: n * triangleWidth + triangleWidth/2 (due to offset)
    const hasOddRows = n > 1 && (n - 1) % 2 === 1;
    const totalWidth = hasOddRows ? n * triangleWidth + triangleWidth / 2 : n * triangleWidth;
    const offsetX = (w - totalWidth) / 2;
    const offsetY = 0; // Start from top

    // Store triangle data for two-pass rendering
    const triangles = [];

    // First pass: collect all triangle data
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
        
        // Even rows: triangles point up, odd rows: point down
        const pointingUp = row % 2 === 0;
        
        // Y position: center of each triangle row
        const y = offsetY + (row + 0.5) * triangleHeight;
        
        // X position: for tessellation, odd rows offset by half width to interlock
        const xOffset = pointingUp ? 0 : triangleWidth / 2;
        const x = offsetX + col * triangleWidth + triangleWidth / 2 + xOffset;
        
        triangles.push({ x, y, side: triangleSide, pointingUp, fill });
      }
    }

    // Draw all triangles filled first
    for (const tri of triangles) {
      this._drawTriangleFill(tri.x, tri.y, tri.side, tri.pointingUp, tri.fill);
    }

    // Then draw all contours
    for (const tri of triangles) {
      this._drawTriangleStroke(tri.x, tri.y, tri.side, tri.pointingUp);
    }
  }

  _drawTriangleFill(x, y, side, pointingUp, fillColor) {
    const height = side * Math.sqrt(3) / 2;
    this.ctx.beginPath();
    
    if (pointingUp) {
      // Pointing up: top vertex at y - height/2, base at y + height/2
      this.ctx.moveTo(x, y - height / 2);
      this.ctx.lineTo(x - side / 2, y + height / 2);
      this.ctx.lineTo(x + side / 2, y + height / 2);
    } else {
      // Pointing down: base at y - height/2, bottom vertex at y + height/2
      this.ctx.moveTo(x - side / 2, y - height / 2);
      this.ctx.lineTo(x + side / 2, y - height / 2);
      this.ctx.lineTo(x, y + height / 2);
    }
    
    this.ctx.closePath();
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
  }

  _drawTriangleStroke(x, y, side, pointingUp) {
    const height = side * Math.sqrt(3) / 2;
    this.ctx.beginPath();
    
    if (pointingUp) {
      // Pointing up: top vertex at y - height/2, base at y + height/2
      this.ctx.moveTo(x, y - height / 2);
      this.ctx.lineTo(x - side / 2, y + height / 2);
      this.ctx.lineTo(x + side / 2, y + height / 2);
    } else {
      // Pointing down: base at y - height/2, bottom vertex at y + height/2
      this.ctx.moveTo(x - side / 2, y - height / 2);
      this.ctx.lineTo(x + side / 2, y - height / 2);
      this.ctx.lineTo(x, y + height / 2);
    }
    
    this.ctx.closePath();
    // White border for visibility - draw on top of fills
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  drawHexGrid(model) {
    const n = model.size;
    const w = this.size;
    const h = this.size;
    const percolates = model.percolates();
    const clusterMask = percolates ? model.percolatingClusterMask() : null;

    this.clear();

    // Calculate hex size to fill the entire canvas perfectly
    // For odd-r offset hexagonal grid with n rows:
    // - Vertical spacing between row centers: hexRadius * 1.5
    // - Total height: hexRadius (top) + (n-1) * hexRadius * 1.5 + hexRadius (bottom)
    //   = hexRadius * (1 + 1.5*(n-1) + 1) = hexRadius * (2 + 1.5*(n-1))
    // - We want this to equal h, so: hexRadius = h / (2 + 1.5*(n-1))
    const numRows = n;
    const hexRadius = h / (2 + 1.5 * (numRows - 1));
    const hexWidth = hexRadius * Math.sqrt(3);

    // Calculate total width for centering
    // Even rows have n hexagons, so max width is n * hexWidth
    const maxWidth = n * hexWidth;
    const offsetX = (w - maxWidth) / 2;
    const offsetY = hexRadius; // Top margin to center vertically

    // Draw hexagons with proper tessellation
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
      // For odd-r offset: odd rows are shifted right by hexWidth/2
      const x = offsetX + hexWidth * (col + 0.5) + (isOddRow ? hexWidth / 2 : 0);
      const y = offsetY + row * hexRadius * 1.5;

      this._drawHexagon(x, y, hexRadius, fill);
    }
  }

  _drawHexagon(x, y, radius, fillColor, strokeOnly = false) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      // Start from top vertex (angle -π/2) and go clockwise
      const angle = (Math.PI / 3) * i - Math.PI / 2;
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
    
    // White border for visibility (always draw, even if strokeOnly is false)
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.lineWidth = 1.2;
    this.ctx.stroke();
  }
}


