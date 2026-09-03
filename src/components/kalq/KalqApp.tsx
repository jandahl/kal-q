import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  HowToScreen,
  HudBar,
  Landing,
  OverScreen,
  PauseScreen,
  SidePanel,
  WaveBanner,
} from "./Overlays";
import { TouchControls } from "./TouchControls";
import { Session, type HudSnap, type Phase, unlockAudio } from "@/game/session";
import { isMuted, setMuted } from "@/game/audio";
import { loadSave, writeSave, type SaveData } from "@/game/save";

const GAME_CODES = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "KeyK",
  "KeyX",
  "Space",
  "Enter",
  "Escape",
  "KeyP",
]);

const emptyHud: HudSnap = {
  score: 0,
  lives: 3,
  combo: 0,
  wave: 1,
  matches: 0,
  paddleCount: 0,
  paddleCap: 4,
  heldLabel: null,
  heldGloss: null,
  heldKind: null,
  heldPartners: [],
  lastPair: null,
  waveBanner: null,
};

function loadSaveFallback(): SaveData {
  return {
    version: 1,
    highScore: 0,
    bestWave: 1,
    muted: false,
    reducedShake: false,
    seenHowTo: false,
  };
}

export function KalqApp({ autoStart = false }: { autoStart?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const genRef = useRef(0);
  const [phase, setPhase] = useState<Phase>(autoStart ? "playing" : "title");
  const [hud, setHud] = useState<HudSnap>(emptyHud);
  const [save, setSave] = useState<SaveData>(loadSaveFallback);
  const [over, setOver] = useState<{ score: number; wave: number; matches: number } | null>(null);
  const reduced =
    save.reducedShake ||
    (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const tearDown = useCallback(() => {
    sessionRef.current?.destroy();
    sessionRef.current = null;
  }, []);

  const bootSession = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;
    tearDown();
    const myGen = ++genRef.current;
    try {
      unlockAudio();
    } catch {
      /* */
    }
    const session = new Session(canvas, {
      reducedShake: reduced,
      onHud: (snap) => {
        if (myGen !== genRef.current) return;
        setHud(snap);
      },
      onOver: (st) => {
        if (myGen !== genRef.current) return;
        setOver({ score: st.score, wave: st.wave, matches: st.matches });
        setSave((prev) =>
          writeSave({
            highScore: Math.max(prev.highScore, st.score),
            bestWave: Math.max(prev.bestWave, st.wave),
          }),
        );
        setPhase("over");
      },
    });
    sessionRef.current = session;
    if (typeof window !== "undefined") {
      (window as unknown as { __kalq?: Session }).__kalq = session;
    }
    setHud(emptyHud);
    setOver(null);
    setMuted(save.muted);
    session.start();
    return true;
  }, [reduced, save.muted, tearDown]);

  const play = useCallback(() => {
    try {
      unlockAudio();
    } catch {
      /* */
    }
    setSave(writeSave({ seenHowTo: true }));
    setPhase("playing");
  }, []);

  useEffect(() => {
    const loaded = loadSave();
    setSave(loaded);
    setMuted(loaded.muted);
  }, []);

  useLayoutEffect(() => {
    if (phase !== "playing" && phase !== "paused" && phase !== "over") {
      if (phase === "title") tearDown();
      return;
    }
    if (phase === "playing" && !sessionRef.current) {
      if (bootSession()) return;
      let frames = 0;
      let id = 0;
      const retry = () => {
        if (sessionRef.current) return;
        if (bootSession() || frames++ > 30) return;
        id = requestAnimationFrame(retry);
      };
      id = requestAnimationFrame(retry);
      return () => cancelAnimationFrame(id);
    }
  }, [phase, bootSession, tearDown]);

  useEffect(() => () => tearDown(), [tearDown]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!GAME_CODES.has(e.code)) return;
      if (phase === "title") {
        if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          play();
        }
        return;
      }
      if (phase === "howTo") {
        if (e.code === "Escape" || e.code === "Enter") {
          if (sessionRef.current) {
            sessionRef.current.resume();
            setPhase("playing");
          } else setPhase("title");
        }
        return;
      }
      if (phase === "over") {
        if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          tearDown();
          setOver(null);
          setPhase("playing");
        }
        return;
      }
      const s = sessionRef.current;
      if (!s) return;
      e.preventDefault();
      if (e.code === "Escape" || e.code === "KeyP") {
        if (phase === "paused") {
          s.resume();
          setPhase("playing");
        } else if (phase === "playing") {
          s.pause();
          setPhase("paused");
        }
        return;
      }
      if (phase !== "playing") return;
      s.keyDown(e.code);
      if (e.repeat) return;
      if (e.code === "Enter" || e.code === "KeyK" || e.code === "KeyX" || e.code === "Space") s.place();
      if (e.code === "ArrowDown" || e.code === "KeyS") s.discard();
    };
    const onUp = (e: KeyboardEvent) => {
      sessionRef.current?.keyUp(e.code);
    };
    const onBlur = () => sessionRef.current?.clearKeys();
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [phase, play, tearDown]);

  const inGame = phase === "playing" || phase === "paused" || phase === "over";
  const isHigh = (over?.score ?? hud.score) >= save.highScore && (over?.score ?? hud.score) > 0;

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg touch-manipulation">
      {inGame && (
        <HudBar
          hud={hud}
          muted={save.muted}
          onMute={() => {
            const next = !isMuted();
            setMuted(next);
            setSave(writeSave({ muted: next }));
          }}
          onHelp={() => {
            sessionRef.current?.pause();
            setPhase("howTo");
          }}
          onPause={() => {
            if (phase !== "playing") return;
            sessionRef.current?.pause();
            setPhase("paused");
          }}
        />
      )}

      <div className="flex min-h-0 flex-1">
        {inGame && <SidePanel hud={hud} />}
        <div className="relative min-w-0 flex-1">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none"
            onPointerDown={(e) => {
              if (phase !== "playing") return;
              sessionRef.current?.tapColumn(e.clientX, e.clientY);
            }}
          />
          {inGame && <WaveBanner text={hud.waveBanner} />}
        </div>
      </div>

      {phase === "playing" && (
        <TouchControls
          onLeft={() => sessionRef.current?.move(-1)}
          onRight={() => sessionRef.current?.move(1)}
          onPlace={() => sessionRef.current?.place()}
          onDiscard={() => sessionRef.current?.discard()}
          onRushStart={() => sessionRef.current?.keyDown("ArrowUp")}
          onRushEnd={() => sessionRef.current?.keyUp("ArrowUp")}
          canPlace={hud.paddleCount > 0}
        />
      )}

      {phase === "title" && (
        <Landing
          highScore={save.highScore}
          bestWave={save.bestWave}
          onPlay={play}
          onHowTo={() => setPhase("howTo")}
        />
      )}
      {phase === "paused" && (
        <PauseScreen
          onResume={() => {
            sessionRef.current?.resume();
            setPhase("playing");
          }}
          onHelp={() => setPhase("howTo")}
        />
      )}
      {phase === "howTo" && (
        <HowToScreen
          onBack={() => {
            if (sessionRef.current) {
              sessionRef.current.resume();
              setPhase("playing");
            } else setPhase("title");
          }}
        />
      )}
      {phase === "over" && (
        <OverScreen
          score={over?.score ?? hud.score}
          wave={over?.wave ?? hud.wave}
          matches={over?.matches ?? hud.matches}
          highScore={Math.max(save.highScore, over?.score ?? hud.score)}
          isHigh={isHigh}
          onRetry={() => {
            tearDown();
            setOver(null);
            setPhase("playing");
          }}
        />
      )}
    </main>
  );
}