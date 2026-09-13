"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsCard, type SettingsCardClassNames } from "@daveyplate/better-auth-ui";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface SignOutCardProps {
	className?: string;
	classNames?: SettingsCardClassNames;
}

export default function SignOutCard({ className, classNames }: SignOutCardProps) {
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

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
		<SettingsCard
			className={className}
			classNames={{
				...classNames,
				button: cn(
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
					classNames?.button,
				),
			}}
			actionLabel="Sign out"
			description="End this session on this device."
			isSubmitting={isSigningOut}
			title="Sign out"
			action={handleSignOut}
		/>
	);
}
