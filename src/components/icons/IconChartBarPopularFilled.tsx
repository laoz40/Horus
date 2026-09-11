import { forwardRef } from "react";
import type { IconProps } from "@tabler/icons-react";

export const IconChartBarPopularFilled = forwardRef<SVGSVGElement, IconProps>(
	({ size = 24, className, stroke: _stroke, ...props }, ref) => (
		<svg
			ref={ref}
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="currentColor"
			className={["tabler-icon", "tabler-icon-chart-bar-popular-filled", className]
				.filter(Boolean)
				.join(" ")}
			{...props}>
			<path
				stroke="none"
				d="M0 0h24v24H0z"
				fill="none"
			/>
			<path d="M3.5 21a1.5 1.5 0 0 1 -1.5 -1.5L2 19.5L2 12.5a1.5 1.5 0 0 1 1.5 -1.5L3.5 11L8.5 11a1.5 1.5 0 0 1 1.5 1.5L10 12.5L10 19.5a1.5 1.5 0 0 1 -1.5 1.5L8.5 21L3.5 21Z" />
			<path d="M9.5 21a1.5 1.5 0 0 1 -1.5 -1.5L8 19.5L8 8.5a1.5 1.5 0 0 1 1.5 -1.5L9.5 7L14.5 7a1.5 1.5 0 0 1 1.5 1.5L16 8.5L16 19.5a1.5 1.5 0 0 1 -1.5 1.5L14.5 21L9.5 21Z" />
			<path d="M15.5 21a1.5 1.5 0 0 1 -1.5 -1.5L14 19.5L14 4.5a1.5 1.5 0 0 1 1.5 -1.5L15.5 3L20.5 3a1.5 1.5 0 0 1 1.5 1.5L22 4.5L22 19.5a1.5 1.5 0 0 1 -1.5 1.5L20.5 21L15.5 21Z" />
		</svg>
	),
);

IconChartBarPopularFilled.displayName = "IconChartBarPopularFilled";
