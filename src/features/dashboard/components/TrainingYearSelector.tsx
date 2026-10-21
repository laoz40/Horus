import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface TrainingYearSelectorProps {
	yearOptions: number[];
	selectedYear: number;
	yearSelectable: boolean;
	onYearChange: (year: number) => void;
}

export default function TrainingYearSelector({
	yearOptions,
	selectedYear,
	yearSelectable,
	onYearChange,
}: TrainingYearSelectorProps) {
	if (!yearSelectable) {
		return <span className="text-sm text-muted-foreground">{selectedYear}</span>;
	}

	return (
		<Select
			value={String(selectedYear)}
			onValueChange={(value) => onYearChange(Number(value))}>
			<SelectTrigger
				size="sm"
				className="h-auto border-0 bg-transparent px-0 text-muted-foreground shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
				aria-label="Training year">
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="end">
				{yearOptions.map((optionYear) => (
					<SelectItem
						key={optionYear}
						value={String(optionYear)}>
						{optionYear}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
