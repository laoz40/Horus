import { expect, type Page } from "@playwright/test";

export async function selectExercise(page: Page, name: string): Promise<void> {
	// Exercise combobox: type to search, wait for the debounced query, pick the exact
	// option (partial match also hits "Dumbbell Bench Press" etc.).
	const combobox = page.getByRole("combobox", { name: "Exercise name" });
	await combobox.fill(name);

	const option = page.getByRole("option", { name, exact: true });
	await expect(option).toBeVisible({ timeout: 10_000 });
	await option.click();

	await expect(page.getByPlaceholder("kg")).toBeVisible({ timeout: 10_000 });
}

async function dismissRestTimer(page: Page): Promise<void> {
	const finishRest = page.getByRole("button", { name: "FINISH REST" });
	const timerTab = page.getByRole("button", { name: /^\d{2}:\d{2}$/ });

	await expect(finishRest.or(timerTab)).toBeVisible({ timeout: 15_000 });

	if (await finishRest.isVisible()) {
		await finishRest.click();

		return;
	}

	// Drawer auto-open can lag in headless CI; the side tab still opens it.
	await timerTab.click();
	await finishRest.click();
}

// Adds one Bench Press exercise with a single logged+completed set on /workouts/new —
// the shared happy-path prefix for the create/edit/history flows.
export async function addCompletedBenchSet(page: Page): Promise<void> {
	await page.goto("/workouts/new");
	await selectExercise(page, "Bench Press");

	const weightInput = page.getByPlaceholder("kg");
	const repsInput = page.getByPlaceholder("reps");

	await weightInput.fill("60");
	await repsInput.fill("8");
	await repsInput.press("Tab");

	// Completing a set opens the Rest Timer dialog, which blocks the page until dismissed.
	await page.getByRole("checkbox", { name: "Color success" }).click();
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
