import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { emptyExercisePrSummary, type ExercisePrSummary } from "./calculateStatPr";

export type CurrentPrType = "weight" | "volume" | "bodyweightReps";

type DbCtx = MutationCtx | QueryCtx;

export async function getExercisePrSummary(
	ctx: DbCtx,
	userId: string,
	globalExerciseId: Id<"globalExercises">,
): Promise<Doc<"exercisePrs"> | null> {
	return await ctx.db
		.query("exercisePrs")
		.withIndex("by_userId_globalExerciseId", (query) =>
			query.eq("userId", userId).eq("globalExerciseId", globalExerciseId),
		)
		.first();
}

export async function getExercisePrSummaries(
	ctx: DbCtx,
	userId: string,
	globalExerciseIds: Id<"globalExercises">[],
): Promise<Map<Id<"globalExercises">, ExercisePrSummary>> {
	const uniqueIds = [...new Set(globalExerciseIds)];
	const summaries = await Promise.all(
		uniqueIds.map(async (globalExerciseId) => ({
			globalExerciseId,
			summary: await getExercisePrSummary(ctx, userId, globalExerciseId),
		})),
	);

	return new Map(
		summaries.map(({ globalExerciseId, summary }) => [
			globalExerciseId,
			summary ?? emptyExercisePrSummary(),
		]),
	);
}

export async function upsertExercisePrSummary(
	ctx: MutationCtx,
	userId: string,
	globalExerciseId: Id<"globalExercises">,
	summary: ExercisePrSummary,
): Promise<void> {
	const existing = await getExercisePrSummary(ctx, userId, globalExerciseId);
	const patch = {
		weightPr: summary.weightPr,
		weightPrSetId: summary.weightPrSetId,
		volumePr: summary.volumePr,
		volumePrSetId: summary.volumePrSetId,
		bodyweightRepsPr: summary.bodyweightRepsPr,
		bodyweightRepsPrSetId: summary.bodyweightRepsPrSetId,
	};

	if (existing) {
		await ctx.db.patch(existing._id, patch);
		return;
	}

	await ctx.db.insert("exercisePrs", {
		userId,
		globalExerciseId,
		...patch,
	});
}

export async function clearCurrentPrFlags(
	ctx: MutationCtx,
	args: {
		weightPrSetId?: Id<"workoutSets"> | null;
		volumePrSetId?: Id<"workoutSets"> | null;
		bodyweightRepsPrSetId?: Id<"workoutSets"> | null;
	},
): Promise<void> {
	const patches = new Map<
		Id<"workoutSets">,
		{
			isCurrentWeightPr?: boolean;
			isCurrentVolumePr?: boolean;
			isCurrentBodyweightRepsPr?: boolean;
		}
	>();

	if (args.weightPrSetId) {
		patches.set(args.weightPrSetId, {
			...(patches.get(args.weightPrSetId) ?? {}),
			isCurrentWeightPr: false,
		});
	}
	if (args.volumePrSetId) {
		patches.set(args.volumePrSetId, {
			...(patches.get(args.volumePrSetId) ?? {}),
			isCurrentVolumePr: false,
		});
	}
	if (args.bodyweightRepsPrSetId) {
		patches.set(args.bodyweightRepsPrSetId, {
			...(patches.get(args.bodyweightRepsPrSetId) ?? {}),
			isCurrentBodyweightRepsPr: false,
		});
	}

	await Promise.all([...patches].map(([setId, patch]) => ctx.db.patch(setId, patch)));
}

export function getCurrentPrTypesForSet(
	set: Pick<
		Doc<"workoutSets">,
		"_id" | "isCurrentWeightPr" | "isCurrentVolumePr" | "isCurrentBodyweightRepsPr"
	>,
	summary: Pick<
		Doc<"exercisePrs">,
		"weightPrSetId" | "volumePrSetId" | "bodyweightRepsPrSetId"
	> | null,
): CurrentPrType[] {
	const prTypes: CurrentPrType[] = [];

	if (set.isCurrentWeightPr === true || summary?.weightPrSetId === set._id) {
		prTypes.push("weight");
	}
	if (set.isCurrentVolumePr === true || summary?.volumePrSetId === set._id) {
		prTypes.push("volume");
	}
	if (set.isCurrentBodyweightRepsPr === true || summary?.bodyweightRepsPrSetId === set._id) {
		prTypes.push("bodyweightReps");
	}

	return prTypes;
}

export async function markCurrentPrFlags(
	ctx: MutationCtx,
	summary: ExercisePrSummary,
): Promise<void> {
	const patches = new Map<
		Id<"workoutSets">,
		{
			isCurrentWeightPr?: boolean;
			isCurrentVolumePr?: boolean;
			isCurrentBodyweightRepsPr?: boolean;
		}
	>();

	if (summary.weightPrSetId) {
		patches.set(summary.weightPrSetId, {
			...(patches.get(summary.weightPrSetId) ?? {}),
			isCurrentWeightPr: true,
		});
	}
	if (summary.volumePrSetId) {
		patches.set(summary.volumePrSetId, {
			...(patches.get(summary.volumePrSetId) ?? {}),
			isCurrentVolumePr: true,
		});
	}
	if (summary.bodyweightRepsPrSetId) {
		patches.set(summary.bodyweightRepsPrSetId, {
			...(patches.get(summary.bodyweightRepsPrSetId) ?? {}),
			isCurrentBodyweightRepsPr: true,
		});
	}

	await Promise.all([...patches].map(([setId, patch]) => ctx.db.patch(setId, patch)));
}
