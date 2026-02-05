export async function fetchExercisesFromApi(query: string) {
	const apiKey = process.env.EXERCISEDB_API_KEY;

	if (!apiKey) {
		throw new Error("EXERCISEDB_API_KEY is not set");
	}

	try {
		const url = new URL("https://exercisedb-api.vercel.app/api/v1/exercises");

		url.searchParams.set("search", query);
		url.searchParams.set("limit", "10");
		url.searchParams.set("sortBy", "name");

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"x-rapidapi-key": apiKey,
				"x-rapidapi-host": "exercisedb.p.rapidapi.com",
			},
		});
		const result = await response.json();
		const exercisesFromApi = Array.isArray(result.data)
			? result.data.map((exercise: any) => ({
					id: exercise.exerciseId,
					name: exercise.name,
				}))
			: [];
		return exercisesFromApi;
	} catch (error) {
		console.error(error);
	}
}
