import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getCurrentDay } from "@/lib/date";
import { MAX_WORKOUT_NAME_LENGTH, type Workout } from "@/features/workout-form/lib/validateWorkout";
import Link from "next/link";
import { useState } from "react";
import { type SubmitErrorHandler, useFormContext } from "react-hook-form";

interface WorkoutNameDialogProps {
	children: React.ReactNode;
	onInvalidSubmit: SubmitErrorHandler<Workout>;
}

type AuthStatus = "pending" | "authenticated" | "unauthenticated";

export function WorkoutNameDialog({ children, onInvalidSubmit }: WorkoutNameDialogProps) {
	const { register, handleSubmit } = useFormContext<Workout>();
	const [open, setOpen] = useState(false);
	const { data: sessionData, isPending } = authClient.useSession();
	let authStatus: AuthStatus = "unauthenticated";

	if (sessionData?.user) {
		authStatus = "authenticated";
	}

	if (isPending) {
		authStatus = "pending";
	}

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setOpen(false);

			return;
		}

		void handleSubmit(() => setOpen(true), onInvalidSubmit)();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				className="sm:max-w-sm"
				onOpenAutoFocus={(event) => {
					event.preventDefault();

					if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
				}}
				aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Save Workout</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="name-1">Enter workout name</FieldLabel>
						<Input
							id="name-1"
							maxLength={MAX_WORKOUT_NAME_LENGTH}
							placeholder={`${getCurrentDay()} Workout`}
							{...register("name")}
						/>
					</Field>
				</FieldGroup>
				{authStatus === "unauthenticated" && (
					<p className="text-sm text-destructive">
						You need an account to create and save workouts.
					</p>
				)}
				<DialogFooter className="flex flex-row justify-between">
					{authStatus === "authenticated" && (
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
					)}
					{authStatus === "unauthenticated" && (
						<>
							<DialogClose asChild>
								<Button variant="secondary">Close</Button>
							</DialogClose>
							<Button asChild>
								<Link href="/login">Sign in</Link>
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
