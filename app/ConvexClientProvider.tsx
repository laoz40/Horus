"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
	throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

interface ConvexClientProviderProps {
	children: ReactNode;
	initialToken?: string | null;
}

export default function ConvexClientProvider({
	children,
	initialToken,
}: ConvexClientProviderProps) {
	return (
		<ConvexBetterAuthProvider
			client={convex}
			authClient={authClient}
			initialToken={initialToken}>
			{children}
		</ConvexBetterAuthProvider>
	);
}
