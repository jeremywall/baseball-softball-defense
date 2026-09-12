import { createGame } from "../src/models/game.js";

export function makeGame({ playerCount = 12, numInnings = 6, alignmentMode = 9, pitcherLimit = 1 } = {}) {
  const players = Array.from({ length: playerCount }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));
  const presentPlayerIds = players.map((p) => p.id);
  return createGame({ players, presentPlayerIds, numInnings, alignmentMode, pitcherLimit });
}

export function setInning(game, inningIndex, assignments) {
  Object.assign(game.innings[inningIndex].assignments, assignments);
}
