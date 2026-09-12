import test from "node:test";
import assert from "node:assert/strict";
import { makeGame } from "./helpers.js";
import * as hr1 from "../src/rules/hr1.js";
import * as hr3 from "../src/rules/hr3.js";
import * as hr4 from "../src/rules/hr4.js";
import * as hr7 from "../src/rules/hr7.js";
import * as hr9 from "../src/rules/hr9.js";
import * as hr10 from "../src/rules/hr10.js";
import * as sr1 from "../src/rules/sr1.js";

function fullInning(game, i, order) {
  // order: array of player ids in position order matching game.positions
  game.positions.forEach((pos, idx) => {
    game.innings[i].assignments[pos.id] = order[idx];
  });
}

test("HR-1: catcher for >3 innings who also pitches is flagged", () => {
  const game = makeGame({ playerCount: 12, numInnings: 6, pitcherLimit: 2 });
  const positionOrder = game.positions.map((p) => p.id);
  const base = ["p1", "p0", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]; // P=p1,C=p0,...
  for (let i = 0; i < 4; i++) fullInning(game, i, base);
  for (let i = 4; i < 6; i++) fullInning(game, i, base.map((pid) => (pid === "p0" ? "p9" : pid)));
  // p0 caught 4 innings (0-3); now have p0 also pitch once (inning 5)
  game.innings[5].assignments.P = "p0";

  const violations = hr1.validate(game);
  assert.ok(violations.some((v) => v.playerId === "p0"));
});

test("HR-9: pitching beyond the configured limit is flagged", () => {
  const game = makeGame({ playerCount: 12, numInnings: 3, pitcherLimit: 1 });
  const order = game.positions.map((p, idx) => `p${idx}`);
  for (let i = 0; i < 3; i++) fullInning(game, i, order); // p0 pitches all 3 innings
  const violations = hr9.validate(game);
  assert.ok(violations.some((v) => v.playerId === "p0" && v.ruleId === "HR-9"));
});

test("HR-10: pitching again after being pulled is flagged", () => {
  const game = makeGame({ playerCount: 12, numInnings: 3, pitcherLimit: 2 });
  const orderA = game.positions.map((p, idx) => `p${idx}`); // p0 pitches
  const orderB = orderA.map((pid) => (pid === "p0" ? "p9" : pid === "p9" ? "p0" : pid)); // p9 pitches, p0 elsewhere
  fullInning(game, 0, orderA);
  fullInning(game, 1, orderB);
  fullInning(game, 2, orderA); // p0 pitches again after being pulled in inning 2 (index 1)
  const violations = hr10.validate(game);
  assert.ok(violations.some((v) => v.playerId === "p0" && v.ruleId === "HR-10"));
});

test("HR-3: 3 consecutive outfield innings flagged, bench innings don't break the streak", () => {
  const game = makeGame({ playerCount: 12, numInnings: 4 });
  const positions = game.positions.map((p) => p.id); // [...6 infield, LF, CF, RF]
  const outfieldIdx = positions.indexOf("LF");
  const withP0AtLF = (benchP0) => {
    const order = positions.map((_, idx) => `p${idx + 1}`);
    if (!benchP0) order[outfieldIdx] = "p0";
    return order;
  };
  fullInning(game, 0, withP0AtLF(false)); // p0 outfield
  fullInning(game, 1, withP0AtLF(true)); // p0 benched (not in the 9 assigned -> bench)
  fullInning(game, 2, withP0AtLF(false)); // p0 outfield again
  fullInning(game, 3, withP0AtLF(false)); // p0 outfield a third time (consecutive, ignoring the bench inning)

  const violations = hr3.validate(game);
  assert.ok(violations.some((v) => v.playerId === "p0"));
});

test("HR-4: repeating a bench turn before everyone has sat once is flagged", () => {
  const game = makeGame({ playerCount: 10, numInnings: 2 }); // 9 slots, 1 bench spot per inning
  const positions = game.positions.map((p) => p.id);
  const order1 = positions.map((_, idx) => `p${idx}`); // p9 benched inning 1
  const order2 = positions.map((_, idx) => `p${idx}`); // p9 benched again inning 2 (violation)
  fullInning(game, 0, order1);
  fullInning(game, 1, order2);
  const violations = hr4.validate(game);
  assert.ok(violations.some((v) => v.playerId === "p9"));
});

test("HR-7: fewer than 7 present players is flagged", () => {
  const game = makeGame({ playerCount: 6, numInnings: 6 });
  const violations = hr7.validate(game);
  assert.equal(violations.length, 1);
});

test("HR-7: 7 or more present players passes", () => {
  const game = makeGame({ playerCount: 7, numInnings: 6 });
  const violations = hr7.validate(game);
  assert.equal(violations.length, 0);
});

test("SR-1: playing the same specific position twice is noted (soft, non-blocking)", () => {
  const game = makeGame({ playerCount: 12, numInnings: 2 });
  const order = game.positions.map((_, idx) => `p${idx}`); // p0 plays P both innings
  fullInning(game, 0, order);
  fullInning(game, 1, order);
  const notices = sr1.validate(game);
  assert.ok(notices.some((n) => n.playerId === "p0" && n.ruleId === "SR-1"));
});

test("SR-1: no notice when nobody repeats a specific position", () => {
  const game = makeGame({ playerCount: 12, numInnings: 2 });
  const orderA = game.positions.map((_, idx) => `p${idx}`);
  const orderB = [...orderA.slice(1), orderA[0]]; // rotate so nobody keeps the same slot
  fullInning(game, 0, orderA);
  fullInning(game, 1, orderB);
  const notices = sr1.validate(game);
  assert.equal(notices.length, 0);
});
