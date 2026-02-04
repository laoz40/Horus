import Card from "./Card";
import { getRelativeTime } from "@/lib/date";
import { Workout } from "@prisma/client";
import { ShineBorder } from "./ui/shine-border";
import WorkoutCardStats from "./WorkoutCardStats";
import WorkoutCardOptions from "./WorkoutCardOptions";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { WorkoutDbData } from "@/lib/types";

const pr = 2;

interface WorkoutCardProps {
	workout: WorkoutDbData;
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

			toast.info("Workout deleted", {
				position: "top-center",
				style: {
					top: "48px"
				},
				action: {
					// TODO: undo delete
					label: "Undo",
					onClick: () => toast.dismiss(),
				},
				actionButtonStyle: {
					background: "var(--muted)",
					color: "var(--muted-foreground)",
				},
			});

			const workoutData = await response.json();
			if (!workoutData.success) {
				console.log("Failed to delete workout:", workoutData.error);
			}
		} catch (err) {
			console.log("Delete failed", err);
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
						workout={workout}
					/>
				</div>

				<div className="grid grid-cols-[1fr_min-content] mt-1">
					<div className="flex flex-row justify-start gap-4">
						<Badge variant="secondary">Chest</Badge>
						<Badge variant="secondary">Back</Badge>
						<Badge variant="secondary">Shoulders</Badge>
					</div>
				</div>

				<WorkoutCardStats
					pr={pr}
					duration={workout.durationSeconds ?? 0}
				/>
			</Card>
		</>
	);
}
