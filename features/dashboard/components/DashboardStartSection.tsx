"use client";

import Section from "@/components/Section";
import { Button } from "@/components/ui/button";
import { showInfoToast } from "@/lib/toastMessages";
import Link from "next/link";

export default function DashboardStartSection() {
	const handleCreatePresetClick = () => {
		showInfoToast("Presets are coming soon.");
	};

	return (
		<Section header="Start">
			<div className="flex flex-row w-full flex-wrap items-center justify-center gap-2">
				<Button
					asChild
					size="lg"
					className="flex-1">
					<Link href="/workouts/new">Start Workout</Link>
				</Button>

				<Button
					asChild
					onClick={handleCreatePresetClick}
					variant="outline"
					size="lg"
					className="flex-1">
					<Link href="#preset">Create a Preset</Link>
				</Button>
			</div>
		</Section>
	);
}
