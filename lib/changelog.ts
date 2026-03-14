export type ChangelogCategory = 'milestone' | 'update';

export interface ChangelogEntry {
  date: string;
  category: ChangelogCategory;
  title: string;
  body?: string;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  // Research milestones (chronological)
  {
    date: '2026-02-28',
    category: 'milestone',
    title: 'Platform launched',
    body: 'Threat Terminal research platform goes live with initial card pool. Players begin submitting phishing detection responses.',
  },
  {
    date: '2026-03-01',
    category: 'milestone',
    title: 'Research mode opens',
    body: 'Supabase-backed research pipeline deployed. Player answers are now logged with timing, confidence, and scroll depth for analysis.',
  },
  {
    date: '2026-03-04',
    category: 'milestone',
    title: 'Dataset target scaled to 1,000 cards',
    body: 'Original 550-card target expanded to 1,000 to improve statistical power across difficulty levels and techniques.',
  },
  {
    date: '2026-03-12',
    category: 'milestone',
    title: 'Final research dataset locked — 1,000 cards',
    body: 'The research card pool is finalized at 1,000 AI-generated email samples (798 Haiku, 202 Sonnet). No further changes will be made to research data.',
  },

  // Platform updates (chronological — page reverses for display)
  {
    date: '2026-02-28',
    category: 'update',
    title: 'Initial release',
    body: 'CRT terminal design, swipe-to-answer, confidence betting, and global leaderboard.',
  },
  {
    date: '2026-03-01',
    category: 'update',
    title: 'Daily challenge mode',
    body: 'New daily challenge with a unique seeded card set each day and dedicated leaderboard.',
  },
  {
    date: '2026-03-01',
    category: 'update',
    title: 'Red flag highlighting and URL inspector',
    body: 'Phishing indicators highlighted inline on feedback. Click underlined links to reveal full URLs before acting.',
  },
  {
    date: '2026-03-01',
    category: 'update',
    title: 'Rank system and sound effects',
    body: '10 XP-based ranks from JUNIOR ANALYST to DIRECTOR. Chiptune sounds for button clicks and keypresses.',
  },
  {
    date: '2026-03-03',
    category: 'update',
    title: 'Player accounts and XP system',
    body: 'Magic link sign-in, callsign setup, XP progression, level-ups, and profile pages.',
  },
  {
    date: '2026-03-03',
    category: 'update',
    title: 'Expert mode and confidence penalty scoring',
    body: 'Extreme difficulty mode for graduated players. Wrong answers at high confidence now cost points.',
  },
  {
    date: '2026-03-06',
    category: 'update',
    title: 'CRT aesthetic overhaul',
    body: 'Deeper scanlines, phosphor glow, panel ambient light, moving scanline sweep, and iOS polish.',
  },
  {
    date: '2026-03-06',
    category: 'update',
    title: 'Background music',
    body: 'Looping synthwave track on the start screen. Toggle with the SFX button.',
  },
  {
    date: '2026-03-09',
    category: 'update',
    title: 'Interactive tutorial for new players',
    body: 'First-time research players get a guided tutorial card teaching confidence selection and answer flow.',
  },
  {
    date: '2026-03-09',
    category: 'update',
    title: 'Intel analytics page',
    body: 'Participants, bypass rates, and background breakdowns visible to graduated players.',
  },
  {
    date: '2026-03-12',
    category: 'update',
    title: 'Rebrand to Threat Terminal',
    body: 'Retro Phish becomes Threat Terminal. New branding across the entire platform.',
  },
  {
    date: '2026-03-12',
    category: 'update',
    title: 'Achievements system',
    body: '20 achievements across 6 categories — streaks, accuracy, speed, research contributions, and more.',
  },
  {
    date: '2026-03-12',
    category: 'update',
    title: 'Stats dashboard',
    body: 'Personal stats page with accuracy breakdown, game mode history, and performance trends.',
  },
  {
    date: '2026-03-13',
    category: 'update',
    title: 'Daily streak XP bonus',
    body: 'Play daily challenges on consecutive days for escalating XP bonuses.',
  },
  {
    date: '2026-03-13',
    category: 'update',
    title: 'Server-side answer verification',
    body: 'All answers verified server-side against dealt cards. Anti-cheat hardening for streaks and re-deals.',
  },
  {
    date: '2026-03-13',
    category: 'update',
    title: 'Desktop layouts and navigation bar',
    body: 'Two-column desktop layouts for stats, profile, and intel. Persistent nav bar for signed-in users. Boot animation and readability improvements.',
  },
  {
    date: '2026-03-13',
    category: 'update',
    title: 'Changelog',
    body: 'Research timeline and platform update history in one place.',
  },
];
