import test from "node:test";
import assert from "node:assert/strict";
import { computeOutfieldCount } from "../src/models/game.js";

test("computeOutfieldCount: full attendance uses the mode's max outfielders", () => {
  assert.equal(computeOutfieldCount(9, 12), 3);
  assert.equal(computeOutfieldCount(10, 13), 4);
});

test("computeOutfieldCount: shortfall reduces outfield, never below the min needed for HR-7", () => {
  assert.equal(computeOutfieldCount(9, 7), 1); // 7 present = 6 infield + 1 outfielder
  assert.equal(computeOutfieldCount(9, 8), 2);
  assert.equal(computeOutfieldCount(10, 7), 1);
});
