const scrollPositions = new Map<string, number>();

export function useHistoryScrollRestoration({
	userId,
	isReady,
}: {
	userId: string;
	isReady: boolean;
}) {
	// Restore before paint once the cards exist, then remember this user's list position.
	return (feed: HTMLDivElement | null) => {
		if (!feed || !isReady) return;

		const scroller = feed.closest("[data-page-scroll]");

		if (!(scroller instanceof HTMLElement)) return;

		scroller.scrollTop = scrollPositions.get(userId) ?? 0;

		const rememberPosition = () => {
			scrollPositions.set(userId, scroller.scrollTop);
		};

		scroller.addEventListener("scroll", rememberPosition, { passive: true });

		return () => {
			scroller.removeEventListener("scroll", rememberPosition);
		};
	};
}
