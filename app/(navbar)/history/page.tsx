"use client"

import { useEffect, useState } from "react";
import { WorkoutWithRelations } from "@/lib/types";

export default function HistoryPage() {
const [workouts, setWorkouts] = useState<WorkoutWithRelations[]>([]);

	useEffect(() => {
		const fetchWorkouts = async () => {
			const response = await fetch("/api/workouts");
			const result = await response.json();

			if (result.success) {
				console.log("All workouts:", result.getWorkouts);
				setWorkouts(result.getWorkouts as WorkoutWithRelations[])
			}
		};
		fetchWorkouts()
	}, []);

return (
    <div>
      <h1>Workout History</h1>
      {workouts.map((workout) => (
        <div key={workout.id} className="mb-6">
          <h2>{workout.name}</h2>
          {workout.exercises.map((exercise) => (
            <div key={exercise.id} className="ml-4 mb-2">
              <h3>{exercise.name}</h3>
              <ul className="ml-4 list-disc">
                {exercise.sets.map((set) => (
                  <li key={set.id}>
                    {set.weight} kg × {set.reps} reps
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
