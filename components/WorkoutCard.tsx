import Card from "./Card";
import { getRelativeTime } from "@/lib/date";
import { Workout } from "@prisma/client";
import { ShineBorder } from "./ui/shine-border";
import WorkoutCardStats from "./WorkoutCardStats";
import WorkoutCardOptions from "./WorkoutCardOptions";
import { Badge } from "./ui/badge";

// TODO: calculate pr
const pr = 2;

interface WorkoutCardProps {
	workout: Workout;
	deleteLocalWorkout: (deleteId: string) => void;
}

// TODO: make the shine border conditional, and hide grey border if shine border
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
			const workoutData = await response.json();

			if (!workoutData.success) {
				console.error("Failed to delete workout:", workoutData.error);
			}
		} catch (err) {
			console.error("Delete failed", err);
		}
	};

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
					/>
				</div>

				<div className="grid grid-cols-[1fr_min-content] mt-1">
					<div className="flex flex-row justify-start gap-4">
						<Badge variant="secondary">Chest</Badge>
						<Badge variant="secondary">Back</Badge>
						<Badge variant="secondary">Shoulders</Badge>
					</div>
				</div>

				<WorkoutCardStats pr={pr} />
			</Card>
		</>
	);
}
