import test from "node:test";
import assert from "node:assert/strict";
import { computeOutfieldCount, effectiveAlignmentMode } from "../src/models/game.js";
import { makeGame } from "./helpers.js";

test("computeOutfieldCount: full attendance uses the mode's max outfielders", () => {
  assert.equal(computeOutfieldCount(9, 12), 3);
  assert.equal(computeOutfieldCount(10, 13), 4);
});

test("computeOutfieldCount: shortfall reduces outfield, never below the min needed for HR-7", () => {
  assert.equal(computeOutfieldCount(9, 8), 2);
});

test("computeOutfieldCount: exactly 7 present drops the catcher for a 2nd outfielder", () => {
  // 7 present = Pitcher/1B/2B/3B/SS (no catcher) + 2 outfielders.
  assert.equal(computeOutfieldCount(9, 7), 2);
  assert.equal(computeOutfieldCount(10, 7), 2);
});

test("effectiveAlignmentMode: falls back to 9-position mode at 9 or fewer present", () => {
  assert.equal(effectiveAlignmentMode(10, 9), 9);
  assert.equal(effectiveAlignmentMode(10, 7), 9);
  assert.equal(effectiveAlignmentMode(9, 9), 9);
});

test("effectiveAlignmentMode: keeps 10-position mode at 10 or more present", () => {
  assert.equal(effectiveAlignmentMode(10, 10), 10);
  assert.equal(effectiveAlignmentMode(10, 13), 10);
});

test("createGame: 10-position mode requested with 9 present actually builds a 9-position game (LF/CF/RF, not LF/LC/RC)", () => {
  const game = makeGame({ playerCount: 9, numInnings: 6, alignmentMode: 10, pitcherLimit: 1 });
  assert.equal(game.alignmentMode, 9);
  const positionIds = game.positions.map((p) => p.id);
  assert.ok(positionIds.includes("CF"));
  assert.ok(!positionIds.includes("LC"));
});

test("createGame: exactly 7 present has no catcher position and 2 outfielders", () => {
  const game = makeGame({ playerCount: 7, numInnings: 6, alignmentMode: 9, pitcherLimit: 2 });
  const positionIds = game.positions.map((p) => p.id);
  assert.ok(!positionIds.includes("C"));
  assert.equal(game.outfieldCount, 2);
  assert.equal(positionIds.length, 7); // P, 1B, 2B, 3B, SS, + 2 outfielders
});

test("createGame: 8 present still has a catcher (7-present drop is exact, not <=7)", () => {
  const game = makeGame({ playerCount: 8, numInnings: 6, alignmentMode: 9, pitcherLimit: 2 });
  const positionIds = game.positions.map((p) => p.id);
  assert.ok(positionIds.includes("C"));
});
