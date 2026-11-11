import { useEffect, useState } from 'react';

export const themes = ['light', 'dark', 'system'] as const;
export type Theme = (typeof themes)[number];

const storageKey = 'theme';
const darkQuery = '(prefers-color-scheme: dark)';

function isTheme(value: unknown): value is Theme {
  return themes.includes(value as Theme);
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(storageKey);
    return isTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function saveTheme(theme: Theme): boolean {
  try {
    localStorage.setItem(storageKey, theme);
    return true;
  } catch {
    return false;
  }
}

function applyTheme(theme: Theme): void {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia(darkQuery).matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = matchMedia(darkQuery);
    const followSystem = () => applyTheme('system');
    media.addEventListener('change', followSystem);
    return () => media.removeEventListener('change', followSystem);
  }, [theme]);

  return [
    theme,
    (next) => {
      saveTheme(next);
      setTheme(next);
    },
  ];
}
