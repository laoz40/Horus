import { db } from "@/lib/prisma";
import WorkoutForm from "@/components/WorkoutForm";
import { WorkoutFormData, WorkoutDbData } from "@/lib/types";

export default async function EditWorkoutPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const getUniqueWorkout = await db.workout.findUnique({
		where: {
			id: id,
		},
		include: {
			exercises: {
				include: {
					sets: true,
					globalExercise: true,
				},
			},
		},
	});

	if (!getUniqueWorkout) {
		return <h1>Workout Not Found</h1>;
	}

	// TODO: move this function somewhere
	function convertDbToFormData(workout: WorkoutDbData): WorkoutFormData {
		return {
			name: workout.name,
			durationSeconds: workout.durationSeconds,
			exercises: workout.exercises.map((exercise) => ({
				id: exercise.id,
				name: exercise.globalExercise.name,
				exercise: {
					exerciseId: exercise.globalExerciseId,
				},
				difficulty: exercise.difficulty,
				notes: exercise.notes,
				sets: exercise.sets.map((set) => ({
					id: set.id,
					weight: String(set.weight),
					reps: String(set.reps),
				})),
			})),
		};
	}

	const formData = convertDbToFormData(getUniqueWorkout);

	return (
		<>
			<WorkoutForm
				initialData={formData}
				workoutId={id}
			/>
		</>
	);
}
