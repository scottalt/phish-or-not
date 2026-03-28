'use client';

import { useTheme } from '@/lib/ThemeContext';
import { getThemeById } from '@/lib/themes';

/**
 * Renders a player name with the rainbow effect if their theme has nameEffect='rainbow'.
 * For the current player, reads from ThemeContext.
 * For other players, pass themeId directly.
 */
export function RainbowName({
  name,
  themeId,
  className = '',
  fallbackColor,
}: {
  name: string;
  themeId?: string;
  className?: string;
  fallbackColor?: string;
}) {
  const { theme: currentTheme } = useTheme();

  // Use provided themeId, or fall back to current player's theme
  const resolvedTheme = themeId ? getThemeById(themeId) : currentTheme;
  const isRainbow = resolvedTheme.nameEffect === 'rainbow';

  if (isRainbow) {
    return (
      <span className={`rainbow-name-glow ${className}`}>
        <span className="rainbow-name">{name}</span>
      </span>
    );
  }

  return (
    <span className={className} style={fallbackColor ? { color: fallbackColor } : undefined}>
      {name}
    </span>
  );
}
