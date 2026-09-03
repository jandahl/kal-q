import { pairPuzzle, partnersFor, PUZZLES, puzzleFor, type Puzzle } from "./puzzles.ts";

export type TileKind = "root" | "affix" | "power-lane" | "power-screen" | "power-1up";

export type Tile = {
  kind: TileKind;
  marker: string;
  gloss: string;
};

export type ActiveTile = Tile & { col: number; y: number };

export type MatchCell = {
  col: number;
  row: number;
  marker: string;
  kind: TileKind;
  gloss: string;
};

export type HintCell = { col: number; row: number };

export type TickEvent =
  | { event: "gameover" }
  | { event: "spawned" }
  | { event: "rising" }
  | { event: "caught"; tile: Tile }
  | { event: "blocked" }
  | { event: "missed"; lives: number; gameOver: boolean };

export type PlaceResult =
  | { placed: false; full?: boolean }
  | { placed: true; event: "placed" }
  | {
      placed: true;
      event: "match";
      cleared: [string, string];
      cells: MatchCell[];
      score: number;
      combo: number;
      pairLabel: string;
      pairGloss: string;
      resultWord: string;
      resultGloss: string;
      waveUp?: number;
    }
  | {
      placed: true;
      event: "power-lane";
      col: number;
      cleared: string[];
      cells: MatchCell[];
    }
  | {
      placed: true;
      event: "power-screen";
      cleared: string[];
      cells: MatchCell[];
    }
  | { placed: true; event: "power-1up"; lives: number };

export type GameState = {
  lives: number;
  score: number;
  combo: number;
  wave: number;
  matches: number;
  gameOver: boolean;
  paddle: Tile[];
  paddleCap: number;
  stacks: Tile[][];
  stackCap: number;
  columns: number;
  active: ActiveTile | null;
  riseSpeed: number;
  hints: HintCell[];
};

const PILL_CHANCE = 1 / 22;
const PILL_KIND_WEIGHTS: { kind: Extract<TileKind, "power-lane" | "power-screen" | "power-1up">; w: number }[] = [
  { kind: "power-lane", w: 0.45 },
  { kind: "power-screen", w: 0.35 },
  { kind: "power-1up", w: 0.2 },
];
const PITY_CHANCE = 0.72;
const ROOT_VS_AFFIX_CHANCE = 0.5;
const MATCHES_PER_WAVE = 5;
const SPEED_GROWTH = 1.14;
const MAX_RISE_SPEED = 0.48;
const BASE_MATCH_SCORE = 100;

const PILL_META: Record<
  "power-lane" | "power-screen" | "power-1up",
  { marker: string; gloss: string }
> = {
  "power-lane": { marker: "LANE", gloss: "clear this lane" },
  "power-screen": { marker: "ALL", gloss: "clear the board" },
  "power-1up": { marker: "1UP", gloss: "extra life" },
};

export type EngineConfig = {
  columns?: number;
  stackCap?: number;
  paddleCap?: number;
  startLives?: number;
  riseSpeed?: number;
  rng?: () => number;
};

export type EngineLoad = {
  paddle?: Tile[];
  stacks?: Tile[][];
  lives?: number;
  score?: number;
  combo?: number;
  wave?: number;
  matches?: number;
  matchesThisWave?: number;
  riseSpeed?: number;
  gameOver?: boolean;
  active?: ActiveTile | null;
};

function copyTile(t: Tile): Tile {
  return { kind: t.kind, marker: t.marker, gloss: t.gloss };
}

export function createGame(config: EngineConfig = {}) {
  const columns = config.columns ?? 4;
  const stackCap = config.stackCap ?? 5;
  const paddleCap = config.paddleCap ?? 4;
  const startLives = config.startLives ?? 3;
  const startSpeed = config.riseSpeed ?? 0.17;
  const rng = config.rng ?? Math.random;

  let bag: Puzzle[] = [];
  let active: ActiveTile | null = null;
  let paddle: Tile[] = [];
  let stacks: Tile[][] = [];
  let lives = startLives;
  let score = 0;
  let combo = 0;
  let wave = 1;
  let matches = 0;
  let matchesThisWave = 0;
  let riseSpeed = startSpeed;
  let gameOver = false;

  function shuffleBag() {
    bag = PUZZLES.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = bag[i]!;
      bag[i] = bag[j]!;
      bag[j] = tmp;
    }
  }

  function nextPuzzle(): Puzzle {
    if (!bag.length) shuffleBag();
    return bag.pop() ?? PUZZLES[0]!;
  }

  function pickPillKind() {
    const total = PILL_KIND_WEIGHTS.reduce((s, x) => s + x.w, 0);
    let roll = rng() * total;
    for (const entry of PILL_KIND_WEIGHTS) {
      roll -= entry.w;
      if (roll <= 0) return entry.kind;
    }
    return PILL_KIND_WEIGHTS[PILL_KIND_WEIGHTS.length - 1]!.kind;
  }

  function pendingTiles(): Tile[] {
    const out: Tile[] = [];
    for (const lane of stacks) {
      for (const t of lane) {
        if (t.kind === "root" || t.kind === "affix") out.push(t);
      }
    }
    for (const t of paddle) {
      if (t.kind === "root" || t.kind === "affix") out.push(t);
    }
    return out;
  }

  function randomCol() {
    return Math.floor(rng() * columns);
  }

  function spawnActive() {
    if (rng() < PILL_CHANCE) {
      const kind = pickPillKind();
      const meta = PILL_META[kind];
      active = { kind, marker: meta.marker, gloss: meta.gloss, col: randomCol(), y: 0 };
      return;
    }

    const pending = pendingTiles();
    if (pending.length && rng() < PITY_CHANCE) {
      const src = pending[Math.floor(rng() * pending.length)]!;
      if (src.kind === "root" || src.kind === "affix") {
        const partners = partnersFor(src.kind, src.marker);
        if (partners.length) {
          const marker = partners[Math.floor(rng() * partners.length)]!;
          if (src.kind === "root") {
            const puzzle = puzzleFor(src.marker, marker);
            active = {
              kind: "affix",
              marker,
              gloss: puzzle?.correctGloss ?? marker,
              col: randomCol(),
              y: 0,
            };
            return;
          }
          const puzzle = puzzleFor(marker, src.marker);
          active = {
            kind: "root",
            marker,
            gloss: puzzle?.rootGloss ?? marker,
            col: randomCol(),
            y: 0,
          };
          return;
        }
      }
    }

    const puzzle = nextPuzzle();
    if (rng() < ROOT_VS_AFFIX_CHANCE) {
      active = {
        kind: "root",
        marker: puzzle.root,
        gloss: puzzle.rootGloss,
        col: randomCol(),
        y: 0,
      };
      return;
    }
    active = {
      kind: "affix",
      marker: puzzle.correct,
      gloss: puzzle.correctGloss,
      col: randomCol(),
      y: 0,
    };
  }

  function hintsFor(held: Tile | undefined): HintCell[] {
    if (!held || (held.kind !== "root" && held.kind !== "affix")) return [];
    const hints: HintCell[] = [];
    for (let c = 0; c < stacks.length; c++) {
      const lane = stacks[c]!;
      for (let r = 0; r < lane.length; r++) {
        if (pairPuzzle(held, lane[r]!)) hints.push({ col: c, row: r });
      }
    }
    return hints;
  }

  function tryMatch(col: number): Extract<PlaceResult, { event: "match" }> | null {
    const lane = stacks[col]!;
    if (lane.length < 2) return null;
    const topIndex = lane.length - 1;
    const top = lane[topIndex]!;
    for (let i = topIndex - 1; i >= 0; i--) {
      const other = lane[i]!;
      const puzzle = pairPuzzle(top, other);
      if (!puzzle) continue;
      const cells: MatchCell[] = [
        { col, row: i, marker: other.marker, kind: other.kind, gloss: other.gloss },
        { col, row: topIndex, marker: top.marker, kind: top.kind, gloss: top.gloss },
      ];
      lane.splice(topIndex, 1);
      lane.splice(i, 1);
      combo += 1;
      matches += 1;
      matchesThisWave += 1;
      score += BASE_MATCH_SCORE * combo;
      let waveUp: number | undefined;
      if (matchesThisWave >= MATCHES_PER_WAVE) {
        matchesThisWave = 0;
        wave += 1;
        riseSpeed = Math.min(MAX_RISE_SPEED, riseSpeed * SPEED_GROWTH);
        waveUp = wave;
        score += 50 * wave;
      }
      const root = top.kind === "root" ? top : other;
      const affix = top.kind === "affix" ? top : other;
      return {
        placed: true,
        event: "match",
        cleared: [root.marker, affix.marker],
        cells,
        score,
        combo,
        pairLabel: `${root.marker} + ${affix.marker}`,
        pairGloss: `${root.gloss} · ${affix.gloss}`,
        resultWord: puzzle.resultWord,
        resultGloss: puzzle.resultGloss,
        waveUp,
      };
    }
    return null;
  }

  function start(): GameState {
    lives = startLives;
    score = 0;
    combo = 0;
    wave = 1;
    matches = 0;
    matchesThisWave = 0;
    riseSpeed = startSpeed;
    gameOver = false;
    paddle = [];
    stacks = Array.from({ length: columns }, () => []);
    bag = [];
    active = null;
    spawnActive();
    return getState();
  }

  function tick(dtSeconds: number, paddleCol: number, speedMultiplier = 1): TickEvent {
    if (gameOver) return { event: "gameover" };
    if (!active) {
      spawnActive();
      return { event: "spawned" };
    }
    active.y = Math.min(1, active.y + riseSpeed * speedMultiplier * dtSeconds);
    if (active.y < 1) return { event: "rising" };

    if (active.col === paddleCol && paddle.length < paddleCap) {
      const tile = copyTile(active);
      paddle.push(tile);
      active = null;
      spawnActive();
      return { event: "caught", tile };
    }

    if (active.col === paddleCol && paddle.length >= paddleCap) {
      active = null;
      combo = 0;
      spawnActive();
      return { event: "blocked" };
    }

    active = null;
    lives -= 1;
    combo = 0;
    if (lives <= 0) {
      gameOver = true;
      return { event: "missed", lives, gameOver: true };
    }
    spawnActive();
    return { event: "missed", lives, gameOver: false };
  }

  function place(col: number): PlaceResult {
    if (!paddle.length || gameOver) return { placed: false };
    const tile = paddle[paddle.length - 1]!;
    if (tile.kind === "power-lane") {
      paddle.pop();
      const cells = stacks[col]!.map((t, row) => ({
        col,
        row,
        marker: t.marker,
        kind: t.kind,
        gloss: t.gloss,
      }));
      const cleared = stacks[col]!.map((t) => t.marker);
      stacks[col] = [];
      return { placed: true, event: "power-lane", col, cleared, cells };
    }
    if (tile.kind === "power-screen") {
      paddle.pop();
      const cells = stacks.flatMap((lane, c) =>
        lane.map((t, row) => ({ col: c, row, marker: t.marker, kind: t.kind, gloss: t.gloss })),
      );
      const cleared = stacks.flat().map((t) => t.marker);
      stacks = stacks.map(() => []);
      return { placed: true, event: "power-screen", cleared, cells };
    }
    if (tile.kind === "power-1up") {
      paddle.pop();
      lives += 1;
      return { placed: true, event: "power-1up", lives };
    }
    if (stacks[col]!.length >= stackCap) return { placed: false, full: true };
    paddle.pop();
    stacks[col]!.push(copyTile(tile));
    const matched = tryMatch(col);
    return matched ?? { placed: true, event: "placed" };
  }

  function discard(): Tile | null {
    if (!paddle.length || gameOver) return null;
    combo = 0;
    return paddle.pop() ?? null;
  }

  function getState(): GameState {
    const held = paddle[paddle.length - 1];
    return {
      lives,
      score,
      combo,
      wave,
      matches,
      gameOver,
      paddle,
      paddleCap,
      stacks,
      stackCap,
      columns,
      active,
      riseSpeed,
      hints: hintsFor(held),
    };
  }

  function __load(next: EngineLoad): GameState {
    if (next.paddle) paddle = next.paddle.map(copyTile);
    if (next.stacks) stacks = next.stacks.map((lane) => lane.map(copyTile));
    if (next.lives != null) lives = next.lives;
    if (next.score != null) score = next.score;
    if (next.combo != null) combo = next.combo;
    if (next.wave != null) wave = next.wave;
    if (next.matches != null) matches = next.matches;
    if (next.matchesThisWave != null) matchesThisWave = next.matchesThisWave;
    if (next.riseSpeed != null) riseSpeed = next.riseSpeed;
    if (next.gameOver != null) gameOver = next.gameOver;
    if (next.active !== undefined) active = next.active ? { ...next.active } : null;
    return getState();
  }

  return { start, tick, place, discard, getState, __load };
}

export type Engine = ReturnType<typeof createGame>;
