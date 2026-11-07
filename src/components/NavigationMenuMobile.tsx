"use client";

import { IconChartBarPopularFilled } from "@/components/icons/IconChartBarPopularFilled";
import { cn } from "@/lib/utils";
import {
	IconBarbell,
	IconBarbellFilled,
	IconPlayerPlayFilled,
	IconChartBarPopular,
	type Icon,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationMenuItems: {
	title: string;
	href: string;
	icon: Icon;
	iconActive: Icon;
}[] = [
	{ title: "Workouts", href: "/", icon: IconBarbell, iconActive: IconBarbellFilled },
	{
		title: "Progress",
		href: "/progress",
		icon: IconChartBarPopular,
		iconActive: IconChartBarPopularFilled,
	},
];

export default function NavigationMenuMobile() {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Main navigation"
			className="ios-safe-area-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40">
			<div className="mx-auto mb-4 flex w-full max-w-5xl items-center justify-between gap-4 px-4">
				<ul className="pointer-events-auto flex h-14 max-w-44 flex-1 list-none items-stretch rounded-full border bg-sidebar/95 p-1.5 shadow-lg backdrop-blur-xl md:h-18 md:max-w-64">
					{navigationMenuItems.map((item) => {
						const active =
							pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

						const NavIcon = active ? item.iconActive : item.icon;

						return (
							<li
								key={item.title}
								className="flex flex-1">
								<Link
									href={item.href}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex w-full flex-col items-center justify-center gap-1 rounded-full px-2 text-xs font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:px-4",
										active ? "bg-background text-primary shadow-sm" : "text-sidebar-foreground",
									)}>
									<NavIcon
										className="size-5 md:size-6"
										aria-hidden="true"
									/>
									{item.title}
								</Link>
							</li>
						);
					})}
				</ul>
				<Link
					href="/workouts/new"
					aria-label="Start Workout"
					className="pointer-events-auto flex size-14 shrink-0 items-center justify-center rounded-full border bg-sidebar/95 text-sidebar-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:size-18">
					<IconPlayerPlayFilled
						className="size-6 md:size-8"
						aria-hidden="true"
					/>
				</Link>
			</div>
		</nav>
	);
}
