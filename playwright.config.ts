import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

const BASE_URL = "http://localhost:8000";

const isCI = Boolean(process.env.CI);

const serverMode = process.env.HORUS_TEST_SERVER ?? "dev";

const config: PlaywrightTestConfig = {
	testDir: "./tests",
	globalSetup: "./tests/global-setup.ts",
	// Keep run artifacts (traces, screenshots, HTML report) inside tests/.
	outputDir: "./tests/test-results",
	reporter: [["list"]],
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
};

// CI starts the server in the workflow so Playwright is not stuck waiting on webServer
// teardown after all tests pass (Bun/Next.js child processes can outlive SIGKILL on GHA).
if (!isCI) {
	config.reporter = [
		["list"],
		["html", { outputFolder: "tests/playwright-report", open: "never" }],
	];
	config.webServer = {
		command: serverMode === "production" ? "bun run build && bun run start" : "bun run dev",
		url: BASE_URL,
		// Only reuse a server when the caller explicitly identifies it as their dev server.
		reuseExistingServer: serverMode === "attach",
		timeout: serverMode === "production" ? 300_000 : 120_000,
	};
}

export default defineConfig(config);
