import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";

export default function SearchBar() {
	return (
		<InputGroup className="h-11 border-border/70 bg-background/55 shadow-none transition-colors focus-within:border-primary/60">
			<InputGroupInput
				placeholder="Search by workout name"
				className="text-sm placeholder:text-muted-foreground/80"
			/>
			<InputGroupAddon className="text-muted-foreground/80">
				<SearchIcon className="size-4" />
			</InputGroupAddon>
		</InputGroup>
	);
}
