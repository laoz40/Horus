// Tests in this file:
//
// - created workout appears in history
//   Create a workout through the UI and confirm it shows up as a card in the
//   history feed.
//
// - edit renames the workout
//   Create a workout, rename it via the Workout options → Edit menu, then poll
//   the DB until the rename is committed (avoids racing an optimistic UI update).
//
// - delete removes the workout from the list and DB
//   Create a workout, delete it via the Workout options menu after the confirm
//   dialog names the right workout, then confirm the card disappears and the row
//   is eventually gone from the DB.

import { expect, test, type Page } from "@playwright/test";

import { z } from "zod";

import { E2E_USER_ID, sql } from "./utils/db";
import { addCompletedBenchSet, saveWorkout } from "./utils/workout-form";

// Unique per run: leftovers from earlier tests (or earlier runs) must never collide
// with what a test asserts on.
const RUN_ID = Date.now().toString(36);

const workoutNameRow = z.object({ name: z.string() });
const workoutIdRow = z.object({ id: z.string() });

// Card titles are h2 headings; assert on those because sonner toasts ("Saved …",
// "Deleted …") contain the workout name too.
function workoutCard(page: Page, name: string) {
	return page.getByRole("heading", { name });
}

// Creates the workout this test will act on through the real UI — no state is set up
// behind the app's back. Waits for the fresh history feed so "first card" is ours:
// the redirect to /workouts races the list refresh and can show a stale feed.
async function createWorkout(page: Page, name: string): Promise<void> {
	await addCompletedBenchSet(page);
	await saveWorkout(page, name);
	await expect(workoutCard(page, name)).toBeVisible({ timeout: 15_000 });
}

test("created workout appears in history", async ({ page }) => {
	const name = `E2E Search ${RUN_ID}`;
	await createWorkout(page, name);
	await expect(workoutCard(page, name)).toBeVisible();
});

test("edit renames the workout", async ({ page }) => {
	const name = `E2E Edit ${RUN_ID}`;
	await createWorkout(page, name);

	await page.getByRole("button", { name: "Workout options" }).first().click();
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await expect(page).toHaveURL(/\/workouts\/.+\/edit$/);

	await saveWorkout(page, `E2E Edited ${RUN_ID}`);
	await expect(workoutCard(page, `E2E Edited ${RUN_ID}`)).toBeVisible();

	// Poll: the read must eventually show the committed rename, not race it.
	await expect
		.poll(async () => {
			const [workout] = await sql(workoutNameRow)`
			SELECT name FROM workouts WHERE user_id = ${E2E_USER_ID} ORDER BY created_at DESC LIMIT 1`;
			return workout?.name;
		})
		.toBe(`E2E Edited ${RUN_ID}`);
});

test("delete removes the workout from the list and DB", async ({ page }) => {
	const name = `E2E Delete ${RUN_ID}`;
	await createWorkout(page, name);

	await page.getByRole("button", { name: "Workout options" }).first().click();
	await page.getByRole("menuitem", { name: "Delete" }).click();

	// Confirm dialog echoes the workout name before the destructive action — this also
	// proves the options button belonged to the workout we just created.
	const dialog = page.getByRole("alertdialog", { name: "Delete workout?" });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByText(name)).toBeVisible();
	await dialog.getByRole("button", { name: "Delete" }).click();

	await expect(workoutCard(page, name)).toBeHidden({ timeout: 10_000 });
	// Poll: the UI may update optimistically before the delete commits in Neon.
	await expect
		.poll(async () => {
			const rows = await sql(workoutIdRow)`
			SELECT id FROM workouts WHERE user_id = ${E2E_USER_ID} AND name = ${name}`;
			return rows.length;
		})
		.toBe(0);
});
