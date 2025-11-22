import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Dumbbell, Settings, TrendingUp, History } from "lucide-react";
import Link from "next/link";

const navigationMenuItems = [
	{ title: "Workout", href: "/", icon: Dumbbell, isActive: true },
	{ title: "History", href: "/history", icon: History },
	{ title: "Progress", href: "/progress", icon: TrendingUp },
	{ title: "Settings", href: "/settings", icon: Settings },
];

export default function NavigationMenuMobile() {
	return (
		<NavigationMenu className={cn("w-full max-w-full border-t bg-input/30")}>
			<NavigationMenuList>
				{navigationMenuItems.map((item) => (
					<NavigationMenuItem key={item.title}>
						<NavigationMenuLink
							className={cn(
								navigationMenuTriggerStyle(),
								"flex flex-col h-auto items-center px-3 py-2.5 bg-transparent",
							)}
							active={item.isActive}
							asChild>
							<Link href={item.href}>
								<item.icon className="mb-1.5 h-6! w-6!" />
								{item.title}
							</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
				))}
			</NavigationMenuList>
		</NavigationMenu>
	);
}
