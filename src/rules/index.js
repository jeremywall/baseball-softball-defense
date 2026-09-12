import * as hr1 from "./hr1.js";
import * as hr2 from "./hr2.js";
import * as hr3 from "./hr3.js";
import * as hr4 from "./hr4.js";
import * as hr5 from "./hr5.js";
import * as hr6 from "./hr6.js";
import * as hr7 from "./hr7.js";
import * as hr8 from "./hr8.js";
import * as hr9 from "./hr9.js";
import * as hr10 from "./hr10.js";
import * as sr1 from "./sr1.js";

// Registered hard rules, in HR-number order. Adding a new hard rule from
// the tracked list in docs/plan.md §6.1 means adding one file like the
// ones above plus one line here.
export const RULES = [hr1, hr2, hr3, hr4, hr5, hr6, hr7, hr8, hr9, hr10];

// Registered soft rules (docs/plan.md §6.2) — preferences that are
// reported as non-blocking notices, never as violations.
export const SOFT_RULES = [sr1];

export function validateAll(game) {
  return RULES.flatMap((rule) => rule.validate(game));
}

export function validateSoft(game) {
  return SOFT_RULES.flatMap((rule) => rule.validate(game));
}
