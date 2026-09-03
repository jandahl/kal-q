import { createGame, type Engine, type GameState, type PlaceResult } from "./engine";
import { sfx, stopBed, unlockAudio } from "./audio";
import {
  addTrauma,
  burst,
  createJuice,
  floatText,
  hitstop,
  setGhost,
  shakeOffset,
  tickJuice,
  type Juice,
} from "./juice";
import { KIND_COLOR } from "./juice";
import { cellCenter, hitColumn, layoutFor, renderFrame, type Layout } from "./render";
import { C } from "./palette";
import { partnersFor } from "./puzzles";
import { writeSave } from "./save";

export type Phase = "title" | "howTo" | "playing" | "paused" | "over";

export type HudSnap = {
  score: number;
  lives: number;
  combo: number;
  wave: number;
  matches: number;
  paddleCount: number;
  paddleCap: number;
  heldLabel: string | null;
  heldGloss: string | null;
  heldKind: "root" | "affix" | "power" | null;
  heldPartners: string[];
  lastPair: { label: string; gloss: string; word?: string; meaning?: string } | null;
  waveBanner: string | null;
};

const DAS_DELAY = 0.16;
const DAS_REPEAT = 0.09;

export class Session {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  engine: Engine;
  juice: Juice;
  paddleCol = 1;
  keys = new Set<string>();
  running = false;
  paused = false;
  lastT = 0;
  clock = 0;
  hold = 0;
  raf = 0;
  dpr = 1;
  layout: Layout;
  reducedShake: boolean;
  lastPair: HudSnap["lastPair"] = null;
  waveBanner: string | null = null;
  waveBannerT = 0;
  onHud: (s: HudSnap) => void;
  onOver: (s: GameState) => void;
  private hudDirty = true;
  ended = false;
  private dasDir: -1 | 1 | 0 = 0;
  private dasT = 0;
  private wasLeft = false;
  private wasRight = false;
  private ro: ResizeObserver | null = null;
  debug = { frames: 0, sumDt: 0, misses: 0, catches: 0, matches: 0 };

  constructor(
    canvas: HTMLCanvasElement,
    opts: {
      reducedShake: boolean;
      onHud: (s: HudSnap) => void;
      onOver: (s: GameState) => void;
    },
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    this.ctx = ctx;
    this.engine = createGame();
    this.engine.start();
    this.juice = createJuice();
    this.reducedShake = opts.reducedShake;
    this.onHud = opts.onHud;
    this.onOver = opts.onOver;
    this.layout = layoutFor(1, 1);
    this.resize();
  }

  start() {
    this.running = true;
    this.lastT = 0;
    this.resize();
    this.ro?.disconnect();
    this.ro = new ResizeObserver(() => {
      this.resize();
      this.paint();
    });
    this.ro.observe(this.canvas);
    window.addEventListener("resize", this.onWinResize);
    window.visualViewport?.addEventListener("resize", this.onWinResize);
    document.addEventListener("visibilitychange", this.onVis);
    this.raf = requestAnimationFrame(this.loop);
    this.pushHud();
    this.paint();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ended = true;
    this.ro?.disconnect();
    this.ro = null;
    stopBed();
    this.keys.clear();
    window.removeEventListener("resize", this.onWinResize);
    window.visualViewport?.removeEventListener("resize", this.onWinResize);
    document.removeEventListener("visibilitychange", this.onVis);
  }

  pause() {
    this.paused = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.paint();
  }

  resume() {
    if (this.ended) return;
    this.paused = false;
    this.lastT = 0;
    if (this.running && !this.raf) this.raf = requestAnimationFrame(this.loop);
  }

  private onWinResize = () => {
    this.resize();
    this.paint();
  };

  private onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.lastT = 0;
      return;
    }
    if (this.running && !this.paused && !this.ended && !this.raf) {
      this.raf = requestAnimationFrame(this.loop);
    }
  };

  resize() {
    const rawDpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width));
    const cssH = Math.max(1, Math.round(rect.height));
    const maxPx = 1600;
    const dpr = Math.min(1.5, rawDpr, maxPx / cssW, maxPx / cssH);
    const bw = Math.max(1, Math.round(cssW * dpr));
    const bh = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    if (this.layout.w !== cssW || this.layout.h !== cssH || this.dpr !== dpr) {
      this.dpr = dpr;
      this.layout = layoutFor(cssW, cssH);
    }
  }

  keyDown(code: string) {
    const first = !this.keys.has(code);
    this.keys.add(code);
    if (!first || this.paused) return;
    if (code === "ArrowLeft" || code === "KeyA") {
      this.move(-1);
      this.dasDir = -1;
      this.dasT = DAS_DELAY;
    } else if (code === "ArrowRight" || code === "KeyD") {
      this.move(1);
      this.dasDir = 1;
      this.dasT = DAS_DELAY;
    }
  }
  keyUp(code: string) {
    this.keys.delete(code);
  }
  clearKeys() {
    this.keys.clear();
    this.wasLeft = false;
    this.wasRight = false;
    this.dasDir = 0;
  }

  tapColumn(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = hitColumn(this.layout, x, y);
    if (col == null) return;
    if (col === this.paddleCol) this.place();
    else {
      this.paddleCol = col;
      sfx.move();
    }
  }

  move(dir: -1 | 1) {
    this.paddleCol = (this.paddleCol + dir + 4) % 4;
    sfx.move();
  }

  place() {
    const state = this.engine.getState();
    if (!state.paddle.length) {
      sfx.deny();
      return;
    }
    const res = this.engine.place(this.paddleCol);
    this.applyPlace(res);
    this.hudDirty = true;
  }

  discard() {
    const tile = this.engine.discard();
    if (tile) sfx.discard();
    else sfx.deny();
    this.hudDirty = true;
  }

  private applyPlace(res: PlaceResult) {
    if (!res.placed) {
      sfx.deny();
      return;
    }
    const st = this.engine.getState();
    if (res.event === "match") {
      sfx.match(res.combo);
      this.debug.matches += 1;
      hitstop(this.juice, 0.05);
      addTrauma(this.juice, 0.28);
      setGhost(this.juice, res.cells, "match");
      for (const cell of res.cells) {
        const p = cellCenter(this.layout, cell.col, cell.row, st.stackCap);
        burst(this.juice, p.x, p.y, KIND_COLOR[cell.kind], 6, 140);
      }
      const mid = cellCenter(this.layout, res.cells[0]!.col, res.cells[0]!.row, st.stackCap);
      floatText(this.juice, mid.x, mid.y - 10, res.resultWord, C.fg, res.resultGloss);
      this.lastPair = {
        label: res.pairLabel,
        gloss: res.pairGloss,
        word: res.resultWord,
        meaning: res.resultGloss,
      };
      if (res.waveUp) {
        sfx.wave();
        this.waveBanner = `Wave ${res.waveUp}`;
        this.waveBannerT = 1.6;
      }
    } else if (res.event === "power-lane" || res.event === "power-screen") {
      sfx.power();
      addTrauma(this.juice, res.event === "power-screen" ? 0.45 : 0.28);
      setGhost(this.juice, res.cells, res.event);
      for (const cell of res.cells) {
        const p = cellCenter(this.layout, cell.col, cell.row, st.stackCap);
        burst(this.juice, p.x, p.y, KIND_COLOR[cell.kind], 4, 120);
      }
      floatText(
        this.juice,
        this.layout.w / 2,
        this.layout.h * 0.42,
        res.event === "power-screen" ? "CLEAR" : "LANE",
        C.ice,
      );
    } else if (res.event === "power-1up") {
      sfx.oneup();
      floatText(this.juice, this.layout.w / 2, this.layout.h * 0.4, "+1 LIFE", C.ice);
    } else {
      sfx.place();
    }
  }

  private steer(dt: number) {
    const left = this.keys.has("ArrowLeft") || this.keys.has("KeyA");
    const right = this.keys.has("ArrowRight") || this.keys.has("KeyD");
    if (left && !right && this.dasDir === -1) {
      this.dasT -= dt;
      if (this.dasT <= 0) {
        this.move(-1);
        this.dasT = DAS_REPEAT;
      }
    } else if (right && !left && this.dasDir === 1) {
      this.dasT -= dt;
      if (this.dasT <= 0) {
        this.move(1);
        this.dasT = DAS_REPEAT;
      }
    } else if (!left && !right) {
      this.dasDir = 0;
    }
    this.wasLeft = left;
    this.wasRight = right;
  }

  private loop = (t: number) => {
    this.raf = 0;
    if (!this.running || this.paused || this.ended) return;
    try {
      const dt = this.lastT ? Math.min(0.05, (t - this.lastT) / 1000) : 0;
      this.lastT = t;
      this.clock += dt;
      this.debug.frames += 1;
      this.debug.sumDt += dt;

      const fast = this.keys.has("ArrowUp") || this.keys.has("KeyW");
      this.steer(dt);
      tickJuice(this.juice, dt, this.reducedShake);
      if (this.waveBannerT > 0) {
        this.waveBannerT -= dt;
        if (this.waveBannerT <= 0) {
          this.waveBanner = null;
          this.hudDirty = true;
        }
      }
      if (this.juice.hitstop <= 0) {
        if (this.hold > 0) this.hold -= dt;
        if (this.hold <= 0) {
          const result = this.engine.tick(dt, this.paddleCol, fast ? 2.4 : 1);
          if (result.event === "caught") {
            sfx.catch();
            this.hold = 0.16;
            this.hudDirty = true;
            this.debug.catches += 1;
          } else if (result.event === "blocked") {
            sfx.deny();
            this.hold = 0.12;
            this.hudDirty = true;
          } else if (result.event === "missed") {
            sfx.miss();
            this.juice.flash = 0.16;
            addTrauma(this.juice, 0.45);
            this.hold = 0.4;
            this.hudDirty = true;
            this.debug.misses += 1;
            if (result.gameOver) {
              this.paint();
              this.finish();
              return;
            }
          } else if (result.event === "gameover") {
            this.paint();
            this.finish();
            return;
          }
        }
      }
      this.paint();
    } catch {
      /* keep going */
    }
    if (this.running && !this.paused && !this.ended) {
      this.raf = requestAnimationFrame(this.loop);
    }
  };

  private paint() {
    const st = this.engine.getState();
    const shake = shakeOffset(this.juice, this.reducedShake, this.clock);
    const dpr = this.dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, shake.x * dpr, shake.y * dpr);
    renderFrame(this.ctx, this.layout, st, this.paddleCol, this.juice, this.clock);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.hudDirty) {
      this.pushHud();
      this.hudDirty = false;
    }
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    this.paused = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    stopBed();
    const st = this.engine.getState();
    writeSave({
      highScore: Math.max(loadHigh(), st.score),
      bestWave: Math.max(loadBestWave(), st.wave),
    });
    this.onOver(st);
  }

  private pushHud() {
    const st = this.engine.getState();
    const held = st.paddle[st.paddle.length - 1] ?? null;
    const heldKind =
      held == null ? null : held.kind === "root" || held.kind === "affix" ? held.kind : "power";
    const heldPartners =
      held && (held.kind === "root" || held.kind === "affix")
        ? partnersFor(held.kind, held.marker)
        : [];
    this.onHud({
      score: st.score,
      lives: st.lives,
      combo: st.combo,
      wave: st.wave,
      matches: st.matches,
      paddleCount: st.paddle.length,
      paddleCap: st.paddleCap,
      heldLabel: held?.marker ?? null,
      heldGloss: held?.gloss ?? null,
      heldKind,
      heldPartners,
      lastPair: this.lastPair,
      waveBanner: this.waveBanner,
    });
  }
}

function loadHigh() {
  try {
    const raw = localStorage.getItem("kalq-save");
    if (!raw) return 0;
    return (JSON.parse(raw) as { highScore?: number }).highScore ?? 0;
  } catch {
    return 0;
  }
}
function loadBestWave() {
  try {
    const raw = localStorage.getItem("kalq-save");
    if (!raw) return 1;
    return (JSON.parse(raw) as { bestWave?: number }).bestWave ?? 1;
  } catch {
    return 1;
  }
}

export { unlockAudio };
