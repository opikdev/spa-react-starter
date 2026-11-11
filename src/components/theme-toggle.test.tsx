import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './theme-toggle';

function stubSystemTheme(initial: 'light' | 'dark') {
  const media = Object.assign(new EventTarget(), { matches: initial === 'dark' });
  vi.spyOn(window, 'matchMedia').mockReturnValue(media as unknown as MediaQueryList);
  return (next: 'light' | 'dark') => {
    media.matches = next === 'dark';
    media.dispatchEvent(new Event('change'));
  };
}

function isDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

function option(name: string): HTMLElement {
  return screen.getByRole('button', { name });
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('theme toggle', () => {
  it('follows the system theme by default, including live changes', () => {
    const setSystemTheme = stubSystemTheme('light');
    render(<ThemeToggle />);

    expect(screen.getByRole('group', { name: 'Theme' })).toBeVisible();
    expect(option('System')).toHaveAttribute('aria-pressed', 'true');
    expect(isDark()).toBe(false);

    setSystemTheme('dark');
    expect(isDark()).toBe(true);
    setSystemTheme('light');
    expect(isDark()).toBe(false);
  });

  it('applies and remembers a chosen theme, and stops following the system', async () => {
    const setSystemTheme = stubSystemTheme('light');
    render(<ThemeToggle />);
    const user = userEvent.setup();

    await user.click(option('Dark'));
    expect(isDark()).toBe(true);
    expect(option('Dark')).toHaveAttribute('aria-pressed', 'true');
    expect(option('System')).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('theme')).toBe('dark');

    setSystemTheme('dark');
    await user.click(option('Light'));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
    setSystemTheme('light');
    setSystemTheme('dark');
    expect(isDark()).toBe(false);
  });

  it('keeps the current choice when it is pressed again', async () => {
    stubSystemTheme('light');
    render(<ThemeToggle />);
    const user = userEvent.setup();

    await user.click(option('Dark'));
    await user.click(option('Dark'));

    expect(option('Dark')).toHaveAttribute('aria-pressed', 'true');
    expect(isDark()).toBe(true);
  });

  it('starts from the stored choice', () => {
    stubSystemTheme('light');
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle />);

    expect(option('Dark')).toHaveAttribute('aria-pressed', 'true');
    expect(isDark()).toBe(true);
  });

  it('ignores a stored value that is not a theme', () => {
    stubSystemTheme('dark');
    localStorage.setItem('theme', 'sepia');
    render(<ThemeToggle />);

    expect(option('System')).toHaveAttribute('aria-pressed', 'true');
    expect(isDark()).toBe(true);
  });

  it('falls back to the system theme when storage is blocked', async () => {
    stubSystemTheme('dark');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    render(<ThemeToggle />);
    const user = userEvent.setup();

    expect(option('System')).toHaveAttribute('aria-pressed', 'true');
    expect(isDark()).toBe(true);
    await user.click(option('Light'));
    expect(isDark()).toBe(false);
  });

  it('works with the keyboard alone', async () => {
    stubSystemTheme('light');
    render(<ThemeToggle />);
    const user = userEvent.setup();

    await user.tab();
    expect(option('Light')).toHaveFocus();
    await user.tab();
    expect(option('Dark')).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(option('Dark')).toHaveAttribute('aria-pressed', 'true');
    expect(isDark()).toBe(true);
  });
});
