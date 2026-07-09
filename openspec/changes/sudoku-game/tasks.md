# Tasks: Sudoku Game Implementation

## Change ID: sudoku-game  
**Generated:** 2025-07-09  
**Based on:** Design document (`design/design.md`) and delta specs (`specs/*/spec.md`)

---

## Task Structure

Each task is:
- **Small** – can be completed in 1-4 hours
- **Estimable** – clear scope and acceptance criteria
- **Testable** – has defined acceptance criteria for verification
- **Traceable** – maps to specific requirements (REQ-XXX-XXX)

Tasks are organized by **implementation phase** (per Design §11) and **component**.

---

## Phase 1: Core – Playable Grid with Fixed Puzzle

### sudoku-grid.js – Grid Data Model & Core Logic

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| GRID-001 | Create `SudokuGrid` class with flat `Uint8Array(81)` storage for clues, user entries, hints | REQ-GRID-001 | Class exists; `init(puzzle, solution)` populates clues; getters return correct cell state | 2h |
| GRID-002 | Implement `setValue(index, value, source)` – accepts user/hint/clear/restore sources, rejects clues | REQ-GRID-002 | User entries update; clues immutable; hint entries tracked; returns success boolean | 2h |
| GRID-003 | Implement `clearCell(index)` – clears user entry only, preserves clues/hints | REQ-GRID-002 | Non-clue cells clear; clues/hints unchanged | 1h |
| GRID-004 | Implement conflict detection – scan rows/cols/boxes for duplicates, return conflicting indices | REQ-GRID-003 | `checkConflicts()` returns array of indices; `hasConflict(index)` boolean correct | 2h |
| GRID-005 | Implement real-time conflict flagging on `setValue` – emit `conflictChange` event | REQ-GRID-003, REQ-GRID-008 | Conflicts detected immediately on entry; cleared when resolved | 1h |
| GRID-006 | Implement cell selection – `selectCell(row, col)`, `moveSelection(dir)`, `getSelectedCell()` | REQ-GRID-004 | Selection tracked; arrow navigation with wrapping; emits `selectionChange` | 1.5h |
| GRID-007 | Implement `isComplete()` – true iff all 81 cells filled, no conflicts, valid rows/cols/boxes | REQ-GRID-005 | Returns true only for valid complete solutions; false for incomplete or conflicting | 1h |
| GRID-008 | Implement serialization – `serialize()` returns JSON-serializable state; `deserialize(state)` restores | REQ-GRID-006 | Round-trip: init → serialize → deserialize → state identical | 1.5h |
| GRID-009 | Implement event emitter – `on(event, cb)`, `off(event, cb)` for: cellChange, conflictChange, selectionChange, complete, restored | REQ-GRID-008 | All 5 events fire with correct payloads; listeners can subscribe/unsubscribe | 1h |
| GRID-010 | Unit tests for grid: serialization round-trip, conflict detection, completion check, clue immutability | REQ-GRID-001–008 | All scenarios in REQ-GRID specs pass; 100% coverage on grid module | 2h |

### sudoku-solver.js – Validation & Backtracking (Core Only)

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| SOL-001 | Create `SudokuSolver` class with bitmask candidate grid (`Uint16Array(81)`) and peer lookup tables | REQ-SOL-007 | Candidates initialized correctly; peers precomputed (20 peers per cell) | 2h |
| SOL-002 | Implement `validate(grid: Uint8Array)` – returns `{valid, conflicts[]}` for complete or partial grids | REQ-SOL-001, REQ-SOL-002 | Valid complete grid → true; invalid → false with conflicts; empty → true | 1.5h |
| SOL-003 | Implement `verifyUnique(puzzle)` – backtracking with early exit at 2 solutions | REQ-SOL-003, REQ-SOL-008 | Returns `{unique: bool, solution: Uint8Array|null}`; stops at 2 solutions | 2h |
| SOL-004 | Implement `solve(puzzle)` – backtracking with MRV heuristic + constraint propagation | REQ-SOL-008 | Returns `SolveResult`; solves typical puzzles < 50ms; finds all solutions up to cap | 2h |
| SOL-005 | Implement `getConflicts(grid)` – returns array of conflicting cell indices | REQ-SOL-002 | Matches grid's conflict detection; used by hints | 1h |
| SOL-006 | Implement `getCandidates(grid)` – returns `Uint16Array(81)` bitmask per cell | REQ-SOL-007 | Bit i set ⇔ digit i+1 is candidate; correct after placements | 1h |
| SOL-007 | Unit tests for solver: validation, uniqueness (unique/non-unique puzzles), backtracking solve, candidates | REQ-SOL-001–008 | All REQ-SOL scenarios pass; property tests on 100 random grids | 2h |

### sudoku-generator.js – Puzzle Generation (MVP: Backtracking + Removal)

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| GEN-001 | Create `SudokuGenerator` class accepting `SudokuSolver` instance | REQ-GEN-003 | Constructor stores solver; exposes `generatePuzzle(difficulty)` | 0.5h |
| GEN-002 | Implement `generateSolution()` – fill diagonal boxes, backtrack rest with randomization | REQ-GEN-004 | Returns valid `Uint8Array(81)` solution; different on each call (seeded) | 2h |
| GEN-003 | Implement `generatePuzzle(difficulty)` – solution → iterative digit removal with uniqueness check | REQ-GEN-001, REQ-GEN-003 | Returns `{puzzle, solution, difficulty, clueCount}`; puzzle has unique solution | 2h |
| GEN-004 | Implement difficulty config – Easy: 35-45 clues, Medium: 28-34, Hard: 22-27 | REQ-GEN-002 | Clue counts within ranges; difficulty passed to generator | 0.5h |
| GEN-005 | Implement `assessDifficulty(puzzle)` – run solver in technique-tracking mode, classify by hardest technique | REQ-GEN-005 | Classifies correctly for known test puzzles (fixtures) | 2h |
| GEN-006 | Add generation timeout (2s easy, 5s hard) + fallback to pre-generated pool (50/difficulty) | REQ-GEN-006, REQ-GEN-007 | Times out gracefully; falls back to JSON pool; pool puzzles validated unique | 2h |
| GEN-007 | Unit tests: generated puzzles valid, unique, correct clue counts, difficulty distribution | REQ-GEN-001–007 | 100 puzzles × 3 difficulties → all unique, valid, in range | 2h |

### sudoku-ui.js – Grid Rendering & Input (Desktop First)

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| UI-001 | Create `index.html` with semantic structure: grid container, controls, timer, moves, hint buttons | REQ-UI-001, REQ-UI-005, REQ-UI-006, REQ-UI-007, REQ-UI-008 | All required elements present; accessible markup | 1h |
| UI-002 | Create `styles/main.css` – CSS Grid for 9×9 grid, 3×3 box borders, responsive sizing (min 44px mobile) | REQ-UI-001, REQ-UI-002 | Grid renders correctly desktop/mobile; box separators visible | 1.5h |
| UI-003 | Implement `SudokuUI` class – constructor receives grid, generator, solver, hints, progress | Design §5.1 | All modules injected; `init()` returns Promise | 0.5h |
| UI-004 | Implement `render()` – create 81 `<button>` cells, set values, classes (clue/user/hint/conflict/selected) | REQ-UI-002, REQ-UI-003 | All cells rendered; clues bold/dark; user entries blue; hints green; selection ring | 2h |
| UI-005 | Bind click events – `grid.selectCell(row, col)` on cell click | REQ-UI-003 | Click selects cell; grid emits selectionChange; UI updates highlight | 1h |
| UI-006 | Bind keyboard events – arrows navigate, 1-9 enter value, Backspace/Delete clear, Escape blur | REQ-UI-003 | Full keyboard navigation works; clues reject input; events call grid methods | 2h |
| UI-007 | Implement `updateTimerDisplay(ms)` and `updateMoveCount(n)` – MM:SS / HH:MM:SS formatting | REQ-UI-007 | Timer updates each second; moves increment on user entry | 1h |
| UI-008 | Implement difficulty selector – `<select>` with Easy/Medium/Hard, persists to localStorage | REQ-UI-005 | Selection stored; new game uses selected difficulty | 1h |
| UI-009 | Implement New Game / Restart / Pause-Resume buttons with handlers | REQ-UI-006 | New Game → generator → grid init; Restart → grid reset; Pause toggles timer & grid disabled | 1.5h |
| UI-010 | Implement hint buttons: Conflicts toggle, Reveal Cell (enabled when cell selected), Logical Hint | REQ-UI-008 | Buttons call hint module; reveal disabled for clues; states update | 1.5h |
| UI-011 | Implement completion modal – shows time, moves, hints, difficulty; New Game / Play Again | REQ-UI-009 | Modal appears on `grid.complete` event; buttons work | 1h |
| UI-012 | Wire grid events → UI updates: cellChange → re-render cell, conflictChange → toggle .conflict class, selectionChange → move focus ring, complete → show modal | REQ-GRID-008, REQ-UI-002 | UI stays in sync with grid state; no full re-renders on single cell change | 2h |
| UI-013 | Add basic accessibility: focus outlines, ARIA labels on cells (row, col, value, type), role="grid" | REQ-UI-012 | Keyboard nav visible; screen reader announces cell state | 1.5h |
| UI-014 | Integration test: play a fixed easy puzzle from start to finish via UI | REQ-GRID-005, REQ-UI-009 | Game completes; timer stops; modal shows; history recorded | 1h |

### Phase 1 Integration & Polish

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| INT-001 | Create `src/index.js` entry point – instantiate all modules, wire events, call `ui.init()` | Design §5.1 | App loads; no console errors; grid interactive | 1h |
| INT-002 | Add `package.json` with dev scripts: `dev` (vite), `test` (vitest), `build`, `lint`, `format` | Design §9.1 | All scripts run; tests pass; build outputs to `dist/` | 1h |
| INT-003 | Add Vite config for ES modules, dev server, CSS handling | Design §9.1 | `npm run dev` serves app with HMR | 0.5h |
| INT-004 | Add Vitest config + test setup; run all unit tests in CI | Design §8.1 | `npm test` passes all unit tests | 1h |
| INT-005 | E2E smoke test: load page → select Easy → New Game → play to completion | Phase 1 success criteria | Game playable end-to-end | 1h |

---

## Phase 2: Generation – 3 Difficulty Levels Working

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| GEN-008 | Integrate generator with UI: `ui.startGame(difficulty)` → `generator.generatePuzzle()` | REQ-GENESS`: | REQ-GEN-002, REQ-PROG-006 | New Game at each difficulty produces valid puzzle with unique solution | 1h |
| GEN-009 | Add generation progress indicator (spinner) + timeout handling with fallback pool | REQ-GEN-006 | UI shows loading; timeout falls back gracefully | 1h |
| GEN-010 | Pre-generate puzzle pools (50 per difficulty) as JSON, bundle in build, validate on load | REQ-GEN-007 | Pools exist; puzzles valid & unique; used on timeout | 2h |
| GEN-011 | Property test: generate 100 puzzles per difficulty → all unique, valid, in clue range | REQ-GEN-001, REQ-GEN-002 | Automated test passes | 1h |

---

## Phase 3: Logic Solver – Techniques for Hints

### sudoku-solver.js – Logical Techniques

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| SOL-008 | Implement candidate propagation: `placeValue(cell, value)` updates peer candidates, detects naked singles | REQ-SOL-004, REQ-SOL-007 | After placement, peers updated; naked singles queued | 2h |
| SOL-009 | Implement **Naked Single** detection – return TechniqueStep with placement | REQ-SOL-004 | Finds all naked singles in fixture puzzles | 1.5h |
| SOL-010 | Implement **Hidden Single** detection – per unit (row/col/box), digit appears in only one cell's candidates | REQ-SOL-004 | Finds hidden singles in fixtures | 1.5h |
| SOL-011 | Implement **Naked Pair** – two cells in unit share same 2 candidates, eliminate from other cells | REQ-SOL-004 | Finds naked pairs; returns eliminations | 2h |
| SOL-012 | Implement **Hidden Pair** – two digits appear only in same two cells in unit, eliminate other candidates | REQ-SOL-004 | Finds hidden pairs; returns eliminations | 2h |
| SOL-013 | Implement **Pointing Pair/Triple** – candidate locked to row/col within box, eliminate from rest of row/col | REQ-SOL-004 | Finds pointing pairs in fixtures | 2h |
| SOL-014 | Implement **Box-Line Reduction** – candidate in row/col locked to one box, eliminate from rest of box | REQ-SOL-004 | Finds box-line reductions in fixtures | 2h |
| SOL-015 | Implement `getNextStep(grid)` – runs technique pipeline in order, returns first hit or null | REQ-SOL-006 | Returns correct step for fixture puzzles at each stage | 2h |
| SOL-016 | (Optional/Phase 6) Advanced techniques: X-Wing, Swordfish, XY-Wing, Naked/Hidden Triple | REQ-SOL-005 | Detects in hard puzzles; returns proper steps | 4h |
| SOL-017 | Unit tests: fixture puzzles for each technique → solver returns expected step | REQ-SOL-004, REQ-SOL-006 | 5+ fixtures per technique; all pass | 2h |

---

## Phase 4: Hints – Conflict Highlight, Reveal, Logical Step

### sudoku-hints.js

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| HINT-001 | Create `SudokuHints` class – constructor(grid, solver, solution) | REQ-HINT-005 | Modules wired; solution cached | 0.5h |
| HINT-002 | Implement `toggleConflicts(enabled)` – calls `solver.getConflicts()`, `grid.setConflicts()` | REQ-HINT-001, REQ-HINT-005 | Conflicts highlight on/off; persists preference | 1h |
| HINT-003 | Implement `revealCell(index)` – gets solution value, calls `grid.setValue(idx, val, 'hint')` | REQ-HINT-002, REQ-HINT-005 | Selected cell filled with solution; marked as hint; usage tracked | 1h |
| HINT-004 | Implement `getLogicalHint()` – calls `solver.getNextStep()`, formats explanation, highlights cells | REQ-HINT-003, REQ-HINT-005 | Returns `{technique, cells, eliminations, placements, explanation}` or null | 2h |
| HINT-005 | Implement explanation templates for each technique (Naked Single, Hidden Single, Pair, etc.) | REQ-HINT-003 | Human-readable strings match spec examples | 1.5h |
| HINT-006 | Implement hint usage tracking – `getHintUsage()` returns counts per type | REQ-HINT-004 | Counters increment; persist with game state | 1h |
| HINT-007 | Implement accessible hint modal – role="alert", heading, list, dismiss button, focus trap | REQ-HINT-006 | Screen reader announces; keyboard dismissible; reduced motion respected | 2h |
| HINT-008 | Wire hint buttons in UI: Conflicts toggle → `hints.toggleConflicts()`, Reveal → `hints.revealCell()`, Logical → `hints.getLogicalHint()` → show modal | REQ-UI-008, REQ-HINT-005 | All three hint actions work via UI | 1.5h |
| HINT-009 | Unit tests: conflict toggle, reveal accuracy, logical hint matches solver step, usage tracking | REQ-HINT-001–006 | All hint scenarios pass | 1.5h |

---

## Phase 5: Progress – Timer, Moves, Persistence, History

### sudoku-progress.js

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| PROG-001 | Create `SudokuProgress` class with timer state (elapsedMs, startedAt, isRunning) | REQ-PROG-001 | Timer starts at 0; `tick()` returns elapsed | 1h |
| PROG-002 | Implement `startNewGame(puzzleId, difficulty)` – resets timer, moves, hints, moveCount, status=playing | REQ-PROG-001, REQ-PROG-006 | New game state initialized correctly | 1h |
| PROG-003 | Implement `pause()` / `resume()` – toggle isRunning, adjust startedAt for elapsed continuity | REQ-PROG-001, REQ-PROG-007 | Pause stops timer; resume continues from same elapsed | 1h |
| PROG-004 | Implement `incrementMoves()` – called on user entry (not hint, not clear) | REQ-PROG-002 | Move count increments correctly per scenarios | 0.5h |
| PROG-005 | Implement `recordHint(type)` – increments conflict/reveal/logical counters | REQ-PROG-002, REQ-HINT-004 | Hint usage tracked separately from moves | 0.5h |
| PROG-006 | Implement `saveState(gridState)` – serializes full GameState to localStorage (debounced 1s) | REQ-PROG-003 | State saved; includes grid, timer, moves, hints, difficulty, status | 1.5h |
| PROG-007 | Implement `loadState()` – returns GameState or null; handles corruption/quota gracefully | REQ-PROG-003 | Valid state restored; corrupted → null; quota → prune history & retry | 1.5h |
| PROG-008 | Implement `completeGame()` – status=completed, completedAt=now, move to history | REQ-PROG-004, REQ-PROG-005 | Game result saved to history; stats computable | 1h |
| PROG-009 | Implement `getHistory()` – returns last 100 games reverse chronological with stats | REQ-PROG-005 | History array correct; summary stats (total, per-difficulty, best time, avg, completion rate) | 1h |
| PROG-100 | Implement `restartCurrentPuzzle()` – resets timer/moves/userEntries, keeps clues | REQ-PROG-006 | Same puzzle replayable from clean state | 1h |
| PROG-101 | Handle `visibilitychange` – pause on hidden, resume on visible (if not manually paused) | REQ-PROG-001, REQ-PROG-007 | Tab switch pauses timer; return resumes | 1h |
| PROG-102 | Unit tests: timer pause/resume, move counting rules, save/load round-trip, history limits, corruption handling | REQ-PROG-001–007 | All progress scenarios pass | 2h |

### sudoku-ui.js – Progress Integration

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| UI-015 | Wire timer: `progress.tick()` called each second via `setInterval` → `ui.updateTimerDisplay()` | REQ-UI-007, REQ-PROG-001 | Timer display updates live; pauses on pause | 1h |
| UI-016 | Wire move counter: `grid.on('cellChange', e => if(e.source==='user') progress.incrementMoves())` | REQ-UI-007, REQ-PROG-002 | Move count increments on user entries only | 0.5h |
| UI-017 | Wire hint usage: `hints.on('hintUsed', e => progress.recordHint(e.type))` | REQ-HINT-004, REQ-PROG-002 | Hint counters increment | 0.5h |
| UI-018 | Wire completion: `grid.on('complete', e => progress.completeGame(); ui.showVictory(progress.getResult()))` | REQ-UI-009, REQ-PROG-004 | Victory modal shows final stats | 1h |
| UI-019 | On load: `state = await progress.loadState(); if(state) { grid.deserialize(state.grid); progress.resume(); } else { ui.showDifficultySelector() }` | REQ-PROG-003, REQ-UI-005 | Resume works; new game flow works | 1h |
| UI-020 | Add Restart button handler → `progress.restartCurrentPuzzle(); grid.deserialize(originalPuzzle)` | REQ-PROG-006 | Restart resets user state, keeps puzzle | 1h |
| UI-021 | Add Pause/Resume button + visibilitychange handler | REQ-PROG-007, REQ-UI-006 | Pause obscures grid, stops timer; resume restores | 1h |

---

## Phase 6: Polish – Responsive, Accessible, Tested, Themes

### Responsive & Touch

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| UI-022 | Implement on-screen number pad for touch – appears on cell tap, dismisses on outside tap | REQ-UI-004 | Touch devices show keypad; enters digits; clear button works | 2h |
| UI-023 | Add `touch-action: manipulation` to grid; test on iOS Safari / Android Chrome | REQ-UI-004, Design §7.6 | No double-tap zoom; 300ms delay eliminated | 1h |
| UI-024 | Responsive CSS: grid scales to viewport; min 44px touch targets; controls stack on mobile | REQ-UI-001, REQ-UI-002 | Works at 320px–1920px; no horizontal scroll | 1.5h |

### Accessibility (WCAG AA)

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| UI-025 | Semantic HTML: `<main>`, `<section>`, `<button>` for cells, `<dialog>` for modals | REQ-UI-012 | Passes axe-core audit | 1h |
| UI-026 | ARIA: grid role, row/col headers, `aria-label` on cells (row, col, value, type), `aria-live` for hints/timer | REQ-UI-012, REQ-HINT-006 | Screen reader announces correctly | 2h |
| UI-027 | Focus management: visible 3px outline, focus trap in modals, restore focus on dismiss | REQ-UI-012 | Tab order logical; no focus loss | 1h |
| UI-028 | Color contrast: clues vs user vs hint vs conflict all meet 4.5:1; high-contrast mode toggle | REQ-UI-012 | Passes contrast check in both themes | 1h |
| UI-029 | Reduced motion: `@media (prefers-reduced-motion)` disables transitions/animations | REQ-UI-011, REQ-HINT-006 | Animations off when preference set | 0.5h |

### Themes & Settings

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| UI-030 | CSS custom properties for colors (light/dark/high-contrast); `data-theme` on `<html>` | REQ-UI-010, Design §6.5 | Theme switcher works; respects `prefers-color-scheme` | 1.5h |
| UI-031 | Settings panel/modal: conflict highlight default, hint limits, pause on blur, theme, reduced motion | REQ-UI-010 | All settings persist to localStorage; apply immediately | 1.5h |

### Testing & Quality

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| TEST-001 | Property-based tests: 1000 random grids → validator matches brute force | Design §8.3 | All pass | 1h |
| TEST-002 | Generator property test: 500 puzzles × 3 difficulties → all unique, valid, clue range | Design §8.3 | All pass | 2h |
| TEST-003 | E2E tests (Playwright): play Easy/Medium/Hard to completion; touch flow; accessibility | Design §8.4 | All 3 difficulties completable; mobile flow works | 3h |
| TEST-004 | Performance: generation <2s/5s, solver <100ms, render <16ms, memory <100KB | Design §7 | Meets targets | 1h |
| TEST-005 | Lint + format + type-check (if TS) in CI | Design §9.1 | CI passes | 0.5h |

---

## Build & Deployment

| Task ID | Task | Requirements | Acceptance Criteria | Est. |
|---------|------|--------------|---------------------|------|
| BUILD-001 | Vite production build → `dist/` with hashed assets | Design §9.2 | `npm run build` outputs optimized bundle | 0.5h |
| BUILD-002 | Preview production build locally (`vite preview`) | Design §9.2 | Works identically to dev | 0.5h |
| BUILD-003 | Deploy to static host (Netlify/Vercel/GitHub Pages) – configure SPA fallback | Design §9.3 | Live URL serves game | 1h |
| BUILD-004 | Add PWA manifest + service worker (Workbox) for offline play | Design §9.3 | Installable; works offline after first load | 2h |

---

## Task Summary by Phase

| Phase | Tasks | Est. Hours |
|-------|-------|------------|
| **1. Core** | GRID-001–010, SOL-001–007, GEN-001–007, UI-001–014, INT-001–005 | ~38h |
| **2. Generation** | GEN-008–011 | ~5h |
| **3. Logic Solver** | SOL-008–017 | ~19h |
| **4. Hints** | HINT-001–009 | ~12h |
| **5. Progress** | PROG-001–102, UI-015–021 | ~14h |
| **6. Polish** | UI-022–031, TEST-001–005, BUILD-001–004 | ~19h |
| **TOTAL** | **83 tasks** | **~107h** |

---

## Dependency Graph (Critical Path)

```
GRID-001→002→003→004→005→006→007→008→009→010
                    ↓
SOL-001→002→003→004→005→006→007
                    ↓
GEN-001→002→003→004→005→006→007
                    ↓
UI-001→002→003→004→005→006→007→008→009→010→011→012→013→014
                                                    ↓
INT-001→002→003→004→005 (Phase 1 complete)
                                                    ↓
GEN-008→009→010→011 (Phase 2)
                                                    ↓
SOL-008→009→010→011→012→013→014→015→016→017 (Phase 3)
                                                    ↓
HINT-001→002→003→004→005→006→007→008→009 (Phase 4)
                                                    ↓
PROG-001→002→003→004→005→006→007→008→009→100→101→102
     ↓
UI-015→016→017→018→019→020→021 (Phase 5)
                                                    ↓
UI-022→023→024→025→026→027→028→029→030→031
TEST-001→002→003→004→005
BUILD-001→002→003→004 (Phase 6)
```

---

## Tracking

Use the checkboxes below to track completion. Update as tasks are done.

### Phase 1: Core
- [x] GRID-001
- [x] GRID-002
- [x] GRID-003
- [x] GRID-004
- [x] GRID-005
- [x] GRID-006
- [x] GRID-007
- [x] GRID-008
- [x] GRID-009
- [ ] GRID-010
- [x] SOL-001
- [x] SOL-002
- [x] SOL-003
- [x] SOL-004
- [x] SOL-005
- [x] SOL-006
- [ ] SOL-007
- [x] GEN-001
- [x] GEN-002
- [x] GEN-003
- [x] GEN-004
- [x] GEN-005
- [x] GEN-006
- [ ] GEN-007
- [x] UI-001
- [x] UI-002
- [x] UI-003
- [x] UI-004
- [x] UI-005
- [x] UI-006
- [x] UI-007
- [x] UI-008
- [x] UI-009
- [x] UI-010
- [x] UI-011
- [x] UI-012
- [x] UI-013
- [x] UI-014
- [x] INT-001
- [ ] INT-002
- [ ] INT-003
- [ ] INT-004
- [ ] INT-005

### Phase 2: Generation
- [ ] GEN-008
- [ ] GEN-009
- [ ] GEN-010
- [ ] GEN-011

### Phase 3: Logic Solver
- [ ] SOL-008
- [ ] SOL-009
- [ ] SOL-010
- [ ] SOL-011
- [ ] SOL-012
- [ ] SOL-013
- [ ] SOL-014
- [ ] SOL-015
- [ ] SOL-016
- [ ] SOL-017

### Phase 4: Hints
- [x] HINT-001
- [ ] HINT-002
- [ ] HINT-003
- [ ] HINT-004
- [ ] HINT-005
- [ ] HINT-006
- [ ] HINT-007
- [ ] HINT-008
- [ ] HINT-009

### Phase 5: Progress
- [ ] PROG-001
- [ ] PROG-002
- [ ] PROG-003
- [ ] PROG-000
- [ ] PROG-005
- [ ] PROG-006
- [ ] PROG-007
- [ ] PROG-008
- [ ] PROG-009
- [ ] PROG-100
- [ ] PROG-101
- [ ] PROG-102
- [ ] UI-015
- [ ] UI-016
- [ ] UI-017
- [ ] UI-018
- [ ] UI-019
- [ ] UI-020
- [ ] UI-021

### Phase 6: Polish
- [ ] UI-022
- [ ] UI-023
- [ ] UI-024
- [ ] UI-025
- [ ] UI-026
- [ ] UI-027
- [ ] UI-028
- [ ] UI-029
- [ ] UI-030
- [ ] UI-031
- [ ] TEST-001
- [ ] TEST-002
- [ ] TEST-003
- [ ] TEST-004
- [ ] TEST-005
- [ ] BUILD-001
- [ ] BUILD-002
- [ ] BUILD-003
- [ ] BUILD-004

---

## Notes for Implementers

1. **Order matters** – Follow the dependency graph. Grid → Solver → Generator → UI → Integration is the critical path.
2. **Test as you go** – Each module's unit tests (GRID-010, SOL-007, GEN-007, HINT-009, PROG-102) should pass before integrating.
3. **Use the design's data structures** – `Uint8Array(81)` for grids, `Uint16Array(81)` bitmasks for candidates, flat index = `row*9+col`.
4. **Events over polling** – Grid emits events; UI subscribes. No `setInterval` polling grid state.
5. **Persistence is last** – Build the game logic first; add localStorage in Phase 5.
6. **Accessibility early** – Semantic HTML and ARIA from UI-001 onward; retrofitting is harder.
7. **Mobile first for touch** – UI-022/023/024 are not optional; test on real devices.

---

*End of tasks.md*