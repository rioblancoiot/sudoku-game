# Delta Spec: sudoku-generator

## ADDED Requirements

### REQ-GEN-001: Puzzle Generation with Unique Solutions
**Description**: The generator MUST produce valid 9x9 Sudoku puzzles with exactly one unique solution.

**Scenarios**:
- Given the generator is invoked, When a puzzle is generated, Then the resulting puzzle SHALL have exactly one valid solution
- Given a generated puzzle, When solved by the solver, Then exactly one complete valid grid SHALL satisfy all Sudoku constraints
- Given multiple generation requests, Each generated puzzle SHALL be unique (not identical to recently generated puzzles)

### REQ-GEN-002: Difficulty Levels
**Description**: The generator MUST produce puzzles at three distinct difficulty levels: Easy, Medium, Hard.

**Scenarios**:
- Given difficulty "Easy" is requested, When a puzzle is generated, Then the puzzle SHALL be solvable using only basic techniques (naked singles, hidden singles) and SHALL have 35-45 clues
- Given difficulty "Medium" is requested, When a puzzle is generated, Then the puzzle SHALL require intermediate techniques (naked/hidden pairs, pointing pairs, box-line reduction) and SHALL have 28-34 clues
- Given difficulty "Hard" is requested, When a puzzle is generated, Then the puzzle SHALL require advanced techniques (naking/hidden triples, X-Wing, Swordfish, or forcing chains) and SHALL have 22-27 clues
- Given any difficulty, When a puzzle is generated, Then the puzzle SHALL have a unique solution verifiable by the solver

### REQ-GEN-003: Puzzle Generation Algorithm
**Description**: The generator MUST use a validated algorithm that guarantees unique solutions.

**Scenarios**:
- Given a blank grid, When generating a puzzle, Then the generator SHALL first generate a complete valid solution grid, THEN remove digits while maintaining uniqueness
- Given a complete solution grid, When removing digits, Then after each removal the generator SHALL verify the puzzle still has a unique solution using the solver
- Given the target clue count for a difficulty is reached, When the generator stops removing digits, Then the puzzle SHALL be returned with exactly the target number of clues (within the difficulty range)

### REQ-GEN-004: Solution Grid Generation
**Description**: The generator MUST be able to produce a valid complete 9x9 Sudoku solution grid.

**Scenarios**:
- Given a blank grid, When generating a solution, Then the resulting grid SHALL satisfy all Sudoku constraints (each row, column, and 3x3 box contains digits 1-9 exactly once)
- Given the solution generator, When called multiple times, Then it SHOULD produce different valid solution grids (randomized)
- Given a solution grid, When validated by the solver, Then it SHALL be confirmed as a valid complete solution

### REQ-GEN-005: Difficulty Assessment
**Description**: The generator MUST assess puzzle difficulty based on the solving techniques required.

**Scenarios**:
- Given a generated puzzle, When assessing difficulty, Then the generator SHALL analyze which solving techniques are required to solve it without guessing
- Given a puzzle solvable with only naked/hidden singles, When assessed, Then it SHALL be classified as "Easy"
- Given a puzzle requiring pairs/triples/pointing pairs, When assessed, Then it SHALL be classified as "Medium"
- Given a puzzle requiring advanced techniques (X-Wing, Swordfish, forcing chains), When assessed, Then it SHALL be classified as "Hard"
- Given a puzzle that requires guessing/backtracking, When assessed, Then it SHALL be rejected and regenerated

### REQ-GEN-006: Puzzle Generation Performance
**Description**: Puzzle generation MUST complete within acceptable time limits.

**Scenarios**:
- Given a difficulty level is requested, When generating a puzzle, Then generation SHALL complete within 2 seconds on typical hardware
- Given Hard difficulty (hardest to generate), When generating, Then generation SHALL complete within 5 seconds
- Given generation takes too long, When a timeout is reached, Then the generator SHALL fall back to a pre-generated puzzle pool or retry with different parameters

### REQ-GEN-007: Pre-generated Puzzle Pool (Fallback)
**Description**: The system MAY include a pool of pre-generated puzzles as a fallback for performance.

**Scenarios**:
- Given generation times out or fails, When falling back to the pool, Then a puzzle of the requested difficulty SHALL be selected from the pool
- Given the pool is used, When a puzzle is selected, Then it SHALL be validated to have a unique solution before use
- Given the pool is used, When multiple games are played, Then puzzles SHOULD be selected randomly from the pool to avoid repetition