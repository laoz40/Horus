import "server-only";

import { Layer } from "effect";
import { sqlClient } from "@/lib/db/sql";
import { exerciseDb } from "@/features/exercise-library/server/exercises.db";
import { workoutExerciseDb } from "@/features/workout-form/server/workout-exercises.db";
import { workoutFormDb } from "@/features/workout-form/server/workout-form.db";
import { workoutHistoryDb } from "@/features/workout-history/server/workout-history.db";
import { workoutViewDb } from "@/features/workout-view/server/workout-view.db";
import { prHistoryDb } from "@/features/personal-records/server/pr-history.db";
import { dashboardDb } from "@/features/dashboard/server/dashboard.db";
import { personalRecordsDb } from "@/features/personal-records/server/personal-records.db";
import { progressDb } from "@/features/exercise-progress/server/exercise-progress.db";

// One composition supplies feature services and the SQL client used by transactions.
export const database = Layer.mergeAll(
	exerciseDb,
	workoutExerciseDb,
	workoutFormDb,
	workoutHistoryDb,
	workoutViewDb,
	prHistoryDb,
	dashboardDb,
	personalRecordsDb,
	progressDb,
).pipe(Layer.provideMerge(sqlClient));
