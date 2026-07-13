import { z } from "zod";

export const serverEnvironmentSchema = z.object({
	DATABASE_URL: z.url(),
	SITE_URL: z.url(),
	RESEND_API_KEY: z.string().min(1),
	RESEND_FROM_EMAIL: z.email(),
	PERSONAL_EMAIL: z.email(),
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	FACEBOOK_CLIENT_ID: z.string().min(1),
	FACEBOOK_CLIENT_SECRET: z.string().min(1),
	GITHUB_CLIENT_ID: z.string().min(1),
	GITHUB_CLIENT_SECRET: z.string().min(1),
});

export const clientEnvironmentSchema = {
	NEXT_PUBLIC_CONVEX_URL: z.url(),
};
