import { useState, useCallback, useRef } from 'react';

const STORAGE_KEY = 'sfx_enabled';

export function useSoundEnabled() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const sfxEnabledRef = useRef(soundEnabled);

  const toggleSound = useCallback(() => {
    const next = !sfxEnabledRef.current;
    sfxEnabledRef.current = next;
    setSoundEnabled(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    // Dispatch synchronously during click handler so audio.play() has user activation
    window.dispatchEvent(new CustomEvent('sfx-change', { detail: next }));
  }, []);

  return { soundEnabled, toggleSound };
}
