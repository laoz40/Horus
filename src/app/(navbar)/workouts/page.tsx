import { BackNavButton, backNavIconClassName } from "@/components/BackNavButton";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import SearchBar from "@/features/workout-history/components/SearchBar";
import HistoryFeedErrorBoundary from "@/features/workout-history/components/HistoryFeedErrorBoundary";

const WORKOUTS_PER_PAGE = 7;

export default function HistoryPage() {
	return (
		<div className="px-4 pt-6 pb-10 md:px-8 md:pt-8 md:pb-12">
			<div className="mx-auto flex w-full flex-col gap-6 md:gap-8">
				<div className="flex items-center gap-0.5">
					<BackNavButton asChild>
						<Link
							href="/"
							aria-label="Back to workouts">
							<IconChevronLeft className={backNavIconClassName} />
						</Link>
					</BackNavButton>
					<h1 className="text-2xl font-semibold">Workout history</h1>
				</div>
				<SearchBar />
				<HistoryFeedErrorBoundary WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE} />
			</div>
		</div>
	);
}
