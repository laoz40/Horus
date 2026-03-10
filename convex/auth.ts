import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: false,
		},
		// The Convex plugin is required for Convex compatibility
		plugins: [
			convex({ authConfig }),
			emailOTP({
				async sendVerificationOTP({ email, otp, type }) {
					console.log("sendVerificationOTP", { email, otp, type });

					if (type === "sign-in") {
						// Send the OTP for sign in
					} else if (type === "email-verification") {
						// Send the OTP for email verification
					} else {
						// Send the OTP for password reset
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
