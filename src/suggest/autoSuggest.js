import { INFIELD_POSITIONS, categoryOf } from "../models/positions.js";

const FIELD_INFIELD_IDS = INFIELD_POSITIONS.map((p) => p.id).filter((id) => id !== "P" && id !== "C");

// Fills every slot in every inning of `game` (always starts fully empty —
// there's no manual-assignment path, so a game is generated in one shot
// via docs/plan.md §5.3/§6.3) with a heuristic assignment that tries to
// satisfy the hard rules in §6.1. It's a greedy rotation, not a solver —
// for unusual roster sizes it may not find a perfect answer, in which
// case the rule-check panel reports whatever still doesn't hold and the
// coach's recourse is to tap Regenerate for a different attempt, since
// there's no manual-assignment fallback.
//
// The rotation order is shuffled fresh on every call (§6.3) so "Assign
// Positions" and every later "Regenerate" tend to produce a different
// valid alignment from the same attendance/options, rather than the same
// one every time.
export function autoSuggest(game) {
  const order = shuffle([...game.presentPlayerIds]);
  const n = order.length;
  const positionIds = game.positions.map((p) => p.id);
  const benchCount = Math.max(0, n - positionIds.length);
  const outfieldIds = positionIds.filter((id) => categoryOf(id) === "outfield");
  const infieldFieldIds = positionIds.filter((id) => FIELD_INFIELD_IDS.includes(id));

  const stats = new Map(
    order.map((pid) => [pid, { infield: 0, outfield: 0, bench: 0, pitch: 0, catcher: 0, ofStreak: 0, playedPositions: new Set() }]),
  );

  let benchPtr = 0;
  let pitcherQueuePtr = 0;
  const usedAsPitcher = new Set();
  let activePitcher = null;
  let pitcherInningsLeft = 0;

  for (const inning of game.innings) {
    // Bench: round-robin through everyone, in shuffled order.
    const bench = [];
    while (bench.length < benchCount) {
      bench.push(order[benchPtr % n]);
      benchPtr++;
    }
    const fielders = order.filter((pid) => !bench.includes(pid));
    for (const pid of bench) applyStatus(stats.get(pid), "BN");

    // Pitcher: keep the current one going up to the game's inning limit,
    // unless the bench rotation happens to sit them this inning, in which
    // case a fresh (never-yet-used) pitcher takes over — and the old one
    // can never return to pitch (HR-10).
    if (!(activePitcher && pitcherInningsLeft > 0 && fielders.includes(activePitcher))) {
      activePitcher = null;
      for (let tries = 0; tries < n && !activePitcher; tries++) {
        const cand = order[pitcherQueuePtr % n];
        pitcherQueuePtr++;
        if (!usedAsPitcher.has(cand) && fielders.includes(cand)) {
          activePitcher = cand;
          pitcherInningsLeft = game.pitcherLimit;
          usedAsPitcher.add(cand);
        }
      }
    }
    if (activePitcher) {
      inning.assignments.P = activePitcher;
      applyStatus(stats.get(activePitcher), "P");
      pitcherInningsLeft--;
      fielders.splice(fielders.indexOf(activePitcher), 1);
    }

    // Catcher: prefer someone who won't pitch this game, or who hasn't
    // caught 3 innings yet (HR-1). Skipped entirely at 7 present, where
    // the position set has no catcher (a 2nd outfielder instead — see
    // infieldPositionsFor in models/positions.js).
    if (positionIds.includes("C")) {
      const catcherCandidates = [...fielders].sort((a, b) => {
        const sa = stats.get(a);
        const sb = stats.get(b);
        const aRisky = usedAsPitcher.has(a) && sa.catcher >= 3 ? 1 : 0;
        const bRisky = usedAsPitcher.has(b) && sb.catcher >= 3 ? 1 : 0;
        if (aRisky !== bRisky) return aRisky - bRisky;
        return sa.catcher - sb.catcher;
      });
      const catcher = catcherCandidates[0];
      if (catcher) {
        inning.assignments.C = catcher;
        applyStatus(stats.get(catcher), "C");
        fielders.splice(fielders.indexOf(catcher), 1);
      }
    }

    // Remaining infield slots and outfield slots: balance each player's own
    // infield vs. outfield time (SR-2), prioritize whoever still needs
    // infield within the first 3 innings (HR-5), and never hand outfield to
    // someone already on a 2-inning outfield streak (HR-3).
    const inningIndex = inning.number - 1;
    const pool = [...fielders];
    const infieldPicks = pickForCategory(pool, stats, infieldFieldIds.length, "infield", inningIndex);
    for (const pid of infieldPicks) pool.splice(pool.indexOf(pid), 1);
    const outfieldPicks = pickForCategory(pool, stats, outfieldIds.length, "outfield", inningIndex);

    // Within each category, match players to the specific slot ids (1B vs.
    // 2B vs. SS, etc.) preferring a position they haven't already played
    // this game (SR-1) — falling back to a repeat only when unavoidable.
    assignSlotsAvoidingRepeats(inning, infieldFieldIds, infieldPicks, stats);
    assignSlotsAvoidingRepeats(inning, outfieldIds, outfieldPicks, stats);
  }

  return game;
}

function applyStatus(stat, status) {
  const cat = categoryOf(status);
  if (cat === "infield") {
    stat.infield++;
    stat.ofStreak = 0;
  } else if (cat === "outfield") {
    stat.outfield++;
    stat.ofStreak++;
  } else {
    stat.bench++;
    stat.ofStreak = 0;
  }
  if (status === "P") stat.pitch++;
  if (status === "C") stat.catcher++;
  if (status !== "BN") stat.playedPositions.add(status);
}

// Matches `playerIds` to `slotIds` (same length) preferring, for each
// player, a specific position they haven't played yet this game (SR-1);
// falls back to a repeat only when every remaining slot is already one of
// their played positions. Uses a most-constrained-first greedy match:
// whoever has the fewest not-yet-played options among the remaining slots
// goes first, so scarce "fresh" slots aren't claimed by someone who had
// other options.
function assignSlotsAvoidingRepeats(inning, slotIds, playerIds, stats) {
  const slots = [...slotIds];
  const players = [...playerIds];
  while (players.length && slots.length) {
    let bestIdx = 0;
    let bestOptions = null;
    players.forEach((pid, idx) => {
      const options = slots.filter((s) => !stats.get(pid).playedPositions.has(s));
      if (bestOptions === null || options.length < bestOptions.length) {
        bestOptions = options;
        bestIdx = idx;
      }
    });
    const pid = players[bestIdx];
    const slotId = bestOptions.length > 0 ? bestOptions[0] : slots[0];
    inning.assignments[slotId] = pid;
    applyStatus(stats.get(pid), slotId);
    players.splice(bestIdx, 1);
    slots.splice(slots.indexOf(slotId), 1);
  }
}

// Chooses `count` players from `pool` best suited for `category`
// ("infield"/"outfield"), preferring: (a) players who still need infield
// time within the first 3 innings, (b) players who must not get outfield
// again (already on a 2-streak), (c) whoever is currently most lopsided
// toward the *other* category, so each player's own infield/outfield split
// stays as balanced as possible over the game (SR-2) rather than just
// balancing each category's total across players independently.
function pickForCategory(pool, stats, count, category, inningIndex) {
  if (count <= 0) return [];
  const scored = pool.map((pid) => {
    const s = stats.get(pid);
    // Lower score = higher priority. A player who has played much more of
    // the *other* category than this one should get this category next.
    let score = category === "infield" ? s.infield - s.outfield : s.outfield - s.infield;
    if (category === "infield" && inningIndex < 3 && s.infield === 0) score -= 100;
    if (category === "infield" && s.ofStreak >= 2) score -= 500; // urgent: give infield to relieve an outfield streak
    if (category === "outfield" && s.ofStreak >= 2) score += 1000; // avoid: would break HR-3
    return { pid, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, count).map((s) => s.pid);
}

// Fisher-Yates shuffle (in place), returning the array for convenience.
// Not seeded — every call draws fresh randomness, which is the point (§6.3).
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
