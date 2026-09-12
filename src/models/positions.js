// Position definitions, keyed by alignment mode and (for the outfield)
// attendance count. Everything else (rules engine, auto-suggest, result
// views) reads from this one module rather than hardcoding a position
// count or label, so every present-count case (§4/§5) stays consistent
// everywhere.

export const INFIELD_POSITIONS = [
  { id: "P", label: "Pitcher" },
  { id: "C", label: "Catcher" },
  { id: "1B", label: "First Base" },
  { id: "2B", label: "Second Base" },
  { id: "3B", label: "Third Base" },
  { id: "SS", label: "Shortstop" },
];

const LF = { id: "LF", label: "Left Field" };
const CF = { id: "CF", label: "Center Field" };
const RF = { id: "RF", label: "Right Field" };
const LC = { id: "LC", label: "Left-Center Field" };
const RC = { id: "RC", label: "Right-Center Field" };

export const OUTFIELD_POSITIONS_BY_MODE = {
  9: [LF, CF, RF],
  10: [LF, LC, RC, RF],
};

// A 2-outfielder alignment (exactly 7 or 8 present, per HR-7) always
// covers the left-center/right-center gaps rather than reusing the
// 9-position mode's first two slots — LC/RC, never LF/CF.
const TWO_OUTFIELDER_POSITIONS = [LC, RC];

export const BENCH = { id: "BN", label: "Bench" };

export function maxOutfielders(mode) {
  return OUTFIELD_POSITIONS_BY_MODE[mode].length;
}

// The absolute minimum present players needed to play at all (HR-7).
export const MIN_PRESENT_TO_PLAY = 7;

// The infield/battery positions fielded for a given attendance count.
// At exactly the HR-7 minimum (7 present), the catcher is dropped in
// favor of a 2nd outfielder instead (5 infield/battery + 2 outfielders =
// 7) rather than fielding a full catcher/infield complement behind a
// single outfielder.
export function infieldPositionsFor(presentCount) {
  if (presentCount === MIN_PRESENT_TO_PLAY) {
    return INFIELD_POSITIONS.filter((p) => p.id !== "C");
  }
  return INFIELD_POSITIONS;
}

// The set of outfield positions actually used this game, given how many
// outfield slots attendance allows (HR-7: shortfall reduces outfield, not
// infield/battery). A 2-outfielder count always means LC/RC (7- or
// 8-present), regardless of alignment mode.
export function getOutfieldPositions(mode, outfieldCount) {
  if (outfieldCount === 2) return TWO_OUTFIELDER_POSITIONS;
  return OUTFIELD_POSITIONS_BY_MODE[mode].slice(0, outfieldCount);
}

// The full list of fielded positions (infield/battery + however many
// outfield slots apply) for a game.
export function getFieldPositions(mode, presentCount, outfieldCount) {
  return [...infieldPositionsFor(presentCount), ...getOutfieldPositions(mode, outfieldCount)];
}

const INFIELD_IDS = new Set(INFIELD_POSITIONS.map((p) => p.id));

// Category used by the infield/outfield hard rules (HR-2, HR-5, HR-6):
// Pitcher and Catcher count as infield by league convention.
export function categoryOf(positionId) {
  if (positionId === BENCH.id) return "bench";
  if (INFIELD_IDS.has(positionId)) return "infield";
  return "outfield";
}
