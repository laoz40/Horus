interface WgerExerciseTranslation {
	language: number;
	name: string;
}

interface WgerExerciseMuscle {
	name_en?: string;
	name?: string;
}

interface WgerExerciseCategory {
	name?: string;
}

interface WgerExerciseResult {
	id: number;
	translations?: WgerExerciseTranslation[];
	muscles?: WgerExerciseMuscle[];
	muscles_secondary?: WgerExerciseMuscle[];
	category?: WgerExerciseCategory;
}

export interface WgerExerciseResponse {
	results?: WgerExerciseResult[];
}
