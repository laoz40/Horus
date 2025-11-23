import { Clock, Dumbbell, Weight } from "lucide-react";
import { type ReactElement } from "react";

export default function WorkoutCardStats(): ReactElement {
	return (
<div className="grid grid-cols-3 mt-2 ">
    {/* 1. Number of Exercises: Icon + Value (Horizontal) */}
    <div className="flex items-center justify-center space-x-1.5 py-1">
        <Dumbbell className="size-4 text-primary shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap">
            5 Ex.
        </span>
    </div>

    {/* 2. Total Volume Lifted: Icon + Value (Horizontal) */}
    <div className="flex items-center justify-center space-x-1.5 py-1">
        <Weight className="size-4 text-primary shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap">
            1215 kg
        </span>
    </div>

    {/* 3. Workout Duration: Icon + Value (Horizontal) */}
    <div className="flex items-center justify-center space-x-1.5 py-1">
        <Clock className="size-4 text-primary shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap">
            45 min
        </span>
    </div>

</div>
	);
}
