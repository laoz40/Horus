import type { ReactNode, ReactElement } from "react";

export default function NoNavLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<main className="no-scrollbar relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
				<div className="create-workout-page page-slide-up mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
					{children}
				</div>
			</main>
		</>
	);
}
