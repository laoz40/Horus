import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { WorkoutFormData } from "../features/workout-form/lib/types";
import { getExercisePrSummaries } from "./lib/exercisePrs";
import { calculateWorkoutVolume } from "./lib/calculateStatVolume";
import {
	adjustDailySetStat,
	countCompletedSets,
	deleteDailySetStatsForUser,
	getUtcDayKey,
} from "./lib/dailySetStats";
import { getWorkoutMuscleGroups } from "./lib/getWorkoutMuscleGroups";
import { mapExercisesWithGlobalExerciseIds } from "./lib/globalExerciseLookup";
import { parseAndValidateWorkout } from "./lib/parseAndValidateWorkout";
import {
	rebuildExercisePrsForUser,
	rebuildMissingExercisePrsForUser,
} from "./lib/rebuildExercisePrs";
import { getWorkoutChildrenForUi } from "./lib/workoutChildrenForUi";
import {
	deleteWorkoutChildren,
	getWorkout,
	getWorkoutExerciseGlobalIds,
	insertWorkoutChildren,
	insertWorkoutChildrenWithPrs,
} from "./lib/workoutActions";
import { errorHandlerWrapper, requireIdentity } from "./lib/server";
import { mutation, query } from "./_generated/server";

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
					reps: v.optional(v.float64()),
					weight: v.optional(v.float64()),
				}),
			),
		}),
	),
	name: v.string(),
});

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
				workoutData.exercises,
			);
			const globalExerciseIds = exercisesWithGlobalExerciseIds.map(
				(exercise) => exercise.globalExerciseId,
			);
			await rebuildMissingExercisePrsForUser(ctx, {
				userId: identity.subject,
				globalExerciseIds,
			});
			const exercisePrSummaries = await getExercisePrSummaries(
				ctx,
				identity.subject,
				globalExerciseIds,
			);
			const muscleGroups = getWorkoutMuscleGroups(workoutData);
			const totalVolume = calculateWorkoutVolume(workoutData);
			const setCount = countCompletedSets(exercisesWithGlobalExerciseIds);

			const workoutId = await ctx.db.insert("workouts", {
				name: workoutData.name,
				durationSeconds: workoutData.durationSeconds,
				exerciseCount: exercisesWithGlobalExerciseIds.length,
				setCount,
				muscleGroups,
				totalPrSets: 0,
				totalVolume,
				userId: identity.subject,
			});
			const workout = await ctx.db.get(workoutId);
			if (!workout) throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId });

			const totalPrSets = await insertWorkoutChildrenWithPrs(ctx, {
				workoutId,
				userId: identity.subject,
				workoutCreationTime: workout._creationTime,
				exercises: exercisesWithGlobalExerciseIds,
				exercisePrSummaries,
			});
			await ctx.db.patch(workoutId, { totalPrSets });
			await adjustDailySetStat(ctx, {
				userId: identity.subject,
				dayKey: getUtcDayKey(workout._creationTime),
				delta: setCount,
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

			const oldGlobalExerciseIds = await getWorkoutExerciseGlobalIds(ctx, args.workoutId);
			const exercisesWithGlobalExerciseIds = await mapExercisesWithGlobalExerciseIds(
				ctx,
				workoutData.exercises,
			);
			const affectedGlobalExerciseIds = [
				...oldGlobalExerciseIds,
				...exercisesWithGlobalExerciseIds.map((exercise) => exercise.globalExerciseId),
			];
			const muscleGroups = getWorkoutMuscleGroups(workoutData);
			const totalVolume = calculateWorkoutVolume(workoutData);
			const setCount = countCompletedSets(exercisesWithGlobalExerciseIds);

			// update the workout row in the workouts table
			await ctx.db.patch(args.workoutId, {
				name: workoutData.name,
				durationSeconds: workoutData.durationSeconds,
				exerciseCount: exercisesWithGlobalExerciseIds.length,
				setCount,
				muscleGroups,
				totalPrSets: 0,
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
			await rebuildExercisePrsForUser(ctx, {
				userId: identity.subject,
				globalExerciseIds: affectedGlobalExerciseIds,
			});
			await adjustDailySetStat(ctx, {
				userId: identity.subject,
				dayKey: getUtcDayKey(workout._creationTime),
				delta: setCount - (workout.setCount ?? 0),
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
			const affectedGlobalExerciseIds = await getWorkoutExerciseGlobalIds(ctx, args.workoutId);

			await adjustDailySetStat(ctx, {
				userId: identity.subject,
				dayKey: getUtcDayKey(workout._creationTime),
				delta: -(workout.setCount ?? 0),
			});
			await deleteWorkoutChildren(ctx, args.workoutId);
			await ctx.db.delete(args.workoutId);
			await rebuildExercisePrsForUser(ctx, {
				userId: identity.subject,
				globalExerciseIds: affectedGlobalExerciseIds,
			});

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

			await deleteDailySetStatsForUser(ctx, identity.subject);
			const exercisePrs = await ctx.db
				.query("exercisePrs")
				.withIndex("by_userId", (query) => query.eq("userId", identity.subject))
				.collect();

			const DELETE_BATCH_SIZE = 25;
			for (let index = 0; index < workouts.length; index += DELETE_BATCH_SIZE) {
				const batch = workouts.slice(index, index + DELETE_BATCH_SIZE);
				for (const workout of batch) {
					await deleteWorkoutChildren(ctx, workout._id);
					await ctx.db.delete(workout._id);
				}
			}
			for (let index = 0; index < exercisePrs.length; index += DELETE_BATCH_SIZE) {
				const batch = exercisePrs.slice(index, index + DELETE_BATCH_SIZE);
				await Promise.all(batch.map((exercisePr) => ctx.db.delete(exercisePr._id)));
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
		}),
});
