import { nameOf, isGameComplete } from "../models/game.js";
import { countCategories } from "../models/stats.js";

// HR-2: Every player must play at least one inning of infield and at
// least one inning of outfield in every game. Only meaningful to check
// once the whole game is filled in, otherwise every player would falsely
// show as violating it before they've had their turn.
export const id = "HR-2";
export const label = "Must play infield and outfield";

export function validate(game) {
  if (!isGameComplete(game)) return [];
  const violations = [];
  for (const pid of game.presentPlayerIds) {
    const { infield, outfield } = countCategories(game, pid);
    if (infield === 0) {
      violations.push({ ruleId: id, playerId: pid, message: `${nameOf(game, pid)} did not play any infield innings.` });
    }
    if (outfield === 0) {
      violations.push({ ruleId: id, playerId: pid, message: `${nameOf(game, pid)} did not play any outfield innings.` });
    }
  }
  return violations;
}
