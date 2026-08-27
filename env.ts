import { createEnv } from "@t3-oss/env-nextjs";

import { clientEnvironmentSchema, serverEnvironmentSchema } from "@/env-schema";

export const env = createEnv({
	server: serverEnvironmentSchema.shape,
	client: clientEnvironmentSchema,
	experimental__runtimeEnv: {},
});
