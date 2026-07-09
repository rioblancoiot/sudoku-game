// src/sudoku-grid.js
/**
 * Sudoku Grid class
 * Stores the puzzle (initial clues) and the current state (user inputs)
 */
export class SudokuGrid {
  constructor() {
    this.size = 9;
    // 0 = empty, 1-9 = filled
    this.cells = Array(81).fill(0);
    // Which cells are given (cannot be edited by user)
    this.given = Array(81).fill(false);
  }

  /**
   * Load a puzzle (array of 81 integers, 0 for empty)
   * @param {number[]} puzzle - The puzzle to load
   */
  loadPuzzle(puzzle) {
    if (puzzle.length !== 81) {
      throw new Error('Puzzle must have 81 cells');
    }
    this.cells = puzzle.slice();
    this.given = puzzle.map(val => val !== 0);
  }

  /**
   * Get the value at a cell (0-80)
   * @param {number} index
   * @returns {number} 0-9
   */
  getValue(index) {
    return this.cells[index];
  }

  /**
   * Set a cell value (only if not a given)
   * @param {number} index
   * @param {number} value (1-9, or 0 to clear)
   * @returns {boolean} true if set, false if not allowed (trying to change a given)
   */
  setValue(index, value) {
    if (this.given[index]) {
      return false; // Cannot change given numbers
    }
    if (value < 0 || value > 9) {
      throw new Error('Value must be between 0 and 9');
    }
    this.cells[index] = value;
    return true;
  }

  /**
   * Clear a cell (set to 0) if not a given
   * @param {number} index
   * @returns {boolean} true if cleared, false if not allowed
   */
  clear(index) {
    if (this.given[index]) {
      return false;
    }
    this.cells[index] = 0;
    return true;
  }

  /**
   * Check if a cell is a given (original clue)
   * @param {number} index
   * @returns {boolean}
   */
  isGiven(index) {
    return this.given[index];
  }

  /**
   * Check if the current board is valid (no duplicates in rows, columns, or boxes)
   * @returns {boolean} true if valid
   */
  isValid() {
    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Set();
      for (let col = 0; col < 9; col++) {
        const val = this.getValue(row * 9 + col);
        if (val !== 0) {
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Set();
      for (let row = 0; row < 9; row++) {
        const val = this.getValue(row * 9 + col);
        if (val !== 0) {
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const seen = new Set();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            const val = this.getValue(row * 9 + col);
            if (val !== 0) {
              if (seen.has(val)) return false;
              seen.add(val);
            }
          }
        }
      }
    }
    return true;
  }

  /**
   * Check if the board is complete (all cells filled) and valid
   * @returns {boolean}
   */
  isComplete() {
    if (this.cells.includes(0)) return false;
    return this.isValid();
  }

  /**
   * Get a list of indices that are in conflict (duplicate in row, column, or box)
   * @returns {number[]} array of cell indices that have conflicts
   */
  getConflicts() {
    const conflicts = new Set();

    // Check rows
    for (let row = 0; row < 9; row++) {
      const seen = new Map(); // value -> first index where seen
      for (let col = 0; col < 9; col++) {
        const idx = row * 9 + col;
        const val = this.getValue(idx);
        if (val !== 0) {
          if (seen.has(val)) {
            conflicts.add(seen.get(val));
            conflicts.add(idx);
          } else {
            seen.set(val, idx);
          }
        }
      }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      const seen = new Map();
      for (let row = 0; row < 9; row++) {
        const idx = row * 9 + col;
        const val = this.getValue(idx);
        if (val !== 0) {
          if (seen.has(val)) {
            conflicts.add(seen.get(val));
            conflicts.add(idx);
          } else {
            seen.set(val, idx);
          }
        }
      }
    }

    // Check boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const seen = new Map();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            const idx = row * 9 + col;
            const val = this.getValue(idx);
            if (val !== 0) {
              if (seen.has(val)) {
                conflicts.add(seen.get(val));
                conflicts.add(idx);
              } else {
                seen.set(val, idx);
              }
            }
          }
        }
      }
    }

    return Array.from(conflicts);
  }

  /**
   * Get the current state as an array of 81 integers
   * @returns {number[]}
   */
  getState() {
    return this.cells.slice();
  }

  /**
   * Load state from an array of 81 integers
   * @param {number[]} state
   */
  loadState(state) {
    if (state.length !== 81) {
      throw new Error('State must have 81 cells');
    }
    this.cells = state.slice();
    // Note: we do not change the given array when loading state
    // The given array should remain as set by the puzzle
  }

  /**
   * Reset the board to the original puzzle (clears all user entries)
   */
  reset() {
    for (let i = 0; i < 81; i++) {
      if (!this.given[i]) {
        this.cells[i] = 0;
      }
    }
  }
}