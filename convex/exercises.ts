import { v } from "convex/values";
import {
	calculateSetPrResult,
	emptyExercisePrSummary,
	getSetPrResult,
	hasExercisePrHistory,
	normalizePrSet,
	updateExercisePrs,
} from "./lib/calculateStatPr";
import { getExercisePrSummary } from "./lib/exercisePrs";
import { errorHandlerWrapper, requireIdentity } from "./lib/server";
import { getRelativeTime } from "../lib/date";
import { normalizeName } from "../lib/normalizeName";
import { query } from "./_generated/server";

export const searchGlobalExercises = query({
	args: {
		query: v.string(),
	},
	handler: async (ctx, args) => {
		const query = normalizeName(args.query);
		if (query.length === 0) return [];

		const exercises = await ctx.db.query("globalExercises").collect();

		return exercises
			.filter((exercise) => exercise.normalizedName.includes(query))
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 10)
			.map((exercise) => ({
				id: exercise._id,
				name: exercise.name,
				normalizedName: exercise.normalizedName,
				...(exercise.muscleGroups !== undefined ? { muscleGroups: exercise.muscleGroups } : {}),
			}));
	},
});

export const getRecentCompletedSetsByExerciseName = query({
	args: {
		exerciseName: v.string(),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);

			const exerciseName = normalizeName(args.exerciseName);
			const globalExercise = await ctx.db
				.query("globalExercises")
				.withIndex("by_normalizedName", (query) => query.eq("normalizedName", exerciseName))
				.first();
			if (!globalExercise) return [];

			const recentCompletedSets = await ctx.db
				.query("workoutSets")
				.withIndex("by_userId_globalExerciseId_completed_workoutCreationTime_order", (query) =>
					query
						.eq("userId", identity.subject)
						.eq("globalExerciseId", globalExercise._id)
						.eq("completed", true),
				)
				.order("desc")
				.take(6);
			const currentPrSummary = await getExercisePrSummary(
				ctx,
				identity.subject,
				globalExercise._id,
			);

			return recentCompletedSets.map((set) => {
				const prTypes: Array<"weight" | "volume" | "bodyweightReps"> = [];

				if (set.isCurrentWeightPr === true || currentPrSummary?.weightPrSetId === set._id) {
					prTypes.push("weight");
				}
				if (set.isCurrentVolumePr === true || currentPrSummary?.volumePrSetId === set._id) {
					prTypes.push("volume");
				}
				if (
					set.isCurrentBodyweightRepsPr === true ||
					currentPrSummary?.bodyweightRepsPrSetId === set._id
				) {
					prTypes.push("bodyweightReps");
				}

				return {
					weight: set.weight,
					reps: set.reps,
					time: getRelativeTime(new Date(set.workoutCreationTime as number)),
					isPr: prTypes.length > 0,
					prTypes,
				};
			});
		}),
});

export const checkCompletedSetPrByExerciseName = query({
	args: {
		exerciseName: v.string(),
		sets: v.array(
			v.object({
				completed: v.boolean(),
				reps: v.optional(v.float64()),
				weight: v.optional(v.float64()),
			}),
		),
		setIndex: v.number(),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);

			const exerciseName = normalizeName(args.exerciseName);
			const globalExercise = await ctx.db
				.query("globalExercises")
				.withIndex("by_normalizedName", (query) => query.eq("normalizedName", exerciseName))
				.first();

			if (!globalExercise) return { isPr: false, prType: null };

			const summary = await getExercisePrSummary(ctx, identity.subject, globalExercise._id);

			if (!summary) {
				const previousSets = (
					await ctx.db
						.query("workoutSets")
						.withIndex("by_userId_globalExerciseId_completed_workoutCreationTime_order", (query) =>
							query
								.eq("userId", identity.subject)
								.eq("globalExerciseId", globalExercise._id)
								.eq("completed", true),
						)
						.collect()
				).map((set) => ({
					globalExerciseId: globalExercise._id,
					weight: set.weight,
					reps: set.reps,
					completed: set.completed,
				}));

				return calculateSetPrResult(
					previousSets,
					globalExercise._id,
					args.sets.map((set) => ({
						completed: set.completed,
						reps: Number(set.reps) || 0,
						weight: Number(set.weight) || 0,
					})),
					args.setIndex,
				);
			}

			let currentSummary = {
				...emptyExercisePrSummary(),
				weightPr: summary.weightPr,
				weightPrSetId: summary.weightPrSetId,
				volumePr: summary.volumePr,
				volumePrSetId: summary.volumePrSetId,
				bodyweightRepsPr: summary.bodyweightRepsPr,
				bodyweightRepsPrSetId: summary.bodyweightRepsPrSetId,
			};
			let hasHistory = hasExercisePrHistory(currentSummary);

			for (const [index, set] of args.sets.entries()) {
				const normalizedSet = normalizePrSet({
					completed: set.completed,
					reps: Number(set.reps) || 0,
					weight: Number(set.weight) || 0,
				});

				if (index === args.setIndex) {
					return hasHistory
						? getSetPrResult(normalizedSet, currentSummary)
						: { isPr: false, prType: null };
				}

				currentSummary = {
					...currentSummary,
					...updateExercisePrs(normalizedSet, currentSummary),
				};
				if (!hasHistory && normalizedSet.completed) hasHistory = true;
			}

			return { isPr: false, prType: null };
		}),
});
