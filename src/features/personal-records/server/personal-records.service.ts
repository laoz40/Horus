import "server-only";

import { Effect } from "effect";
import { normalizeName } from "@/lib/normalizeName";
import { PersonalRecordsDb } from "@/features/personal-records/server/personal-records.db";
import {
	buildExercisePersonalRecords,
	checkCompletedSetPr,
} from "@/features/personal-records/server/personal-records.functions";
import { emptyExercisePrs } from "@/features/personal-records/server/pr-history.functions";

export const getExercisePersonalRecords = (userId: string, exerciseName: string) =>
	Effect.gen(function* () {
		const db = yield* PersonalRecordsDb;
		const normalizedExerciseName = normalizeName(exerciseName);
		const rows = yield* db.getExercisePersonalRecords({ userId, normalizedExerciseName });

		return buildExercisePersonalRecords(
			rows[0] ?? {
				hasHistory: false,
				weight: null,
				volume: null,
				bodyweightReps: null,
			},
		);
	});

interface CheckSetPrInput {
	userId: string;
	exerciseName: string;
	sets: { completed: boolean; weight?: number; reps?: number }[];
	setIndex: number;
}

export const checkSetPr = ({ userId, exerciseName, sets, setIndex }: CheckSetPrInput) =>
	Effect.gen(function* () {
		const db = yield* PersonalRecordsDb;
		const normalizedExerciseName = normalizeName(exerciseName);
		const rows = yield* db.getExercisePr({ userId, normalizedExerciseName });

		return checkCompletedSetPr(sets, setIndex, rows[0] ?? emptyExercisePrs());
	});
