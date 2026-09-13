import { fromThrowable, type Result } from "neverthrow";

type TrySyncOptions<T, E> = {
	try: () => T;
	catch: (cause: unknown) => E;
};

export function trySync<T, E>(options: TrySyncOptions<T, E>): Result<T, E> {
	return fromThrowable(options.try, options.catch)();
}
