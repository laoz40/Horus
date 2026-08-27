import { exercisesRouter } from "@/server/routers/exercises";
import { dashboardRouter } from "@/server/routers/dashboard";
import { workoutsRouter } from "@/server/routers/workouts";

export const appRouter = {
	dashboard: dashboardRouter,
	exercises: exercisesRouter,
	workouts: workoutsRouter,
};

export type AppRouter = typeof appRouter;
