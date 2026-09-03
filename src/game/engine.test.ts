import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createGame, type Tile } from "./engine.ts";
import { pairPuzzle, partnersFor, puzzleFor } from "./puzzles.ts";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const root = (marker: string, gloss = marker): Tile => ({ kind: "root", marker, gloss });
const affix = (marker: string, gloss = marker): Tile => ({ kind: "affix", marker, gloss });

describe("puzzles", () => {
  it("knows linguistic pairs", () => {
    assert.ok(puzzleFor("illu", "qaq"));
    assert.ok(puzzleFor("illu", "t"));
    assert.equal(puzzleFor("illu", "mi"), undefined);
    assert.deepEqual(partnersFor("root", "illu").sort(), ["qaq", "sior", "t"].sort());
    assert.ok(pairPuzzle(root("qimmeq"), affix("sior")));
    assert.equal(pairPuzzle(root("nuna"), affix("sior")), undefined);
  });
});

describe("engine core", () => {
  it("catches a tile in the paddle column", () => {
    const g = createGame({ rng: mulberry32(1), riseSpeed: 1 });
    g.start();
    g.__load({
      paddle: [],
      active: { ...root("illu", "house"), col: 1, y: 0.99 },
    });
    const ev = g.tick(1, 1);
    assert.equal(ev.event, "caught");
    if (ev.event !== "caught") return;
    assert.equal(ev.tile.marker, "illu");
    assert.equal(g.getState().paddle[0]?.marker, "illu");
  });

  it("misses and loses a life when the paddle is in another lane", () => {
    const g = createGame({ rng: mulberry32(2), riseSpeed: 1 });
    g.start();
    g.__load({
      lives: 3,
      paddle: [],
      active: { ...root("illu"), col: 0, y: 0.99 },
    });
    const ev = g.tick(1, 2);
    assert.equal(ev.event, "missed");
    if (ev.event !== "missed") return;
    assert.equal(ev.lives, 2);
    assert.equal(g.getState().combo, 0);
  });

  it("blocks without losing a life when the paddle is full", () => {
    const g = createGame({ rng: mulberry32(3), paddleCap: 2, riseSpeed: 1 });
    g.start();
    g.__load({
      lives: 3,
      paddle: [root("illu"), affix("t")],
      active: { ...root("nuna"), col: 0, y: 0.99 },
    });
    const ev = g.tick(1, 0);
    assert.equal(ev.event, "blocked");
    assert.equal(g.getState().lives, 3);
    assert.equal(g.getState().paddle.length, 2);
  });

  it("matches a root and affix in the same lane and shows the word", () => {
    const g = createGame({ rng: mulberry32(4) });
    g.start();
    g.__load({
      paddle: [affix("qaq", "to have a ___")],
      stacks: [[root("illu", "house")], [], [], []],
    });
    const res = g.place(0);
    assert.equal(res.placed, true);
    if (!res.placed || res.event !== "match") {
      assert.fail(`expected match, got ${JSON.stringify(res)}`);
    }
    assert.equal(res.resultWord, "illoqarpoq");
    assert.equal(res.pairLabel, "illu + qaq");
    assert.equal(g.getState().stacks[0]?.length, 0);
    assert.equal(g.getState().matches, 1);
    assert.equal(g.getState().score, 100);
  });

  it("does not match across lanes", () => {
    const g = createGame({ rng: mulberry32(5) });
    g.start();
    g.__load({
      paddle: [affix("qaq")],
      stacks: [[root("illu")], [], [], []],
    });
    const res = g.place(2);
    assert.equal(res.placed, true);
    if (!res.placed) return;
    assert.equal(res.event, "placed");
    assert.equal(g.getState().stacks[0]?.length, 1);
    assert.equal(g.getState().stacks[2]?.length, 1);
    assert.equal(g.getState().matches, 0);
  });

  it("does not match an invalid pair even in the same lane", () => {
    const g = createGame({ rng: mulberry32(6) });
    g.start();
    g.__load({
      paddle: [affix("mi")],
      stacks: [[root("illu")], [], [], []],
    });
    const res = g.place(0);
    assert.equal(res.placed, true);
    if (!res.placed) return;
    assert.equal(res.event, "placed");
    assert.equal(g.getState().stacks[0]?.length, 2);
  });

  it("matches qaq with any root that takes it, regardless of spawn", () => {
    const g = createGame({ rng: mulberry32(7) });
    g.start();
    g.__load({
      paddle: [affix("qaq", "to have a ___")],
      stacks: [[root("qimmeq", "dog")], [], [], []],
    });
    const res = g.place(0);
    assert.equal(res.placed && res.event === "match", true);
    if (!res.placed || res.event !== "match") return;
    assert.equal(res.resultWord, "qimmeqarpunga");
  });

  it("hints cells that would pair with the held tile", () => {
    const g = createGame({ rng: mulberry32(8) });
    g.start();
    g.__load({
      paddle: [affix("t")],
      stacks: [[root("illu")], [root("qimmeq")], [root("inuk")], []],
    });
    const hints = g.getState().hints.map((h) => h.col).sort();
    assert.deepEqual(hints, [0, 2]);
  });

  it("refuses a full lane and keeps the tile on the paddle", () => {
    const g = createGame({ rng: mulberry32(9), stackCap: 2 });
    g.start();
    g.__load({
      paddle: [root("nuna")],
      stacks: [[root("illu"), affix("mi")], [], [], []],
    });
    const res = g.place(0);
    assert.equal(res.placed, false);
    assert.equal(g.getState().paddle[0]?.marker, "nuna");
  });

  it("discards the top paddle tile and breaks combo", () => {
    const g = createGame({ rng: mulberry32(10) });
    g.start();
    g.__load({
      combo: 4,
      paddle: [root("illu"), affix("t")],
    });
    const tile = g.discard();
    assert.equal(tile?.marker, "t");
    assert.equal(g.getState().paddle.length, 1);
    assert.equal(g.getState().combo, 0);
  });

  it("raises the wave every five matches", () => {
    const g = createGame({ rng: mulberry32(11) });
    g.start();
    g.__load({
      matchesThisWave: 4,
      wave: 1,
      paddle: [affix("t")],
      stacks: [[root("illu")], [], [], []],
    });
    const res = g.place(0);
    assert.equal(res.placed && res.event === "match", true);
    if (!res.placed || res.event !== "match") return;
    assert.equal(res.waveUp, 2);
    assert.equal(g.getState().wave, 2);
  });

  it("powers: 1UP, lane clear, board clear", () => {
    const g = createGame({ rng: mulberry32(12) });
    g.start();
    g.__load({
      lives: 2,
      paddle: [{ kind: "power-1up", marker: "1UP", gloss: "extra life" }],
      stacks: [[root("illu")], [affix("t")], [], []],
    });
    const up = g.place(0);
    assert.equal(up.placed && up.event === "power-1up", true);
    assert.equal(g.getState().lives, 3);

    g.__load({
      paddle: [{ kind: "power-lane", marker: "LANE", gloss: "clear this lane" }],
    });
    const lane = g.place(0);
    assert.equal(lane.placed && lane.event === "power-lane", true);
    assert.equal(g.getState().stacks[0]?.length, 0);
    assert.equal(g.getState().stacks[1]?.length, 1);

    g.__load({
      paddle: [{ kind: "power-screen", marker: "ALL", gloss: "clear the board" }],
    });
    const all = g.place(0);
    assert.equal(all.placed && all.event === "power-screen", true);
    assert.ok(g.getState().stacks.every((s) => s.length === 0));
  });

  it("game over after the last miss", () => {
    const g = createGame({ rng: mulberry32(13), riseSpeed: 1, startLives: 1 });
    g.start();
    g.__load({
      lives: 1,
      active: { ...root("illu"), col: 3, y: 0.99 },
    });
    const ev = g.tick(1, 0);
    assert.equal(ev.event, "missed");
    if (ev.event !== "missed") return;
    assert.equal(ev.gameOver, true);
    assert.equal(g.getState().gameOver, true);
  });
});
