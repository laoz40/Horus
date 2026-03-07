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
    muscleGroups: v.optional(v.array(v.string())),
    exercises: v.array(
      v.object({
        difficulty: v.optional(v.float64()),
        globalExerciseId: v.id("globalExercises"),
        id: v.string(),
        notes: v.optional(v.string()),
        sets: v.array(
          v.object({
            completed: v.boolean(),
            id: v.string(),
            reps: v.float64(),
            weight: v.float64(),
          })
        ),
      })
    ),
    name: v.string(),
    totalPrSets: v.float64(),
    totalVolume: v.float64(),
    userId: v.string(),
  }).index("by_userId", ["userId"]),
});
