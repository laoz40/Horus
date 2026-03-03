export const normalizeExerciseName = (name: string): string => {
	return name.trim().replace(/\s+/g, " ").toLowerCase();
};
