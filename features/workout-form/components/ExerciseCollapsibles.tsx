"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { BicepsFlexed, ChevronDown, LucideIcon, Notebook } from "lucide-react";
import { Activity, ReactNode, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useFormContext } from "react-hook-form";
import { Workout } from "@/features/workout-form/lib/validateWorkout";

interface ExerciseCollapsiblesProps {
	exerciseIndex: number;
}

const ExerciseCollapsibles = ({ exerciseIndex }: ExerciseCollapsiblesProps) => {
	return (
		<div className="w-full max-w-full">
			<DifficultySlider exerciseIndex={exerciseIndex} />
			<ExerciseNotes exerciseIndex={exerciseIndex} />
		</div>
	);
};

function DifficultySlider({ exerciseIndex }: ExerciseCollapsiblesProps) {
	const difficultyOptions = ["Too Easy", " ", "Standard", " ", "Nightmare"];

	const initDifficultyValue = (openState: boolean) => {
		const currentValue = getValues(`exercises.${exerciseIndex}.difficulty`);
		if (openState && currentValue === undefined) {
			setValue(`exercises.${exerciseIndex}.difficulty`, 2);
		}
	};

	const { control, getValues, setValue } = useFormContext();

	return (
		<CollapsibleFilter
			title="Difficulty"
			icon={BicepsFlexed}
			onOpenChange={initDifficultyValue}>
			<div className="flex flex-col w-full max-w-sm gap-3">
				<Controller
					control={control}
					name={`exercises.${exerciseIndex}.difficulty`}
					render={({ field }) => (
						<Slider
							max={4}
							step={1}
							value={Array.of(field.value) ?? 0}
							onValueChange={(value) => field.onChange(value[0])}
						/>
					)}
				/>
				<div className="flex flex-row items-center justify-between text-muted-foreground text-xs">
					{difficultyOptions.map((difficulty, index) => (
						<span key={index}>{difficulty}</span>
					))}
				</div>
			</div>
		</CollapsibleFilter>
	);
}

function ExerciseNotes({ exerciseIndex }: ExerciseCollapsiblesProps) {
	const {
		register,
		formState: { errors },
	} = useFormContext<Workout>();

	return (
		<CollapsibleFilter
			title="Notes"
			icon={Notebook}>
			<div className="flex flex-col gap-1">
				<Textarea
					placeholder="Write a note..."
					className="bg-card text-foreground dark:bg-input"
					{...register(`exercises.${exerciseIndex}.notes`)}
				/>
				{errors.exercises?.[exerciseIndex]?.notes && (
					<span className="text-red-500 text-sm">
						{errors.exercises[exerciseIndex]?.notes?.message}
					</span>
				)}
			</div>
		</CollapsibleFilter>
	);
}

const CollapsibleFilter = ({
	title,
	icon: Icon,
	children,
	onOpenChange,
}: {
	title: string;
	icon?: LucideIcon;
	children: ReactNode;
	onOpenChange?: (open: boolean) => void;
}) => {
	const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);

	const handleOpenChange = (openState: boolean) => {
		setIsCollapsibleOpen(openState);
		// if onOpenChange gets passed down, call the function: initDifficultyValue
		onOpenChange?.(openState);
	};
	return (
		<Collapsible
			open={isCollapsibleOpen}
			onOpenChange={handleOpenChange}>
			<CollapsibleTrigger className="group flex w-full items-center justify-between py-3">
				<h3 className="flex items-center gap-2 text-sm leading-none font-semibold text-muted-foreground">
					{!!Icon && <Icon className="h-5 w-5 text-muted-foreground" />} {title}
				</h3>
				<ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180 transition-transform text-muted-foreground" />
			</CollapsibleTrigger>

			<Activity mode={isCollapsibleOpen ? "visible" : "hidden"}>
				<CollapsibleContent className="pt-1 pb-3">{children}</CollapsibleContent>
			</Activity>
		</Collapsible>
	);
};

export default ExerciseCollapsibles;
