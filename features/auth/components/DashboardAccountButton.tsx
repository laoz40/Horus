"use client";

import { Button } from "@/components/ui/button";
import { SignUpButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { type ReactElement } from "react";

export default function DashboardAccountButton(): ReactElement {
	return (
		<>
			<Authenticated>
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
			</Authenticated>
			<Unauthenticated>
				<SignUpButton>
					<Button>Sign in</Button>
				</SignUpButton>
			</Unauthenticated>
		</>
	);
}
