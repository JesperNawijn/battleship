class Ship {
    constructor(length) {
        this.length = length;
        this.hits = 0;
        this.sunk = false;
        this.coords = []; // [{x, y}, ...]
    }

    hit() {
        this.hits++;
        this.isSunk();
    }

    isSunk() {
        if (this.hits >= this.length) {
            this.sunk = true;
        }
        return this.sunk;
    }

    setCoords(coords) {
        this.coords = coords;
    }
}
