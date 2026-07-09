# Delta Spec: sudoku-hints

## ADDED Requirements

### REQ-HINT-001: Conflict Highlighting Toggle
**Description**: The hint system MUST provide a toggle to highlight all conflicting cells.

**Scenarios**:
- Given a puzzle with conflicts, When "Highlight Conflicts" is enabled, Then all cells participating in conflicts SHALL be visually highlighted (distinct from selection highlight)
- Given "Highlight Conflicts" is enabled, When the user resolves a conflict, Then the highlighting SHALL update in real-time (removed for resolved conflicts)
- Given "Highlight Conflicts" is disabled, When conflicts exist, Then no conflict highlighting SHALL be shown (but conflicts still exist internally)
- Given a new game starts, When "Highlight Conflicts" was previously enabled, Then it SHALL remain enabled (persisted preference)

### REQ-HINT-002: Reveal Cell Value
**Description**: The hint system MUST allow revealing the correct value for a selected cell.

**Scenarios**:
- Given a cell is selected, When "Reveal Cell" is invoked, Then the correct solution value for that cell SHALL be filled in as a hint entry (visually distinct from user entries)
- Given a clue cell is selected, When "Reveal Cell" is invoked, Then nothing SHALL happen (clues are already revealed)
- Given a cell already has a user entry, When "Reveal Cell" is invoked, Then the user entry SHALL be replaced by the correct hint value
- Given a cell is revealed, When the user later enters a different value, Then the hint SHALL be replaced by the user entry
- Given reveal is used, When the game is saved, Then the revealed cell SHALL persist as a hint entry

### REQ-HINT-003: Logical Step Hint
**Description**: The hint system MUST provide the next logical solving step with explanation.

**Scenarios**:
- Given a puzzle in progress, When "Logical Hint" is invoked, Then the system SHALL query the solver for the next logical step and display: technique name, affected cells, and plain-language explanation
- Given the next step is a Naked Single, When the hint is shown, Then the explanation SHALL read something like: "In row 3, column 5, the only possible value is 7 because all other digits 1-9 except 7 already appear in the row, column, or box."
- Given the next step is a Hidden Single, When the hint is shown, Then the explanation SHALL read something like: "In the top-left box, the digit 4 can only go in row 2, column 3 because it's eliminated from all other cells in the box."
- Given no logical step is available (requires guessing), When "Logical Hint" is invoked, Then a message SHALL display: "No logical step available. This puzzle requires advanced techniques or trial and error."
- Given a hint is shown, When the user applies the step manually, Then the puzzle state SHALL advance accordingly

### REQ-HINT-004: Hint Usage Tracking
**Description**: The hint system MAY track hint usage per game (optional feature).

**Scenarios**:
- Given a new game starts, When hints are used, Then a counter SHALL increment for each hint type used (conflicts toggle, reveal cell, logical hint)
- Given hint limits are configured (optional), When a limit is reached, Then the corresponding hint button SHALL be disabled with a tooltip explaining the limit
- Given a game is completed, When the completion dialog shows, Then hint usage counts SHALL be displayed
- Given a game is saved, When restored, Then hint usage counts SHALL be restored

### REQ-HINT-005: Hint Integration with Grid and Solver
**Description**: The hint system MUST coordinate with the grid and solver modules.

**Scenarios**:
- Given the hint system needs the solution, When a hint is requested, Then it SHALL request the solution from the solver (or use a cached solution from generation)
- Given "Reveal Cell" is used, When the value is revealed, Then the hint system SHALL call the grid to set a hint entry at that cell
- Given "Logical Hint" is used, When the step is determined, Then the hint system SHALL highlight the relevant cells in the grid temporarily
- Given conflicts are highlighted, When the grid detects conflict changes, Then the hint system SHALL update the conflict highlight state

### REQ-HINT-006: Accessible Hint Display
**Description**: The hint system MUST present hints in an accessible manner.

**Scenarios**:
- Given a logical hint is shown, When displayed, Then it SHALL appear in an accessible modal/tooltip with: technique name (heading), affected cells (list), explanation (paragraph), and a "Dismiss" button
- Given a screen reader user, When a hint appears, Then it SHALL be announced via aria-live or role="alert"
- Given a user with reduced motion, When hints animate, Then animations SHALL be disabled or reduced
- Given high contrast mode, When hints display, Then colors SHALL meet WCAG AA contrast ratios