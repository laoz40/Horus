import { Autocomplete } from "@base-ui/react/autocomplete";
import { useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { IconLoader2, IconSearch, IconXboxX } from "@tabler/icons-react";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { useExerciseSuggestions } from "@/features/exercise-picker/hooks/useExerciseSuggestions";
import { applyPickedExercise } from "@/features/workout-form/lib/selectExercise";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";

// The footer is an action, not an autocomplete item. Keep the name input focused
// without intercepting touch scrolling or handling activation before click.
const preventPointerBlur = (event: PointerEvent) => {
	event.preventDefault();
};

const preventMouseBlur = (event: MouseEvent) => {
	event.preventDefault();
};

export function ExerciseNameInputDropdown({ exerciseIndex }: { exerciseIndex: number }) {
	const anchorRef = useRef<HTMLDivElement | null>(null);
	const { control, setValue, setFocus } = useFormContext<Workout>();
	const exerciseNamePath = `exercises.${exerciseIndex}.global.name` as const;
	const query = useWatch({ control, name: exerciseNamePath }) ?? "";
	const [isOpen, setIsOpen] = useState(false);

	const { suggestions, isDbSearchLoading, isOnlineSearchLoading, fetchMoreSuggestions } =
		useExerciseSuggestions(query, isOpen);

	const isEmpty = !query.trim();
	const isSearching = isDbSearchLoading || isOnlineSearchLoading;
	let searchLabel = "Search Online";

	if (isDbSearchLoading) {
		searchLabel = "Searching database";
	} else if (isOnlineSearchLoading) {
		searchLabel = "Loading";
	}

	return (
		<Controller
			name={exerciseNamePath}
			control={control}
			render={({ field }) => (
				<Autocomplete.Root
					items={suggestions.map((exercise) => exercise.name)}
					filter={null}
					value={query}
					open={isOpen && !isEmpty}
					openOnInputClick
					onOpenChange={setIsOpen}
					onValueChange={(name, details) => {
						if (details.reason === "item-press") {
							const match = suggestions.find((exercise) => exercise.name === name);

							applyPickedExercise({
								exerciseIndex,
								setName: field.onChange,
								setValue,
								exercise: { name, muscleGroups: match?.muscleGroups },
							});
						} else {
							field.onChange(name);
							setValue(`exercises.${exerciseIndex}.exerciseId`, undefined);
							// Typed names no longer identify the previously selected exercise.
							setValue(`exercises.${exerciseIndex}.global.muscleGroups`, []);
						}
					}}>
					<div className="relative w-full">
						<Autocomplete.InputGroup
							ref={anchorRef}
							render={<InputGroup />}
							className="h-11 w-full rounded-none border-x-0 border-t-0 border-b border-transparent bg-transparent! shadow-none has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[>[data-align=inline-end]]:[&>input]:pr-0">
							<Autocomplete.Input
								ref={field.ref}
								name={field.name}
								render={<InputGroupInput className="px-0 font-semibold placeholder:opacity-0" />}
								placeholder="Search an exercise..."
								maxLength={64}
								autoComplete="off"
								aria-label="Exercise name"
								onFocus={() => setIsOpen(true)}
								onBlur={field.onBlur}
							/>
							{query && (
								<InputGroupAddon
									align="inline-end"
									className="pr-0">
									<Autocomplete.Clear
										render={<InputGroupButton size="icon-sm" />}
										aria-label="Clear exercise name"
										onClick={() => {
											setFocus(exerciseNamePath);
											setIsOpen(false);
										}}>
										<IconXboxX />
									</Autocomplete.Clear>
								</InputGroupAddon>
							)}
						</Autocomplete.InputGroup>

						{isEmpty && (
							<div
								className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 text-muted-foreground"
								aria-hidden="true">
								<IconSearch className="size-5 shrink-0" />
								<span className="text-xl font-semibold">Search an exercise...</span>
							</div>
						)}
					</div>

					<Autocomplete.Portal>
						<Autocomplete.Positioner
							anchor={anchorRef}
							side="bottom"
							align="start"
							sideOffset={6}
							collisionAvoidance={{ side: "none", align: "none", fallbackAxisSide: "none" }}>
							<Autocomplete.Popup className="relative max-h-96 w-(--anchor-width) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
								<div className="max-h-72 scroll-py-1 overflow-y-auto overscroll-contain p-1">
									<Autocomplete.List>
										{suggestions.map((exercise) => (
											<Autocomplete.Item
												key={exercise.normalizedName}
												value={exercise.name}
												className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-left text-base outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground">
												{exercise.name}
											</Autocomplete.Item>
										))}
									</Autocomplete.List>
									<button
										type="button"
										className="flex w-full items-center justify-start gap-2 p-2 text-base text-muted-foreground underline disabled:opacity-50"
										disabled={isSearching}
										onPointerDown={preventPointerBlur}
										onMouseDown={preventMouseBlur}
										onClick={() => void fetchMoreSuggestions()}>
										{isSearching && <IconLoader2 className="size-4 animate-spin" />}
										{searchLabel}
									</button>
								</div>
							</Autocomplete.Popup>
						</Autocomplete.Positioner>
					</Autocomplete.Portal>
				</Autocomplete.Root>
			)}
		/>
	);
}
