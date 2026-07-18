import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { z } from "zod";

import { normalizeName } from "@/lib/normalizeName";
import { exerciseMuscleGroups, exercises, muscleGroups, users } from "@/lib/db/schema";

config({ path: ".env.local" });

const importArgumentsSchema = z.object({
	sourcePath: z.string().min(1),
	userId: z.string().min(1),
});

const convexExerciseSchema = z.object({
	_id: z.string().min(1),
	name: z.string().trim().min(1),
	normalizedName: z.string().trim().min(1),
	muscleGroups: z.array(z.string()).optional().default([]),
});

type ConvexExercise = z.infer<typeof convexExerciseSchema>;

type ImportArguments = z.infer<typeof importArgumentsSchema>;

type ImportSummary = {
	createdExerciseCount: number;
	existingExerciseCount: number;
	linkedMuscleGroupCount: number;
	sourceExerciseCount: number;
};

function readImportArguments(argumentsList: string[]): ImportArguments {
	const sourcePathIndex = argumentsList.indexOf("--source");
	const userIdIndex = argumentsList.indexOf("--user-id");
	const sourcePath = argumentsList[sourcePathIndex + 1];
	const userId = argumentsList[userIdIndex + 1];

	return importArgumentsSchema.parse({ sourcePath, userId });
}

async function readConvexExercises(sourcePath: string): Promise<ConvexExercise[]> {
	const source = await readFile(resolve(sourcePath), "utf8");

	return source
		.split("\n")
		.filter((line) => line.trim().length > 0)
		.map((line, index) => {
			const parsedLine: unknown = JSON.parse(line);
			const exercise = convexExerciseSchema.parse(parsedLine);

			if (normalizeName(exercise.name) !== exercise.normalizedName) {
				throw new Error(`Invalid normalized name at source line ${index + 1}.`);
			}

			return exercise;
		});
}

function getDistinctMuscleGroups(exercise: ConvexExercise): string[] {
	return Array.from(
		new Map(
			exercise.muscleGroups
				.map((muscleGroup) => muscleGroup.trim())
				.filter((muscleGroup) => muscleGroup.length > 0)
				.map((muscleGroup) => [normalizeName(muscleGroup), muscleGroup]),
		).values(),
	);
}

async function importExercises({ sourcePath, userId }: ImportArguments): Promise<ImportSummary> {
	const databaseUrl = z.url().parse(process.env.DATABASE_URL);
	const pool = new Pool({ connectionString: databaseUrl });
	const db = drizzle({ client: pool });
	const sourceExercises = await readConvexExercises(sourcePath);

	const sourceExerciseNames = new Set<string>();
	for (const exercise of sourceExercises) {
		if (sourceExerciseNames.has(exercise.normalizedName)) {
			throw new Error(`Duplicate normalized exercise name in source: ${exercise.normalizedName}.`);
		}
		sourceExerciseNames.add(exercise.normalizedName);
	}

	try {
		return await db.transaction(async (tx) => {
			const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId));
			if (!user) {
				throw new Error("Target user does not exist in the database selected by DATABASE_URL.");
			}

			const summary: ImportSummary = {
				createdExerciseCount: 0,
				existingExerciseCount: 0,
				linkedMuscleGroupCount: 0,
				sourceExerciseCount: sourceExercises.length,
			};

			for (const sourceExercise of sourceExercises) {
				const [insertedExercise] = await tx
					.insert(exercises)
					.values({
						userId,
						name: sourceExercise.name,
						normalizedName: sourceExercise.normalizedName,
					})
					.onConflictDoNothing()
					.returning({ id: exercises.id });

				const exercise = insertedExercise
					? insertedExercise
					: await tx
							.select({ id: exercises.id })
							.from(exercises)
							.where(
								and(
									eq(exercises.userId, userId),
									eq(exercises.normalizedName, sourceExercise.normalizedName),
								),
							)
							.then(([existingExercise]) => existingExercise);

				if (!exercise) {
					throw new Error(`Could not create or find exercise: ${sourceExercise.name}.`);
				}

				if (insertedExercise) {
					summary.createdExerciseCount += 1;
				} else {
					summary.existingExerciseCount += 1;
				}

				for (const muscleGroupName of getDistinctMuscleGroups(sourceExercise)) {
					const normalizedMuscleGroupName = normalizeName(muscleGroupName);
					const [insertedMuscleGroup] = await tx
						.insert(muscleGroups)
						.values({ name: muscleGroupName, normalizedName: normalizedMuscleGroupName })
						.onConflictDoNothing()
						.returning({ id: muscleGroups.id });

					const muscleGroup = insertedMuscleGroup
						? insertedMuscleGroup
						: await tx
								.select({ id: muscleGroups.id })
								.from(muscleGroups)
								.where(eq(muscleGroups.normalizedName, normalizedMuscleGroupName))
								.then(([existingMuscleGroup]) => existingMuscleGroup);

					if (!muscleGroup) {
						throw new Error(`Could not create or find muscle group: ${muscleGroupName}.`);
					}

					const insertedLink = await tx
						.insert(exerciseMuscleGroups)
						.values({ exerciseId: exercise.id, muscleGroupId: muscleGroup.id })
						.onConflictDoNothing()
						.returning({ exerciseId: exerciseMuscleGroups.exerciseId });

					if (insertedLink.length > 0) {
						summary.linkedMuscleGroupCount += 1;
					}
				}
			}

			return summary;
		});
	} finally {
		await pool.end();
	}
}

async function main(): Promise<void> {
	const argumentsList = readImportArguments(process.argv.slice(2));
	const summary = await importExercises(argumentsList);

	console.log("Convex exercise import completed.");
	console.table(summary);
}

main().catch((error: unknown) => {
	console.error("Convex exercise import failed.");
	console.error(error);
	process.exitCode = 1;
});
