import { nameOf, firstNInningsComplete } from "../models/game.js";
import { playerRecord } from "../models/stats.js";
import { categoryOf } from "../models/positions.js";

// HR-5: Every player must play at least one inning of infield within the
// first 3 innings of the game. Checked once those first 3 innings are
// fully assigned.
export const id = "HR-5";
export const label = "Infield within first 3 innings";

export function validate(game) {
  if (!firstNInningsComplete(game, 3)) return [];
  const violations = [];
  for (const pid of game.presentPlayerIds) {
    const first3 = playerRecord(game, pid).slice(0, 3);
    const playedInfield = first3.some((status) => status !== null && categoryOf(status) === "infield");
    if (!playedInfield) {
      violations.push({
        ruleId: id,
        playerId: pid,
        message: `${nameOf(game, pid)} has not played infield in the first 3 innings.`,
      });
    }
  }
  return violations;
}
