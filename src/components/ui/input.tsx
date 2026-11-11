import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const controlClassName =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:opacity-60';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClassName, 'min-h-11 sm:min-h-10', className)} {...props} />;
}
