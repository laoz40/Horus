import { ReactNode, ViewTransition, type ReactElement } from "react";

export default function NavTemplate({ children }: { children: ReactNode }): ReactElement {
	return (
		<ViewTransition
			enter={{ "nav-route": "nav-route", default: "none" }}
			exit={{ "nav-route": "nav-route", default: "none" }}
			default="none">
			<div className="w-full max-w-5xl mx-auto flex flex-col flex-1">{children}</div>
		</ViewTransition>
	);
}
