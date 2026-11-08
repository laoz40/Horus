# AGENTS.md

Gym workout tracker to log exercise progress and show workout stats.

Designed primarily for mobile touchscreen devices, usually used as an installed PWA. Prioritise touch interactions and responsiveness on mobile.

### Main goals

- simple, minimal UI
- efficient, fast queries and mutations
- Aim for the most responsiveness possible on the client-side

### Stack

- Next.js 16 project (Your training data is likely outdated for Next)
- Effect V4 (new release) for robust error handling
- pnpm
- default to shadcn for ui, tabler icons

### Preserving long-term maintainability of the codebase

- Push for restructuring the codebase to remove complexity instead of making bandaid fixes or making the fast, easy fix/refactor
  - NO useless wrappers functions, barrel files, factory helpers, duplicated functions
  - Look for opportunities to reframe the change so that whole branches, helpers, modes, conditionals, or layers disappear entirely.
  - Every extraction must own real responsibility. If it only forwards or reconnects code split, undo the split and restructure
  - Prefer deletion when asked to refactor or improve, look for removals before additions.
  - Maintain a flat call hierarchy. Avoid deep call chains. A rich interface that hides substantial work is not a deep call chain. If answering a question requires tracing through more than 3 files or layers, flatten it.
- When adding a new feature, always avoid feature creep and over-engineering
  - Reach for the simplest thing that works
  - Ask the user if there are potential edge cases before you implement fixes for them or build for hypothetical futures.
  - Don't automatically assume backwards compatibility, migrations, or backfills are needed. Check if the feature is actually in the main branch already
  - Verify you don't write low value tests that don't relate to the **core** behaviour of the app
  - Do not to add unecessary fields to the db schema
- Use YAGNI and DRY principles

Writing code is cheap for you, which makes over-engineering easy. Counter it by borrowing a human maintainer's fatigue. Aim for the most result with the least code and complexity. If a human developer would find the code exhausting to maintain, it is a bad solution. Be lazy. Stay simple.

## Behavior

- Ask user before making assumptions that change behavior, UX, architecture
- never use ignore to bypass linter
- Match verification to risk: skip checks for non-functional edits (comments, docs, wording); use relevant checks for small, low-risk code changes (lint, format, typecheck). Run `pnpm verify` after substantive changes and before PRs containing functional changes.

## Code Style Guidelines

### React

- This project uses React Compiler for automatic memoization. Avoid manual `useMemo` and `useCallback` unless there is a specific need.
- Keep React components focused on rendering and user interactions.
- Pass `useReducer`'s typed `dispatch` directly; avoid callback props that only wrap it.
- Prefer `useReducer` for related state and centralized transitions rather than scattering state and business logic across React components.
- Extract data fetching, reusable stateful logic, and external synchronisation into appropriately scoped hooks or modules.
- Prefer derived state and event handlers over effects.
- Only introduce effects when synchronising with external systems, and avoid abstractions that merely hide unnecessary effects.

### TypeScript

- Use discriminated unions for app state. Avoid boolean flags and optional fields that allow invalid combinations.
- Parse boundary data once, allow types to flow through the app.
- Express internal contracts with types instead of untyped dictionaries or redundant runtime checks.

### Tests

- Testing is E2E only, no unit tests, no tautological tests.
- Create state through UI only; verify through UI (status/read-back). No seeding behind the app (except login).

### Comments

- At top of every test file, maintain one file-level comment that describes each test.
  - Format each test with short subheading, description on next line.

### Tailwind

- Avoid arbitrary values: clamp, min(...), custom pixel brackets, and custom breakpoints.
- Use theme-token color utilities (background, foreground, primary, etc.) over standard palette classes (white, gray, black).
- For loading states, show animated spinner icon alongside concise state label e.g. `Saving`, not just trailing ellipsis label e.g. `Saving...`

### Application logic and database operations

- Keep business rules and workflow sequencing in the feature's `.service.ts`; delegate lower-level operations to focused functions.
- Keep queries, batching, and database row conversion in the feature's `.db.ts`.
