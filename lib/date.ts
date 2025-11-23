import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// e.g. "Sunday, 23 Nov 2025"
export const currentDateFull = dayjs().format("dddd, D MMM YYYY");

dayjs.extend(relativeTime);
export const getRelativeTime = (date: Date) => {
	if (!date) {
		return "Date unavailable";
	}
	return dayjs(date).fromNow();
};
