# Delta Spec: sudoku-grid

## ADDED Requirements

### REQ-GRID-001: Grid Data Model
**Description**: The grid module MUST maintain the internal state of the 9x9 Sudoku grid.

**Scenarios**:
- Given a new puzzle, When initialized, Then the grid SHALL store: clues (immutable), user entries, and hint entries separately for each cell
- Given any cell, When queried, Then the grid SHALL return: value (0 if empty), isClue (boolean), isHint (boolean), hasConflict (boolean)
- Given a cell coordinate (row 0-8, col 0-8), When a value is set, Then the grid SHALL update the user entry for that cell (if not a clue)
- Given a cell coordinate, When cleared, Then the grid SHALL remove the user entry (if not a clue), preserving clues and hints
- Given the grid, When serialized, Then it SHALL produce a JSON-serializable state object for persistence

### REQ-GRID-002: Input Validation
**Description**: The grid MUST validate all user inputs against Sudoku rules.

**Scenarios**:
- Given an empty cell (not a clue), When the user enters a digit 1-9, Then the value SHALL be accepted and stored as a user entry
- Given a cell with a user entry, When the user enters a different digit 1-9, Then the value SHALL be updated
- Given a clue cell, When the user attempts to enter a value, Then the input SHALL be rejected and the clue SHALL remain unchanged
- Given any cell, When the user enters 0, Backspace, or Delete, Then the cell SHALL be cleared (if not a clue)
- Given any cell, When the user enters a non-digit character, Then the input SHALL be ignored

### REQ-GRID-003: Conflict Detection
**Description**: The grid MUST detect and report conflicts in real-time.

**Scenarios**:
- Given the grid state, When checked for conflicts, Then the grid SHALL identify all cells where the same digit appears more than once in the same row, column, or 3x3 box
- Given a grid with conflicts, When queried for a specific cell, Then the grid SHALL return whether that cell participates in any conflict
- Given a grid with no conflicts, When checked, Then the grid SHALL report zero conflicts
- Given a user enters a value creating a conflict, When the entry is made, Then the conflict SHALL be detected immediately and the affected cells SHALL be flagged
- Given a conflict exists, When the user corrects one of the conflicting values, Then the conflict SHALL be cleared for all affected cells

### REQ-GRID-004: Cell Selection Management
**Description**: The grid MUST track and manage the currently selected cell.

**Scenarios**:
- Given the grid, When a cell is selected (click/tap/keyboard), Then the grid SHALL update its selected cell coordinate and notify listeners
- Given a selected cell, When the user navigates with arrow keys, Then the selection SHALL move to the adjacent cell (up/down/left/right) with edge wrapping
- Given a selected cell, When the user clicks another cell, Then selection SHALL move to the clicked cell
- Given no cell selected, When the grid receives focus, Then the first non-clue cell (or 0,0) SHALL be selected by default

### REQ-GRID-005: Grid Completion Check
**Description**: The grid MUST detect when the puzzle is completely and correctly solved.

**Scenarios**:
- Given the grid state, When checked for completion, Then the grid SHALL return true if and only if: all 81 cells have values (1-9), no conflicts exist, and all rows/columns/boxes contain 1-9 exactly once
- Given a grid with empty cells, When checked for completion, Then the grid SHALL return false
- Given a grid with all cells filled but conflicts exist, When checked for completion, Then the grid SHALL return false
- Given a completed grid, When the last cell is filled correctly, Then completion SHALL be detected immediately

### REQ-GRID-006: Grid Serialization for Persistence
**Description**: The grid MUST serialize and deserialize its complete state for localStorage persistence.

**Scenarios**:
- Given a grid with clues, user entries, and hints, When serialized, Then the output SHALL contain: clue positions/values, user entry positions/values, hint positions/values
- Given a serialized grid state, When deserialized, Then the grid SHALL be restored to the exact same state (clues, entries, hints, selection)
- Given a serialized state from an older version, When deserialized, Then the grid SHALL handle missing fields gracefully with defaults
- Given a corrupted serialized state, When deserialized, Then the grid SHALL detect corruption and throw a recoverable error

### REQ-GRID-007: Hint Integration
**Description**: The grid MUST integrate with the hint system to display hint-provided values.

**Scenarios**:
- Given a hint reveals a cell value, When the hint is applied, Then the grid SHALL store the value as a hint entry (distinct from user entry)
- Given a cell has a hint entry, When the user enters a value in that cell, Then the hint entry SHALL be replaced by the user entry
- Given a cell has a hint entry, When conflict detection runs, Then the hint value SHALL be treated as a valid entry for conflict purposes
- Given a hint is used, When the grid serializes, Then hint entries SHALL be included in the persisted state

### REQ-GRID-008: Grid Events/Callbacks
**Description**: The grid MUST emit events for UI synchronization.

**Scenarios**:
- Given a cell value changes, When the change occurs, Then the grid SHALL emit a 'cellChange' event with cell coordinates, new value, and source (user/hint/clear)
- Given a conflict state changes, When the change occurs, Then the grid SHALL emit a 'conflictChange' event with affected cell coordinates
- Given the selection changes, When the change occurs, Then the grid SHALL emit a 'selectionChange' event with new coordinates
- Given the grid becomes complete, When completion is detected, Then the grid SHALL emit a 'complete' event
- Given the grid state is restored, When restoration completes, Then the grid SHALL emit a 'restored' event