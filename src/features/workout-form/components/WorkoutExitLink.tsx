"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactElement } from "react";

import { animateCreateWorkoutExit } from "@/features/workout-form/lib/animateCreateWorkoutExit";

interface WorkoutExitLinkProps {
	href: string;
}

export default function WorkoutExitLink({ href }: WorkoutExitLinkProps): ReactElement {
	const router = useRouter();

	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();

		animateCreateWorkoutExit(() => {
			router.push(href);
		});
	};

	return (
		<Link
			href={href}
			onClick={handleClick}
			aria-label="Back">
			<IconChevronLeft className="size-7" />
		</Link>
	);
}
