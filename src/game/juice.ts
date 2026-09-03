import type { MatchCell, TileKind } from "./engine";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
};

export type Floater = {
  x: number;
  y: number;
  text: string;
  sub?: string;
  life: number;
  max: number;
  color: string;
};

export type ClearGhost = {
  cells: MatchCell[];
  kind: "match" | "power-lane" | "power-screen";
  life: number;
  max: number;
};

export type Juice = {
  trauma: number;
  hitstop: number;
  particles: Particle[];
  floaters: Floater[];
  ghost: ClearGhost | null;
  flash: number;
};

export function createJuice(): Juice {
  return {
    trauma: 0,
    hitstop: 0,
    particles: [],
    floaters: [],
    ghost: null,
    flash: 0,
  };
}

export function addTrauma(j: Juice, amount: number) {
  j.trauma = Math.min(1, j.trauma + amount);
}

export function hitstop(j: Juice, seconds: number) {
  j.hitstop = Math.max(j.hitstop, seconds);
}

export function burst(
  j: Juice,
  x: number,
  y: number,
  color: string,
  count = 8,
  speed = 180,
) {
  const room = Math.max(0, 24 - j.particles.length);
  const n = Math.min(count, room);
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / Math.max(1, n) + Math.random() * 0.4;
    const s = speed * (0.4 + Math.random() * 0.8);
    j.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 40,
      life: 0.35 + Math.random() * 0.2,
      max: 0.55,
      size: 2 + Math.random() * 2,
      color,
    });
  }
}

export function floatText(
  j: Juice,
  x: number,
  y: number,
  text: string,
  color: string,
  sub?: string,
) {
  j.floaters.push({ x, y, text, sub, life: 1.15, max: 1.15, color });
}

export function setGhost(j: Juice, cells: MatchCell[], kind: ClearGhost["kind"]) {
  j.ghost = { cells, kind, life: 0.7, max: 0.7 };
}

export function tickJuice(j: Juice, dt: number, reduced: boolean) {
  if (j.hitstop > 0) {
    j.hitstop = Math.max(0, j.hitstop - dt);
  }
  const decay = reduced ? 8 : 3.2;
  j.trauma = Math.max(0, j.trauma - decay * dt);
  if (j.flash > 0) j.flash = Math.max(0, j.flash - dt);
  if (j.ghost) {
    j.ghost.life -= dt;
    if (j.ghost.life <= 0) j.ghost = null;
  }
  for (let i = j.particles.length - 1; i >= 0; i--) {
    const p = j.particles[i]!;
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 420 * dt;
    if (p.life <= 0) j.particles.splice(i, 1);
  }
  for (let i = j.floaters.length - 1; i >= 0; i--) {
    const f = j.floaters[i]!;
    f.life -= dt;
    f.y -= 36 * dt;
    if (f.life <= 0) j.floaters.splice(i, 1);
  }
}

export function shakeOffset(j: Juice, reduced: boolean, t: number) {
  if (reduced || j.trauma <= 0) return { x: 0, y: 0 };
  const mag = j.trauma * j.trauma * 10;
  return {
    x: Math.sin(t * 47.1) * mag,
    y: Math.cos(t * 41.3) * mag * 0.7,
  };
}

export const KIND_COLOR: Record<TileKind, string> = {
  root: "#c4a882",
  affix: "#6eaba8",
  "power-lane": "#c5d0d8",
  "power-screen": "#e7eae4",
  "power-1up": "#8aabc0",
};
