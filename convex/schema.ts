import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	globalExercises: defineTable({
		muscleGroups: v.optional(v.array(v.string())),
		name: v.string(),
		normalizedName: v.string(),
	}).index("by_normalizedName", ["normalizedName"]),
	workouts: defineTable({
		durationSeconds: v.union(v.float64(), v.null()),
		exerciseCount: v.optional(v.float64()),
		muscleGroups: v.optional(v.array(v.string())),
		name: v.string(),
		totalPrSets: v.float64(),
		totalVolume: v.float64(),
		userId: v.string(),
	}).index("by_userId", ["userId"]),
	workoutExercises: defineTable({
		workoutId: v.id("workouts"),
		userId: v.string(),
		order: v.float64(),
		clientExerciseId: v.string(),
		globalExerciseId: v.id("globalExercises"),
		difficulty: v.optional(v.float64()),
		notes: v.optional(v.string()),
	})
		.index("by_workoutId", ["workoutId"])
		.index("by_workoutId_order", ["workoutId", "order"])
		.index("by_userId_globalExerciseId", ["userId", "globalExerciseId"]),
	workoutSets: defineTable({
		userId: v.optional(v.string()),
		globalExerciseId: v.optional(v.id("globalExercises")),
		workoutCreationTime: v.optional(v.float64()),
		workoutId: v.optional(v.id("workouts")),
		workoutExerciseId: v.id("workoutExercises"),
		order: v.float64(),
		clientSetId: v.string(),
		weight: v.float64(),
		reps: v.float64(),
		completed: v.boolean(),
	})
		.index("by_userId_globalExerciseId_completed_workoutCreationTime_order", [
			"userId",
			"globalExerciseId",
			"completed",
			"workoutCreationTime",
			"order",
		])
		.index("by_workoutId", ["workoutId"])
		.index("by_workoutExerciseId", ["workoutExerciseId"])
		.index("by_workoutExerciseId_order", ["workoutExerciseId", "order"]),
});
