// Saving lives in the browser's localStorage (on this phone, in this browser).
// Every call is wrapped in try/catch because storage can be blocked (private mode, cleared data).

const RUN_KEY = 'hauntedwood.run';
const BEST_KEY = 'hauntedwood.bestWave';

/** A run is saved each time a wave is cleared. `wave` is the NEXT wave to play. */
export interface RunSave {
  v: 1;
  wave: number;
  kills: number;
  hp: number;
  upgrades: string[]; // filled in once upgrades exist
}

export function loadRun(): RunSave | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || d.v !== 1 || !Number.isFinite(d.wave) || d.wave < 1) return null;
    return {
      v: 1,
      wave: Math.floor(d.wave),
      kills: Number(d.kills) || 0,
      hp: Number(d.hp) || 1,
      upgrades: Array.isArray(d.upgrades) ? d.upgrades.map(String) : [],
    };
  } catch {
    return null;
  }
}

export function saveRun(run: RunSave): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(run));
  } catch {
    // Ignore: the game still works, it just cannot remember.
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    // Ignore.
  }
}

export function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Stores the wave if it beats the old best. Returns the (possibly new) best. */
export function recordBest(wave: number): number {
  const best = Math.max(loadBest(), wave);
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // Ignore.
  }
  return best;
}
