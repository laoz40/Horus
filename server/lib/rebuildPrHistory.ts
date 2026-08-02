import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workouts, workoutExercises, workoutSets } from "@/lib/db/schema";
import { calculatePrHistory } from "@/server/lib/pr";

export const rebuildPrHistory = async (userId: string) => {
	return db.transaction(async (tx) => {
		const historySets = await tx
			.select({
				setId: workoutSets.id,
				workoutId: workouts.id,
				exerciseId: workoutExercises.exerciseId,
				weight: workoutSets.weight,
				reps: workoutSets.reps,
				completed: workoutSets.completed,
			})
			.from(workoutSets)
			.innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
			.innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
			.where(eq(workouts.userId, userId))
			.orderBy(
				asc(workouts.createdAt),
				asc(workouts.id),
				asc(workoutExercises.position),
				asc(workoutSets.position),
			);

		const prStatuses = calculatePrHistory(historySets);

		const prSetCountByWorkoutId = new Map<string, number>();
		for (const prStatus of prStatuses) {
			const isPr = prStatus.isWeightPr || prStatus.isVolumePr || prStatus.isBodyweightRepsPr;

			if (!isPr) {
				continue;
			}

			const count = prSetCountByWorkoutId.get(prStatus.workoutId) ?? 0;
			prSetCountByWorkoutId.set(prStatus.workoutId, count + 1);
		}

		for (const prStatus of prStatuses) {
			await tx
				.update(workoutSets)
				.set({
					isWeightPr: prStatus.isWeightPr,
					isVolumePr: prStatus.isVolumePr,
					isBodyweightRepsPr: prStatus.isBodyweightRepsPr,
				})
				.where(eq(workoutSets.id, prStatus.setId));
		}

		await tx.update(workouts).set({ totalPrSets: 0 }).where(eq(workouts.userId, userId));

		for (const [workoutId, totalPrSets] of prSetCountByWorkoutId) {
			await tx.update(workouts).set({ totalPrSets }).where(eq(workouts.id, workoutId));
		}
	});
};
