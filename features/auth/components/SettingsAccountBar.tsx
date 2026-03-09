"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useConvexAuth, useQuery } from "convex/react";
import { ChevronDown, ChevronRight, UserIcon } from "lucide-react";
import Link from "next/link";

export default function SettingsAccountBar() {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const user = useQuery(api.auth.getCurrentUser);

	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (!isAuthenticated) {
		return <SignInPrompt />;
	}

	return (
		<div className="relative flex flex-row w-full items-center justify-between">
			<div className="flex flex-row items-center gap-3 px-1 py-2">
				<div className="bg-muted rounded-full p-2">
					<UserIcon className="size-8" />
				</div>
				<div className="flex flex-col">
					<span className="text-base font-semibold leading-tight">{user?.name ?? "Legend"}</span>
					<span className="text-xs text-muted-foreground">{user?.email ?? "Signed in"}</span>
				</div>
			</div>
			<Button
				variant="outline"
				size="sm"
				onClick={async () => {
					await authClient.signOut();
				}}>
				Sign out
			</Button>
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<div className="flex flex-row items-center justify-between px-2 py-2">
			<div className="flex flex-row items-center gap-3">
				<div className="size-12 rounded-full border-2 border-muted bg-muted animate-pulse" />
				<div className="h-4 w-28 rounded bg-muted animate-pulse" />
			</div>
			<div className="h-4 w-4 rounded bg-muted animate-pulse" />
		</div>
	);
}

function SignInPrompt() {
	return (
		<Link href="/sign-in">
			<div className="cursor-pointer flex flex-row justify-between items-center">
				<div className="flex flex-row items-center justify-start gap-2 py-2 px-1">
					<div className="bg-muted rounded-full p-2">
						<UserIcon className="size-10!"></UserIcon>
					</div>
					<span className="font-semibold">Legend</span>
				</div>
				<ChevronRight className="mr-2 size-4 text-muted-foreground" />
			</div>
		</Link>
	);
}
