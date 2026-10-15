"use client";

import { Activity, type ReactElement, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import ProgressExerciseBrowseSection from "@/features/progress/components/ProgressExerciseBrowseSection";

export default function ProgressLayout({ children }: { children: ReactNode }): ReactElement {
	const isProgressPage = usePathname() === "/progress";

	return (
		<div className={`flex h-full w-full flex-1 flex-col ${isProgressPage ? "max-md:pb-20" : ""}`}>
			{children}
			<Activity mode={isProgressPage ? "visible" : "hidden"}>
				<ProgressExerciseBrowseSection />
			</Activity>
		</div>
	);
}
