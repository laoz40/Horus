"use client";

import { isDefinedError } from "@orpc/client";
import { Match } from "effect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showWorkoutsDeletedToast } from "@/lib/toastMessages";

export default function DeleteAllWorkoutsSection() {
	const queryClient = useQueryClient();

	const deleteAllWorkouts = useMutation(
		orpc.workouts.deleteAll.mutationOptions({
			onSuccess: async (result) => {
				showWorkoutsDeletedToast(result.deletedCount);
				await queryClient.invalidateQueries({
					queryKey: orpc.workouts.list.key({ type: "infinite" }),
				});
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to delete workouts.");
					console.error(error);

					return;
				}

				Match.value(error).pipe(
					Match.when({ code: "NO_WORKOUTS" }, () => showErrorToast("No workouts to delete.")),
					Match.when({ code: "DATABASE_ERROR" }, () =>
						showErrorToast("Couldn't access the database. Please try again."),
					),
					Match.when({ code: "UNAUTHORIZED" }, () =>
						showErrorToast("You must be signed in to delete workouts."),
					),
					Match.exhaustive,
				);
			},
		}),
	);

	return (
		<SectionCard header="Data">
			<div className="flex flex-row items-center justify-between">
				<span>Workouts</span>
				<AlertDialogDestructive
					title="Delete all workouts?"
					description="This will permanently delete all workouts."
					handleDelete={() => deleteAllWorkouts.mutate({})}>
					<Button
						variant="destructive"
						size="sm"
						className="text-sm">
						Delete all workouts
					</Button>
				</AlertDialogDestructive>
			</div>
		</SectionCard>
	);
}
