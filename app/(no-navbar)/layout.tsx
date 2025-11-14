import { ReactNode, type ReactElement } from "react"

export default function NoNavLayout({ children }: { children: ReactNode }): ReactElement {
	return <>
			{children}
	</>
}
