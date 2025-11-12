import { useTheme } from '@/contexts/ThemeContext';

export const useThemeClasses = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    // Background colors
    bg: isDark ? 'bg-dark-bg' : 'bg-light-bg',
    card: isDark ? 'bg-dark-card' : 'bg-light-card',
    hover: isDark ? 'bg-dark-hover' : 'bg-light-hover',

    // Text colors
    textPrimary: isDark ? 'text-dark-text-primary' : 'text-light-text-primary',
    textSecondary: isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary',
    textTertiary: isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary',

    // Border colors
    border: isDark ? 'border-dark-border' : 'border-light-border',

    // Combined classes for common patterns
    cardBg: isDark ? 'bg-dark-card' : 'bg-light-card',
    cardBorder: isDark ? 'border-dark-border' : 'border-light-border',
    hoverBg: isDark ? 'hover:bg-dark-hover' : 'hover:bg-light-hover',
    hoverText: isDark ? 'hover:text-dark-text-primary' : 'hover:text-light-text-primary',
  };
};
