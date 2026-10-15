"use client";

import { SettingsCard, type SettingsCardClassNames } from "@daveyplate/better-auth-ui";

import { cn } from "@/lib/utils";
import useSignOut from "@/features/auth/hooks/useSignOut";

interface SignOutCardProps {
	className?: string;
	classNames?: SettingsCardClassNames;
}

export default function SignOutCard({ className, classNames }: SignOutCardProps) {
	const { isSigningOut, signOut } = useSignOut();

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
			action={signOut}
		/>
	);
}
