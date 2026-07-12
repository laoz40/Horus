"use client";

import { Button } from "@/components/ui/button";
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
	if (!hasNextPage) return null;

	return (
		<div className={cn("flex justify-center", className)}>
			<Button
				onClick={onLoadMore}
				disabled={isLoading}
				variant="outline"
				size="lg">
				{isLoading ? "Loading..." : "Load more"}
			</Button>
		</div>
	);
}
