import NavigationMenuMobile from "@/components/NavigationMenuMobile";
import type { ReactNode, ReactElement } from "react";

export default function NavLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<div className="flex min-h-0 w-full flex-1 flex-col md:flex-row">
			<main className="ios-safe-area-top align-center no-scrollbar relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
				<div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-y-auto">
					{children}
				</div>
			</main>
			<NavigationMenuMobile />
		</div>
	);
}
