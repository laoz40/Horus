"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface HistoryPaginationProps {
	hasNextPage: boolean;
	isLoading: boolean;
	onLoadMore: () => void;
	className?: string;
}

export default function HistoryPagination({
	hasNextPage,
	isLoading,
	onLoadMore,
	className,
}: Readonly<HistoryPaginationProps>) {
	const sentinelRef = useRef<HTMLDivElement>(null);

	// Observe the bottom sentinel and fetch the next page when it nears the viewport.
	useEffect(() => {
		const sentinel = sentinelRef.current;

		if (!sentinel || !hasNextPage) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !isLoading) {
					onLoadMore();
				}
			},
			{ rootMargin: "200px" },
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, [hasNextPage, isLoading, onLoadMore]);

	if (!hasNextPage && !isLoading) return null;

	return (
		<div
			ref={sentinelRef}
			className={cn("flex justify-center py-4", className)}
			aria-busy={isLoading}
			aria-live="polite">
			{isLoading ? (
				<p className="text-sm text-muted-foreground">Loading...</p>
			) : (
				<div
					className="h-px w-full"
					aria-hidden
				/>
			)}
		</div>
	);
}
