import NavigationMenuMobile from "@/components/NavigationMenuMobile";
import type { ReactNode, ReactElement } from "react";

export default function NavLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<div className="flex flex-col md:flex-row flex-1 min-h-0">
			<main className="ios-safe-area-top flex flex-1 flex-col w-full align-center overflow-y-auto no-scrollbar relative">
				<div className="w-full max-w-5xl mx-auto flex flex-col flex-1">{children}</div>
			</main>
			<NavigationMenuMobile />
		</div>
	);
}
