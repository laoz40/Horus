import { ReactNode, type ReactElement } from "react";

export default function NoNavLayout({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	return (
		<>
			<main className="flex-1 overflow-hidden no-scrollbar flex flex-col w-full align-center relative">
				{children}
			</main>
		</>
	);
}
