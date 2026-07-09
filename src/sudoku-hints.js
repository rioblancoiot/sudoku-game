/**
 * Sudoku Hints Module
 * Provides conflict highlighting, cell reveal, and logical step hints
 */

export class SudokuHints {
  constructor(grid, solver, solution) {
    this.grid = grid;
    this.solver = solver;
    this.solution = solution; // Uint8Array(81)

    // State
    this.conflictHighlightEnabled = false;
    this.logicalHintHighlight = new Set(); // indices highlighted for logical hint

    // Usage tracking
    this.hintUsage = {
      conflicts: 0,
      reveals: 0,
      logical: 0
    };

    // Event listeners
    this.listeners = new Map();
  }

  /**
   * Toggle conflict highlighting
   * @param {boolean} enabled
   */
  toggleConflicts(enabled) {
    this.conflictHighlightEnabled = enabled;

    if (enabled) {
      this.highlightConflicts();
    } else {
      this.clearConflicts();
    }

    this.hintUsage.conflicts++;
    this.emit('conflictToggle', { enabled });
    this.emit('hintUsed', { type: 'conflicts' });
  }

  /**
   * Highlight all conflicting cells
   */
  highlightConflicts() {
    const conflicts = this.solver.getConflicts(this.getGridValues());
    for (const index of conflicts) {
      this.grid.cells[index].hasConflict = true;
    }
    this.grid.emit('conflictChange', { indices: conflicts, hasConflicts: conflicts.length > 0 });
  }

  /**
   * Clear conflict highlights (but keep internal conflict state)
   */
  clearConflicts() {
    const conflicts = this.solver.getConflicts(this.getGridValues());
    for (const index of conflicts) {
      this.grid.cells[index].hasConflict = false;
    }
    this.grid.emit('conflictChange', { indices: conflicts, hasConflicts: false });
  }

  /**
   * Reveal the correct value for a cell
   * @param {number} index - Cell index 0-80
   * @returns {boolean} True if revealed
   */
  revealCell(index) {
    const cell = this.grid.cells[index];

    // Don't reveal clues
    if (cell.isClue) return false;

    const value = this.solution[index];
    if (value === 0) return false;

    // Set as hint
    this.grid.setValue(index, value, 'hint');
    this.hintUsage.reveals++;
    this.emit('hintUsed', { type: 'reveals', cell: index, value });
    return true;
  }

  /**
   * Get the next logical solving step
   * @returns {Object} Hint result with technique, cells, explanation
   */
  getLogicalHint() {
    // Clear previous logical hint highlights
    this.clearLogicalHintHighlight();

    // Get current grid values
    const gridValues = this.getGridValues();

    // Ask solver for next step
    const step = this.solver.getNextStep(gridValues);

    if (!step) {
      return {
        technique: null,
        cells: [],
        explanation: 'No logical step available. This puzzle requires advanced techniques or trial and error.',
        eliminations: []
      };
    }

    // Highlight affected cells
    if (step.cells && step.cells.length > 0) {
      for (const cell of step.cells) {
        const index = cell.row * 9 + cell.col;
        this.logicalHintHighlight.add(index);
      }
      this.emit('logicalHintHighlight', { indices: Array.from(this.logicalHintHighlight) });
    }

    this.hintUsage.logical++;
    this.emit('hintUsed', { type: 'logical', technique: step.technique });

    return step;
  }

  /**
   * Clear logical hint highlights
   */
  clearLogicalHintHighlight() {
    if (this.logicalHintHighlight.size > 0) {
      this.emit('logicalHintHighlight', { indices: [] });
      this.logicalHintHighlight.clear();
    }
  }

  /**
   * Get hint usage statistics
   * @returns {Object}
   */
  getHintUsage() {
    return { ...this.hintUsage };
  }

  /**
   * Reset hint state (for new game)
   */
  reset() {
    this.conflictHighlightEnabled = false;
    this.clearLogicalHintHighlight();
    this.hintUsage = { conflicts: 0, reveals: 0, logical: 0 };
  }

  /**
   * Get current grid values as Uint8Array
   * @returns {Uint8Array}
   */
  getGridValues() {
    const values = new Uint8Array(81);
    for (let i = 0; i < 81; i++) {
      values[i] = this.grid.cells[i].value;
    }
    return values;
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, detail) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(detail);
        } catch (e) {
          console.error(`Error in ${event} listener:`, e);
        }
      }
    }
  }
}

export default SudokuHints;