// Tests in this file:
//
// - dashboard greets a stranger without a name
//   Signed out, visiting / shows the sign-in prompt; dismissing it reveals the
//   generic "Welcome, Legend" heading instead of a personal greeting.
//
// - workout form opens without a sign-in prompt and still requires login to save
//   Dismiss the dashboard prompt and start a workout without a second prompt.
//   The save dialog still requires an account.
//
// - email OTP login lands on /welcome
//   The real login flow: request a code, read the stored OTP, type it in, and land
//   on the dashboard (existing user) or /welcome (fresh user picking a name).
//
// - dashboard greets the e2e user
//   Signed in via the saved session, / shows "Welcome back" with the e2e user's
//   name. Dev may log a 400 on dashboard/yearInTraining: Strict Mode aborts the
//   first heatmap fetch, so the handler can run with no body. Harmless; the
//   remounted query succeeds. This test does not assert on the heatmap.

import { expect, test } from "@playwright/test";

import { readSignInOtp } from "./utils/auth";
import { E2E_EMAIL } from "./utils/db";

const signedOut = { storageState: { cookies: [], origins: [] } };

test.describe("signed out", () => {
	test.use(signedOut);

	test("dashboard greets a stranger without a name", async ({ page }) => {
		await page.goto("/");
		const prompt = page.getByRole("alertdialog", { name: "Not Signed In" });
		await expect(prompt).toBeVisible();
		await expect(prompt.getByRole("link", { name: "Sign in" })).toBeVisible();
		await prompt.getByRole("button", { name: "Let me test" }).click();
		await expect(page.getByRole("heading", { name: "Welcome," })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Legend" })).toBeVisible();
	});

	test("workout form opens without a sign-in prompt and still requires login to save", async ({
		page,
	}) => {
		await page.goto("/");
		await page.getByRole("button", { name: "Let me test" }).click();
		await page.getByRole("link", { name: "Start Workout" }).click();
		await expect(page).toHaveURL(/\/workouts\/new$/);
		await expect(page.getByRole("button", { name: "Chest", exact: true })).toBeVisible();
		await expect(page.getByRole("alertdialog", { name: "Not Signed In" })).toBeHidden();
		await page.getByRole("button", { name: "Finish" }).click();
		const saveDialog = page.getByRole("dialog", { name: "Save Workout" });
		await expect(
			saveDialog.getByText("You need an account to create and save workouts."),
		).toBeVisible();
		await expect(saveDialog.getByRole("link", { name: "Sign in" })).toBeVisible();
		await expect(saveDialog.getByRole("button", { name: "Save", exact: true })).toBeHidden();
	});

	test("email OTP login lands on /welcome", async ({ page }) => {
		await page.goto("/login");

		// Request the OTP (Resend is skipped for @horus.local; we read the stored code).
		await page.getByLabel("Email").fill(E2E_EMAIL);
		await page.getByRole("button", { name: "Send code" }).click();
		await expect(
			page.getByText("Please check your email for the verification code."),
		).toBeVisible();

		const otp = await readSignInOtp(E2E_EMAIL);

		// input-otp auto-submits on the 6th digit; click Verify if that onChange
		// does not fire under Playwright.
		await page.getByRole("textbox", { name: "Email Code" }).pressSequentially(otp, {
			delay: 50,
		});

		if (new URL(page.url()).pathname === "/login") {
			try {
				await page.getByRole("button", { name: "Verify code" }).click({ timeout: 5_000 });
			} catch {
				// Auto-submit already disabled the button or navigated away.
			}
		}

		// Users with a name land on the dashboard; fresh users go to /welcome to pick one.
		await expect(page).toHaveURL(/\/(welcome)?$/, { timeout: 15_000 });
		await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
	});
});

test.describe("signed in", () => {
	// Visiting / starts the Year in Training query. In `pnpm dev`, React Strict
	// Mode aborts that first POST; oRPC then logs BAD_REQUEST (empty body).
	test("dashboard greets the e2e user", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
		await expect(page.getByText("E2E Agent").first()).toBeVisible();
	});
});
