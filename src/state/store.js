import { ROSTER } from "../data/roster.js";
import { createGame } from "../models/game.js";
import { autoSuggest } from "../suggest/autoSuggest.js";

const listeners = new Set();

function notify() {
  for (const fn of listeners) fn();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const players = ROSTER.map((entry, i) => ({
  id: `p${i}`,
  name: typeof entry === "string" ? entry : entry.name,
}));

export const setup = {
  attendance: new Set(),
  numInnings: 6,
  alignmentMode: 9,
  pitcherLimit: 1,
};

let game = null;

export function toggleAttendance(playerId) {
  if (setup.attendance.has(playerId)) setup.attendance.delete(playerId);
  else setup.attendance.add(playerId);
  autoSelectAlignmentMode();
  notify();
}

// Toggles the whole roster: marks everyone present unless everyone already
// is, in which case it clears attendance back to nobody present.
export function toggleAllAttendance() {
  if (setup.attendance.size === players.length) {
    setup.attendance.clear();
  } else {
    for (const p of players) setup.attendance.add(p.id);
  }
  autoSelectAlignmentMode();
  notify();
}

// Keeps the alignment-mode radio in sync with attendance (docs/plan.md
// §5): 9 or fewer present selects 9-position mode, 10+ selects
// 10-position mode. The radio stays manually clickable in between
// attendance changes — this just sets the default every time attendance
// changes, it doesn't disable the choice.
function autoSelectAlignmentMode() {
  setup.alignmentMode = presentCount() <= 9 ? 9 : 10;
}

export function setNumInnings(n) {
  setup.numInnings = Number(n);
  notify();
}

export function setAlignmentMode(mode) {
  setup.alignmentMode = Number(mode);
  notify();
}

export function setPitcherLimit(limit) {
  setup.pitcherLimit = Number(limit);
  notify();
}

export function presentCount() {
  return setup.attendance.size;
}

export function canAssign() {
  return presentCount() >= 7;
}

export function getGame() {
  return game;
}

// The single primary action (docs/plan.md §5.3): builds a game from the
// current attendance/options and generates a complete alignment for it in
// one shot. There is no manual-assignment step in between.
export function assignPositions() {
  if (!canAssign()) return;
  game = createGame({
    players,
    presentPlayerIds: [...setup.attendance],
    numInnings: setup.numInnings,
    alignmentMode: setup.alignmentMode,
    pitcherLimit: setup.pitcherLimit,
  });
  autoSuggest(game);
  notify();
}

// Re-runs the generator from scratch (same attendance/options) for a new
// randomized alignment (docs/plan.md §6.3) — the coach's way to try again
// without re-entering attendance.
export function regenerate() {
  if (!game) return;
  game = createGame({
    players,
    presentPlayerIds: game.presentPlayerIds,
    numInnings: game.numInnings,
    alignmentMode: game.alignmentMode,
    pitcherLimit: game.pitcherLimit,
  });
  autoSuggest(game);
  notify();
}

export function startOver() {
  game = null;
  notify();
}
