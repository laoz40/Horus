import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { WorkoutFormData } from "../features/workout-form/lib/types";
import { validateWorkout } from "../features/workout-form/lib/validateWorkout";
import { calculateTotalPrSets } from "../lib/workout/calculateStatPr";
import { calculateWorkoutVolume } from "../lib/workout/calculateStatVolume";
import { mapExercisesWithGlobalExerciseIds } from "../lib/workout/globalExerciseLookup";
import { getWorkoutMuscleGroups } from "../lib/workout/getWorkoutMuscleGroups";
import { parseWorkout } from "../lib/workout/parseWorkout";

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

const insertWorkoutChildren = async (
	ctx: MutationCtx,
	args: {
		workoutId: Id<"workouts">;
		userId: string;
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

	for (const workoutExercise of workoutExercises) {
		const workoutSets = await ctx.db
			.query("workoutSets")
			.withIndex("by_workoutExerciseId", (q) => q.eq("workoutExerciseId", workoutExercise._id))
			.collect();

		for (const workoutSet of workoutSets) {
			await ctx.db.delete(workoutSet._id);
		}

		await ctx.db.delete(workoutExercise._id);
	}
};

const getWorkoutChildrenForUi = async (ctx: QueryCtx, workoutId: Id<"workouts">) => {
	// load all rows in the workoutExercises table for the workout
	const workoutExercises = await ctx.db
		.query("workoutExercises")
		.withIndex("by_workoutId_order", (q) => q.eq("workoutId", workoutId))
		.order("asc")
		.collect();

	const setsByWorkoutExerciseId = new Map<
		Id<"workoutExercises">,
		{
			id: string;
			weight: number;
			reps: number;
			completed: boolean;
		}[]
	>();

	// load all sets from the workoutSets table for each workoutExercise
	await Promise.all(
		workoutExercises.map(async (workoutExercise) => {
			const workoutSets = await ctx.db
				.query("workoutSets")
				.withIndex("by_workoutExerciseId_order", (q) =>
					q.eq("workoutExerciseId", workoutExercise._id),
				)
				.order("asc")
				.collect();

			// store the sets in a map keyed by workoutExerciseId
			setsByWorkoutExerciseId.set(
				workoutExercise._id,
				workoutSets.map((set) => ({
					id: set.clientSetId,
					weight: set.weight,
					reps: set.reps,
					completed: set.completed,
				})),
			);
		}),
	);

	// get all unique global exercise ids from the workoutExercises table
	const globalExerciseIds = new Set(workoutExercises.map((exercise) => exercise.globalExerciseId));
	const globalExercisesMap = new Map<
		Id<"globalExercises">,
		{
			name: string;
			muscleGroups?: string[];
		}
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
	handler: async (ctx, args) => {
		try {
			const identity = await ctx.auth.getUserIdentity();
			if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

			const parsedWorkout = parseWorkout(args.workout as WorkoutFormData);

			const validationResult = validateWorkout(parsedWorkout);

			if (!validationResult.success) {
				throw new ConvexError({
					code: "INVALID_WORKOUT_DATA",
					issues: validationResult.error.issues.map((issue) => ({
						message: issue.message,
					})),
				});
			}
			const workoutData = validationResult.data;

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
				muscleGroups,
				totalPrSets,
				totalVolume,
				userId: identity.subject,
			});

			await insertWorkoutChildren(ctx, {
				workoutId,
				userId: identity.subject,
				exercises: exercisesWithGlobalExerciseIds,
			});

			return { workout: validationResult.data };
		} catch (error) {
			// passes INVALID_WORKOUT_DATA error if that throws
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const updateWorkout = mutation({
	args: {
		workoutId: v.id("workouts"),
		workout: workoutObject,
	},
	handler: async (ctx, args) => {
		try {
			const identity = await ctx.auth.getUserIdentity();
			if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

			const workout = await ctx.db.get(args.workoutId);
			if (!workout || workout.userId !== identity.subject) {
				throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId: args.workoutId });
			}

			const parsedWorkout = parseWorkout(args.workout as WorkoutFormData);
			const validationResult = validateWorkout(parsedWorkout);

			if (!validationResult.success) {
				throw new ConvexError({
					code: "INVALID_WORKOUT_DATA",
					issues: validationResult.error.issues.map((issue) => ({
						message: issue.message,
					})),
				});
			}
			const workoutData = validationResult.data;

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
				muscleGroups,
				totalPrSets,
				totalVolume,
			});

			// update the workoutExercises and workoutSets tables
			await deleteWorkoutChildren(ctx, args.workoutId);
			await insertWorkoutChildren(ctx, {
				workoutId: args.workoutId,
				userId: identity.subject,
				exercises: exercisesWithGlobalExerciseIds,
			});

			return { workout: validationResult.data, workoutId: args.workoutId };
		} catch (error) {
			// passes NO_WORKOUT_FOUND and INVALID_WORKOUT_DATA error if those throw
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const deleteWorkout = mutation({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) => {
		try {
			const identity = await ctx.auth.getUserIdentity();
			if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

			const workout = await ctx.db.get(args.workoutId);
			if (!workout || workout.userId !== identity.subject) {
				throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId: args.workoutId });
			}

			await deleteWorkoutChildren(ctx, args.workoutId);
			await ctx.db.delete(args.workoutId);

			return {
				success: true,
				deletedWorkoutId: args.workoutId,
				deletedWorkoutName: workout.name,
			};
		} catch (error) {
			// passes NO_WORKOUT_FOUND error if that throws
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const deleteAllWorkouts = mutation({
	args: {},
	handler: async (ctx) => {
		try {
			const identity = await ctx.auth.getUserIdentity();
			if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

			const workouts = await ctx.db
				.query("workouts")
				.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
				.collect();
			if (workouts.length === 0) throw new ConvexError({ code: "NO_WORKOUTS" });

			// delete in batches of 25 to avoid hitting limits on the number of rows that can be deleted in a single query
			const DELETE_BATCH_SIZE = 25;
			for (let index = 0; index < workouts.length; index += DELETE_BATCH_SIZE) {
				const batch = workouts.slice(index, index + DELETE_BATCH_SIZE);
				for (const workout of batch) {
					await deleteWorkoutChildren(ctx, workout._id);
					await ctx.db.delete(workout._id);
				}
			}

			return { success: true, deletedCount: workouts.length };
		} catch (error) {
			// passes NO_WORKOUTS error if that throws
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const canEditWorkout = query({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) => {
		try {
			const identity = await ctx.auth.getUserIdentity();
			if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

			const workout = await ctx.db.get(args.workoutId);
			if (!workout || workout.userId !== identity.subject) {
				throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId: args.workoutId });
			}

			return { ok: true };
		} catch (error) {
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const getWorkoutById = query({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) => {
		try {
			const identity = await ctx.auth.getUserIdentity();
			if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

			const workout = await ctx.db.get(args.workoutId);

			if (!workout || workout.userId !== identity.subject) {
				throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId: args.workoutId });
			}

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
		} catch (error) {
			// passes NO_WORKOUT_FOUND error if that throws
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const listWorkouts = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		try {
			const identity = await ctx.auth.getUserIdentity();
			if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

			const results = await ctx.db
				.query("workouts")
				.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
				.order("desc")
				.paginate(args.paginationOpts);

			// count the number of exercises for each workout
			const exerciseCounts = new Map<Id<"workouts">, number>();
			await Promise.all(
				results.page.map(async (workout) => {
					const exercises = await ctx.db
						.query("workoutExercises")
						.withIndex("by_workoutId", (q) => q.eq("workoutId", workout._id))
						.collect();
					exerciseCounts.set(workout._id, exercises.length);
				}),
			);

			return {
				...results,
				page: results.page.map((workout) => ({
					_id: workout._id,
					_creationTime: workout._creationTime,
					name: workout.name,
					durationSeconds: workout.durationSeconds,
					totalVolume: workout.totalVolume,
					totalPrSets: workout.totalPrSets,
					exerciseCount: exerciseCounts.get(workout._id) ?? 0,
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
