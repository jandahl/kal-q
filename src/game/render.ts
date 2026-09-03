import type { GameState, Tile, TileKind } from "./engine";
import { KIND_COLOR, type Juice } from "./juice";
import { partnersFor } from "./puzzles";
import { C } from "./palette";

const COLS = 4;
const STACK_ROWS = 5;

export type Layout = {
  w: number;
  h: number;
  stack: { x: number; y: number; w: number; h: number };
  well: { x: number; y: number; w: number; h: number };
  paddleY: number;
  colW: number;
  tileH: number;
};

export function layoutFor(w: number, h: number): Layout {
  const pad = Math.max(10, Math.min(20, w * 0.03));
  const innerW = w - pad * 2;
  const colW = innerW / COLS;
  const tileH = Math.round(Math.max(46, Math.min(60, h * 0.085)));
  const stackH = tileH * STACK_ROWS;
  const holdBand = Math.max(78, Math.min(96, tileH + 36));
  const wellTop = pad + stackH + holdBand;
  const wellH = Math.max(160, h - wellTop - pad);
  return {
    w,
    h,
    stack: { x: pad, y: pad, w: innerW, h: stackH },
    well: { x: pad, y: wellTop, w: innerW, h: wellH },
    paddleY: wellTop - 18,
    colW,
    tileH,
  };
}

function colX(layout: Layout, col: number) {
  return layout.stack.x + col * layout.colW;
}

function wellY(layout: Layout, y: number) {
  const { well } = layout;
  return well.y + well.h - y * well.h;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function tileFill(kind: TileKind) {
  return KIND_COLOR[kind];
}

function fitLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  prefer: number,
  min = 18,
) {
  let size = Math.max(min, prefer);
  ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`;
  while (size > min && ctx.measureText(text).width > maxW) {
    size -= 1;
    ctx.font = `700 ${size}px ui-sans-serif, system-ui, sans-serif`;
  }
  return size;
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tile: Pick<Tile, "marker" | "kind">,
  highlight = false,
) {
  const fill = tileFill(tile.kind);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = highlight ? "rgba(231,234,228,0.9)" : "rgba(12,16,20,0.35)";
  ctx.lineWidth = highlight ? 2.5 : 1.25;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 10);
  ctx.stroke();

  ctx.fillStyle = C.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const prefer = Math.min(36, w * 0.42, h * 0.52);
  fitLabel(ctx, tile.marker, w - 10, prefer, Math.min(16, prefer));
  ctx.fillText(tile.marker, x + w / 2, y + h / 2 + 0.5);
}

export function hitColumn(layout: Layout, px: number, py: number): number | null {
  const { stack, well } = layout;
  if (px < stack.x || px > stack.x + stack.w) return null;
  if (py < stack.y || py > well.y + well.h) return null;
  const c = Math.floor(((px - stack.x) / stack.w) * COLS);
  return Math.max(0, Math.min(COLS - 1, c));
}

export function cellCenter(layout: Layout, col: number, row: number, stackCap: number) {
  const tileH = layout.stack.h / stackCap;
  return {
    x: colX(layout, col) + layout.colW / 2,
    y: layout.stack.y + row * tileH + tileH / 2,
  };
}

function hinted(hints: GameState["hints"], col: number, row: number) {
  return hints.some((h) => h.col === col && h.row === row);
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  state: GameState,
  paddleCol: number,
  juice: Juice,
  clock: number,
) {
  const { w, h, stack, well, colW, tileH } = layout;
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);

  roundRect(ctx, well.x, well.y, well.w, well.h, 12);
  ctx.fillStyle = C.well;
  ctx.fill();

  for (let c = 0; c < COLS; c++) {
    const x = colX(layout, c);
    if (c === paddleCol) {
      ctx.fillStyle = "rgba(197,208,216,0.14)";
      ctx.fillRect(x, well.y, colW, well.h);
    }
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, well.y);
    ctx.lineTo(x + 0.5, well.y + well.h);
    ctx.stroke();
    ctx.fillStyle = "rgba(231,234,228,0.35)";
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(String(c + 1), x + colW / 2, well.y + well.h - 16);
  }
  ctx.strokeStyle = C.lineStrong;
  ctx.lineWidth = 2;
  roundRect(ctx, well.x + 1, well.y + 1, well.w - 2, well.h - 2, 12);
  ctx.stroke();

  ctx.strokeStyle = "rgba(197,208,216,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(well.x, well.y + 1);
  ctx.lineTo(well.x + well.w, well.y + 1);
  ctx.stroke();

  const inset = 5;
  for (let c = 0; c < COLS; c++) {
    const x = colX(layout, c);
    roundRect(ctx, x + 3, stack.y, colW - 6, stack.h, 8);
    ctx.fillStyle =
      c === paddleCol ? "rgba(197,208,216,0.1)" : "rgba(231,234,228,0.03)";
    ctx.fill();
    const lane = state.stacks[c] ?? [];
    const rowH = stack.h / state.stackCap;
    for (let i = 0; i < lane.length; i++) {
      const tile = lane[i]!;
      const isHint = hinted(state.hints, c, i);
      drawTile(
        ctx,
        x + inset,
        stack.y + i * rowH + 3,
        colW - inset * 2,
        rowH - 6,
        tile,
        isHint,
      );
    }
  }

  if (juice.ghost) {
    for (const cell of juice.ghost.cells) {
      const x = colX(layout, cell.col);
      const rowH = stack.h / state.stackCap;
      drawTile(ctx, x + inset, stack.y + cell.row * rowH + 3, colW - inset * 2, rowH - 6, cell);
    }
  }

  const paddleW = colW - 8;
  const paddleH = 16;
  const paddleX = colX(layout, paddleCol) + 4;
  const paddleY = layout.paddleY;
  roundRect(ctx, paddleX, paddleY, paddleW, paddleH, 5);
  ctx.fillStyle = state.paddle.length >= state.paddleCap ? C.wrong : C.paddle;
  ctx.fill();

  if (state.paddle.length) {
    const held = state.paddle[state.paddle.length - 1]!;
    const hh = Math.max(50, Math.min(tileH, 62));
    drawTile(ctx, paddleX, paddleY - hh - 6, paddleW, hh, held, true);
    if (held.kind === "root" || held.kind === "affix") {
      const partners = partnersFor(held.kind, held.marker);
      const names = held.kind === "root" ? partners.map((p) => `-${p}`) : partners;
      const label =
        names.length > 3
          ? `${names.slice(0, 2).join("  ")}  +${names.length - 2}`
          : names.join("  ");
      ctx.font = "650 14px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = C.ok;
      ctx.fillText(label, paddleX + paddleW / 2, paddleY - hh - 8);
    }
    if (state.paddle.length > 1) {
      for (let i = 0; i < state.paddle.length - 1; i++) {
        ctx.fillStyle = tileFill(state.paddle[i]!.kind);
        ctx.beginPath();
        ctx.arc(paddleX + 10 + i * 12, paddleY + paddleH + 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (state.active) {
    const tw = colW - 8;
    const th = Math.max(52, Math.min(64, tileH + 4));
    const tx = colX(layout, state.active.col) + 4;
    const ty = wellY(layout, state.active.y) - th;
    drawTile(ctx, tx, ty, tw, th, state.active);
    ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const gloss = state.active.gloss;
    const gw = Math.min(colW - 4, ctx.measureText(gloss).width + 14);
    const gx = tx + tw / 2 - gw / 2;
    const gy = ty + th + 6;
    roundRect(ctx, gx, gy, gw, 22, 7);
    ctx.fillStyle = "rgba(12,16,20,0.8)";
    ctx.fill();
    ctx.fillStyle = C.fg;
    ctx.fillText(gloss, tx + tw / 2, gy + 11);
  }

  for (const p of juice.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const f of juice.floaters) {
    const a = Math.min(1, f.life / 0.25) * Math.min(1, f.life / f.max + 0.2);
    ctx.globalAlpha = a;
    ctx.fillStyle = f.color;
    ctx.font = "700 22px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(f.text, f.x, f.y);
    if (f.sub) {
      ctx.font = "600 15px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = C.fg;
      ctx.fillText(f.sub, f.x, f.y + 20);
    }
  }
  ctx.globalAlpha = 1;

  if (juice.flash > 0) {
    ctx.fillStyle = `rgba(192,112,106,${(juice.flash * 2).toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }

  void clock;
}
