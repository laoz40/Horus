import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	getPrPatchFields,
	getSetPrResult,
	hasExercisePrHistory,
	normalizePrSet,
	type ExercisePrSummary,
	updateExercisePrSummary,
} from "./calculateStatPr";
import { clearCurrentPrFlags, upsertExercisePrSummary } from "./exercisePrs";
import { mapExercisesWithGlobalExerciseIds } from "./globalExerciseLookup";

type WorkoutCtx = MutationCtx | QueryCtx;

interface InsertWorkoutChildrenArgs {
	workoutId: Id<"workouts">;
	userId: string;
	workoutCreationTime: number;
	exercises: Awaited<ReturnType<typeof mapExercisesWithGlobalExerciseIds>>;
}

interface InsertWorkoutChildrenWithPrsArgs extends InsertWorkoutChildrenArgs {
	exercisePrSummaries: Map<Id<"globalExercises">, ExercisePrSummary>;
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

export async function insertWorkoutChildrenWithPrs(
	ctx: MutationCtx,
	args: InsertWorkoutChildrenWithPrsArgs,
): Promise<number> {
	let totalPrSets = 0;
	const hasHistoryByExerciseId = new Map<Id<"globalExercises">, boolean>();

	for (const globalExerciseId of args.exercisePrSummaries.keys()) {
		hasHistoryByExerciseId.set(
			globalExerciseId,
			hasExercisePrHistory(args.exercisePrSummaries.get(globalExerciseId)!),
		);
	}

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
			const summary = args.exercisePrSummaries.get(exercise.globalExerciseId);
			if (!summary) throw new ConvexError({ code: "NO_EXERCISE_PR_SUMMARY" });

			const normalizedSet = normalizePrSet(set);
			const hasHistory = hasHistoryByExerciseId.get(exercise.globalExerciseId) ?? false;
			const result = hasHistory
				? getSetPrResult(normalizedSet, summary)
				: { isPr: false, prType: null };
			if (result.isPr) totalPrSets += 1;

			const workoutSetId = await ctx.db.insert("workoutSets", {
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
				...getPrPatchFields(result),
			});

			const nextSummary = updateExercisePrSummary(normalizedSet, workoutSetId, summary);
			await clearCurrentPrFlags(ctx, {
				weightPrSetId:
					summary.weightPrSetId !== nextSummary.weightPrSetId ? summary.weightPrSetId : null,
				volumePrSetId:
					summary.volumePrSetId !== nextSummary.volumePrSetId ? summary.volumePrSetId : null,
				bodyweightRepsPrSetId:
					summary.bodyweightRepsPrSetId !== nextSummary.bodyweightRepsPrSetId
						? summary.bodyweightRepsPrSetId
						: null,
			});
			await ctx.db.patch(workoutSetId, {
				isCurrentWeightPr: nextSummary.weightPrSetId === workoutSetId,
				isCurrentVolumePr: nextSummary.volumePrSetId === workoutSetId,
				isCurrentBodyweightRepsPr: nextSummary.bodyweightRepsPrSetId === workoutSetId,
			});

			args.exercisePrSummaries.set(exercise.globalExerciseId, nextSummary);
			if (!hasHistory && normalizedSet.completed) {
				hasHistoryByExerciseId.set(exercise.globalExerciseId, true);
			}
		}
	}

	await Promise.all(
		[...args.exercisePrSummaries].map(([globalExerciseId, summary]) =>
			upsertExercisePrSummary(ctx, args.userId, globalExerciseId, summary),
		),
	);

	return totalPrSets;
}

export async function getWorkoutExerciseGlobalIds(
	ctx: WorkoutCtx,
	workoutId: Id<"workouts">,
): Promise<Id<"globalExercises">[]> {
	const workoutExercises = await ctx.db
		.query("workoutExercises")
		.withIndex("by_workoutId", (query) => query.eq("workoutId", workoutId))
		.collect();

	return workoutExercises.map((exercise) => exercise.globalExerciseId);
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
