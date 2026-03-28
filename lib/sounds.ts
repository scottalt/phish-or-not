// Shared AudioContext for all sounds
let _ctx: AudioContext | null = null;

export function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

export const getMusicCtx = getCtx;
export const ensureUnlocked = () => { getCtx(); };

export function isSfxEnabled(): boolean {
  try { return localStorage.getItem('sfx_enabled') !== 'false'; } catch { return true; }
}

export function playClick() {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getCtx(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.035);
  } catch {}
}

export function playKeyPress() {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getCtx(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.02);
  } catch {}
}

function createNote(ctx: AudioContext, freq: number, startTime: number, duration: number, volume = 0.12) {
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'square'; osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime); osc.stop(startTime + duration);
}

export function playCorrect() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 523, t, 0.08); createNote(ctx, 784, t + 0.09, 0.14); } catch {} }
export function playWrong() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 220, t, 0.08); createNote(ctx, 165, t + 0.09, 0.14); } catch {} }
export function playBootTick() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); createNote(ctx, 480, ctx.currentTime, 0.04, 0.07); } catch {} }
export function playStreak() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 523, t, 0.08); createNote(ctx, 659, t + 0.09, 0.08); createNote(ctx, 784, t + 0.18, 0.18); } catch {} }
export function playCommit() { if (!isSfxEnabled()) return; try { createNote(getCtx(), 1200, getCtx().currentTime, 0.03, 0.10); } catch {} }
export function playLevelUp() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 523, t, 0.10, 0.12); createNote(ctx, 659, t + 0.10, 0.10, 0.12); createNote(ctx, 784, t + 0.20, 0.10, 0.12); createNote(ctx, 1047, t + 0.30, 0.25, 0.15); } catch {} }
export function playAchievement() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 784, t, 0.06, 0.10); createNote(ctx, 1047, t + 0.07, 0.06, 0.10); createNote(ctx, 784, t + 0.20, 0.08, 0.12); createNote(ctx, 1047, t + 0.27, 0.15, 0.14); } catch {} }
export function playMatchFound() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 440, t, 0.12, 0.14); createNote(ctx, 660, t + 0.13, 0.12, 0.14); createNote(ctx, 880, t + 0.26, 0.20, 0.16); } catch {} }
export function playCountdownBeep() { if (!isSfxEnabled()) return; try { createNote(getCtx(), 440, getCtx().currentTime, 0.08, 0.10); } catch {} }
export function playCountdownGo() { if (!isSfxEnabled()) return; try { createNote(getCtx(), 880, getCtx().currentTime, 0.15, 0.15); } catch {} }
export function playVictory() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 523, t, 0.08, 0.12); createNote(ctx, 659, t + 0.09, 0.08, 0.12); createNote(ctx, 784, t + 0.18, 0.08, 0.12); createNote(ctx, 1047, t + 0.27, 0.30, 0.15); } catch {} }
export function playDefeat() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 330, t, 0.15, 0.10); createNote(ctx, 262, t + 0.16, 0.25, 0.10); } catch {} }
export function playOpponentDown() { if (!isSfxEnabled()) return; try { const ctx = getCtx(); const t = ctx.currentTime; createNote(ctx, 660, t, 0.05, 0.08); createNote(ctx, 880, t + 0.06, 0.10, 0.10); } catch {} }
