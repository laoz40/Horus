import NavigationMenuMobile from "@/components/NavigationMenuMobile";
import { ReactNode, type ReactElement } from "react";

export default function NavLayout({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	return (
		<div className="flex flex-col md:flex-row flex-1 min-h-0">
			<main className="flex-1 overflow-y-auto no-scrollbar flex flex-col w-full align-center relative">
				{children}
			</main>
			<NavigationMenuMobile />
		</div>
	);
}
