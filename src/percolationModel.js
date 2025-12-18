import { UnionFind } from "./unionFind.js";

// Site percolation on square, triangular, or hexagonal grids.
export class PercolationModel {
  constructor(size, gridType = "square") {
    this.size = size;
    this.gridType = gridType;
    
    // Calculate number of sites based on grid type
    if (gridType === "hex") {
      // Hexagonal grid: roughly size rows, but columns vary
      this.nSites = this._calculateHexSites(size);
    } else {
      this.nSites = size * size;
    }
    
    this.virtualTop = this.nSites;
    this.virtualBottom = this.nSites + 1;
    this.ufTop = new UnionFind(this.nSites + 2);
    this.ufBottom = new UnionFind(this.nSites + 2);
    this.open = new Array(this.nSites).fill(false);
    this.openCount = 0;
    
    // For hexagonal grids, store coordinate mapping
    if (gridType === "hex") {
      this._buildHexMapping(size);
    }
  }

  _calculateHexSites(size) {
    // Hexagonal grid with odd-r offset: rows alternate between size and size-1 columns
    let count = 0;
    for (let r = 0; r < size; r++) {
      const cols = (r % 2 === 0) ? size : size - 1;
      count += cols;
    }
    return count;
  }

  _buildHexMapping(size) {
    // Build mapping from (row, col) to index for hexagonal grid
    this.hexMap = new Map();
    this.hexCoords = [];
    let idx = 0;
    for (let r = 0; r < size; r++) {
      const cols = (r % 2 === 0) ? size : size - 1;
      for (let q = 0; q < cols; q++) {
        this.hexMap.set(`${r},${q}`, idx);
        this.hexCoords.push([r, q]);
        idx++;
      }
    }
  }

  index(row, col) {
    if (this.gridType === "hex") {
      return this.hexMap.get(`${row},${col}`) ?? -1;
    }
    return row * this.size + col;
  }

  reset(size = this.size, gridType = this.gridType) {
    this.size = size;
    this.gridType = gridType;
    
    if (gridType === "hex") {
      this.nSites = this._calculateHexSites(size);
      this._buildHexMapping(size);
    } else {
      this.nSites = size * size;
      // Clear hex-specific properties when switching away from hex
      this.hexMap = null;
      this.hexCoords = null;
    }
    
    this.virtualTop = this.nSites;
    this.virtualBottom = this.nSites + 1;
    this.ufTop = new UnionFind(this.nSites + 2);
    this.ufBottom = new UnionFind(this.nSites + 2);
    this.open = new Array(this.nSites).fill(false);
    this.openCount = 0;
  }

  isOpen(row, col) {
    const idx = this.index(row, col);
    if (idx < 0) return false;
    return this.open[idx];
  }

  neighbors(row, col) {
    if (this.gridType === "square") {
      return this._neighborsSquare(row, col);
    } else if (this.gridType === "triangular") {
      return this._neighborsTriangular(row, col);
    } else if (this.gridType === "hex") {
      return this._neighborsHex(row, col);
    }
    return [];
  }

  _neighborsSquare(row, col) {
    const n = this.size;
    const res = [];
    if (row > 0) res.push([row - 1, col]);
    if (row < n - 1) res.push([row + 1, col]);
    if (col > 0) res.push([row, col - 1]);
    if (col < n - 1) res.push([row, col + 1]);
    return res;
  }

  _neighborsTriangular(row, col) {
    // Triangular lattice: 6 neighbors (4 cardinal + 2 diagonal)
    const n = this.size;
    const res = [];
    // Cardinal directions
    if (row > 0) res.push([row - 1, col]);
    if (row < n - 1) res.push([row + 1, col]);
    if (col > 0) res.push([row, col - 1]);
    if (col < n - 1) res.push([row, col + 1]);
    // Diagonal directions (for triangular lattice connectivity)
    if (row > 0 && col > 0) res.push([row - 1, col - 1]);
    if (row > 0 && col < n - 1) res.push([row - 1, col + 1]);
    return res;
  }

  _neighborsHex(row, col) {
    // Hexagonal grid with odd-r offset coordinates
    // Each hex has 6 neighbors, but the pattern depends on row parity
    const res = [];
    const isOddRow = row % 2 === 1;
    const n = this.size;
    
    // Standard hex neighbors for odd-r offset:
    // Even rows: (-1,-1), (-1,0), (0,-1), (0,1), (1,-1), (1,0)
    // Odd rows:  (-1,0), (-1,1), (0,-1), (0,1), (1,0), (1,1)
    const directions = isOddRow
      ? [
          [0, -1], [0, 1],      // Left, Right
          [-1, 0], [-1, 1],     // Top-left, Top-right
          [1, 0], [1, 1]        // Bottom-left, Bottom-right
        ]
      : [
          [0, -1], [0, 1],      // Left, Right
          [-1, -1], [-1, 0],    // Top-left, Top-right
          [1, -1], [1, 0]       // Bottom-left, Bottom-right
        ];
    
    for (const [dr, dc] of directions) {
      const r2 = row + dr;
      const c2 = col + dc;
      if (r2 >= 0 && r2 < n) {
        const colsInRow = (r2 % 2 === 0) ? n : n - 1;
        if (c2 >= 0 && c2 < colsInRow) {
          res.push([r2, c2]);
        }
      }
    }
    
    return res;
  }

  openSite(row, col) {
    const idx = this.index(row, col);
    if (idx < 0 || this.open[idx]) return false;

    this.open[idx] = true;
    this.openCount++;

    // Connect to open neighbors in both union-find structures
    for (const [r2, c2] of this.neighbors(row, col)) {
      const idx2 = this.index(r2, c2);
      if (idx2 >= 0 && this.open[idx2]) {
        this.ufTop.union(idx, idx2);
        this.ufBottom.union(idx, idx2);
      }
    }

    // Connect to virtual top / bottom
    if (this.gridType === "hex") {
      // For hex, top row is row 0
      if (row === 0) {
        this.ufTop.union(idx, this.virtualTop);
      }
      if (row === this.size - 1) {
        this.ufBottom.union(idx, this.virtualBottom);
      }
    } else {
      // Square and triangular
      if (row === 0) {
        this.ufTop.union(idx, this.virtualTop);
      }
      if (row === this.size - 1) {
        this.ufBottom.union(idx, this.virtualBottom);
      }
    }
    return true;
  }

  randomize(p) {
    if (this.gridType === "hex") {
      this.open.fill(false);
      this.ufTop = new UnionFind(this.nSites + 2);
      this.ufBottom = new UnionFind(this.nSites + 2);
      this.openCount = 0;

      for (const [row, col] of this.hexCoords) {
        if (Math.random() < p) {
          this.openSite(row, col);
        }
      }
    } else {
      const n = this.size;
      this.open.fill(false);
      this.ufTop = new UnionFind(this.nSites + 2);
      this.ufBottom = new UnionFind(this.nSites + 2);
      this.openCount = 0;

      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          if (Math.random() < p) {
            this.openSite(row, col);
          }
        }
      }
    }
  }

  percolates() {
    if (this.gridType === "hex") {
      // Check hex grid
      for (const [row, col] of this.hexCoords) {
        const idx = this.index(row, col);
        if (idx < 0 || !this.open[idx]) continue;
        const connectedTop =
          this.ufTop.find(idx) === this.ufTop.find(this.virtualTop);
        const connectedBottom =
          this.ufBottom.find(idx) === this.ufBottom.find(this.virtualBottom);
        if (connectedTop && connectedBottom) {
          return true;
        }
      }
      return false;
    } else {
      // Square and triangular
      const n = this.size;
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          const idx = this.index(row, col);
          if (!this.open[idx]) continue;
          const connectedTop =
            this.ufTop.find(idx) === this.ufTop.find(this.virtualTop);
          const connectedBottom =
            this.ufBottom.find(idx) === this.ufBottom.find(this.virtualBottom);
          if (connectedTop && connectedBottom) {
            return true;
          }
        }
      }
      return false;
    }
  }

  percolatingClusterMask() {
    if (!this.percolates()) {
      return new Array(this.nSites).fill(false);
    }

    const mask = new Array(this.nSites).fill(false);
    const rootTop = this.ufTop.find(this.virtualTop);
    const rootBottom = this.ufBottom.find(this.virtualBottom);

    if (this.gridType === "hex") {
      for (const [row, col] of this.hexCoords) {
        const i = this.index(row, col);
        if (i < 0 || !this.open[i]) continue;
        const connectedTop = this.ufTop.find(i) === rootTop;
        const connectedBottom = this.ufBottom.find(i) === rootBottom;
        if (connectedTop && connectedBottom) {
          mask[i] = true;
        }
      }
    } else {
      const n = this.size;
      for (let i = 0; i < this.nSites; i++) {
        if (!this.open[i]) continue;
        const connectedTop = this.ufTop.find(i) === rootTop;
        const connectedBottom = this.ufBottom.find(i) === rootBottom;
        if (connectedTop && connectedBottom) {
          mask[i] = true;
        }
      }
    }

    return mask;
  }

  closedSites() {
    const res = [];
    for (let i = 0; i < this.nSites; i++) {
      if (!this.open[i]) res.push(i);
    }
    return res;
  }

  // Helper to get all coordinates for iteration
  getAllCoordinates() {
    if (this.gridType === "hex") {
      return this.hexCoords;
    } else {
      const coords = [];
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          coords.push([row, col]);
        }
      }
      return coords;
    }
  }
}



