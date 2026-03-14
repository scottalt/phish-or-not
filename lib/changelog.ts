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
    date: '2026-03-11',
    category: 'milestone',
    title: 'Research dataset v1 locked — platform opens to players',
    body: '1,000 AI-generated email samples finalized. Research mode, daily challenges, player accounts, XP progression, and intel analytics available from day one.',
  },

  // Platform updates (chronological — page reverses for display)
  // Only significant, player-facing changes — not every commit
  {
    date: '2026-03-11',
    category: 'update',
    title: 'Platform launch',
    body: 'Research mode, daily challenges, expert mode, player accounts with XP and leveling, interactive tutorial, and intel analytics.',
  },
  {
    date: '2026-03-12',
    category: 'update',
    title: 'Achievements and stats',
    body: '20 achievements to unlock. Personal stats dashboard with accuracy breakdown and performance history.',
  },
  {
    date: '2026-03-13',
    category: 'update',
    title: 'Navigation and desktop layouts',
    body: 'Persistent nav bar, two-column desktop layouts, daily streak bonuses, and changelog.',
  },
];
