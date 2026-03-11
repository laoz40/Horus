import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { Redis } from "@upstash/redis";
import authConfig from "./auth.config";
import { shortHash } from "../lib/shortHash";

const siteUrl = process.env.SITE_URL!;
const resend = new Resend(process.env.RESEND_API_KEY);
const resendFromEmail = process.env.RESEND_FROM_EMAIL!;
const personalEmail = process.env.PERSONAL_EMAIL!;
const redis = Redis.fromEnv();

const keyPrefix = "better-auth:";
const prefixKey = (key: string) => `${keyPrefix}${key}`;

const expiresIn = 300;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	const secondaryStorage = {
		get: async (key: string) => {
			return await redis.get<string>(prefixKey(key));
		},
		set: async (key: string, value: string, ttl?: number) => {
			const prefixedKey = prefixKey(key);
			if (ttl !== undefined && ttl > 0) {
				await redis.set(prefixedKey, value, { ex: ttl });
				return;
			}

			await redis.set(prefixedKey, value);
		},
		delete: async (key: string) => {
			await redis.del(prefixKey(key));
		},
	};

	return betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		secondaryStorage,
		session: {
			storeSessionInDatabase: true,
			expiresIn: 60 * 60 * 24 * 14,
			updateAge: 60 * 60 * 24 * 7,
		},
		rateLimit: {
			enabled: true,
			storage: "secondary-storage",
			window: 60,
			max: 100,
		},
		emailAndPassword: {
			enabled: false,
		},
		// The Convex plugin is required for Convex compatibility
		plugins: [
			convex({ authConfig }),
			emailOTP({
				expiresIn,
				async sendVerificationOTP({ email, otp, type }) {
					if (type !== "sign-in") {
						throw new Error(`Unsupported OTP type: ${type}`);
					}

					// Calculates value that remains the same for 30sec
					const bucket = Math.floor(Date.now() / 30000);
					// Creates a unique key for the email
					const emailKey = shortHash(email.trim().toLowerCase());

					const { error } = await resend.emails.send(
						{
							from: `Horus <${resendFromEmail}>`,
							to: email,
							subject: "Your Horus sign-in code",
							text: `Your Horus sign-in code:\n\n${otp}\n\nThis code expires in ${Math.floor(expiresIn / 60)} minutes.\n\nThank you for using my app! Would love to hear any feedback, ideas or questions. You can reach me at ${personalEmail}. Enjoy your workout!`,
							html: `<p>Your Horus sign-in code:</p>
								<p style="
									font-size:32px;
									font-weight:700;
									letter-spacing:6px;
									margin:20px 0;
								">
									${otp}
								</p>
								<p>This code expires in ${Math.floor(expiresIn / 60)} minutes.</p>
								<p>Thank you for using my app! Would love to hear any feedback, ideas or questions. You can reach me at <a href="mailto:${personalEmail}">${personalEmail}</a>. Enjoy your workout!</p>`,
						},
						{
							idempotencyKey: `otp-sign-in/${emailKey}/${bucket}`,
						},
					);

					if (error) {
						throw new Error(`Failed to send OTP email: ${error.message}`);
					}
				},
			}),
		],
	});
};

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return (await authComponent.safeGetAuthUser(ctx)) ?? null;
	},
});
