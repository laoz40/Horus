import "server-only";

import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Data, Effect, Layer, ManagedRuntime, Result } from "effect";
import { headers } from "next/headers";
import DashboardYearInTrainingSection, {
	DashboardYearInTrainingPlaceholder,
} from "@/features/dashboard/components/DashboardYearInTrainingSection";
import { dashboardDb } from "@/features/dashboard/server/dashboard.db";
import {
	getTrainingYearRange,
	getYearInTraining,
} from "@/features/dashboard/server/dashboard.service";
import { auth } from "@/lib/auth-server";
import { sqlClient } from "@/lib/db/sql";
import { orpc } from "@/lib/orpc/client";

class DashboardSessionError extends Data.TaggedError("DashboardSessionError")<{
	cause: unknown;
}> {}

const runtime = ManagedRuntime.make(dashboardDb.pipe(Layer.provide(sqlClient)));

export default async function DashboardYearInTraining() {
	const requestHeaders = await headers();

	const result = await runtime.runPromise(
		Effect.gen(function* () {
			const session = yield* Effect.tryPromise({
				try: () => auth.api.getSession({ headers: requestHeaders }),
				catch: (cause) => new DashboardSessionError({ cause }),
			});

			const year = new Date().getUTCFullYear();

			const queryClient = new QueryClient();

			if (session) {
				const userId = session.user.id;

				const { stats, yearRange } = yield* Effect.all(
					{
						stats: getYearInTraining({ userId, year }),
						yearRange: getTrainingYearRange(userId),
					},
					{ concurrency: "unbounded" },
				);

				queryClient.setQueryData(
					orpc.dashboard.yearInTraining.key({ type: "query", input: { year, userId } }),
					stats,
				);
				queryClient.setQueryData(
					orpc.dashboard.trainingYearRange.key({ type: "query", input: { userId } }),
					yearRange,
				);
			}

			return { userId: session?.user.id ?? null, year, cache: dehydrate(queryClient) };
		}).pipe(
			Effect.tapError((cause) => Effect.logError("Failed to load year in training", { cause })),
			Effect.result,
		),
	);

	if (Result.isFailure(result)) {
		return <DashboardYearInTrainingPlaceholder kind="error" />;
	}

	const { userId, year, cache } = result.success;

	return (
		<HydrationBoundary state={cache}>
			<DashboardYearInTrainingSection
				userId={userId}
				currentYear={year}
			/>
		</HydrationBoundary>
	);
}
