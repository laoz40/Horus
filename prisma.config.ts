import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

function datasourceUrl(): string {
	const unpooled = process.env.DATABASE_URL_UNPOOLED;
	if (unpooled) {
		return unpooled;
	}

	const pooled = process.env.DATABASE_URL;
	if (pooled) {
		return pooled.replace("-pooler", "");
	}

	// generate does not connect; migrate/deploy must set a real URL
	return "postgresql://ci:ci@127.0.0.1:5432/postgres";
}

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: datasourceUrl(),
	},
});
