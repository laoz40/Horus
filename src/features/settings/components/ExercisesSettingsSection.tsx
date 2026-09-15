"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";

import SectionCard from "@/components/SectionCard";

export default function ExercisesSettingsSection() {
	return (
		<SectionCard
			header="Exercises"
			className="p-0">
			<Link href="/settings/exercises">
				<div className="relative flex w-full flex-row items-center justify-between px-2 py-2">
					<span className="text-base">Manage exercises</span>
					<IconChevronRight className="mr-2 size-6" />
				</div>
			</Link>
		</SectionCard>
	);
}
