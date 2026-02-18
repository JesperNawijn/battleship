class Gameboard {
    constructor() {
        this.board = [];
        this.ships = [];
        this.missedAttacks = [];
        this.size = 10;
        this.initBoard();
    }

    initBoard() {
        // Create 10x10 grid, null means empty
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.board[i][j] = null;
            }
        }
    }

    // Place a ship at coordinates (x, y)
    // direction: 'horizontal' or 'vertical'
    placeShip(ship, x, y, direction) {
        if (!this.isValidPlacement(ship.length, x, y, direction)) {
            return false;
        }

        const shipCoords = [];
        for (let i = 0; i < ship.length; i++) {
            let currentX, currentY;
            if (direction === 'horizontal') {
                currentX = x + i;
                currentY = y;
            } else {
                currentX = x;
                currentY = y + i;
            }
            this.board[currentY][currentX] = ship;
            shipCoords.push({ x: currentX, y: currentY });
        }

        ship.setCoords(shipCoords);
        this.ships.push(ship);
        return true;
    }

    // isValidPlacement(length, x, y, direction) {
    //     // Boundary checks
    //     if (direction === 'horizontal') {
    //         if (x + length > this.size) return false;
    //     } else {
    //         if (y + length > this.size) return false;
    //     }

    //     // Collision checks
    //     for (let i = 0; i < length; i++) {
    //         let currentX = direction === 'horizontal' ? x + i : x;
    //         let currentY = direction === 'horizontal' ? y : y + i;

    //         if (this.board[currentY][currentX] !== null) {
    //             return false;
    //         }
    //     }

    //     return true;
    // }

    isValidPlacement(length, x, y, direction) {
        // 1. Boundary checks (Blijft hetzelfde)
        if (direction === 'horizontal') {
            if (x + length > this.size) return false;
        } else {
            if (y + length > this.size) return false;
        }

        // 2. Uitgebreide Collision & Neighbor checks
        for (let i = 0; i < length; i++) {
            let currentX = direction === 'horizontal' ? x + i : x;
            let currentY = direction === 'horizontal' ? y : y + i;

            // Controleer een 3x3 gebied rondom het huidige vakje (currentX, currentY)
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    let neighborX = currentX + dx;
                    let neighborY = currentY + dy;

                    // Controleer of de buurman binnen de grenzen van het bord ligt
                    if (neighborX >= 0 && neighborX < this.size && neighborY >= 0 && neighborY < this.size) {
                        // Als een omliggend vakje niet leeg is, mag het schip hier niet staan
                        if (this.board[neighborY][neighborX] !== null) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }
    receiveAttack(x, y) {
        const target = this.board[y][x];

        // Check if already attacked (might need to handle this in controller or UI too, but good safety)
        // For now, assuming controller ensures unique valid shots or we return a status.

        if (target === null) {
            // Miss
            // Check if we already missed here to avoid duplicate entries (optional but clean)
            const alreadyMissed = this.missedAttacks.some(coord => coord.x === x && coord.y === y);
            if (!alreadyMissed) {
                this.missedAttacks.push({ x, y });
                return { status: 'miss', x, y };
            }
            return { status: 'already-shot', x, y };
        } else if (typeof target === 'object') {
            // Hit logic
            // Note: If we want to track specific spot hits on the board to prevent multi-hit on same spot logic:
            // We could replace the ship object in the cell with 'hit' string or similar wrapper.
            // But usually we just track hits on the ship instance.
            // Problem: If I hit (0,0) twice, I shouldn't damage ship twice.
            // Solution: We need a parallel tracking of shots on the board or modify board content.

            // Let's modify the board to mark it as hit to prevent re-hits.
            // But we need to keep reference to ship to call .hit().
            // So:
            // 1. We keep ship ref. 2. We mark this specific cell as "hit_ship" logic externally?
            // Or better: We store auxiliary "shots" grid.

            // Let's go with: board stores ships. 'shots' array stores all shots.
            // Refactoring slightly for cleanliness:
            // Actually, simplest is: board holds { ship: Ship, hit: boolean } or just Ship.
            // Let's use a separate "shots" register for simplicity in rendering.
        }
        return { status: 'error' }; // Should not reach here with new logic below
    }

    // Better Approach for receiveAttack with strict state tracking
    receiveAttackSimple(x, y) {
        if (this.board[y][x] === 'miss' || this.board[y][x] === 'hit') {
            return 'already-shot';
        }

        if (this.board[y][x] === null) {
            this.board[y][x] = 'miss';
            return 'miss';
        } else {
            // It's a ship
            const ship = this.board[y][x];
            ship.hit();
            // Mark position as hit on board to prevent re-hit
            // We need to preserve the ship reference for the UI maybe? 
            // Typically UI redraws based on separate state or we just modify this to a simpler "Hit" marker
            // But we can't lose the ship reference if we want to check isSunk later easily by iterating board?
            // Actually ships are stored in this.ships array. So we can overwrite board cell.
            this.board[y][x] = 'hit';
            
            return ship.isSunk() ? 'sunk' : 'hit';
        }
    }

    allShipsSunk() {
        return this.ships.every(ship => ship.isSunk());
    }
}
