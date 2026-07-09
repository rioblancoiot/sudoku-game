/**
 * Sudoku Generator Module
 * Generates valid Sudoku puzzles with unique solutions at different difficulty levels
 */

import { SudokuSolver } from './sudoku-solver.js';

const DIFFICULTY_CONFIG = {
  easy: { minClues: 36, maxClues: 45, targetClues: 40 },
  medium: { minClues: 28, maxClues: 35, targetClues: 32 },
  hard: { minClues: 22, maxClues: 27, targetClues: 25 }
};

const ALL_CANDIDATES = 0x1FF; // 511 = bits 0-8 set

function valueToMask(value) {
  return 1 << (value - 1);
}

function maskToValues(mask) {
  const values = [];
  for (let v = 1; v <= 9; v++) {
    if (mask & (1 << (v - 1))) values.push(v);
  }
  return values;
}

function popCount(mask) {
  return mask.toString(2).split('1').length - 1;
}

function lowestBit(mask) {
  return Math.log2(mask & -mask) + 1;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class SudokuGenerator {
  constructor(solver = new SudokuSolver()) {
    this.solver = solver;
  }

  /**
   * Generate a complete valid solution grid
   * Uses diagonal box filling + backtracking with MRV
   * @returns {Uint8Array} Complete solution (81 values, 1-9)
   */
  generateSolution() {
    const grid = new Uint8Array(81);
    const candidates = this.solver.initializeCandidates(grid);

    // Fill diagonal boxes first (they don't conflict)
    this.fillDiagonalBoxes(grid, candidates);

    // Solve the rest with backtracking
    if (this.backtrackSolution(grid, candidates)) {
      return grid;
    }

    // Retry if failed (should be very rare)
    return this.generateSolution();
  }

  /**
   * Fill the three diagonal 3x3 boxes with random permutations
   */
  fillDiagonalBoxes(grid, candidates) {
    for (let box = 0; box < 3; box++) {
      const boxRow = box * 3;
      const boxCol = box * 3;
      const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      let idx = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cell = (boxRow + r) * 9 + (boxCol + c);
          grid[cell] = digits[idx++];
          this.solver.placeValue(candidates, cell, grid[cell]);
        }
      }
    }
  }

  /**
   * Backtracking to complete the solution
   */
  backtrackSolution(grid, candidates) {
    // Find empty cell with fewest candidates (MRV)
    let bestCell = -1;
    let minCandidates = 10;

    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        const count = popCount(candidates[i]);
        if (count === 0) return false;
        if (count < minCandidates) {
          minCandidates = count;
          bestCell = i;
          if (count === 1) break;
        }
      }
    }

    if (bestCell === -1) return true; // Complete

    // Try candidates in random order
    const candidateValues = maskToValues(candidates[bestCell]);
    shuffle(candidateValues);

    for (const value of candidateValues) {
      const gridCopy = new Uint8Array(grid);
      const candidatesCopy = new Uint16Array(candidates);

      grid[bestCell] = value;
      if (this.solver.placeValue(candidates, bestCell, value)) {
        if (this.backtrackSolution(grid, candidates)) return true;
      }

      grid.set(gridCopy);
      candidates.set(candidatesCopy);
    }

    return false;
  }

  /**
   * Generate a puzzle at specified difficulty
   * @param {'easy'|'medium'|'hard'} difficulty
   * @returns {Promise<Object>} Puzzle object with puzzle, solution, difficulty, etc.
   */
  async generatePuzzle(difficulty = 'medium') {
    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

    // Generate solution
    const solution = this.generateSolution();

    // Create puzzle by removing digits while maintaining uniqueness
    const puzzle = this.removeDigits(solution, config);

    // Assess actual difficulty
    const assessment = this.assessDifficulty(puzzle);

    return {
      id: generateId(),
      difficulty: difficulty,
      puzzle: puzzle,
      solution: solution,
      clueCount: this.countClues(puzzle),
      difficultyScore: assessment.score,
      techniques: assessment.techniques
    };
  }

  /**
   * Remove digits from solution while maintaining unique solution
   */
  removeDigits(solution, config) {
    const puzzle = new Uint8Array(solution);
    const indices = shuffle(Array.from({ length: 81 }, (_, i) => i));
    let clueCount = 81;

    for (const index of indices) {
      if (clueCount <= config.targetClues) break;
      if (clueCount <= config.minClues) break;

      const backup = puzzle[index];
      puzzle[index] = 0;

      // Check uniqueness
      const result = this.solver.verifyUnique(puzzle);

      if (!result.unique) {
        // Restore - would lose uniqueness
        puzzle[index] = backup;
      } else {
        clueCount--;
      }
    }

    return puzzle;
  }

  /**
   * Count clues in puzzle
   */
  countClues(puzzle) {
    let count = 0;
    for (const v of puzzle) if (v !== 0) count++;
    return count;
  }

  /**
   * Assess puzzle difficulty based on required solving techniques
   */
  assessDifficulty(puzzle) {
    const grid = new Uint8Array(puzzle);
    const candidates = this.solver.initializeCandidates(grid);
    const techniquesUsed = new Set();
    let score = 0;

    // Technique scores by difficulty
    const techniqueScores = {
      nakedSingle: 1,
      hiddenSingle: 1,
      nakedPair: 2,
      hiddenPair: 2,
      pointingPair: 3,
      boxLineReduction: 3,
      nakedTriple: 4,
      hiddenTriple: 4,
      xWing: 5,
      swordfish: 6,
      xyWing: 5
    };

    const techniques = [
      'nakedSingle', 'hiddenSingle', 'nakedPair', 'hiddenPair',
      'pointingPair', 'boxLineReduction', 'nakedTriple', 'hiddenTriple',
      'xWing', 'swordfish', 'xyWing'
    ];

    let progress = true;
    let iterations = 0;

    while (progress && iterations < 100) {
      progress = false;
      iterations++;

      for (const techniqueName of techniques) {
        const technique = this.solver[techniqueName];
        if (!technique) continue;

        const step = technique.call(this.solver, grid, candidates);
        if (step) {
          // Apply the step
          if (step.placements && step.placements.length > 0) {
            for (const p of step.placements) {
              const idx = p.row * 9 + p.col;
              grid[idx] = p.value;
              this.solver.placeValue(candidates, idx, p.value);
            }
          }
          techniquesUsed.add(techniqueName);
          score += techniqueScores[techniqueName] || 1;
          progress = true;
          break; // Restart from easiest technique
        }
      }
    }

    // Determine level
    let level = 'easy';
    if (techniquesUsed.has('xWing') || techniquesUsed.has('swordfish') || techniquesUsed.has('xyWing')) {
      level = 'hard';
    } else if (techniquesUsed.has('nakedPair') || techniquesUsed.has('hiddenPair') ||
               techniquesUsed.has('pointingPair') || techniquesUsed.has('boxLineReduction') ||
               techniquesUsed.has('nakedTriple') || techniquesUsed.has('hiddenTriple')) {
      level = 'medium';
    }

    return { level, score, techniques: Array.from(techniquesUsed) };
  }
}

export default SudokuGenerator;