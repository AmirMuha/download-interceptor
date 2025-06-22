'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Config, Rule } from '@/lib/config';

const ruleSchema = z.object({
  id: z.string(),
  sourceUrlPrefix: z.string().url({ message: 'Please enter a valid URL prefix.' }),
  localDirectory: z.string().min(1, { message: 'Local directory path is required.' }),
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
        throw new Error('Failed to save configuration');
      }
      
      toast({
        title: 'Success!',
        description: 'Your configuration has been saved.',
      });
      onSave();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not save configuration.',
      });
    }
  };

  if (isLoading) {
    return <p>Loading configuration...</p>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg bg-background flex justify-between items-start gap-4">
              <div className="space-y-4 flex-grow">
                <FormField
                  control={form.control}
                  name={`rules.${index}.sourceUrlPrefix`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Prefix to Intercept</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/models/" {...field} className="font-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`rules.${index}.localDirectory`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Directory Path</FormLabel>
                      <FormControl>
                        <Input placeholder="/path/to/your/models" {...field} className="font-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={() => append({ id: Date.now().toString(), sourceUrlPrefix: '', localDirectory: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Configuration'}
        </Button>
      </form>
    </Form>
  );
}
