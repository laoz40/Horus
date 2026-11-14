import { z } from "zod";

export const onlineExerciseSearchErrors = {
	RATE_LIMITED: {
		status: 429,
		message: "Too many requests. Please try again later.",
	},
	REQUEST_FAILED: {
		status: 502,
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
