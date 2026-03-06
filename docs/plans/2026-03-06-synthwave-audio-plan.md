# Synthwave Audio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing ambient drone with a dark cyberpunk/synthwave synthesizer and add looping gameplay background music using Tone.js.

**Architecture:** Two Tone.js classes — `AmbientDrone` (rewrites `lib/drone.ts`, StartScreen only) and `GameMusic` (new `lib/gameMusic.ts`, plays during gameplay phases). Both classes expose a minimal API identical in shape to the existing drone so minimal wiring changes are needed. `Game.tsx` adds a `gameMusicRef` and a `useEffect` reacting to `phase` and `soundEnabled`.

**Tech Stack:** Tone.js (npm), Web Audio API (browser-only, both files are only imported by `'use client'` components so no SSR issues), TypeScript, Next.js App Router.

---

### Context for the implementer

The project is a retro CRT terminal phishing quiz game. The aesthetic is dark cyberpunk/synthwave — cold, mechanical, pulsing. Target sound: Deus Ex / Tron Legacy OST. Minor key progression: Am → F → C → Em.

**Existing audio files:**
- `lib/sounds.ts` — one-shot UI sounds (click, correct, wrong, streak). Do NOT touch.
- `lib/drone.ts` — `AmbientDrone` class, current implementation uses raw Web Audio API. Full rewrite in Task 2.
- `lib/useSoundEnabled.ts` — hook that reads/writes `sfx_enabled` from localStorage.

**Components that use audio:**
- `components/StartScreen.tsx:60-68` — creates `AmbientDrone`, starts/stops on `soundEnabled` change.
- `components/StartScreen.tsx:111-112` — stops drone on play click.
- `components/Game.tsx:74` — reads `soundEnabled`. No ambient music today — add in Task 4.

---

### Task 1: Install Tone.js

**Files:**
- Modify: `package.json` (via npm)

**Step 1: Install the package**

```bash
npm install tone
```

**Step 2: Verify install**

```bash
npx tsc --noEmit
```

Expected: no errors (Tone.js ships its own types).

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tone.js for synthwave audio synthesis"
```

---

### Task 2: Rewrite lib/drone.ts with Tone.js

**Files:**
- Modify: `lib/drone.ts` (full rewrite)

The public API must remain identical: `class AmbientDrone { start(); stop(fade?: boolean); }`. StartScreen.tsx needs no changes.

**Step 1: Replace the entire file contents**

Write `lib/drone.ts` with this exact content:

```ts
/**
 * Ambient terminal drone — Tone.js synthesizer.
 * Dark synthwave pad: FM synth chord layers + bass root + reverb + delay.
 * Chord progression: Am → F → C → Em, one chord every 16 seconds.
 * No audio files — all synthesized.
 */
import * as Tone from 'tone';

const CHORD_NOTES = [
  ['A3', 'C4', 'E4'], // Am
  ['F3', 'A3', 'C4'], // F
  ['C3', 'E3', 'G3'], // C
  ['E3', 'G3', 'B3'], // Em
];

const BASS_NOTES = ['A2', 'F2', 'C2', 'E2'];

// In-key blip notes per chord
const BLIP_NOTES = [
  ['A4', 'C5', 'E5', 'A5'], // Am
  ['F4', 'A4', 'C5', 'F5'], // F
  ['C4', 'E4', 'G4', 'C5'], // C
  ['E4', 'G4', 'B4', 'E5'], // Em
];

const CHORD_DURATION_MS = 16_000;

export class AmbientDrone {
  private padSynth: Tone.PolySynth | null = null;
  private bassSynth: Tone.Synth | null = null;
  private master: Tone.Gain | null = null;
  private reverb: Tone.Reverb | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private blipTimer: ReturnType<typeof setTimeout> | null = null;
  private chordTimer: ReturnType<typeof setTimeout> | null = null;
  private chordIndex = 0;
  private active = false;

  start() {
    if (this.active) return;
    this.active = true;
    try {
      Tone.start();

      this.master = new Tone.Gain(0).toDestination();
      this.reverb = new Tone.Reverb({ decay: 6, preDelay: 0.2, wet: 0.5 });
      this.delay = new Tone.FeedbackDelay('3n', 0.2);

      this.reverb.connect(this.master);
      this.delay.connect(this.reverb);

      // FM pad — cold, metallic
      this.padSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        volume: -14,
        envelope: { attack: 4, decay: 1, sustain: 0.8, release: 8 },
        modulation: { type: 'sine' as const },
        modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 4 },
      });
      this.padSynth.connect(this.delay);

      // Sub bass — sine, very quiet
      this.bassSynth = new Tone.Synth({
        oscillator: { type: 'sine' as const },
        envelope: { attack: 2, decay: 0, sustain: 1, release: 4 },
        volume: -22,
      });
      this.bassSynth.connect(this.master);

      // Fade in over 2.5s
      this.master.gain.rampTo(0.7, 2.5);

      this.playChord();
      this.scheduleBlip();
    } catch {
      // Web Audio unavailable
    }
  }

  private playChord() {
    if (!this.active || !this.padSynth || !this.bassSynth) return;

    const notes = CHORD_NOTES[this.chordIndex];
    const bass = BASS_NOTES[this.chordIndex];

    // Brief silence between chords for clean crossfade
    this.padSynth.releaseAll();
    try { this.bassSynth.triggerRelease(); } catch { /* ignore if not started */ }

    setTimeout(() => {
      if (!this.active || !this.padSynth || !this.bassSynth) return;
      this.padSynth.triggerAttack(notes);
      this.bassSynth.triggerAttack(bass);
    }, 300);

    this.chordTimer = setTimeout(() => {
      this.chordIndex = (this.chordIndex + 1) % CHORD_NOTES.length;
      this.playChord();
    }, CHORD_DURATION_MS);
  }

  private scheduleBlip() {
    if (!this.active) return;
    this.blipTimer = setTimeout(() => {
      this.fireBlip();
      this.scheduleBlip();
    }, 3000 + Math.random() * 7000);
  }

  private fireBlip() {
    if (!this.active || !this.master) return;
    try {
      const notes = BLIP_NOTES[this.chordIndex];
      const note = notes[Math.floor(Math.random() * notes.length)];
      const blip = new Tone.Synth({
        oscillator: { type: 'square' as const },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
        volume: -30,
      }).connect(this.master);
      blip.triggerAttackRelease(note, '32n');
      setTimeout(() => blip.dispose(), 500);
    } catch { /* ignore */ }
  }

  stop(fade = false) {
    this.active = false;
    if (this.blipTimer) { clearTimeout(this.blipTimer); this.blipTimer = null; }
    if (this.chordTimer) { clearTimeout(this.chordTimer); this.chordTimer = null; }

    const doDispose = () => {
      try { this.padSynth?.releaseAll(); } catch { /* ignore */ }
      try { this.bassSynth?.triggerRelease(); } catch { /* ignore */ }
      setTimeout(() => {
        this.padSynth?.dispose(); this.padSynth = null;
        this.bassSynth?.dispose(); this.bassSynth = null;
        this.reverb?.dispose(); this.reverb = null;
        this.delay?.dispose(); this.delay = null;
        this.master?.dispose(); this.master = null;
      }, 500);
    };

    if (fade && this.master) {
      this.master.gain.rampTo(0, 1.5);
      setTimeout(doDispose, 1600);
    } else {
      doDispose();
    }
  }
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Smoke test manually**

```bash
npm run dev
```

Open http://localhost:3000, enable SFX, wait for boot sequence — you should hear a dark FM pad chord that slowly evolves every 16 seconds. Occasional blips. No raw buzz/sine drone.

**Step 4: Commit**

```bash
git add lib/drone.ts
git commit -m "feat: rewrite ambient drone with Tone.js FM synth and chord progression"
```

---

### Task 3: Create lib/gameMusic.ts

**Files:**
- Create: `lib/gameMusic.ts`

**Step 1: Create the file**

```ts
/**
 * Gameplay background music — Tone.js synthwave synthesizer.
 * Dark arpeggio + bass + kick over Am → F → C → Em at 120 BPM.
 * No audio files — all synthesized.
 */
import * as Tone from 'tone';

const BPM = 120;

// 16th-note arp patterns per chord, each chord is 1 bar (16 sixteenth notes)
// Pattern repeats 4× per bar to fill the bar
const ARP_CHORD_TONES: Record<string, string[]> = {
  Am: ['A3', 'C4', 'E4', 'A4'],
  F:  ['F3', 'A3', 'C4', 'F4'],
  C:  ['C3', 'E3', 'G3', 'C4'],
  Em: ['E3', 'G3', 'B3', 'E4'],
};

const PROGRESSION = ['Am', 'F', 'C', 'Em'];
const BASS_NOTES: Record<string, string> = { Am: 'A2', F: 'F2', C: 'C2', Em: 'E2' };

const DIFFICULTY_CUTOFF: Record<string, number> = {
  easy:    400,
  medium:  800,
  hard:   1600,
  extreme: 3200,
};

export class GameMusic {
  private arpSynth: Tone.Synth | null = null;
  private bassSynth: Tone.Synth | null = null;
  private kick: Tone.MembraneSynth | null = null;
  private filter: Tone.Filter | null = null;
  private arpGain: Tone.Gain | null = null;
  private reverb: Tone.Reverb | null = null;
  private master: Tone.Gain | null = null;
  private arpSeq: Tone.Sequence | null = null;
  private bassSeq: Tone.Sequence | null = null;
  private kickSeq: Tone.Sequence | null = null;
  private started = false;

  start() {
    if (this.started) return;
    this.started = true;
    try {
      Tone.start();
      Tone.getTransport().bpm.value = BPM;

      // Signal chain: arpGain → filter → reverb → master → destination
      //               bassSynth → filter
      //               kick → master
      this.master = new Tone.Gain(0).toDestination();
      this.reverb = new Tone.Reverb({ decay: 2, wet: 0.25 });
      this.filter = new Tone.Filter(800, 'lowpass');
      this.arpGain = new Tone.Gain(1);

      this.reverb.connect(this.master);
      this.filter.connect(this.reverb);
      this.arpGain.connect(this.filter);

      // Sawtooth arp — classic synthwave
      this.arpSynth = new Tone.Synth({
        oscillator: { type: 'sawtooth' as const },
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.25, release: 0.15 },
        volume: -20,
      });
      this.arpSynth.connect(this.arpGain);

      // Triangle bass
      this.bassSynth = new Tone.Synth({
        oscillator: { type: 'triangle' as const },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.4 },
        volume: -16,
      });
      this.bassSynth.connect(this.filter);

      // Kick — synthesized membrane
      this.kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
        volume: -12,
      });
      this.kick.connect(this.master);

      // Build flat 64-step arp note array (4 chords × 4 repeats × 4 notes = 64 sixteenth notes)
      const arpNotes: string[] = [];
      for (const chord of PROGRESSION) {
        const tones = ARP_CHORD_TONES[chord];
        for (let repeat = 0; repeat < 4; repeat++) {
          arpNotes.push(...tones);
        }
      }

      this.arpSeq = new Tone.Sequence(
        (time, note) => {
          this.arpSynth?.triggerAttackRelease(note as string, '16n', time);
        },
        arpNotes,
        '16n',
      );

      // Bass: root on beat 1 and 3 of each bar (8th-note grid, hit on steps 0 and 4)
      // 4 chords × 8 eighth-note steps = 32 steps
      const bassPattern: (string | null)[] = [];
      for (const chord of PROGRESSION) {
        const note = BASS_NOTES[chord];
        bassPattern.push(note, null, null, null, note, null, null, null);
      }

      this.bassSeq = new Tone.Sequence(
        (time, note) => {
          if (note) this.bassSynth?.triggerAttackRelease(note as string, '8n', time);
        },
        bassPattern,
        '8n',
      );

      // Kick: beats 1 and 3 per bar, half-time feel (8th-note grid)
      // 4 bars × 8 steps each = 32 steps
      const kickPattern: number[] = [];
      for (let bar = 0; bar < 4; bar++) {
        kickPattern.push(1, 0, 0, 0, 1, 0, 0, 0);
      }

      this.kickSeq = new Tone.Sequence(
        (time, hit) => {
          if (hit) this.kick?.triggerAttackRelease('C1', '8n', time);
        },
        kickPattern,
        '8n',
      );

      this.arpSeq.start(0);
      this.bassSeq.start(0);
      this.kickSeq.start(0);
      Tone.getTransport().start();

      // Fade in over 1s
      this.master.gain.rampTo(1, 1);
    } catch {
      // Web Audio unavailable
    }
  }

  /** Call when a new card is shown. Adjusts filter to difficulty. */
  setDifficulty(difficulty: string | null) {
    const cutoff = DIFFICULTY_CUTOFF[difficulty ?? 'medium'] ?? 800;
    this.filter?.frequency.rampTo(cutoff, 0.5);
  }

  /** Call on phase transitions within a round. */
  setPhase(phase: 'playing' | 'feedback') {
    if (phase === 'feedback') {
      // Muffle: close filter, silence arp
      this.filter?.frequency.rampTo(200, 0.3);
      this.arpGain?.gain.rampTo(0, 0.3);
    } else {
      // Re-open arp; caller must also call setDifficulty to restore cutoff
      this.arpGain?.gain.rampTo(1, 0.3);
    }
  }

  /** Sync to SFX toggle. Transport keeps running; only master gain changes. */
  setEnabled(enabled: boolean) {
    if (!this.master) return;
    this.master.gain.rampTo(enabled ? 1 : 0, 0.3);
  }

  /** Fade out and tear down. Safe to call multiple times. */
  stop() {
    if (!this.started) return;
    this.started = false;

    this.master?.gain.rampTo(0, 2);

    setTimeout(() => {
      try { Tone.getTransport().stop(); } catch { /* ignore */ }
      this.arpSeq?.dispose(); this.arpSeq = null;
      this.bassSeq?.dispose(); this.bassSeq = null;
      this.kickSeq?.dispose(); this.kickSeq = null;
      this.arpSynth?.dispose(); this.arpSynth = null;
      this.bassSynth?.dispose(); this.bassSynth = null;
      this.kick?.dispose(); this.kick = null;
      this.arpGain?.dispose(); this.arpGain = null;
      this.filter?.dispose(); this.filter = null;
      this.reverb?.dispose(); this.reverb = null;
      this.master?.dispose(); this.master = null;
    }, 2200);
  }
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add lib/gameMusic.ts
git commit -m "feat: add GameMusic class — synthwave arp, bass, kick via Tone.js"
```

---

### Task 4: Wire GameMusic into Game.tsx

**Files:**
- Modify: `components/Game.tsx`

**Step 1: Add import at the top of Game.tsx** (after existing imports, around line 45)

```ts
import { GameMusic } from '@/lib/gameMusic';
```

**Step 2: Add ref inside the `Game` function** (after the existing `hasAutoStarted` ref, around line 82)

```ts
const gameMusicRef = useRef<GameMusic | null>(null);
```

**Step 3: Add a useEffect to manage music lifecycle**

Add this effect inside the `Game` function, after the existing auto-start effect (around line 90):

```ts
useEffect(() => {
  // No music in preview mode or when SFX is off and music hasn't started
  if (previewMode) return;

  if (phase === 'playing') {
    if (!gameMusicRef.current) {
      if (!soundEnabled) return; // don't start if SFX is off
      const music = new GameMusic();
      gameMusicRef.current = music;
      music.start();
    }
    const currentCard = deck[currentIndex];
    gameMusicRef.current.setDifficulty(currentCard?.difficulty ?? null);
    gameMusicRef.current.setPhase('playing');
  } else if (phase === 'feedback') {
    gameMusicRef.current?.setPhase('feedback');
  } else if (phase === 'summary' || phase === 'start' || phase === 'daily_complete') {
    gameMusicRef.current?.stop();
    gameMusicRef.current = null;
  }
}, [phase, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 4: Add a useEffect to sync SFX toggle with music**

Add this effect immediately after the previous one:

```ts
useEffect(() => {
  gameMusicRef.current?.setEnabled(soundEnabled);
}, [soundEnabled]);
```

**Step 5: Add cleanup on unmount** (add a return to an existing useEffect, or add a dedicated one)

Add this effect inside `Game`:

```ts
useEffect(() => {
  return () => {
    gameMusicRef.current?.stop();
    gameMusicRef.current = null;
  };
}, []);
```

**Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 7: Manual smoke test**

```bash
npm run dev
```

1. Enable SFX on StartScreen — hear new FM pad chord drone.
2. Click Play (any mode) — drone fades out, after loading music fades in (arp + bass + kick).
3. Answer a card — hear answer SFX *over* the music. On feedback screen, arp goes quiet, bass/kick continue softly, filter closes.
4. Click Continue — arp reopens, filter moves to difficulty cutoff of next card.
5. Complete round — music fades out on summary screen.
6. Toggle SFX off mid-round — music fades to silence. Toggle back on — music resumes.

**Step 8: Commit**

```bash
git add components/Game.tsx
git commit -m "feat: wire GameMusic into Game.tsx for in-round synthwave audio"
```

---

### Task 5: Build check and deploy

**Step 1: Production build**

```bash
npm run build
```

Expected: clean build, no errors or warnings about Tone.js.

If you see a warning about `Tone` importing a non-existent browser API during SSR, add `'use client'` guard: Tone.js should be fine since it's only imported from `'use client'` components, but if the build complains, wrap the import in a dynamic import:

```ts
// If needed — only if build fails
const { GameMusic } = await import('@/lib/gameMusic');
```

**Step 2: Commit and push**

```bash
git push
```

Expected: Vercel deployment triggered, retro-phish.scottaltiparmak.com updated within ~2 minutes.

**Step 3: Final manual test on production URL**

Verify drone, gameplay music, and SFX toggle all work on the live site.
