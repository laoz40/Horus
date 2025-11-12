import BackButton from "@/components/backbutton";
import Link from "next/link";

export default function CreateWorkoutPage() {
	return (
		<>
			<Link href="/">
				<BackButton />
			</Link>
			<h1>Workout</h1>
		</>
	);
}
