import fs from "node:fs";
import path from "node:path";

import { mintStorageState } from "./utils/auth";
import { deleteE2ESessions, deleteE2EWorkouts } from "./utils/db";

const STORAGE_STATE_PATH = path.join(import.meta.dirname, ".auth/user.json");

export default async function globalSetup(): Promise<() => Promise<void>> {
	// Clean slate first, then mint the session cookie the whole run shares. The order
	// matters: deleting e2e data also removes the user's sessions.
	await deleteE2EWorkouts();
	await deleteE2ESessions();
	fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
	fs.writeFileSync(STORAGE_STATE_PATH, await mintStorageState());

	// Wipe workouts even if a test crashes mid-run (sessions stay; the next run re-mints).
	return async () => {
		await deleteE2EWorkouts();
	};
}
