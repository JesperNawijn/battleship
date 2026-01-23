class DOMController {
    constructor() {
        this.playerGrid = document.getElementById('player-grid');
        this.computerGrid = document.getElementById('computer-grid');

        // Sections for view switching
        this.playerSection = document.querySelector('.player-section');
        this.computerSection = document.querySelector('.computer-section');

        this.messageLog = document.getElementById('message-log');
        this.turnCount = document.getElementById('turn-count');

        // Buttons
        this.rotateBtn = document.getElementById('rotate-btn');
        this.startBtn = document.getElementById('start-btn');
        this.randomBtn = document.getElementById('random-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.modalRestartBtn = document.getElementById('modal-restart-btn');
        this.soundToggle = document.getElementById('sound-toggle');

        // Panels
        this.placementControls = document.getElementById('placement-controls');
        this.gameControls = document.getElementById('game-controls');
        this.modal = document.getElementById('modal-overlay');

        // State identifiers (callbacks will be attached)
        this.onCellClick = null; // function(x, y, gridOwner)
        this.onRotate = null;
        this.onStart = null;
        this.onRestart = null;
        this.onRandom = null;
    }

    switchView(viewName) {
        // Remove active class from both
        this.playerSection.classList.remove('active');
        this.computerSection.classList.remove('active');

        if (viewName === 'player' || viewName === 'setup') {
            this.playerSection.classList.add('active');
        } else if (viewName === 'computer') {
            this.computerSection.classList.add('active');
        }
    }

    initGrids() {
        this.playerGrid.innerHTML = '';
        this.computerGrid.innerHTML = '';

        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        // Helper to create grid with labels
        const createGridWithLabels = (gridElement, owner) => {
            // Top Left Corner (Empty)
            const emptyCorner = document.createElement('div');
            gridElement.appendChild(emptyCorner);

            // Top Row Labels (A-J)
            for (let i = 0; i < 10; i++) {
                const label = document.createElement('div');
                label.classList.add('label');
                label.textContent = letters[i];
                gridElement.appendChild(label);
            }

            for (let y = 0; y < 10; y++) {
                // Left Column Label (1-10)
                const label = document.createElement('div');
                label.classList.add('label');
                label.textContent = y + 1;
                gridElement.appendChild(label);

                for (let x = 0; x < 10; x++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    cell.dataset.owner = owner;

                    if (owner === 'computer') {
                        cell.addEventListener('click', () => {
                            if (this.onCellClick) this.onCellClick(x, y, 'computer');
                        });
                    } else {
                        cell.addEventListener('click', () => {
                            if (this.onCellClick) this.onCellClick(x, y, 'player');
                        });
                    }

                    gridElement.appendChild(cell);
                }
            }
        };

        createGridWithLabels(this.playerGrid, 'player');
        createGridWithLabels(this.computerGrid, 'computer');
    }

    renderBoard(gameboard, owner) {
        const grid = owner === 'player' ? this.playerGrid : this.computerGrid;
        const cells = grid.querySelectorAll('.cell');

        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);

            // Clear previous states but keep base classes
            cell.className = 'cell';

            const cellContent = gameboard.board[y][x];

            // Render Hit/Miss state
            if (cellContent === 'hit') {
                cell.classList.add('hit');
                // For player board we might want to show the ship underneath still?
                // The 'hit' class just adds the cross.
                // We need to check if there is a ship in the ships array that occupies this to add 'ship' class?
                // Wait, logic in Gameboard replaced ship obj with 'hit'. 
                // So we can't know if it was a ship easily just by cell content for 'hit'.
                // Actually, Gameboard logic: 
                // this.board[y][x] = 'hit';

                // If we want to show ships on player board, we need to iterate ships list.
            } else if (cellContent === 'miss') {
                cell.classList.add('miss');
            } else if (cellContent !== null && typeof cellContent === 'object') {
                // It is a ship (and not hit/miss yet)
                if (owner === 'player') {
                    cell.classList.add('ship');
                }
            }
        });

        // Re-apply ship styles for player (and sunk ships for computer)
        // using the gameboard.ships array is more reliable.
        // Apply detailed ship styles
        gameboard.ships.forEach(ship => {
            const isVertical = ship.coords[0].x === ship.coords[1]?.x;
            const directionClass = isVertical ? 'vertical' : 'horizontal';

            ship.coords.forEach((coord, index) => {
                const cell = grid.querySelector(`.cell[data-x="${coord.x}"][data-y="${coord.y}"]`);
                if (!cell) return;

                if (owner === 'player' || ship.isSunk()) {
                    cell.classList.add('ship', directionClass);

                    // Add position class for rounding corners
                    if (index === 0) cell.classList.add('start');
                    else if (index === ship.length - 1) cell.classList.add('end');
                    else cell.classList.add('mid');
                }

                if (ship.isSunk()) {
                    cell.classList.add('sunk');
                }
            });
        });

        // Let's refine the render loop based on the string values:
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const val = gameboard.board[y][x];

            if (val === 'hit') {
                cell.classList.add('hit');
                // For player, always show it was a ship
                if (owner === 'player') cell.classList.add('ship');
            } else if (val === 'miss') {
                cell.classList.add('miss');
            } else if (val && typeof val === 'object') {
                if (owner === 'player') cell.classList.add('ship');
            }
        });

        // Handle Sunk Ships separately to styling
        gameboard.ships.forEach(ship => {
            if (ship.isSunk()) {
                ship.coords.forEach(coord => {
                    // Find the cell in the correct grid
                    // We need to select by data attributes
                    const selector = `.cell[data-x="${coord.x}"][data-y="${coord.y}"]`;
                    const cell = grid.querySelector(selector);
                    if (cell) {
                        cell.classList.add('sunk');
                        cell.classList.remove('ship'); // Optional: change from ship color to sunk color entirely
                    }
                });
            }
        });
    }

    // Quick fix for renderBoard to support Sunk styling:
    // We will assume Gameboard or logic provides sunk coords or we just style all 'hit' as sunk? No.
    // I will update Ship/Gameboard in next step to store coordinates.
    // For now, write basic render.

    setMessage(msg) {
        this.messageLog.textContent = msg;
    }

    updateTurn(count) {
        this.turnCount.textContent = count;
    }

    setGameOver(winner) {
        this.modal.classList.remove('hidden');
        this.modal.style.opacity = '1';
        const title = document.getElementById('modal-title');
        const msg = document.getElementById('modal-message');

        if (winner === 'player') {
            title.textContent = 'Gewonnen!';
            title.style.color = '#00b4d8';
            msg.textContent = 'De vijand is verslagen. Uitstekend werk, kapitein.';
        } else {
            title.textContent = 'Verloren!';
            title.style.color = '#e63946';
            msg.textContent = 'Je vloot is gezonken. Volgende keer beter.';
        }
    }

    resetUI() {
        this.modal.classList.add('hidden');
        this.modal.style.opacity = '0';
        this.startBtn.disabled = true;
        this.placementControls.classList.remove('hidden');
        this.gameControls.classList.add('hidden');
        this.playerGrid.classList.add('placement-mode');
        this.computerGrid.classList.add('locked');
    }

    enableGameMode() {
        this.placementControls.classList.add('hidden');
        this.gameControls.classList.remove('hidden');
        this.playerGrid.classList.remove('placement-mode');
        this.computerGrid.classList.remove('locked');
    }
}
