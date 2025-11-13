"use client";

import NavigationMenuMobile from "@/components/navbar";
import { usePathname } from "next/navigation";

export default function NavBarWrapper() {
	const pathname = usePathname();

	const noNavBarRoutes = ["/workout"];
	const showNavBar = !noNavBarRoutes.includes(pathname);

	return showNavBar ? <NavigationMenuMobile /> : null;
}
