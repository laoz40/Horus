import { ConvexError } from "convex/values";
import type { WorkoutFormData } from "../../features/workout-form/lib/types";
import { validateWorkout } from "../../features/workout-form/lib/validateWorkout";
import { parseWorkout } from "./parseWorkout";

export function parseAndValidateWorkout(rawWorkout: WorkoutFormData): WorkoutFormData {
	const parsedWorkout = parseWorkout(rawWorkout);
	const validationResult = validateWorkout(parsedWorkout);

	if (!validationResult.success) {
		throw new ConvexError({
			code: "INVALID_WORKOUT_DATA",
			issues: validationResult.error.issues.map((issue) => ({
				message: issue.message,
			})),
		});
	}

	return validationResult.data;
}
