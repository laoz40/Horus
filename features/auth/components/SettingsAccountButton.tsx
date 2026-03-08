"use client";

import { SignUpButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { ChevronDown, ChevronRight, UserIcon } from "lucide-react";

export default function SettingsAccountButton() {
	return (
		<>
			<Authenticated>
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
								userButtonPopoverMain: "glass:bg-background/100!",
							},
							options: {
								shimmer: false,
							},
						}}
					/>
					<ChevronDown className="pointer-events-none absolute right-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
				</div>
			</Authenticated>
			<Unauthenticated>
				<SignUpButton>
					<div className="cursor-pointer flex flex-row justify-between items-center">
						<div className="flex flex-row items-center justify-start gap-2 py-2 px-1">
							<div className="bg-neutral-600 rounded-full p-2">
								<UserIcon className="size-10!"></UserIcon>
							</div>
							Guest
						</div>
						<ChevronRight className="mr-2 size-4 text-muted-foreground" />
					</div>
				</SignUpButton>
			</Unauthenticated>
		</>
	);
}
