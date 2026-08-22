/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as dailySetStats from "../dailySetStats.js";
import type * as exercises from "../exercises.js";
import type * as http from "../http.js";
import type * as lib_calculateStatPr from "../lib/calculateStatPr.js";
import type * as lib_dailySetStats from "../lib/dailySetStats.js";
import type * as lib_exercisePrs from "../lib/exercisePrs.js";
import type * as lib_rebuildExercisePrs from "../lib/rebuildExercisePrs.js";
import type * as lib_server from "../lib/server.js";
import type * as lib_workoutActions from "../lib/workoutActions.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  dailySetStats: typeof dailySetStats;
  exercises: typeof exercises;
  http: typeof http;
  "lib/calculateStatPr": typeof lib_calculateStatPr;
  "lib/dailySetStats": typeof lib_dailySetStats;
  "lib/exercisePrs": typeof lib_exercisePrs;
  "lib/rebuildExercisePrs": typeof lib_rebuildExercisePrs;
  "lib/server": typeof lib_server;
  "lib/workoutActions": typeof lib_workoutActions;
  workouts: typeof workouts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
