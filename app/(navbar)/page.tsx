import Section from "@/components/Section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
	return (
		<>
			<div className="flex flex-row justify-between items-start p-4">
				<div>
					<h2 className="font-light">Welcome back,</h2>
					<h1 className="font-semibold">Leo Zhou</h1>
				</div>
				<Avatar className="mt-0.5">
					<AvatarImage src="" />
					<AvatarFallback>LZ</AvatarFallback>
				</Avatar>
			</div>

			<Section header="Start">
				<div className="align-center flex w-full flex-row justify-center gap-2">
					<Button
						asChild
						className="w-full flex-1">
						<Link href="/workouts/new">Create Workout</Link>
					</Button>

					<Button
						asChild
						variant="secondary"
						className="w-full flex-1">
						<Link href="#preset">Create a Preset</Link>
					</Button>
				</div>
			</Section>

			<Section header="Presets">
				<div className="flex flex-col gap-2">
					<Button
						variant="secondary"
						size="lg">
						Upper 1
					</Button>
					<Button
						variant="secondary"
						size="lg">
						Lower 1
					</Button>
					<Button
						variant="secondary"
						size="lg">
						Upper 2
					</Button>
					<Button
						variant="secondary"
						size="lg">
						Lower 2
					</Button>
				</div>
			</Section>
		</>
	);
}
