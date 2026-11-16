"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { BackNavButton, backNavIconClassName } from "@/components/BackNavButton";

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

interface WorkoutExitLinkProps {
	href: string;
	isCreate: boolean;
}

export default function WorkoutExitLink({ href, isCreate }: WorkoutExitLinkProps): ReactElement {
	const router = useRouter();

	const description = isCreate
		? "Leaving will discard this workout. Your progress will not be saved."
		: "Leaving will discard unsaved changes to this workout.";

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<BackNavButton
					type="button"
					aria-label="Back">
					<IconChevronLeft className={backNavIconClassName} />
				</BackNavButton>
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
						onClick={() => router.push(href)}>
						Discard
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
