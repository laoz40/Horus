import ExerciseCollapsibles from "@/components/ExerciseCollapsibles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import NumberInput from "@/components/number-input";
import { History } from "lucide-react";
import Link from "next/link";

export default function CreateWorkoutPage() {
	return (
		<>
			{/* Top Actions */}
			<div className="flex flex-row justify-between p-4 bg-input/50">
				<Button
					variant="secondary"
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
			<div className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b bg-input/50">
				<Input autoFocus placeholder="Workout Name" />
				<div className="flex flex-row justify-between pl-3 pr-3">
					<span className="text-muted-foreground text-sm">14. Nov 2025</span>
					<span className="text-sm">0:42</span>
				</div>
			</div>

			{/* Exercise Form */}
			<div className="flex flex-col grow h-full gap-4 p-4">
				{/* Exercise Name */}
				<div className="flex flex-row gap-2">
					<Input placeholder="Add an exercise" />
					<Button
						variant="secondary"
						size="icon">
						<History></History>
					</Button>
				</div>

				{/* TODO: Make component for number input, also make it only accept numbers and one decimal */}

				{/* Set Rows */}
				<div className="flex flex-col grow gap-3">
					<div className="flex flex-col pl-3 gap-3">
						<div className="grid grid-cols-[min-content_0.3fr_1fr_0.3fr_1fr] place-items-center gap-4">
							<span className="text-muted-foreground text-xs">1</span>
							<Checkbox
								className="h-6 w-6"
								aria-label="Color success" />
							<NumberInput variant="decimal" placeholder="kg" className="text-xl h-12" />
								<span className="text-muted-foreground">×</span>
							<NumberInput variant="integer" placeholder="reps" className="text-xl h-12"/>
						</div>
						<div className="grid grid-cols-[min-content_0.3fr_1fr_0.3fr_1fr] place-items-center gap-4">
							<span className="text-muted-foreground text-xs">2</span>
							<Checkbox
								className="h-6 w-6"
								aria-label="Color success" />
							<NumberInput variant="decimal" placeholder="kg" className="text-xl h-12" />
								<span className="text-muted-foreground">×</span>
							<NumberInput variant="integer" placeholder="reps" className="text-xl h-12"/>
						</div>
						<div className="grid grid-cols-[min-content_0.3fr_1fr_0.3fr_1fr] place-items-center gap-4">
							<span className="text-muted-foreground text-xs">3</span>
							<Checkbox
								className="h-6 w-6"
								aria-label="Color success" />
							<NumberInput variant="decimal" placeholder="kg" className="text-xl h-12" />
								<span className="text-muted-foreground">×</span>
							<NumberInput variant="integer" placeholder="reps" className="text-xl h-12"/>
						</div>
					</div>
					<Button 
						variant="secondary" 
						className="w-full">
						+ Set
					</Button>
				</div>

				{/* Difficulty and Notes */}
				<ExerciseCollapsibles />
			</div>

			{/* Add Exercise */}
			<div className="flex w-full border-t p-4 bg-input/50">
				<Button 
					className="flex-1">
					+ Exercise
				</Button>
			</div>
		</>
	);
}
