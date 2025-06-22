'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { analyzeLogFile } from '@/actions/analyze-log';
import { Wand2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Rule } from '@/lib/config';
import { Switch } from './ui/switch';

interface AiConfigurationProps {
  onSuggestion: (suggestion: Omit<Rule, 'id'>) => void;
}

export function AiConfiguration({ onSuggestion }: AiConfigurationProps) {
  const [logContent, setLogContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedRule, setSuggestedRule] = useState<Omit<Rule, 'id'> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (!logContent) {
      toast({
        variant: 'destructive',
        title: 'No log content',
        description: 'Please upload or paste a log file content.',
      });
      return;
    }

    setIsLoading(true);
    setSuggestedRule(null);

    try {
      const result = await analyzeLogFile(logContent);
      if (result.suggestedRule && !result.suggestedRule.startsWith('No suggestion')) {
        setSuggestedRule({
          sourceUrlPrefix: result.suggestedRule,
          localFilePath: '/path/to/your/model.gguf', // Default placeholder
          ignoreQueryParams: true,
        });
        toast({
          title: 'Suggestion Ready!',
          description: 'AI has generated a rule suggestion.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Analysis Complete',
          description: result.suggestedRule,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'An error occurred while analyzing the log file.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddRule = () => {
    if (suggestedRule) {
      onSuggestion(suggestedRule);
      toast({
        title: 'Rule Added',
        description: 'The suggested rule has been added to the form. Please review and save.',
      });
      setSuggestedRule(null); // Clear suggestion after adding
    }
  };


  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="log-file">Upload Log File</Label>
        <Input id="log-file" type="file" ref={fileInputRef} onChange={handleFileChange} />
      </div>
      
      <Button onClick={handleAnalyze} disabled={isLoading || !logContent} className="w-full">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        Analyze Log
      </Button>

      {suggestedRule && (
        <Card className="mt-4 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Suggested Rule</CardTitle>
            <CardDescription>AI analysis result. Edit before adding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <Label>URL Prefix</Label>
                <Input value={suggestedRule.sourceUrlPrefix} onChange={(e) => setSuggestedRule({...suggestedRule, sourceUrlPrefix: e.target.value})} className="font-code"/>
             </div>
             <div>
                <Label>Local Path or Remote URL</Label>
                <Input value={suggestedRule.localFilePath} onChange={(e) => setSuggestedRule({...suggestedRule, localFilePath: e.target.value})} className="font-code" placeholder="/path/to/model.gguf OR https://..." />
             </div>
             <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                <div>
                  <Label>Ignore Query Params</Label>
                  <p className="text-xs text-muted-foreground">Recommended for signed URLs.</p>
                </div>
                <Switch
                  checked={suggestedRule.ignoreQueryParams}
                  onCheckedChange={(checked) => setSuggestedRule({...suggestedRule, ignoreQueryParams: checked})}
                />
              </div>
            <Button onClick={handleAddRule} className="w-full">Add Rule to Configuration</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
