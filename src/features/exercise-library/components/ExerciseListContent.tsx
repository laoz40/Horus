import {
	formatMuscleGroups,
	formatWorkoutCount,
} from "@/features/exercise-library/lib/formatExerciseCatalog";

export interface ExerciseListItem {
	id: string;
	name: string;
	muscleGroups: string[];
	workoutCount: number;
}

interface ExerciseListContentProps {
	exercises: ExerciseListItem[];
	searchQuery: string;
	onSelectExercise: (exercise: ExerciseListItem) => void;
}

export default function ExerciseListContent({
	exercises,
	searchQuery,
	onSelectExercise,
}: ExerciseListContentProps) {
	if (exercises.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">
				{searchQuery.trim() === "" ? "No exercises yet." : "No exercises match your search."}
			</p>
		);
	}

	return (
		<ul className="flex flex-col gap-3">
			{exercises.map((exercise) => (
				<li key={exercise.id}>
					<button
						type="button"
						aria-label={`Edit ${exercise.name}`}
						onClick={() => onSelectExercise(exercise)}
						className="w-full rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent/40">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<p className="leading-tight font-medium">{exercise.name}</p>
								<p className="mt-1 text-sm text-muted-foreground">
									{formatMuscleGroups(exercise.muscleGroups)}
								</p>
							</div>
							<span className="shrink-0 text-sm text-muted-foreground tabular-nums">
								{formatWorkoutCount(exercise.workoutCount)}
							</span>
						</div>
					</button>
				</li>
			))}
		</ul>
	);
}
