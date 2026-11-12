import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'cyber-dark' | 'midnight-navy' | 'matrix-emerald' | 'obsidian-crimson' | 'clean-slate';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  bgPreview: string;
  accentPreview: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'cyber-dark',
    name: 'Cyber Dark',
    description: 'Deep slate with emerald & cyan accents',
    bgPreview: 'bg-slate-950',
    accentPreview: 'bg-emerald-400',
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    description: 'Deep sapphire navy with neon blue',
    bgPreview: 'bg-[#060b18]',
    accentPreview: 'bg-sky-400',
  },
  {
    id: 'matrix-emerald',
    name: 'Matrix Terminal',
    description: 'Pure obsidian with high-contrast matrix green',
    bgPreview: 'bg-black',
    accentPreview: 'bg-green-400',
  },
  {
    id: 'obsidian-crimson',
    name: 'Obsidian Crimson',
    description: 'Dark carbon with crimson & amber highlights',
    bgPreview: 'bg-[#0f090b]',
    accentPreview: 'bg-rose-500',
  },
  {
    id: 'clean-slate',
    name: 'Titanium Graphite',
    description: 'Neutral monochromatic institutional fintech',
    bgPreview: 'bg-[#0e1117]',
    accentPreview: 'bg-indigo-400',
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('ft_market_theme') as AppTheme;
    if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
      return saved;
    }
    return 'cyber-dark';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('ft_market_theme', newTheme);
  };

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement;
    THEME_OPTIONS.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
