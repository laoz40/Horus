"use client";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { api } from "@/convex/_generated/api";
import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { showErrorToast, showWorkoutsDeletedToast } from "@/lib/toastMessages";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";

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
			<SectionCard header="Appearance">
				<div className="flex flex-row items-center justify-between">
					<span>Theme</span>
					<ModeToggle />
				</div>
			</SectionCard>

			<SectionCard header="Workouts">
				<div className="flex flex-row items-center justify-between">
					<span>Reset Data</span>
					<AlertDialogDestructive
						title="Delete all workouts?"
						description="This will permanently delete all workouts."
						handleDelete={() => handleClick()}>
						<Button variant="destructive">Delete all workouts</Button>
					</AlertDialogDestructive>
				</div>
			</SectionCard>
		</>
	);
}
