import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { MAX_WORKOUT_NAME_LENGTH } from "@/features/workout-form/lib/validateWorkout";
import { IconSearch } from "@tabler/icons-react";

export default function SearchBar() {
	return (
		<InputGroup className="h-11 border-border/70 bg-card shadow-none transition-colors focus-within:border-primary/60 dark:bg-card">
			<InputGroupInput
				placeholder="Search by workout name"
				maxLength={MAX_WORKOUT_NAME_LENGTH}
				className="text-sm placeholder:text-muted-foreground/80"
			/>
			<InputGroupAddon className="text-muted-foreground/80">
				<IconSearch className="size-4" />
			</InputGroupAddon>
		</InputGroup>
	);
}
