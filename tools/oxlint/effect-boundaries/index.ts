import { eslintCompatPlugin } from "@oxlint/plugins";

import { noInternalRunnersRule } from "./no-internal-runners.ts";
import { noNativeTryRule } from "./no-native-try.ts";
import { noServiceProvisionRule } from "./no-service-provision.ts";

export default eslintCompatPlugin({
	meta: { name: "effect-boundaries" },
	rules: {
		"no-internal-runners": noInternalRunnersRule,
		"no-native-try": noNativeTryRule,
		"no-service-provision": noServiceProvisionRule,
	},
});
