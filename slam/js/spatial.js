// Spatial Hash Grid for high-performance 2D neighbor and collision queries
class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.invCellSize = 1 / cellSize;
        this.cells = new Map();
        this.queryIds = new Set();
    }

    clear() {
        this.cells.clear();
    }

    _getKey(cx, cy) {
        // Hash combine for integer coordinates
        return (cx * 73856093) ^ (cy * 19349663);
    }

    insert(entity) {
        const cx = Math.floor(entity.x * this.invCellSize);
        const cy = Math.floor(entity.y * this.invCellSize);
        const key = this._getKey(cx, cy);

        let cell = this.cells.get(key);
        if (!cell) {
            cell = [];
            this.cells.set(key, cell);
        }
        cell.push(entity);
    }

    // Returns array of entities within bounding box [minX, minY, maxX, maxY]
    queryRange(minX, minY, maxX, maxY) {
        const minCx = Math.floor(minX * this.invCellSize);
        const minCy = Math.floor(minY * this.invCellSize);
        const maxCx = Math.floor(maxX * this.invCellSize);
        const maxCy = Math.floor(maxY * this.invCellSize);

        const results = [];
        this.queryIds.clear();

        for (let cy = minCy; cy <= maxCy; cy++) {
            for (let cx = minCx; cx <= maxCx; cx++) {
                const key = this._getKey(cx, cy);
                const cell = this.cells.get(key);
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        const entity = cell[i];
                        if (!this.queryIds.has(entity.id)) {
                            this.queryIds.add(entity.id);
                            results.push(entity);
                        }
                    }
                }
            }
        }
        return results;
    }

    // Query entities within circle of radius R around (x, y)
    queryRadius(x, y, radius) {
        const candidates = this.queryRange(x - radius, y - radius, x + radius, y + radius);
        const rSq = radius * radius;
        const inRadius = [];
        for (let i = 0; i < candidates.length; i++) {
            const e = candidates[i];
            const dx = e.x - x;
            const dy = e.y - y;
            if (dx * dx + dy * dy <= rSq) {
                inRadius.push(e);
            }
        }
        return inRadius;
    }
}

window.SpatialGrid = SpatialGrid;
