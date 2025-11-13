import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
	return (
		<>
			<div className="flex flex-row justify-between p-4">
				<h1 className="justify-center">Dashboard</h1>
				<ModeToggle></ModeToggle>
			</div>
			<section className="flex flex-col gap-1 pr-4 pl-4">
				<h2 className="text-gray-500">Start</h2>
				<div className="align-center flex w-full flex-row justify-center gap-2">
					<Button
						asChild
						className="w-full flex-1">
						<Link
							href="/workout">
							Create Workout
						</Link>
					</Button>

					<Button
						asChild
						variant="secondary"
						className="w-full flex-1">
						<Link
							href="#preset">
							Create a Preset
						</Link>
					</Button>
				</div>
			</section>
		</>
	);
}
