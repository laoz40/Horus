import { existsSync } from "node:fs";

import { defineConfig } from "@playwright/test";

const BASE_URL = "http://localhost:8000";

// The Playwright-cached Chromium build crashes (SIGTRAP) on this machine, so drive the
// system binary instead. CHROMIUM_PATH overrides on machines without /usr/sbin/chromium.
function findChromium(): string {
	const candidates = [process.env.CHROMIUM_PATH, "/usr/sbin/chromium", "/usr/bin/chromium"].filter(
		(candidate): candidate is string => Boolean(candidate),
	);
	const found = candidates.find((candidate) => existsSync(candidate));
	if (!found) throw new Error("No Chromium binary found (set CHROMIUM_PATH)");
	return found;
}

export default defineConfig({
	testDir: "./tests",
	globalSetup: "./tests/global-setup.ts",
	// Keep run artifacts (traces, screenshots, HTML report) inside tests/.
	outputDir: "./tests/test-results",
	reporter: [["list"], ["html", { outputFolder: "tests/playwright-report", open: "never" }]],
	timeout: 30_000,
	// Every test shares the dev Neon DB through the app — keep runs serial.
	workers: 1,
	use: {
		baseURL: BASE_URL,
		// better-auth validates the Origin against SITE_URL, so tests must drive
		// `localhost`, never `127.0.0.1`.
		launchOptions: { executablePath: findChromium() },
		// Mobile-first app: drive at phone width (matches the verify-horus harness).
		viewport: { width: 390, height: 844 },
		storageState: "tests/.auth/user.json",
	},
	webServer: {
		command: "pnpm dev",
		url: BASE_URL,
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
