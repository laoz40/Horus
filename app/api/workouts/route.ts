import path from "path";
import fs from "fs/promises";
import { NextResponse } from "next/server";

const filePath = path.join(process.cwd(), "data", "workouts.json");

export async function GET() {
	const textData = await fs.readFile(filePath, "utf8");
	const workouts = JSON.parse(textData);

	return NextResponse.json(workouts);
}

export async function POST(request: Request) {
	const newWorkout = await request.json();

	const textData = await fs.readFile(filePath, "utf8");
	const workouts = JSON.parse(textData);

	workouts.push(newWorkout);
	await fs.writeFile(filePath, JSON.stringify(workouts, null, 2));

	return NextResponse.json({ success: true });
}
