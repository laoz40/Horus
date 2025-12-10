import { prisma } from "@/lib/prisma";
import WorkoutForm from "@/components/WorkoutForm";
import { WorkoutFormData, WorkoutWithRelations } from "@/lib/types";

export default async function EditWorkoutPage(props: { params: { id: string }}) {
    // This awaits the Promise-like object, ensuring the ID is populated.
    const resolvedParams = await props.params; 
    const workoutId = resolvedParams.id;

	const getUniqueWorkout = await prisma.workout.findUnique({
		where: {
			id: workoutId
		},
		include: {
			exercises: {
				include: {
					sets: true,
				}
			}
		}
	})

	if (!getUniqueWorkout) {
      // TODO: should render a 404 page or error message here
      return <h1>Workout Not Found</h1>;
  }

function convertDbToFormData(workout: WorkoutWithRelations): WorkoutFormData {
  return {
    name: workout.name,
    exercises: workout.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets.map(set => ({
        id: set.id,
        weight: String(set.weight),
        reps: String(set.reps),
      }))
    }))
  };
}

const formData = convertDbToFormData(getUniqueWorkout);

	return (
		<>
			<WorkoutForm initialData={formData}/>
		</>
	);
}
