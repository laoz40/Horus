import { useEffect, useRef, useState, type RefObject } from "react";

interface UseExerciseNavigationProps {
	exerciseIds: string[];
	setSelectedExerciseId: (exerciseId: string) => void;
}

interface UseExerciseNavigationReturn {
	exerciseListRef: RefObject<HTMLDivElement | null>;
	registerExerciseRef: (exerciseId: string, exerciseFormElement: HTMLDivElement | null) => void;
	setScrollTargetId: (exerciseId: string) => void;
}

export const useExerciseNavigation = ({
	exerciseIds,
	setSelectedExerciseId,
}: UseExerciseNavigationProps): UseExerciseNavigationReturn => {
	const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
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
			block: "end",
		});
	}, [scrollTargetId]);

	useEffect(() => {
		const newExerciseAdded =
			exerciseIds.length > previousExerciseCount.current && exerciseIds.length > 0;

		if (newExerciseAdded) {
			const latestExerciseId = exerciseIds[exerciseIds.length - 1];
			if (latestExerciseId) {
				setScrollTargetId(latestExerciseId);
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

				const mostVisible = visible.sort(
					(a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
				)[0];
				const exerciseId = (mostVisible.target as HTMLElement).dataset.exerciseId;

				if (exerciseId) {
					setSelectedExerciseId(exerciseId);
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
	}, [exerciseIds.length, setSelectedExerciseId]);

	return {
		exerciseListRef,
		registerExerciseRef,
		setScrollTargetId,
	};
};
