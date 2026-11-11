import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/form-field';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage, isProblem, problemTypes } from '@/lib/api/problem';
import { setServerFieldErrors } from '@/lib/form';
import type { Credentials } from '../api';
import { useRegister } from '../hooks';
import { credentialsSchema } from '../schema';

const fields = ['email', 'password'] as const;

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  'use no memo';
  const registration = useRegister();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((credentials) => {
    setFormError(null);
    registration.mutate(credentials, {
      onSuccess,
      onError: (error) => {
        if (isProblem(error, problemTypes.emailTaken)) {
          form.setError('email', { message: errorMessage(error) }, { shouldFocus: true });
        } else if (!setServerFieldErrors(error, fields, form.setError)) {
          setFormError(errorMessage(error));
        }
      },
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && <Alert variant="destructive">{formError}</Alert>}
      <FormField label="Email" error={errors.email?.message}>
        {(props) => (
          <Input type="email" autoComplete="email" {...props} {...form.register('email')} />
        )}
      </FormField>
      <FormField
        label="Password"
        hint="12 to 128 characters. A short phrase is easy to remember."
        error={errors.password?.message}
      >
        {(props) => (
          <Input
            type="password"
            autoComplete="new-password"
            {...props}
            {...form.register('password')}
          />
        )}
      </FormField>
      <Button type="submit" disabled={registration.isPending} className="w-full">
        {registration.isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
