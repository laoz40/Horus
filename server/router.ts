import { exercisesRouter } from "@/server/routers/exercises";
import { workoutsRouter } from "@/server/routers/workouts";

export const appRouter = {
	exercises: exercisesRouter,
	workouts: workoutsRouter,
};

export type AppRouter = typeof appRouter;
