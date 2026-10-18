import { RuleTester } from "oxlint/plugins-dev";

import { preferNamedSqlQueriesRule } from "./prefer-named-sql-queries.ts";

new RuleTester().run("prefer-named-sql-queries", preferNamedSqlQueriesRule, {
	valid: [
		{
			code: `import { SqlSchema } from "effect/sql";\nconst query = SqlSchema.findOne({ Request, Result });\nquery(input);`,
		},
		{
			code: `import * as Schema from "effect/sql/SqlSchema";\nconst query = Schema.findAll({ Request, Result });\nquery(input);`,
		},
		{
			code: `import { findOne } from "effect/sql/SqlSchema";\nconst query = findOne({ Request, Result });\nquery(input);`,
		},
		{
			filename: "test.ts",
			code: `const SqlSchema = { findOne: () => (input: unknown) => input };\nSqlSchema.findOne({})(input);`,
		},
		{
			filename: "test.ts",
			code: `import { SqlSchema } from "effect/sql";\nfunction run(SqlSchema: { findOne: (options: object) => (input: unknown) => unknown }) { SqlSchema.findOne({})(input); }`,
		},
		{
			code: `import { SqlSchema } from "effect/sql";\nconst query = SqlSchema.findOne({});\nEffect.gen(function* () { yield* query(input); });`,
		},
		{
			code: `import { Other } from "unrelated";\nOther.findOne({})(input);`,
		},
	],
	invalid: [
		{
			code: `import { SqlSchema } from "effect/sql";\nSqlSchema.findOne({ Request, Result })(input);`,
			errors: [{ messageId: "nameQuery" }],
		},
		{
			code: `import { SqlSchema as SQL } from "effect/sql";\nSQL.findOneOption({ Request, Result })(input);`,
			errors: [{ messageId: "nameQuery" }],
		},
		{
			code: `import * as Schema from "effect/sql/SqlSchema";\nSchema.findNonEmpty({ Request, Result })(input);`,
			errors: [{ messageId: "nameQuery" }],
		},
		{
			code: `import { findOne as one } from "effect/sql/SqlSchema";\none({ Request, Result })(input);`,
			errors: [{ messageId: "nameQuery" }],
		},
		{
			code: `import { void as makeVoid } from "effect/sql/SqlSchema";\nmakeVoid({ Request, Result })(input);`,
			errors: [{ messageId: "nameQuery" }],
		},
	],
});
