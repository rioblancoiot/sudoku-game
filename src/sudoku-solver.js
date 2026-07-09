// Sudoku Solver and Validator
class SudokuSolver {
  constructor() {
    this.size = 9;
    this.boxSize = 3;
  }

  // Validate a grid: check for duplicates in rows, columns, boxes
  // Returns { valid: boolean, conflicts: Set of indices }
  validate(grid) {
    const conflicts = new Set();
    // Check rows
    for (let r = 0; r < this.size; r++) {
      const seen = new Set();
      for (let c = 0; c < this.size; c++) {
        const val = grid[r * this.size + c];
        if (val !== 0) {
          if (seen.has(val)) {
            // Add all occurrences of this value in the row
            for (let c2 = 0; c2 < this.size; c2++) {
              if (grid[r * this.size + c2] === val) {
                conflicts.add(r * this.size + c2);
              }
            }
          } else {
            seen.add(val);
          }
        }
      }
    }
    // Check columns
    for (let c = 0; c < this.size; c++) {
      const seen = new Set();
      for (let r = 0; r < this.size; r++) {
        const val = grid[r * this.size + c];
        if (val !== 0) {
          if (seen.has(val)) {
            for (let r2 = 0; r2 < this.size; r2++) {
              if (grid[r2 * this.size + c] === val) {
                conflicts.add(r2 * this.size + c);
              }
            }
          } else {
            seen.add(val);
          }
        }
      }
    }
    // Check boxes
    for (let blockRow = 0; blockRow < this.size; blockRow += this.boxSize) {
      for (let blockCol = 0; blockCol < this.size; blockCol += this.boxSize) {
        const seen = new Set();
        for (let r = 0; r < this.boxSize; r++) {
          for (let c = 0; c < this.boxSize; c++) {
            const idx = (blockRow + r) * this.size + (blockCol + c);
            const val = grid[idx];
            if (val !== 0) {
              if (seen.has(val)) {
                for (let r2 = 0; r2 < this.boxSize; r2++) {
                  for (let c2 = 0; c2 < this.boxSize; c2++) {
                    const idx2 = (blockRow + r2) * this.size + (blockCol + c2);
                    if (grid[idx2] === val) {
                      conflicts.add(idx2);
                    }
                  }
                }
              } else {
                seen.add(val);
              }
            }
          }
        }
      }
    }
    return {
      valid: conflicts.size === 0,
      conflicts: Array.from(conflicts)
    };
  }

  // Check if the grid is completely filled and valid
  isCompleteAndValid(grid) {
    for (let i = 0; i < this.size * this.size; i++) {
      if (grid[i] === 0) return false;
    }
    return this.validate(grid).valid;
  }

  // Solve the puzzle using backtracking (returns true if solvable)
  // This function modifies the grid in-place (we'll use a copy)
  solveGrid(grid) {
    const empty = this.findEmptyCell(grid);
    if (empty === -1) return true; // no empty cell

    const row = Math.floor(empty / this.size);
    const col = empty % this.size;

    for (let num = 1; num <= this.size; num++) {
      if (this.isValidPlacement(grid, row, col, num)) {
        grid[empty] = num;
        if (this.solveGrid(grid)) {
          return true;
        }
        grid[empty] = 0; // backtrack
      }
    }
    return false; // trigger backtracking
  }

  // Check if placing num at (row, col) is valid
  isValidPlacement(grid, row, col, num) {
    // Check row
    for (let c = 0; c < this.size; c++) {
      if (grid[row * this.size + c] === num) return false;
    }
    // Check column
    for (let r = 0; r < this.size; r++) {
      if (grid[r * this.size + col] === num) return false;
    }
    // Check box
    const boxRow = Math.floor(row / this.boxSize) * this.boxSize;
    const boxCol = Math.floor(col / this.boxSize) * this.boxSize;
    for (let r = 0; r < this.boxSize; r++) {
      for (let c = 0; c < this.boxSize; c++) {
        if (grid[(boxRow + r) * this.size + (boxCol + c)] === num) return false;
      }
    }
    return true;
  }

  // Find the next empty cell (returns index or -1)
  findEmptyCell(grid) {
    for (let i = 0; i < this.size * this.size; i++) {
      if (grid[i] === 0) return i;
    }
    return -1;
  }

  // Check if a puzzle has exactly one solution
  hasUniqueSolution(puzzle) {
    const copy = puzzle.slice();
    let solutionCount = 0;
    const stopAtTwo = () => {
      return solutionCount >= 2;
    };
    this._solveAndCount(copy, stopAtTwo);
    return solutionCount === 1;
  }

  // Helper for counting solutions (stops at limit)
  _solveAndCount(grid, stopCallback) {
    const empty = this.findEmptyCell(grid);
    if (empty === -1) {
      // Found a solution
      solutionCount++;
      return;
    }
    if (stopCallback && stopCallback()) return;

    const row = Math.floor(empty / this.size);
    const col = empty % this.size;

    for (let num = 1; num <= this.size; num++) {
      if (this.isValidPlacement(grid, row, col, num)) {
        grid[empty] = num;
        this._solveAndCount(grid, stopCallback);
        if (stopCallback && stopCallback()) return;
        grid[empty] = 0; // backtrack
      }
    }
  }

  // Get a solved version of the puzzle (if unique)
  solve(puzzle) {
    const copy = puzzle.slice();
    if (this.solveGrid(copy)) {
      return copy;
    }
    return null; // unsolvable
  }

  // Generate a full solved board (for generation)
  generateFilledBoard() {
    const board = Array(this.size * this.size).fill(0);
    this.fillDiagonalBoxes(board);
    this.fillRemaining(board, 0, this.boxSize); // start after first diagonal block
    return board;
  }

  // Fill the diagonal boxes (they are independent)
  fillDiagonalBoxes(board) {
    for (let i = 0; i < this.size; i += this.boxSize) {
      this.fillBox(board, i * this.size + i); // top-left of box at (i,i)
    }
  }

  // Fill a 3x3 box with random numbers
  fillBox(board, startIndex) {
    const nums = shuffle([1,2,3,4,5,6,7,8,9]);
    for (let i = 0; i < this.boxSize; i++) {
      for (let j = 0; j < this.boxSize; j++) {
        const row = Math.floor(startIndex / this.size) + i;
        const col = (startIndex % this.size) + j;
        board[row * this.size + col] = nums[i * this.boxSize + j];
      }
    }
  }

  // Recursively fill the remaining cells
  fillRemaining(board, row, col) {
    if (row >= this.size - 1 && col >= this.size) {
      return true;
    }
    if (col >= this.size) {
      row++;
      col = 0;
    }
    if (row >= this.size) {
      return true;
    }
    if (board[row * this.size + col] !== 0) {
      return this.fillRemaining(board, row, col + 1);
    }
    for (let num = 1; num <= this.size; num++) {
      if (this.isValidPlacement(board, row, col, num)) {
        board[row * this.size + col] = num;
        if (this.fillRemaining(board, row, col + 1)) {
          return true;
        }
        board[row * this.size + col] = 0; // backtrack
      }
    }
    return false;
  }

  // Helper to shuffle an array (Fisher-Yates)
  static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Export the class
export { SudokuSolver };
export default SudokuSolver;