const KEY = "kalq-save";
const VERSION = 1;

export type SaveData = {
  version: number;
  highScore: number;
  bestWave: number;
  muted: boolean;
  reducedShake: boolean;
  seenHowTo: boolean;
};

const defaults: SaveData = {
  version: VERSION,
  highScore: 0,
  bestWave: 1,
  muted: false,
  reducedShake: false,
  seenHowTo: false,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return { ...defaults, ...parsed, version: VERSION };
  } catch {
    return { ...defaults };
  }
}

export function writeSave(patch: Partial<SaveData>) {
  try {
    const next = { ...loadSave(), ...patch, version: VERSION };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return { ...defaults, ...patch, version: VERSION };
  }
}
