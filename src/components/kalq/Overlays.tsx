import { CircleHelp, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { AFFIXES, ROOTS } from "@/game/puzzles";
import type { HudSnap } from "@/game/session";
import { cn } from "@/lib/utils";

const playCta =
  "inline-flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-accent text-[15px] font-medium text-accent-fg";
const secondaryCta =
  "inline-flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border border-border bg-elevated/90 text-[15px] font-medium text-fg backdrop-blur-sm";

export function Landing({
  highScore,
  bestWave,
  onPlay,
  onHowTo,
}: {
  highScore: number;
  bestWave: number;
  onPlay: () => void;
  onHowTo: () => void;
}) {
  return (
    <section
      className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-bg text-fg"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 72%, #1b222a 0%, #0c1014 68%)",
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const t = e.target as HTMLElement;
        if (t.closest("[data-howto]")) return;
        onPlay();
      }}
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-medium tracking-[0.28em] text-muted uppercase">Word arcade</p>
        <h1 className="font-display mt-3 text-[clamp(3.25rem,12vw,6.5rem)] leading-[0.9] tracking-[-0.03em]">
          KAL-Q
        </h1>
        <p className="mt-4 max-w-[22rem] text-pretty text-[15px] leading-relaxed text-muted">
          Catch rising roots and affixes. Place a pair in the same lane.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
          <button type="button" className={playCta}>
            <Play className="size-4" strokeWidth={1.75} />
            Play
          </button>
          <button
            type="button"
            data-howto="1"
            className={secondaryCta}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.pointerType === "mouse" && e.button !== 0) return;
              if (e.pointerType !== "mouse") onHowTo();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onHowTo();
            }}
          >
            How to play
          </button>
          <p className="mt-3 font-medium tabular-nums text-subtle text-sm">
            Best {highScore.toLocaleString()} · Wave {bestWave}
          </p>
          <p className="text-xs text-subtle">Tap anywhere to start</p>
        </div>
      </div>
    </section>
  );
}

export function HowToScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="absolute inset-0 z-40 flex min-h-0 flex-col overflow-y-auto bg-bg px-5 py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
        <header>
          <p className="text-xs font-medium tracking-[0.24em] text-muted uppercase">Rules</p>
          <h2 className="font-display mt-2 text-4xl tracking-[-0.03em]">How to play</h2>
        </header>
        <ol className="space-y-4 text-[15px] leading-relaxed text-muted">
          <li>
            <span className="text-fg font-medium">Catch.</span> A tile rises in one
            of four lanes. Move the paddle over that lane before it reaches the rim.
            Miss it and you lose a life.
          </li>
          <li>
            <span className="text-fg font-medium">Hold.</span> The paddle keeps up to
            four tiles. Place the top one into a stacking lane, or discard it.
          </li>
          <li>
            <span className="text-root font-medium">Root</span>
            {" + "}
            <span className="text-ok font-medium">affix</span>
            {" in the same lane make a word."}
          </li>
          <li>
            <span className="text-fg font-medium">Pills.</span> LANE clears a column,
            ALL clears the board, 1UP restores a life.
          </li>
        </ol>
        <section>
          <h3 className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Roots</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {ROOTS.map((r) => (
              <li key={r.marker} className="flex justify-between gap-3">
                <span className="text-root font-medium">{r.marker}</span>
                <span className="text-muted truncate">{r.gloss}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Affixes</h3>
          <ul className="mt-3 grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-4">
            {AFFIXES.map((a) => (
              <li key={a.marker} className="flex justify-between gap-3">
                <span className="text-ok font-medium">-{a.marker}</span>
                <span className="text-muted truncate">{a.gloss}</span>
              </li>
            ))}
          </ul>
        </section>
        <button type="button" className={cn(playCta, "mb-8")} onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}

export function PauseScreen({ onResume, onHelp }: { onResume: () => void; onHelp: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/75 px-6">
      <div className="w-full max-w-sm rounded-[28px] border border-border bg-surface p-6">
        <h2 className="font-display text-3xl tracking-[-0.03em]">Paused</h2>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className={playCta} onClick={onResume}>
            Resume
          </button>
          <button type="button" className={secondaryCta} onClick={onHelp}>
            How to play
          </button>
        </div>
      </div>
    </div>
  );
}

export function OverScreen({
  score,
  wave,
  matches,
  highScore,
  isHigh,
  onRetry,
}: {
  score: number;
  wave: number;
  matches: number;
  highScore: number;
  isHigh: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/75 px-6">
      <div className="w-full max-w-sm rounded-[28px] border border-border bg-surface p-6">
        <p className="text-xs font-medium tracking-[0.24em] text-muted uppercase">
          {isHigh ? "New best" : "Run over"}
        </p>
        <h2 className="font-display mt-2 text-3xl tracking-[-0.03em]">Game over</h2>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <dt className="text-xs text-subtle">Score</dt>
            <dd className="mt-1 text-lg font-medium tabular-nums">{score.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Wave</dt>
            <dd className="mt-1 text-lg font-medium tabular-nums">{wave}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Pairs</dt>
            <dd className="mt-1 text-lg font-medium tabular-nums">{matches}</dd>
          </div>
        </dl>
        <p className="mt-3 text-center text-xs text-subtle tabular-nums">Best {highScore.toLocaleString()}</p>
        <button type="button" className={cn(playCta, "mt-6")} onClick={onRetry}>
          Play again
        </button>
      </div>
    </div>
  );
}

export function HudBar({
  hud,
  muted,
  onMute,
  onHelp,
  onPause,
}: {
  hud: HudSnap;
  muted: boolean;
  onMute: () => void;
  onHelp: () => void;
  onPause: () => void;
}) {
  return (
    <header className="flex items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-[0.2em] text-subtle uppercase">Score</p>
        <p className="text-xl font-medium tabular-nums leading-none">{hud.score.toLocaleString()}</p>
      </div>
      {hud.heldLabel && (
        <div className="min-w-0 max-w-[34%] text-right lg:hidden">
          <p className="truncate text-sm font-medium">{hud.heldLabel}</p>
          <p className="truncate text-[11px] text-muted">{hud.heldGloss}</p>
        </div>
      )}
      <div className="flex items-center gap-3 text-sm tabular-nums text-muted">
        <span>
          Wave <span className="text-fg">{hud.wave}</span>
        </span>
        {hud.combo > 1 && <span className="text-ok">×{hud.combo}</span>}
        <span aria-label={`${hud.lives} lives`} className="flex gap-1">
          {Array.from({ length: Math.max(3, hud.lives) }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "inline-block size-2 rounded-full",
                i < hud.lives ? "bg-fg" : "bg-border-strong",
              )}
            />
          ))}
        </span>
      </div>
      <button
        type="button"
        aria-label={muted ? "Unmute" : "Mute"}
        className="flex size-11 items-center justify-center rounded-[12px] text-muted hover:text-fg"
        onClick={onMute}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      <button
        type="button"
        aria-label="How to play"
        className="flex size-11 items-center justify-center rounded-[12px] text-muted hover:text-fg"
        onClick={onHelp}
      >
        <CircleHelp className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Pause"
        className="flex size-11 items-center justify-center rounded-[12px] text-muted hover:text-fg"
        onClick={onPause}
      >
        <Pause className="size-4" />
      </button>
    </header>
  );
}

export function SidePanel({ hud }: { hud: HudSnap }) {
  const partners = hud.heldPartners ?? [];
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 py-6 pr-4 lg:flex">
      <div>
        <p className="text-[11px] font-medium tracking-[0.2em] text-subtle uppercase">Holding</p>
        {hud.heldLabel ? (
          <p className="mt-2 text-sm">
            <span className="text-fg font-medium">{hud.heldLabel}</span>
            <span className="mt-0.5 block text-muted">{hud.heldGloss}</span>
            {partners.length > 0 && (
              <span className="mt-1 block text-ok">
                {hud.heldKind === "root" ? "Takes " : "Fits "}
                {hud.heldKind === "root"
                  ? partners.map((p) => `-${p}`).join("  ")
                  : partners.join("  ")}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-2 text-sm text-subtle">Empty paddle</p>
        )}
        <p className="mt-1 text-xs tabular-nums text-subtle">
          {hud.paddleCount}/{hud.paddleCap}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-medium tracking-[0.2em] text-subtle uppercase">Last pair</p>
        {hud.lastPair ? (
          <div className="mt-2 text-sm">
            <p className="font-medium">{hud.lastPair.word ?? hud.lastPair.label}</p>
            <p className="mt-1 text-muted">{hud.lastPair.meaning ?? hud.lastPair.gloss}</p>
            {hud.lastPair.word && (
              <p className="mt-1 text-xs text-subtle">{hud.lastPair.label}</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-subtle">Place a pair in the same lane</p>
        )}
      </div>
      <div className="mt-auto text-xs leading-relaxed text-subtle">
        <p>← → move</p>
        <p>Enter / K place</p>
        <p>↓ / S discard</p>
        <p>↑ hold to rush</p>
      </div>
    </aside>
  );
}

export function WaveBanner({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center">
      <p className="font-display text-3xl tracking-[-0.03em] text-fg drop-shadow-[0_2px_12px_rgba(12,16,20,0.8)]">
        {text}
      </p>
    </div>
  );
}
