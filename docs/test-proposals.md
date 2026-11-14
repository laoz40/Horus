# Test proposals

## Proposals

### Refresh cached progress after workout deletion

- Behavior: After viewing an exercise's recent sets and personal records, delete its workout or delete all workouts, then revisit the exercise using client-side navigation. Progress must reflect the remaining completed sets.
- Regression: Queries with infinite stale time retain deleted sets or records because deletion only refreshes history.
- Risk: 6/10. Incorrect records and recent sets can mislead training decisions, though stored workout data remains correct.
- Gap: `tests/workout-history.spec.ts` checks deletion from history and the database, but does not prime and revisit cached progress. No existing test covers delete-all cache updates.
- Level: E2E, using the real workout form, progress views, and deletion controls in one browser page without a reload.

### Refresh cached workout history after merging exercises

- Behavior: Cache workout details, history PR totals, and exercise progress, merge exercises through settings, then revisit those views. They must show the merged exercise and recalculated records.
- Regression: Exercise merging refreshes the catalog but leaves workout details, history PR totals, or weight progression cached under the old exercise data.
- Risk: 6/10. The app can show incorrect exercise identities and records after a successful merge.
- Gap: The existing E2E suite does not exercise exercise merging or its cross-page cache updates.
- Level: E2E, creating workouts and merging exercises through the UI, with client-side navigation to preserve the primed caches.
