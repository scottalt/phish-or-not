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
    body: 'Threat Terminal research platform goes live. Players begin submitting phishing detection responses.',
  },
  {
    date: '2026-03-11',
    category: 'milestone',
    title: 'Final research dataset locked — 1,000 cards',
    body: 'The research card pool is finalized at 1,000 real-world email samples. No further changes will be made to research data.',
  },

  // Platform updates (chronological — page reverses for display)
  {
    date: '2026-03-04',
    category: 'update',
    title: 'XP system and leveling',
    body: 'Earn XP for correct answers. Level up to unlock new features and game modes.',
  },
  {
    date: '2026-03-06',
    category: 'update',
    title: 'Achievement system',
    body: '20 achievements tracking milestones like streaks, accuracy, and research contributions.',
  },
  {
    date: '2026-03-09',
    category: 'update',
    title: 'Daily challenge mode and streak XP',
    body: 'New daily challenge with a unique card set each day. Maintain streaks for bonus XP.',
  },
  {
    date: '2026-03-11',
    category: 'update',
    title: 'Server-side answer verification',
    body: 'Answers are now verified server-side to ensure research data integrity.',
  },
  {
    date: '2026-03-13',
    category: 'update',
    title: 'Persistent navigation bar and desktop layouts',
    body: 'New nav bar for signed-in users. Improved desktop layouts for stats, profile, and intel pages. Boot animation and readability improvements.',
  },
  {
    date: '2026-03-13',
    category: 'update',
    title: 'Changelog page',
    body: 'You\'re looking at it. Track research milestones and platform updates in one place.',
  },
];
