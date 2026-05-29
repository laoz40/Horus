import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	globalExercises: defineTable({
		muscleGroups: v.optional(v.array(v.string())),
		name: v.string(),
		normalizedName: v.string(),
	}).index("by_normalizedName", ["normalizedName"]),
	dailySetStats: defineTable({
		userId: v.string(),
		dayKey: v.string(),
		setCount: v.float64(),
	}).index("by_userId_dayKey", ["userId", "dayKey"]),
	workouts: defineTable({
		durationSeconds: v.union(v.float64(), v.null()),
		exerciseCount: v.optional(v.float64()),
		setCount: v.optional(v.float64()),
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
		workoutCreationTime: v.float64(),
		workoutId: v.optional(v.id("workouts")),
		workoutExerciseId: v.id("workoutExercises"),
		order: v.float64(),
		clientSetId: v.string(),
		weight: v.float64(),
		reps: v.float64(),
		completed: v.boolean(),
		isPr: v.optional(v.boolean()),
		prType: v.optional(
			v.union(v.literal("weight"), v.literal("volume"), v.literal("bodyweightReps"), v.null()),
		),
		isCurrentWeightPr: v.optional(v.boolean()),
		isCurrentVolumePr: v.optional(v.boolean()),
		isCurrentBodyweightRepsPr: v.optional(v.boolean()),
	})
		.index("by_completed", ["completed"])
		.index("by_userId_completed", ["userId", "completed"])
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
	exercisePrs: defineTable({
		userId: v.string(),
		globalExerciseId: v.id("globalExercises"),
		weightPr: v.float64(),
		weightPrSetId: v.union(v.id("workoutSets"), v.null()),
		volumePr: v.float64(),
		volumePrSetId: v.union(v.id("workoutSets"), v.null()),
		bodyweightRepsPr: v.float64(),
		bodyweightRepsPrSetId: v.union(v.id("workoutSets"), v.null()),
	})
		.index("by_userId", ["userId"])
		.index("by_userId_globalExerciseId", ["userId", "globalExerciseId"]),
});
