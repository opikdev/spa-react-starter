import { type Theme, themes, useTheme } from '@/lib/theme';
import { Button } from './ui/button';

const labels: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <fieldset className="flex gap-1">
      <legend className="sr-only">Theme</legend>
      {themes.map((option) => (
        <Button
          key={option}
          variant={option === theme ? 'default' : 'ghost'}
          aria-pressed={option === theme}
          onClick={() => setTheme(option)}
        >
          {labels[option]}
        </Button>
      ))}
    </fieldset>
  );
}
