import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	numeric,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/lib/db/schema/auth";

export const muscleGroups = pgTable(
	"muscle_groups",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		normalizedName: text("normalized_name").notNull(),
	},
	(table) => [uniqueIndex("muscle_groups_normalized_name_unique").on(table.normalizedName)],
);

export const exercises = pgTable(
	"exercises",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		normalizedName: text("normalized_name").notNull(),
	},
	(table) => [
		uniqueIndex("exercises_user_id_normalized_name_unique").on(
			table.userId,
			table.normalizedName,
		),
	],
);

export const exerciseMuscleGroups = pgTable(
	"exercise_muscle_groups",
	{
		exerciseId: uuid("exercise_id")
			.notNull()
			.references(() => exercises.id, { onDelete: "cascade" }),
		muscleGroupId: uuid("muscle_group_id")
			.notNull()
			.references(() => muscleGroups.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({
			name: "exercise_muscle_groups_primary_key",
			columns: [table.exerciseId, table.muscleGroupId],
		}),
		index("exercise_muscle_groups_muscle_group_id_index").on(table.muscleGroupId),
	],
);

export const workouts = pgTable(
	"workouts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		durationSeconds: integer("duration_seconds"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("workouts_user_id_created_at_index").on(table.userId, table.createdAt),
		check("workouts_duration_seconds_nonnegative", sql`${table.durationSeconds} >= 0`),
	],
);

export const workoutExercises = pgTable(
	"workout_exercises",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		workoutId: uuid("workout_id")
			.notNull()
			.references(() => workouts.id, { onDelete: "cascade" }),
		exerciseId: uuid("exercise_id")
			.notNull()
			.references(() => exercises.id),
		position: integer("position").notNull(),
		difficulty: numeric("difficulty", { mode: "number" }),
		notes: text("notes").notNull().default(""),
	},
	(table) => [
		uniqueIndex("workout_exercises_workout_id_position_unique").on(
			table.workoutId,
			table.position,
		),
		index("workout_exercises_exercise_id_index").on(table.exerciseId),
		check("workout_exercises_position_nonnegative", sql`${table.position} >= 0`),
	],
);

export const workoutSets = pgTable(
	"workout_sets",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		workoutExerciseId: uuid("workout_exercise_id")
			.notNull()
			.references(() => workoutExercises.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		weight: numeric("weight", { mode: "number" }).notNull(),
		reps: numeric("reps", { mode: "number" }).notNull(),
		completed: boolean("completed").notNull().default(false),
	},
	(table) => [
		uniqueIndex("workout_sets_workout_exercise_id_position_unique").on(
			table.workoutExerciseId,
			table.position,
		),
		check("workout_sets_position_nonnegative", sql`${table.position} >= 0`),
		check("workout_sets_weight_nonnegative", sql`${table.weight} >= 0`),
		check("workout_sets_reps_nonnegative", sql`${table.reps} >= 0`),
	],
);
