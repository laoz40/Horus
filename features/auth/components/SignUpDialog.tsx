"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/lib/toastMessages";
import Link from "next/link";
import { type ReactElement } from "react";

interface SignUpDialogProps {
	show: boolean;
}

export default function SignUpDialog({ show }: SignUpDialogProps): ReactElement {
	if (!show) {
		return <></>;
	}

	const handleClick = () => {
		showErrorToast("Any progress will not be saved.");
	};

	return (
		<AlertDialog defaultOpen>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Not Signed In</AlertDialogTitle>
					<AlertDialogDescription className="text-balance">
						Your workouts cannot be saved without an account.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel variant="secondary" onClick={handleClick}>Let me test</AlertDialogCancel>
					<Button asChild>
						<Link href="/login">Sign in</Link>
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
