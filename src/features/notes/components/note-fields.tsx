import { type UseFormReturn, useFormState } from 'react-hook-form';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { NoteInput } from '../api';

export const noteFields = ['title', 'body'] as const;

export function NoteFields({ form }: { form: UseFormReturn<NoteInput> }) {
  'use no memo';
  const { errors } = useFormState({ control: form.control });
  return (
    <>
      <FormField label="Title" error={errors.title?.message}>
        {(props) => <Input autoComplete="off" {...props} {...form.register('title')} />}
      </FormField>
      <FormField label="Note" error={errors.body?.message}>
        {(props) => <Textarea className="min-h-48" {...props} {...form.register('body')} />}
      </FormField>
    </>
  );
}
