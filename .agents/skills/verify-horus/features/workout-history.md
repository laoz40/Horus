# Workout history

`/workouts` is a feed of past workouts (7 per page) with cards showing name, date, and set stats, a search bar filtering by workout name, per-card options (Edit, Share, Delete), and pagination.

## Sub-features

- `list` — cards render for the user's workouts, newest first.
- `search` — the search bar filters cards by name (client/server filtered feed).
- `edit` — card options → "Edit" opens `/workouts/<id>/edit`; saving there updates the row.
- `delete` — card options → "Delete" asks "Delete workout?"; confirming removes the card and the row.
- `share` — "Share" menu item (may be a stub — verify whatever it does and report).
- `pagination` — with more than 7 workouts, HistoryPagination offers more pages.

## How to get to it (user POV)

- Navbar ("Main navigation") → "History" → `/workouts`.

## Driving it with drive.mjs

Preconditions: doctor authenticated; ideally one workout exists (run `create-workout.md` first).

- **List:** `flow --out history --steps '[{"goto":"/workouts"},{"expectText":"Search by workout name"},{"snapshot":true},{"screenshot":"01-history.png"}]'` → cards visible; snapshot names the card structure.
- **Search:** same, then `{"fill":{"placeholder":"Search by workout name","value":"Verify Run Workout"}},{"wait":600},{"expectText":"Verify Run Workout"}` → only matching cards remain; also test a garbage term and the empty state.
- **Edit:** `{"click":{"aria"?}}` — click `{"role":"button","name":"Workout options"}` (aria-label) on a card, then `{"click":{"role":"menuitem","name":"Edit"}}`, `{"expectUrl":"/edit"}` → edit form loads; change something and Finish/Save as in `create-workout.md`, then verify the updated value in history and DB.
- **Delete:** options → `{"click":{"role":"menuitem","name":"Delete"}}` → dialog titled "Delete workout?" with description "This will permanently delete workout: <name>" → confirm → card disappears; DB query for that id returns `[]`.
- **Pagination:** only meaningful with 8+ workouts; drive HistoryPagination controls from the snapshot.

## Gotchas

- Deleting is destructive and global per workout — only delete workouts you created as the verify user (check the card name before confirming; the dialog description echoes the name).
- "Workout options" matches every card; scope clicks by picking `.first()` behavior of the harness or target a card found via search first.
- The feed renders through an error boundary with a skeleton; `expectText` polling handles the load delay.
- The search bar's empty results state differs from the loading skeleton — capture a snapshot for whichever you claim.
