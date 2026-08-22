import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export function getUtcDayKey(timestamp: number): string {
	return new Date(timestamp).toISOString().slice(0, 10);
}

export async function adjustDailySetStat(
	ctx: MutationCtx,
	args: { userId: string; dayKey: string; delta: number },
): Promise<void> {
	if (args.delta === 0) return;

	const stat = await ctx.db
		.query("dailySetStats")
		.withIndex("by_userId_dayKey", (query) =>
			query.eq("userId", args.userId).eq("dayKey", args.dayKey),
		)
		.first();

	const nextSetCount = (stat?.setCount ?? 0) + args.delta;
	if (nextSetCount <= 0) {
		if (stat) await ctx.db.delete(stat._id);
		return;
	}

	if (stat) {
		await ctx.db.patch(stat._id, { setCount: nextSetCount });
		return;
	}

	await ctx.db.insert("dailySetStats", {
		userId: args.userId,
		dayKey: args.dayKey,
		setCount: nextSetCount,
	});
}

export async function deleteDailySetStatsForUser(ctx: MutationCtx, userId: string): Promise<void> {
	const stats = await ctx.db
		.query("dailySetStats")
		.withIndex("by_userId_dayKey", (query) => query.eq("userId", userId))
		.collect();

	await Promise.all(stats.map((stat) => ctx.db.delete(stat._id as Id<"dailySetStats">)));
}
