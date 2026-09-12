import { nameOf } from "../models/game.js";
import { countCategories } from "../models/stats.js";

// HR-1: A player who plays catcher for more than 3 innings in a game
// cannot also pitch in that same game.
export const id = "HR-1";
export const label = "Catcher >3 innings can't also pitch";

export function validate(game) {
  const violations = [];
  for (const pid of game.presentPlayerIds) {
    const { catcher, pitch } = countCategories(game, pid);
    if (catcher > 3 && pitch > 0) {
      violations.push({
        ruleId: id,
        playerId: pid,
        message: `${nameOf(game, pid)} caught ${catcher} innings (more than 3) and also pitched — not allowed.`,
      });
    }
  }
  return violations;
}
