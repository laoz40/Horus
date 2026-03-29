const isEmptyNumberField = (value: unknown): boolean => {
	return value === undefined;
};

const isEmptySet = (set: unknown): boolean => {
	if (!set || typeof set !== "object") return false;

	const { weight, reps } = set as { weight?: unknown; reps?: unknown };
	return isEmptyNumberField(weight) && isEmptyNumberField(reps);
};

// Strip fully empty sets/exercises before validation.
export const stripEmptyWorkoutEntries = (workout: unknown): unknown => {
	if (!workout || typeof workout !== "object") return workout;

	const data = workout as {
		exercises?: unknown;
	};
	if (!Array.isArray(data.exercises)) return workout;

	const sanitizedExercises = data.exercises
		.map((exercise) => {
			if (!exercise || typeof exercise !== "object") return exercise;

			const entry = exercise as {
				global?: { name?: string };
				sets?: unknown[];
			};
			const sets = Array.isArray(entry.sets)
				? entry.sets.filter((set) => !isEmptySet(set))
				: entry.sets;

			return {
				...entry,
				sets,
			};
		})
		.filter((exercise) => {
			if (!exercise || typeof exercise !== "object") return true;

			const entry = exercise as {
				global?: { name?: string };
				sets?: unknown[];
			};
			const name = entry.global?.name?.trim() ?? "";
			const setCount = Array.isArray(entry.sets) ? entry.sets.length : 0;

			return !(name === "" && setCount === 0);
		});

	return {
		...data,
		exercises: sanitizedExercises,
	};
};
