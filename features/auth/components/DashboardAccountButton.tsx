"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { type ReactElement } from "react";

export default function DashboardAccountButton(): ReactElement {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (!isAuthenticated) {
		return <SignInPrompt />;
	}

	return (
		<Button
			variant="outline"
			onClick={async () => {
				await authClient.signOut();
			}}>
			Sign out
		</Button>
	);
}

function LoadingSkeleton(): ReactElement {
	return <div className="size-10 rounded-full border-2 border-muted bg-muted animate-pulse" />;
}

function SignInPrompt() {
	return (
		<Button asChild>
			<Link href="/sign-in">Sign in</Link>
		</Button>
	);
}
