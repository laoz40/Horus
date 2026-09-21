import { expect, type Page } from "@playwright/test";

export async function selectExercise(page: Page, name: string): Promise<void> {
	// Exercise combobox: type to search, wait for the debounced query, pick the exact
	// option (partial match also hits "Dumbbell Bench Press" etc.).
	const combobox = page.getByRole("combobox", { name: "Exercise name" });
	await combobox.fill(name);
	await page.getByRole("option", { name, exact: true }).click();
	await expect(combobox).toHaveValue(name);
}

async function dismissRestTimer(page: Page): Promise<void> {
	const finishRest = page.getByRole("button", { name: "FINISH REST" });

	try {
		await finishRest.click({ timeout: 5_000 });

		return;
	} catch {
		// Drawer auto-open can lag in headless CI; the side tab still opens it.
		await page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).click();
		await finishRest.click();
	}
}

// Adds one Bench Press exercise with a single logged+completed set on /workouts/new —
// the shared happy-path prefix for the create/edit/history flows.
export async function addCompletedBenchSet(page: Page): Promise<void> {
	await page.goto("/workouts/new");
	await selectExercise(page, "Bench Press");

	const weightInput = page.getByPlaceholder("kg").first();
	const repsInput = page.getByPlaceholder("reps").first();
	const completedCheckbox = page.getByRole("checkbox", { name: "Color success" }).first();

	await weightInput.fill("60");
	await repsInput.fill("8");
	// Blur so RHF has reps/weight before the completion checkbox validates the row.
	await repsInput.blur();

	// Completing a set opens the Rest Timer dialog, which blocks the page until dismissed.
	await expect(async () => {
		await completedCheckbox.click();
		await expect(completedCheckbox).toBeChecked();
	}).toPass({ timeout: 10_000 });

	await dismissRestTimer(page);
}

// Finishes the workout: opens the Save dialog, names it, and waits for the saved
// toast plus the history redirect. Create and update both navigate immediately while
// the mutation finishes in the background.
export async function saveWorkout(page: Page, name: string): Promise<void> {
	await page.getByRole("button", { name: "Finish" }).click();
	await page.getByRole("textbox", { name: "Enter workout name" }).fill(name);
	await page.getByRole("button", { name: "Save" }).click();
	await expect(page.getByText(`Saved ${name}`)).toBeVisible({ timeout: 20_000 });
	await expect(page).toHaveURL(/\/workouts$/, { timeout: 10_000 });
}
