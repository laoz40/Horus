import { useEffect, useRef, type RefObject } from "react";

import {
	selectScrollTargetId,
	selectExercise,
	setScrollTarget,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

interface UseExerciseNavigationProps {
	exerciseIds: string[];
}

interface UseExerciseNavigationReturn {
	exerciseListRef: RefObject<HTMLDivElement | null>;
	registerExerciseRef: (exerciseId: string, exerciseFormElement: HTMLDivElement | null) => void;
}

export const useExerciseNavigation = ({
	exerciseIds,
}: UseExerciseNavigationProps): UseExerciseNavigationReturn => {
	const scrollTargetId = useWorkoutFormUiStore(selectScrollTargetId);
	const exerciseListRef = useRef<HTMLDivElement | null>(null);
	const exerciseFormRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const previousExerciseCount = useRef(exerciseIds.length);

	// store form element by id to find and scroll to it later
	const registerExerciseRef = (exerciseId: string, exerciseFormElement: HTMLDivElement | null) => {
		exerciseFormRefs.current[exerciseId] = exerciseFormElement;
		if (exerciseFormElement) {
			exerciseFormElement.dataset.exerciseId = exerciseId;
		}
	};

	useEffect(() => {
		if (!scrollTargetId) return;

		const scrollTarget = exerciseFormRefs.current[scrollTargetId];
		scrollTarget?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
		setScrollTarget(null);
	}, [scrollTargetId]);

	useEffect(() => {
		const newExerciseAdded =
			exerciseIds.length > previousExerciseCount.current && exerciseIds.length > 0;

		if (newExerciseAdded) {
			const latestExerciseId = exerciseIds[exerciseIds.length - 1];
			if (latestExerciseId) {
				setScrollTarget(latestExerciseId);
			}
		}

		previousExerciseCount.current = exerciseIds.length;
	}, [exerciseIds]);

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

		Object.values(exerciseFormRefs.current).forEach((exerciseForm) => {
			if (exerciseForm) {
				observer.observe(exerciseForm);
			}
		});

		return () => observer.disconnect();
	}, [exerciseIds.length]);

	return {
		exerciseListRef,
		registerExerciseRef,
	};
};
