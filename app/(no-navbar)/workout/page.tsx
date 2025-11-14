import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function CreateWorkoutPage() {
	return (
		<>
			<div className="flex flex-row justify-between p-4">
				<Button
					variant="outline"
					asChild
					size="sm">
					<Link href="/">Back</Link>
				</Button>
				<Button
					//asChild
					size="sm">
					<Link href="/history">Done</Link>
				</Button>
			</div>

			<div className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b">
				<Input></Input>
				<div className="flex flex-row justify-between">
					<span className="text-muted-foreground">14, November 2025</span>
					<span>0:42</span>
				</div>
			</div>

			<div className="flex flex-col gap-1 p-4">
				<Input></Input>
			</div>
		</>
	);
}
