"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

export function Providers({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
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
					basePath: "/settings",
					fields: ["image", "name", "weight"],
				}}
				social={{
					providers: ["google", "github"],
				}}
				basePath="/"
				viewPaths={{
					SIGN_IN: "login",
					EMAIL_OTP: "login",
				}}>
				{children}
			</AuthUIProvider>
		</QueryClientProvider>
	);
}
