import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workouts: defineTable({
    durationSeconds: v.union(v.float64(), v.null()),
    exercises: v.array(
      v.object({
        difficulty: v.optional(v.float64()),
        global: v.object({
          muscleGroups: v.optional(v.array(v.string())),
          name: v.string(),
        }),
        id: v.string(),
        notes: v.string(),
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
  }),
  globalExercises: defineTable({
    muscleGroups: v.optional(v.array(v.string())),
    name: v.string(),
    normalizedName: v.string(),
  }).index("by_normalizedName", ["normalizedName"]),
});
