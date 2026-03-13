// Achievement definitions — static registry, no DB needed for definitions.
// Rarity determines badge color: common=dim green, uncommon=green, rare=amber, legendary=red

export type AchievementCategory = 'progression' | 'skill' | 'streak' | 'speed' | 'investigation' | 'xp';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string; // Unicode/ASCII icon for terminal display
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Progression
  { id: 'first_blood',    name: 'FIRST_BLOOD',        description: 'First threat analyzed',            category: 'progression', rarity: 'common',    icon: '◆' },
  { id: 'veteran',        name: 'VETERAN_ANALYST',     description: '10 sessions in the field',         category: 'progression', rarity: 'uncommon',  icon: '◆' },
  { id: 'graduate',       name: 'RESEARCH_GRADUATE',   description: 'Earned Expert clearance',          category: 'progression', rarity: 'uncommon',  icon: '⬡' },
  { id: 'apex',           name: 'APEX_OPERATOR',       description: 'Maximum clearance achieved',       category: 'progression', rarity: 'legendary', icon: '◆' },

  // Skill
  { id: 'perfect_round',  name: 'ZERO_MISS',           description: 'Perfect round - zero breaches',    category: 'skill', rarity: 'rare',      icon: '★' },
  { id: 'certain_correct', name: 'DEAD_CERTAIN',       description: 'High confidence, high accuracy',   category: 'skill', rarity: 'rare',      icon: '★' },
  { id: 'hard_sweep',     name: 'HARD_TARGET',         description: 'Swept a hard deck clean',          category: 'skill', rarity: 'rare',      icon: '★' },
  { id: 'expert_ace',     name: 'EXPERT_ACE',          description: 'Perfection under extreme pressure', category: 'skill', rarity: 'legendary', icon: '★' },

  // Streak
  { id: 'streak_5',       name: 'HOT_STREAK',          description: '5 correct in a row',               category: 'streak', rarity: 'common',   icon: '▶' },
  { id: 'streak_10',      name: 'UNTOUCHABLE',         description: 'Entire round without a miss',      category: 'streak', rarity: 'rare',     icon: '▶' },
  { id: 'daily_3',        name: 'DAILY_OPERATOR',      description: 'Consistent threat monitoring',     category: 'streak', rarity: 'uncommon', icon: '▶' },

  // Speed
  { id: 'speed_demon',    name: 'SPEED_DEMON',         description: 'Instant threat recognition',       category: 'speed', rarity: 'rare',     icon: '⚡' },
  { id: 'methodical',     name: 'METHODICAL',          description: 'Patient analysis pays off',        category: 'speed', rarity: 'uncommon', icon: '⊕' },

  // Investigation
  { id: 'header_hunter',  name: 'HEADER_HUNTER',       description: 'Always checks the headers',        category: 'investigation', rarity: 'common',   icon: '⊞' },
  { id: 'url_inspector',  name: 'URL_INSPECTOR',       description: 'Never trusts a hyperlink',         category: 'investigation', rarity: 'common',   icon: '⊞' },
  { id: 'full_recon',     name: 'FULL_RECON',          description: 'Full investigation protocol',      category: 'investigation', rarity: 'uncommon', icon: '⊞' },

  // XP
  { id: 'xp_1000',        name: 'KILOBYTE',            description: 'First kilobyte of intel',           category: 'xp', rarity: 'common',    icon: '◈' },
  { id: 'xp_5000',        name: 'ENCRYPTED',           description: 'Deep in the data',                 category: 'xp', rarity: 'uncommon',  icon: '◈' },
  { id: 'xp_20000',       name: 'CLASSIFIED',          description: 'Classified clearance level',       category: 'xp', rarity: 'rare',      icon: '◈' },
  { id: 'pb_2500',        name: 'HIGH_SCORE',          description: 'Elite scoring capability',          category: 'xp', rarity: 'rare',      icon: '◈' },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map(a => [a.id, a]));

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common:    '#00aa28',
  uncommon:  '#00ff41',
  rare:      '#ffaa00',
  legendary: '#ff3333',
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  progression:   'PROGRESSION',
  skill:         'SKILL',
  streak:        'STREAK',
  speed:         'SPEED',
  investigation: 'INVESTIGATION',
  xp:            'XP / RANK',
};
