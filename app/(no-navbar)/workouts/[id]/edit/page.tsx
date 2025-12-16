import { db } from "@/lib/prisma";
import WorkoutForm from "@/components/WorkoutForm";
import { WorkoutFormData, WorkoutWithRelations } from "@/lib/types";

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
				},
			},
		},
	});

	if (!getUniqueWorkout) {
		return <h1>Workout Not Found</h1>;
	}

	function convertDbToFormData(workout: WorkoutWithRelations): WorkoutFormData {
		return {
			name: workout.name,
			exercises: workout.exercises.map((exercise) => ({
				id: exercise.id,
				name: exercise.name,
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
	console.log(formData)

	return (
		<>
			<WorkoutForm
				initialData={formData}
				workoutId={id}
			/>
		</>
	);
}
