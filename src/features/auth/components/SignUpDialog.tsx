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
import { useRef, type ReactElement } from "react";

export default function SignUpDialog(): ReactElement {
	const dialogRef = useRef<HTMLDivElement>(null);

	return (
		<AlertDialog defaultOpen>
			<AlertDialogContent
				ref={dialogRef}
				size="sm"
				className="outline-none"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					dialogRef.current?.focus();
				}}>
				<AlertDialogHeader>
					<AlertDialogTitle>Not Signed In</AlertDialogTitle>
					<AlertDialogDescription className="text-balance">
						Your workouts cannot be saved without an account.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						variant="secondary"
						onClick={() => showErrorToast("Any progress will not be saved.")}>
						Let me test
					</AlertDialogCancel>
					<Button asChild>
						<Link href="/login">Sign in</Link>
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
