import { exercisesRouter } from "@/server/exercises/exercises.router";
import { dashboardRouter } from "@/server/dashboard/dashboard.router";
import { workoutsRouter } from "@/server/workouts/workouts.router";

export const appRouter = {
	dashboard: dashboardRouter,
	exercises: exercisesRouter,
	workouts: workoutsRouter,
};

export type AppRouter = typeof appRouter;
