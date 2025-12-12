import { db } from "@/lib/prisma";
import { WorkoutInput } from "@/lib/types";
import { NextResponse } from "next/server";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const editedWorkout: WorkoutInput = await request.json();

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
