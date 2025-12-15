"use client";

import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";

const handleClick = async () => {
	const confirmDeleted = confirm(
		"This will permanently delete all workouts. Continue?",
	);

	if (confirmDeleted) {
		try {
			const response = await fetch("/api/workouts/", {
				method: "DELETE",
			});
			const workoutData = await response.json();

			if (!workoutData.success) {
				console.error("Failed to delete workout:", workoutData.error);
			}
		} catch (err) {
			console.error("Delete failed", err);
		}
	}
};

export default function SettingsPage() {
	// TODO: Delete all workouts buttons
	return (
		<>
			<div className="p-4">
				<h1>Settings</h1>
			</div>
			<SectionCard
				header="Appearance"
				className="bg-accent">
				<div className="flex flex-row items-center justify-between">
					<p>Theme</p>
					<ModeToggle />
				</div>
			</SectionCard>

			<SectionCard
				header="Workouts"
				className="bg-accent">
				<Button
					variant="destructive"
					onClick={handleClick}>
					Delete all workouts
				</Button>
			</SectionCard>
		</>
	);
}
