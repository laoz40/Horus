import { db } from "@/lib/prisma";

interface fetchWorkoutsProps {
	workoutsPerPage?: number;
	offset?: number;
}

export const fetchWorkouts = async ({ workoutsPerPage, offset }: fetchWorkoutsProps) => {
	const workouts = await db.workout.findMany({
		include: {
			exercises: {
				include: {
					sets: true,
					globalExercise: true,
				},
			},
		},
		take: workoutsPerPage,
		skip: offset,
		orderBy: {
			createdAt: "desc",
		},
	});

	return workouts;
};

export const countWorkouts = async () => {
	const count = await db.workout.count();
	return count;
};
