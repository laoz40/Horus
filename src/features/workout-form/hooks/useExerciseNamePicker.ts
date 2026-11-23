import { useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { Effect } from "effect";

import { useExerciseSuggestions } from "@/features/exercise-picker/hooks/useExerciseSuggestions";
import type { PickedExercise } from "@/features/exercise-picker/components/MuscleGroupExerciseBrowser";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";

type PickerState = { kind: "closed" } | { kind: "open" };

type PickerEvent =
	| { kind: "open" | "close" | "request-online" }
	| { kind: "type"; name: string }
	| { kind: "select"; exercise: PickedExercise }
	| { kind: "clear" };

export function useExerciseNamePicker(exerciseIndex: number) {
	const { control, setValue } = useFormContext<Workout>();

	const {
		field: { ref: inputRef, ...field },
	} = useController({ control, name: `exercises.${exerciseIndex}.global.name` });

	const query = field.value;
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

	function updateExercise(name: string, muscleGroups: string[] = []) {
		field.onChange(name);
		setValue(`exercises.${exerciseIndex}.exerciseId`, undefined);
		setValue(`exercises.${exerciseIndex}.global.muscleGroups`, muscleGroups);
	}

	function send(event: PickerEvent) {
		switch (event.kind) {
			case "open":
				setState({ kind: "open" });

				return;
			case "close":
				setState({ kind: "closed" });

				return;
			case "clear":
				setState({ kind: "closed" });
				updateExercise("");

				return;
			case "type":
				updateExercise(event.name);

				return;
			case "select":
				setState({ kind: "closed" });
				updateExercise(event.exercise.name, event.exercise.muscleGroups);

				return;

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

	return { field, inputRef, state, suggestions, isDbSearchLoading, isOnlineSearchLoading, send };
}
