import { dashboardRouter } from "@/features/dashboard/server/dashboard.router";
import { exerciseLibraryRouter } from "@/features/exercise-library/server/exercise-library.router";
import { exercisePickerRouter } from "@/features/exercise-picker/server/exercise-picker.router";
import { exerciseProgressRouter } from "@/features/exercise-progress/server/exercise-progress.router";
import { personalRecordsRouter } from "@/features/personal-records/server/personal-records.router";
import { workoutFormRouter } from "@/features/workout-form/server/workout-form.router";
import { workoutHistoryRouter } from "@/features/workout-history/server/workout-history.router";
import { workoutViewRouter } from "@/features/workout-view/server/workout-view.router";

export const appRouter = {
	dashboard: dashboardRouter,
	exercises: {
		...exerciseLibraryRouter,
		...exercisePickerRouter,
		...exerciseProgressRouter,
		...personalRecordsRouter,
	},
	workouts: {
		...workoutFormRouter,
		...workoutHistoryRouter,
		...workoutViewRouter,
	},
};

export type AppRouter = typeof appRouter;
