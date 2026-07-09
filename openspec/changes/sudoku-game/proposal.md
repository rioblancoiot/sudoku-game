# Proposal: Sudoku Game

## Intent

Build a playable Sudoku game as a reasoning game with multiple difficulty levels, puzzle generation, hint system, and progress tracking.

## Scope

### In Scope
- 9x9 Sudoku grid with standard rules (rows, columns, 3x3 boxes)
- 3 difficulty levels: Easy, Medium, Hard
- Puzzle generator with unique solutions
- Hint system (highlight conflicts, reveal cell, solve step)
- Timer and move counter
- Progress saving (localStorage)
- Keyboard and mouse/touch input support
- Responsive design for mobile and desktop

### Out of Scope
- Multiplayer or leaderboards
- Puzzle sharing/import/export
- Custom puzzle creation
- Advanced solving techniques tutorial
- Daily puzzle calendar
- Mobile app wrapper

## Capabilities

### New Capabilities
- `sudoku-grid`: 9x9 grid rendering, cell selection, input validation, conflict highlighting
- `sudoku-generator`: Puzzle generation with unique solutions at 3 difficulty levels
- `sudoku-solver`: Logical solver for hints (naked/hidden singles, pairs, triples) and validation
- `sudoku-hints`: Hint system (conflict highlight, single cell reveal, logical step hint)
- `sudoku-progress`: Timer, move counter, localStorage persistence, completion tracking
- `sudoku-ui`: Responsive game UI, difficulty selector, new game, keyboard/touch input

### Modified Capabilities
- None (new capabilities only)

## Approach

Build a vanilla JavaScript Sudoku game (no framework) using ES modules. Use a backtracking algorithm with constraint propagation for puzzle generation and solving. Implement logical solving techniques for hints (naked/hidden singles, pairs, triples). Store game state in localStorage for persistence. Vanilla CSS with CSS Grid for responsive grid layout. Vanilla ES modules for clean separation of concerns (grid, generator, solver, hints, progress, UI).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/sudoku-grid.js` | New | Grid rendering, cell selection, input handling, conflict highlighting |
| `src/sudoku-generator.js` | New | Puzzle generation with unique solutions, 3 difficulty levels |
| `src/sudoku-solver.js` | New | Logical solver for validation and hint generation |
| `src/sudoku-hints.js` | New | Hint system (conflicts, reveal cell, logical step) |
| `src/sudoku-progress.js` | New | Timer, moves counter, localStorage persistence |
| `src/sudoku-ui.js` | New | Main UI controller, difficulty selector, game flow |
| `src/index.js` | New | Entry point, module initialization |
| `index.html` | New | Main HTML structure |
| `styles/main.css` | New | Responsive grid, UI styling, themes |
| `package.json` | New | Dev server, build scripts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Puzzle generator produces non-unique solutions | Medium | Validate uniqueness with solver; retry on failure |
| Logical solver too complex for hints | Medium | Start with naked/hidden singles only; add pairs later |
| Mobile touch input conflicts with grid interaction | Low | Test touch events; use touch-action CSS |
| localStorage quota exceeded | Low | Catch quota errors; clear old saves |

## Rollback Plan

Delete the `src/`, `styles/`, `index.html`, and `package.json` files created for this change. No database migrations or backend changes to revert.

## Dependencies

- None (vanilla JS, no external dependencies)
- Modern browser with ES modules, localStorage, CSS Grid support

## Success Criteria

- [ ] Playable 9x9 Sudoku with 3 difficulty levels
- [ ] All generated puzzles have unique solutions
- [ ] Hint system provides at least conflict highlighting and cell reveal
- [ ] Game state persists across browser sessions
- [ ] Works on mobile (touch) and desktop (keyboard/mouse)
- [ ] Completable puzzles at all difficulties verified by solver
- [ ] Timer and move counter function correctly
- [ ] Clean, responsive UI with visual feedback