import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { WorkoutInput } from "@/lib/types";

export const prisma = new PrismaClient();

export async function GET() {
	try {
		const getWorkouts = await prisma.workout.findMany({
			include: {
				exercises: {
					include: {
						sets: true,
					},
				},
			},
		});

		return NextResponse.json({ success: true, getWorkouts });
	} catch (err) {
		return NextResponse.json({ success: false, error: (err as Error).message });
	}
}

export async function POST(request: Request) {
	const newWorkout: WorkoutInput = await request.json();

	const postWorkout = await prisma.workout.create({
		data: {
			name: newWorkout.name,
			exercises: {
				create: newWorkout.exercises.map((exercise) => ({
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
		include: {
			exercises: {
				include: { sets: true },
			},
		},
	});

	return NextResponse.json({ success: true, workout: postWorkout });
}
