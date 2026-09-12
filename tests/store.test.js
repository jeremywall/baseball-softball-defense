import test from "node:test";
import assert from "node:assert/strict";
import * as store from "../src/state/store.js";

// Each test resets attendance/game state itself rather than relying on
// ordering or cleanup from other tests, since node:test doesn't guarantee
// top-level tests in a file run strictly one-at-a-time.
function reset() {
  store.startOver();
  store.setup.attendance.clear();
}

test("toggleAllAttendance: marks everyone present, then clears everyone on a second toggle", () => {
  reset();
  assert.equal(store.presentCount(), 0);

  store.toggleAllAttendance();
  assert.equal(store.presentCount(), store.players.length);

  store.toggleAllAttendance();
  assert.equal(store.presentCount(), 0);
});

test("toggleAllAttendance: marks everyone present even if some were already checked", () => {
  reset();
  store.toggleAttendance(store.players[0].id);
  assert.equal(store.presentCount(), 1);

  store.toggleAllAttendance();
  assert.equal(store.presentCount(), store.players.length);
});

test("alignment mode auto-selects with attendance: 9 or fewer present picks 9-position, 10+ picks 10-position", () => {
  reset();
  for (let i = 0; i < 9; i++) store.toggleAttendance(store.players[i].id);
  assert.equal(store.presentCount(), 9);
  assert.equal(store.setup.alignmentMode, 9);

  store.toggleAttendance(store.players[9].id); // 10th present
  assert.equal(store.presentCount(), 10);
  assert.equal(store.setup.alignmentMode, 10);

  store.toggleAttendance(store.players[9].id); // back down to 9 present
  assert.equal(store.presentCount(), 9);
  assert.equal(store.setup.alignmentMode, 9);
});

test("alignment mode auto-selects via All Present too", () => {
  reset();
  assert.ok(store.players.length >= 10); // the embedded roster has more than 10 names
  store.toggleAllAttendance();
  assert.equal(store.setup.alignmentMode, 10);

  store.toggleAllAttendance();
  assert.equal(store.setup.alignmentMode, 9);
});

test("assignPositions: does nothing below the HR-7 minimum of 7 present", () => {
  reset();
  store.toggleAttendance(store.players[0].id);
  store.assignPositions();
  assert.equal(store.getGame(), null);
});

test("assignPositions/regenerate/startOver: the one-button flow produces a complete game and can be undone", () => {
  reset();
  for (const p of store.players) store.toggleAttendance(p.id);
  assert.ok(store.canAssign());

  store.assignPositions();
  const game = store.getGame();
  assert.ok(game);
  assert.equal(game.innings.length, store.setup.numInnings);

  store.regenerate();
  assert.ok(store.getGame());

  store.startOver();
  assert.equal(store.getGame(), null);
});
