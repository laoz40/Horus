import { db } from "@/lib/prisma";

interface fetchWorkoutsProps {
	pageSize?: number;
	offset?: number;
}

export const fetchWorkouts = async ({ pageSize, offset }: fetchWorkoutsProps) => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	const workouts = await db.workout.findMany({
		include: {
			exercises: {
				include: {
					sets: true,
					globalExercise: true,
				},
			},
		},
		take: pageSize,
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
