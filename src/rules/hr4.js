import { nameOf, isInningComplete, benchForInning } from "../models/game.js";

// HR-4: No player may be benched for a second inning until every present
// player has been benched at least once in that game. Only innings that
// are fully assigned have a determined bench, so this walks innings in
// order and stops at the first inning that isn't decided yet.
export const id = "HR-4";
export const label = "Bench must round-robin before repeating";

export function validate(game) {
  const violations = [];
  const benchedOnce = new Set();
  const totalPresent = game.presentPlayerIds.length;

  for (const inning of game.innings) {
    if (!isInningComplete(inning)) break;
    const bench = benchForInning(game, inning);
    for (const pid of bench) {
      if (benchedOnce.has(pid) && benchedOnce.size < totalPresent) {
        violations.push({
          ruleId: id,
          playerId: pid,
          message: `${nameOf(game, pid)} is benched again in inning ${inning.number} before every player has had one bench turn.`,
        });
      }
      benchedOnce.add(pid);
    }
  }
  return violations;
}
