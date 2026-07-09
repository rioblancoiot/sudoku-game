
const boardSize = 9;
let board = [];
let original = [];

function generateSudoku() {
    // Simple backtracking to fill a complete board
    const fillBoard = (board) => {
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            if (board[row][col] === 0) {
                const nums = shuffle([1,2,3,4,5,6,7,8,9]);
                for (const n of nums) {
                    if (isValid(board, row, col, n)) {
                        board[row][col] = n;
                        if (fillBoard(board)) return true;
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    };
    // initialize empty board
    board = Array.from({length: 9}, () => Array(9).fill(0));
    fillBoard(board);
    // remove some numbers to create puzzle
    const attempts = 40;
    original = board.map(row => [...row]);
    for (let i = 0; i < attempts; i++) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);
        while (board[row][col] === 0) {
            row = Math.floor(Math.random() * 9);
            col = Math.floor(Math.random() * 9);
        }
        board[row][col] = 0;
    }
    render();
}

function isValid(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num || board[x][col] === num) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[startRow + i][startCol + j] === num) return false;
        }
    }
    return true;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function render() {
    const boardDiv = document.getElementById('game-board');
    boardDiv.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (original[r][c] !== 0) {
                cell.textContent = board[r][c];
                cell.classList.add('fixed');
            } else {
                cell.textContent = board[r][c] === 0 ? '' : board[r][c];
                cell.addEventListener('click', () => {
                    if (cell.classList.contains('fixed')) return;
                    const input = prompt('Ingrese un número (1-9):');
                    const num = parseInt(input);
                    if (!isNaN(num) && num >= 1 && num <= 9) {
                        if (isValid(board, r, c, num)) {
                            board[r][c] = num;
                            cell.textContent = num;
                            if (isSolved()) alert('¡Felicitaciones! Has resuelto el Sudoku.');
                        } else {
                            alert('Número inválido según las reglas de Sudoku.');
                        }
                    }
                });
            }
            boardDiv.appendChild(cell);
        }
    }
}

function isSolved() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) return false;
            // check row
            for (let c2 = 0; c2 < 9; c2++) {
                if (c2 !== c && board[r][c2] === board[r][c]) return false;
            }
            // check column
            for (let r2 = 0; r2 < 9; r2++) {
                if (r2 !== r && board[r2][c] === board[r][c]) return false;
            }
            // check 3x3
            const startR = Math.floor(r / 3) * 3;
            const startC = Math.floor(c / 3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if ((startR + i !== r || startC + j !== c) && board[startR + i][startC + j] === board[r][c]) return false;
                }
            }
        }
    }
    return true;
}

document.getElementById('new-game').addEventListener('click', generateSudoku);
// Initialize first game
generateSudoku();
