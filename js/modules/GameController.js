class GameController {
    constructor(domController, audioController) {
        this.dom = domController;
        this.audio = audioController;

        this.human = new Player('human');
        this.computer = new Player('computer');

        this.gameState = 'setup'; // setup, playing, ended
        this.turn = 'player';
        this.turnCount = 0;

        // Placement helpers
        this.shipsToPlace = [
            { name: 'Vliegdekschip', length: 5 },
            { name: 'Slagschip', length: 4 },
            { name: 'Kruiser', length: 3 },
            { name: 'Onderzeeër', length: 3 },
            { name: 'Torpedoboot', length: 2 }
        ];
        this.currentShipIndex = 0;
        this.placementDirection = 'horizontal';
    }

    init() {
        this.dom.initGrids();
        this.connectDOM();
        this.startPlacementPhase();
    }

    connectDOM() {
        // Wiring callbacks
        this.dom.onCellClick = (x, y, owner) => {
            if (this.gameState === 'setup' && owner === 'player') {
                this.handlePlacementClick(x, y);
            } else if (this.gameState === 'playing' && owner === 'computer') {
                this.handleAttackClick(x, y);
            }
        };

        // UI Buttons
        this.dom.rotateBtn.addEventListener('click', () => {
            this.placementDirection = this.placementDirection === 'horizontal' ? 'vertical' : 'horizontal';
            this.updateMessage(`Richting: ${this.placementDirection === 'horizontal' ? 'Horizontaal' : 'Verticaal'}`);
        });

        this.dom.randomBtn.addEventListener('click', () => {
            if (this.gameState !== 'setup') return;
            this.randomizeHumanPlacement();
        });

        this.dom.startBtn.addEventListener('click', () => {
            if (this.currentShipIndex >= this.shipsToPlace.length) {
                this.startGame();
            }
        });

        this.dom.restartBtn.addEventListener('click', () => this.dom.restartGame());
        this.dom.modalRestartBtn.addEventListener('click', () => this.restart());
        this.dom.modelRestartBtnCancel.addEventListener('click', () => this.dom.stopRestart());

        this.dom.soundToggle.addEventListener('click', () => {
            const isOn = this.audio.toggle();
            this.dom.soundToggle.textContent = isOn ? '🔊' : '🔇';
        });

        // Hover effects for placement
        const playerCells = document.querySelectorAll('#player-grid .cell');
        playerCells.forEach(cell => {
            cell.addEventListener('mouseenter', (e) => this.handlePlacementHover(e));
            cell.addEventListener('mouseleave', (e) => this.handlePlacementHoverExit(e));
        });
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r' && this.gameState === 'setup') {
                this.dom.rotateBtn.click();
            }
        });
    }

    startPlacementPhase() {
        this.gameState = 'setup';
        this.updateMessage(`Plaats je ${this.shipsToPlace[0].name} (Lengte: ${this.shipsToPlace[0].length})`);
        this.dom.renderBoard(this.human.gameboard, 'player');
        this.dom.switchView('player');
    }

    handlePlacementHover(e) {
        if (this.gameState !== 'setup' || this.currentShipIndex >= this.shipsToPlace.length) return;

        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);
        const length = this.shipsToPlace[this.currentShipIndex].length;

        // Preview logic
        // We need to calculate cells to highlight
        const coords = [];
        const isValid = this.human.gameboard.isValidPlacement(length, x, y, this.placementDirection);

        for (let i = 0; i < length; i++) {
            let cx = this.placementDirection === 'horizontal' ? x + i : x;
            let cy = this.placementDirection === 'horizontal' ? y : y + i;
            if (cx < 10 && cy < 10) {
                coords.push({ x: cx, y: cy });
            }
        }

        // Add preview classes manually for speed (bypassing full render)
        coords.forEach(c => {
            const cell = document.querySelector(`#player-grid .cell[data-x="${c.x}"][data-y="${c.y}"]`);
            if (cell) {
                cell.classList.add(isValid ? 'preview' : 'preview-invalid');
            }
        });
    }

    handlePlacementHoverExit(e) {
        // Clear previews
        const cells = document.querySelectorAll('#player-grid .cell');
        cells.forEach(c => {
            c.classList.remove('preview');
            c.classList.remove('preview-invalid');
        });
    }

    handlePlacementClick(x, y) {
        if (this.currentShipIndex >= this.shipsToPlace.length) return;

        const shipData = this.shipsToPlace[this.currentShipIndex];
        const newShip = new Ship(shipData.length);

        if (this.human.gameboard.placeShip(newShip, x, y, this.placementDirection)) {
            // Success
            this.currentShipIndex++;
            this.dom.renderBoard(this.human.gameboard, 'player');

            if (this.currentShipIndex < this.shipsToPlace.length) {
                this.updateMessage(`Plaats je ${this.shipsToPlace[this.currentShipIndex].name} (Lengte: ${this.shipsToPlace[this.currentShipIndex].length})`);
            } else {
                this.updateMessage("Alle schepen geplaatst! Klik op Start.");
                this.dom.startBtn.disabled = false;
            }
        } else {
            this.audio.playTone(150, 'sawtooth', 0.2); // Error buzz
            this.updateMessage("Ongeldige plaatsing!");
            setTimeout(() => {
                if (this.currentShipIndex < this.shipsToPlace.length) {
                    this.updateMessage(`Plaats je ${this.shipsToPlace[this.currentShipIndex].name}`);
                }
            }, 1000);
        }
    }

    randomizeHumanPlacement() {
        // Reset board first
        this.human = new Player('human');
        this.human.gameboard.initBoard(); // Clear grid

        const factoryShips = this.shipsToPlace.map(d => new Ship(d.length));
        this.human.randomizeShips(factoryShips);

        this.currentShipIndex = this.shipsToPlace.length; // All done
        this.dom.renderBoard(this.human.gameboard, 'player');
        this.dom.startBtn.disabled = false;
        this.updateMessage("Schepen willekeurig geplaatst.");
    }

    startGame() {
        this.gameState = 'playing';
        this.turn = 'player';
        this.turnCount = 0;
        this.dom.updateTurn(this.turnCount);

        // Setup Computer Board
        const factoryShips = this.shipsToPlace.map(d => new Ship(d.length));
        this.computer.randomizeShips(factoryShips);
        this.dom.renderBoard(this.computer.gameboard, 'computer');

        this.dom.enableGameMode();
        this.dom.switchView('computer'); // Start attacking
        this.updateMessage("Spel gestart! Jouw beurt. Val aan!");
    }

    handleAttackClick(x, y) {
        if (this.gameState !== 'playing' || this.turn !== 'player') return;

        // Attack computer
        const result = this.human.attack(this.computer.gameboard, x, y);

        if (result === 'already-shot') {
            this.updateMessage("Daar heb je al geschoten!");
            return;
        }

        this.dom.renderBoard(this.computer.gameboard, 'computer');

        if (result === 'hit') {
            this.audio.playHit();
            this.updateMessage("RAAK! Je mag nog eens.");
            this.checkGameOver();
            // In standard battleship, hit = shoot again. 
            // In turn-based view, we stay on computer board.
        } else if (result === 'sunk') {
            this.audio.playSunk();
            this.updateMessage("SCHIP GEZONKEN! Je mag nog eens.");
            this.checkGameOver();
        } else { // miss
            this.audio.playMiss();
            this.updateMessage("MIS! Computer aan de beurt.");
            this.switchTurn();
        }
    }

    switchTurn() {
        this.turn = this.turn === 'player' ? 'computer' : 'player';

        if (this.turn === 'computer') {
            this.turnCount++;
            this.dom.updateTurn(this.turnCount);

            // Switch view to Player Board so user can see defense
            setTimeout(() => {
                this.updateMessage("Computer is aan het denken...");
                this.dom.switchView('player');

                // Computer turn delay
                setTimeout(() => this.computerTurn(), 2000);
            }, 1000);
        } else {
            // Player's turn
            this.updateMessage("Jouw beurt! Val de vijand aan.");
            this.dom.switchView('computer');
        }
    }

    computerTurn() {
        if (this.gameState !== 'playing') return;

        const attackData = this.computer.computerAttack(this.human.gameboard);
        this.dom.renderBoard(this.human.gameboard, 'player');

        const result = attackData.result;

        if (result === 'hit') {
            this.audio.playHit();
            this.updateMessage(`Computer raakt op ${this.coordToText(attackData.x, attackData.y)}!`);
            // Computer shoots again? 
            setTimeout(() => this.computerTurn(), 1500);
        } else if (result === 'sunk') {
            this.audio.playSunk();
            this.updateMessage("Computer heeft een schip laten zinken!");
            setTimeout(() => this.computerTurn(), 1500);
        } else {
            this.audio.playMiss();
            this.updateMessage(`Computer mist op ${this.coordToText(attackData.x, attackData.y)}.`);

            // Switch back to player
            setTimeout(() => {
                this.checkGameOver();
                if (this.gameState === 'playing') {
                    // Turn is currently 'computer', switching it will set it to 'player'
                    this.switchTurn();
                }
            }, 2000);
        }
    }

    coordToText(x, y) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        return `${letters[x]}${y + 1}`;
    }

    checkGameOver() {
        if (this.computer.gameboard.allShipsSunk()) {
            this.gameState = 'ended';
            this.dom.setGameOver('player');
        } else if (this.human.gameboard.allShipsSunk()) {
            this.gameState = 'ended';
            this.dom.setGameOver('computer');
        }
    }

    updateMessage(msg) {
        this.dom.setMessage(msg);
    }

    restart() {
        window.location.reload();
    }
}
