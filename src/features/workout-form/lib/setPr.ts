export type SetPrType = "weight" | "volume" | "bodyweightReps";

export const setPrLabels = {
	weight: "Weight PR",
	volume: "Volume PR",
	bodyweightReps: "Reps PR",
} satisfies Record<SetPrType, string>;

export function buildSetPrTypes(set: {
	isWeightPr: boolean;
	isVolumePr: boolean;
	isBodyweightRepsPr: boolean;
}): SetPrType[] {
	const prTypes: SetPrType[] = [];

	if (set.isWeightPr) {
		prTypes.push("weight");
	}

	if (set.isVolumePr) {
		prTypes.push("volume");
	}

	if (set.isBodyweightRepsPr) {
		prTypes.push("bodyweightReps");
	}

	return prTypes;
}
