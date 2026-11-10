---
name: tests
description: Use before proposing new tests or updating existing tests.
---

# Testing

Follow lean, risk-based behavioral testing: maintain the smallest test suite that provides meaningful confidence in core application functionality.

## Principles

- Behavior-driven: test what the application does, not how it is implemented.
- Black-box: assert outcomes visible to the user, not internal state or implementation details.
- Risk-based: focus on realistic failures with meaningful consequences, such as lost workout data or incorrect progress statistics.
- Minimal test suites: avoid redundant tests, trivial checks, speculative edge cases, tautological assertions, and coverage targets. Add tests only for meaningful regressions not already adequately covered. It is OK not to add a test after making a change.

## Test selection priority

1. Critical user journeys: essential workflows, such as logging a workout and finding the saved workout in history.
2. Feature-level behavior: consequential interactions, such as editing a saved workout and seeing the changes reflected in history and progress.
3. High-risk business logic: rules where incorrect results would mislead users or damage their data, such as calculating workout statistics or excluding deleted workouts from progress totals.

These examples guide selection; they are not a checklist of tests to add.

## Test level and workflow

- Use E2E tests only. Cover feature behavior and business rules through observable UI outcomes, preferably within existing user journeys rather than separate tests for every rule.
- Do not introduce unit or integration tests without explicit user approval and a concrete risk that E2E cannot adequately or practically verify.
- Create state through UI only; verify through UI using status or read-back. No seeding behind the app, except login.
- Don't write new tests. Instead record candidates in [test proposals](../../../docs/test-proposals.md) and continue implementation.

## Test file comments

- At the top of every test file, maintain one file-level comment that describes each test.
- Give each test a short subheading with its description on the next line.

## Test proposal format

Give each proposal a short descriptive heading and include:

- Behavior: what application behavior would this test protect?
- Regression: what realistic failure would it catch?
- Risk: a consequence score from 1 to 10, with a brief justification. Score impact, not likelihood: 1 means a minor inconvenience; 10 means severe harm, such as unrecoverable loss of workout history.
- Gap: why is existing coverage insufficient? Identify the relevant tests or state that no coverage exists.
- Level: the proposed test level and why it is the simplest effective choice. E2E is the default. Propose integration or unit tests only when necessary, explaining why E2E cannot adequately or practically verify the behavior.

A proposal does not authorize adding new tests or introducing a new test level. Record proposals without asking for approval each time, and wait for explicit user approval before implementing them. Updates to existing tests do not require approval.
