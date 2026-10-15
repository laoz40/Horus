"use client";

import { Button } from "@/components/ui/button";
import { IconLoader2, IconLogout } from "@tabler/icons-react";
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
			{isSigningOut ? (
				<IconLoader2 className="size-4 animate-spin" />
			) : (
				<IconLogout className="size-4" />
			)}
			<span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
		</Button>
	);
}
