import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { saveProfileCookie } from "@/features/auth/lib/profileCookie";

export const authClient = createAuthClient({
	plugins: [emailOTPClient()],
	fetchOptions: {
		onSuccess: ({ request }) => {
			if (new URL(request.url).pathname.endsWith("/sign-out")) saveProfileCookie(null);
		},
	},
	sessionOptions: {
		refetchOnWindowFocus: false,
		refetchInterval: 0,
	},
});
