import { ResultAsync } from "neverthrow";

type TryPromiseOptions<T, E> = {
	try: () => Promise<T>;
	catch: (cause: unknown) => E;
};

export function tryPromise<T, E>(options: TryPromiseOptions<T, E>): ResultAsync<T, E> {
	return ResultAsync.fromPromise(Promise.resolve().then(options.try), options.catch);
}

export function tryCatch<T>(operation: () => Promise<T>): ResultAsync<T, unknown> {
	return tryPromise({
		try: operation,
		catch: (cause) => cause,
	});
}
