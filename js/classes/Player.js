class Player {
    constructor(type = 'human') {
        this.type = type;
        this.gameboard = new Gameboard();
        this.potentialTargets = []; // Stack for AI hunting mode
        this.currentHits = [];
    }

    // Random placement for AI (and potentially auto-place for human)
    randomizeShips(ships) {
        // ships is array of definitions e.g. [{length: 5}, {length: 4}...]
        // Or actual Ship instances? Better to pass instances or factory logic.
        // Let's assume we pass a factory function or just arrays of lengths and create ships here?
        // For now, let's assume 'ships' is an array of fresh Ship objects.

        // Reset board if needed, but usually done at start.

        for (const ship of ships) {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * 10);
                const y = Math.floor(Math.random() * 10);
                const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';

                placed = this.gameboard.placeShip(ship, x, y, direction);
            }
        }
    }

    attack(enemyGameboard, x, y) {
        return enemyGameboard.receiveAttackSimple(x, y);
    }

    computerAttack(enemyGameboard) {
        if (this.type !== 'computer') return;

        let x, y;
        let result = 'already-shot';
        // Hunting Mode: If we have potential targets from previous hits
        while (this.potentialTargets.length > 0) {
            const output = this.potentialTargets.pop();
            x = output.x;
            y = output.y;

            // Check if valid and not shot yet
            if (this.isValidCoord(x, y) && !this.isAlreadyShot(enemyGameboard, x, y)) {
                result = this.attack(enemyGameboard, x, y);
                if (result !== 'already-shot') break;
            }
        }

        // Random Mode: If no targets or all targets were invalid/taken
        if (result === 'already-shot') {
            while (result === 'already-shot') {
                x = Math.floor(Math.random() * 10);
                y = Math.floor(Math.random() * 10);
                if (!this.isAlreadyShot(enemyGameboard, x, y)) {
                    result = this.attack(enemyGameboard, x, y);
                }
            }
        }

        // If Hit, add adjacent cells to potentialTargets
        if (result === 'hit') {
            this.currentHits.push({ x, y });
            
            this.addPotentialTarget(x, y);
        } else if (result === 'sunk') {
            // Ship sunk! Stop hunting around it.
            // We clear the stack to avoid shooting at neighbors of the sunk ship.
            // Limitation: If touching another ship, we might lose track, but this feels smarter to the user.
            this.potentialTargets = [];
            this.currentHits = [];
        }

        return { x, y, result };
    }

    isAlreadyShot(board, x, y) {
        const cell = board.board[y][x];
        return cell === 'hit' || cell === 'miss';
    }

    isValidCoord(x, y) {
        return x >= 0 && x < 10 && y >= 0 && y < 10;
    }

    addPotentialTarget(x,y){

        const type = this.getHitDirection();
        let adj = [];

        if(!type){
            adj = [
                { x: x, y: y - 1 },
                { x: x, y: y + 1 },
                { x: x - 1, y: y },
                { x: x + 1, y: y }
            ];
        }else if(type === "horizontal"){
            adj = [
                {x: x - 1, y: y},
                {x: x + 1, y: y}
            ];
        }else if(type === "vertical"){
            adj = [
                {x: x, y: y - 1},
                {x: x, y: y + 1}
            ]
        }

        for (let i = adj.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [adj[i], adj[j]] = [adj[j], adj[i]];
        }

        adj.forEach(coord => {
            if (this.isValidCoord(coord.x, coord.y)) {
                this.potentialTargets.push(coord);
            }
        });
    }
    getHitDirection(){
        if (this.type !== 'computer') return null;
        if(this.currentHits.length < 2) return null;
        
        const [a,b] = this.currentHits;

        if(a.x == b.x) return "vertical";
        if(a.y == b.y) return "horizontal";

        return null;
    }
}
