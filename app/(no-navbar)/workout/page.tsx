import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { History } from "lucide-react";
import Link from "next/link";

export default function CreateWorkoutPage() {
	return (
		<>
			{/* Top Actions */}
			<div className="flex flex-row justify-between p-4">
				<Button
					variant="outline"
					asChild
					size="sm">
					<Link href="/">Back</Link>
				</Button>
				<Button
					asChild
					size="sm">
					<Link href="/history">Done</Link>
				</Button>
			</div>

			{/* Workout Name */}
			<div className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b">
				<Input></Input>
				<div className="flex flex-row justify-between">
					<span className="text-muted-foreground">14, November 2025</span>
					<span>0:42</span>
				</div>
			</div>

			{/* Top Actions */}
			<div className="flex flex-col gap-4 p-4">
				<div className="flex flex-row gap-2">
					<Input></Input>
					<Button
						variant="secondary"
						size="icon">
						<History></History>
					</Button>
				</div>

				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-[min-content_0.5fr_1fr_0.5fr_1fr] place-items-center gap-4">
						<span>1</span>
						<Checkbox
							className="focus-visible:ring-green-600/20 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 dark:text-white dark:focus-visible:ring-green-400/40 dark:data-[state=checked]:border-green-400 dark:data-[state=checked]:bg-green-400"
							aria-label="Color success"
						/>
					<Input></Input>
						<span>*</span>
					<Input></Input>
					</div>
				</div>
			</div>
		</>
	);
}
