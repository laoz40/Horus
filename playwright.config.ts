import { defineConfig } from "@playwright/test";

const BASE_URL = "http://localhost:8000";

const isCI = Boolean(process.env.CI);

export default defineConfig({
	testDir: "./tests",
	globalSetup: "./tests/global-setup.ts",
	// Keep run artifacts (traces, screenshots, HTML report) inside tests/.
	outputDir: "./tests/test-results",
	reporter: isCI
		? [["list"]]
		: [["list"], ["html", { outputFolder: "tests/playwright-report", open: "never" }]],
	timeout: 60_000,
	// Every test shares the dev Neon DB through the app — keep runs serial.
	workers: 1,
	use: {
		baseURL: BASE_URL,
		// better-auth validates the Origin against SITE_URL, so tests must drive
		// `localhost`, never `127.0.0.1`.
		// Mobile-first app: drive at phone width (matches the verify-horus harness).
		viewport: { width: 390, height: 844 },
		storageState: "tests/.auth/user.json",
	},
	// CI starts the server in the workflow so Playwright is not stuck waiting on webServer
	// teardown after all tests pass (pnpm/next child processes can outlive SIGKILL on GHA).
	...(isCI
		? {}
		: {
				webServer: {
					command: "pnpm dev",
					url: BASE_URL,
					reuseExistingServer: true,
					timeout: 120_000,
				},
			}),
});
