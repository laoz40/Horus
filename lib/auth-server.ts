import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { env } from "@/env";
import { shortHash } from "@/lib/shortHash";

const resend = new Resend(env.RESEND_API_KEY);
const resendFromEmail = env.RESEND_FROM_EMAIL;
const personalEmail = env.PERSONAL_EMAIL;
const googleClientId = env.GOOGLE_CLIENT_ID;
const googleClientSecret = env.GOOGLE_CLIENT_SECRET;
const facebookClientId = env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = env.FACEBOOK_CLIENT_SECRET;
const githubClientId = env.GITHUB_CLIENT_ID;
const githubClientSecret = env.GITHUB_CLIENT_SECRET;

const otpExpiresInSeconds = 300;

export const auth = betterAuth({
	baseURL: env.SITE_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
		usePlural: true,
	}),
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
			trustedProviders: ["facebook"],
		},
	},
	socialProviders: {
		google: {
			clientId: googleClientId,
			clientSecret: googleClientSecret,
		},
		facebook: {
			clientId: facebookClientId,
			clientSecret: facebookClientSecret,
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

				const timeBucket = Math.floor(Date.now() / 30000);
				const normalizedEmail = email.trim().toLowerCase();
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
						idempotencyKey: `otp-sign-in/${emailKey}/${timeBucket}`,
					},
				);

				if (error) {
					throw new Error(`Failed to send OTP email: ${error.message}`);
				}
			},
		}),
	],
});
