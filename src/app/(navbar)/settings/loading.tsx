export default function SettingsLoading() {
	return (
		<div className="animate-pulse">
			<div className="p-4">
				<div className="h-8 w-28 rounded bg-muted" />
			</div>

			<div className="flex flex-col gap-3">
				<section className="flex flex-col pr-4 pl-4 mb-3">
					<div className="p-2 border rounded-md bg-card">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="size-10 rounded-full bg-muted" />
								<div className="flex flex-col gap-2">
									<div className="h-4 w-28 rounded bg-muted" />
									<div className="h-3 w-40 rounded bg-muted" />
								</div>
							</div>
							<div className="h-5 w-20 rounded bg-muted" />
						</div>
					</div>
				</section>

				<section className="flex flex-col pr-4 pl-4 mb-3">
					<h2 className="text-muted-foreground mb-1 text-sm">Appearance</h2>
					<div className="p-2 border rounded-md bg-card">
						<div className="flex items-center justify-between">
							<div className="h-5 w-16 rounded bg-muted" />
							<div className="h-9 w-20 rounded bg-muted" />
						</div>
					</div>
				</section>

				<section className="flex flex-col pr-4 pl-4 mb-3">
					<h2 className="text-muted-foreground mb-1 text-sm">Data</h2>
					<div className="p-2 border rounded-md bg-card">
						<div className="flex items-center justify-between">
							<div className="h-5 w-16 rounded bg-muted" />
							<div className="h-9 w-36 rounded-md bg-muted" />
						</div>
					</div>
				</section>

				<div className="px-4">
					<div className="h-10 w-full rounded-md bg-muted" />
				</div>
			</div>
		</div>
	);
}
