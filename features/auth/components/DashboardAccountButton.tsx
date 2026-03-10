"use client";

import { Button } from "@/components/ui/button";
import { UserButton } from "@daveyplate/better-auth-ui";
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
		<UserButton
			size="icon"
			className="size-10"
			classNames={{
				trigger: {
					avatar: {
						fallback: "bg-primary text-primary-foreground",
					},
				},
				content: {
					user: {
						avatar: {
							fallback: "bg-primary text-primary-foreground",
						},
					},
				},
			}}
		/>
	);
}

function LoadingSkeleton(): ReactElement {
	return <div className="size-10 rounded-full bg-muted animate-pulse" />;
}

function SignInPrompt() {
	return (
		<Button asChild>
			<Link href="/login">Sign in</Link>
		</Button>
	);
}
