declare module "react-calendar-heatmap" {
	import type { ComponentType } from "react";

	export type ReactCalendarHeatmapValue = {
		date: string | Date;
		count?: number;
	};

	export type ReactCalendarHeatmapProps<T extends ReactCalendarHeatmapValue> = {
		startDate: string | Date;
		endDate: string | Date;
		values: T[];
		gutterSize?: number;
		showWeekdayLabels?: boolean;
		showMonthLabels?: boolean;
		classForValue?: (value: T | undefined) => string;
	};

	const CalendarHeatmap: ComponentType<ReactCalendarHeatmapProps<ReactCalendarHeatmapValue>>;
	export default CalendarHeatmap;
}
