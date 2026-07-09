# Delta Spec: sudoku-progress

## ADDED Requirements

### REQ-PROG-001: Game Timer
**Description**: The progress system MUST track elapsed game time from start to completion.

**Scenarios**:
- Given a new game is started, When the timer begins, Then elapsed time SHALL start at 00:00 and increment every second
- Given a game in progress, When the user pauses the game (e.g., tab hidden, pause button), Then the timer SHALL pause and resume when the game regains focus
- Given a game in progress, When the puzzle is solved, Then the timer SHALL stop and the final time SHALL be recorded
- Given a completed game, When viewed in history, Then the completion time SHALL be displayed in MM:SS format (or HH:MM:SS for longer games)
- Given a paused game restored from localStorage, When the game resumes, Then the timer SHALL continue from the saved elapsed time

### REQ-PROG-002: Move Counter
**Description**: The progress system MUST track the number of user moves (cell entries).

**Scenarios**:
- Given a new game, When the user enters a value in an empty cell, Then the move counter SHALL increment by 1
- Given a game in progress, When the user changes an existing user-entered value, Then the move counter SHALL increment by 1 (each entry counts)
- Given a game in progress, When the user deletes/clears a cell, Then the move counter SHALL NOT increment (only entries count)
- Given a game in progress, When a hint reveals a cell, Then the move counter SHALL NOT increment (hints are not user moves)
- Given a completed game, When viewed in history, Then the total move count SHALL be displayed

### REQ-PROG-003: Game State Persistence (localStorage)
**Description**: The progress system MUST persist game state to localStorage for session recovery.

**Scenarios**:
- Given a game in progress, When the page is closed/refreshed, Then the game state SHALL be saved to localStorage automatically (on change or periodic)
- Given a saved game in localStorage, When the user returns to the game, Then the game SHALL restore: grid state (clues, user entries, hints), timer elapsed time, move count, difficulty, hint usage count, and completion status
- Given a completed game, When the user starts a new game, Then the completed game SHALL be moved to history and the new game SHALL start fresh
- Given localStorage quota exceeded, When saving, Then the system SHALL catch the error, remove oldest history entries, and retry
- Given corrupted localStorage data, When loading, Then the system SHALL detect corruption, discard the save, and start a new game

### REQ-PROG-004: Game Completion Detection
**Description**: The progress system MUST detect when the puzzle is correctly solved.

**Scenarios**:
- Given a game in progress, When all cells are filled and the grid is valid (no conflicts, all rows/columns/boxes contain 1-9), Then the game SHALL be marked as complete
- Given a game in progress, When the last empty cell is filled correctly, Then completion SHALL be detected immediately and the win sequence SHALL trigger
- Given a game with conflicts, When all cells are filled but conflicts exist, Then the game SHALL NOT be marked as complete
- Given a completed game, When the user views the game, Then a completion celebration SHALL display (time, moves, hints used, difficulty)

### REQ-PROG-005: Game History and Statistics
**Description**: The progress system MUST maintain a history of completed games with statistics.

**Scenarios**:
- Given a completed game, When saved to history, Then the record SHALL include: date, difficulty, completion time, move count, hint count, and whether completed without hints
- Given game history, When viewed, Then games SHALL be listed in reverse chronological order (newest first)
- Given game history, When viewed, Then summary statistics SHALL be shown: total games played, games per difficulty, best time per difficulty, average time, completion rate
- Given game history exceeding storage limit, When a new game is added, Then the oldest games SHALL be removed to stay within quota (e.g., keep last 100 games)

### REQ-PROG-006: New Game and Difficulty Selection
**Description**: The progress system MUST support starting new games with difficulty selection.

**Scenarios**:
- Given any game state, When the user starts a new game, Then a new puzzle SHALL be generated at the selected difficulty and the timer/move counter SHALL reset
- Given a game in progress, When the user changes difficulty and starts a new game, Then the new puzzle SHALL match the selected difficulty
- Given a game in progress, When the user restarts the current puzzle, Then the same puzzle SHALL be reset (timer and moves reset, user entries cleared, clues preserved)

### REQ-PROG-007: Pause/Resume Functionality
**Description**: The progress system MUST support pausing and resuming the game.

**Scenarios**:
- Given a game in progress, When the user clicks pause (or tabs away), Then the timer SHALL pause and the grid SHALL be visually obscured or disabled
- Given a paused game, When the user clicks resume (or tabs back), Then the timer SHALL resume and the grid SHALL be interactive again
- Given a paused game, When the page is refreshed, Then the paused state and elapsed time SHALL be restored from localStorage