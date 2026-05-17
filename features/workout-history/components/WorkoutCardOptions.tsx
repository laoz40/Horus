import { type ReactElement } from "react";
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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { showErrorToast } from "@/lib/toastMessages";
import { Authenticated, useConvex } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";

interface WorkoutCardOptionsProps {
	handleDelete: () => void;
	workoutId: string;
	workoutName: string;
}

export default function WorkoutCardOptions({
	handleDelete,
	workoutId,
	workoutName,
}: WorkoutCardOptionsProps): ReactElement {
	return (
		<Authenticated>
			<Content
				handleDelete={handleDelete}
				workoutId={workoutId}
				workoutName={workoutName}
			/>
		</Authenticated>
	);
}

function Content({ handleDelete, workoutId, workoutName }: WorkoutCardOptionsProps): ReactElement {
	const router = useRouter();
	const convex = useConvex();

	const handleEdit = async () => {
		try {
			await convex.query(api.workouts.canEditWorkout, {
				workoutId: workoutId as Id<"workouts">,
			});

			router.push(`/workouts/${workoutId}/edit`);
		} catch (error) {
			if (error instanceof ConvexError && error.data?.code === "NO_WORKOUT_FOUND") {
				showErrorToast("Couldn't find workout in the database.");
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "DB_QUERY_FAILED") {
				showErrorToast("Couldn't access the database. Please try again.");
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "UNAUTHORIZED") {
				showErrorToast("You must be signed in to edit workouts.");
				return;
			}

			showErrorToast("Unexpected error opening workout editor.");
			console.error("Unexpected error opening workout editor:", error);
		}
	};

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
							className="h-10"
							onSelect={(e) => {
								e.preventDefault();
								handleEdit();
							}}>
							Edit
						</DropdownMenuItem>

						<DropdownMenuItem className="h-10">Share</DropdownMenuItem>

						<DropdownMenuSeparator />

						<AlertDialogDestructive
							title="Delete workout?"
							description={`This will permanently delete workout: ${workoutName}`}
							handleDelete={handleDelete}>
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
