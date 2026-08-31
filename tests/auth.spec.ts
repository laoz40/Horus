// Tests in this file:
//
// - dashboard greets a stranger without a name
//   Signed out, visiting / shows the generic "Welcome, Legend" heading instead of
//   a personal greeting.
//
// - workout form shows the auth gate
//   Signed out, /workouts/new warns that workouts cannot be saved without an
//   account and shows a Sign in link.
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
		await expect(page.getByRole("heading", { name: "Welcome," })).toBeVisible();
		await expect(page.getByRole("heading", { name: "Legend" })).toBeVisible();
	});

	test("workout form shows the auth gate", async ({ page }) => {
		await page.goto("/workouts/new");
		await expect(page.getByText("Your workouts cannot be saved without an account.")).toBeVisible();
		await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
	});

	test("email OTP login lands on /welcome", async ({ page }) => {
		await page.goto("/login");

		// Request the real OTP (Resend delivers it; we read the stored code instead).
		await page.getByLabel("Email").fill(E2E_EMAIL);
		await page.getByRole("button", { name: "Send code" }).click();
		await expect(
			page.getByText("Please check your email for the verification code."),
		).toBeVisible();

		const otp = await readSignInOtp(E2E_EMAIL);

		// Click to focus the code textbox, then type — the form auto-submits once all
		// digits are entered.
		await page.getByRole("textbox", { name: "Email Code" }).click();
		await page.keyboard.type(otp, { delay: 50 });

		// Users with a name land on the dashboard; fresh users go to /welcome to pick one.
		await expect(page).toHaveURL(/\/(welcome)?$/);
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
