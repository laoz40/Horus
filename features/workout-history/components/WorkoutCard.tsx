import Card from "@/components/Card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { WorkoutHistoryItem } from "@/features/workout-history/lib/types";
import { useHistoryUiStore } from "@/features/workout-history/stores/historyUiStore";
import { toTitleCase } from "@/features/workout-form/lib/convertWorkoutData";
import { getRelativeTime } from "@/lib/date";
import { ShineBorder } from "@/components/ui/shine-border";
import WorkoutCardStats from "./WorkoutCardStats";
import WorkoutCardOptions from "./WorkoutCardOptions";
import { Badge } from "@/components/ui/badge";
import { showErrorToast, showWorkoutDeletedToast } from "@/lib/toastMessages";
import { Authenticated, useMutation } from "convex/react";
import { ConvexError } from "convex/values";

interface WorkoutCardProps {
	workout: WorkoutHistoryItem;
	workoutIndex: number;
}

export default function WorkoutCard({ workout, workoutIndex }: WorkoutCardProps) {
	return (
		<Authenticated>
			<Content
				workout={workout}
				workoutIndex={workoutIndex}
			/>
		</Authenticated>
	);
}

function Content({ workout, workoutIndex }: WorkoutCardProps) {
	const deleteWorkout = useMutation(api.workouts.deleteWorkout);
	const markWorkoutDeleted = useHistoryUiStore((state) => state.markWorkoutDeleted);

	const handleDelete = async () => {
		try {
			const deletedWorkout = await deleteWorkout({
				workoutId: workout._id as Id<"workouts">,
			});

			markWorkoutDeleted(workout._id);
			showWorkoutDeletedToast(deletedWorkout.deletedWorkoutName);
		} catch (error) {
			if (error instanceof ConvexError && error.data?.code === "NO_WORKOUT_FOUND") {
				showErrorToast("Couldn't find workout in the database.");
				console.error("Missing ID: ", error.data?.workoutId ?? workout._id);
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "DB_QUERY_FAILED") {
				showErrorToast("Couldn't access the database. Please try again.");
				console.error(error);
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "UNAUTHORIZED") {
				showErrorToast("You must be signed in to delete workouts.");
				return;
			}

			showErrorToast("Failed to delete workout.");
			console.error(error);
		}
	};

	const mapMuscleGroups = workout.muscleGroups
		.slice(0, 3)
		.map((muscleGroup) => toTitleCase(muscleGroup));

	return (
		<>
			<Card>
				{workout.totalPrSets > 0 && (
					<ShineBorder
						shineColor="#34e1c9"
						duration={20}
					/>
				)}
				<div className="grid grid-cols-[1fr_min-content] items-start gap-x-2">
					<div className="flex min-w-0 flex-col">
						<span className="w-fit whitespace-nowrap text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted-foreground/90">
							{getRelativeTime(new Date(workout._creationTime))}
						</span>
						<h2 className="mt-0.5 max-w-full truncate text-base font-semibold leading-tight">
							{workout.name}
						</h2>
					</div>
					<WorkoutCardOptions
						handleDelete={handleDelete}
						workoutId={workout._id}
						workoutName={workout.name}
					/>
				</div>

				<div className="mt-2 grid grid-cols-[1fr_min-content]">
					<div className="flex flex-row flex-wrap justify-start gap-2">
						{mapMuscleGroups.map((label) => (
							<Badge
								key={label}
								variant="secondary"
								className="rounded-sm border border-border/70 bg-secondary/70 px-1.5 py-0 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-secondary-foreground/95">
								{label}
							</Badge>
						))}
					</div>
				</div>

				<WorkoutCardStats
					pr={workout.totalPrSets}
					duration={workout.durationSeconds ?? 0}
					workoutVolume={workout.totalVolume}
					exerciseCount={workout.exerciseCount}
					workoutIndex={workoutIndex}
				/>
			</Card>
		</>
	);
}
