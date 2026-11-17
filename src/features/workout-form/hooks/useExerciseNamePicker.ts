import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Effect } from "effect";

import { useExerciseSuggestions } from "@/features/exercise-picker/hooks/useExerciseSuggestions";
import { applyPickedExercise } from "@/features/workout-form/lib/selectExercise";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";

type PickerState = { kind: "closed" } | { kind: "open" };

type PickerEvent =
	| { kind: "open" | "close" | "request-online" }
	| { kind: "type" | "select"; name: string }
	| { kind: "clear" };

export function useExerciseNamePicker({
	exerciseIndex,
	query,
	setName,
}: {
	exerciseIndex: number;
	query: string;
	setName: (name: string) => void;
}) {
	const { setValue } = useFormContext<Workout>();
	const [state, setState] = useState<PickerState>({ kind: "closed" });
	// Prevent overlapping requests before Query's fetching status reaches the next render.
	const isOnlineRequestPendingRef = useRef(false);

	const { suggestions, isDbSearchLoading, isOnlineSearchLoading, fetchMoreSuggestions } =
		useExerciseSuggestions(query, state.kind === "open");

	const canRequestOnline =
		state.kind === "open" &&
		query.trim().length > 0 &&
		!isDbSearchLoading &&
		!isOnlineSearchLoading;

	function send(event: PickerEvent) {
		switch (event.kind) {
			case "open":
				setState({ kind: "open" });

				return;
			case "close":
				setState({ kind: "closed" });

				return;
			case "clear":
			case "type":
				setName(event.kind === "clear" ? "" : event.name);
				setValue(`exercises.${exerciseIndex}.exerciseId`, undefined);
				// Typed names no longer identify the previously selected exercise.
				setValue(`exercises.${exerciseIndex}.global.muscleGroups`, []);

				if (event.kind === "clear") setState({ kind: "closed" });

				return;
			case "select": {
				const match = suggestions.find((exercise) => exercise.name === event.name);
				applyPickedExercise({
					exerciseIndex,
					setName: setName,
					setValue,
					exercise: { name: event.name, muscleGroups: match?.muscleGroups },
				});

				return;
			}

			case "request-online":
				if (!canRequestOnline || isOnlineRequestPendingRef.current) return;

				isOnlineRequestPendingRef.current = true;

				return Effect.runPromise(
					Effect.promise(fetchMoreSuggestions).pipe(
						Effect.ensuring(
							Effect.sync(() => {
								isOnlineRequestPendingRef.current = false;
							}),
						),
					),
				);
			default: {
				const exhaustive: never = event;

				return exhaustive;
			}
		}
	}

	return { state, suggestions, isDbSearchLoading, isOnlineSearchLoading, send };
}
