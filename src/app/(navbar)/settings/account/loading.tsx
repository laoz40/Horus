export default function AccountLoading() {
	return (
		<div className="flex animate-pulse justify-center px-4 py-12">
			<div className="flex w-full max-w-xl flex-col gap-4">
				<div className="h-4 w-12 rounded bg-muted" />
				<div className="h-48 w-full rounded-lg border bg-card" />
				<div className="h-4 w-16 rounded bg-muted" />
				<div className="h-56 w-full rounded-lg border bg-card" />
				<div className="h-36 w-full rounded-lg border bg-card" />
				<div className="h-36 w-full rounded-lg border bg-card" />
			</div>
		</div>
	);
}
