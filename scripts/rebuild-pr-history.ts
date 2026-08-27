import { config } from "dotenv";
import { err, ok } from "neverthrow";
import { z } from "zod";
import { tryPromise } from "@/lib/tryPromise";

config({ path: ".env.local" });

const argumentsSchema = z.object({
	userId: z.string().min(1),
});

type CommandArgumentsError = {
	reason: "INVALID_ARGUMENTS";
	cause: z.ZodError;
};

function readArguments(argumentsList: string[]) {
	const userIdIndex = argumentsList.indexOf("--user-id");
	const parsedArguments = argumentsSchema.safeParse({ userId: argumentsList[userIdIndex + 1] });

	if (!parsedArguments.success) {
		return err({ reason: "INVALID_ARGUMENTS" as const, cause: parsedArguments.error });
	}

	return ok(parsedArguments.data);
}

function runCommand(argumentsList: string[]) {
	return readArguments(argumentsList).asyncAndThen(({ userId }) =>
		tryPromise({
			try: () => import("@/server/services/pr-history.service"),
			catch: (cause) => ({ reason: "DATABASE_ERROR" as const, cause }),
		}).andThen(({ rebuildPrHistory }) => rebuildPrHistory(userId)),
	);
}

function reportFailure(
	error:
		| CommandArgumentsError
		| { reason: "USER_NOT_FOUND" }
		| { reason: "DATABASE_ERROR"; cause: unknown },
) {
	console.error("Personal-record history rebuild failed.");

	switch (error.reason) {
		case "INVALID_ARGUMENTS":
			console.error("Usage: pnpm migration:rebuild-pr-history -- --user-id <user-id>");
			console.error(error.cause);
			break;
		case "USER_NOT_FOUND":
			console.error("Target user does not exist in the database selected by DATABASE_URL.");
			break;
		case "DATABASE_ERROR":
			console.error(error.cause);
			break;
		default: {
			const exhaustiveError: never = error;
			return exhaustiveError;
		}
	}
}

async function main(): Promise<void> {
	const result = await runCommand(process.argv.slice(2));

	if (result.isErr()) {
		reportFailure(result.error);
		process.exitCode = 1;
		return;
	}

	console.log("Personal-record history rebuild completed.");
	console.table(result.value);
}

void main();
