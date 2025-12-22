import { parseWorkout } from "@/lib/parseWorkout";
import { db } from "@/lib/prisma";
import { WorkoutFormData } from "@/lib/types";
import { validateWorkout } from "@/lib/validateWorkout";
import { NextResponse } from "next/server";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const rawWorkout: WorkoutFormData = await request.json();
	const parsedWorkout = parseWorkout(rawWorkout);
	const validationResult = validateWorkout(parsedWorkout);

	if (!validationResult.success) {
		return NextResponse.json({
			success: false,
			errors: validationResult.error,
		});
	}

	const validWorkout = validationResult.data;

	// NOTE: this might be incorrect/inefficient
	await db.workout.update({
		where: { id: id },
		data: {
			name: validWorkout.name,
			exercises: {
				// delete existing exercises
				deleteMany: {},
				// recreate workout with updated exercises
				create: validWorkout.exercises.map((exercise) => ({
					name: exercise.name,
					difficulty: exercise.difficulty ?? null,
					notes: exercise.notes ?? null,
					sets: {
						create: exercise.sets.map((set) => ({
							weight: Number(set.weight),
							reps: Number(set.reps),
						})),
					},
				})),
			},
		},
		include: { exercises: { include: { sets: true } } },
	});

	return NextResponse.json({
		success: true,
		workout: validWorkout,
	});
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	await db.workout.delete({
		where: { id: id },
	});

	return NextResponse.json({ success: true });
}
