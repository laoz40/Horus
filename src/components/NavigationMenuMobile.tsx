"use client";

import { IconChartBarPopularFilled } from "@/components/icons/IconChartBarPopularFilled";
import { cn } from "@/lib/utils";
import {
	IconBarbell,
	IconBarbellFilled,
	IconChartBarPopular,
	IconClock,
	IconClockFilled,
	IconSettings,
	IconSettingsFilled,
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
	{ title: "Workout", href: "/", icon: IconBarbell, iconActive: IconBarbellFilled },
	{ title: "History", href: "/workouts", icon: IconClock, iconActive: IconClockFilled },
	{
		title: "Progress",
		href: "/progress",
		icon: IconChartBarPopular,
		iconActive: IconChartBarPopularFilled,
	},
	{ title: "Settings", href: "/settings", icon: IconSettings, iconActive: IconSettingsFilled },
];

function isRouteActive(pathname: string, href: string): boolean {
	if (href === "/") return pathname === "/";

	return pathname.startsWith(href);
}

export default function NavigationMenuMobile() {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Main navigation"
			className={cn(
				"relative flex max-w-max w-full items-center justify-around",
				"w-full max-w-full bg-sidebar dark:bg-sidebar ios-safe-area-bottom",
				// bottom bar
				"border-t order-2",
				// left sidebar
				"md:order-first md:border-t-0 md:border-r md:w-16 md:h-full md:flex-col",
			)}>
			<ul
				className={cn(
					"flex flex-1 list-none items-center justify-around gap-1 w-full",
					// left sidebar
					"md:flex-col md:justify-center md:h-full md:gap-2",
				)}>
				{navigationMenuItems.map((item) => {
					const active = isRouteActive(pathname, item.href);
					const NavIcon = active ? item.iconActive : item.icon;

					return (
						<li
							key={item.title}
							className="relative flex-1 md:flex-initial md:w-full">
							<Link
								href={item.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex flex-col h-auto items-center justify-center w-full rounded-none px-3 py-2.5",
									"bg-transparent! text-muted-foreground text-xs",
									"transition-colors duration-150",
									"hover:bg-transparent hover:text-primary",
									"focus:bg-transparent focus:text-primary",
									"focus-visible:ring-0 focus-visible:outline-none",
									active && "text-primary",
								)}>
								<NavIcon className={cn("mb-1 size-6 text-current")} />
								{item.title}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
