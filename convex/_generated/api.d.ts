/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminCurriculum from "../adminCurriculum.js";
import type * as adminHistory from "../adminHistory.js";
import type * as adminNav from "../adminNav.js";
import type * as adminSettings from "../adminSettings.js";
import type * as adminStudents from "../adminStudents.js";
import type * as admins from "../admins.js";
import type * as auth from "../auth.js";
import type * as checks from "../checks.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_changes from "../lib/changes.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_evaluation from "../lib/evaluation.js";
import type * as lib_loginCodes from "../lib/loginCodes.js";
import type * as lib_packages from "../lib/packages.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_workFiles from "../lib/workFiles.js";
import type * as seed from "../seed.js";
import type * as student from "../student.js";
import type * as students from "../students.js";
import type * as viewer from "../viewer.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminCurriculum: typeof adminCurriculum;
  adminHistory: typeof adminHistory;
  adminNav: typeof adminNav;
  adminSettings: typeof adminSettings;
  adminStudents: typeof adminStudents;
  admins: typeof admins;
  auth: typeof auth;
  checks: typeof checks;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/changes": typeof lib_changes;
  "lib/errors": typeof lib_errors;
  "lib/evaluation": typeof lib_evaluation;
  "lib/loginCodes": typeof lib_loginCodes;
  "lib/packages": typeof lib_packages;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/time": typeof lib_time;
  "lib/workFiles": typeof lib_workFiles;
  seed: typeof seed;
  student: typeof student;
  students: typeof students;
  viewer: typeof viewer;
  workspaces: typeof workspaces;
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
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
