# Sudoku Game Design

## High-Level Architecture

The Sudoku game is built as a modular vanilla JavaScript application using ES modules. The system is divided into six core modules:

1. **sudoku-grid** - Manages the game board state, cell values, conflict detection, and selection.
2. **sudoku-generator** - Generates valid Sudoku puzzles with unique solutions at three difficulty levels.
3. **sudoku-solver** - Validates puzzles, checks solution uniqueness, and provides logical solving steps for hints.
4. **sudoku-hints** - Provides hint functionality: conflict highlighting, cell reveal, and logical step hints.
5. **sudoku-progress** - Tracks game timer, move count, persistence via localStorage, and game history.
6. **sudoku-ui** - Handles DOM rendering, user input (keyboard/touch), and UI components.

Each module exposes a clear public API and communicates via events or direct method calls as needed.

## Data Structures

### Grid Cell State
Each cell in the 9x9 grid maintains:
- `value`: number (1-9) or 0 for empty
- `isClue`: boolean indicating if the cell is a given puzzle clue
- `isHint`: boolean indicating if the cell value was revealed via hint
- `hasConflict`: boolean indicating if the cell participates in any row/column/box conflict

The grid state is stored as three 9x9 matrices:
- `clues`: fixed puzzle values
- `userEntries`: values entered by the player
- `hints`: values revealed via hint system
Derived values (display value, conflict status) are computed on demand.

### Game State (managed by progress module)
- `difficulty`: 'easy', 'medium', 'hard'
- `startTime`: timestamp when game started
- `elapsedTime`: paused time accumulated
- `isPaused`: boolean
- `moveCount`: number of user cell entries
- `hintsUsed`: object counting each hint type used
- `history`: array of completed game records
- `currentGameId`: identifier for active game in storage

## Module Interactions

### Initialization Flow
1. `sudoku-ui` initializes and calls `sudoku-progress.newGame()`
2. `sudoku-progress` requests a new puzzle from `sudoku-generator` based on selected difficulty
3. `sudoku-generator` produces a puzzle object `{solution, puzzle}` and returns the puzzle grid
4. `sudoku-progress` initializes `sudoku-grid` with the puzzle clues
5. `sudoku-ui` renders the grid via `sudoku-grid.getDisplayState()`
6. `sudoku-progress` starts the timer
7. Event listeners are attached for user input and hint buttons

### User Input Flow
1. User clicks a cell or uses arrow keys to select a cell
2. `sudoku-ui` updates selection in `sudoku-grid` via `selectCell(row, col)`
3. User types a number (1-9) or presses Delete/Backspace
4. `sudoku-ui` calls `sudoku-grid.setValue(row, col, value)` if not a clue
5. `sudoku-grid` validates input, updates userEntries, and recalculates conflicts
6. `sudoku-grid` emits `sudoku-grid` emits a `cellChange` event with coordinates and new value
7. `sudoku-ui` listens for `cellChange` and updates the cell's DOM appearance
8. After each change, `sudoku-ui` checks for completion via `sudoku-grid.isComplete()`
9. If complete, `sudoku-progress` records the win and shows the completion dialog

### Hint Flow
1. User clicks a hint button (e.g., "Logical Hint")
2. `sudoku-ui` calls the appropriate method on `sudoku-hints`
3. `sudoku-hints` consults `sudoku-solver` for the current grid state (to get a solvable puzzle)
4. `sudoku-solver` analyzes the puzzle and returns a logical step (technique, affected cells, explanation)
5. `sudoku-hints` formats the hint and may request `sudoku-grid` to highlight relevant cells
6. `sudoku-ui` displays the hint in a modal/tooltip
7. For "Reveal Cell": `sudoku-hints` asks `sudoku-solver` for the solution value of the selected cell, then tells `sudoku-grid` to set that cell as a hint
8. For "Highlight Conflicts": `sudoku-hints` toggles a flag and asks `sudoku-grid` to return all cells with `hasConflict === true`, then highlights them

### Persistence Flow
- Whenever the game state changes (move, hint, time update), `sudoku-progress` debounces a call to `saveGame()` which serializes:
  - Grid state (clues, userEntries, hints)
  - Timer state (startTime, elapsedTime, isPaused)
  - Move count
  - Hint usage
  - Difficulty
- On page load, `sudoku-progress` attempts to load a saved game; if found, it restores the state and resumes the timer.

## Algorithms

### Puzzle Generation (sudoku-generator)
1. Generate a complete, valid solution grid using a backtracking algorithm with random shuffling of numbers and positions.
2. Determine the target number of clues based on difficulty:
   - Easy: 35-45 clues
   - Medium: 28-34 clues
   - Hard: 22-27 clues
3. Create a list of all cell positions, shuffle it.
4. Iteratively remove a cell (set to 0) and check if the puzzle still has a unique solution using the solver.
5. If removing the cell would cause multiple solutions, restore it and continue to the next candidate.
6. Stop when the target clue count is reached or no more cells can be removed without breaking uniqueness.
7. Return the puzzle grid and the full solution.

### Solving and Validation (sudoku-solver)
- **Validation**: Check each row, column, and 3x3 box for duplicates (ignoring zeros).
- **Uniqueness**: Use a recursive backtracking solver that stops after finding two solutions.
- **Logical Solving (for hints)**: Implement a set of solving techniques in order of increasing complexity:
  1. Naked Singles
  2. Hidden Singles
  3. Naked Pairs
  4. Hidden Pairs
  5. Naked Triples
  6. Hidden Triples
  7. Pointing Pairs/Triples
  8. Box-Line Reduction
  (Optional: X-Wing, Swordfish, XY-Wing for harder puzzles)
- Each technique scans the grid for applicable patterns and returns the first step found.

### Conflict Detection (sudoku-grid)
- After each cell change, check the cell's row, column, and 3x3 box for duplicate values (considering both user entries and hints).
- Mark all cells involved in any duplicate as having a conflict.
- Efficiently update only the affected rows/columns/boxes rather than rescanning the entire grid.

## File Structure
```
src/
  sudoku-grid.js
  sudoku-generator.js
  sudoku-solver.js
  sudoku-hints.js
  sudoku-progress.js
  sudoku-ui.js
  index.js          # Entry point, initializes and wires modules
styles/
  main.css
index.html
package.json        # Dev dependencies: esbuild or similar for module bundling, optionally a dev server
```

## Extensibility Considerations
- Adding new hint techniques: Extend the solver's technique list and update the hint module to display them.
- New puzzle variants (e.g., Killer Sudoku): Would require changes to grid validation and generation, but the modular separation allows swapping implementations.
- Theme support: CSS variables in `main.css` allow easy theme switching.
- Persistence backend: The `sudoku-progress` module abstracts storage; swapping localStorage for IndexedDB or a backend API would be possible without changing other modules.

## Performance Considerations
- Puzzle generation is designed to finish within 2 seconds for most difficulties; hardest puzzles may take up to 5 seconds.
- The solver uses bitmask or set-based candidate tracking for efficiency.
- DOM updates are minimized: only changed cells are re-rendered.
- Event delegation is used for cell clicks to avoid attaching 81 listeners.

## Design Decisions
- **No Framework**: Vanilla JS with ES modules keeps the project lightweight and easy to understand.
- **Modularity**: Each concern is isolated, making testing and maintenance straightforward.
- **Event-Driven UI**: The UI updates in response to grid changes via custom events, keeping the UI layer decoupled from game logic.
- **Hint Integration**: Hints are treated as a special cell state (separate from user entries) to allow them to be overwritten by the player.
- **Persistence**: LocalStorage provides offline capability and session recovery without requiring a backend.

