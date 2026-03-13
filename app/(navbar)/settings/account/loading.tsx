export default function AccountLoading() {
	return (
		<div className="flex justify-center py-12 px-4 animate-pulse">
			<div className="flex flex-col gap-4 w-full max-w-xl">
				<div className="h-4 w-12 rounded bg-muted" />
				<div className="h-48 w-full rounded-md border bg-card" />
				<div className="h-4 w-16 rounded bg-muted" />
				<div className="h-56 w-full rounded-md border bg-card" />
				<div className="h-36 w-full rounded-md border bg-card" />
				<div className="h-36 w-full rounded-md border bg-card" />
			</div>
		</div>
	);
}
