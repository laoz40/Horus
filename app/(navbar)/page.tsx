import { ModeToggle } from "@/components/mode-toggle";
import Section from "@/components/section";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
	return (
		<>
			<div className="flex flex-row justify-between align-bottom p-4">
				<div>
					<h2 className="justify-center font-light">Welcome back,</h2>
					<h1 className="justify-center font-bold">Leo Zhou</h1>
				</div>
				<ModeToggle></ModeToggle>
			</div>

			<Section header="Start">
				<div className="align-center flex w-full flex-row justify-center gap-2">
					<Button
						asChild
						className="w-full flex-1">
						<Link href="/workout">Create Workout</Link>
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
		</>
	);
}
