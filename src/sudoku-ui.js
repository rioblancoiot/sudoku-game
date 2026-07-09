// src/sudoku-ui.js
import { SudokuGrid } from './sudoku-grid.js';
import { SudokuSolver } from './sudoku-solver.js';
import { SudokuGenerator } from './sudoku-generator.js';
import { SudokuHint } from './sudoku-hint.js';
import { SudokuProgress } from './sudoku-progress.js';

export class SudokuUI {
  constructor() {
    // Instantiate modules
    this.grid = new SudokuGrid();
    this.solver = new SudokuSolver();
    this.generator = new SudokuGenerator();
    this.hint = new SudokuHint(this.grid, this.solver);
    this.progress = new SudokuProgress();

    // Bind progress callbacks
    this.progress.onTimerUpdate = (timeString) => {
      this.updateTimerDisplay(timeString);
    };
    this.progress.onStateChange = () => {
      // We could update other things here, but for now we just update the UI on tick
      // We'll handle state changes via explicit calls
    };

    // State
    this.selectedCell = null;
    this.puzzleId = null;
    this.highlightConflictsEnabled = false;
  }

  /**
   * Initialize the UI: load saved state or start a new game, render, bind events
   */
  async init() {
    // Try to load a saved game
    const savedState = this.progress.loadState();
    if (savedState) {
      this.restoreGame(savedState);
    } else {
      // Start a new game with default difficulty
      await this.startNewGame();
    }

    // Render the initial state
    this.render();

    // Bind event listeners
    this.bindEvents();
  }

  /**
   * Start a new game with the given difficulty (or current selection)
   * @param {string} difficulty - 'easy', 'medium', or 'hard'
   */
  async startNewGame(difficulty = null) {
    // Get difficulty from UI if not provided
    if (!difficulty) {
      const difficultySelect = document.getElementById('difficulty-select');
      difficulty = difficultySelect.value;
    }

    // Generate a puzzle
    const { puzzle, solution } = this.generator.generatePuzzle(difficulty);
    this.puzzleId = Date.now().toString(); // simple ID

    // Load the puzzle into the grid
    this.grid.loadPuzzle(puzzle);

    // Start progress tracking
    this.progress.startNewGame(this.puzzleId, difficulty, puzzle, solution);

    // Reset UI state
    this.selectedCell = null;
    this.highlightConflictsEnabled = false;
    this.updateHintButtonStates();

    // Render
    this.render();
  }

  /**
   * Restore a game from saved state
   * @param {Object} state
   */
  restoreGame(state) {
    this.puzzleId = state.puzzleId;
    this.grid.loadPuzzle(state.grid.clues.map((v, i) => v + state.grid.userEntries[i] + state.grid.hints[i]));
    // Actually, we need to combine clues, userEntries, and hints.
    // Let's assume the grid's loadPuzzle expects the final values.
    // We'll create a combined array:
    const combined = state.grid.clues.map((clue, i) => {
      if (clue !== 0) return clue;
      if (state.grid.userEntries[i] !== 0) return state.grid.userEntries[i];
      if (state.grid.hints[i] !== 0) return state.grid.hints[i];
      return 0;
    });
    this.grid.loadPuzzle(combined);
    this.progress.resumeGame(state);
    this.selectedCell = null;
    this.highlightConflictsEnabled = false;
    this.updateHintButtonStates();
    this.render();
  }

  /**
   * Render the entire grid and update UI elements
   */
  render() {
    const gridContainer = document.getElementById('sudoku-grid');
    gridContainer.innerHTML = '';

    // Create 81 cells
    for (let i = 0; i < 81; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.index = i;

      const value = this.grid.getValue(i);
      if (value !== 0) {
        cell.textContent = value;
        if (this.grid.isGiven(i)) {
          cell.classList.add('given');
        } else {
          // Check if it's a hint? We don't have a direct way, but we can check if it's not user-entered?
          // For simplicity, we'll just style user-entered vs hint later.
          // We'll leave it as is for now.
        }
      }

      // Check for conflict
      if (this.grid.getConflicts().includes(i)) {
        cell.classList.add('conflict');
      }

      // Check if selected
      if (this.selectedCell === i) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', () => this.selectCell(i));
      gridContainer.appendChild(cell);
    }

    // Update stats
    this.updateTimerDisplay(this.progress.formatTime(this.progress.getElapsedMs()));
    this.updateMoveCount(this.progress.moveCount);

    // Update hint button states
    this.updateHintButtonStates();
  }

  /**
   * Select a cell
   * @param {number} index
   */
  selectCell(index) {
    // Deselect previous
    if (this.selectedCell !== null) {
      const prevCell = document.querySelector(`.cell[data-index="${this.selectedCell}"]`);
      if (prevCell) {
        prevCell.classList.remove('selected');
      }
    }

    this.selectedCell = index;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (cell) {
      cell.classList.add('selected');
    }

    // Update reveal button state
    this.updateHintButtonStates();
  }

  /**
   * Handle keyboard input
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    if (this.selectedCell === null) return;

    if (e.key >= '1' && e.key <= '9') {
      const num = parseInt(e.key);
      const success = this.grid.setValue(this.selectedCell, num);
      if (success) {
        this.progress.incrementMoves();
        this.render();
        this.checkForCompletion();
      }
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      const success = this.grid.clear(this.selectedCell);
      if (success) {
        this.progress.incrementMoves();
        this.render();
        this.checkForCompletion();
      }
    } else if (e.key === 'ArrowUp') {
      this.moveSelection(-9);
    } else if (e.key === 'ArrowDown') {
      this.moveSelection(9);
    } else if (e.key === 'ArrowLeft') {
      this.moveSelection(-1);
    } else if (e.key === 'ArrowRight') {
      this.moveSelection(1);
    } else if (e.key === 'Escape') {
      this.selectedCell = null;
      this.render();
    }
  }

  /**
   * Move selection by offset (with wrapping)
   * @param {number} offset
   */
  moveSelection(offset) {
    if (this.selectedCell === null) return;
    let newIndex = this.selectedCell + offset;
    const row = Math.floor(this.selectedCell / 9);
    const col = this.selectedCell % 9;

    if (offset === -9 && row === 0) newIndex = this.selectedCell + 72; // wrap to bottom
    else if (offset === 9 && row === 8) newIndex = this.selectedCell - 72; // wrap to top
    else if (offset === -1 && col === 0) newIndex = this.selectedCell + 8; // wrap to right
    else if (offset === 1 && col === 8) newIndex = this.selectedCell - 8; // wrap to left

    // Clamp to 0-80
    if (newIndex < 0) newIndex = 0;
    if (newIndex > 80) newIndex = 80;

    this.selectCell(newIndex);
  }

  /**
   * Update the timer display
   * @param {string} timeString
   */
  updateTimerDisplay(timeString) {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.textContent = timeString;
    }
  }

  /**
   * Update the move count display
   * @param {number} count
   */
  updateMoveCount(count) {
    const moveCountEl = document.getElementById('move-count');
    if (moveCountEl) {
      moveCountEl.textContent = count;
    }
  }

  /**
   * Update the enabled/disabled state of hint buttons
   */
  updateHintButtonStates() {
    const revealBtn = document.getElementById('reveal-cell-btn');
    const logicalBtn = document.getElementById('logical-hint-btn');
    if (this.selectedCell === null) {
      revealBtn.disabled = true;
      logicalBtn.disabled = true;
    } else {
      revealBtn.disabled = this.grid.isGiven(this.selectedCell);
      logicalBtn.disabled = false; // We always allow logical hint, though it might return null
    }
  }

  /**
   * Handle hint button clicks
   */
  async handleHighlightConflicts() {
    this.highlightConflictsEnabled = !this.highlightConflictsEnabled;
    this.progress.recordHint('conflicts');
    this.render();
  }

  async handleRevealCell() {
    if (this.selectedCell === null) return;
    const value = this.grid.getValue(this.selectedCell);
    if (value !== 0) return; // already filled

    // Reveal the solution value from the generator's solution? We don't have it stored.
    // Instead, we can use the solver to get the solution for the current puzzle.
    // But we don't have the solver's solution stored. We'll change the design: the generator returns solution.
    // We'll store the solution in the progress object? Actually, the progress object has the solution from the generator.
    // We'll change the progress to store the solution and make it accessible.
    // For now, we'll do a quick fix: we'll solve the puzzle using the solver to get the solution.
    // However, we already have the solution in the generator's generatePuzzle result, but we didn't store it.
    // Let's change the startNewGame to store the solution in the progress object and then use it here.
    // We'll do that by modifying the progress object to have a solution property and a getter.
    // But to keep changes minimal, we'll adjust the progress class to store the solution and provide a method to get it.
    // However, we are in the middle of the UI. Let's instead change the hint class to have access to the solution?
    // Actually, the hint class already has access to the solver, which can solve the puzzle.
    // We'll use the hint's revealCell method, which already uses the solver to get the solution.
    // So we can call this.hint.revealCell(this.selectedCell);
    const success = this.hint.revealCell(this.selectedCell);
    if (success) {
      this.progress.recordHint('reveal');
      this.render();
      this.checkForCompletion();
    }
  }

  async handleLogicalHint() {
    if (this.selectedCell === null) return;
    const hint = this.hint.getLogicalHint(this.selectedCell);
    if (hint) {
      // Show the hint in a dialog or toast
      alert(`Hint: ${hint}`);
      this.progress.recordHint('logical');
    } else {
      alert('No logical hint available for this cell at the moment.');
    }
  }

  /**
   * Check if the puzzle is completed and show a dialog
   */
  checkForCompletion() {
    if (this.grid.isComplete()) {
      this.progress.pauseTimer();
      setTimeout(() => {
        const timeTaken = this.progress.getElapsedMs();
        const moves = this.progress.moveCount;
        const hintsUsed = this.progress.hintsUsed;
        alert(`Congratulations! You solved the puzzle in ${this.formatTime(timeTaken)} with ${moves} moves and ${hintsUsed} hints.`);
        // Optionally, start a new game automatically
        // this.startNewGame();
      }, 300);
    }
  }

  /**
   * Format milliseconds to mm:ss
   * @param {number} ms
   * @returns {string}
   */
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Keyboard input
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // New game button
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.startNewGame());
    }

    // Restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.grid.reset();
        this.progress.resetMoves();
        this.selectedCell = null;
        this.highlightConflictsEnabled = false;
        this.updateHintButtonStates();
        this.render();
      });
    }

    // Difficulty change
    const difficultySelect = document.getElementById('difficulty-select');
    if (difficultySelect) {
      difficultySelect.addEventListener('change', () => {
        // If a game is in progress, ask to start a new game with the new difficulty?
        // For simplicity, we'll just start a new game when difficulty changes.
        this.startNewGame();
      });
    }

    // Hint buttons
    const highlightBtn = document.getElementById('highlight-conflicts-btn');
    if (highlightBtn) {
      highlightBtn.addEventListener('click', () => this.handleHighlightConflicts());
    }

    const revealBtn = document.getElementById('reveal-cell-btn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => this.handleRevealCell());
    }

    const logicalBtn = document.getElementById('logical-hint-btn');
    if (logicalBtn) {
      logicalBtn.addEventListener('click', () => this.handleLogicalHint());
    }

    // Handle visibility change to pause/resume timer when tab is hidden/shown
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.progress.pauseTimer();
      } else {
        this.progress.resumeTimer();
      }
    });
  }
}