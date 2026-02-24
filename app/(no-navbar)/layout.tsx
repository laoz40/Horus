import { ReactNode, type ReactElement } from "react";

export default function NoNavLayout({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	return (
		<>
			<main className="flex-1 overflow-hidden no-scrollbar flex flex-col w-full align-center relative">
				<div className="w-full max-w-5xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col flex-1">
					{children}
				</div>
			</main>
		</>
	);
}
