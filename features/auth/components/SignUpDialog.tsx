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
import { SignInButton } from "@clerk/nextjs";
import { Unauthenticated } from "convex/react";
import { type ReactElement } from "react";

export default function SignUpDialog(): ReactElement {

	const handleClick = () => {
		showErrorToast("Any progress will not be saved.");
	};

	return (
		<>
			<Unauthenticated>
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
							<SignInButton>
								<Button>Sign in</Button>
							</SignInButton>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Unauthenticated>
		</>
	);
}
