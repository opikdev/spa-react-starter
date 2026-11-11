import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

function imports(source: string): string[] {
  return [...source.matchAll(/(?:from|import) '([^']+)'/g)].map((match) => match[1] as string);
}

function resolve(file: string, specifier: string): string {
  if (specifier.startsWith('@/')) return `/src/${specifier.slice(2)}`;
  if (!specifier.startsWith('.')) return specifier;
  return new URL(specifier, `https://app.invalid${file}`).pathname;
}

function featureOf(path: string): string | undefined {
  return path.match(/^\/src\/features\/([^/]+)/)?.[1];
}

function violations(rule: (file: string, target: string) => boolean): string[] {
  return Object.entries(sources).flatMap(([file, source]) =>
    imports(source)
      .map((specifier) => resolve(file, specifier))
      .filter((target) => rule(file, target))
      .map((target) => `${file} -> ${target}`),
  );
}

describe('architecture', () => {
  it('finds the source files', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  it('imports another feature only through its index', () => {
    const found = violations((file, target) => {
      const feature = featureOf(target);
      if (!feature || feature === featureOf(file)) return false;
      return target !== `/src/features/${feature}` && target !== `/src/features/${feature}/index`;
    });
    expect(found).toEqual([]);
  });

  it('calls the API only from feature api modules', () => {
    const found = violations(
      (file, target) =>
        target.startsWith('/src/lib/api/client') &&
        !/^\/src\/features\/[^/]+\/api\.ts$/.test(file) &&
        !file.startsWith('/src/lib/api/'),
    );
    expect(found).toEqual([]);
  });

  it('keeps shared components and lib free of features and routes', () => {
    const found = violations(
      (file, target) =>
        (file.startsWith('/src/components/') || file.startsWith('/src/lib/')) &&
        (target.startsWith('/src/features/') || target.startsWith('/src/routes/')),
    );
    expect(found).toEqual([]);
  });

  it('keeps React Compiler away from react-hook-form components', () => {
    const missing = Object.entries(sources)
      .filter(
        ([file, source]) => file.endsWith('.tsx') && imports(source).includes('react-hook-form'),
      )
      .filter(([, source]) => !source.includes("'use no memo';"))
      .map(([file]) => file);
    expect(missing).toEqual([]);
  });

  it('keeps mocks out of the app', () => {
    const found = violations(
      (file, target) =>
        target.startsWith('/src/mocks/') &&
        !file.startsWith('/src/mocks/') &&
        file !== '/src/main.tsx',
    );
    expect(found).toEqual([]);
  });
});
