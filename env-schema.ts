import { z } from "zod";

export const serverEnvironmentFields = {
	DATABASE_URL: z.url(),
	SITE_URL: z.url(),
	// Comma-separated extra origins (e.g. the Tailscale serve URL) allowed to call auth endpoints
	EXTRA_TRUSTED_ORIGINS: z.string().optional(),
	RESEND_API_KEY: z.string().min(1),
	RESEND_FROM_EMAIL: z.email(),
	PERSONAL_EMAIL: z.email(),
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	GITHUB_CLIENT_ID: z.string().min(1),
	GITHUB_CLIENT_SECRET: z.string().min(1),
	UPSTASH_REDIS_REST_URL: z.url(),
	UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
};

export const serverEnvironmentSchema = z.object(serverEnvironmentFields);

export const clientEnvironmentSchema = {};
