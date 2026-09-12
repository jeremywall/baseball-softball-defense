import test from "node:test";
import assert from "node:assert/strict";
import { makeGame } from "./helpers.js";
import { autoSuggest } from "../src/suggest/autoSuggest.js";
import { isGameComplete } from "../src/models/game.js";
import { validateAll } from "../src/rules/index.js";

test("autoSuggest fills every slot in every inning", () => {
  const game = makeGame({ playerCount: 12, numInnings: 6, alignmentMode: 9, pitcherLimit: 1 });
  autoSuggest(game);
  assert.ok(isGameComplete(game));
});

test("autoSuggest on a typical 12-player, 6-inning, 9-position, 1-inning-pitcher-limit game has no hard rule violations, across many randomized runs", () => {
  // Randomized (docs/plan.md §6.3), so this checks many draws rather than
  // trusting a single run.
  for (let trial = 0; trial < 25; trial++) {
    const game = makeGame({ playerCount: 12, numInnings: 6, alignmentMode: 9, pitcherLimit: 1 });
    autoSuggest(game);
    const violations = validateAll(game);
    assert.deepEqual(violations, [], `trial ${trial}: ${JSON.stringify(violations)}`);
  }
});

test("autoSuggest handles a short-handed 7-player game (min HR-7 case)", () => {
  const game = makeGame({ playerCount: 7, numInnings: 6, alignmentMode: 9, pitcherLimit: 2 });
  autoSuggest(game);
  assert.ok(isGameComplete(game));
  assert.equal(game.outfieldCount, 1);
});

test("autoSuggest is randomized: the same inputs produce more than one distinct alignment", () => {
  const seen = new Set();
  for (let trial = 0; trial < 15; trial++) {
    const game = makeGame({ playerCount: 12, numInnings: 6, alignmentMode: 9, pitcherLimit: 1 });
    autoSuggest(game);
    seen.add(JSON.stringify(game.innings.map((inn) => inn.assignments)));
  }
  assert.ok(seen.size > 1, "expected at least 2 distinct alignments across 15 runs, got all identical");
});
