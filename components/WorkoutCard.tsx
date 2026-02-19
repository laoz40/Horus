import Card from "./Card";
import { getRelativeTime } from "@/lib/date";
import { ShineBorder } from "./ui/shine-border";
import WorkoutCardStats from "./WorkoutCardStats";
import WorkoutCardOptions from "./WorkoutCardOptions";
import { Badge } from "./ui/badge";
import { showWorkoutDeletedToast } from "@/lib/toastMessages";
import { WorkoutWithPrData } from "@/lib/types";
import { toTitleCase } from "@/lib/convertWorkoutData";
import { calculateWorkoutVolume } from "@/lib/calculateWorkoutStats";

interface WorkoutCardProps {
	workout: WorkoutWithPrData;
	deleteLocalWorkout: (deleteId: string) => void;
}

export default function WorkoutCard({
	workout,
	deleteLocalWorkout,
}: WorkoutCardProps) {
	const handleDelete = async () => {
		deleteLocalWorkout(workout.id);

		try {
			const response = await fetch(`/api/workouts/${workout.id}`, {
				method: "DELETE",
			});

			showWorkoutDeletedToast();

			const workoutData = await response.json();
			if (!workoutData.success) {
				console.log("Failed to delete workout:", workoutData.error);
			}
		} catch (err) {
			console.log("Delete failed", err);
		}
	};

	console.log("workout:", workout);
	const pr = workout.totalPrSets;
	console.log("pr:", pr);

	const mapMuscleGroups = workout.exercises
		.slice(0, 3)
		.map((exercise) => {
			const muscleGroups = exercise.globalExercise?.muscleGroups;
			if (!Array.isArray(muscleGroups)) return null;
			const firstMusleGroup = muscleGroups[0];
			if (
				typeof firstMusleGroup !== "string" ||
				firstMusleGroup.trim().length === 0
			)
				return null;
			return toTitleCase(firstMusleGroup);
		})
		// filter out nulls
		.filter((muscleGroup) => muscleGroup != null)
		.reverse();

	const workoutVolume = calculateWorkoutVolume(workout);
	console.log("workoutVolume:", workoutVolume);

	return (
		<>
			<Card>
				{pr > 0 && (
					<ShineBorder
						shineColor="#34e1c9"
						duration={8}
					/>
				)}
				<div className="grid grid-cols-[1fr_min-content] items-center">
					<div className="flex flex-col">
						<span className="w-fit whitespace-nowrap text-muted-foreground text-sm font-light">
							{getRelativeTime(workout.createdAt)}
						</span>
						<h2 className="text-base font-bold">{workout.name}</h2>
					</div>
					<WorkoutCardOptions
						handleDelete={handleDelete}
						workoutId={workout.id}
						workout={workout}
					/>
				</div>

				<div className="grid grid-cols-[1fr_min-content] mt-1">
					<div className="flex flex-row justify-start gap-4">
						{mapMuscleGroups.map((label, index) => (
							<Badge
								key={index}
								variant="secondary">
								{label}
							</Badge>
						))}
					</div>
				</div>

				<WorkoutCardStats
					pr={pr}
					duration={workout.durationSeconds ?? 0}
					workoutVolume={workoutVolume}
				/>
			</Card>
		</>
	);
}
