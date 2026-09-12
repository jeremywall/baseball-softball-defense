import { nameOf, isGameComplete } from "../models/game.js";
import { countCategories } from "../models/stats.js";

// HR-6: Every player must play a minimum of 2 innings in the infield in a
// game. Checked once the whole game is filled in.
export const id = "HR-6";
export const label = "Minimum 2 infield innings";

export function validate(game) {
  if (!isGameComplete(game)) return [];
  const violations = [];
  for (const pid of game.presentPlayerIds) {
    const { infield } = countCategories(game, pid);
    if (infield < 2) {
      violations.push({
        ruleId: id,
        playerId: pid,
        message: `${nameOf(game, pid)} played only ${infield} infield inning(s); minimum is 2.`,
      });
    }
  }
  return violations;
}
