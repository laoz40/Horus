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
			className="ios-safe-area-bottom relative order-2 flex w-full max-w-full items-center justify-around border-t bg-sidebar md:order-first md:h-full md:w-16 md:flex-col md:border-t-0 md:border-r dark:bg-sidebar">
			<ul className="flex w-full flex-1 list-none items-center justify-around gap-1 md:h-full md:flex-col md:justify-center md:gap-2">
				{navigationMenuItems.map((item) => {
					const active = isRouteActive(pathname, item.href);
					const NavIcon = active ? item.iconActive : item.icon;

					return (
						<li
							key={item.title}
							className="relative flex-1 md:w-full md:flex-initial">
							<Link
								href={item.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex h-auto w-full flex-col items-center justify-center rounded-none bg-transparent! px-3 py-2.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary focus-visible:ring-0 focus-visible:outline-none",
									active && "text-primary",
								)}>
								<NavIcon className="mb-1 size-6 text-current" />
								{item.title}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
