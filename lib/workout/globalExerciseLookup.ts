import type { MutationCtx } from "../../convex/_generated/server";
import type { Id } from "../../convex/_generated/dataModel";
import { normalizeExerciseName } from "./normalizeExerciseName";

interface ExerciseWithGlobal {
	id: string;
	difficulty?: number;
	notes?: string;
	sets: {
		id: string;
		weight: number;
		reps: number;
		completed: boolean;
	}[];
	global: {
		name: string;
		muscleGroups?: string[];
	};
}

const getOrCreateGlobalExerciseId = async (
	ctx: MutationCtx,
	global: ExerciseWithGlobal["global"],
	globalExerciseIdCache: Map<string, Id<"globalExercises">>,
): Promise<Id<"globalExercises">> => {
	const globalExerciseIdKey = normalizeExerciseName(global.name);
	// avoid duplicate DB calls for repeated exercises in the same mutation
	// if ID exists in cache, reuse it
	const cachedId = globalExerciseIdCache.get(globalExerciseIdKey);
	if (cachedId) return cachedId;

	const existingExercise = await ctx.db
		.query("globalExercises")
		.withIndex("by_normalizedName", (q) => q.eq("normalizedName", globalExerciseIdKey))
		.first();

	// if existing exercise, cache and reuse existing ID
	if (existingExercise) {
		globalExerciseIdCache.set(globalExerciseIdKey, existingExercise._id);
		return existingExercise._id;
	}

	// if not found, create a new lookup record
	const globalExerciseId = await ctx.db.insert("globalExercises", {
		name: global.name,
		normalizedName: globalExerciseIdKey,
		muscleGroups: global.muscleGroups,
	});

	// cache created ID for later exercises in the same request
	globalExerciseIdCache.set(globalExerciseIdKey, globalExerciseId);

	// only the _id is returned because convex
	return globalExerciseId;
};

export const mapExercisesWithGlobalExerciseIds = async (
	ctx: MutationCtx,
	exercises: ExerciseWithGlobal[],
) => {
	const globalExerciseIds = new Map<string, Id<"globalExercises">>();

	return Promise.all(
		exercises.map(async (exercise) => {
			const globalExerciseId = await getOrCreateGlobalExerciseId(
				ctx,
				exercise.global,
				globalExerciseIds,
			);

			// return exercise payload linked by ID
			return {
				id: exercise.id,
				globalExerciseId,
				difficulty: exercise.difficulty,
				notes: exercise.notes,
				sets: exercise.sets,
			};
		}),
	);
};
