import { nameOf, isGameComplete } from "../models/game.js";
import { countCategories } from "../models/stats.js";

// HR-8: Every present player must play a defensive position (any
// position, not bench) for at least 2 full innings in the game.
export const id = "HR-8";
export const label = "Minimum 2 defensive innings";

export function validate(game) {
  if (!isGameComplete(game)) return [];
  const violations = [];
  for (const pid of game.presentPlayerIds) {
    const { infield, outfield } = countCategories(game, pid);
    const defense = infield + outfield;
    if (defense < 2) {
      violations.push({
        ruleId: id,
        playerId: pid,
        message: `${nameOf(game, pid)} played only ${defense} defensive inning(s); minimum is 2.`,
      });
    }
  }
  return violations;
}
