# Design Document: Sudoku Game

## 1. High-Level Architecture

### 1.1 Overview
A vanilla JavaScript (ES Modules) Sudoku game with clean separation of concerns across six core modules. The architecture follows a unidirectional data flow: UI → Grid → Solver/Generator/Hints → State Persistence.

```
┌─────────────────────────────────────────────────────────────────┐
│                        sudoku-ui.js (Controller)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Difficulty  │  │   Game      │  │  Hint       │             │
│  │ Selector    │  │   Flow      │  │  Buttons    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        sudoku-grid.js (Model)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Grid State  │  │   Conflict   │  │   Selection  │          │
│  │  (clues,     │  │   Detection  │  │   Manager    │          │
│  │   entries,   │  │  (row/col/   │  │  (navigation,│          │
│  │   hints)     │  │   box)       │  │   events)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼──────────────────┼──────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌──────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ sudoku-solver.js │ │sudoku-gen.  │ │ sudoku-hints.js │
│ (Engine)         │ │  .js        │ │ (Hints)         │
│                  │ │ (Generator) │ │                 │
│ - Validate       │ │             │ │ - Conflicts     │
│ - Solve (logic)  │ │ - Gen sol.  │ │ - Reveal cell   │
│ - Uniqueness     │ │ - Remove    │ │ - Logical step  │
│ - Candidates     │ │   digits    │ │ - Explanations  │
│ - Backtracking   │ │ - Difficulty│ └────────┬────────┘
└────────┬─────────┘ └──────┬──────┘           │
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      sudoku-progress.js (Persistence)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Timer      │  │  Move Count  │  │  localStorage│          │
│  │  (timer)     │  │  (moves)     │  │  (save/load) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Module Responsibilities

| Module | File | Responsibility |
|--------|------|----------------|
| **Grid** | `sudoku-grid.js` | Core data model: 9×9 cell state (clues, user entries, hints), conflict detection, selection management, serialization, completion check, event emission |
| **Generator** | `sudoku-generator.js` | Puzzle generation: create valid solution grid → remove digits while maintaining uniqueness → assess difficulty → return puzzle + solution |
| **Solver** | `sudoku-solver.js` | Logical solving engine: validation, uniqueness check, candidate management, logical techniques (singles, pairs, triples, pointing, box-line), advanced techniques (X-Wing, Swordfish), backtracking fallback, next-step hints |
| **Hints** | `sudoku-hints.js` | User-facing hint system: conflict highlighting toggle, cell reveal, logical step with natural-language explanation, usage tracking, accessibility |
| **Progress** | `sudoku-progress.js` | Game session tracking: timer (pause/resume), move counter, localStorage persistence (save/load), game history |
| **UI** | `sudoku-ui.js` | Controller: DOM rendering, event binding, difficulty selector, game flow (new/pause/resume/complete), keyboard/touch input, responsive rendering |

### 1.3 Data Flow

```
┌──────────────┐     newGame(difficulty)      ┌──────────────────┐
│   sudoku-ui  │ ──────────────────────────▶  │ sudoku-generator │
└──────┬───────┘                              └────────┬─────────┘
       │                                               │
       │  { puzzle, solution, difficulty }             │
       │◀──────────────────────────────────────────────┘
       │
       │  init(puzzle, solution)
       ▼
┌──────────────┐     cellChange/conflictChange/       ┌──────────────────┐
│ sudoku-grid  │ ◀─────────────────────────────────▶  │   sudoku-ui      │
│   (state)    │         selectionChange/complete     │   (view + ctrl)  │
└──────┬───────┘                                      └────────┬─────────┘
       │                                                       │
       │  validate()/solve()/getNextStep()                     │
       │◀──────────────────────────────────────────────────────┤
       │                                                       │
       ▼                                                       ▼
┌──────────────────┐                              ┌──────────────────┐
│  sudoku-solver   │                              │  sudoku-hints    │
│   (engine)       │                              │   (hints UI)     │
└──────────────────┘                              └──────────────────┘
       │                                                   │
       │  saveState()/loadState()                          │
       ▼                                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                      sudoku-progress (persistence)               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Structures

### 2.1 Cell State (`sudoku-grid.js`)

```javascript
// Internal representation per cell (index 0-80 or {row, col})
const Cell = {
  value: 0,           // Current displayed value (1-9 or 0)
  isClue: false,      // Immutable puzzle clue
  isHint: false,      // Value provided by hint system
  candidates: new Set(), // Possible candidates (1-9) for solver/hints
  hasConflict: false  // Conflict detection flag
};

// Grid state object
const GridState = {
  cells: Array(81).fill(null).map(() => ({...Cell})), // 9x9 flattened
  selectedCell: null,   // { row: 0-8, col: 0-8 } or null
  clues: new Set(),     // Indices of clue cells (immutable)
  hints: new Map(),     // index → value for hint entries
  userEntries: new Map() // index → value for user entries
};
```

### 2.2 Puzzle Object (`sudoku-generator.js` → `sudoku-grid.js` → `sudoku-ui.js`)

```javascript
const Puzzle = {
  id: "uuid-v4",              // Unique puzzle identifier
  difficulty: "easy"|"medium"|"hard",
  puzzle: Uint8Array(81),     // 0 = empty, 1-9 = clue
  solution: Uint8Array(81),   // Complete solution (1-9)
  clueCount: 35,              // Number of clues
  difficultyScore: 1.2,       // Numeric difficulty metric
  generationTimeMs: 847       // Performance metric
};
```

### 2.3 Game Session State (`sudoku-progress.js` → localStorage)

```javascript
const GameState = {
  // Puzzle identity
  puzzleId: "uuid-v4",
  difficulty: "medium",
  
  // Grid state (mirrors sudoku-grid serialization)
  grid: {
    clues: Uint8Array(81),      // Immutable clues
    userEntries: Uint8Array(81), // User-entered values (0 = empty)
    hints: Uint8Array(81)        // Hint-revealed values (0 = none)
  },
  
  // Progress tracking
  timer: {
    elapsedMs: 0,          // Total elapsed milliseconds
    startedAt: null,       // Date.now() when running, null when paused
    isRunning: false
  },
  moveCount: 0,            // User entry count
  
  // Hint usage
  hints: {
    conflictsUsed: 0,
    cellsRevealed: 0,
    logicalHintsUsed: 0
  },
  
  // Status
  status: "playing" | "paused" | "completed",
  completedAt: null,       // ISO timestamp when completed
  startedAt: "2025-01-15T10:30:00.000Z"
};
```

### 2.4 Solver Internal Structures (`sudoku-solver.js`)

```javascript
// Candidate grid: 81 cells × 9 candidates (bitmask for performance)
const CandidateGrid = Uint16Array(81); // Bit 0=1, Bit 8=9, 0x1FF = all candidates

// Solving technique result
const TechniqueStep = {
  technique: "nakedSingle" | "hiddenSingle" | "nakedPair" | "hiddenPair" 
           | "pointingPair" | "boxLineReduction" | "xWing" | "swordfish" | "xyWing",
  cells: [{ row, col, value }],      // Cells affected
  eliminations: [{ row, col, candidates }], // Candidates removed
  placements: [{ row, col, value }], // Values placed
  explanation: "Human-readable explanation"
};

// Solver result
const SolveResult = {
  solved: boolean,
  solution: Uint8Array(81) | null,
  steps: TechniqueStep[],        // Logical steps taken
  requiresGuessing: boolean,
  solutionCount: 0 | 1 | 2       // For uniqueness check (capped at 2)
};
```

### 2.5 Event Types (`sudoku-grid.js` → `sudoku-ui.js`)

```javascript
// CustomEvent detail payloads
const GridEvents = {
  cellChange: { index, row, col, value, source: "user"|"hint"|"clear"|"restore" },
  conflictChange: { indices: number[], hasConflicts: boolean },
  selectionChange: { prevIndex, newIndex, prevRow, prevCol, newRow, newCol },
  complete: { timeMs, moveCount, hintCounts },
  restored: { gameState: GameState }
};
```

---

## 3. Module Interactions

### 3.1 Grid ↔ UI (Bidirectional)

| Direction | Trigger | Action |
|-----------|---------|--------|
| UI → Grid | User clicks/taps cell | `grid.selectCell(row, col)` |
| UI → Grid | User presses digit 1-9 | `grid.setValue(index, value, "user")` |
| UI → Grid | User presses Backspace/Delete | `grid.clearCell(index)` |
| UI → Grid | Arrow key navigation | `grid.moveSelection(direction)` |
| Grid → UI | `cellChange` event | Re-render cell, update candidates display |
| Grid → UI | `conflictChange` event | Add/remove conflict CSS classes |
| Grid → UI | `selectionChange` event | Move visual selection highlight |
| Grid → UI | `complete` event | Show victory modal, stop timer |
| Grid → UI | `restored` event | Re-render full grid, restore selection |

### 3.2 Grid ↔ Solver (Grid drives, Solver responds)

| Trigger | Grid Calls | Solver Returns |
|---------|------------|----------------|
| After user entry | `solver.validate(gridState)` | `{ valid: boolean, conflicts: Index[] }` |
| On game start | `solver.verifyUnique(puzzle)` | `{ unique: boolean, solution: Uint8Array }` |
| Hint requested | `solver.getNextStep(gridState)` | `TechniqueStep | null` |
| CellRevealCell | null` |
| Conflict check | `solver.getConflicts(gridState)` | `Index[]` (conflicting cell indices) |
| Generate puzzle | `solver.solve(puzzle)` | `SolveResult` (for uniqueness check) |

### 3.3 Generator ↔ Solver (Generator drives)

```
generatePuzzle(difficulty):
  1. solver.generateSolution() → solution grid
  2. puzzle = solution.copy()
  3. while puzzle.clueCount > difficulty.maxClues:
       candidate = puzzle.removeRandomClue()
       if solver.verifyUnique(candidate).unique:
           puzzle = candidate
       else:
           restore clue
  4. difficulty = assessDifficulty(puzzle, solver)
  5. return { puzzle, solution, difficulty }
```

### 3.4 Hints ↔ Grid + Solver

| Hint Action | Hint Module Calls | Grid Updates |
|-------------|-------------------|--------------|
| Toggle Conflicts | `solver.getConflicts(grid)` | `grid.setConflicts(indices)` |
| Reveal Cell | `solution = grid.getSolution(); grid.setValue(idx, solution[idx], "hint")` | `cellChange` event with `source: "hint"` |
| Logical Step | `step = solver.getNextStep(grid)` → `hint.formatExplanation(step)` → `grid.highlightCells(step.cells)` | Temporary highlight, `cellChange` if user applies |

### 3.5 Progress ↔ Grid + UI

| Trigger | Progress Action |
|---------|-----------------|
| Game start | `progress.startNewGame(puzzleId, difficulty)` |
| User entry | `progress.incrementMoves()` |
| Timer tick (1s) | `progress.tick()` → UI updates display |
| Page unload / periodic | `progress.saveState(grid.serialize())` |
| Page load | `state = progress.loadState(); grid.deserialize(state.grid); UI.restore(state)` |
| Puzzle complete | `progress.completeGame()` → move to history |

---

## 4. Algorithms

### 4.1 Solution Grid Generation (`sudoku-generator.js`)

**Algorithm**: Backtracking with constraint propagation + randomization

```
generateSolution():
  1. Create empty 9×9 grid
  2. Fill diagonal 3×3 boxes first (independent, no conflicts):
     For each box (0,0), (3,3), (6,6):
       Shuffle [1..9], place in box cells
  3. Solve remaining cells via backtracking with MRV heuristic:
     - Pick empty cell with fewest candidates
     - Try candidates in random order
     - Recurse; backtrack on dead end
  4. Return complete valid grid
```
**Complexity**: ~1-5ms typical. Guarantees valid solution.

### 4.2 Puzzle Generation (Digit Removal)

**Algorithm**: Iterative removal with uniqueness verification

```
generatePuzzle(solution, targetClueRange):
  puzzle = solution.clone()
  cells = shuffled indices 0..80
  
  for each index in cells:
    if puzzle.clueCount <= targetClueRange.min: break
    
    backup = puzzle[index]
    puzzle[index] = 0
    
    if solver.verifyUnique(puzzle).unique:
      // Removal successful, continue
    else:
      puzzle[index] = backup  // Restore - would lose uniqueness
  
  // If too few clues, restart with different seed
  if puzzle.clueCount < targetClueRange.min:
    return generatePuzzle(solution, targetClueRange)
  
  return puzzle
```
**Uniqueness Check**: Solver counts solutions, stops at 2. Uses backtracking with constraint propagation.

**Difficulty Assessment**:
| Level | Clues | Required Techniques |
|-------|-------|---------------------|
| Easy | 35-45 | Naked Single, Hidden Single only |
| Medium | 28-34 | + Naked/Hidden Pairs, Pointing Pairs, Box-Line Reduction |
| Hard | 22-27 | + Naked/Hidden Triples, X-Wing, Swordfish, XY-Wing |

Assessment runs solver in "technique tracking" mode, records highest technique needed.

### 4.3 Logical Solver (`sudoku-solver.js`)

**Core Data Structure**: Bitmask candidates (9 bits per cell, 1=available)

```
candidates[cell] = 0x1FF initially (bits 0-8 = digits 1-9)
```

**Constraint Propagation** (on each placement):
```
placeValue(cell, value):
  candidates[cell] = 1 << (value-1)
  for each peer in row/col/box:
    candidates[peer] &= ~(1 << (value-1))
    if candidates[peer] == 0: CONFLICT
    if popcount(candidates[peer]) == 1: NAKED SINGLE → queue
```

**Technique Pipeline** (ordered by difficulty):

| Technique | Pattern | Action |
|-----------|---------|--------|
| **Naked Single** | Cell has 1 candidate | Place that value |
| **Hidden Single** | Digit appears in only 1 cell in unit | Place that digit |
| **Naked Pair** | 2 cells in unit share same 2 candidates | Eliminate those from other cells in unit |
| **Hidden Pair** | 2 digits appear only in 2 cells in unit | Eliminate other candidates from those 2 cells |
| **Pointing Pair** | Candidate locked to one row/col within box | Eliminate from rest of row/col outside box |
| **Box-Line Reduction** | Candidate in row/col locked to one box | Eliminate from rest of box |
| **Naked Triple** | 3 cells share 3 candidates | Eliminate from other cells |
| **Hidden Triple** | 3 digits in only 3 cells | Eliminate other candidates |
| **X-Wing** | 2 rows, 2 cols, same candidate in 4 corners | Eliminate from other cells in those cols/rows |
| **Swordfish** | 3 rows/cols, 3 cols/rows, candidate in 6-9 cells | Eliminate from other cells |
| **XY-Wing** | Pivot with XY, two pincers with XZ, YZ | Eliminate Z from peers of both pincers |

**Next-Step Selection**: Returns first applicable technique in priority order above. Returns `null` if only guessing remains.

### 4.4 Backtracking Solver (Fallback / Uniqueness Check)

```
solve(grid, maxSolutions=2):
  solutions = []
  
  function backtrack(pos):
    if pos == 81:
      solutions.push(grid.clone())
      return solutions.length >= maxSolutions
    
    if grid[pos] != 0: return backtrack(pos+1)
    
    candidates = getCandidates(pos)
    for value in candidates (ordered by heuristic):
      grid[pos] = value
      if propagateConstraints(pos, value):  // early pruning
        if backtrack(pos+1): return true
      grid[pos] = 0
    return false
  
  backtrack(0)
  return { solutions, unique: solutions.length == 1 }
```
**Heuristic**: Minimum Remaining Values (MRV) — pick cell with fewest candidates. **Optimization**: Constraint propagation before each recursive call.

### 4.5 Hint Generation

| Hint Type | Algorithm |
|-----------|-----------|
| **Conflict Highlight** | `solver.getConflicts(grid)` — scan rows/cols/boxes for duplicates |
| **Reveal Cell** | Look up pre-computed `solution[cell]` from puzzle generation |
| **Logical Step** | `solver.getNextStep(grid)` — run technique pipeline, return first hit with human-readable explanation |

**Explanation Templates**:
- Naked Single: "In row {r}, column {c}, the only possible value is {v} because all other digits 1-9 except {v} already appear in the row, column, or box."
- Hidden Single: "In the {unit} (row/column/box {n}), the digit {v} can only go in row {r}, column {c} because it's eliminated from all other cells."
- Naked Pair: "In {unit}, cells ({r1},{c1}) and ({r2},{c2}) both contain only candidates {a},{b}. These digits can be eliminated from other cells in the {unit}."

---

## 5. File Structure & Module Responsibilities

```
/home/debian/code/reasoning-game/
├── index.html                 # Main HTML entry point
├── package.json               # Dev server, build scripts
├── src/
│   ├── index.js              # App entry point, module initialization
│   ├── sudoku-grid.js        # Grid model (REQ-GRID-001..008)
│   ├── sudoku-generator.js   # Puzzle generation (REQ-GEN-001..007)
│   ├── sudoku-solver.js      # Solving engine (REQ-SOL-001..008)
│   ├── sudoku-hints.js       # Hint system (REQ-HINT-001..006)
│   ├── sudoku-progress.js    # Timer, moves, persistence (REQ-PROG-001..003)
│   └── sudoku-ui.js          # UI controller, rendering, input
├── styles/
│   └── main.css              # CSS Grid layout, responsive, themes
└── dist/                     # Build output (if bundling)
```

### 5.1 Module API Signatures

#### `sudoku-grid.js`
```javascript
export class SudokuGrid {
  constructor()
  init(puzzle: Uint8Array, solution: Uint8Array): void
  getCell(index: number): CellState
  setValue(index: number, value: number, source: "user"|"hint"|"clear"|"restore"): boolean
  clearCell(index: number): boolean
  selectCell(row: number, col: number): void
  moveSelection(direction: "up"|"down"|"left"|"right"): void
  getSelectedCell(): {row, col} | null
  checkConflicts(): number[]           // Returns conflicting indices
  hasConflict(index: number): boolean
  isComplete(): boolean
  serialize(): GridSerializedState
  deserialize(state: GridSerializedState): void
  getSolution(): Uint8Array
  // Events: on(event, callback), off(event, callback)
}
```

#### `sudoku-generator.js`
```javascript
export class SudokuGenerator {
  constructor(solver: SudokuSolver)
  generatePuzzle(difficulty: "easy"|"medium"|"hard"): Promise<Puzzle>
  generateSolution(): Uint8Array
  assessDifficulty(puzzle: Uint8Array): DifficultyAssessment
  // Events: on("progress", callback) for generation updates
}
```

#### `sudoku-solver.js`
```javascript
export class SudokuSolver {
  constructor()
  validate(grid: Uint8Array): ValidationResult
  verifyUnique(puzzle: Uint8Array): UniquenessResult
  solve(puzzle: Uint8Array): SolveResult
  getNextStep(grid: Uint8Array): TechniqueStep | null
  getConflicts(grid: Uint8Array): number[]
  getCandidates(grid: Uint8Array): Uint16Array  // Bitmask per cell
  // Internal: applyTechnique(technique, grid, candidates)
}
```

#### `sudoku-hints.js`
```javascript
export class SudokuHints {
  constructor(grid: SudokuGrid, solver: SudokuSolver, solution: Uint8Array)
  toggleConflicts(enabled: boolean): void
  revealCell(index: number): boolean
  getLogicalHint(): HintResult | null
  getHintUsage(): HintUsageStats
  // Events: on("hintUsed", callback)
}
```

#### `sudoku-progress.js`
```javascript
export class SudokuProgress {
  constructor()
  startNewGame(puzzleId: string, difficulty: string): void
  saveState(gridState: GridSerializedState): Promise<void>
  loadState(): Promise<GameState | null>
  tick(): number  // Returns elapsed ms
  pause(): void
  resume(): void
  incrementMoves(): number
  recordHint(type: "conflict"|"reveal"|"logical"): void
  completeGame(): GameResult
  getHistory(): GameResult[]
  clearHistory(): void
}
```

#### `sudoku-ui.js`
```javascript
export class SudokuUI {
  constructor(grid, generator, solver, hints, progress)
  init(): Promise<void>
  render(): void
  bindEvents(): void
  showDifficultySelector(): void
  startGame(difficulty: string): Promise<void>
  showVictory(result: GameResult): void
  showHint(hint: HintResult): void
  updateTimer(elapsedMs: number): void
  updateMoveCount(count: number): void
}
```

---

## 6. Extensibility Considerations

### 6.1 Adding New Difficulty Levels
- Add entry to `DIFFICULTY_CONFIG` in `sudoku-generator.js` with clue range and technique thresholds
- Extend `assessDifficulty()` to recognize new technique combinations
- Add CSS class for new difficulty badge in `sudoku-ui.js`

### 6.2 Adding New Solving Techniques
1. Implement technique in `sudoku-solver.js` as `applyTechniqueName(grid, candidates)`
2. Add to `TECHNIQUE_PIPELINE` array with priority order
3. Add explanation template in `sudoku-hints.js`
4. Add CSS highlighting classes for new pattern visualization

### 6.3 Alternative Grid Sizes (4×4, 16×16, Samurai)
- Abstract `GRID_SIZE = 9`, `BOX_SIZE = 3` as constants in `sudoku-grid.js`
- Make `SudokuGrid` accept size config in constructor
- Update `sudoku-solver.js` peer/unit calculation to use configurable box dimensions
- Generator: adjust solution generation for different sizes (backtracking scales exponentially)

### 6.4 Variant Rules (Killer, Diagonal, Thermo)
- Add `VariantRules` interface with `validate(grid)`, `getAdditionalUnits()`, `getExtraConstraints()`
- Inject variant into `SudokuGrid` and `SudokuSolver` constructors
- UI: variant selector in difficulty screen

### 6.5 Themes / Accessibility
- CSS custom properties for colors in `main.css`
- `prefers-color-scheme`, `prefers-reduced-motion`, `prefers-contrast` media queries
- Theme switcher in UI → updates `document.documentElement.dataset.theme`
- High-contrast mode: additional border emphasis for conflicts/selection

### 6.6 Persistence Backends
- `SudokuProgress` uses `StorageAdapter` interface (`localStorage` default)
- Swap for `IndexedDBAdapter`, `CloudSyncAdapter`, `FileSystemAdapter` (Electron/Tauri)
- No changes to grid/generator/solver/hints/UI

### 6.7 Multiplayer / Daily Challenge
- Add `GameMode` enum: `solo`, `daily`, `multiplayer`
- `DailyChallengeProvider` fetches seeded puzzle from server (deterministic seed = date)
- Multiplayer: WebRTC/WebSocket sync of `GameState` + operational transforms for moves

---

## 7. Performance Considerations

### 7.1 Generation Performance
| Metric | Target | Strategy |
|--------|--------|----------|
| Easy puzzle gen | < 500ms | Fewer removals, simpler uniqueness checks |
| Medium puzzle gen | < 1s | Moderate removals |
| Hard puzzle gen | < 3s | More removals, deeper solver runs; fallback to pre-generated pool |
| Pre-gen pool size | 50 per difficulty | Generated at build time, bundled as JSON |

**Optimization**: Cache solution grids; reuse for multiple puzzle generations.

### 7.2 Solver Performance
- **Bitmask candidates**: 16-bit integer per cell → fast bitwise operations
- **Constraint propagation**: Incremental updates on placement, not full recompute
- **Technique ordering**: Cheap techniques (singles) first, expensive (X-Wing) last
- **Early exit**: Stop at 2 solutions for uniqueness check
- **Memoization**: Cache peer lists (row/col/box indices per cell) at module init

### 7.3 Grid Operations
- Flat `Uint8Array(81)` for values → cache-friendly, fast serialization
- Conflict detection: O(1) per cell using precomputed peer masks, O(81) full scan
- Event emission: Batched via `requestAnimationFrame` to avoid layout thrashing

### 7.4 UI Rendering
- **Single render pass**: Grid rendered as CSS Grid, cells as `<button>` elements
- **Virtual selection**: Only selected cell gets focus ring; no full re-render on navigation
- **Conflict highlighting**: CSS class toggle on affected cells, not DOM reconstruction
- **Timer**: `requestAnimationFrame` driven, updates DOM once per second

### 7.5 Memory Profile (Typical)
| Component | Memory |
|-----------|--------|
| Grid state | ~2 KB (3×Uint8Array(81)) |
| Candidates | ~162 bytes (Uint16Array(81)) |
| Solution/puzzle | ~162 bytes each |
| Solver workspace | < 10 KB (recursion stack, temp arrays) |
| DOM (81 buttons + UI) | ~50 KB |
| **Total** | **< 100 KB** |

### 7.6 Mobile Performance
- Touch events: `touchstart`/`touchend` with `passive: true`
- `touch-action: manipulation` on grid to disable double-tap zoom
- 300ms click delay eliminated via `touch-action` + `pointer-events`
- Reduced motion: CSS transitions disabled via media query

---

## 8. Testing Strategy

### 8.1 Unit Tests (per module)
- **Grid**: Serialization round-trip, conflict detection, completion check, clue immutability
- **Generator**: Solution validity, uniqueness of generated puzzles, difficulty distribution
- **Solver**: Technique correctness (fixture puzzles per technique), uniqueness detection, backtracking correctness
- **Hints**: Conflict toggle, reveal accuracy, explanation formatting, usage tracking
- **Progress**: Timer pause/resume, move counting rules, localStorage round-trip, quota handling

### 8.2 Integration Tests
- New game → play → hint → complete → save → reload → resume
- All difficulty levels generate solvable, unique puzzles
- Hint system never suggests invalid moves
- Timer pauses on tab blur, resumes on focus

### 8.3 Property-Based Tests
- Generator: 1000 puzzles × 3 difficulties → all unique solutions, valid grids
- Solver: Random valid grids → validator returns true; random invalid → false
- Grid: Random operations (set/clear/select) → state consistency invariants

### 8.4 E2E / Visual Tests
- Play complete Easy/Medium/Hard games
- Mobile touch interaction (tap, swipe navigation)
- Accessibility: keyboard nav, screen reader announcements, high contrast

---

## 9. Build & Deployment

### 9.1 Development
```json
// package.json scripts
{
  "dev": "vite",                    // Dev server with HMR
  "test": "vitest run",             // Unit tests
  "test:watch": "vitest",           // Watch mode
  "lint": "eslint src/",
  "format": "prettier --write src/"
}
```

### 9.2 Production Build
```json
{
  "build": "vite build",            // Outputs to dist/
  "preview": "vite preview"         // Preview production build
}
```

### 9.3 Deployment Targets
- **Static hosting**: Netlify, Vercel, GitHub Pages, Cloudflare Pages (just `dist/`)
- **PWA**: Add `manifest.json`, service worker for offline play (future enhancement)
- **Desktop**: Tauri/Electron wrapper (reuse same `dist/`)

---

## 10. Risk Mitigation Summary

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Non-unique puzzles | Medium | Solver verifies uniqueness after each removal; retry with new seed |
| Hard puzzle generation timeout | Medium | Pre-generated pool (50/difficulty) bundled; fallback on timeout |
| Logical solver incomplete | Medium | Start with singles/pairs; add advanced techniques incrementally; backtracking fallback |
| Mobile touch conflicts | Low | `touch-action: manipulation`, test on iOS Safari/Android Chrome |
| localStorage quota exceeded | Low | Catch `QuotaExceededError`, prune old history, compress state |
| Timer drift | Low | Use `performance.now()` + `visibilitychange` events, not `setInterval` |
| Accessibility gaps | Low | Semantic HTML, ARIA live regions for hints, focus management, WCAG AA colors |

---

## 11. Implementation Priority (Phased)

| Phase | Deliverable | Modules |
|-------|-------------|---------|
| **1. Core** | Playable grid with fixed puzzle | `sudoku-grid`, `sudoku-ui`, `styles/main.css` |
| **2. Generation** | New game with 3 difficulties | `sudoku-generator`, `sudoku-solver` (backtracking + uniqueness) |
| **3. Logic Solver** | Naked/hidden singles, pairs, pointing | `sudoku-solver` (logical techniques) |
| **4. Hints** | Conflict highlight, reveal, logical step | `sudoku-hints` |
| **5. Progress** | Timer, moves, localStorage persistence | `sudoku-progress` |
| **6. Polish** | Responsive UI, accessibility, themes, tests | All modules + `sudoku-ui` refinements |

---

*Document version: 1.0*  
*Generated for SDD change: sudoku-game*  
*Location: `/home/debian/code/reasoning-game/openspec/changes/sudoku-game/design/design.md`*