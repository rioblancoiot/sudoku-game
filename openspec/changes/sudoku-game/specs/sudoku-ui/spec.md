# Delta Spec: sudoku-ui

## ADDED Requirements

### REQ-UI-001: Main Game Layout
**Description**: The UI MUST present a responsive main game screen with all essential elements.

**Scenarios**:
- Given the game loads, When rendered, Then the UI SHALL display: 9x9 Sudoku grid (centered), difficulty selector, New Game button, timer display, move counter, hint buttons (conflicts, reveal, logical), and pause/resume button
- Given a desktop viewport (≥768px), When rendered, Then the grid SHALL be at least 480px wide with comfortable cell sizing for mouse interaction
- Given a mobile viewport (<768px), When rendered, Then the grid SHALL scale to fit viewport width with touch-friendly cell sizes (minimum 44px touch targets)
- Given any viewport, When rendered, Then all UI elements SHALL be accessible and usable without horizontal scrolling
- Given the game loads, When rendered, Then the UI SHALL be fully keyboard navigable (Tab order, focus indicators)

### REQ-UI-002: Sudoku Grid Rendering
**Description**: The UI MUST render a 9x9 grid using CSS Grid with proper 3x3 box visual separation.

**Scenarios**:
- Given the grid renders, When displayed, Then it SHALL have 81 cells in 9 rows × 9 columns
- Given the grid renders, When displayed, Then 3×3 boxes SHALL be visually separated by thicker borders (2-3px) or subtle background shading
- Given the grid renders, When displayed, Then clue cells (initial givens) SHALL be visually distinct from user entries (e.g., bold, darker color, non-editable appearance)
- Given the grid renders, When displayed, Then user-entered values SHALL be visually distinct from clues (e.g., blue color, normal weight)
- Given the grid renders, When displayed, Then hint-revealed values SHALL be visually distinct from both clues and user entries (e.g., green color, hint icon)
- Given the grid renders, When displayed, Then the currently selected cell SHALL have a prominent focus ring/highlight

### REQ-UI-003: Cell Selection and Keyboard Input
**Description**: The UI MUST support cell selection and keyboard number entry on desktop.

**Scenarios**:
- Given the grid has focus, When the user clicks a cell, Then that cell SHALL become the active/selected cell with visible highlight
- Given a cell is selected, When the user presses arrow keys, Then selection SHALL move in the corresponding direction (wrapping at edges)
- Given a cell is selected, When the user presses 1-9, Then that digit SHALL be entered in the selected cell (if not a clue)
- Given a cell is selected, When the user presses Backspace, Delete, or 0, Then the selected cell SHALL be cleared (if not a clue)
- Given a cell is selected, When the user presses Escape, Then the cell SHALL be deselected (blur grid)
- Given a clue cell is selected, When the user presses a digit key, Then the input SHALL be rejected (clues cannot be changed)
- Given the grid has focus, When the user presses Tab, Then focus SHALL move to the next focusable element outside the grid

### REQ-UI-004: Touch/Mobile Input with On-Screen Keypad
**Description**: The UI MUST support touch input with an on-screen number pad for mobile devices.

**Scenarios**:
- Given the game is viewed on a touch device, When the user taps a cell, Then the cell SHALL be selected and an on-screen number pad SHALL appear near the cell
- Given the on-screen number pad is visible, When the user taps a digit 1-9, Then that digit SHALL be entered in the selected cell
- Given the on-screen number pad is visible, When the user taps the erase/clear button, Then the selected cell SHALL be cleared (if not a clue)
- Given the on-screen number pad is visible, When the user taps outside the pad or selects a different cell, Then the number pad SHALL be dismissed or repositioned to the new cell
- Given the on-screen number pad is visible, When the user taps a clue cell, Then the number pad SHALL NOT appear (or dismiss if already shown)

### REQ-UI-005: Difficulty Selector
**Description**: The UI MUST provide a difficulty selector for new games.

**Scenarios**:
- Given the game loads, When rendered, Then a difficulty selector SHALL be visible with options: Easy, Medium, Hard
- Given a difficulty is selected, When a new game is started, Then the new puzzle SHALL match the selected difficulty
- Given a game is in progress, When the user changes difficulty and starts a new game, Then the new puzzle SHALL match the newly selected difficulty
- Given the game loads, When a difficulty was previously selected, Then the selector SHALL default to the last selected difficulty (persisted preference)

### REQ-UI-006: Game Controls
**Description**: The UI MUST provide game control buttons.

**Scenarios**:
- Given the game is rendered, When displayed, Then a "New Game" button SHALL be visible and start a new puzzle at the current difficulty
- Given the game is rendered, When displayed, Then a "Restart" button SHALL be visible and reset the current puzzle (clear user entries, reset timer/moves)
- Given the game is in progress, When displayed, Then a "Pause/Resume" button SHALL be visible and toggle pause state
- Given the game is paused, When displayed, Then the grid SHALL be visually obscured or disabled, and the timer SHALL stop
- Given the game is paused, When resumed, Then the grid SHALL be interactive and the timer SHALL continue from paused time

### REQ-UI-007: Timer and Move Counter Display
**Description**: The UI MUST display the game timer and move counter.

**Scenarios**:
- Given a game is in progress, When the timer runs, Then the display SHALL show elapsed time in MM:SS format (switching to HH:MM:SS after 60 minutes)
- Given the game is paused, When viewed, Then the timer SHALL display the paused time (not incrementing)
- Given a game is in progress, When moves are made, Then the move counter SHALL display the current count
- Given a game is completed, When viewed, Then the final time and move count SHALL be displayed in the completion dialog

### REQ-UI-008: Hint Buttons
**Description**: The UI MUST provide hint action buttons.

**Scenarios**:
- Given the game is in progress, When displayed, Then a "Highlight Conflicts" toggle button SHALL be visible
- Given the game is in progress, When displayed, Then a "Reveal Cell" button SHALL be visible (enabled when a cell is selected)
- Given the game is in progress, When displayed, Then a "Logical Hint" button SHALL be visible
- Given a hint is used, When the action completes, Then the hint usage counter SHALL increment (if tracking enabled)
- Given hint limits are enforced, When a limit is reached, Then the corresponding button SHALL be disabled with a tooltip

### REQ-UI-009: Game Completion Dialog
**Description**: The UI MUST display a completion dialog when the puzzle is solved.

**Scenarios**:
- Given the puzzle is solved, When completion is detected, Then a modal dialog SHALL appear showing: completion time, move count, hints used, difficulty, and "New Game" / "Play Again" buttons
- Given the completion dialog shows, When "New Game" is clicked, Then a new puzzle at the current difficulty SHALL start
- Given the completion dialog shows, When "Play Again" is clicked, Then the same puzzle SHALL restart (clearing user entries, keeping clues)
- Given the completion dialog shows, When dismissed, Then the completed grid SHALL remain visible with celebration animation

### REQ-UI-010: Settings/Preferences
**Description**: The UI MAY provide a settings panel for user preferences.

**Scenarios**:
- Given the game loads, When a settings button is present, Then clicking it SHALL open a settings panel/modal
- Given settings are opened, When displayed, Then options SHALL include: conflict highlighting default (on/off), hint limits per difficulty, timer pause on blur (on/off), high contrast mode, reduced motion
- Given settings are changed, When the panel closes, Then preferences SHALL be saved to localStorage and applied immediately
- Given the game loads, When preferences exist in localStorage, Then they SHALL be applied on startup

### REQ-UI-011: Visual Feedback and Animations
**Description**: The UI SHOULD provide subtle visual feedback for interactions.

**Scenarios**:
- Given a cell is selected, When highlighted, Then a subtle animation (scale, border color transition) SHALL indicate selection
- Given a conflict is detected/removed, When highlighting changes, Then a smooth transition SHALL occur (no jarring flashes)
- Given a hint is applied, When the value appears, Then a brief subtle animation (fade-in, pulse) SHALL indicate it's a hint
- Given a game is completed, When the dialog appears, Then a celebration animation (confetti, pulse) SHALL play (respecting reduced motion)
- Given the user prefers reduced motion, When animations would play, Then they SHALL be disabled or reduced to instant transitions

### REQ-UI-012: Accessibility
**Description**: The UI MUST meet WCAG AA accessibility standards.

**Scenarios**:
- Given keyboard navigation, When tabbing through the UI, Then all interactive elements SHALL have visible focus indicators (3px outline, 3:1 contrast)
- Given a screen reader, When navigating the grid, Then each cell SHALL announce: row, column, value (or "empty"), and whether it's a clue/user entry/hint
- Given color is used to convey meaning, When viewed in grayscale, Then information SHALL still be conveyed (patterns, icons, text labels)
- Given high contrast mode, When enabled, Then all UI elements SHALL meet 4.5:1 contrast ratio for text and 3:1 for UI components
- Given reduced motion preference, When detected, Then all non-essential animations SHALL be disabled