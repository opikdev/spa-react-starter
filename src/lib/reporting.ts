export function reportError(error: unknown, context: Record<string, string> = {}): void {
  console.error(error, context);
}
