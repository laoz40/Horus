"use client";

import type { ReactElement, ReactNode } from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface DetailHoverCardProps {
	trigger: ReactNode;
	children: ReactNode;
}

export default function DetailHoverCard({ trigger, children }: DetailHoverCardProps): ReactElement {
	return (
		<HoverCard openDelay={200}>
			<HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
			<HoverCardContent className="w-64 text-sm">{children}</HoverCardContent>
		</HoverCard>
	);
}
