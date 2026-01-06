import { db } from "@/lib/prisma";
import WorkoutForm from "@/components/WorkoutForm";
import { convertDbToFormData } from "@/lib/parseWorkout";

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
