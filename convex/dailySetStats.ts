import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { getUtcDayKey } from "./lib/dailySetStats";
import { errorHandlerWrapper, requireIdentity } from "./lib/server";

export const getYear = query({
	args: {
		year: v.float64(),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);
			const startDayKey = `${args.year}-01-01`;
			const endDayKey = `${args.year}-12-31`;

			const stats = await ctx.db
				.query("dailySetStats")
				.withIndex("by_userId_dayKey", (index) =>
					index.eq("userId", identity.subject).gte("dayKey", startDayKey).lte("dayKey", endDayKey),
				)
				.collect();

			return stats.map((stat) => ({
				dayKey: stat.dayKey,
				setCount: stat.setCount,
			}));
		}),
});

export const rebuildAll = mutation({
	args: {},
	handler: async (ctx) => errorHandlerWrapper(async () => rebuildAllUsers(ctx)),
});

async function rebuildAllUsers(ctx: MutationCtx) {
	const stats = await ctx.db.query("dailySetStats").collect();
	await Promise.all(stats.map((stat) => ctx.db.delete(stat._id)));

	const workouts = await ctx.db.query("workouts").collect();

	for (const workout of workouts) {
		await ctx.db.patch(workout._id, { setCount: 0 });
	}

	const completedSets = await ctx.db
		.query("workoutSets")
		.withIndex("by_completed", (index) => index.eq("completed", true))
		.collect();

	const setCountsByWorkout = new Map<Id<"workouts">, number>();
	const dayCounts = new Map<string, { userId: string; dayKey: string; setCount: number }>();

	for (const set of completedSets) {
		setCountsByWorkout.set(set.workoutId, (setCountsByWorkout.get(set.workoutId) ?? 0) + 1);

		const dayKey = getUtcDayKey(set.workoutCreationTime);
		const dayCountKey = `${set.userId}:${dayKey}`;
		const dayCount = dayCounts.get(dayCountKey);
		dayCounts.set(dayCountKey, {
			userId: set.userId,
			dayKey,
			setCount: (dayCount?.setCount ?? 0) + 1,
		});
	}

	for (const [workoutId, setCount] of setCountsByWorkout) {
		await ctx.db.patch(workoutId, { setCount });
	}

	for (const dayCount of dayCounts.values()) {
		if (dayCount.setCount <= 0) continue;
		await ctx.db.insert("dailySetStats", dayCount);
	}

	return { success: true, dayCount: dayCounts.size, workoutCount: setCountsByWorkout.size };
}
