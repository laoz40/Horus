import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getCurrentDay } from "@/lib/date";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import Link from "next/link";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

interface WorkoutNameDialogProps {
	children: React.ReactNode;
}

type AuthStatus = "pending" | "authenticated" | "unauthenticated";

export function WorkoutNameDialog({ children }: WorkoutNameDialogProps) {
	const { register } = useFormContext<Workout>();
	const [open, setOpen] = useState(false);
	const { data: sessionData, isPending } = authClient.useSession();
	let authStatus: AuthStatus = "unauthenticated";

	if (sessionData?.user) {
		authStatus = "authenticated";
	}
	if (isPending) {
		authStatus = "pending";
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Save Workout</DialogTitle>
					<DialogDescription>Add a name to your workout before saving.</DialogDescription>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="name-1">Enter workout name</FieldLabel>
						<Input
							id="name-1"
							maxLength={64}
							placeholder={`${getCurrentDay()} Workout`}
							{...register("name")}
						/>
					</Field>
				</FieldGroup>
				{authStatus === "unauthenticated" ? (
					<p className="text-sm text-destructive">
						You need an account to create and save workouts.
					</p>
				) : null}
				<DialogFooter className="flex flex-row justify-between gap-2">
					{authStatus === "authenticated" ? (
						<>
							<DialogClose asChild>
								<Button variant="secondary">Cancel</Button>
							</DialogClose>
							<Button
								type="submit"
								form="workout-form"
								onClick={() => setOpen(false)}>
								Save
							</Button>
						</>
					) : null}
					{authStatus === "unauthenticated" ? (
						<>
							<DialogClose asChild>
								<Button variant="secondary">Close</Button>
							</DialogClose>
							<Button asChild>
								<Link href="/login">Sign in</Link>
							</Button>
						</>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
