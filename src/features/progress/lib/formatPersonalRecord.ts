import { Match } from "effect";

import type { SetPrType } from "@/features/workout-form/lib/setPr";

export function formatPersonalRecord(record: { type: SetPrType; weight: number; reps: number }) {
	const display = Match.value(record.type).pipe(
		Match.when("weight", () => ({
			value: record.weight,
			unit: "kg",
			detail: `For ${record.reps} reps`,
		})),
		Match.when("volume", () => ({
			value: record.weight * record.reps,
			unit: "kg",
			detail: `${record.weight} kg × ${record.reps} reps`,
		})),
		Match.when("bodyweightReps", () => ({
			value: record.reps,
			unit: "reps",
			detail: "Bodyweight",
		})),
		Match.exhaustive,
	);

	return {
		...display,
		value: display.value.toLocaleString(undefined, { maximumSignificantDigits: 15 }),
	};
}
