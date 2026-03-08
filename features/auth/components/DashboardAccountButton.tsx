"use client";

import { Button } from "@/components/ui/button";
import { SignUpButton, UserButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
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
			userProfileMode="modal"
			appearance={{
				elements: {
					userButtonAvatarBox: "size-10! rounded-full border-2 border-muted",
					userButtonPopoverMain: "glass:bg-background/100!",
				},
				options: {
					shimmer: false,
				},
			}}
		/>
	);
}

function LoadingSkeleton(): ReactElement {
	return <div className="size-10 rounded-full border-2 border-muted bg-muted animate-pulse" />;
}

function SignInPrompt() {
	return (
		<SignUpButton>
			<Button>Sign in</Button>
		</SignUpButton>
	);
}
