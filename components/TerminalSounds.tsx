'use client';

import { useEffect } from 'react';
import { getMusicCtx, ensureUnlocked, playClick, playKeyPress } from '@/lib/sounds';

const MUSIC_SRC = '/audio/joelfazhari-synthetic-deception-loopable-epic-cyberpunk-crime-music-157454.mp3';
const MUSIC_GAIN = 0.04;
const FADE_MS = 50;

const SKIP_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'PageUp', 'PageDown', 'Home', 'End', 'Insert',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
]);

function musicWanted(): boolean {
  try { return localStorage.getItem('music_enabled') !== 'false'; } catch { return true; }
}

// ── Module-level music singleton — survives component remounts ──
interface MusicState { audio: HTMLAudioElement; gain: GainNode; source: MediaElementAudioSourceNode }
let _music: MusicState | null = null;
let _musicStarted = false;

function getMusic(): MusicState {
  if (_music) return _music;
  const ctx = getMusicCtx();
  const audio = new Audio(MUSIC_SRC);
  audio.loop = true;
  audio.crossOrigin = 'anonymous';
  const source = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(ctx.destination);
  _music = { audio, gain, source };
  return _music;
}

function fadeIn() {
  const m = getMusic();
  const ctx = getMusicCtx();
  const t = ctx.currentTime;
  m.gain.gain.cancelScheduledValues(t);
  m.gain.gain.setValueAtTime(0, t);
  m.gain.gain.linearRampToValueAtTime(MUSIC_GAIN, t + FADE_MS / 1000);
  m.audio.play().catch(() => {});
  _musicStarted = true;
}

function fadeOut() {
  if (!_music) return;
  const ctx = getMusicCtx();
  const t = ctx.currentTime;
  _music.gain.gain.cancelScheduledValues(t);
  _music.gain.gain.setValueAtTime(_music.gain.gain.value, t);
  _music.gain.gain.linearRampToValueAtTime(0, t + FADE_MS / 1000);
  _musicStarted = false;
}

export function TerminalSounds() {
  useEffect(() => {
    function handleGesture() {
      const wasRunning = ensureUnlocked();
      if (!wasRunning && musicWanted()) {
        const ctx = getMusicCtx();
        const check = () => {
          if (ctx.state === 'running') fadeIn();
          else setTimeout(check, 50);
        };
        setTimeout(check, 50);
      }
    }

    function handleMusicChange(e: Event) {
      const enabled = (e as CustomEvent<boolean>).detail;
      if (enabled) fadeIn(); else fadeOut();
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        ensureUnlocked();
        if (_musicStarted && _music?.audio.paused) {
          const ctx = getMusicCtx();
          const check = () => {
            if (ctx.state === 'running') fadeIn();
            else setTimeout(check, 50);
          };
          setTimeout(check, 50);
        }
      }
    }

    document.addEventListener('click', handleGesture, { capture: true });
    document.addEventListener('touchstart', handleGesture, { capture: true });
    window.addEventListener('music-change', handleMusicChange);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('click', handleGesture, { capture: true });
      document.removeEventListener('touchstart', handleGesture, { capture: true });
      window.removeEventListener('music-change', handleMusicChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      // Don't pause or destroy music — it's a module singleton that survives remounts
    };
  }, []);

  // ── Global SFX ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      ensureUnlocked();
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="button"]') || target.closest('a')) {
        playClick();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (SKIP_KEYS.has(e.key)) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        playKeyPress();
      }
    }

    document.addEventListener('click', handleClick, { capture: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
