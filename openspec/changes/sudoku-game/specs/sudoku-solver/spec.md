# Delta Spec: sudoku-solver

## ADDED Requirements

### REQ-SOL-001: Complete Solution Validation
**Description**: The solver MUST validate whether a complete 9x9 grid is a valid Sudoku solution.

**Scenarios**:
- Given a 9x9 grid with all cells filled (1-9), When validated, Then the solver SHALL return true if and only if every row, column, and 3x3 box contains digits 1-9 exactly once
- Given a complete grid with any duplicate in a row, column, or box, When validated, Then the solver SHALL return false
- Given a complete grid with any cell containing 0 or >9, When validated, Then the solver SHALL return false

### REQ-SOL-002: Partial Grid Validation
**Description**: The solver MUST validate whether a partially filled grid is still valid (no conflicts).

**Scenarios**:
- Given a partially filled grid, When validated, Then the solver SHALL return true if no digit appears more than once in any row, column, or 3x3 box (ignoring zeros/empty cells)
- Given a partially filled grid with a conflict, When validated, Then the solver SHALL return false and identify the conflicting cells
- Given an empty grid, When validated, Then the solver SHALL return true

### REQ-SOL-003: Uniqueness Verification
**Description**: The solver MUST determine whether a puzzle has exactly one unique solution.

**Scenarios**:
- Given a puzzle (partially filled grid), When checked for uniqueness, Then the solver SHALL return true if exactly one complete solution exists, false if zero or multiple solutions exist
- Given a puzzle with zero solutions, When checked, Then the solver SHALL return false (invalid puzzle)
- Given a puzzle with multiple solutions, When checked, Then the solver SHALL return false (non-unique puzzle)
- Given a puzzle, When checking uniqueness, Then the solver SHALL stop searching after finding 2 solutions (for performance)

### REQ-SOL-004: Logical Solving Techniques
**Description**: The solver MUST implement logical solving techniques for hint generation.

**Scenarios**:
- Given a puzzle, When applying Naked Single technique, Then the solver SHALL identify cells where only one candidate remains
- Given a puzzle, When applying Hidden Single technique, Then the solver SHALL identify cells where a digit can only go in one position within a row/column/box
- Given a puzzle, When applying Naked Pair technique, Then the solver SHALL identify pairs of cells in a unit sharing the same two candidates, eliminating those candidates from other cells in the unit
- Given a puzzle, When applying Hidden Pair technique, Then the solver SHALL identify two digits that can only appear in two specific cells within a unit
- Given a puzzle, When applying Pointing Pair/Triple technique, Then the solver SHALL identify candidates locked to a row/column within a box, eliminating them from the rest of the row/column
- Given a puzzle, When applying Box-Line Reduction, Then the solver SHALL identify candidates locked to a box within a row/column

### REQ-SOL-005: Advanced Techniques (Optional)
**Description**: The solver MAY implement advanced techniques for Hard puzzles.

**Scenarios**:
- Given a puzzle, When applying X-Wing technique, Then the solver SHALL identify the pattern and eliminate candidates
- Given a puzzle, When applying Swordfish technique, Then the solver SHALL identify the pattern and eliminate candidates
- Given a puzzle, When applying XY-Wing technique, Then the solver SHALL identify the pattern and eliminate candidates
- Given a puzzle requiring advanced techniques, When the solver cannot progress with basic/intermediate techniques, Then it SHALL apply advanced techniques if implemented, OR report that no logical step is available

### REQ-SOL-006: Next Logical Step for Hints
**Description**: The solver MUST provide the next logical solving step for the hint system.

**Scenarios**:
- Given a partially solved puzzle, When requesting the next step, Then the solver SHALL return: technique name, affected cells, explanation text, and the action (candidate elimination or value placement)
- Given a puzzle solvable with Naked Singles, When requesting a hint, Then the solver SHALL return the Naked Single step with the cell and value
- Given a puzzle requiring Hidden Singles, When requesting a hint, Then the solver SHALL return the Hidden Single step with the cell and value
- Given a puzzle with no logical next step (requires guessing), When requesting a hint, Then the solver SHALL return null or indicate that no logical step is available

### REQ-SOL-007: Candidate Management
**Description**: The solver MUST maintain and update candidate lists for all empty cells.

**Scenarios**:
- Given a puzzle, When initialized, Then the solver SHALL compute initial candidates for all empty cells (digits 1-9 not present in row/column/box)
- Given a value is placed in a cell, When candidates are updated, Then the solver SHALL remove that value from candidates of all peers (row, column, box)
- Given a candidate is eliminated, When it results in a Naked Single, Then the solver SHALL detect this automatically
- Given the candidate grid, When queried for a cell, Then the solver SHALL return the current candidate set for that cell

### REQ-SOL-008: Backtracking Solver (Fallback)
**Description**: The solver MUST provide a backtracking algorithm for validation and generation.

**Scenarios**:
- Given a puzzle, When finding a solution via backtracking, Then the solver SHALL return a complete valid solution if one exists, or null if unsolvable
- Given a puzzle, When counting solutions, Then the solver SHALL return the number of solutions (capped at 2 for uniqueness checking)
- Given a complete or partial grid, When solving, Then the solver SHALL use constraint propagation first, then backtracking only when needed
- Given a puzzle, When solving, Then the solver SHALL complete within 100ms for typical puzzles