"use client";

import { FC } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PaginationProps {
	hasNextPage: boolean;
	className?: string;
}

interface PaginationArrowProps {
	direction: "left" | "right";
	href: string;
	isDisabled: boolean;
}

const PaginationArrow: FC<PaginationArrowProps> = ({
	direction,
	href,
	isDisabled,
}) => {
	const router = useRouter();
	const isLeft = direction === "left";
	const disabledClassName = isDisabled ? "opacity-0 cursor-not-allowed" : "";

	return (
		<Button
			onClick={() => router.push(href)}
			className={`${disabledClassName}`}
			variant="secondary"
			aria-disabled={isDisabled}
			disabled={isDisabled}>
			{isLeft ? <ChevronLeftIcon /> : <ChevronRightIcon />}
		</Button>
	);
};

export default function HistoryPagination({
	hasNextPage,
	className,
}: Readonly<PaginationProps>) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentPage = Number(searchParams.get("page")) || 1;

	const createPageURL = (pageNumber: number | string) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", pageNumber.toString());
		return `${pathname}?${params.toString()}`;
	};

	return (
		<Pagination className={cn("", className)}>
			<PaginationContent>
				<PaginationItem>
					<PaginationArrow
						direction="left"
						href={createPageURL(currentPage - 1)}
						isDisabled={currentPage <= 1}
					/>
				</PaginationItem>
				<PaginationItem>
					<span className="p-2">Page {currentPage}</span>
				</PaginationItem>
				<PaginationItem>
					<PaginationArrow
						direction="right"
						href={createPageURL(currentPage + 1)}
						isDisabled={!hasNextPage}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
