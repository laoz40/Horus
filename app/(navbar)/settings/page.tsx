"use client";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { api } from "@/convex/_generated/api";
import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { showErrorToast, showWorkoutsDeletedToast } from "@/lib/toastMessages";
import { UserButton } from "@clerk/nextjs";
import { Authenticated, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { ChevronDown } from "lucide-react";

export default function SettingsPage() {
	return (
		<Authenticated>
			<Content />
		</Authenticated>
	);
}

function Content() {
	const deleteAllWorkouts = useMutation(api.workouts.deleteAllWorkouts);

	const handleClick = async () => {
		try {
			const result = await deleteAllWorkouts({});
			showWorkoutsDeletedToast(result.deletedCount);
		} catch (error) {
			if (error instanceof ConvexError && error.data?.code === "NO_WORKOUTS") {
				showErrorToast("No workouts to delete.");
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "DB_QUERY_FAILED") {
				showErrorToast("Couldn't reach the database. Please try again.");
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "UNAUTHORIZED") {
				showErrorToast("You must be signed in to delete workouts.");
				return;
			}

			showErrorToast("Unexpected error while deleting workouts.");
		}
	};

	return (
		<>
			<div className="p-4">
				<h1>Settings</h1>
			</div>

			<div className="flex flex-col gap-3">
				<SectionCard
					header="Account"
					className="p-0">
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
								},
								options: {
									shimmer: false,
								},
							}}
						/>
						<ChevronDown className="pointer-events-none absolute right-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
					</div>
				</SectionCard>

				<SectionCard header="Appearance">
					<div className="flex flex-row items-center justify-between">
						<span>Theme</span>
						<ModeToggle />
					</div>
				</SectionCard>

				<SectionCard header="Data">
					<div className="flex flex-row items-center justify-between">
						<span>Workouts</span>
						<AlertDialogDestructive
							title="Delete all workouts?"
							description="This will permanently delete all workouts."
							handleDelete={() => handleClick()}>
							<Button
								variant="destructive"
								size="sm">
								Delete all workouts
							</Button>
						</AlertDialogDestructive>
					</div>
				</SectionCard>
			</div>
		</>
	);
}
