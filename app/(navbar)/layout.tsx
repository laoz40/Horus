import NavigationMenuMobile from "@/components/NavigationMenuMobile"
import { ReactNode, type ReactElement } from "react"

export default function NavLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<main className="flex-1 overflow-y-auto no-scrollbar flex flex-col w-full align-center relative">
				{children}
			</main>
			<NavigationMenuMobile />
		</>

	)}
