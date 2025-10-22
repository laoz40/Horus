// Date and string utilities
export const monthsShort = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];
export const weekdays = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];
export const weekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const displayHistoryDate = (dateInput: Date | string) => {
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
	const today = new Date();

	// Reset hours for accurate date comparison
	const resetTime = (d: Date) => {
		const newDate = new Date(d);
		newDate.setHours(0, 0, 0, 0);
		return newDate;
	};

	const dateOnly = resetTime(date);
	const todayOnly = resetTime(today);
	const oneWeekAgo = new Date(todayOnly);
	oneWeekAgo.setDate(todayOnly.getDate() - 6); // 6 days ago + today = 7 days

	// If date is today, return "Today"
	if (dateOnly.getTime() === todayOnly.getTime()) {
		return "Today";
	}

	// If date is within the last 7 days, return short weekday
	if (dateOnly >= oneWeekAgo && dateOnly < todayOnly) {
		const dayIndex = date.getDay();
		return weekdaysShort[dayIndex];
	}

	const dd = String(date.getDate());
	const mon = monthsShort[date.getMonth()];
	const yyyy = date.getFullYear();

	// Only show year if it's not the current year
	return yyyy === today.getFullYear()
		? `${dd} ${mon}`
		: `${dd} ${mon}, ${yyyy}`;
};

export const displayFullDate = (dateInput: Date | string) => {
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
	const dayName = weekdays[date.getDay()]; // Full weekday name (e.g., "Thursday")
	const day = date.getDate(); // Day of month (1-31)
	const month = monthsShort[date.getMonth()]; // Month name (e.g., "June")
	return `${dayName} ${day}, ${month}`;
};

// Make text safe to insert into innerHTML (prevents broken HTML and XSS).
export const esc = (s: string) =>
	String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
