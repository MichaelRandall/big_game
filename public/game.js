const socket = io();

const statusText = document.getElementById('status');
const cells = document.querySelectorAll('.cell');

let mySymbol = null;       
let currentTurn = 'X';     
let gameActive = true;     // 1. New: Tracks if the game is still playable

// 2. New: Our virtual board state to check for wins
let boardState = ["", "", "", "", "", "", "", "", ""];

// 3. New: All 8 possible winning combinations on a 3x3 grid
const winningConditions = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
];

socket.on('connect', () => {
    statusText.innerText = "Connecting to room...";
    socket.emit('joinGame', 'family-room');
});

socket.on('playerAssigned', (data) => {
    mySymbol = data.symbol;
    currentTurn = data.turn;
    if (mySymbol !== 'Spectator') updateStatusMessage();
});

// Listen for opponent moves
socket.on('moveMade', (data) => {
    const targetCell = document.querySelector(`.cell[data-index="${data.index}"]`);
    if (targetCell) {
        targetCell.innerText = data.player;
        boardState[data.index] = data.player; // Update local state
    }
    
    // Check if the opponent just won the game
    checkGameOver();

    if (gameActive) {
        currentTurn = (data.player === 'X') ? 'O' : 'X';
        updateStatusMessage();
    }
});

// Handle clicking a square
cells.forEach(cell => {
    cell.addEventListener('click', (e) => {
        const clickedIndex = parseInt(e.target.getAttribute('data-index'));
        
        if (!gameActive || !mySymbol || mySymbol === 'Spectator') return;
        if (mySymbol !== currentTurn) return;
        if (boardState[clickedIndex] !== "") return;

        // Make move locally
        e.target.innerText = mySymbol;
        boardState[clickedIndex] = mySymbol;

        // Send to server
        socket.emit('makeMove', {
            room: 'family-room',
            index: clickedIndex,
            player: mySymbol
        });

        // Check if YOU just won the game
        checkGameOver();

        if (gameActive) {
            currentTurn = (mySymbol === 'X') ? 'O' : 'X';
            updateStatusMessage();
        }
    });
});

// 4. New Function: Evaluates the board state for Win/Loss/Draw
function checkGameOver() {
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = boardState[winCondition[0]]; // Fix check
        let b = boardState[winCondition[1]]; // Fix check
        let c = boardState[winCondition[2]]; // Fix check

        if (a === '' || b === '' || c === '') continue;

        if (a === b && b === c) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        // Check if the current client is the winner or loser
        if (currentTurn === mySymbol) {
            statusText.innerText = `🎉 You Win! Congratulations!`;
        } else {
            statusText.innerText = `😢 Player ${currentTurn} Won! Better luck next time!`;
        }
        return;
    }

    // Check for a Draw (No empty strings left on the board)
    let roundDraw = !boardState.includes("");
    if (roundDraw) {
        gameActive = false;
        statusText.innerText = "🤝 It's a Draw! Refresh to play again.";
        return;
    }
}

function updateStatusMessage() {
    if (mySymbol === currentTurn) {
        statusText.innerText = `Your turn! You are Player ${mySymbol}`;
    } else {
        statusText.innerText = `Waiting for Player ${currentTurn}... (You are ${mySymbol})`;
    }
}
