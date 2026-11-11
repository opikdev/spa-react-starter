const base = 'https://app.invalid';

export function isInternalPath(value: string): boolean {
  return value.startsWith('/') && new URL(value, base).origin === base;
}
