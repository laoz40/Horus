"use client";

import SignOutIcon from "@/features/auth/components/SignOutIcon";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import useSignOut from "@/features/auth/hooks/useSignOut";

export default function SignOutButton({ className }: { className?: string }) {
	const { isSigningOut, signOut } = useSignOut();

	return (
		<Button
			variant="outline"
			className={cn(className, "bg-card!")}
			disabled={isSigningOut}
			onClick={() => {
				void signOut();
			}}>
			<SignOutIcon
				isSigningOut={isSigningOut}
				className="size-4"
			/>
			<span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
		</Button>
	);
}
