import { forwardRef } from "react";
import type { IconProps } from "@tabler/icons-react";

export const IconWeightFilled = forwardRef<SVGSVGElement, IconProps>(
	({ size = 24, className, stroke: _stroke, ...props }, ref) => (
		<svg
			ref={ref}
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="currentColor"
			className={["tabler-icon", "tabler-icon-weight-filled", className].filter(Boolean).join(" ")}
			{...props}>
			<path
				stroke="none"
				d="M0 0h24v24H0z"
				fill="none"
			/>
			<path d="M12 3a3 3 0 1 0 0 6a3 3 0 1 0 0 -6" />
			<path d="M6.835 9h10.33a1 1 0 0 1 .984 .821l1.637 9a1 1 0 0 1 -.984 1.179h-13.604a1 1 0 0 1 -.984 -1.179l1.637 -9a1 1 0 0 1 .984 -.821" />
		</svg>
	),
);

IconWeightFilled.displayName = "IconWeightFilled";
