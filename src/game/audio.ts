type Bus = { master: GainNode; sfx: GainNode };

let ctx: AudioContext | null = null;
let bus: Bus | null = null;
let muted = false;

function makeCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  try {
    ctx = new AC({ latencyHint: "interactive" });
  } catch {
    ctx = new AC();
  }
  const master = ctx.createGain();
  const sfx = ctx.createGain();
  sfx.gain.value = 0.7;
  master.gain.value = muted ? 0 : 1;
  sfx.connect(master);
  master.connect(ctx.destination);
  bus = { master, sfx };
  return ctx;
}

export function unlockAudio() {
  try {
    const c = makeCtx();
    if (c.state === "suspended") void c.resume();
  } catch {
    ctx = null;
    bus = null;
  }
}

export function setMuted(next: boolean) {
  muted = next;
  if (bus && ctx) {
    bus.master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.02);
  }
}

export function isMuted() {
  return muted;
}

function envGain(duration: number, peak: number, dest: AudioNode) {
  if (!ctx || !bus) return null;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  g.connect(dest);
  return g;
}

function tone(freq: number, duration: number, type: OscillatorType, peak: number, dest: AudioNode) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = envGain(duration, peak, dest);
    if (!g) return;
    osc.connect(g);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  } catch {
    /* AudioContext can throw on some WebViews */
  }
}

export const sfx = {
  move() {
    if (!bus) return;
    tone(440, 0.04, "square", 0.05, bus.sfx);
  },
  catch() {
    if (!bus) return;
    tone(520, 0.08, "triangle", 0.14, bus.sfx);
  },
  place() {
    if (!bus) return;
    tone(280, 0.08, "sine", 0.1, bus.sfx);
  },
  discard() {
    if (!bus) return;
    tone(180, 0.1, "sine", 0.06, bus.sfx);
  },
  miss() {
    if (!bus) return;
    tone(140, 0.16, "square", 0.1, bus.sfx);
  },
  match(combo: number) {
    if (!bus) return;
    const base = 440 * Math.pow(1.059, Math.min(combo, 8));
    tone(base, 0.16, "triangle", 0.16, bus.sfx);
  },
  power() {
    if (!bus) return;
    tone(660, 0.12, "square", 0.1, bus.sfx);
  },
  oneup() {
    if (!bus) return;
    tone(784, 0.16, "triangle", 0.12, bus.sfx);
  },
  wave() {
    if (!bus) return;
    tone(523, 0.16, "sine", 0.1, bus.sfx);
  },
  deny() {
    if (!bus) return;
    tone(160, 0.07, "square", 0.06, bus.sfx);
  },
};

export function startBed() {}
export function stopBed() {}
