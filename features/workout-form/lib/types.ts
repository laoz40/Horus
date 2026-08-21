import type * as z from "zod";

import type {
	WorkoutForSaveSchema,
	WorkoutSchema,
} from "@/features/workout-form/lib/validateWorkout";

export type WorkoutFormData = z.infer<typeof WorkoutSchema>;
export type WorkoutForSave = z.infer<typeof WorkoutForSaveSchema>;

export interface ExerciseSuggestion {
	id: string;
	name: string;
	normalizedName: string;
	muscleGroups?: string[];
}
