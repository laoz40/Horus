"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HistoryPaginationProps {
	hasNextPage: boolean;
	isLoadingMore: boolean;
	onLoadMore: () => void;
	className?: string;
}

export default function HistoryPagination({
	hasNextPage,
	isLoadingMore,
	onLoadMore,
	className,
}: Readonly<HistoryPaginationProps>) {
	if (!hasNextPage) return null;

	return (
		<div className={cn("flex justify-center", className)}>
			<Button
				onClick={onLoadMore}
				disabled={isLoadingMore}
				variant="secondary"
				size="lg"
				className="min-w-36 border">
				{isLoadingMore ? "Loading..." : "Load more"}
			</Button>
		</div>
	);
}
