import { exercisesRouter } from "@/lib/orpc/exercises";

export const appRouter = {
	exercises: exercisesRouter,
};

export type AppRouter = typeof appRouter;
