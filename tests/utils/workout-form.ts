import { expect, type Page } from "@playwright/test";

// Adds one Bench Press exercise with a single logged+completed set on /workouts/new —
// the shared happy-path prefix for the create/edit/history flows.
export async function addCompletedBenchSet(page: Page): Promise<void> {
	await page.goto("/workouts/new");

	// Exercise combobox: type to search, wait for the debounced query, pick the exact
	// option (partial match also hits "Dumbbell Bench Press" etc.).
	await page.getByPlaceholder("Enter an exercise...").fill("Bench Press");
	await page.getByRole("option", { name: "Bench Press", exact: true }).click();

	await page.getByPlaceholder("kg").first().fill("60");
	await page.getByPlaceholder("reps").first().fill("8");

	// Completing a set opens the Rest Timer dialog, which blocks the page until dismissed.
	await page.getByRole("checkbox", { name: "Color success" }).first().click();
	await page.getByRole("button", { name: "FINISH REST" }).click();
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
