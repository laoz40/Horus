import { v } from "convex/values";
import {
	emptyExercisePrSummary,
	getSetPrResult,
	hasExercisePrHistory,
	normalizePrSet,
} from "./lib/calculateStatPr";
import { getExercisePrSummary } from "./lib/exercisePrs";
import { errorHandlerWrapper, requireIdentity } from "./lib/server";
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

			// Get this user's saved PRs for this exercise. If this is their first
			// time doing it, start empty.
			const summary =
				(await getExercisePrSummary(ctx, identity.subject, globalExercise._id)) ??
				emptyExercisePrSummary();

			// Start with the PRs already saved in the PR table.
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

			// loop through this workout to also include completed sets
			// that happened before the set we are checking.
			for (const [index, set] of args.sets.entries()) {
				const normalizedSet = normalizePrSet({
					completed: set.completed,
					reps: Number(set.reps) || 0,
					weight: Number(set.weight) || 0,
				});

				// If current set, check if it beats the saved PRs.
				if (index === args.setIndex) {
					return hasHistory
						? getSetPrResult(normalizedSet, currentSummary)
						: { isPr: false, prType: null };
				}

				// Check if previous compelted set beats the saved PRs.
				// Add it to currentSummary so later sets can be compared against it.
				if (normalizedSet.completed) {
					currentSummary = {
						...currentSummary,
						weightPr: Math.max(currentSummary.weightPr, normalizedSet.weight),
						volumePr: Math.max(currentSummary.volumePr, normalizedSet.weight * normalizedSet.reps),
						bodyweightRepsPr: Math.max(
							currentSummary.bodyweightRepsPr,
							normalizedSet.weight === 0 ? normalizedSet.reps : 0,
						),
					};

					// Add history so later sets can be compared against it.
					if (!hasHistory) hasHistory = true;
				}
			}

			return { isPr: false, prType: null };
		}),
});
