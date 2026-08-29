"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode, ReactElement } from "react";

import { animateCreateWorkoutExit } from "@/features/workout-form/lib/animateCreateWorkoutExit";

interface WorkoutExitLinkProps {
	children: ReactNode;
	href: string;
}

export default function WorkoutExitLink({ children, href }: WorkoutExitLinkProps): ReactElement {
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
			onClick={handleClick}>
			{children}
		</Link>
	);
}
