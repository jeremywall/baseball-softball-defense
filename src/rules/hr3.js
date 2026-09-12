import { nameOf } from "../models/game.js";
import { playerRecord } from "../models/stats.js";
import { categoryOf } from "../models/positions.js";

// HR-3: No player may play outfield for 3 consecutive innings. Innings
// spent on the bench are excluded when determining "consecutive" — they
// don't break an outfield streak, but they also don't add to it.
export const id = "HR-3";
export const label = "No 3 consecutive outfield innings";

export function validate(game) {
  const violations = [];
  for (const pid of game.presentPlayerIds) {
    const record = playerRecord(game, pid).filter((status) => status !== null && status !== "BN");
    let streak = 0;
    let flagged = false;
    for (const status of record) {
      if (categoryOf(status) === "outfield") {
        streak++;
        if (streak >= 3 && !flagged) {
          violations.push({
            ruleId: id,
            playerId: pid,
            message: `${nameOf(game, pid)} is scheduled for 3 or more consecutive outfield innings.`,
          });
          flagged = true;
        }
      } else {
        streak = 0;
      }
    }
  }
  return violations;
}
