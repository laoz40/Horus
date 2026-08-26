import { v } from "convex/values";
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
