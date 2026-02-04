"use client";

import { AlertDialogDestructive } from "@/components/DeleteWorkoutDialog";
import { ModeToggle } from "@/components/ModeToggle";
import SectionCard from "@/components/SectionCard";
import { Button } from "@/components/ui/button";

const handleClick = async () => {
	try {
		const response = await fetch("/api/workouts/", {
			method: "DELETE",
		});
		const workoutData = await response.json();

		if (!workoutData.success) {
			console.log("Failed to delete workout:", workoutData.error);
		}
	} catch (err) {
		console.log("Delete failed", err);
	}
};

export default function SettingsPage() {
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
				<AlertDialogDestructive
					title="Delete all workouts?"
					description="This will permanently delete all workouts."
					handleDelete={() => handleClick()}>
					<Button variant="destructive">Delete all workouts</Button>
				</AlertDialogDestructive>
			</SectionCard>
		</>
	);
}
