import { useRef } from "react";
import type { RefObject, Touch, TouchEvent } from "react";

interface UseSuggestionListTouchScrollReturn {
	listboxRef: RefObject<HTMLDivElement | null>;
	listboxTouchProps: {
		onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
		onTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
		onTouchEnd: () => void;
		onTouchCancel: () => void;
	};
	/** True when the touch ended as a tap rather than a scroll; also resets touch state. */
	shouldHandleTouchTap: () => boolean;
	/** Clears the in-flight touch position after a tap has been handled. */
	stopTouch: () => void;
}

// Touch handling for the suggestion listbox: scrolls the list manually during
// touchmove and distinguishes taps from scroll gestures at touchend.
export const useSuggestionListTouchScroll = (): UseSuggestionListTouchScrollReturn => {
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const didScrollTouchRef = useRef(false);
	const lastTouchYRef = useRef<number | null>(null);
	const listboxRef = useRef<HTMLDivElement | null>(null);

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

	const shouldHandleTouchTap = () => {
		const shouldHandle = !didScrollTouchRef.current;
		touchStartRef.current = null;
		didScrollTouchRef.current = false;
		return shouldHandle;
	};

	const handleSuggestionListTouchMove = (event: TouchEvent<HTMLDivElement>) => {
		event.preventDefault();
		scrollSuggestionList(event.touches[0]);
	};

	const handleListboxTouchStart = (event: TouchEvent<HTMLDivElement>) => {
		startTouch(event.touches[0]);
	};

	return {
		listboxRef,
		listboxTouchProps: {
			onTouchStart: handleListboxTouchStart,
			onTouchMove: handleSuggestionListTouchMove,
			onTouchEnd: stopTouch,
			onTouchCancel: stopTouch,
		},
		shouldHandleTouchTap,
		stopTouch,
	};
};
