"use client";

import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactElement } from "react";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { Button } from "@/components/ui/button";
import { markWorkoutDeleted } from "@/features/workout-history/stores/historyUiStore";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showWorkoutDeletedToast } from "@/lib/toastMessages";

interface WorkoutCardOptionsProps {
	workoutId: string;
	workoutName: string;
}

export default function WorkoutCardOptions({
	workoutId,
	workoutName,
}: WorkoutCardOptionsProps): ReactElement {
	const queryClient = useQueryClient();
	const deleteWorkout = useMutation(
		orpc.workouts.delete.mutationOptions({
			onSuccess: async (result) => {
				markWorkoutDeleted(result.deletedWorkoutId);
				showWorkoutDeletedToast(result.deletedWorkoutName);
				await queryClient.invalidateQueries({
					queryKey: orpc.workouts.list.key({ type: "infinite" }),
				});
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to delete workout.");
					console.error(error);
					return;
				}

				switch (error.code) {
					case "NOT_FOUND":
						showErrorToast("Couldn't find workout in the database.");
						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");
						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to delete workouts.");
						return;
					default: {
						const exhaustiveError: never = error;
						return exhaustiveError;
					}
				}
			},
		}),
	);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						className="mt-0.5 border border-transparent text-muted-foreground transition-colors hover:border-border/70 hover:text-foreground"
						aria-label="Workout options">
						<EllipsisVertical className="size-5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-34">
					<DropdownMenuGroup>
						<DropdownMenuItem
							asChild
							className="h-10">
							<Link href={`/workouts/${workoutId}/edit`}>Edit</Link>
						</DropdownMenuItem>

						<DropdownMenuItem className="h-10">Share</DropdownMenuItem>

						<DropdownMenuSeparator />

						<AlertDialogDestructive
							title="Delete workout?"
							description={`This will permanently delete workout: ${workoutName}`}
							handleDelete={() => deleteWorkout.mutate({ workoutId })}>
							<DropdownMenuItem
								className="h-10"
								variant="destructive"
								onSelect={(e) => e.preventDefault()}>
								Delete
							</DropdownMenuItem>
						</AlertDialogDestructive>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
