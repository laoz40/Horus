"use client";

import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Dumbbell, Settings, TrendingUp, History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationMenuItems = [
	{ title: "Workout", href: "/", icon: Dumbbell },
	{ title: "History", href: "/workouts", icon: History },
	{ title: "Progress", href: "/progress", icon: TrendingUp },
	{ title: "Settings", href: "/settings", icon: Settings },
];

function isRouteActive(pathname: string, href: string): boolean {
	if (href === "/") return pathname === "/";
	return pathname.startsWith(href);
}

export default function NavigationMenuMobile() {
	const pathname = usePathname();

	return (
		<NavigationMenu
			className={cn(
				"w-full max-w-full bg-sidebar dark:bg-sidebar ios-safe-area-bottom",
				// bottom bar
				"border-t order-2",
				// left sidebar
				"md:order-first md:border-t-0 md:border-r md:w-16 md:h-full md:flex-col",
			)}>
			<NavigationMenuList
				className={cn(
					"w-full",
					// left sidebar
					"md:flex-col md:justify-center md:h-full md:gap-2",
				)}>
				{navigationMenuItems.map((item) => {
					const active = isRouteActive(pathname, item.href);
					return (
						<NavigationMenuItem
							key={item.title}
							className="flex-1 md:flex-initial md:w-full">
							<NavigationMenuLink
								className={cn(
									"flex flex-col h-auto items-center justify-center w-full rounded-none px-3 py-2.5",
									"bg-transparent! text-muted-foreground text-sm",
									"transition-colors duration-150",
									"hover:bg-transparent hover:text-primary",
									"focus:bg-transparent focus:text-primary",
									"focus-visible:ring-0 focus-visible:outline-none",
									active && "text-primary",
								)}
								active={active}
								asChild>
								<Link href={item.href}>
									<item.icon className={cn("mb-1 h-6! w-6! text-current")} />
									{item.title}
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					);
				})}
			</NavigationMenuList>
		</NavigationMenu>
	);
}
