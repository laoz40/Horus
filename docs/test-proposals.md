# Test proposals

## Proposals

### Online exercise search survives upstream failures

- Behavior: When Wger is unreachable, times out during headers or body reading, rate-limits requests, or sends an invalid response, online exercise search shows its existing error toast and leaves local suggestions usable. A later successful search still adds online suggestions.
- Regression: An upstream failure escapes the Effect error channel, returns an empty or unstructured server error, or causes a client JSON parsing rejection instead of the expected toast.
- Risk: 4/10. Users cannot discover online exercises, but existing exercises and workout data remain available.
- Gap: The existing workout journeys select local exercises and do not cover online search failures or recovery.
- Level: E2E with controlled Wger responses at the server's external HTTP boundary, exercising the real RPC serialization and picker. Browser-only RPC interception would miss the server transport failure.

### Local verification refuses stale servers

- Behavior: Local tests refuse an occupied app port unless the caller explicitly selects dev attachment. Fresh-production verification builds current source, starts its own server, and cleans it up after success or failure without stopping another owner's server.
- Regression: Silent reuse of an old production build produces misleading verification results, or cleanup kills a user-owned server.
- Risk: 5/10. Misleading verification can hide application regressions; incorrect cleanup interrupts local work.
- Gap: Existing Playwright journeys exercise application behavior, not the verification process lifecycle.
- Level: Tooling integration with controlled listeners and child processes. UI E2E cannot verify its own launch and teardown reliably. Requires approval before implementation.

### Session-local SQL preflight rejects pooled connections

- Behavior: The SQL preflight rejects missing or pooled direct-connection configuration without printing credentials, and checks temporary-table continuity on one direct connection. Ordinary read-only probes keep using their normal connection.
- Regression: Experiments use a pooled or stateless transport and lose session-local tables between statements, or connection errors expose credentials.
- Risk: 4/10. Invalid measurements can misdirect database changes; leaked credentials can expose development data.
- Gap: No coverage exists for the SQL helper's connection preflight or sanitized failure output.
- Level: Tooling integration invoking the helper with controlled configuration and a disposable database session. UI E2E cannot observe SQL transport affinity or CLI error output. Requires approval before implementation.

### Enforce Effect error handling in application code

- Behavior: The lint command rejects native `try/catch`, `try/finally`, and `try/catch/finally` under `src/`, while accepting `Effect.try`, `Effect.tryPromise`, and native statements in tests and tooling outside `src/`. Only direct statements in the two approved browser functions are exempt.
- Regression: A configuration or rule change silently permits native error handling, rejects Effect option properties, or exempts other functions and nested callbacks in the browser exception files.
- Risk: 4/10. Lost enforcement allows inconsistent error handling into application code, but does not itself change stored data or runtime behavior.
- Gap: No coverage exists for the native-try restriction or its file-and-function exceptions.
- Level: Tooling integration, invoking the real lint command on temporary source fixtures. UI E2E cannot observe lint diagnostics or exit status. This non-E2E proposal requires approval before implementation.

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

### Failed sign-out keeps the current session and page

- Behavior: If sign-out fails, show an error toast, leave the user on the current page, and re-enable the sign-out button. A successful retry clears dashboard data and returns home.
- Regression: Success-only navigation or cache cleanup runs after a failed sign-out, or the button remains disabled.
- Risk: 7/10. Users may believe they signed out while their session remains active.
- Gap: `tests/auth.spec.ts` does not cover sign-out failures or retrying sign-out.
- Level: E2E, intercepting the sign-out response to simulate a server failure without disrupting the real auth service.

### Stream the training graph before client authentication finishes

- Behavior: A signed-in user sees the current year's graph while the browser's session request is delayed. Hydration does not repeat the initial graph requests, and the year picker still fetches the selected year. Signed-out visitors see an empty graph without private data.
- Regression: Moving the graph behind client authentication again, mismatched hydration query keys, or rendering another user's cached graph.
- Risk: 7/10. A regression can expose private workout counts or restore a multi-second dashboard delay.
- Gap: `tests/auth.spec.ts` checks greetings and sign-in prompts, but does not assert graph contents, request sequencing, or year selection.
- Level: E2E, using the existing authenticated and signed-out browser flows with delayed client session responses.

### Refresh training counts after workout mutations

- Behavior: Visit the dashboard, create or edit a workout, then return within the query freshness window. The graph reflects the saved completed sets. Deleting a workout or all workouts also updates the counts and available years.
- Regression: The hydrated query cache or a cached server navigation restores counts from before the mutation.
- Risk: 6/10. Users see incorrect training totals after successfully saving or deleting workouts.
- Gap: `tests/create-workout.spec.ts` and `tests/workout-history.spec.ts` cover persistence and history, but do not revisit and assert the dashboard graph.
- Level: E2E, extending the existing create, edit, and delete journeys.
