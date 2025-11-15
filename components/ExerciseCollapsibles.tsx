"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { BicepsFlexed, ChevronDown, LucideIcon, Notebook } from "lucide-react";
import { Activity, ReactNode, useState } from "react";
import { Textarea } from "./ui/textarea";

const ExerciseCollapsibles = () => {
	return (
		<div className="w-full max-w-full divide-y-2">
			<DifficultySlider />
			<ExerciseNotes />
		</div>
	);
};

export function DifficultySlider() {
	const difficultyOptions = ["Too Easy", "", "Challenging", "", "Nightmare"];

	return (
		<CollapsibleFilter
			title="Difficulty"
			icon={BicepsFlexed}>
			<div className="flex flex-col w-full max-w-sm gap-3">
				<Slider
					defaultValue={[0]}
					max={4}
					step={1}
				/>
				<div className="grid grid-cols-5 items-center justify-between text-muted-foreground text-xs">
					{difficultyOptions.map((difficulty, index) => (
						<span key={index}>{difficulty}</span>
					))}
				</div>
			</div>
		</CollapsibleFilter>
	);
}

function ExerciseNotes() {
	return (
		<CollapsibleFilter
			title="Notes"
			icon={Notebook}>
			<Textarea placeholder="Write a note..." />
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
