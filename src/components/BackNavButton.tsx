import { IconChevronLeft } from "@tabler/icons-react";
import type { ComponentProps, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const backNavButtonClassName = "h-auto shrink-0 justify-start gap-0 px-0 py-1 has-[>svg]:px-0";

export const backNavIconClassName = "size-7 shrink-0 -ms-2";

export function BackNavButton({
	className,
	children,
	...props
}: ComponentProps<typeof Button>): ReactElement {
	return (
		<Button
			variant="ghost"
			className={cn(backNavButtonClassName, className)}
			{...props}>
			{children ?? <IconChevronLeft className={backNavIconClassName} />}
		</Button>
	);
}
