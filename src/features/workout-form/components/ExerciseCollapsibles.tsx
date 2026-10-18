"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { IconFlame, IconNotes } from "@tabler/icons-react";

import { Textarea } from "@/components/ui/textarea";
import { Controller, useFormContext } from "react-hook-form";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";

interface ExerciseCollapsiblesProps {
	exerciseIndex: number;
}

const ExerciseCollapsibles = ({ exerciseIndex }: ExerciseCollapsiblesProps) => {
	const { getValues, setValue } = useFormContext<Workout>();

	const initDifficultyValue = (openSections: string[]) => {
		const currentValue = getValues(`exercises.${exerciseIndex}.difficulty`);

		if (openSections.includes("difficulty") && currentValue === undefined) {
			setValue(`exercises.${exerciseIndex}.difficulty`, 2);
		}
	};

	return (
		<Accordion
			type="multiple"
			className="w-full max-w-full"
			onValueChange={initDifficultyValue}>
			<DifficultySlider exerciseIndex={exerciseIndex} />
			<ExerciseNotes exerciseIndex={exerciseIndex} />
		</Accordion>
	);
};

function DifficultySlider({ exerciseIndex }: ExerciseCollapsiblesProps) {
	// Justify-between spreads the three labels the same way the old spacer-padded row did.
	const difficultyOptions = ["Too Easy", "Average", "Nightmare"];

	const { control } = useFormContext<Workout>();

	return (
		<AccordionItem
			value="difficulty"
			className="border-0">
			<AccordionTrigger className="items-center py-3 font-semibold text-muted-foreground hover:no-underline">
				<span className="flex items-center gap-2">
					<IconFlame className="size-5" /> Difficulty
				</span>
			</AccordionTrigger>
			<AccordionContent className="pt-1 pb-3">
				<div className="flex w-full max-w-sm flex-col gap-3">
					<Controller
						control={control}
						name={`exercises.${exerciseIndex}.difficulty`}
						render={({ field }) => (
							<Slider
								max={4}
								step={1}
								value={[field.value ?? 2]}
								onValueChange={(value) => field.onChange(value[0])}
							/>
						)}
					/>
					<div className="flex flex-row items-center justify-between text-xs text-muted-foreground">
						{difficultyOptions.map((difficulty) => (
							<span key={difficulty}>{difficulty}</span>
						))}
					</div>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}

function ExerciseNotes({ exerciseIndex }: ExerciseCollapsiblesProps) {
	const {
		register,
		formState: { errors },
	} = useFormContext<Workout>();

	return (
		<AccordionItem
			value="notes"
			className="border-0">
			<AccordionTrigger className="items-center py-3 font-semibold text-muted-foreground hover:no-underline">
				<span className="flex items-center gap-2">
					<IconNotes className="size-5" /> Notes
				</span>
			</AccordionTrigger>
			<AccordionContent className="pt-1 pb-3">
				<div className="flex flex-col gap-1">
					<Textarea
						placeholder="Write a note..."
						className="bg-card text-foreground dark:bg-input"
						{...register(`exercises.${exerciseIndex}.notes`)}
					/>
					{errors.exercises?.[exerciseIndex]?.notes && (
						<span className="text-sm text-destructive">
							{errors.exercises[exerciseIndex]?.notes?.message}
						</span>
					)}
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}

export default ExerciseCollapsibles;
