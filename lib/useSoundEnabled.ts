import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'sfx_enabled';

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    // Default to false if never set
    return val === 'true';
  } catch { return false; }
}

export function useSoundEnabled() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const sfxEnabledRef = useRef(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const initial = readInitial();
    sfxEnabledRef.current = initial;
    setSoundEnabled(initial);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !sfxEnabledRef.current;
    sfxEnabledRef.current = next;
    setSoundEnabled(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
    window.dispatchEvent(new CustomEvent('sfx-change', { detail: next }));
  }, []);

  return { soundEnabled, toggleSound };
}
