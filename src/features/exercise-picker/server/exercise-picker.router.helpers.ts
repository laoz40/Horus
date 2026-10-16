import { z } from "zod";

export const onlineExerciseSearchErrors = {
	RATE_LIMITED: {
		message: "Too many requests. Please try again later.",
	},
	REQUEST_FAILED: {
		message: "Failed to fetch exercises.",
	},
};

export const onlineExerciseSuggestionsSchema = z.array(
	z
		.object({
			id: z.string(),
			name: z.string(),
			normalizedName: z.string(),
			muscleGroups: z.array(z.string()).optional(),
		})
		.strict(),
);

const exerciseCatalogItemSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	normalizedName: z.string(),
	muscleGroups: z.array(z.string()),
});

export const exerciseCatalogItemsSchema = z.array(exerciseCatalogItemSchema);
