import * as z from "zod";

const WgerExerciseTranslationSchema = z.object({
	language: z.number(),
	name: z.string(),
});

const WgerExerciseMuscleSchema = z.object({
	name_en: z.string().nullish(),
	name: z.string().nullish(),
});

const WgerExerciseResultSchema = z.object({
	id: z.number(),
	translations: z.array(WgerExerciseTranslationSchema).nullish(),
	muscles: z.array(WgerExerciseMuscleSchema).nullish(),
	muscles_secondary: z.array(WgerExerciseMuscleSchema).nullish(),
	category: z
		.object({
			name: z.string().nullish(),
		})
		.nullish(),
});

export const WgerExerciseResponseSchema = z.object({
	results: z.array(WgerExerciseResultSchema),
});
