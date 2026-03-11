"use client";

import { type ReactElement, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { Loader2, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardAccountButtonUser {
	name?: string | null;
	email?: string | null;
	image?: string | null;
}

interface DashboardAccountButtonProps {
	initialUser: DashboardAccountButtonUser | null;
}

export default function DashboardAccountButton({ initialUser }: DashboardAccountButtonProps): ReactElement {
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

	if (!initialUser) {
		return <SignInPrompt />;
	}

	const handleSignOut = async () => {
		if (isSigningOut) {
			return;
		}

		setIsSigningOut(true);
		try {
			await authClient.signOut();
		} finally {
			router.refresh();
			setIsSigningOut(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="size-10 rounded-full p-0"
					aria-label="Open account menu">
					<UserAvatar
						user={initialUser}
						className="size-10"
						classNames={{ fallback: "bg-primary text-primary-foreground" }}
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-42">
				<DropdownMenuLabel className="pointer-events-none select-none">
					<div className="truncate text-sm font-medium">{initialUser.name ?? "Legend"}</div>
					<div className="truncate text-xs text-muted-foreground">{initialUser.email ?? "No email"}</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={() => router.push("/settings")}>
					<Settings className="size-4" />
					Settings
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					disabled={isSigningOut}
					onSelect={(event) => {
						event.preventDefault();
						void handleSignOut();
					}}>
					{isSigningOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
					{isSigningOut ? "Signing out..." : "Sign out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SignInPrompt() {
	return (
		<Button size="sm" asChild>
			<Link href="/login">Sign in</Link>
		</Button>
	);
}
