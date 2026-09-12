"use client";

import Section from "@/components/Section";
import { Button } from "@/components/ui/button";
import { showInfoToast } from "@/lib/toastMessages";
import { IconBoltFilled, IconListNumbers } from "@tabler/icons-react";
import Link from "next/link";

export default function DashboardStartSection() {
	return (
		<Section header="Start">
			<div className="flex flex-row w-full flex-wrap items-center justify-center gap-2">
				<Button
					asChild
					size="lg"
					className="flex-1 gap-1!">
					<Link href="/workouts/new">
						<IconBoltFilled className="size-4" />
						Start Workout
					</Link>
				</Button>

				<Button
					asChild
					onClick={() => showInfoToast("Presets are coming soon.")}
					variant="outline"
					size="lg"
					className="flex-1 gap-1!">
					<Link href="#preset">
						<IconListNumbers className="size-4" />
						Create a Preset
					</Link>
				</Button>
			</div>
		</Section>
	);
}
