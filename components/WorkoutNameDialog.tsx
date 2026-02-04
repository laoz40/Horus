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
import { Workout } from "@/lib/validateWorkout";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

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
				<DialogDescription />
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
				<DialogFooter className="flex flex-row justify-between gap-2">
					<DialogClose asChild>
						<Button variant="secondary">Cancel</Button>
					</DialogClose>
					<Button
						type="submit"
						form="workout-form"
						onClick={() => setOpen(false)}>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
