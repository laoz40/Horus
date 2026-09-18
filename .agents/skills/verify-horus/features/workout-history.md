# Workout history

`/workouts` is a feed of past workouts (7 per page, infinite scroll) with cards showing name, date, muscle-group badges, and set stats, a search bar (UI only — not wired yet), per-card options (Edit, Share, Delete), and a scroll sentinel that loads more pages.

## Sub-features

- `list` — cards render for the user's workouts, newest first.
- `search-ui` — search input with placeholder "Search by workout name" is visible but does not filter the feed yet.
- `edit` — card options → "Edit" opens `/workouts/<id>/edit`; saving there updates the row.
- `delete` — card options → "Delete" asks "Delete workout?"; confirming removes the card and the row.
- `share` — "Share" menu item is a stub with no action.
- `infinite-scroll` — with more than 7 workouts, scrolling near the bottom loads the next page via `HistoryPagination` sentinel (no prev/next buttons).

## How to get to it (user POV)

- Navbar ("Main navigation") → "History" → `/workouts`.

## Driving it with drive.mjs

Preconditions: doctor authenticated; ideally one workout exists (run `create-workout.md` first).

- **List:** `flow --out history --steps '[{"goto":"/workouts"},{"expectText":"Verify Run Workout"},{"screenshot":"01-history.png"},{"snapshot":true}]'` → workout card visible. Do not assert placeholder text with `expectText` (placeholders are not in the DOM as text).
- **Delete:** `{"goto":"/workouts"},{"expectText":"Verify Run Workout"},{"click":{"role":"button","name":"Workout options"}},{"click":{"role":"menuitem","name":"Delete"}},{"expectText":"Delete workout?"},{"click":{"name":"Delete"}}` → toast "Deleted …" (fires only after the server succeeds). Note the workout `id` before delete, then `db-query.mjs --sql "SELECT id FROM workouts WHERE id = '<id>'"` → `[]`. Use `click` for the options menu (`aria-label="Workout options"`), not `expectText`.
- **Edit:** options → `{"click":{"role":"menuitem","name":"Edit"}}`, `{"expectUrl":"/edit"}` → edit form loads; change something and Finish/Save as in `create-workout.md`, then verify the updated value in history and DB.
- **Infinite scroll:** only meaningful with 8+ workouts; scroll the feed until the sentinel loads more cards (check snapshot for additional card names).

## Gotchas

- Search does not filter yet — do not claim search behavior as verified.
- Deleting is destructive — only delete workouts you created as the verify user (the dialog description echoes the name).
- "Workout options" is an `aria-label`, not visible text — drive it with `click`.
- The feed renders through an error boundary with a skeleton; `expectText` polling handles the load delay.
- Card hide is client-side (`historyUiStore`); the toast still means the mutation succeeded. Re-running `create-workout.md` without cleanup can leave duplicate names — `count(*)` alone is ambiguous; always confirm delete by the specific `id` you targeted.
