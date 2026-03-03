import type { MutationCtx } from "../../convex/_generated/server";
import { normalizeExerciseName } from "./normalizeExerciseName";

interface ExerciseWithGlobal {
	global: {
		name: string;
		muscleGroups?: string[];
	};
}

export const getUniqueGlobalExercises = (exercises: ExerciseWithGlobal[]) => {
	const uniqueGlobalExercises = new Map<
		string,
		{ name: string; muscleGroups?: string[] }
	>();

	for (const exercise of exercises) {
		const normalizedName = normalizeExerciseName(exercise.global.name);
		if (!normalizedName || uniqueGlobalExercises.has(normalizedName)) continue;

		uniqueGlobalExercises.set(normalizedName, {
			name: exercise.global.name,
			muscleGroups: exercise.global.muscleGroups,
		});
	}

	return uniqueGlobalExercises;
};

export const insertMissingGlobalExercises = async (
	ctx: MutationCtx,
	globalExercises: Map<string, { name: string; muscleGroups?: string[] }>,
) => {
	for (const [normalizedName, globalExercise] of globalExercises) {
		const existingExercise = await ctx.db
			.query("globalExercises")
			.withIndex("by_normalizedName", (q) =>
				q.eq("normalizedName", normalizedName),
			)
			.first();

		if (existingExercise) continue;

		await ctx.db.insert("globalExercises", {
			name: globalExercise.name,
			normalizedName,
			muscleGroups: globalExercise.muscleGroups,
		});
	}
};
