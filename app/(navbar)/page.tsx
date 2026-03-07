import Section from "@/components/Section";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardPage() {
	return (
		<div className="flex flex-col gap-3 pt-2 pb-5">
			<div className="flex flex-row items-start justify-between px-4 pt-2">
				<div className="flex flex-col">
					<h2 className="text-sm font-normal text-muted-foreground">Welcome back,</h2>
					<h1 className="text-2xl leading-tight font-semibold tracking-tight">Leo Zhou</h1>
				</div>
				<UserButton
					userProfileMode="modal"
					appearance={{
						elements: {
							userButtonAvatarBox: "size-10!",
						},
						options: {
							shimmer: false,
						},
					}}
				/>
			</div>

			<Section header="Start">
				<div className="flex flex-row w-full flex-wrap items-center justify-center gap-2">
					<Button
						asChild
						size="lg"
						className="flex-1">
						<Link href="/workouts/new">Create Workout</Link>
					</Button>

					<Button
						asChild
						variant="outline"
						size="lg"
						className="flex-1">
						<Link href="#preset">Create a Preset</Link>
					</Button>
				</div>
			</Section>

			<Section header="Presets">
				<div className="flex flex-col gap-2">
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
