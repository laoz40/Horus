# Effect rules provenance

Source: [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop/tree/c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b/src/effect), commit `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b`.

The Effect plugin entry point, four additional rules, their tests, and the shared tagged-value helpers were copied without changes. The existing `no-service-constructor-imports` rule and tests were preserved; both match this revision. The upstream MIT license is included in `LICENSE`.

All five rules are enabled as errors in `.oxlintrc.json`. Run each `rules/*.test.ts` file with `pnpm exec tsx`, then run `pnpm lint:check` to validate the plugin against this project.
