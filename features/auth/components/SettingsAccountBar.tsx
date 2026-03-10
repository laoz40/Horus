"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsAccountBar() {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const user = useQuery(api.auth.getCurrentUser);
	const router = useRouter();

	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (!isAuthenticated) {
		return <SignInPrompt />;
	}

	return (
		<div className="relative flex flex-row w-full items-center justify-between px-2 py-2">
			<div className="flex flex-row items-center gap-2">
				<UserAvatar
					user={user ?? null}
					className="size-10"
					classNames={{ fallback: "bg-primary text-primary-foreground" }}
				/>
				<div className="flex flex-col">
					<span className="text-base font-semibold leading-tight">{user?.name ?? "Legend"}</span>
					<span className="text-sm text-muted-foreground">{user?.email ?? "Signed in"}</span>
				</div>
			</div>
			<Button
				variant="secondary"
				size="sm"
				onClick={async () => {
					await authClient.signOut();
					router.refresh();
					router.replace("/");
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
				<div className="flex flex-col gap-2">
					<div className="h-4 w-28 rounded bg-muted animate-pulse" />
					<div className="h-3 w-28 rounded bg-muted animate-pulse" />
				</div>
			</div>
			<div className="h-8 w-18 rounded bg-muted animate-pulse" />
		</div>
	);
}

function SignInPrompt() {
	return (
		<Link href="/login">
			<div className="relative flex flex-row w-full items-center justify-between px-2 py-2">
				<div className="flex flex-row items-center gap-2">
					<UserAvatar
						user={null}
						className="size-10"
					/>
					<span className="font-semibold">Legend</span>
				</div>
				<div className="flex flex-row gap-1 items-center">
					<span>Sign In</span>
					<ChevronRight className="mr-2 size-6" />
				</div>
			</div>
		</Link>
	);
}
