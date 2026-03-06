import { normalizeExerciseName } from "@/lib/workout/normalizeExerciseName";

interface fetchedExercise {
	id: string;
	name: string;
	normalizedName: string;
	muscleGroups?: string[];
}

export const deduplicateExercises = (
	groupOne: fetchedExercise[],
	groupTwo: fetchedExercise[],
) => {
	const map = new Map<string, fetchedExercise>();

	const addIfMissing = (exercise: fetchedExercise, addAll: boolean) => {
		if (!exercise.normalizedName) return;

		const exerciseMissing = !map.has(exercise.normalizedName);
		if (addAll || exerciseMissing) {
			map.set(exercise.normalizedName, {
				id: exercise.id,
				name: exercise.name.trim(),
				normalizedName: exercise.normalizedName,
				muscleGroups: exercise.muscleGroups,
			});
		}
	};

	for (const exercise of groupOne) addIfMissing(exercise, true);
	for (const exercise of groupTwo) addIfMissing(exercise, false);

	return Array.from(map.values());
};

export const toTitleCase = (value: string): string => {
	return value
		.toLowerCase()
		.split(" ")
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
};

export const createSuggestionObject = (exercise: {
	id: string;
	name: string;
	normalizedName?: string;
	targetMuscles?: string[];
	muscleGroups?: string[];
}) => ({
	id: exercise.id,
	name: toTitleCase(exercise.name),
	normalizedName:
		exercise.normalizedName ?? normalizeExerciseName(exercise.name),
	// muscleGroups if from DB, targetMuscles if from form api
	muscleGroups: exercise.muscleGroups ?? exercise.targetMuscles,
});
