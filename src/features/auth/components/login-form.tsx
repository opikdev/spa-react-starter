import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/form-field';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/api/problem';
import { setServerFieldErrors } from '@/lib/form';
import type { Credentials } from '../api';
import { useLogIn } from '../hooks';
import { loginSchema } from '../schema';

const fields = ['email', 'password'] as const;

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  'use no memo';
  const logIn = useLogIn();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<Credentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((credentials) => {
    setFormError(null);
    logIn.mutate(credentials, {
      onSuccess,
      onError: (error) => {
        if (!setServerFieldErrors(error, fields, form.setError)) setFormError(errorMessage(error));
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
      <FormField label="Password" error={errors.password?.message}>
        {(props) => (
          <Input
            type="password"
            autoComplete="current-password"
            {...props}
            {...form.register('password')}
          />
        )}
      </FormField>
      <Button type="submit" disabled={logIn.isPending} className="w-full">
        {logIn.isPending ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}
