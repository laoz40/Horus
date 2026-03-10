"use client";

import { Button } from "@/components/ui/button";
import { UserButton } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { type ReactElement } from "react";

interface DashboardAccountButtonUser {
	name?: string | null;
	email?: string | null;
	image?: string | null;
}

interface DashboardAccountButtonProps {
	initialUser: DashboardAccountButtonUser | null;
}

export default function DashboardAccountButton({ initialUser }: DashboardAccountButtonProps): ReactElement {
	if (!initialUser) {
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

function SignInPrompt() {
	return (
		<Button size="sm" asChild>
			<Link href="/login">Sign in</Link>
		</Button>
	);
}
