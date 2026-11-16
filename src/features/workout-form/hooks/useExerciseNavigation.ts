import { useStore } from "zustand";
import { useRef, type RefCallback } from "react";

import type { ExerciseSelectionStore } from "@/features/workout-form/stores/exerciseSelectionStore";

interface UseExerciseNavigationReturn {
	exerciseListRef: RefCallback<HTMLDivElement>;
	registerExerciseRef: (
		exerciseId: string,
		exerciseIndex: number,
		element: HTMLDivElement | null,
	) => void;
	scrollToExercise: (exerciseId: string) => void;
	scrollToExerciseOnMount: (exerciseIndex: number) => void;
}

export const useExerciseNavigation = ({
	exerciseSelectionStore,
}: {
	exerciseSelectionStore: ExerciseSelectionStore;
}): UseExerciseNavigationReturn => {
	const send = useStore(exerciseSelectionStore, (store) => store.send);
	const exerciseFormRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const visibilityObserverRef = useRef<IntersectionObserver | null>(null);
	const pendingScrollIndexRef = useRef<number | null>(null);

	// store form element by id to find and scroll to it later
	const registerExerciseRef = (
		exerciseId: string,
		exerciseIndex: number,
		exerciseFormElement: HTMLDivElement | null,
	) => {
		const previousElement = exerciseFormRefs.current[exerciseId];
		exerciseFormRefs.current[exerciseId] = exerciseFormElement;

		if (exerciseFormElement) {
			exerciseFormElement.dataset.exerciseId = exerciseId;

			// The add action requests scrolling; wait until its new form has mounted.
			if (pendingScrollIndexRef.current === exerciseIndex) {
				pendingScrollIndexRef.current = null;

				exerciseFormElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
			}

			// Track newly mounted exercise forms with the visibility observer.
			visibilityObserverRef.current?.observe(exerciseFormElement);
		} else if (previousElement) {
			visibilityObserverRef.current?.unobserve(previousElement);
		}
	};

	// Scroll directly to an existing exercise from selection or validation handlers.
	const scrollToExercise = (exerciseId: string) => {
		exerciseFormRefs.current[exerciseId]?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
	};

	// Exercise forms register and unregister as they mount and unmount.
	const exerciseListRef = (scrollContainer: HTMLDivElement | null) => {
		if (!scrollContainer) return;

		const observer = new IntersectionObserver(
			(forms) => {
				const visible = forms.filter((form) => form.isIntersecting);

				if (visible.length === 0) return;

				const mostVisible = visible.toSorted(
					(a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
				)[0];

				if (!mostVisible) return;

				const { target } = mostVisible;
				const exerciseId = target instanceof HTMLElement ? target.dataset.exerciseId : undefined;

				if (exerciseId) {
					send({ event: "SELECT_EXERCISE", exerciseId });
				}
			},
			{
				root: scrollContainer,
				rootMargin: "-45% 0px -45% 0px",
				threshold: [0, 0.5, 1],
			},
		);

		visibilityObserverRef.current = observer;

		Object.values(exerciseFormRefs.current).forEach((exerciseForm) => {
			if (exerciseForm) {
				observer.observe(exerciseForm);
			}
		});

		return () => {
			observer.disconnect();
			visibilityObserverRef.current = null;
		};
	};

	return {
		exerciseListRef,
		registerExerciseRef,
		scrollToExercise,
		scrollToExerciseOnMount: (exerciseIndex) => {
			pendingScrollIndexRef.current = exerciseIndex;
		},
	};
};
