import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;
const resend = new Resend(process.env.RESEND_API_KEY);
const resendFromEmail = process.env.RESEND_FROM_EMAIL!;
const personalEmail = process.env.PERSONAL_EMAIL!;

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
					if (type !== "sign-in") {
						throw new Error(`Unsupported OTP type: ${type}`);
					}

					const { error } = await resend.emails.send({
						from: `Horus <${resendFromEmail}>`,
						to: email,
						subject: "Your Horus sign-in code",
						text: `${otp} is your Horus sign-in code. Thank you for using my app! Would love to hear any feedback, ideas or questions. You can reach me at ${personalEmail}. Enjoy your workout!`,
						html: `<p><strong>${otp}</strong> is Horus sign-in code.</p><p>Thank you for using my app! Would love to hear any feedback, ideas or questions. You can reach me at <a href="mailto:${personalEmail}">${personalEmail}</a>. Enjoy your workout!</p>`,
					});

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
