"use client";

import { UserButton } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";

export default function SettingsAccountButton() {
	return (
		<div className="relative flex flex-row w-full items-center justify-between">
			<UserButton
				showName
				userProfileMode="modal"
				appearance={{
					elements: {
						rootBox: "flex-1 px-1 max-w-full!",
						userButtonBox: "flex flex-row-reverse! max-w-full!",
						userButtonTrigger: "flex flex-1 max-w-full! py-2! pr-10! justify-start!",
						userButtonAvatarBox: "size-12! rounded-full border-2 border-muted",
						userButtonOuterIdentifier: "text-base! font-semibold! truncate!",
						userButtonPopoverMain: "glass:bg-background/100!"
					},
					options: {
						shimmer: false,
					},
				}}
			/>
			<ChevronDown className="pointer-events-none absolute right-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
		</div>
	);
}
