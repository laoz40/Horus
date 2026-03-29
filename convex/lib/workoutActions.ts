import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { mapExercisesWithGlobalExerciseIds } from "./globalExerciseLookup";

type WorkoutCtx = MutationCtx | QueryCtx;

interface InsertWorkoutChildrenArgs {
	workoutId: Id<"workouts">;
	userId: string;
	workoutCreationTime: number;
	exercises: Awaited<ReturnType<typeof mapExercisesWithGlobalExerciseIds>>;
}

export async function getWorkout(
	ctx: WorkoutCtx,
	workoutId: Id<"workouts">,
	userId: string,
): Promise<Doc<"workouts">> {
	const workout = await ctx.db.get(workoutId);
	if (!workout || workout.userId !== userId) {
		throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId });
	}

	return workout;
}

export async function insertWorkoutChildren(
	ctx: MutationCtx,
	args: InsertWorkoutChildrenArgs,
): Promise<void> {
	for (const [exerciseIndex, exercise] of args.exercises.entries()) {
		const workoutExerciseId = await ctx.db.insert("workoutExercises", {
			workoutId: args.workoutId,
			userId: args.userId,
			order: exerciseIndex,
			clientExerciseId: exercise.id,
			globalExerciseId: exercise.globalExerciseId,
			...(exercise.difficulty !== undefined ? { difficulty: exercise.difficulty } : {}),
			...(exercise.notes !== undefined ? { notes: exercise.notes } : {}),
		});

		for (const [setIndex, set] of exercise.sets.entries()) {
			await ctx.db.insert("workoutSets", {
				userId: args.userId,
				globalExerciseId: exercise.globalExerciseId,
				workoutCreationTime: args.workoutCreationTime,
				workoutId: args.workoutId,
				workoutExerciseId,
				order: setIndex,
				clientSetId: set.id,
				weight: set.weight,
				reps: set.reps,
				completed: set.completed,
			});
		}
	}
}

export async function deleteRowsInBatches(
	ctx: MutationCtx,
	rowIds: Array<Id<"workoutSets"> | Id<"workoutExercises">>,
	batchSize: number,
): Promise<void> {
	for (let index = 0; index < rowIds.length; index += batchSize) {
		const batch = rowIds.slice(index, index + batchSize);
		await Promise.all(batch.map((rowId) => ctx.db.delete(rowId)));
	}
}

export async function deleteWorkoutChildren(
	ctx: MutationCtx,
	workoutId: Id<"workouts">,
): Promise<void> {
	const [workoutExercises, workoutSets] = await Promise.all([
		ctx.db
			.query("workoutExercises")
			.withIndex("by_workoutId", (query) => query.eq("workoutId", workoutId))
			.collect(),
		ctx.db
			.query("workoutSets")
			.withIndex("by_workoutId", (query) => query.eq("workoutId", workoutId))
			.collect(),
	]);

	const deleteBatchSize = 50;

	await deleteRowsInBatches(
		ctx,
		workoutSets.map((workoutSet) => workoutSet._id),
		deleteBatchSize,
	);
	await deleteRowsInBatches(
		ctx,
		workoutExercises.map((workoutExercise) => workoutExercise._id),
		deleteBatchSize,
	);
}
