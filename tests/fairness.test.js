import test from "node:test";
import assert from "node:assert/strict";
import { makeGame, setInning } from "./helpers.js";
import { computeFairness } from "../src/models/fairness.js";

test("computeFairness: a perfect rotation reports zero spread and Excellent", () => {
  // 9 players, 9 positions, 9 innings: a cyclic Latin square where each
  // player visits every one of the 9 slots (indices 0-5 infield, 6-8
  // outfield) exactly once across the 9 innings, and nobody ever
  // benches. Every player ends up with infield=6, outfield=3, bench=0 -
  // perfectly even, by construction.
  const game = makeGame({ playerCount: 9, numInnings: 9, alignmentMode: 9 });
  const positionIds = game.positions.map((p) => p.id);
  const order = positionIds.map((_, idx) => `p${idx}`);

  for (let i = 0; i < 9; i++) {
    const assignments = Object.fromEntries(positionIds.map((id, j) => [id, order[(j + i) % 9]]));
    setInning(game, i, assignments);
  }

  const result = computeFairness(game);
  assert.equal(result.benchSpread, 0);
  assert.equal(result.infieldSpread, 0);
  assert.equal(result.outfieldSpread, 0);
  assert.equal(result.label, "Excellent");
});

test("computeFairness: matches a hand-checked uneven alignment", () => {
  const game = makeGame({ playerCount: 10, numInnings: 2, alignmentMode: 9 });
  const positionIds = game.positions.map((p) => p.id); // [P,C,1B,2B,3B,SS,LF,CF,RF]

  const inning0 = ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]; // p9 benched
  const inning1 = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"]; // p0 benched

  setInning(game, 0, Object.fromEntries(positionIds.map((id, idx) => [id, inning0[idx]])));
  setInning(game, 1, Object.fromEntries(positionIds.map((id, idx) => [id, inning1[idx]])));

  const result = computeFairness(game);
  assert.equal(result.benchSpread, 1); // p0 and p9 each benched once, everyone else 0
  assert.equal(result.infieldSpread, 2); // p1-p5 played infield twice, p7/p8/p9 never
  assert.equal(result.outfieldSpread, 2); // p7/p8 played outfield twice, p0-p5 never
  assert.equal(result.label, "Good"); // max spread is 2
});
