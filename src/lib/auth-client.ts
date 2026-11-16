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

// Keep this browser-lifetime subscription alongside the singleton auth client.
// Use resolved session state so cancelled requests and network errors cannot clear the cookie.
if ("window" in globalThis) {
	authClient.$store.atoms.session?.subscribe(
		({ data, error, isPending, isRefetching }: ReturnType<typeof authClient.useSession>) => {
			if (!isPending && !isRefetching && (!error || error.status === 401)) saveProfileCookie(data);
		},
	);
}
