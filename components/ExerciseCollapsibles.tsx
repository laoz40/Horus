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
			<DifficultySlider />
			<ExerciseNotes
				exerciseData={exerciseData}
				setExerciseData={setExerciseData}
			/>
		</div>
	);
};

export function DifficultySlider() {
	const difficultyOptions = ["Too Easy", " ", "Standard", " ", "Nightmare"];

	return (
		<CollapsibleFilter
			title="Difficulty"
			icon={BicepsFlexed}>
			<div className="flex flex-col w-full max-w-sm gap-3">
				<Slider
					defaultValue={[2]}
					max={4}
					step={1}
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
}: {
	title: string;
	icon?: LucideIcon;
	children: ReactNode;
}) => {
	const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);

	return (
		<Collapsible
			open={isCollapsibleOpen}
			onOpenChange={setIsCollapsibleOpen}>
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
