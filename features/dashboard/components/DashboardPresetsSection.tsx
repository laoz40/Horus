"use client";

import Section from "@/components/Section";
import { Button } from "@/components/ui/button";
import { showInfoToast } from "@/lib/toastMessages";

export default function DashboardPresetsSection() {
	const handleComingSoonClick = () => {
		showInfoToast("Please read. Please be patient. 😠");
	};

	return (
		<Section header="Presets">
			<div className="flex flex-col gap-2">
				<Button
					className="text-muted-foreground"
					onClick={handleComingSoonClick}
					variant="outline"
					size="lg">
					COMING SOON
				</Button>
			</div>
		</Section>
	);
}
