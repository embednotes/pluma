namespace Pluma {
    export class Point {
        x: number;
        y: number;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        toString() {
            return `<${this.x}, ${this.y}>`
        }
    }

    export class BoundingRect {
        x: number;
        y: number;
        width: number;
        height: number;

        private constructor(x: number, y: number, w: number, h: number) {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;
        }

        static fromTopLeftWithSize(x: number, y: number, w: number, h: number) {
            return new BoundingRect(x, y, w, h);
        }

        static fromCenterWithSize(x: number, y: number, w: number, h: number) {
            return new BoundingRect(x - w / 2, y - h / 2, w, h);
        }
    }
}
