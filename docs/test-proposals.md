# Test proposals

## Proposals

### Browser startup registers the notification worker

- Behavior: A full page load registers `/sw.js` after loading completes. Client navigation does not register it again, and unsupported browsers still load the app.
- Regression: Moving registration out of React leaves the startup file undiscovered, runs registration too early, or registers on every navigation.
- Risk: 4/10. Rest notifications can stop working on mobile while the rest timer remains visible.
- Gap: Existing browser tests do not assert service worker registration or its timing.
- Level: E2E, observing the browser registration API during a full load and client navigation, and checking the active worker.

### Rest reminders stop with the timer and workout form

- Behavior: Completing a set starts the rest timer. Dismissing its drawer preserves the timer; it reopens after two minutes and every 30 seconds afterward. Stopping it or leaving the form prevents further reminders. A new workout starts fresh.
- Regression: A shared clock stops updating one consumer, duplicate subscriptions create repeated reminders, or reminder scheduling survives form removal.
- Risk: 4/10. Incorrect rest timing disrupts a workout and can produce unwanted reminders, but does not change saved sets.
- Gap: Existing create-workout coverage starts and stops a timer but does not advance through reminder deadlines or discard a running timer.
- Level: E2E through set completion and navigation, using the browser clock to advance time and asserting drawer state and displayed elapsed time.

### Online searches cancel when their picker stops observing

- Behavior: Online search starts only on Search Online. Changing the query, closing the picker, or leaving the form cancels its in-flight request without an error toast or stale suggestions. Reopening permits another search.
- Regression: Query observer lifetime no longer matches the picker, cancelled requests display failure toasts, or typed input starts online searches automatically.
- Risk: 4/10. Users can see misleading results or unnecessary external requests, but entered sets remain available.
- Gap: Existing workout journeys select local exercises and do not cover online request cancellation.
- Level: E2E through the exercise picker with delayed online responses and observed browser request cancellation.

### Saved profile follows verified session changes

- Behavior: A successful session check saves the display profile; a network failure preserves it; an expired session or sign-out clears it. The saved greeting appears during client navigation while the session is loading.
- Regression: Cookie synchronization clears the cached profile on transient errors, keeps it after session expiry, or stops running after removal of the React sync component.
- Risk: 3/10. Users can see a missing or stale greeting, but the display cookie cannot authorize requests.
- Gap: `tests/auth.spec.ts` checks login and greetings, but does not cover the profile cookie across session failures or delayed client navigation.
- Level: E2E, using real sign-in and sign-out with controlled session failures and delays, and checking the resulting cookie and visible greeting.

### History restores its scroll position after navigation

- Behavior: Scroll history, open a workout, then return through client navigation. The list restores its previous position once the cards are ready.
- Regression: Ref attachment restores before cards exist, fails to register the scroll listener, or resets the position on unrelated renders.
- Risk: 3/10. Users lose their place when browsing workout history.
- Gap: `tests/workout-history.spec.ts` covers creating, renaming, and deleting workouts, but does not assert scroll restoration.
- Level: E2E, creating enough workouts through the UI to scroll and checking the restored list position after returning from a workout.

### Workout edits preserve unaffected personal records

- Behavior: Rename a saved workout, edit notes or difficulty, and change sets for one of its exercises. Existing badges for other exercises remain intact, while changed weights, reps, completion, additions, removals, and same-exercise set ordering update that exercise's records in the edited and later workouts. Removing an exercise also updates the edited workout's PR total.
- Regression: Replacement writes erase badges for exercises excluded from recalculation, selective recalculation misses changed sets, or removing an exercise leaves a stale PR total.
- Risk: 7/10. Incorrect personal records and workout totals misrepresent saved training progress.
- Gap: `tests/workout-history.spec.ts` covers renaming but not set edits or preservation and recalculation of records across workouts.
- Level: E2E, extending the saved-workout editing journey with multiple exercises and checking badges and totals through workout history and details.

### Online exercise search survives upstream failures

- Behavior: When Wger is unreachable, times out during headers or body reading, rate-limits requests, or sends an invalid response, online exercise search shows its existing error toast and leaves local suggestions usable. A later successful search still adds online suggestions.
- Regression: An upstream failure escapes the Effect error channel, returns an empty or unstructured server error, or causes a client JSON parsing rejection instead of the expected toast.
- Risk: 4/10. Users cannot discover online exercises, but existing exercises and workout data remain available.
- Gap: The existing workout journeys select local exercises and do not cover online search failures or recovery.
- Level: E2E with controlled Wger responses at the server's external HTTP boundary, exercising the real RPC serialization and picker. Browser-only RPC interception would miss the server transport failure.

### Deleted sets stay deleted when editing and adding rows

- Behavior: Edit a saved workout with distinct sets, delete a middle or final set, and add rows. New rows stay blank, surviving rows keep their values and completion state, and saving persists only the intended sets. Deleting the only row leaves a fresh blank row. Adding rows with incomplete inputs does not run save validation. Ticking a set rejects invalid entries; the top-right Finish tick opens the save dialog only for a valid workout, and Save validates again.
- Regression: Reused array indices restore deleted numeric defaults, field identities move values to the wrong row, or Add Set triggers premature validation.
- Risk: 7/10. Resurrected sets can silently corrupt workout history and progress statistics.
- Gap: `tests/workout-history.spec.ts` only renames workouts when editing; `tests/create-workout.spec.ts` does not delete and re-add sets or exercise completion validation.
- Level: E2E, extending the saved-workout editing journey through the real form and checking saved history.

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

### Failed workout creation preserves the form for retry

- Behavior: While creating a workout, a pending save keeps the form mounted. A failed save keeps the exercise, set values, completion flags, and workout name. Retrying succeeds and only then navigates to history.
- Regression: Navigation unmounts the form before success, a failed save clears entered values, or retry writes a duplicate workout.
- Risk: 8/10. Losing a completed workout before persistence forces the user to reconstruct their session.
- Gap: `tests/create-workout.spec.ts` covers successful creation and validation, but not delayed or failed requests and retry.
- Level: E2E, extending the create journey with a controlled failed create response followed by a real successful retry.

### Exercise merge confirmation survives a failed request

- Behavior: A duplicate exercise name opens merge confirmation. Cancelling returns to editing; a failed combine keeps confirmation open and enables retry. A successful retry closes the editor and combines the exercises once.
- Regression: Mutation settlement overwrites confirmation state, hides a failed merge, or leaves the action disabled.
- Risk: 6/10. Users can lose their pending edits or misunderstand whether exercise history was combined.
- Gap: Existing E2E tests cover workouts and authentication, but no exercise catalog collision or merge retry journey.
- Level: E2E, creating exercises through settings and intercepting one merge request before a real successful retry.

### Notification preference displays correctly after reload

- Behavior: Enabling notifications persists the preference and displays the switch as enabled after a full reload.
- Regression: Server-rendered switch attributes remain disabled even though browser storage and client state say enabled.
- Risk: 3/10. Users can misunderstand whether rest reminders are enabled.
- Gap: No notification settings coverage exists. Manual verification reproduced the reload mismatch with both the original reducer and the local-action refactor.
- Level: E2E, granting browser notification permission, enabling through settings, reloading, and asserting the visible switch state.

### Reopening an exercise editor while a request finishes

- Behavior: Close an editor during a pending save, open a fresh editor, and enter a new draft. The earlier request can refresh the catalog but must not close or change the new draft. Reopening after an ordinary close starts with fresh values.
- Regression: A delayed success closes the new editor, or a delayed failure replaces its operation state or merge confirmation.
- Risk: 6/10. A completion from an earlier edit can discard a user's new draft or show a collision for the wrong exercise.
- Gap: Existing E2E tests cover workouts and authentication, but do not cover the exercise editor's close/reopen lifecycle or delayed request completion.
- Level: E2E, using the exercise catalog UI and delaying a save response before reopening the editor.
