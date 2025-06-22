'use client';

import React from 'react';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import type { Config } from '@/lib/config';

interface RuleFormItemProps {
  form: UseFormReturn<Config>;
  index: number;
  fieldId: string;
  remove: UseFieldArrayReturn<Config, 'rules'>['remove'];
}

export function RuleFormItem({ form, index, remove }: RuleFormItemProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="relative rounded-lg border bg-card p-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => remove(index)}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove Rule</span>
      </Button>
      <div className="space-y-4 pr-8">
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local Path or Remote URL</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="e.g., my-model.gguf, or https://..." {...field} className="font-code flex-1" />
                </FormControl>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      form.setValue(`rules.${index}.localFilePath`, e.target.files[0].name, { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse
                </Button>
              </div>
              <FormDescription>
                Provide a file name (must be in project root), a server path, or a remote URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`rules.${index}.ignoreQueryParams`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="font-normal">Ignore Query Params</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Match URL regardless of query parameters (e.g. `?X-Amz-..`). Recommended.
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
    </div>
  );
}
