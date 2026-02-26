export const formatDurationFull = (durationSeconds: number): string => {
	const hours = Math.floor(durationSeconds / 3600);
	const minutes = Math.floor((durationSeconds % 3600) / 60);
	const seconds = durationSeconds % 60;

	// Pad numbers to ensure two digits (e.g., 5 becomes "05")
	const mm = String(minutes).padStart(2, "0");
	const ss = String(seconds).padStart(2, "0");
	const hh = String(hours);

	if (hours > 0) {
		return `${hh}:${mm}:${ss}`;
	} else {
		return `${mm}:${ss}`;
	}
};

export const formatDurationSummary = (durationSeconds: number): string => {
	const hours = Math.floor(durationSeconds / 3600);
	const minutes = Math.floor((durationSeconds % 3600) / 60);

	const h = hours > 0 ? `${hours}h` : "";
	const m = `${minutes}`;

	return `${h} ${m}min`.trim();
};
