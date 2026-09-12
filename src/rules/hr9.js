import { nameOf } from "../models/game.js";
import { countCategories } from "../models/stats.js";

// HR-9: A player may pitch at most 1 inning per game if the game's
// "Pitcher inning limit" setting is on, or at most 2 innings if it's off.
// The limit is read from the game itself, not hardcoded.
export const id = "HR-9";
export const label = "Pitcher innings limit";

export function validate(game) {
  const violations = [];
  for (const pid of game.presentPlayerIds) {
    const { pitch } = countCategories(game, pid);
    if (pitch > game.pitcherLimit) {
      violations.push({
        ruleId: id,
        playerId: pid,
        message: `${nameOf(game, pid)} is scheduled to pitch ${pitch} innings, which exceeds the limit of ${game.pitcherLimit}.`,
      });
    }
  }
  return violations;
}
