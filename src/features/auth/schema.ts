import { z } from 'zod/mini';

export const credentialsSchema = z.object({
  email: z
    .email('Enter an email address, like name@example.com.')
    .check(z.maxLength(254, 'Use an email address of 254 characters or fewer.')),
  password: z
    .string()
    .check(
      z.minLength(12, 'Use at least 12 characters.'),
      z.maxLength(128, 'Use 128 characters or fewer.'),
    ),
});

export const loginSchema = z.object({
  email: credentialsSchema.shape.email,
  password: z.string().check(z.minLength(1, 'Enter your password.')),
});
