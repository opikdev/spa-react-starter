import { z } from 'zod/mini';

export const noteSchema = z.object({
  title: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, 'Give the note a title.'),
      z.maxLength(200, 'Use 200 characters or fewer.'),
    ),
  body: z.string().check(z.maxLength(10_000, 'Use 10,000 characters or fewer.')),
});
