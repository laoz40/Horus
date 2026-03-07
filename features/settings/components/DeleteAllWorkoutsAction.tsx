"use client";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { showErrorToast, showWorkoutsDeletedToast } from "@/lib/toastMessages";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";

export default function DeleteAllWorkoutsAction() {
	const deleteAllWorkouts = useMutation(api.workouts.deleteAllWorkouts);

	const handleDelete = async () => {
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
		<AlertDialogDestructive
			title="Delete all workouts?"
			description="This will permanently delete all workouts."
			handleDelete={handleDelete}>
			<Button
				variant="destructive"
				size="sm">
				Delete all workouts
			</Button>
		</AlertDialogDestructive>
	);
}
