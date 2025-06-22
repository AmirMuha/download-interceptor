'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Config } from '@/lib/config';
import { RuleFormItem } from './rule-form-item';

const ruleSchema = z.object({
  id: z.string(),
  sourceUrlPrefix: z.string().url({ message: 'Please enter a valid URL prefix.' }),
  localFilePath: z.string().min(1, { message: 'Local path or URL is required.' }),
  ignoreQueryParams: z.boolean().default(true),
});

const configSchema = z.object({
  rules: z.array(ruleSchema),
});

interface ConfigurationFormProps {
  initialData: Config;
  onSave: () => void;
  isLoading: boolean;
}

export function ConfigurationForm({ initialData, onSave, isLoading }: ConfigurationFormProps) {
  const { toast } = useToast();

  const form = useForm<Config>({
    resolver: zodResolver(configSchema),
    values: initialData,
    resetOptions: {
      keepDirtyValues: true,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rules',
  });
  
  React.useEffect(() => {
    form.reset(initialData);
  }, [initialData, form]);

  const onSubmit = async (data: Config) => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save configuration');
      }
      
      toast({
        title: 'Success!',
        description: 'Your configuration has been saved.',
      });
      form.reset(data); // Resets form to new state, clearing "dirty" status
      onSave();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not save configuration.';
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: errorMessage,
      });
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center pt-8 h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="ml-2">Loading configuration...</p>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="space-y-4 max-h-[28rem] min-h-[10rem] overflow-y-auto pr-2 -mr-2">
          {fields.length > 0 ? (
            fields.map((field, index) => (
              <RuleFormItem 
                key={field.id}
                form={form}
                index={index}
                fieldId={field.id}
                remove={remove}
              />
            ))
          ) : (
             <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-lg flex flex-col items-center justify-center h-full">
                <p>No rules configured.</p>
                <p className="text-sm">Click "Add Rule" to begin.</p>
             </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => append({ id: Date.now().toString(), sourceUrlPrefix: '', localFilePath: '', ignoreQueryParams: true })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
