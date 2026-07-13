import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { serverEnvironmentSchema } from "./env-schema";

config({ path: ".env.local" });

const environment = serverEnvironmentSchema.parse(process.env);

export default defineConfig({
	dialect: "postgresql",
	schema: "./lib/db/schema/**/*.ts",
	out: "./drizzle",
	dbCredentials: {
		url: environment.DATABASE_URL,
	},
});
