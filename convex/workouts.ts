import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { WorkoutFormData } from "../features/workout-form/lib/types";
import { errorHandlerWrapper, requireIdentity } from "../lib/convex-server";
import { calculateTotalPrSets } from "../lib/workout/calculateStatPr";
import { calculateWorkoutVolume } from "../lib/workout/calculateStatVolume";
import { mapExercisesWithGlobalExerciseIds } from "../lib/workout/globalExerciseLookup";
import { getWorkoutMuscleGroups } from "../lib/workout/getWorkoutMuscleGroups";
import { parseAndValidateWorkout } from "../lib/workout/validateWorkoutInput";
import {
	deleteWorkoutChildren,
	getWorkout,
	insertWorkoutChildren,
} from "../lib/workout/workoutActions";
import { getWorkoutChildrenForUi } from "../lib/workout/workoutQueryData";
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
					reps: v.float64(),
					weight: v.float64(),
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
		}),
});
