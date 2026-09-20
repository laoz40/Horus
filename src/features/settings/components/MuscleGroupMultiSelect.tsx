"use client";

import { Badge } from "@/components/ui/badge";
import { MUSCLE_CATEGORY_OPTIONS } from "@/features/settings/lib/muscleGroupOptions";
import type { MuscleGroupCategory } from "@/features/workout-form/lib/muscleGroupCategories";
import { cn } from "@/lib/utils";

interface MuscleGroupMultiSelectProps {
	selectedCategories: MuscleGroupCategory[];
	onChange: (categories: MuscleGroupCategory[]) => void;
}

function toggleCategory(
	selectedCategories: MuscleGroupCategory[],
	category: MuscleGroupCategory,
): MuscleGroupCategory[] {
	if (selectedCategories.includes(category)) {
		return selectedCategories.filter((selectedCategory) => selectedCategory !== category);
	}

	return [...selectedCategories, category];
}

export default function MuscleGroupMultiSelect({
	selectedCategories,
	onChange,
}: MuscleGroupMultiSelectProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{MUSCLE_CATEGORY_OPTIONS.map((option) => {
				const isSelected = selectedCategories.includes(option.category);

				return (
					<button
						key={option.category}
						type="button"
						aria-pressed={isSelected}
						onClick={() => onChange(toggleCategory(selectedCategories, option.category))}
						className="rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
						<Badge
							variant={isSelected ? "default" : "outline"}
							className={cn(
								"cursor-pointer px-2.5 py-1 text-sm",
								!isSelected && "text-muted-foreground",
							)}>
							{option.label}
						</Badge>
					</button>
				);
			})}
		</div>
	);
}
