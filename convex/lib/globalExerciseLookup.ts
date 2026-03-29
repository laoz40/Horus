import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { normalizeName } from "../../lib/normalizeName";

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

async function getOrCreateGlobalExerciseId(
	ctx: MutationCtx,
	global: ExerciseWithGlobal["global"],
	globalExerciseIdCache: Map<string, Id<"globalExercises">>,
): Promise<Id<"globalExercises">> {
	const globalExerciseIdKey = normalizeName(global.name);
	const cachedId = globalExerciseIdCache.get(globalExerciseIdKey);
	if (cachedId) return cachedId;

	const existingExercise = await ctx.db
		.query("globalExercises")
		.withIndex("by_normalizedName", (q) => q.eq("normalizedName", globalExerciseIdKey))
		.first();

	if (existingExercise) {
		globalExerciseIdCache.set(globalExerciseIdKey, existingExercise._id);
		return existingExercise._id;
	}

	const globalExerciseId = await ctx.db.insert("globalExercises", {
		name: global.name,
		normalizedName: globalExerciseIdKey,
		muscleGroups: global.muscleGroups,
	});

	globalExerciseIdCache.set(globalExerciseIdKey, globalExerciseId);

	return globalExerciseId;
}

export async function mapExercisesWithGlobalExerciseIds(
	ctx: MutationCtx,
	exercises: ExerciseWithGlobal[],
): Promise<
	Array<{
		id: string;
		globalExerciseId: Id<"globalExercises">;
		difficulty?: number;
		notes?: string;
		sets: ExerciseWithGlobal["sets"];
	}>
> {
	const globalExerciseIds = new Map<string, Id<"globalExercises">>();

	return Promise.all(
		exercises.map(async (exercise) => {
			const globalExerciseId = await getOrCreateGlobalExerciseId(
				ctx,
				exercise.global,
				globalExerciseIds,
			);

			return {
				id: exercise.id,
				globalExerciseId,
				difficulty: exercise.difficulty,
				notes: exercise.notes,
				sets: exercise.sets,
			};
		}),
	);
}
