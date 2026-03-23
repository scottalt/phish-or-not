export interface Quest {
  id: string;
  name: string;
  description: string;
  target: number; // research answers needed
  reward: string; // what unlocks
  xpReward: number; // XP bonus on completion
  icon: string;
}

export const QUESTS: Quest[] = [
  {
    id: 'unlock_pvp',
    name: 'PROVE YOURSELF',
    description: 'Complete 10 research analyses to qualify for ranked PvP',
    target: 10,
    reward: 'PvP MODE UNLOCKED',
    xpReward: 100,
    icon: '\u2694',
  },
  {
    id: 'unlock_daily',
    name: 'RISING ANALYST',
    description: 'Complete 20 research analyses to access daily challenges',
    target: 20,
    reward: 'DAILY CHALLENGE UNLOCKED',
    xpReward: 200,
    icon: '\uD83D\uDCC5',
  },
  {
    id: 'unlock_freeplay',
    name: 'FULL CLEARANCE',
    description: 'Complete all 30 research analyses for unrestricted access',
    target: 30,
    reward: 'FREEPLAY UNLOCKED',
    xpReward: 500,
    icon: '\uD83D\uDD13',
  },
];
