"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

export function Providers({ children }: { children: ReactNode }) {
	const router = useRouter();

	return (
		<AuthUIProvider
			authClient={authClient}
			navigate={router.push}
			replace={router.replace}
			onSessionChange={() => {
				// Clear router cache (protected routes)
				router.refresh();
			}}
			Link={Link}
			credentials={false}
			emailOTP
			avatar
			additionalFields={{
				weight: {
					label: "Weight",
					placeholder: "This doesn't do anything yet",
					description: "Please enter your weight",
					required: false,
					type: "number",
				},
			}}
			account={{
				basePath: "/account",
				fields: ["image", "name", "weight"],
			}}
			// social={{
			// 	providers: ["google", "facebook", "apple", "github"],
			// }}
			basePath="/"
			viewPaths={{
				SIGN_IN: "login",
				EMAIL_OTP: "login",
			}}>
			{children}
		</AuthUIProvider>
	);
}
