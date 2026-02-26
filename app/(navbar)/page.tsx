import Section from "@/components/Section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
	return (
		<div className="flex flex-col gap-3 pt-2 pb-5">
			<div className="flex flex-row items-start justify-between px-4 pt-2">
				<div className="space-y-0.5">
					<h2 className="text-sm font-normal text-muted-foreground">Welcome back,</h2>
					<h1 className="text-2xl leading-tight font-semibold tracking-tight">Leo Zhou</h1>
				</div>
				<Avatar className="mt-0.5 size-10 shrink-0">
					<AvatarImage src="" />
					<AvatarFallback>LZ</AvatarFallback>
				</Avatar>
			</div>

			<Section header="Start">
				<div className="flex w-full flex-wrap items-center justify-center gap-2">
					<Button
						asChild
						className="min-h-11 min-w-40 flex-1">
						<Link href="/workouts/new">Create Workout</Link>
					</Button>

					<Button
						asChild
						variant="outline"
						className="min-h-11 min-w-40 flex-1">
						<Link href="#preset">Create a Preset</Link>
					</Button>
				</div>
			</Section>

			<Section header="Presets">
				<div className="flex flex-col gap-2.5">
					<Button
						variant="outline"
						size="lg">
						Upper 1
					</Button>
					<Button
						variant="outline"
						size="lg">
						Lower 1
					</Button>
					<Button
						variant="outline"
						size="lg">
						Upper 2
					</Button>
					<Button
						variant="outline"
						size="lg">
						Lower 2
					</Button>
				</div>
			</Section>
		</div>
	);
}
