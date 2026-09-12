import { nameOf } from "../models/game.js";
import { playerRecord } from "../models/stats.js";

// HR-10: Once a player is moved off the pitcher position, they cannot
// pitch again later in the same game — pitching must be one uninterrupted
// stint at pitcher.
export const id = "HR-10";
export const label = "No returning to pitch after being pulled";

export function validate(game) {
  const violations = [];
  for (const pid of game.presentPlayerIds) {
    const record = playerRecord(game, pid).filter((status) => status !== null);
    let pitchedYet = false;
    let leftPitching = false;
    let flagged = false;
    for (const status of record) {
      if (status === "P") {
        if (leftPitching && !flagged) {
          violations.push({
            ruleId: id,
            playerId: pid,
            message: `${nameOf(game, pid)} is scheduled to pitch again after already being moved off pitcher.`,
          });
          flagged = true;
        }
        pitchedYet = true;
      } else if (pitchedYet) {
        leftPitching = true;
      }
    }
  }
  return violations;
}
