import { Autocomplete } from "@base-ui/react/autocomplete";
import { useRef } from "react";
import type { SyntheticEvent } from "react";

import { IconLoader2, IconSearch, IconXboxX } from "@tabler/icons-react";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import type { useExerciseNamePicker } from "@/features/workout-form/hooks/useExerciseNamePicker";
import { MAX_EXERCISE_NAME_LENGTH } from "@/features/workout-form/lib/validateWorkout";

// Keep the keyboard open when tapping Search Online. iOS can also send a
// synthetic mousedown without pointerdown, so both events use this guard.
const preventInputBlur = (event: SyntheticEvent) => {
	event.preventDefault();
};

export function ExerciseNameInputDropdown({
	picker,
}: {
	picker: ReturnType<typeof useExerciseNamePicker>;
}) {
	const anchorRef = useRef<HTMLDivElement | null>(null);

	const { field, inputRef, state, suggestions, isDbSearchLoading, isOnlineSearchLoading, send } =
		picker;

	const query = field.value;

	const isEmpty = !query.trim();
	const isSearching = isDbSearchLoading || isOnlineSearchLoading;
	let searchLabel = "Search Online";

	if (isDbSearchLoading) {
		searchLabel = "Searching database";
	} else if (isOnlineSearchLoading) {
		searchLabel = "Loading";
	}

	return (
		<Autocomplete.Root
			items={suggestions.map((exercise) => exercise.name)}
			filter={null}
			value={query}
			open={state.kind === "open" && !isEmpty}
			openOnInputClick
			onOpenChange={(open) => void send({ kind: open ? "open" : "close" })}
			onValueChange={(name, details) => {
				if (details.reason === "clear-press") {
					void send({ kind: "clear" });

					return;
				}

				if (details.reason === "item-press") {
					const exercise = suggestions.find((suggestion) => suggestion.name === name);
					void send({ kind: "select", exercise: exercise ?? { name } });

					return;
				}

				void send({ kind: "type", name });
			}}>
			<div className="relative w-full">
				<Autocomplete.InputGroup
					ref={anchorRef}
					render={<InputGroup />}
					className="h-11 w-full rounded-none border-x-0 border-t-0 border-b border-transparent bg-transparent! shadow-none has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[>[data-align=inline-end]]:[&>input]:pr-0">
					<Autocomplete.Input
						ref={inputRef}
						name={field.name}
						render={<InputGroupInput className="px-0 font-semibold placeholder:opacity-0" />}
						placeholder="Search an exercise..."
						maxLength={MAX_EXERCISE_NAME_LENGTH}
						autoComplete="off"
						aria-label="Exercise name"
						onFocus={() => void send({ kind: "open" })}
						onBlur={field.onBlur}
					/>
					{query && (
						<InputGroupAddon
							align="inline-end"
							className="pr-0">
							<Autocomplete.Clear
								render={<InputGroupButton size="icon-sm" />}
								aria-label="Clear exercise name">
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
								onPointerDown={preventInputBlur}
								onMouseDown={preventInputBlur}
								onClick={() => void send({ kind: "request-online" })}>
								{isSearching && <IconLoader2 className="size-4 animate-spin" />}
								{searchLabel}
							</button>
						</div>
					</Autocomplete.Popup>
				</Autocomplete.Positioner>
			</Autocomplete.Portal>
		</Autocomplete.Root>
	);
}
