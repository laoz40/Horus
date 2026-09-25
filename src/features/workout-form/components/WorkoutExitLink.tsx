"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { animateCreateWorkoutExit } from "@/features/workout-form/lib/animateCreateWorkoutExit";
import { setCreateWorkoutDraft } from "@/features/workout-form/stores/workoutFormUiStore";

interface WorkoutExitLinkProps {
	href: string;
	isCreate: boolean;
}

export default function WorkoutExitLink({ href, isCreate }: WorkoutExitLinkProps): ReactElement {
	const router = useRouter();

	const handleDiscard = () => {
		if (isCreate) {
			setCreateWorkoutDraft(null);
		}

		animateCreateWorkoutExit(() => {
			router.push(href);
		});
	};

	const description = isCreate
		? "Leaving will discard this workout. Your progress will not be saved."
		: "Leaving will discard unsaved changes to this workout.";

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					type="button"
					aria-label="Back">
					<IconChevronLeft className="size-7" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Discard workout?</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel variant="secondary">Keep editing</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleDiscard}>
						Discard
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
