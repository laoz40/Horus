export const REST_TARGET_MS = 2 * 60 * 1000;

export const formatRestElapsedTime = (elapsedMs: number): string => {
	const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
