/**
 * Sudoku Progress Module
 * Handles timer, move counter, localStorage persistence, and game history
 */

const STORAGE_KEY = 'sudoku-game-state';
const HISTORY_KEY = 'sudoku-history';
const MAX_HISTORY = 100;
const SAVE_DEBOUNCE_MS = 1000;

export class SudokuProgress {
  constructor() {
    this.gameState = null;
    this.saveTimer = null;
    this.timerInterval = null;
    this.startTime = null;
    this.elapsedMs = 0;
    this.isRunning = false;
    this.moveCount = 0;
    this.hintCounts = { conflicts: 0, reveals: 0, logical: 0 };
    this.status = 'idle'; // 'idle' | 'playing' | 'paused' | 'completed'

    // Callbacks for UI updates
    this.onTimerUpdate = null;
    this.onStateChange = null;
  }

  /**
   * Start a new game
   * @param {string} puzzleId
   * @param {string} difficulty
   * @param {Uint8Array} puzzle - Initial puzzle grid
   * @param {Uint8Array} solution - Solution grid
   */
  startNewGame(puzzleId, difficulty, puzzle, solution) {
    this.gameState = {
      puzzleId,
      difficulty,
      grid: {
        clues: new Uint8Array(puzzle),
        userEntries: new Uint8Array(81),
        hints: new Uint8Array(81)
      },
      timer: {
        elapsedMs: 0,
        startedAt: Date.now(),
        isRunning: true
      },
      moveCount: 0,
      hints: { conflicts: 0, reveals: 0, logical: 0 },
      status: 'playing',
      startedAt: new Date().toISOString(),
      completedAt: null
    };

    this.elapsedMs = 0;
    this.moveCount = 0;
    this.hintCounts = { conflicts: 0, reveals: 0, logical: 0 };
    this.status = 'playing';
    this.startTime = Date.now();

    this.startTimer();
    this.saveState();
    this.emitStateChange();
  }

  /**
   * Resume a saved game
   * @param {Object} state
   */
  resumeGame(state) {
    this.gameState = state;
    this.elapsedMs = state.timer.elapsedMs;
    this.moveCount = state.moveCount;
    this.hintCounts = { ...state.hints };
    this.status = state.status;

    if (state.timer.isRunning) {
      this.startTime = Date.now() - this.elapsedMs;
      this.startTimer();
    }

    this.emitStateChange();
  }

  /**
   * Start the timer
   */
  startTimer() {
    if (this.timerInterval) return;

    this.isRunning = true;
    if (!this.startTime) this.startTime = Date.now();

    this.timerInterval = setInterval(() => {
      this.elapsedMs = Date.now() - this.startTime;
      if (this.gameState) {
        this.gameState.timer.elapsedMs = this.elapsedMs;
      }
      if (this.onTimerUpdate) {
        this.onTimerUpdate(this.formatTime(this.elapsedMs));
      }
    }, 1000);

    // Immediate update
    if (this.onTimerUpdate) {
      this.onTimerUpdate(this.formatTime(this.elapsedMs));
    }
  }

  /**
   * Pause the timer
   */
  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
    this.elapsedMs = Date.now() - this.startTime;

    if (this.gameState) {
      this.gameState.timer.elapsedMs = this.elapsedMs;
      this.gameState.timer.isRunning = false;
    }
    this.saveState();
  }

  /**
   * Resume the timer
   */
  resumeTimer() {
    if (!this.isRunning) {
      this.startTime = Date.now() - this.elapsedMs;
      this.startTimer();
      if (this.gameState) {
        this.gameState.timer.isRunning = true;
      }
      this.saveState();
    }
  }

  /**
   * Stop the timer (game complete)
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
    this.elapsedMs = Date.now() - this.startTime;

    if (this.gameState) {
      this.gameState.timer.elapsedMs = this.elapsedMs;
      this.gameState.timer.isRunning = false;
    }
  }

  /**
   * Increment move counter
   * @returns {number} New move count
   */
  incrementMoves() {
    this.moveCount++;
    if (this.gameState) {
      this.gameState.moveCount = this.moveCount;
    }
    this.saveState();
    return this.moveCount;
  }

  /**
   * Record hint usage
   * @param {'conflicts'|'reveals'|'logical'} type
   */
  recordHint(type) {
    if (this.hintCounts.hasOwnProperty(type)) {
      this.hintCounts[type]++;
    }
    if (this.gameState) {
      this.gameState.hints = { ...this.hintCounts };
    }
    this.saveState();
  }

  /**
   * Update grid state in progress
   * @param {Object} gridState - Serialized grid state
   */
  updateGridState(gridState) {
    if (this.gameState) {
      this.gameState.grid = gridState;
    }
    this.saveState();
  }

  /**
   * Save current state to localStorage (debounced)
   */
  saveState() {
    if (!this.gameState) return;

    // Update timer
    if (this.isRunning) {
      this.elapsedMs = Date.now() - this.startTime;
      this.gameState.timer.elapsedMs = this.elapsedMs;
    }

    // Debounce save
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.doSave(), SAVE_DEBOUNCE_MS);
  }

  /**
   * Actually save to localStorage
   */
  doSave() {
    if (!this.gameState) return;

    try {
      const stateToSave = {
        ...this.gameState,
        grid: {
          clues: Array.from(this.gameState.grid.clues),
          userEntries: Array.from(this.gameState.grid.userEntries),
          hints: Array.from(this.gameState.grid.hints)
        },
        timer: {
          ...this.gameState.timer,
          elapsedMs: this.elapsedMs
        },
        moveCount: this.moveCount,
        hints: this.hintCounts
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // Try to clear old history and retry
        this.clearOldHistory();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.gameState));
        } catch (e2) {
          console.error('Failed to save game state:', e2);
        }
      } else {
        console.error('Failed to save game state:', e);
      }
    }
  }

  /**
   * Load saved game state from localStorage
   * @returns {Object | null}
   */
  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const state = JSON.parse(saved);

      // Convert arrays back to Uint8Arrays
      if (state.grid) {
        state.grid.clues = new Uint8Array(state.grid.clues || 81);
        state.grid.userEntries = new Uint8Array(state.grid.userEntries || 81);
        state.grid.hints = new Uint8Array(state.grid.hints || 81);
      }

      // Validate state
      if (!state.puzzleId || !state.difficulty || !state.grid) {
        return null;
      }

      return state;
    } catch (e) {
      console.error('Failed to load game state:', e);
      return null;
    }
  }

  /**
   * Clear saved game state
   */
  clearState() {
    localStorage.removeItem(STORAGE_KEY);
    this.gameState = null;
  }

  /**
   * Mark game as completed
   * @returns {Object} Game result
   */
  completeGame() {
    this.stopTimer();
    this.status = 'completed';

    const result = {
      puzzleId: this.gameState?.puzzleId,
      difficulty: this.gameState?.difficulty,
      timeMs: this.elapsedMs,
      moveCount: this.moveCount,
      hints: { ...this.hintCounts },
      completedAt: new Date().toISOString(),
      noHints: this.hintCounts.conflicts === 0 && this.hintCounts.reveals === 0 && this.hintCounts.logical === 0
    };

    if (this.gameState) {
      this.gameState.status = 'completed';
      this.gameState.completedAt = result.completedAt;
    }

    this.addToHistory(result);
    this.saveState();
    this.emitStateChange();

    return result;
  }

  /**
   * Add completed game to history
   * @param {Object} result
   */
  addToHistory(result) {
    try {
      const history = this.getHistory();
      history.unshift(result);

      // Limit history size
      if (history.length > MAX_HISTORY) {
        history.length = MAX_HISTORY;
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }

  /**
   * Get game history
   * @returns {Object[]}
   */
  getHistory() {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }

  /**
   * Clear old history entries to free space
   */
  clearOldHistory() {
    const history = this.getHistory();
    if (history.length > 10) {
      history.length = 10;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }

  /**
   * Get statistics summary
   * @returns {Object}
   */
  getStatistics() {
    const history = this.getHistory();

    const stats = {
      totalGames: history.length,
      byDifficulty: { easy: 0, medium: 0, hard: 0 },
      bestTime: { easy: null, medium: null, hard: null },
      averageTime: { easy: 0, medium: 0, hard: 0 },
      completionRate: { easy: 0, medium: 0, hard: 0 },
      noHintGames: 0
    };

    const timesByDiff = { easy: [], medium: [], hard: [] };
    const completionsByDiff = { easy: 0, medium: 0, hard: 0 };
    const attemptsByDiff = { easy: 0, medium: 0, hard: 0 };

    // We'd need to track attempts vs completions for true completion rate
    // For now, just use completed games

    for (const game of history) {
      const diff = game.difficulty;
      if (!timesByDiff[diff]) continue;

      timesByDiff[diff].push(game.timeMs);
      completionsByDiff[diff]++;

      if (stats.bestTime[diff] === null || game.timeMs < stats.bestTime[diff]) {
        stats.bestTime[diff] = game.timeMs;
      }

      if (game.noHints) stats.noHintGames++;
    }

    for (const diff of ['easy', 'medium', 'hard']) {
      const times = timesByDiff[diff];
      if (times.length > 0) {
        stats.byDifficulty[diff] = times.length;
        stats.averageTime[diff] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
    }

    return stats;
  }

  /**
   * Format milliseconds as MM:SS or HH:MM:SS
   * @param {number} ms
   * @returns {string}
   */
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get current elapsed time in ms
   * @returns {number}
   */
  getElapsedMs() {
    if (this.isRunning && this.startTime) {
      return Date.now() - this.startTime;
    }
    return this.elapsedMs;
  }

  /**
   * Handle visibility change (tab focus/blur)
   * @param {boolean} hidden
   */
  onVisibilityChange(hidden) {
    if (!this.gameState || this.status !== 'playing') return;

    if (hidden) {
      this.pauseTimer();
    } else {
      this.resumeTimer();
    }
  }

  /**
   * Get current game state for UI restoration
   * @returns {Object | null}
   */
  getCurrentState() {
    return this.gameState ? {
      puzzleId: this.gameState.puzzleId,
      difficulty: this.gameState.difficulty,
      grid: this.gameState.grid,
      timer: { elapsedMs: this.getElapsedMs(), isRunning: this.isRunning },
      moveCount: this.moveCount,
      hints: { ...this.hintCounts },
      status: this.status
    } : null;
  }

  /**
   * Restart current puzzle (reset user entries, keep clues)
   */
  restartPuzzle() {
    if (!this.gameState) return;

    // Reset grid to clues only
    this.gameState.grid.userEntries.fill(0);
    this.gameState.grid.hints.fill(0);
    this.moveCount = 0;
    this.hintCounts = { conflicts: 0, reveals: 0, logical: 0 };
    this.elapsedMs = 0;
    this.startTime = Date.now();

    if (this.gameState.timer) {
      this.gameState.timer.elapsedMs = 0;
      this.gameState.timer.startedAt = this.startTime;
    }

    this.saveState();
    this.emitStateChange();
  }

  /**
   * Set callback for timer updates
   * @param {Function} callback
   */
  setTimerCallback(callback) {
    this.onTimerUpdate = callback;
  }

  /**
   * Set callback for state changes
   * @param {Function} callback
   */
  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  /**
   * Emit state change event
   */
  emitStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getCurrentState());
    }
  }
}

export default SudokuProgress;