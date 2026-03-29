import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

interface WorkoutSetForUi {
	id: string;
	weight: number;
	reps: number;
	completed: boolean;
	order: number;
}

export async function getWorkoutChildrenForUi(
	ctx: QueryCtx,
	workoutId: Id<"workouts">,
): Promise<{
	exercises: Array<{
		id: string;
		global: { name: string; muscleGroups?: string[] };
		difficulty?: number;
		notes?: string;
		sets: Array<{ id: string; weight: number; reps: number; completed: boolean }>;
	}>;
	missingGlobalExercisesCount: number;
}> {
	const [workoutExercises, workoutSets] = await Promise.all([
		ctx.db
			.query("workoutExercises")
			.withIndex("by_workoutId_order", (query) => query.eq("workoutId", workoutId))
			.order("asc")
			.collect(),
		ctx.db
			.query("workoutSets")
			.withIndex("by_workoutId", (query) => query.eq("workoutId", workoutId))
			.collect(),
	]);

	const setsByWorkoutExerciseId = new Map<Id<"workoutExercises">, WorkoutSetForUi[]>();
	for (const workoutSet of workoutSets) {
		const setsForExercise = setsByWorkoutExerciseId.get(workoutSet.workoutExerciseId) ?? [];
		setsForExercise.push({
			id: workoutSet.clientSetId,
			weight: workoutSet.weight,
			reps: workoutSet.reps,
			completed: workoutSet.completed,
			order: workoutSet.order,
		});
		setsByWorkoutExerciseId.set(workoutSet.workoutExerciseId, setsForExercise);
	}

	for (const setsForExercise of setsByWorkoutExerciseId.values()) {
		setsForExercise.sort((left, right) => left.order - right.order);
	}

	const globalExerciseIds = new Set(workoutExercises.map((exercise) => exercise.globalExerciseId));
	const globalExercisesMap = new Map<
		Id<"globalExercises">,
		{ name: string; muscleGroups?: string[] }
	>();

	await Promise.all(
		[...globalExerciseIds].map(async (globalExerciseId) => {
			const globalExercise = await ctx.db.get(globalExerciseId);
			if (!globalExercise) {
				return;
			}

			globalExercisesMap.set(globalExerciseId, {
				name: globalExercise.name,
				...(globalExercise.muscleGroups !== undefined
					? { muscleGroups: globalExercise.muscleGroups }
					: {}),
			});
		}),
	);

	let missingGlobalExercisesCount = 0;
	const exercises = workoutExercises.flatMap((workoutExercise) => {
		const globalExercise = globalExercisesMap.get(workoutExercise.globalExerciseId);
		if (!globalExercise) {
			missingGlobalExercisesCount += 1;
			return [];
		}

		return {
			id: workoutExercise.clientExerciseId,
			global: globalExercise,
			...(workoutExercise.difficulty !== undefined
				? { difficulty: workoutExercise.difficulty }
				: {}),
			...(workoutExercise.notes !== undefined ? { notes: workoutExercise.notes } : {}),
			sets:
				setsByWorkoutExerciseId.get(workoutExercise._id)?.map(({ order: _, ...set }) => set) ?? [],
		};
	});

	return { exercises, missingGlobalExercisesCount };
}
