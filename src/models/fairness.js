import { countCategories } from "./stats.js";

// Derived, read-only indicator (docs/plan.md §5.5) of how evenly a
// generated alignment spread bench/infield/outfield time across present
// players. Not a rule: it never feeds the generator's scoring (§6.3) and
// nothing here is validated or blocking like the hard/soft rules
// (§6.1/§6.2) — it's purely something to show the coach.
export function computeFairness(game) {
  const bench = [];
  const infield = [];
  const outfield = [];
  for (const pid of game.presentPlayerIds) {
    const counts = countCategories(game, pid);
    bench.push(counts.bench);
    infield.push(counts.infield);
    outfield.push(counts.outfield);
  }

  const benchSpread = spread(bench);
  const infieldSpread = spread(infield);
  const outfieldSpread = spread(outfield);
  const maxSpread = Math.max(benchSpread, infieldSpread, outfieldSpread);

  const label = maxSpread <= 1 ? "Excellent" : maxSpread <= 2 ? "Good" : "Uneven";

  return { label, benchSpread, infieldSpread, outfieldSpread, maxSpread };
}

function spread(counts) {
  if (counts.length === 0) return 0;
  return Math.max(...counts) - Math.min(...counts);
}
