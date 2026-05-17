import { ReactNode, type ReactElement } from "react";

export default function NoNavLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<main className="flex flex-1 min-h-0 w-full flex-col overflow-hidden no-scrollbar relative">
				<div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">{children}</div>
			</main>
		</>
	);
}
