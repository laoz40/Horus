import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { WorkoutFormData } from "../features/workout-form/lib/types";
import { validateWorkout } from "../features/workout-form/lib/validateWorkout";
import { calculateTotalPrSets } from "../lib/workout/calculateStatPr";
import { calculateWorkoutVolume } from "../lib/workout/calculateStatVolume";
import { mapExercisesWithGlobalExerciseIds } from "../lib/workout/globalExerciseLookup";
import { getWorkoutMuscleGroups } from "../lib/workout/getWorkoutMuscleGroups";
import { parseWorkout } from "../lib/workout/parseWorkout";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const workoutObject = v.object({
	durationSeconds: v.union(v.float64(), v.null()),
	exercises: v.array(
		v.object({
			global: v.object({
				muscleGroups: v.optional(v.array(v.string())),
				name: v.string(),
			}),
			difficulty: v.optional(v.float64()),
			id: v.string(),
			notes: v.optional(v.string()),
			sets: v.array(
				v.object({
					completed: v.boolean(),
					id: v.string(),
					reps: v.float64(),
					weight: v.float64(),
				}),
			),
		}),
	),
	name: v.string(),
});

const requireIdentity = async (ctx: MutationCtx | QueryCtx) => {
	const identity = await ctx.auth.getUserIdentity();
	if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

	return identity;
};

const getWorkout = async (
	ctx: MutationCtx | QueryCtx,
	workoutId: Id<"workouts">,
	userId: string,
) => {
	const workout = await ctx.db.get(workoutId);
	// check if the workout exists and belongs to the user
	if (!workout || workout.userId !== userId) {
		throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId });
	}

	return workout;
};

const parseAndValidateWorkout = (rawWorkout: WorkoutFormData) => {
	const parsedWorkout = parseWorkout(rawWorkout);
	const validationResult = validateWorkout(parsedWorkout);

	if (!validationResult.success) {
		throw new ConvexError({
			code: "INVALID_WORKOUT_DATA",
			issues: validationResult.error.issues.map((issue) => ({
				message: issue.message,
			})),
		});
	}

	return validationResult.data;
};

const errorHandlerWrapper = async <T>(operation: () => Promise<T>): Promise<T> => {
	try {
		return await operation();
	} catch (error) {
		// catch any ConvexError and rethrow it
		if (error instanceof ConvexError) throw error;
		// else throw a generic DB query failed error
		throw new ConvexError({ code: "DB_QUERY_FAILED" });
	}
};

const insertWorkoutChildren = async (
	ctx: MutationCtx,
	args: {
		workoutId: Id<"workouts">;
		userId: string;
		workoutCreationTime: number;
		exercises: Awaited<ReturnType<typeof mapExercisesWithGlobalExerciseIds>>;
	},
) => {
	// create exercise rows in the workoutExercises table
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

		// create set rows in the workoutSets table
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
};

// cascade deletes all rows in the workoutExercises and workoutSets tables
const deleteWorkoutChildren = async (ctx: MutationCtx, workoutId: Id<"workouts">) => {
	const workoutExercises = await ctx.db
		.query("workoutExercises")
		.withIndex("by_workoutId", (q) => q.eq("workoutId", workoutId))
		.collect();

	const workoutSets = await ctx.db
		.query("workoutSets")
		.withIndex("by_workoutId", (q) => q.eq("workoutId", workoutId))
		.collect();

	// delete in batches of 50 to avoid hitting limits on the number of rows that can be deleted in a single query
	const DELETE_BATCH_SIZE = 50;

	// loop through the workoutSets and delete them in batches
	for (let index = 0; index < workoutSets.length; index += DELETE_BATCH_SIZE) {
		const batch = workoutSets.slice(index, index + DELETE_BATCH_SIZE);
		await Promise.all(batch.map((workoutSet) => ctx.db.delete(workoutSet._id)));
	}

	// loop through the workoutExercises and delete them in batches
	for (let index = 0; index < workoutExercises.length; index += DELETE_BATCH_SIZE) {
		const batch = workoutExercises.slice(index, index + DELETE_BATCH_SIZE);
		await Promise.all(batch.map((workoutExercise) => ctx.db.delete(workoutExercise._id)));
	}
};

const getWorkoutChildrenForUi = async (ctx: QueryCtx, workoutId: Id<"workouts">) => {
	// load all rows in the workoutExercises table for the workout
	const workoutExercises = await ctx.db
		.query("workoutExercises")
		.withIndex("by_workoutId_order", (q) => q.eq("workoutId", workoutId))
		.order("asc")
		.collect();

	// load all rows in the workoutSets table for the workout
	const workoutSets = await ctx.db
		.query("workoutSets")
		.withIndex("by_workoutId", (q) => q.eq("workoutId", workoutId))
		.collect();

	type WorkoutSetForUi = {
		id: string;
		weight: number;
		reps: number;
		completed: boolean;
	};

	// sort the workoutSets
	const sortedWorkoutSets = [...workoutSets].sort((a, b) => {
		// if the workoutExerciseIds are the same, sort by order
		if (a.workoutExerciseId === b.workoutExerciseId) return a.order - b.order;
		// otherwise sort by workoutExerciseId
		return a.workoutExerciseId < b.workoutExerciseId ? -1 : 1;
	});

	// loop through sortedWorkoutSets and group the sets by workoutExerciseId
	const setsByWorkoutExerciseId = new Map<Id<"workoutExercises">, WorkoutSetForUi[]>();
	for (const workoutSet of sortedWorkoutSets) {
		// initialize setsForExercise with an empty array if it doesn't exist
		const setsForExercise = setsByWorkoutExerciseId.get(workoutSet.workoutExerciseId) ?? [];
		// push the set to the array for the workoutExerciseId
		setsForExercise.push({
			id: workoutSet.clientSetId,
			weight: workoutSet.weight,
			reps: workoutSet.reps,
			completed: workoutSet.completed,
		});
		setsByWorkoutExerciseId.set(workoutSet.workoutExerciseId, setsForExercise);
	}

	// get all unique global exercise ids from the workoutExercises table
	const globalExerciseIds = new Set(workoutExercises.map((exercise) => exercise.globalExerciseId));
	const globalExercisesMap = new Map<
		Id<"globalExercises">,
		{ name: string; muscleGroups?: string[] }
	>();

	// check if each global exercise id in the workoutExercises table exists in the globalExercises table
	await Promise.all(
		[...globalExerciseIds].map(async (globalExerciseId) => {
			const globalExercise = await ctx.db.get(globalExerciseId);
			if (!globalExercise) return;

			// if so, store the global exercise data in a map keyed by global exercise id
			globalExercisesMap.set(globalExerciseId, {
				name: globalExercise.name,
				...(globalExercise.muscleGroups !== undefined
					? { muscleGroups: globalExercise.muscleGroups }
					: {}),
			});
		}),
	);

	// count the number of missing global exercises
	let missingGlobalExercisesCount = 0;
	const exercises = workoutExercises.flatMap((workoutExercise) => {
		const globalExercise = globalExercisesMap.get(workoutExercise.globalExerciseId);
		if (!globalExercise) {
			missingGlobalExercisesCount += 1;
			return [];
		}

		// return object with the workout exercise data and the sets
		return {
			id: workoutExercise.clientExerciseId,
			global: globalExercise,
			...(workoutExercise.difficulty !== undefined
				? { difficulty: workoutExercise.difficulty }
				: {}),
			...(workoutExercise.notes !== undefined ? { notes: workoutExercise.notes } : {}),
			sets: setsByWorkoutExerciseId.get(workoutExercise._id) ?? [],
		};
	});

	return { exercises, missingGlobalExercisesCount };
};

export const createWorkout = mutation({
	args: {
		workout: workoutObject,
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);
			const workoutData = parseAndValidateWorkout(args.workout as WorkoutFormData);

			const exercisesWithGlobalExerciseIds = await mapExercisesWithGlobalExerciseIds(
				ctx,
				workoutData.exercises as WorkoutFormData["exercises"],
			);
			const totalPrSets = await calculateTotalPrSets(
				ctx,
				identity.subject,
				exercisesWithGlobalExerciseIds,
			);
			const muscleGroups = getWorkoutMuscleGroups(workoutData);
			const totalVolume = calculateWorkoutVolume(workoutData);

			const workoutId = await ctx.db.insert("workouts", {
				name: workoutData.name,
				durationSeconds: workoutData.durationSeconds,
				exerciseCount: exercisesWithGlobalExerciseIds.length,
				muscleGroups,
				totalPrSets,
				totalVolume,
				userId: identity.subject,
			});
			const workout = await ctx.db.get(workoutId);
			if (!workout) throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId });

			await insertWorkoutChildren(ctx, {
				workoutId,
				userId: identity.subject,
				workoutCreationTime: workout._creationTime,
				exercises: exercisesWithGlobalExerciseIds,
			});

			return { workout: workoutData };
		}),
});

export const updateWorkout = mutation({
	args: {
		workoutId: v.id("workouts"),
		workout: workoutObject,
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);
			const workout = await getWorkout(ctx, args.workoutId, identity.subject);
			const workoutData = parseAndValidateWorkout(args.workout as WorkoutFormData);

			const exercisesWithGlobalExerciseIds = await mapExercisesWithGlobalExerciseIds(
				ctx,
				workoutData.exercises as WorkoutFormData["exercises"],
			);
			const totalPrSets = await calculateTotalPrSets(
				ctx,
				identity.subject,
				exercisesWithGlobalExerciseIds,
			);
			const muscleGroups = getWorkoutMuscleGroups(workoutData);
			const totalVolume = calculateWorkoutVolume(workoutData);

			// update the workout row in the workouts table
			await ctx.db.patch(args.workoutId, {
				name: workoutData.name,
				durationSeconds: workoutData.durationSeconds,
				exerciseCount: exercisesWithGlobalExerciseIds.length,
				muscleGroups,
				totalPrSets,
				totalVolume,
			});

			// update the workoutExercises and workoutSets tables
			await deleteWorkoutChildren(ctx, args.workoutId);
			await insertWorkoutChildren(ctx, {
				workoutId: args.workoutId,
				userId: identity.subject,
				workoutCreationTime: workout._creationTime,
				exercises: exercisesWithGlobalExerciseIds,
			});

			return { workout: workoutData, workoutId: args.workoutId };
		}),
});

export const deleteWorkout = mutation({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);
			const workout = await getWorkout(ctx, args.workoutId, identity.subject);

			await deleteWorkoutChildren(ctx, args.workoutId);
			await ctx.db.delete(args.workoutId);

			return {
				success: true,
				deletedWorkoutId: args.workoutId,
				deletedWorkoutName: workout.name,
			};
		}),
});

export const deleteAllWorkouts = mutation({
	args: {},
	handler: async (ctx) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);

			const workouts = await ctx.db
				.query("workouts")
				.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
				.collect();
			if (workouts.length === 0) throw new ConvexError({ code: "NO_WORKOUTS" });

			const DELETE_BATCH_SIZE = 25;
			for (let index = 0; index < workouts.length; index += DELETE_BATCH_SIZE) {
				const batch = workouts.slice(index, index + DELETE_BATCH_SIZE);
				for (const workout of batch) {
					await deleteWorkoutChildren(ctx, workout._id);
					await ctx.db.delete(workout._id);
				}
			}

			return { success: true, deletedCount: workouts.length };
		}),
});

export const canEditWorkout = query({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);
			await getWorkout(ctx, args.workoutId, identity.subject);

			return { ok: true };
		}),
});

export const getWorkoutById = query({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);
			const workout = await getWorkout(ctx, args.workoutId, identity.subject);
			const { exercises, missingGlobalExercisesCount } = await getWorkoutChildrenForUi(
				ctx,
				workout._id,
			);

			return {
				_id: workout._id,
				_creationTime: workout._creationTime,
				name: workout.name,
				durationSeconds: workout.durationSeconds,
				exercises,
				missingGlobalExercisesCount,
			};
		}),
});

export const listWorkouts = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);

			let results;
			try {
				results = await ctx.db
					.query("workouts")
					.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
					.order("desc")
					.paginate(args.paginationOpts);
			} catch (error) {
				if (error instanceof Error && error.message.includes("ArgumentValidationError")) {
					throw new ConvexError({ code: "INVALID_PAGINATION_OPTS" });
				}
				throw error;
			}

			return {
				...results,
				page: results.page.map((workout) => ({
					_id: workout._id,
					_creationTime: workout._creationTime,
					name: workout.name,
					durationSeconds: workout.durationSeconds,
					totalVolume: workout.totalVolume,
					totalPrSets: workout.totalPrSets,
					exerciseCount: workout.exerciseCount ?? 0,
					muscleGroups: workout.muscleGroups ?? [],
				})),
			};
		} catch (error) {
			if (error instanceof Error && error.message.includes("ArgumentValidationError")) {
				throw new ConvexError({ code: "INVALID_PAGINATION_OPTS" });
			}

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});
