import "server-only";

import { Redis } from "@upstash/redis";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { z } from "zod";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { env } from "@/env";
import { shortHash } from "@/lib/shortHash";

const resend = new Resend(env.RESEND_API_KEY);
const resendFromEmail = env.RESEND_FROM_EMAIL;
const personalEmail = env.PERSONAL_EMAIL;
const googleClientId = env.GOOGLE_CLIENT_ID;
const googleClientSecret = env.GOOGLE_CLIENT_SECRET;
const githubClientId = env.GITHUB_CLIENT_ID;
const githubClientSecret = env.GITHUB_CLIENT_SECRET;

const redis = new Redis({
	url: env.UPSTASH_REDIS_REST_URL,
	token: env.UPSTASH_REDIS_REST_TOKEN,
});

const otpExpiresInSeconds = 300;

// Upstash auto-parses stored JSON on read, so a "string" may come back as an already-decoded
// object. Strings pass through untouched; anything else is re-stringified for better-auth.
const redisSessionValueSchema = z.union([
	z.string(),
	z.unknown().transform((value) => JSON.stringify(value)),
]);

// Origins beyond SITE_URL that may call auth endpoints (e.g. Tailscale serve URL for phone access)
const extraTrustedOrigins =
	env.EXTRA_TRUSTED_ORIGINS?.split(",").map((origin) => origin.trim()) ?? [];

export const auth = betterAuth({
	baseURL: env.SITE_URL,
	trustedOrigins: extraTrustedOrigins,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
		usePlural: true,
	}),
	secondaryStorage: {
		get: async (key) => {
			const value = await redis.get(key);
			if (value === null) return null;
			return redisSessionValueSchema.parse(value);
		},
		getAndDelete: async (key) => {
			const value = await redis.getdel(key);
			if (value === null) return null;
			return redisSessionValueSchema.parse(value);
		},
		set: async (key, value, ttl) => {
			if (ttl) {
				await redis.set(key, value, { ex: ttl });
			} else {
				await redis.set(key, value);
			}
		},
		delete: async (key) => {
			await redis.del(key);
		},
		increment: async (key: string, ttl?: number) => {
			const count = await redis.incr(key);
			if (count === 1 && ttl) {
				await redis.expire(key, ttl);
			}
			return count;
		},
	},
	rateLimit: {
		enabled: true,
	},
	session: {
		storeSessionInDatabase: true,
		expiresIn: 60 * 60 * 24 * 14,
		updateAge: 60 * 60 * 24 * 7,
	},
	emailAndPassword: {
		enabled: false,
	},
	account: {
		accountLinking: {
			enabled: true,
		},
	},
	socialProviders: {
		google: {
			clientId: googleClientId,
			clientSecret: googleClientSecret,
		},
		github: {
			clientId: githubClientId,
			clientSecret: githubClientSecret,
		},
	},
	user: {
		deleteUser: {
			enabled: true,
		},
	},
	plugins: [
		emailOTP({
			expiresIn: otpExpiresInSeconds,
			async sendVerificationOTP({ email, otp, type }) {
				if (type !== "sign-in") {
					throw new Error(`Unsupported OTP type: ${type}`);
				}

				const normalizedEmail = email.trim().toLowerCase();
				// E2E uses a non-deliverable @horus.local address and reads the OTP from Redis.
				if (normalizedEmail.endsWith("@horus.local")) {
					return;
				}

				const timeBucket = Math.floor(Date.now() / 30000);
				const emailKey = shortHash(normalizedEmail);
				const expiresInMinutes = Math.floor(otpExpiresInSeconds / 60);

				const { error } = await resend.emails.send(
					{
						from: `Horus <${resendFromEmail}>`,
						to: normalizedEmail,
						subject: "Your Horus sign-in code",
						text: `Your Horus sign-in code:\n\n${otp}\n\nThis code expires in ${expiresInMinutes} minutes.\n\nThank you for using my app! Would love to hear any feedback, ideas or questions. You can reach me at ${personalEmail}. Enjoy your workout!`,
						html: `<p>Your Horus sign-in code:</p>
							<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:20px 0">${otp}</p>
							<p>This code expires in ${expiresInMinutes} minutes.</p>
							<p>Thank you for using my app! Would love to hear any feedback, ideas or questions. You can reach me at <a href="mailto:${personalEmail}">${personalEmail}</a>. Enjoy your workout!</p>`,
					},
					{
						idempotencyKey: `otp-sign-in/${emailKey}/${shortHash(otp)}/${timeBucket}`,
					},
				);

				if (error) {
					throw new Error(`Failed to send OTP email: ${error.message}`);
				}
			},
		}),
	],
});
