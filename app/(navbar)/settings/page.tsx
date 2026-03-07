"use client";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { api } from "@/convex/_generated/api";
import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { showErrorToast, showWorkoutsDeletedToast } from "@/lib/toastMessages";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { ChevronDown } from "lucide-react";

export default function SettingsPage() {
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
					<div className="flex flex-row w-full items-center justify-between">
						<UserButton
							showName
							userProfileMode="modal"
							appearance={{
								elements: {
									rootBox: "flex-1! px-1!",
									userButtonBox: "flex! flex-row-reverse!",
									userButtonTrigger: "flex! flex-1! py-2! justify-start!",
									userButtonAvatarBox: "size-12! rounded-full border-2 border-muted",
									userButtonOuterIdentifier: "text-base! font-semibold!",
								},
								options: {
									shimmer: false,
								},
							}}
						/>
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
