import { createEnv } from "@t3-oss/env-nextjs";

import { clientEnvironmentSchema, serverEnvironmentFields } from "@/env-schema";

export const env = createEnv({
	server: serverEnvironmentFields,
	client: clientEnvironmentSchema,
	experimental__runtimeEnv: {},
});
