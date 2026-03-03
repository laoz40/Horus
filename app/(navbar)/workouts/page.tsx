import SearchBar from "@/features/workout-history/components/SearchBar";
import HistoryFeed from "@/features/workout-history/components/HistoryFeed";

export default function HistoryPage() {
	return (
		<div className="px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
				<SearchBar />
				<HistoryFeed />
			</div>
		</div>
	);
}
