import { getFieldPositions, maxOutfielders, REQUIRED_INFIELD_COUNT } from "./positions.js";

// HR-7: shortfall in attendance is absorbed by fielding fewer outfielders
// (down to a minimum of 1), never by leaving an infield/battery slot empty.
export function computeOutfieldCount(alignmentMode, presentCount) {
  const maxOF = maxOutfielders(alignmentMode);
  const available = presentCount - REQUIRED_INFIELD_COUNT;
  return Math.max(0, Math.min(maxOF, available));
}

// 10-position mode only makes sense with at least 10 present (6
// infield/battery + 4 outfielders) — with 9 or fewer present, there's no
// 4th outfielder to field anyway, so fall back to the 9-position mode's
// labeling (LF/CF/RF) rather than a 10-position mode reduced down to 3
// outfielders (which would otherwise show as LF/LC/RC).
export function effectiveAlignmentMode(alignmentMode, presentCount) {
  return presentCount <= 9 ? 9 : alignmentMode;
}

export function createGame({ players, presentPlayerIds, numInnings, alignmentMode, pitcherLimit }) {
  const mode = effectiveAlignmentMode(alignmentMode, presentPlayerIds.length);
  const outfieldCount = computeOutfieldCount(mode, presentPlayerIds.length);
  const positions = getFieldPositions(mode, outfieldCount);
  const innings = Array.from({ length: numInnings }, (_, i) => ({
    number: i + 1,
    assignments: Object.fromEntries(positions.map((p) => [p.id, null])),
  }));
  return {
    players: Object.fromEntries(players.map((p) => [p.id, p.name])),
    presentPlayerIds: [...presentPlayerIds],
    numInnings,
    alignmentMode: mode,
    pitcherLimit,
    outfieldCount,
    positions,
    innings,
  };
}

export function nameOf(game, playerId) {
  return game.players[playerId] ?? playerId;
}

export function isInningComplete(inning) {
  return Object.values(inning.assignments).every((v) => v !== null);
}

export function isGameComplete(game) {
  return game.innings.every(isInningComplete);
}

export function firstNInningsComplete(game, n) {
  return game.innings.slice(0, n).every(isInningComplete);
}

// Status of a player in one inning: the position id they're assigned to,
// "BN" if the inning is fully assigned and they're not in it (i.e. they are
// definitely benched), or null if it's not yet determined (inning still has
// open slots and the player hasn't been placed in one of them).
export function inningStatusForPlayer(inning, playerId) {
  const entry = Object.entries(inning.assignments).find(([, pid]) => pid === playerId);
  if (entry) return entry[0];
  return isInningComplete(inning) ? "BN" : null;
}

export function benchForInning(game, inning) {
  if (!isInningComplete(inning)) return null;
  const assigned = new Set(Object.values(inning.assignments));
  return game.presentPlayerIds.filter((pid) => !assigned.has(pid));
}
