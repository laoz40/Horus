import { BackNavButton, backNavIconClassName } from "@/components/BackNavButton";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function ProgressPage() {
	return (
		<div className="flex shrink-0 items-center gap-0.5 p-4">
			<BackNavButton asChild>
				<Link
					href="/"
					aria-label="Back to workouts">
					<IconChevronLeft className={backNavIconClassName} />
				</Link>
			</BackNavButton>
			<h1 className="text-2xl font-semibold">Your progress</h1>
		</div>
	);
}
