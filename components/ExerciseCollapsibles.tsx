"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { BicepsFlexed, ChevronDown, LucideIcon, Notebook } from "lucide-react";
import { Activity, ChangeEvent, ReactNode, useState } from "react";
import { Textarea } from "./ui/textarea";
import { ExerciseFormData } from "@/lib/types";

interface ExerciseCollapsiblesProps {
	exerciseData: ExerciseFormData;
	setExerciseData: (
		updaterFn: (prev: ExerciseFormData) => ExerciseFormData,
	) => void;
}

const ExerciseCollapsibles = ({
	exerciseData,
	setExerciseData,
}: ExerciseCollapsiblesProps) => {
	return (
		<div className="w-full max-w-full">
			<DifficultySlider
				exerciseData={exerciseData}
				setExerciseData={setExerciseData}
			/>
			<ExerciseNotes
				exerciseData={exerciseData}
				setExerciseData={setExerciseData}
			/>
		</div>
	);
};

function DifficultySlider({
	exerciseData,
	setExerciseData,
}: ExerciseCollapsiblesProps) {
	const difficultyOptions = ["Too Easy", " ", "Standard", " ", "Nightmare"];

	const initialiseDifficultyValue = (openState: boolean) => {
		if (openState && exerciseData.difficulty === null) {
			setExerciseData((prev) => ({ ...prev, difficulty: 2 }));
		}
	};

	const handleDifficultyUpdate = (value: number[]) => {
		setExerciseData((prev) => ({ ...prev, difficulty: Number(value) }));
	};

	return (
		<CollapsibleFilter
			title="Difficulty"
			icon={BicepsFlexed}
			onOpenChange={initialiseDifficultyValue}>
			<div className="flex flex-col w-full max-w-sm gap-3">
				<Slider
					max={4}
					step={1}
					value={
						exerciseData.difficulty !== null
							? [exerciseData.difficulty]
							: undefined
					}
					onValueChange={handleDifficultyUpdate}
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

function ExerciseNotes({
	exerciseData,
	setExerciseData,
}: ExerciseCollapsiblesProps) {
	const handleNotesUpdate = (input: ChangeEvent<HTMLTextAreaElement>) => {
		setExerciseData((prev) => ({ ...prev, notes: input.target.value }));
	};

	return (
		<CollapsibleFilter
			title="Notes"
			icon={Notebook}>
			<Textarea
				placeholder="Write a note..."
				value={exerciseData.notes ?? ""}
				onChange={handleNotesUpdate}
			/>
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
		// if onOpenChange is passed down, call the function: initialiseDifficultyValue
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
				<CollapsibleContent className="pt-1 pb-3">
					{children}
				</CollapsibleContent>
			</Activity>
		</Collapsible>
	);
};

export default ExerciseCollapsibles;
