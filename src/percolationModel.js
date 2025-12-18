import { UnionFind } from "./unionFind.js";

// Site percolation on a square grid with periodic boundaries disabled.
export class PercolationModel {
  constructor(size) {
    this.size = size;
    this.nSites = size * size;
    // Deux structures union-find :
    //  - ufTop : sites + un nœud virtuel pour le haut
    //  - ufBottom : sites + un nœud virtuel pour le bas
    this.virtualTop = this.nSites;
    this.virtualBottom = this.nSites;
    this.ufTop = new UnionFind(this.nSites + 1);
    this.ufBottom = new UnionFind(this.nSites + 1);
    this.open = new Array(this.nSites).fill(false);
    this.openCount = 0;
  }

  index(row, col) {
    return row * this.size + col;
  }

  reset(size = this.size) {
    this.size = size;
    this.nSites = size * size;
    this.virtualTop = this.nSites;
    this.virtualBottom = this.nSites;
    this.ufTop = new UnionFind(this.nSites + 1);
    this.ufBottom = new UnionFind(this.nSites + 1);
    this.open = new Array(this.nSites).fill(false);
    this.openCount = 0;
  }

  isOpen(row, col) {
    return this.open[this.index(row, col)];
  }

  neighbors(row, col) {
    const n = this.size;
    const res = [];
    if (row > 0) res.push([row - 1, col]);
    if (row < n - 1) res.push([row + 1, col]);
    if (col > 0) res.push([row, col - 1]);
    if (col < n - 1) res.push([row, col + 1]);
    return res;
  }

  openSite(row, col) {
    const idx = this.index(row, col);
    if (this.open[idx]) return false;

    this.open[idx] = true;
    this.openCount++;

    // Connect to open neighbors in both union-find structures
    for (const [r2, c2] of this.neighbors(row, col)) {
      const idx2 = this.index(r2, c2);
      if (this.open[idx2]) {
        this.ufTop.union(idx, idx2);
        this.ufBottom.union(idx, idx2);
      }
    }

    // Connect to virtual top / bottom in the appropriate structure
    if (row === 0) {
      this.ufTop.union(idx, this.virtualTop);
    }
    if (row === this.size - 1) {
      this.ufBottom.union(idx, this.virtualBottom);
    }
    return true;
  }

  randomize(p) {
    const n = this.size;
    this.open.fill(false);
    this.ufTop = new UnionFind(this.nSites + 1);
    this.ufBottom = new UnionFind(this.nSites + 1);
    this.openCount = 0;

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (Math.random() < p) {
          this.openSite(row, col);
        }
      }
    }
  }

  percolates() {
    const n = this.size;
    // Il y a percolation s'il existe un site ouvert qui est connecté
    // au haut et au bas (intersection des deux composantes).
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

  // Compute the percolating cluster (if any) as a boolean mask of size nSites.
  // Un site est coloré en vert s'il est :
  //  - ouvert
  //  - connecté au haut dans ufTop
  //  - et connecté au bas dans ufBottom
  percolatingClusterMask() {
    if (!this.percolates()) {
      return new Array(this.nSites).fill(false);
    }

    const n = this.size;
    const mask = new Array(this.nSites).fill(false);
    const rootTop = this.ufTop.find(this.virtualTop);
    const rootBottom = this.ufBottom.find(this.virtualBottom);

    for (let i = 0; i < this.nSites; i++) {
      if (!this.open[i]) continue;
      const connectedTop = this.ufTop.find(i) === rootTop;
      const connectedBottom = this.ufBottom.find(i) === rootBottom;
      if (connectedTop && connectedBottom) {
        mask[i] = true;
      }
    }

    return mask;
  }

  // Return a list of closed site indices (for random stepping)
  closedSites() {
    const res = [];
    for (let i = 0; i < this.nSites; i++) {
      if (!this.open[i]) res.push(i);
    }
    return res;
  }
}



