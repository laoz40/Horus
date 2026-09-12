"use client";

import type { ReactElement, ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DetailPopoverProps {
	trigger: ReactNode;
	children: ReactNode;
}

export default function DetailPopover({ trigger, children }: DetailPopoverProps): ReactElement {
	return (
		<Popover>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent className="w-64 text-sm">{children}</PopoverContent>
		</Popover>
	);
}
