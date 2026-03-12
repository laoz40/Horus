"use client";

import { UserAvatar } from "@daveyplate/better-auth-ui";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface SettingsAccountBarUser {
	name?: string | null;
	email?: string | null;
	image?: string | null;
}

interface SettingsAccountBarProps {
	initialUser: SettingsAccountBarUser | null;
}

export default function SettingsAccountBar({ initialUser }: SettingsAccountBarProps) {
	const user = initialUser;

	if (!user) {
		return <SignInPrompt />;
	}

	return (
		<Link href="/settings/account">
			<div className="relative flex w-full flex-row items-center justify-between px-2 py-2">
				<div className="flex flex-row items-center gap-2">
					<UserAvatar
						user={user ?? null}
						className="size-10"
						classNames={{ fallback: "bg-primary text-primary-foreground" }}
					/>
					<div className="flex flex-col">
						<span className="text-base font-semibold leading-tight">
							{user?.name ?? "Legend"}
						</span>
						<span className="text-sm text-muted-foreground">{user?.email ?? "Signed in"}</span>
					</div>
				</div>
				<div className="flex flex-row items-center gap-1">
					<span>Account</span>
					<ChevronRight className="mr-2 size-6" />
				</div>
			</div>
		</Link>
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
