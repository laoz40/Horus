import { useId, useRef, useState } from "react";
import type { MouseEvent, PointerEvent, Touch, TouchEvent } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { useExerciseSuggestions } from "@/features/workout-form/hooks/useExerciseSuggestions";
import { Workout } from "@/features/workout-form/lib/validateWorkout";

// Keep the input focused when the mouse is used on the dropdown options.
const preventMouseBlur = (event: MouseEvent) => {
	event.preventDefault();
};

const preventMousePointerBlur = (event: PointerEvent) => {
	if (event.pointerType === "mouse") {
		event.preventDefault();
	}
};

export function ExerciseNameInputDropdown({ exerciseIndex }: { exerciseIndex: number }) {
	const listboxId = useId();
	const { control, setValue, setFocus } = useFormContext<Workout>();
	const exerciseNamePath = `exercises.${exerciseIndex}.global.name` as const;
	const query = useWatch({ control, name: exerciseNamePath }) ?? "";
	const [isOpen, setIsOpen] = useState(false);
	const { suggestions, isDbSearchLoading, isOnlineSearchLoading, fetchMoreSuggestions } =
		useExerciseSuggestions(query);

	const filteredSuggestions = query.trim() ? suggestions : [];
	const shouldShowSuggestions = isOpen && query.trim().length > 0;
	const didHandleTouchSelectionRef = useRef(false);
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const didScrollTouchRef = useRef(false);
	const lastTouchYRef = useRef<number | null>(null);
	const listboxRef = useRef<HTMLDivElement | null>(null);

	return (
		<Controller
			name={exerciseNamePath}
			control={control}
			render={({ field }) => {
				const clearExerciseIdentity = () => {
					setValue(`exercises.${exerciseIndex}.exerciseId`, undefined);
				};

				const selectExercise = (exerciseName: string) => {
					field.onChange(exerciseName);
					clearExerciseIdentity();

					const match = suggestions.find((exercise) => exercise.name === exerciseName);
					setValue(`exercises.${exerciseIndex}.global.muscleGroups`, match?.muscleGroups ?? []);
					setIsOpen(false);

					// Focus weight so the user can type immediately after picking an exercise.
					// The timeout defers one tick: the weight input is only rendered by the name
					// change above, so it does not exist to focus until this handler has finished.
					setTimeout(() => setFocus(`exercises.${exerciseIndex}.sets.0.weight`), 0);
				};

				const startTouch = (touch: Touch) => {
					touchStartRef.current = { x: touch.clientX, y: touch.clientY };
					didScrollTouchRef.current = false;
					lastTouchYRef.current = touch.clientY;
				};

				const updateTouchScrollState = (touch: Touch) => {
					const startTouchPoint = touchStartRef.current;
					if (!startTouchPoint) return;

					const movedX = Math.abs(touch.clientX - startTouchPoint.x);
					const movedY = Math.abs(touch.clientY - startTouchPoint.y);
					if (movedX > 8 || movedY > 8) {
						didScrollTouchRef.current = true;
					}
				};

				const scrollSuggestionList = (touch: Touch) => {
					updateTouchScrollState(touch);

					const lastTouchY = lastTouchYRef.current;
					const listbox = listboxRef.current;
					if (lastTouchY === null || !listbox) {
						lastTouchYRef.current = touch.clientY;
						return;
					}

					const deltaY = lastTouchY - touch.clientY;
					listbox.scrollTop += deltaY;
					lastTouchYRef.current = touch.clientY;
				};

				const stopTouch = () => {
					lastTouchYRef.current = null;
				};

				const handleSuggestionListTouchMove = (event: TouchEvent<HTMLDivElement>) => {
					event.preventDefault();
					scrollSuggestionList(event.touches[0]);
				};

				const handleListboxTouchStart = (event: TouchEvent<HTMLDivElement>) => {
					startTouch(event.touches[0]);
				};

				const handleListboxTouchEnd = () => {
					stopTouch();
				};

				const handleListboxTouchCancel = () => {
					stopTouch();
				};

				const handleOptionTouchEnd = (
					event: TouchEvent<HTMLButtonElement>,
					exerciseName: string,
				) => {
					// Selecting an option unmounts the dropdown and mounts set rows under the finger;
					// preventDefault stops the browser's synthetic click from focusing the reps input.
					event.preventDefault();
					selectExerciseFromTouch(exerciseName);
					stopTouch();
				};

				const handleSearchOnlineTouchEnd = () => {
					fetchMoreSuggestionsFromTouch();
					stopTouch();
				};

				const listboxClassName =
					"max-h-72 scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0";

				const shouldHandleTouchTap = () => {
					const shouldHandle = !didScrollTouchRef.current;
					touchStartRef.current = null;
					didScrollTouchRef.current = false;
					return shouldHandle;
				};

				const selectExerciseFromTouch = (exerciseName: string) => {
					if (!shouldHandleTouchTap()) return;

					didHandleTouchSelectionRef.current = true;
					selectExercise(exerciseName);
				};

				const selectExerciseFromClick = (exerciseName: string) => {
					if (didHandleTouchSelectionRef.current) {
						didHandleTouchSelectionRef.current = false;
						return;
					}

					selectExercise(exerciseName);
				};

				const fetchMoreSuggestionsFromTouch = () => {
					if (!shouldHandleTouchTap()) return;

					didHandleTouchSelectionRef.current = true;
					void fetchMoreSuggestions();
				};

				const fetchMoreSuggestionsFromClick = () => {
					if (didHandleTouchSelectionRef.current) {
						didHandleTouchSelectionRef.current = false;
						return;
					}

					void fetchMoreSuggestions();
				};

				return (
					<div className="relative">
						<InputGroup className="h-11 rounded-none border-x-0 border-t-0 border-b border-transparent bg-transparent! shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-0">
							<InputGroupInput
								placeholder="Enter an exercise..."
								className="px-0 font-semibold shadow-none"
								maxLength={64}
								value={query}
								autoComplete="off"
								role="combobox"
								aria-expanded={!!shouldShowSuggestions}
								aria-controls={listboxId}
								onChange={(e) => {
									const nextQuery = e.target.value ?? "";
									field.onChange(nextQuery);
									clearExerciseIdentity();
									setIsOpen(true);
									// Reset metadata when typing because the name no longer identifies the selected exercise.
									setValue(`exercises.${exerciseIndex}.global.muscleGroups`, []);
								}}
								onFocus={() => setIsOpen(true)}
								onClick={(e) => {
									e.currentTarget.select();
									setIsOpen(true);
								}}
								onBlur={() => {
									field.onBlur();
									setIsOpen(false);
								}}
							/>
						</InputGroup>

						{shouldShowSuggestions && (
							<div className="isolate absolute top-full left-0 z-50 mt-1.5 w-full">
								<div className="bg-popover text-popover-foreground ring-foreground/10 group/combobox-content relative max-h-96 w-full overflow-hidden rounded-md shadow-md ring-1">
									<div
										ref={listboxRef}
										id={listboxId}
										role="listbox"
										className={listboxClassName}
										onTouchStart={handleListboxTouchStart}
										onTouchMove={handleSuggestionListTouchMove}
										onTouchEnd={handleListboxTouchEnd}
										onTouchCancel={handleListboxTouchCancel}>
										{filteredSuggestions.map((exercise) => (
											<button
												key={exercise.normalizedName}
												type="button"
												role="option"
												aria-selected={exercise.name === query}
												className="hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-left text-base outline-hidden select-none"
												onPointerDown={preventMousePointerBlur}
												onMouseDown={preventMouseBlur}
												onTouchEnd={(event) => handleOptionTouchEnd(event, exercise.name)}
												onClick={() => selectExerciseFromClick(exercise.name)}>
												{exercise.name}
											</button>
										))}
										<button
											type="button"
											className="flex w-full justify-start p-2 text-base text-muted-foreground underline disabled:opacity-50"
											disabled={isDbSearchLoading || isOnlineSearchLoading}
											onPointerDown={preventMousePointerBlur}
											onMouseDown={preventMouseBlur}
											onTouchEnd={handleSearchOnlineTouchEnd}
											onClick={fetchMoreSuggestionsFromClick}>
											{isDbSearchLoading
												? "Searching database..."
												: isOnlineSearchLoading
													? "Loading..."
													: "Search Online"}
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				);
			}}
		/>
	);
}
