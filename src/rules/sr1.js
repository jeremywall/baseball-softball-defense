import { nameOf } from "../models/game.js";
import { playerRecord } from "../models/stats.js";

// SR-1 (soft preference, not a hard rule): a player should not be
// assigned to the same specific position twice in a game unless it's
// unavoidable. This is informational only — it never blocks anything —
// and auto-suggest (see src/suggest/autoSuggest.js) actively tries to
// avoid it before falling back to a repeat.
export const id = "SR-1";
export const label = "Avoid repeating the same position";

export function validate(game) {
  const notices = [];
  for (const pid of game.presentPlayerIds) {
    const record = playerRecord(game, pid).filter((status) => status !== null && status !== "BN");
    const counts = {};
    for (const status of record) counts[status] = (counts[status] ?? 0) + 1;
    for (const [positionId, count] of Object.entries(counts)) {
      if (count > 1) {
        notices.push({
          ruleId: id,
          playerId: pid,
          message: `${nameOf(game, pid)} is scheduled to play ${positionId} ${count} times this game.`,
        });
      }
    }
  }
  return notices;
}
