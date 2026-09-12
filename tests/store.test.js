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
