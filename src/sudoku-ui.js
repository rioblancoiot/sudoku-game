// src/sudoku-ui.js
import SudokuGrid from './sudoku-grid.js';
import SudokuSolver from './sudoku-solver.js';
import SudokuGenerator from './sudoku-generator.js';
import SudokuHint from './sudoku-hint.js';
import SudokuProgress from './sudoku-progress.js';

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
   * Handle cell click (already handled by selectCell via event listener)
   */

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
    this.render(); // re-render to show/hide conflict highlighting
  }

  async handleRevealCell() {
    if (this.selectedCell === null) return;
    const value = this.hint.revealCell(this.selectedCell);
    if (value !== null) {
      this.grid.setValue(this.selectedCell, value);
      this.progress.recordHint('reveals');
      this.render();
      this.checkForCompletion();
    }
  }

  async handleLogicalHint() {
    const hint = this.hint.getLogicalHint();
    if (hint) {
      // Show hint in dialog
      const hintContent = document.getElementById('hint-content');
      hintContent.innerHTML = `
        <strong>${hint.technique}</strong><br>
        ${hint.explanation}
      `;
      const hintDialog = document.getElementById('hint-dialog');
      hintDialog.showModal();
      this.progress.recordHint('logical');
    } else {
      alert('No logical hint available at this time.');
    }
  }

  /**
   * Handle game control buttons
   */
  handleNewGame() {
    this.startNewGame();
  }

  handleRestart() {
    this.progress.restartPuzzle();
    // Reset the grid to the original puzzle
    const combined = this.progress.getCurrentState().grid.clues.map((clue, i) => {
      if (clue !== 0) return clue;
      const user = this.progress.getCurrentState().grid.userEntries[i];
      const hint = this.progress.getCurrentState().grid.hints[i];
      if (user !== 0) return user;
      if (hint !== 0) return hint;
      return 0;
    });
    this.grid.loadPuzzle(combined);
    this.selectedCell = null;
    this.updateHintButtonStates();
    this.render();
  }

  /**
   * Check if the puzzle is complete and show game over dialog
   */
  checkForCompletion() {
    if (this.grid.isComplete()) {
      this.progress.completeGame();
      this.showGameOverDialog();
    }
  }

  /**
   * Show the game over dialog
   */
  showGameOverDialog() {
    const state = this.progress.getCurrentState();
    const timeString = this.progress.formatTime(state.timer.elapsedMs);
    const moveCount = state.moveCount;
    const hintCounts = state.hints;

    const content = document.getElementById('game-over-content');
    content.innerHTML = `
      <p>¡Felicitaciones! Has resuelto el Sudoku.</p>
      <p>Tiempo: ${timeString}</p>
      <p>Movimientos: ${moveCount}</p>
      <p>Pistas usadas: Conflictos: ${hintCounts.conflicts}, Revelar: ${hintCounts.reveals}, Lógica: ${hintCounts.logical}</p>
    `;
    const dialog = document.getElementById('game-over-dialog');
    dialog.showModal();
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Grid cell clicks are handled by the selectCell method via the click listener in render
    // We need to add the listener to each cell after rendering, but we can also use event delegation.
    // We'll use event delegation on the grid container.
    const gridContainer = document.getElementById('sudoku-grid');
    gridContainer.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (cell) {
        const index = parseInt(cell.dataset.index);
        this.selectCell(index);
      }
    });

    // Keyboard input
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Hint buttons
    document.getElementById('highlight-conflicts-btn').addEventListener('click', () => this.handleHighlightConflicts());
    document.getElementById('reveal-cell-btn').addEventListener('click', () => this.handleRevealCell());
    document.getElementById('logical-hint-btn').addEventListener('click', () => this.handleLogicalHint());

    // Game control buttons
    document.getElementById('new-game-btn').addEventListener('click', () => this.handleNewGame());
    document.getElementById('restart-btn').addEventListener('click', () => this.handleRestart());
    document.getElementById('play-again-btn').addEventListener('click', () => {
      document.getElementById('game-over-dialog').close();
      this.startNewGame();
    });
    document.getElementById('new-game-btn-dialog').addEventListener('click', () => {
      document.getElementById('game-over-dialog').close();
      this.startNewGame();
    });
    document.getElementById('hint-close-btn').addEventListener('click', () => {
      document.getElementById('hint-dialog').close();
    });

    // Difficulty selector change (optional: we could start a new game when changed, but we'll just let it affect next new game)
    // We'll do nothing here.

    // Visibility change (tab focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.progress.onVisibilityChange(true);
      } else {
        this.progress.onVisibilityChange(false);
      }
    });
  }
}