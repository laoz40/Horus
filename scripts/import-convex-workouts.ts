import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { z } from "zod";

import { exercises, users, workoutExercises, workouts, workoutSets } from "@/lib/db/schema";
import { calculatePrHistory } from "@/server/lib/pr";

config({ path: ".env.local" });

const importArgumentsSchema = z.object({
	sourcePath: z.string().min(1),
	userId: z.string().min(1),
});

const convexIdSchema = z.string().min(1);
const nonnegativeNumberSchema = z.number().finite().nonnegative();
const positionSchema = z.number().int().nonnegative();

const convexExerciseSchema = z.object({
	_id: convexIdSchema,
	normalizedName: z.string().trim().min(1),
});

const convexWorkoutSchema = z.object({
	_id: convexIdSchema,
	_creationTime: z.number().finite().nonnegative(),
	name: z.string().min(1),
	durationSeconds: z.number().finite().int().nonnegative().nullable(),
});

const convexWorkoutExerciseSchema = z.object({
	_id: convexIdSchema,
	workoutId: convexIdSchema,
	globalExerciseId: convexIdSchema,
	order: positionSchema,
	difficulty: z.number().finite().optional(),
	notes: z.string().optional(),
});

const convexWorkoutSetSchema = z.object({
	_id: convexIdSchema,
	workoutId: convexIdSchema,
	workoutExerciseId: convexIdSchema,
	globalExerciseId: convexIdSchema,
	workoutCreationTime: z.number().finite().nonnegative(),
	order: positionSchema,
	weight: nonnegativeNumberSchema,
	reps: nonnegativeNumberSchema,
	completed: z.boolean(),
});

type ImportArguments = z.infer<typeof importArgumentsSchema>;
type ConvexExercise = z.infer<typeof convexExerciseSchema>;
type ConvexWorkout = z.infer<typeof convexWorkoutSchema>;
type ConvexWorkoutExercise = z.infer<typeof convexWorkoutExerciseSchema>;
type ConvexWorkoutSet = z.infer<typeof convexWorkoutSetSchema>;

type ImportSummary = {
	sourceWorkoutCount: number;
	importedWorkoutCount: number;
	importedWorkoutExerciseCount: number;
	importedSetCount: number;
};

function readImportArguments(argumentsList: string[]): ImportArguments {
	const sourcePathIndex = argumentsList.indexOf("--source");
	const userIdIndex = argumentsList.indexOf("--user-id");
	const sourcePath = argumentsList[sourcePathIndex + 1];
	const userId = argumentsList[userIdIndex + 1];

	return importArgumentsSchema.parse({ sourcePath, userId });
}

async function readJsonLines<T>(filePath: string, schema: z.ZodType<T>): Promise<T[]> {
	const source = await readFile(filePath, "utf8");

	return source
		.split("\n")
		.filter((line) => line.trim().length > 0)
		.map((line, index) => {
			try {
				const parsedLine: unknown = JSON.parse(line);
				return schema.parse(parsedLine);
			} catch (error: unknown) {
				throw new Error(`Invalid record at ${filePath}:${index + 1}.`, { cause: error });
			}
		});
}

function assertUniqueIds(records: Array<{ _id: string }>, tableName: string): void {
	const ids = new Set<string>();
	for (const record of records) {
		if (ids.has(record._id)) {
			throw new Error(`Duplicate ${tableName} ID in source: ${record._id}.`);
		}
		ids.add(record._id);
	}
}

function assertUniquePositions(
	records: Array<{ _id: string; positionParentId: string; position: number }>,
	tableName: string,
): void {
	const positions = new Set<string>();
	for (const record of records) {
		const key = `${record.positionParentId}:${record.position}`;
		if (positions.has(key)) {
			throw new Error(
				`Duplicate ${tableName} position ${record.position} under ${record.positionParentId}.`,
			);
		}
		positions.add(key);
	}
}

async function readConvexExport(sourcePath: string): Promise<{
	exercises: ConvexExercise[];
	workouts: ConvexWorkout[];
	workoutExercises: ConvexWorkoutExercise[];
	workoutSets: ConvexWorkoutSet[];
}> {
	const exportRoot = resolve(sourcePath);
	const [sourceExercises, sourceWorkouts, sourceWorkoutExercises, sourceWorkoutSets] =
		await Promise.all([
			readJsonLines(resolve(exportRoot, "globalExercises/documents.jsonl"), convexExerciseSchema),
			readJsonLines(resolve(exportRoot, "workouts/documents.jsonl"), convexWorkoutSchema),
			readJsonLines(
				resolve(exportRoot, "workoutExercises/documents.jsonl"),
				convexWorkoutExerciseSchema,
			),
			readJsonLines(resolve(exportRoot, "workoutSets/documents.jsonl"), convexWorkoutSetSchema),
		]);

	assertUniqueIds(sourceExercises, "globalExercises");
	assertUniqueIds(sourceWorkouts, "workouts");
	assertUniqueIds(sourceWorkoutExercises, "workoutExercises");
	assertUniqueIds(sourceWorkoutSets, "workoutSets");
	assertUniquePositions(
		sourceWorkoutExercises.map((exercise) => ({
			_id: exercise._id,
			positionParentId: exercise.workoutId,
			position: exercise.order,
		})),
		"workoutExercises",
	);
	assertUniquePositions(
		sourceWorkoutSets.map((set) => ({
			_id: set._id,
			positionParentId: set.workoutExerciseId,
			position: set.order,
		})),
		"workoutSets",
	);

	return {
		exercises: sourceExercises,
		workouts: sourceWorkouts,
		workoutExercises: sourceWorkoutExercises,
		workoutSets: sourceWorkoutSets,
	};
}

async function importWorkouts({ sourcePath, userId }: ImportArguments): Promise<ImportSummary> {
	const databaseUrl = z.url().parse(process.env.DATABASE_URL);
	const pool = new Pool({ connectionString: databaseUrl });
	const db = drizzle({ client: pool });
	const source = await readConvexExport(sourcePath);

	try {
		return await db.transaction(async (tx) => {
			const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId));
			if (!user) {
				throw new Error("Target user does not exist in the database selected by DATABASE_URL.");
			}

			const [existingWorkout] = await tx
				.select({ id: workouts.id })
				.from(workouts)
				.where(eq(workouts.userId, userId))
				.limit(1);
			if (existingWorkout) {
				throw new Error(
					"Target user already has workouts. Import into an empty history to prevent duplicates.",
				);
			}

			const targetExercises = await tx
				.select({ id: exercises.id, normalizedName: exercises.normalizedName })
				.from(exercises)
				.where(eq(exercises.userId, userId));
			const targetExerciseIdByNormalizedName = new Map(
				targetExercises.map((exercise) => [exercise.normalizedName, exercise.id]),
			);
			const sourceExerciseById = new Map(
				source.exercises.map((exercise) => [exercise._id, exercise]),
			);

			const targetExerciseIdBySourceId = new Map<string, string>();
			for (const sourceExercise of source.exercises) {
				const targetExerciseId = targetExerciseIdByNormalizedName.get(
					sourceExercise.normalizedName,
				);
				if (targetExerciseId) {
					targetExerciseIdBySourceId.set(sourceExercise._id, targetExerciseId);
				}
			}

			const sourceWorkoutById = new Map(source.workouts.map((workout) => [workout._id, workout]));
			const sourceWorkoutExerciseById = new Map(
				source.workoutExercises.map((exercise) => [exercise._id, exercise]),
			);
			const targetWorkoutIdBySourceId = new Map<string, string>();
			const targetWorkoutExerciseIdBySourceId = new Map<string, string>();

			for (const sourceWorkout of source.workouts) {
				const [targetWorkout] = await tx
					.insert(workouts)
					.values({
						userId,
						name: sourceWorkout.name,
						durationSeconds: sourceWorkout.durationSeconds,
						createdAt: new Date(sourceWorkout._creationTime),
					})
					.returning({ id: workouts.id });
				targetWorkoutIdBySourceId.set(sourceWorkout._id, targetWorkout.id);
			}

			for (const sourceWorkoutExercise of source.workoutExercises) {
				const sourceWorkout = sourceWorkoutById.get(sourceWorkoutExercise.workoutId);
				if (!sourceWorkout) {
					throw new Error(
						`Workout exercise ${sourceWorkoutExercise._id} references a missing workout.`,
					);
				}
				const sourceExercise = sourceExerciseById.get(sourceWorkoutExercise.globalExerciseId);
				if (!sourceExercise) {
					throw new Error(
						`Workout exercise ${sourceWorkoutExercise._id} references a missing global exercise.`,
					);
				}
				const targetExerciseId = targetExerciseIdBySourceId.get(sourceExercise._id);
				if (!targetExerciseId) {
					throw new Error(
						`Exercise ${sourceExercise.normalizedName} is missing for the target user. Run migration:import-exercises first.`,
					);
				}

				const [targetWorkoutExercise] = await tx
					.insert(workoutExercises)
					.values({
						workoutId: targetWorkoutIdBySourceId.get(sourceWorkout._id)!,
						exerciseId: targetExerciseId,
						position: sourceWorkoutExercise.order,
						difficulty: sourceWorkoutExercise.difficulty,
						notes: sourceWorkoutExercise.notes ?? "",
					})
					.returning({ id: workoutExercises.id });
				targetWorkoutExerciseIdBySourceId.set(sourceWorkoutExercise._id, targetWorkoutExercise.id);
			}

			const prHistorySets = source.workoutSets.map((sourceSet) => {
				const sourceWorkout = sourceWorkoutById.get(sourceSet.workoutId);
				const sourceWorkoutExercise = sourceWorkoutExerciseById.get(sourceSet.workoutExerciseId);
				if (!sourceWorkout || !sourceWorkoutExercise) {
					throw new Error(`Workout set ${sourceSet._id} references a missing parent.`);
				}
				if (
					sourceWorkoutExercise.workoutId !== sourceSet.workoutId ||
					sourceWorkoutExercise.globalExerciseId !== sourceSet.globalExerciseId ||
					sourceWorkout._creationTime !== sourceSet.workoutCreationTime
				) {
					throw new Error(`Workout set ${sourceSet._id} has inconsistent denormalized references.`);
				}

				const exerciseId = targetExerciseIdBySourceId.get(sourceSet.globalExerciseId);
				if (!exerciseId) {
					throw new Error(
						`Workout set ${sourceSet._id} references an exercise that was not imported.`,
					);
				}

				return {
					setId: sourceSet._id,
					workoutId: sourceSet.workoutId,
					exerciseId,
					weight: sourceSet.weight,
					reps: sourceSet.reps,
					completed: sourceSet.completed,
					sortTime: sourceWorkout._creationTime,
					exercisePosition: sourceWorkoutExercise.order,
					setPosition: sourceSet.order,
				};
			});
			prHistorySets.sort(
				(left, right) =>
					left.sortTime - right.sortTime ||
					left.workoutId.localeCompare(right.workoutId) ||
					left.exercisePosition - right.exercisePosition ||
					left.setPosition - right.setPosition,
			);

			const prStatuses = calculatePrHistory(prHistorySets);
			const prStatusBySourceSetId = new Map(prStatuses.map((status) => [status.setId, status]));
			const prSetCountBySourceWorkoutId = new Map<string, number>();

			for (const sourceSet of source.workoutSets) {
				const prStatus = prStatusBySourceSetId.get(sourceSet._id);
				const targetWorkoutExerciseId = targetWorkoutExerciseIdBySourceId.get(
					sourceSet.workoutExerciseId,
				);
				if (!prStatus || !targetWorkoutExerciseId) {
					throw new Error(`Workout set ${sourceSet._id} could not be prepared for import.`);
				}

				await tx.insert(workoutSets).values({
					workoutExerciseId: targetWorkoutExerciseId,
					position: sourceSet.order,
					weight: sourceSet.weight,
					reps: sourceSet.reps,
					completed: sourceSet.completed,
					isWeightPr: prStatus.isWeightPr,
					isVolumePr: prStatus.isVolumePr,
					isBodyweightRepsPr: prStatus.isBodyweightRepsPr,
				});

				if (prStatus.isWeightPr || prStatus.isVolumePr || prStatus.isBodyweightRepsPr) {
					const currentCount = prSetCountBySourceWorkoutId.get(sourceSet.workoutId) ?? 0;
					prSetCountBySourceWorkoutId.set(sourceSet.workoutId, currentCount + 1);
				}
			}

			for (const [sourceWorkoutId, totalPrSets] of prSetCountBySourceWorkoutId) {
				const targetWorkoutId = targetWorkoutIdBySourceId.get(sourceWorkoutId);
				if (!targetWorkoutId) {
					throw new Error(`Workout ${sourceWorkoutId} was not imported.`);
				}
				await tx.update(workouts).set({ totalPrSets }).where(eq(workouts.id, targetWorkoutId));
			}

			return {
				sourceWorkoutCount: source.workouts.length,
				importedWorkoutCount: targetWorkoutIdBySourceId.size,
				importedWorkoutExerciseCount: targetWorkoutExerciseIdBySourceId.size,
				importedSetCount: source.workoutSets.length,
			};
		});
	} finally {
		await pool.end();
	}
}

async function main(): Promise<void> {
	const argumentsList = readImportArguments(process.argv.slice(2));
	const summary = await importWorkouts(argumentsList);

	console.log("Convex workout history import completed.");
	console.table(summary);
}

main().catch((error: unknown) => {
	console.error("Convex workout history import failed.");
	console.error(error);
	process.exitCode = 1;
});
