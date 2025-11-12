import { Button } from "@/components/ui/button";

export default function DashboardPage() {
	return (
		<>
			<h1 className="justify-center">Dashboard</h1>
			<div className="flex flex-col pl-4 pr-4">
				<h2 className="text-gray-500">Start</h2>
				<div className="flex flex-row justify-center align-center w-full gap-1">
					<Button className="flex-1">Create Workout</Button>
					<Button variant="secondary" className="flex-1">Create a Preset</Button>
				</div>
			</div>
		</>
	);
}
