import { exercisesRouter } from "@/server/routers/exercises";

export const appRouter = {
	exercises: exercisesRouter,
};

export type AppRouter = typeof appRouter;
