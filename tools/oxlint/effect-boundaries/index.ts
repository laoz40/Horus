import { eslintCompatPlugin } from "@oxlint/plugins";

import { noInternalRunnersRule } from "./no-internal-runners.ts";
import { noServiceProvisionRule } from "./no-service-provision.ts";

export default eslintCompatPlugin({
	meta: { name: "effect-boundaries" },
	rules: {
		"no-internal-runners": noInternalRunnersRule,
		"no-service-provision": noServiceProvisionRule,
	},
});
