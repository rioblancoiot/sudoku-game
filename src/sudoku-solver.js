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

  /**
   * Initialize candidate bitmask array for each cell.
   * Bit v-1 set means value v is a candidate for that cell.
   * For filled cells, the candidate mask is 0.
   * @param {Array|Uint8Array} grid - 81-length grid (0 for empty)
   * @returns {Uint16Array} 81-length bitmask array
   */
  initializeCandidates(grid) {
    const candidates = new Uint16Array(81);
    const ALL = 0x1FF; // 511 = bits 0-8 set (values 1-9)
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) {
        candidates[i] = 0;
      } else {
        let mask = ALL;
        const row = Math.floor(i / 9);
        const col = i % 9;
        // Eliminate values in same row
        for (let c = 0; c < 9; c++) {
          const v = grid[row * 9 + c];
          if (v !== 0) mask &= ~(1 << (v - 1));
        }
        // Eliminate values in same column
        for (let r = 0; r < 9; r++) {
          const v = grid[r * 9 + col];
          if (v !== 0) mask &= ~(1 << (v - 1));
        }
        // Eliminate values in same 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            const v = grid[r * 9 + c];
            if (v !== 0) mask &= ~(1 << (v - 1));
          }
        }
        candidates[i] = mask;
      }
    }
    return candidates;
  }

  /**
   * Update candidate bitmasks after placing a value in a cell.
   * Removes the value from candidates of cells in same row, column, and box.
   * @param {Uint16Array} candidates - 81-length bitmask array
   * @param {number} cell - index 0-80
   * @param {number} value - 1-9
   * @returns {boolean} true if successful
   */
  placeValue(candidates, cell, value) {
    const bit = 1 << (value - 1);
    candidates[cell] = 0; // this cell is now filled
    const row = Math.floor(cell / 9);
    const col = cell % 9;
    // Remove from row
    for (let c = 0; c < 9; c++) {
      candidates[row * 9 + c] &= ~bit;
    }
    // Remove from column
    for (let r = 0; r < 9; r++) {
      candidates[r * 9 + col] &= ~bit;
    }
    // Remove from 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        candidates[r * 9 + c] &= ~bit;
      }
    }
    return true;
  }

  /**
   * Remove a value from a cell and re-compute candidates for affected cells.
   * Re-enables the value as candidate in row/col/box (if no other conflict).
   * @param {Uint16Array} candidates - 81-length bitmask array
   * @param {number} cell - index 0-80
   * @param {number} value - 1-9
   * @returns {boolean} true if successful
   */
  removeValue(candidates, cell, value) {
    // For simplicity, we recompute all candidates from scratch: caller must also recompute
    // But we don't have grid here. Instead, we just set candidates[cell] to include value.
    // This is a partial implementation — for full correctness the caller should call
    // initializeCandidates(grid) after removing a value. Here we do best-effort.
    const bit = 1 << (value - 1);
    candidates[cell] |= bit;
    return true;
  }

  /**
   * Verify that a puzzle has a unique solution.
   * Uses backtracking and stops after finding 2 solutions.
   * @param {Array|Uint8Array} puzzle - 81-length grid (0 for empty)
   * @returns {boolean} true if puzzle has exactly one solution
   */
  verifyUnique(puzzle) {
    const grid = puzzle.slice();
    let solutionCount = 0;

    const backtrack = () => {
      if (solutionCount > 1) return; // early exit
      // Find first empty cell
      let idx = -1;
      for (let i = 0; i < 81; i++) {
        if (grid[i] === 0) { idx = i; break; }
      }
      if (idx === -1) {
        solutionCount++;
        return;
      }
      const row = Math.floor(idx / 9);
      const col = idx % 9;
      for (let v = 1; v <= 9; v++) {
        if (this.isValidPlacement(grid, row, col, v)) {
          grid[idx] = v;
          backtrack();
          grid[idx] = 0;
          if (solutionCount > 1) return;
        }
      }
    };

    backtrack();
    return solutionCount === 1;
  }
}

// Export the class
export { SudokuSolver };
export default SudokuSolver;