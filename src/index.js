// src/index.js
import SudokuGrid from './sudoku-grid.js';
import SudokuSolver from './sudoku-solver.js';
import SudokuGenerator from './sudoku-generator.js';
import SudokuHint from './sudoku-hint.js';
import SudokuProgress from './sudoku-progress.js';
import SudokuUI from './sudoku-ui.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize core components
  const grid = new SudokuGrid();
  const solver = new SudokuSolver();
  const generator = new SudokuGenerator(solver);
  const hint = new SudokuHint(grid, solver);
  const progress = new SudokuProgress();
  const ui = new SudokuUI({ grid, solver, generator, hint, progress });

  // Start the UI
  ui.init();
});