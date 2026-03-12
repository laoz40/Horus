"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignOutButton({ className }: { className?: string }) {
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

	const handleSignOut = async () => {
		if (isSigningOut) {
			return;
		}

		setIsSigningOut(true);
		try {
			await authClient.signOut();
		} finally {
			router.refresh();
			router.replace("/");
			setIsSigningOut(false);
		}
	};

	return (
		<Button
			variant="destructive"
			className={className}
			disabled={isSigningOut}
			onClick={() => {
				void handleSignOut();
			}}>
			{isSigningOut ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				<LogOut className="size-4" />
			)}
			<span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
		</Button>
	);
}
