namespace Pluma {
    type Expression2D = (x: number, y: number) => number;

    class PointSet {
        bounds: BoundingRect;
        resolutionX: number;
        resolutionY: number;

        cellSize: number;

        _setCells: Uint8Array;
        _setCellsIdxArray: number[];
        _coordX: Float32Array;
        _coordY: Float32Array;
        _arraySize: number;

        size: number;

        constructor(cellSize: number, bounds: BoundingRect) {
            this.bounds = bounds;
            this.cellSize = cellSize;

            this.resolutionX = Math.ceil(bounds.width / cellSize);
            this.resolutionY = Math.ceil(bounds.height / cellSize);
            this._arraySize = this.resolutionX * this.resolutionY;
            this._setCells = new Uint8Array(this._arraySize);
            this._coordX = new Float32Array(this._arraySize);
            this._coordY = new Float32Array(this._arraySize);
            this._setCellsIdxArray = [];

            this.size = 0;
        }

        hasPoint(point: Point) {
            let idx = this._pointToCellIdx(point);
            return this._setCells[idx];
        }

        addPoint(point: Point, wrtEquation: Equation | null = null) {
            let idx = this._pointToCellIdx(point);
            let alreadyHasPoint = this.hasPoint(point);

            if (!alreadyHasPoint) {
                this.size += 1;
                this._setCellsIdxArray.push(idx);
            }

            if (wrtEquation && alreadyHasPoint) {
                let oldX = this._coordX[idx];
                let oldY = this._coordY[idx];
                let oldDist = wrtEquation.squaredDistance(oldX, oldY);
                let newDist = wrtEquation.squaredDistance(point.x, point.y);

                if (newDist > oldDist) {
                    return;
                }
            }

            this._setCells[idx] = 1;
            this._coordX[idx] = point.x;
            this._coordY[idx] = point.y;
        }

        _pointToCellIdx(point: Point) {
            let x = Math.floor((point.x - this.bounds.x) / this.cellSize);
            let y = Math.floor((point.y - this.bounds.y) / this.cellSize);
            if (x >= this.resolutionX || x < 0 || y >= this.resolutionY || y < 0) {
                throw Error(`Point ${point.toString()} out of bounds`);
            }
            return y * this.resolutionY + x;
        }

        _isOutOfBounds(point: Point) {
            let x = Math.floor((point.x - this.bounds.x) / this.cellSize);
            let y = Math.floor((point.y - this.bounds.y) / this.cellSize);
            if (x >= this.resolutionX || x < 0 || y >= this.resolutionY || y < 0) {
                return true;
            }
            return false;
        }

        _pointToCellCoord(point: Point) {
            return new Point(
                Math.floor((point.x - this.bounds.x) / this.cellSize),
                Math.floor((point.y - this.bounds.y) / this.cellSize)
            );
        }

        getPoints() {
            return this._setCellsIdxArray.map(
                (idx) => new Point(this._coordX[idx], this._coordY[idx])
            );
        }

        clear() {
            for (let idx of this._setCellsIdxArray) {
                this._setCells[idx] = 0;
                this._coordX[idx] = 0;
                this._coordY[idx] = 0;
            }
            this.size = 0;
            this._setCellsIdxArray = [];
        }

        reconstructFromPointsArray(arr: Point[]) {
            this.clear();

            for (let point of arr) {
                this.addPoint(point);
            }
        }
    }

    class Equation {
        left: Expression2D;
        right: Expression2D;
        delta: number;
        resolution: number;
        subResolution: number;

        constructor(left: Expression2D, right: Expression2D) {
            this.left = left;
            this.right = right;
            this.delta = 0.001;
            this.resolution = 100;
            this.subResolution = 200;
        }

        squaredDistance(x: number, y: number) {
            let d = this.left(x, y) - this.right(x, y);
            return d * d;
        }

        _getPointSetCellSize(bounds: BoundingRect) {
            let csx = bounds.width / this.subResolution;
            let csy = bounds.height / this.subResolution;

            return Math.min(csx, csy);
        }

        _findStartingPointsAlongYAxis(x: number, bounds: BoundingRect) {
            let points = new PointSet(this._getPointSetCellSize(bounds), bounds);
            for (
                let y = bounds.y;
                y < bounds.y + bounds.height;
                y += bounds.height / this.resolution
            ) {
                points.addPoint(new Point(x, y));
                console.log(x, y);
            }
            console.log(points);

            for (let i = 0; i < 100; i++) {
                let pointsArray = points.getPoints();

                for (let point of pointsArray) {
                    let grad = this._getYGradient(point.x, point.y);
                    if (grad > 0) {
                        point.y -= 0.05;
                    } else if (grad < 0) {
                        point.y += 0.05;
                    }
                }

                points.reconstructFromPointsArray(
                    pointsArray.filter((p) => !points._isOutOfBounds(p))
                );
            }

            return points.getPoints();
        }

        _getYGradient(x: number, y: number) {
            let h1 = this.squaredDistance(x, y);
            let h2 = this.squaredDistance(x, y + this.delta);
            return (h2 - h1) / this.delta;
        }

        _getXGradient(x: number, y: number) {
            let h1 = this.squaredDistance(x, y);
            let h2 = this.squaredDistance(x + this.delta, y);
            return (h2 - h1) / this.delta;
        }
    }

    export function _test() {
        let eq = new Equation(
            (x, y) => x,
            (x, y) => y
        );
        let bounds = BoundingRect.fromCenterWithSize(0, 0, 10, 8);
        console.log(eq._findStartingPointsAlongYAxis(0, bounds));
    }
}
