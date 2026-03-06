import { query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeExerciseName } from "../lib/workout/normalizeExerciseName";

export const searchGlobalExercises = query({
	args: {
		query: v.string(),
	},
	handler: async (ctx, args) => {
		const query = normalizeExerciseName(args.query);

		const exercises = await ctx.db.query("globalExercises").collect();

		return exercises
			.filter((exercise) => exercise.normalizedName.includes(query))
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 10)
			.map((exercise) => ({
				id: exercise._id,
				name: exercise.name,
				normalizedName: exercise.normalizedName,
				...(exercise.muscleGroups !== undefined
					? { muscleGroups: exercise.muscleGroups }
					: {}),
			}));
	},
});
