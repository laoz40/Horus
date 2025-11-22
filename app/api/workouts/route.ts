import path from "path";
import fs from "fs/promises";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const filePath = path.join(process.cwd(), "data", "workouts.json");
const prisma = new PrismaClient();

export async function GET() {
	const textData = await fs.readFile(filePath, "utf8");
	const workouts = JSON.parse(textData);

	return NextResponse.json(workouts);
}

export async function POST(request: Request) {
	const newWorkout = await request.json();

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
