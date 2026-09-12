import { categoryOf } from "./positions.js";
import { inningStatusForPlayer } from "./game.js";

// Per-inning status sequence for a player: one entry per inning, each a
// position id, "BN", or null (not yet determined).
export function playerRecord(game, playerId) {
  return game.innings.map((inning) => inningStatusForPlayer(inning, playerId));
}

// Aggregate counts for a player over whatever innings are currently
// determined. Innings that are still undecided (null) are not counted.
export function countCategories(game, playerId) {
  const record = playerRecord(game, playerId);
  let infield = 0;
  let outfield = 0;
  let bench = 0;
  let pitch = 0;
  let catcher = 0;
  for (const status of record) {
    if (status === null) continue;
    const cat = categoryOf(status);
    if (cat === "infield") infield++;
    if (cat === "outfield") outfield++;
    if (cat === "bench") bench++;
    if (status === "P") pitch++;
    if (status === "C") catcher++;
  }
  return { infield, outfield, bench, pitch, catcher, record };
}
