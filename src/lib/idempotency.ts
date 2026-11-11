import { useRef } from 'react';

export function useIdempotencyKey() {
  const attempt = useRef<{ body: string; key: string } | null>(null);

  return {
    keyFor(body: unknown): string {
      const serialized = JSON.stringify(body);
      if (attempt.current?.body !== serialized) {
        attempt.current = { body: serialized, key: crypto.randomUUID() };
      }
      return attempt.current.key;
    },
    reset() {
      attempt.current = null;
    },
  };
}
