/// <reference types="react/canary" />

import { ViewTransition, type ReactNode, type ReactElement } from "react";

export default function NoNavLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<ViewTransition
			default="none"
			enter="workout-enter"
			exit="workout-exit">
			<main className="no-scrollbar relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background">
				<div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">{children}</div>
			</main>
		</ViewTransition>
	);
}
