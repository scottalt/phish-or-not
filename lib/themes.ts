export interface ThemeColors {
  primary: string;
  secondary: string;
  muted: string;
  dark: string;
  bg: string;
  bgAlt: string;
  accent: string;
  accentDim: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  subtitle: string;
  unlockLevel: number;
  unlockLabel: string;
  colors: ThemeColors;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'phosphor',
    name: 'PHOSPHOR',
    subtitle: 'Classic terminal green',
    unlockLevel: 1,
    unlockLabel: 'DEFAULT',
    colors: {
      primary: '#00ff41',
      secondary: '#33bb55',
      muted: '#1a5c2a',
      dark: '#003a0e',
      bg: '#060c06',
      bgAlt: '#020902',
      accent: '#ffaa00',
      accentDim: '#cc8800',
    },
  },
  {
    id: 'amber-crt',
    name: 'AMBER_CRT',
    subtitle: 'Vintage CRT warmth',
    unlockLevel: 7,
    unlockLabel: 'LINK_CHECKER (LVL 7)',
    colors: {
      primary: '#ffaa00',
      secondary: '#cc8800',
      muted: '#7a5a1a',
      dark: '#3d2d00',
      bg: '#0c0a04',
      bgAlt: '#080600',
      accent: '#00d4ff',
      accentDim: '#0099bb',
    },
  },
  {
    id: 'frost-bite',
    name: 'FROST_BITE',
    subtitle: 'Sub-zero recon',
    unlockLevel: 10,
    unlockLabel: 'HEADER_READER (LVL 10)',
    colors: {
      primary: '#00d4ff',
      secondary: '#339dbb',
      muted: '#1a5a7a',
      dark: '#003a52',
      bg: '#040a0c',
      bgAlt: '#020608',
      accent: '#ffaa00',
      accentDim: '#cc8800',
    },
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    subtitle: 'Stealth mode engaged',
    unlockLevel: 16,
    unlockLabel: 'THREAT_HUNTER (LVL 16)',
    colors: {
      primary: '#bf5fff',
      secondary: '#9944cc',
      muted: '#5e2a80',
      dark: '#2e0a50',
      bg: '#0a060e',
      bgAlt: '#060208',
      accent: '#00ff41',
      accentDim: '#00bb33',
    },
  },
  {
    id: 'red-team',
    name: 'RED_TEAM',
    subtitle: 'Offensive operations',
    unlockLevel: 22,
    unlockLabel: 'RED_TEAMER (LVL 22)',
    colors: {
      primary: '#ff4444',
      secondary: '#cc3333',
      muted: '#802020',
      dark: '#500a0a',
      bg: '#0e0404',
      bgAlt: '#080202',
      accent: '#00d4ff',
      accentDim: '#0099bb',
    },
  },
  {
    id: 'ghost-protocol',
    name: 'GHOST_PROTOCOL',
    subtitle: 'Zero footprint',
    unlockLevel: 28,
    unlockLabel: 'ZERO_DAY (LVL 28)',
    colors: {
      primary: '#e0e0e0',
      secondary: '#999999',
      muted: '#555555',
      dark: '#333333',
      bg: '#0a0a0a',
      bgAlt: '#050505',
      accent: '#ffaa00',
      accentDim: '#cc8800',
    },
  },
];

export function getThemeById(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isThemeUnlocked(theme: ThemeDef, playerLevel: number, graduated: boolean): boolean {
  if (theme.id === 'phosphor') return true; // default always available
  return graduated && playerLevel >= theme.unlockLevel;
}
