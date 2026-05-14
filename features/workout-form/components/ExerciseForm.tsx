"use client";

import { HistoryIcon, PlusIcon } from "lucide-react";
import { forwardRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Workout } from "@/features/workout-form/lib/validateWorkout";
import {
	openRecentSetsDialog,
	setRecentCompletedSets,
	setRecentSetsError,
	setRecentSetsLoading,
} from "@/features/workout-form/stores/workoutFormUiStore";
import { showSetDeletedToast } from "@/lib/toastMessages";
import { cn } from "@/lib/utils";
import { useConvex } from "convex/react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { createDefaultSet } from "../lib/WorkoutFormDefaults";
import ExerciseCollapsibles from "./ExerciseCollapsibles";
import { ExerciseNameInputDropdown } from "./ExerciseNameInputDropdown";
import SetRow from "./SetRow";

interface ExerciseFormProps extends React.HTMLAttributes<HTMLDivElement> {
	exerciseIndex: number;
	isEditing: boolean;
}

const ExerciseForm = forwardRef<HTMLDivElement, ExerciseFormProps>(
	({ className, exerciseIndex, isEditing }, ref) => {
		const convex = useConvex();

		const {
			control,
			trigger,
			formState: { errors },
		} = useFormContext<Workout>();

		const {
			fields: sets,
			append,
			remove,
		} = useFieldArray({
			name: `exercises.${exerciseIndex}.sets`,
		});

		const handleAddSet = () => {
			append(createDefaultSet());
			trigger(`exercises.${exerciseIndex}.sets`);
		};

		useEffect(() => {
			if (sets.length > 0) return;

			append(createDefaultSet());
			trigger(`exercises.${exerciseIndex}.sets`);
		}, [append, exerciseIndex, sets.length, trigger]);

		// BUG: when loading a workout to edit, adding new sets after deleting sets loads previous data
		const handleDeleteSet = (setIndex: number) => {
			remove(setIndex);
			showSetDeletedToast();
		};

		const exerciseName = useWatch({
			control,
			name: `exercises.${exerciseIndex}.global.name` as const,
		}) as string | undefined;
		const hasExerciseName = Boolean(exerciseName?.trim());

		const handleRecentClick = async () => {
			const trimmedName = exerciseName?.trim();
			if (!trimmedName) return;

			openRecentSetsDialog(trimmedName);

			try {
				const fetchedSets = await convex.query(api.exercises.getRecentCompletedSetsByExerciseName, {
					exerciseName: trimmedName,
				});

				setRecentCompletedSets(fetchedSets);
			} catch (error) {
				console.error("Failed to fetch recent completed sets:", error);
				setRecentSetsError("Couldn't load recent completed sets.");
			} finally {
				setRecentSetsLoading(false);
			}
		};

		return (
			<section
				ref={ref}
				className={cn("flex min-h-full flex-col gap-3 p-4", className)}>
				{/* Exercise Name */}
				<div className="shrink-0 flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<div className="flex-1">
							<ExerciseNameInputDropdown exerciseIndex={exerciseIndex} />
						</div>
						{hasExerciseName && (
							<Button
								variant="outline"
								size="default"
								type="button"
								className="h-11 w-11 shrink-0 justify-end border-none bg-transparent! p-0 text-muted-foreground shadow-none has-[>svg]:px-0"
								onClick={handleRecentClick}
								aria-label="Recent exercises">
								<HistoryIcon className="size-5" />
							</Button>
						)}
					</div>
					{errors.exercises?.[exerciseIndex]?.global?.name && (
						<span className="text-red-500 text-sm">
							{errors.exercises?.[exerciseIndex]?.global?.name?.message}
						</span>
					)}
				</div>

				{hasExerciseName && (
					<div className="flex min-h-0 flex-1 flex-col gap-2">
						{/* Set Rows */}
						<div className="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 no-scrollbar">
							<div className="flex flex-col gap-3 pt-0.5">
								{sets.map((set, setIndex) => (
									<SetRow
										key={set.id}
										setIndex={setIndex}
										exerciseIndex={exerciseIndex}
										isEditing={isEditing}
										onDeleteSet={handleDeleteSet}
									/>
								))}
							</div>
							<Button
								variant="ghost"
								className="w-full shrink-0 items-center text-muted-foreground text-sm leading-0"
								type="button"
								onClick={handleAddSet}>
								<PlusIcon className="size-4" />
								<span className="translate-y-px">Add Set</span>
							</Button>
							{errors.exercises?.[exerciseIndex]?.sets?.root?.message && (
								<span className="text-red-500 text-sm">
									{errors.exercises?.[exerciseIndex]?.sets?.root?.message}
								</span>
							)}
						</div>

						{/* Difficulty and Notes */}
						<div className="shrink-0">
							<ExerciseCollapsibles exerciseIndex={exerciseIndex} />
						</div>
					</div>
				)}
			</section>
		);
	},
);

ExerciseForm.displayName = "ExerciseForm";

export default ExerciseForm;
