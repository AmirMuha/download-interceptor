'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Config, Rule } from '@/lib/config';
import { Switch } from './ui/switch';

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
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

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
            <div key={field.id} className="p-4 border rounded-lg bg-card space-y-4">
              <div className="flex justify-between items-start gap-4">
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
                    name={`rules.${index}.localFilePath`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>Local Path or Remote URL</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl>
                                <Input placeholder="e.g., my-model.gguf" {...formField} className="font-code flex-1" />
                            </FormControl>
                            <input
                                type="file"
                                className="hidden"
                                ref={(el) => {
                                fileInputRefs.current[field.id] = el;
                                }}
                                onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    form.setValue(`rules.${index}.localFilePath`, e.target.files[0].name);
                                }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRefs.current[field.id]?.click()}
                            >
                                Browse
                            </Button>
                        </div>
                        <FormDescription>
                            Provide a file name (must be in project root), an absolute server path, or a remote URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FormField
                control={form.control}
                name={`rules.${index}.ignoreQueryParams`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background p-3 shadow-sm">
                    <div>
                      <FormLabel className="font-normal">Ignore Query Params</FormLabel>
                       <p className="text-xs text-muted-foreground">
                        Match URL regardless of query parameters (e.g. `?X-Amz-..`).
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Button type="button" variant="outline" onClick={() => append({ id: Date.now().toString(), sourceUrlPrefix: '', localFilePath: '', ignoreQueryParams: true })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Save Configuration'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
