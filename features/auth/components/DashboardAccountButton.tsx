"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement } from "react";

export default function DashboardAccountButton(): ReactElement {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const router = useRouter();

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
				router.refresh();
			}}>
			Sign out
		</Button>
	);
}

function LoadingSkeleton(): ReactElement {
	return <div className="h-9 w-20 bg-muted animate-pulse" />;
}

function SignInPrompt() {
	return (
		<Button asChild>
			<Link href="/login">Sign in</Link>
		</Button>
	);
}
