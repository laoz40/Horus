import { eslintCompatPlugin } from "@oxlint/plugins";

import { noEffectOperationTernaryRule } from "./no-effect-operation-ternary.ts";
import { noMapUpdateTernaryRule } from "./no-map-update-ternary.ts";
import { preferJsxAndRule } from "./prefer-jsx-and.ts";
import { preferSimpleTernaryRule } from "./prefer-simple-ternary.ts";

export default eslintCompatPlugin({
	meta: { name: "conditionals" },
	rules: {
		"no-effect-operation-ternary": noEffectOperationTernaryRule,
		"no-map-update-ternary": noMapUpdateTernaryRule,
		"prefer-jsx-and": preferJsxAndRule,
		"prefer-simple-ternary": preferSimpleTernaryRule,
	},
});
