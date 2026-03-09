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
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentDay } from "@/lib/date";
import { Workout } from "@/features/workout-form/lib/validateWorkout";
import Link from "next/link";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Authenticated, Unauthenticated } from "convex/react";

interface WorkoutNameDialogProps {
	children: React.ReactNode;
}

export function WorkoutNameDialog({ children }: WorkoutNameDialogProps) {
	const { register } = useFormContext<Workout>();

	const [open, setOpen] = useState(false);

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Save Workout</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<Label htmlFor="name-1">Enter workout name</Label>
						<Input
							id="name-1"
							placeholder={`${currentDay} Workout`}
							{...register("name")}
						/>
					</Field>
				</FieldGroup>
				<Unauthenticated>
					<DialogDescription className="text-destructive">
						You need an account to create and save workouts.
					</DialogDescription>
				</Unauthenticated>
				<DialogFooter className="flex flex-row justify-between gap-2">
					<Authenticated>
						<DialogClose asChild>
							<Button variant="secondary">Cancel</Button>
						</DialogClose>
						<Button
							type="submit"
							form="workout-form"
							onClick={() => setOpen(false)}>
							Save
						</Button>
					</Authenticated>
					<Unauthenticated>
						<DialogClose asChild>
							<Button variant="secondary">Close</Button>
						</DialogClose>
						<Button asChild>
							<Link href="/login">Sign in</Link>
						</Button>
					</Unauthenticated>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
