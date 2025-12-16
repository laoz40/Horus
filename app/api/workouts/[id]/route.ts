import { db } from "@/lib/prisma";
import { WorkoutFormData } from "@/lib/types";
import { NextResponse } from "next/server";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const editedWorkout: WorkoutFormData = await request.json();

	const updatedWorkout = await db.workout.update({
		where: { id: id },
		data: {
			name: editedWorkout.name,
			exercises: {
				// delete existing exercises
				deleteMany: {},
				// recreate workout with updated exercises
				create: editedWorkout.exercises.map((exercise) => ({
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

	return NextResponse.json({ success: true, workout: updatedWorkout });
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
