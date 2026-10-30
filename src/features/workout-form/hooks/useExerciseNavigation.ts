import { useEffect, useRef, type RefObject } from "react";

import {
	selectScrollTargetId,
	selectExercise,
	setScrollTarget,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

interface UseExerciseNavigationReturn {
	exerciseListRef: RefObject<HTMLDivElement | null>;
	registerExerciseRef: (
		exerciseId: string,
		exerciseIndex: number,
		element: HTMLDivElement | null,
	) => void;
	scrollToExerciseOnMount: (exerciseIndex: number) => void;
}

export const useExerciseNavigation = (): UseExerciseNavigationReturn => {
	const scrollTargetId = useWorkoutFormUiStore(selectScrollTargetId);
	const exerciseListRef = useRef<HTMLDivElement | null>(null);
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

	// Scroll to an existing exercise requested by the selector or validation.
	useEffect(() => {
		if (!scrollTargetId) return;

		const scrollTarget = exerciseFormRefs.current[scrollTargetId];
		scrollTarget?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
		setScrollTarget(null);
	}, [scrollTargetId]);

	// Create the visibility observer once; exercise forms register and unregister
	// themselves through registerExerciseRef as they mount and unmount.
	useEffect(() => {
		const scrollContainer = exerciseListRef.current;

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
					selectExercise(exerciseId);
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
	}, []);

	return {
		exerciseListRef,
		registerExerciseRef,
		scrollToExerciseOnMount: (exerciseIndex) => {
			pendingScrollIndexRef.current = exerciseIndex;
		},
	};
};
