import { normalizeName } from "@/lib/normalizeName";

export function normalizeMuscleGroups(muscleGroups: string[] | undefined) {
	const muscleGroupsByNormalizedName = new Map<string, { name: string; normalizedName: string }>();

	for (const name of muscleGroups ?? []) {
		const normalizedName = normalizeName(name);

		if (normalizedName.length === 0 || muscleGroupsByNormalizedName.has(normalizedName)) {
			continue;
		}

		muscleGroupsByNormalizedName.set(normalizedName, {
			name: name.trim(),
			normalizedName,
		});
	}

	return [...muscleGroupsByNormalizedName.values()];
}
