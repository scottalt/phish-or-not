'use client';

import { useEffect } from 'react';
import { playClick, playKeyPress } from '@/lib/sounds';

const MUSIC_SRC = '/audio/joelfazhari-synthetic-deception-loopable-epic-cyberpunk-crime-music-157454.mp3';
const MUSIC_VOLUME = 0.04;

const SKIP_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'PageUp', 'PageDown', 'Home', 'End', 'Insert',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
]);

function musicWanted(): boolean {
  try { return localStorage.getItem('music_enabled') !== 'false'; } catch { return true; }
}

// ── Music: plain HTMLAudioElement, NOT routed through AudioContext ──
// This keeps music completely separate from SFX. No shared context issues.
let _audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!_audio) {
    _audio = new Audio(MUSIC_SRC);
    _audio.loop = true;
    _audio.volume = MUSIC_VOLUME;
  }
  return _audio;
}

function startMusic() {
  const a = getAudio();
  a.volume = MUSIC_VOLUME;
  a.play().catch(() => {});
}

function stopMusic() {
  if (!_audio) return;
  _audio.volume = 0;
  // Keep playing silently — some browsers need active audio to keep things alive
}

export function TerminalSounds() {
  // ── Music ──
  useEffect(() => {
    function handleGesture() {
      if (musicWanted() && _audio?.paused !== false) {
        startMusic();
      }
    }

    function handleMusicChange(e: Event) {
      const enabled = (e as CustomEvent<boolean>).detail;
      if (enabled) startMusic(); else stopMusic();
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible' && musicWanted()) {
        const a = getAudio();
        if (a.paused) a.play().catch(() => {});
        else a.volume = MUSIC_VOLUME;
      }
    }

    // Try to start music immediately (works on desktop, blocked on mobile until gesture)
    if (musicWanted()) {
      getAudio().play().catch(() => {});
    }

    document.addEventListener('click', handleGesture);
    document.addEventListener('touchstart', handleGesture);
    window.addEventListener('music-change', handleMusicChange);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('click', handleGesture);
      document.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('music-change', handleMusicChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // ── SFX: click and keypress ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
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
