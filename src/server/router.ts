import { exercisesRouter } from "@/server/exercises/exercises.router";
import { dashboardRouter } from "@/features/dashboard/server/dashboard.router";
import { workoutFormRouter } from "@/features/workout-form/server/workout-form.router";
import { workoutHistoryRouter } from "@/features/workout-history/server/workout-history.router";
import { workoutViewRouter } from "@/features/workout-view/server/workout-view.router";

export const appRouter = {
	dashboard: dashboardRouter,
	exercises: exercisesRouter,
	workouts: {
		...workoutFormRouter,
		...workoutHistoryRouter,
		...workoutViewRouter,
	},
};

export type AppRouter = typeof appRouter;
