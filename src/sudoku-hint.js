// src/sudoku-hint.js
export class SudokuHint {
  constructor(grid, solver) {
    this.grid = grid;
    this.solver = solver;
  }

  /**
   * Get the set of conflicting cell indices
   * @returns {Set<number>}
   */
  getConflicts() {
    return new Set(this.grid.getConflicts());
  }

  /**
   * Toggle conflict highlighting (returns the current set of conflicts)
   * @param {boolean} enable - true to enable highlighting, false to disable
   * @returns {Set<number>} the set of conflicting cell indices
   */
  toggleConflicts(enable) {
    // The highlighting is done in the UI based on the conflict set from the grid
    // We just return the current conflicts
    return this.getConflicts();
  }

  /**
   * Reveal the value of a cell (if it's not a given)
   * @param {number} index - cell index (0-80)
   * @returns {number|null} the revealed value, or null if not allowed
   */
  revealCell(index) {
    if (this.grid.isGiven(index)) {
      return null; // cannot reveal a given
    }
    const solution = this.solver.solve(this.grid.getState());
    if (!solution) {
      return null; // should not happen if the puzzle is valid
    }
    const value = solution[index];
    // We don't actually set the value in the grid here; that's the UI's job
    // We'll return the value so the UI can set it as a hint
    return value;
  }

  /**
   * Get a logical hint for the current grid state
   * @returns {Object|null} an object with technique, cells, explanation, or null if no hint available
   */
  getLogicalHint() {
    // For simplicity, we'll just return the first empty cell and a random number? 
    // But we want a real logical hint. We'll implement a simple one: find a naked single.
    const gridState = this.grid.getState();
    // We'll use the solver to get the candidates for each cell
    // We don't have a method to get candidates in our current solver, so we'll add one?
    // Alternatively, we can just try to solve and see if there's a cell with only one candidate?
    // Let's add a method to the solver to get candidates for a cell.

    // Since we don't want to change the solver too much, we'll do a simple approach:
    // For each empty cell, check how many valid numbers can be placed there.
    // If there's exactly one, that's a naked single.
    for (let index = 0; index < 81; index++) {
      if (this.grid.getValue(index) === 0) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        let count = 0;
        let candidate = null;
        for (let num = 1; num <= 9; num++) {
          if (this.solver.isValidPlacement(gridState, row, col, num)) {
            count++;
            candidate = num;
          }
        }
        if (count === 1) {
          return {
            technique: 'Naked Single',
            cells: [index],
            explanation: `In cell (${row+1},${col+1}), the only possible value is ${candidate}.`
          };
        }
      }
    }
    // If we get here, no naked single found. We could look for other techniques, but for now return null.
    return null;
  }
}

export default SudokuHint;