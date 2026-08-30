// Tests in this file:
//
// - create and save a workout persists it
//   Fill a completed Bench Press set (60kg × 8), save the workout, then read the
//   database directly to prove the row landed in Neon with the right values — not
//   just that a "Saved" toast appeared.
//
// - submitting without weight and reps stays on the form
//   Add an exercise with no set data and try to save: the URL stays on
//   /workouts/new and no row with that name exists in the DB, so validation
//   truly blocked the write.

import { expect, test } from "@playwright/test";

import { z } from "zod";

import { E2E_USER_ID, sql } from "./utils/db";
import { addCompletedBenchSet, saveWorkout } from "./utils/workout-form";

const WORKOUT_NAME = "E2E Bench Day";

const workoutNameRow = z.object({ name: z.string() });
const completedSetRow = z.object({ weight: z.string(), reps: z.string(), completed: z.boolean() });
const workoutIdRow = z.object({ id: z.string() });

test("create and save a workout persists it", async ({ page }) => {
	await addCompletedBenchSet(page);
	await saveWorkout(page, WORKOUT_NAME);

	await expect(page.getByText(`Saved ${WORKOUT_NAME}`)).toBeVisible();

	// Read-back proof: the save path wrote to Neon, not just showed a toast.
	const [workout] = await sql(workoutNameRow)`
		SELECT name FROM workouts WHERE user_id = ${E2E_USER_ID} ORDER BY created_at DESC LIMIT 1`;
	expect(workout?.name).toBe(WORKOUT_NAME);

	const [set] = await sql(completedSetRow)`
		SELECT ws.weight, ws.reps, ws.completed
		FROM workout_sets ws
		JOIN workout_exercises we ON we.id = ws.workout_exercise_id
		JOIN workouts w ON w.id = we.workout_id
		WHERE w.user_id = ${E2E_USER_ID}
		ORDER BY w.created_at DESC, we.position, ws.position
		LIMIT 1`;
	expect(set).toMatchObject({ weight: "60", reps: "8", completed: true });
});

test("submitting without weight and reps stays on the form", async ({ page }) => {
	await page.goto("/workouts/new");
	await page.getByPlaceholder("Enter an exercise...").fill("Bench Press");
	await page.getByRole("option", { name: "Bench Press", exact: true }).click();

	await page.getByRole("button", { name: "Finish" }).click();
	await page.getByRole("textbox", { name: "Enter workout name" }).fill("E2E Invalid Workout");
	await page.getByRole("button", { name: "Save" }).click();

	// Validation blocks the save: still on the form, nothing persisted.
	await expect(page).toHaveURL(/\/workouts\/new$/);
	const rows = await sql(workoutIdRow)`
		SELECT id FROM workouts WHERE user_id = ${E2E_USER_ID} AND name = 'E2E Invalid Workout'`;
	expect(rows).toHaveLength(0);
});
