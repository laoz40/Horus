import type { ReactElement } from "react";

import type { WorkoutFormData } from "@/features/workout-form/lib/types";
import WorkoutCardStats from "@/features/workout-history/components/WorkoutCardStats";
import { formatWorkoutDate } from "@/lib/date";

interface WorkoutViewSummaryProps {
	workout: WorkoutFormData & { createdAt: number };
}

function getWorkoutViewStats(workout: WorkoutFormData) {
	const totalVolume = workout.exercises.reduce(
		(workoutTotal, exercise) =>
			workoutTotal +
			exercise.sets.reduce(
				(exerciseTotal, set) =>
					set.completed ? exerciseTotal + (set.weight ?? 0) * (set.reps ?? 0) : exerciseTotal,
				0,
			),
		0,
	);

	const totalPrSets = workout.exercises.reduce(
		(count, exercise) =>
			count + exercise.sets.filter((set) => set.completed && (set.prTypes?.length ?? 0) > 0).length,
		0,
	);

	const exerciseCount = workout.exercises.filter((exercise) =>
		exercise.sets.some((set) => set.completed),
	).length;

	return {
		totalVolume,
		totalPrSets,
		exerciseCount,
	};
}

export default function WorkoutViewSummary({ workout }: WorkoutViewSummaryProps): ReactElement {
	const { totalVolume, totalPrSets, exerciseCount } = getWorkoutViewStats(workout);

	return (
		<section className="flex flex-col gap-2 px-4 pb-6 pt-2">
			<div className="flex flex-col gap-0.5">
				<h1 className="text-2xl font-semibold leading-tight">{workout.name}</h1>
				<p className="text-muted-foreground text-sm">{formatWorkoutDate(workout.createdAt)}</p>
			</div>
			<WorkoutCardStats
				pr={totalPrSets}
				duration={workout.durationSeconds ?? 0}
				workoutVolume={totalVolume}
				exerciseCount={exerciseCount}
				showBorderTop={false}
			/>
		</section>
	);
}
