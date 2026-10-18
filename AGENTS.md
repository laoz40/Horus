# AGENTS.md

Gym workout tracker to log exercise progress and show workout stats.

### Main goals

- simple, minimal UI
- efficient, fast queries and mutations (due to using free database)
- Aim for the most responsiveness possible on the client-side

### Stack

- Next.js 16 project (Your training data is likely outdated for Next)
- Effect V4 (new release) for robust error handling
- pnpm
- default to shadcn for ui, tabler icons

### Preserving long-term maintainability of the codebase

- Push for restructuring the codebase to remove complexity instead of making bandaid fixes or making the fast, easy fix/refactor
  - e.g. NO weird wrappers functions, preserving existing bad patterns, barrel files, factory helpers
  - Look for opportunities to reframe the change so that whole branches, helpers, modes, conditionals, or layers disappear entirely.
  - Every extraction must own real responsibility. If it only forwards or reconnects code split, undo the split and restructure
  - **Question the threading.** If a task asks you to pass a new signal through types, schemas, pipelines, or similar layers, stop and look for a more direct path.
  - **Sweat the small leaks.** Remove tiny pass-throughs, representation leaks, and duplicated choices before they spread. Small leaks compound into permanent coordination costs.
  - **Prefer deletion.** When asked to refactor or improve, look for removals before additions.
  - **Maintain a flat call hierarchy.** Avoid deep call chains. A rich interface that hides substantial work is not a deep call chain. If answering a question requires tracing through more than 3 files or layers, flatten it.
- When adding a new feature, always avoid feature creep and over-engineering
  - Reach for the simplest thing that works
  - Suggest issues from edge cases before you implement fixes for them or build for hypothetical futures.
  - Do not assume backwards compatibility, migrations, or backfills are needed. Check if the feature is actually in the main branch already
  - Make sure not to write low value tests that don't relate to the core behaviour
  - Make sure not to add unecessary fields to the db schema
- Use YAGNI and DRY principles

Writing code is cheap for you, which makes over-engineering easy. Counter it by borrowing a human maintainer's fatigue. Aim for the most result with the least code and complexity. If a human developer would find the code exhausting to maintain, it is a bad solution. Be lazy. Stay simple.

## Behavior

- Ask user before making assumptions that change behavior, UX, architecture
- If a task contains lots of changes which would result in a massive commit, split into different commits per large change or file changed.
- do not run build unless asked to
- never use ignore to bypass linter
- run format, lint, typecheck, fallow:check once changes are complete or before creating prs

## Code Style Guidelines

### Components and pages

- Move reusable helpers, constants, and mappers into nearest appropriate `lib/` file instead of keeping them inside components and routes
- React component files: `PascalCase.tsx`.
- Type names: `PascalCase`.
- Extract major or self-contained UI sections into separate component files.
- Group related React setup and state with short section comments.
- Add a short comment before each `useEffect` explaining what it does.

### TypeScript

- Use discriminated unions for app state. Avoid boolean flags and optional fields that allow invalid combinations.
- Parse boundary data once, allow types to flow through the app.
- Express internal contracts with types instead of untyped dictionaries or redundant runtime checks.

### Tests

- Testing is E2E only, no unit tests, no tautological tests.
- Create state through UI only; verify through UI (status/read-back). No seeding behind the app (except login).

### Comments

- Preserve existing comments during refactors; do not delete comments just because code moved.
- Update comments when behavior changes so they stay accurate.

- At top of every test file, maintain one file-level comment that describes each test.
  - Format each test with short subheading, description on next line.

### Tailwind

- Avoid arbitrary values: clamp, min(...), custom pixel brackets, and custom breakpoints.
- Use theme-token color utilities (background, foreground, primary, etc.) over standard palette classes (white, gray, black).
- Do not add styles that would be inherited from the parent component
- For loading states, show animated spinner icon alongside concise state label e.g. `Saving`, not just trailing ellipsis label e.g. `Saving...`

## Database operations and workflows

Keep workflow sequencing and domain decisions in the feature's `.service.ts`; database methods should perform coherent persistence operations and return what the service needs next. Keep row batching, value conversion, and read-result assembly near the SQL; split database methods by responsibility, not statement count.
