import DashboardAccountButton from "@/features/auth/components/DashboardAccountButton";

export default function DashboardProfileFallback({ isPending }: { isPending: boolean }) {
	if (isPending) {
		return (
			<>
				<div className="flex flex-col">
					<div className="mb-1 h-4 w-22 animate-pulse rounded-sm bg-muted" />
					<div className="h-8 w-32 animate-pulse rounded-sm bg-muted" />
				</div>
				<div className="size-10 animate-pulse rounded-full bg-muted" />
			</>
		);
	}

	return (
		<>
			<div className="flex flex-col">
				<h2 className="text-sm font-normal text-muted-foreground">Welcome,</h2>
				<h1 className="text-2xl leading-tight font-semibold tracking-tight">Legend</h1>
			</div>
			<DashboardAccountButton initialUser={null} />
		</>
	);
}
