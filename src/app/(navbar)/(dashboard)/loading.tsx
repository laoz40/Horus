export default function DashboardLoading() {
	return (
		<div className="flex animate-pulse flex-col gap-3 pt-2 pb-5">
			<div className="flex flex-row items-start justify-between px-4 pt-2">
				<div className="flex flex-col gap-2">
					<div className="h-4 w-24 rounded-sm bg-muted" />
					<div className="h-8 w-40 rounded-sm bg-muted" />
				</div>
				<div className="size-10 rounded-full bg-muted" />
			</div>

			<section className="mb-3 flex flex-col pr-4 pl-4">
				<h2 className="mb-1 text-sm text-muted-foreground">Start</h2>
				<div className="flex w-full flex-row flex-wrap items-center justify-center gap-2">
					<div className="h-11 flex-1 rounded-md bg-muted" />
					<div className="h-11 flex-1 rounded-md bg-muted" />
				</div>
			</section>

			<section className="mb-3 flex flex-col pr-4 pl-4">
				<h2 className="mb-1 text-sm text-muted-foreground">Presets</h2>
				<div className="h-11 w-full rounded-md bg-muted" />
			</section>
		</div>
	);
}
