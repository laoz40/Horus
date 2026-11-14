# Test proposals

## Proposals

### Enforce Effect error handling in application code

- Behavior: The lint command rejects native `try/catch`, `try/finally`, and `try/catch/finally` under `src/`, while accepting `Effect.try`, `Effect.tryPromise`, and native statements in tests and tooling outside `src/`. Only direct statements in the two approved browser functions are exempt.
- Regression: A configuration or rule change silently permits native error handling, rejects Effect option properties, or exempts other functions and nested callbacks in the browser exception files.
- Risk: 4/10. Lost enforcement allows inconsistent error handling into application code, but does not itself change stored data or runtime behavior.
- Gap: No coverage exists for the native-try restriction or its file-and-function exceptions.
- Level: Tooling integration, invoking the real lint command on temporary source fixtures. UI E2E cannot observe lint diagnostics or exit status. This non-E2E proposal requires approval before implementation.

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
