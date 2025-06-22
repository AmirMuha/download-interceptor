'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { analyzeLogFile } from '@/actions/analyze-log';
import { Wand2, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { Rule } from '@/lib/config';
import { Switch } from './ui/switch';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface AiConfigurationProps {
  onSuggestion: (suggestion: Omit<Rule, 'id'>) => void;
}

export function AiConfiguration({ onSuggestion }: AiConfigurationProps) {
  const [logContent, setLogContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedRule, setSuggestedRule] = useState<Omit<Rule, 'id'> | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogContent(e.target?.result as string);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (!logContent) {
      toast({
        variant: 'destructive',
        title: 'No log content',
        description: 'Please upload a log file to analyze.',
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
          localFilePath: 'your-model.gguf', // Default placeholder
          ignoreQueryParams: true,
        });
        toast({
          title: 'Suggestion Ready!',
          description: 'An AI-generated rule is ready for your review.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Analysis Complete',
          description: result.suggestedRule,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errorMessage,
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
        description: 'The suggestion has been added to the Manual tab. Review and save your changes.',
      });
      setSuggestedRule(null);
      setLogContent('');
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  return (
    <div className="space-y-4 pt-4">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Analyze Logs for Suggestions</AlertTitle>
        <AlertDescription>
          Upload a log file from your application (e.g., Ollama logs) that contains model download URLs. The AI will attempt to create a rule for you.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="log-file">Upload Log File</Label>
        <Input id="log-file" type="file" ref={fileInputRef} onChange={handleFileChange} accept=".log,.txt" />
        {fileName && <p className="text-sm text-muted-foreground">Loaded: {fileName}</p>}
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
        <Card className="mt-4 bg-primary/5 border-primary/20 animate-in fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Suggested Rule</CardTitle>
            <CardDescription>Review and modify the AI suggestion below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <Label>URL Prefix</Label>
                <Input value={suggestedRule.sourceUrlPrefix} onChange={(e) => setSuggestedRule(prev => prev ? {...prev, sourceUrlPrefix: e.target.value} : null)} className="font-code"/>
             </div>
             <div>
                <Label>Local Path or Remote URL</Label>
                <Input value={suggestedRule.localFilePath} onChange={(e) => setSuggestedRule(prev => prev ? {...prev, localFilePath: e.target.value} : null)} className="font-code" placeholder="File name, server path, or remote URL" />
             </div>
             <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                <div className="space-y-0.5">
                  <Label>Ignore Query Params</Label>
                  <p className="text-xs text-muted-foreground">Recommended for signed URLs.</p>
                </div>
                <Switch
                  checked={!!suggestedRule.ignoreQueryParams}
                  onCheckedChange={(checked) => setSuggestedRule(prev => prev ? {...prev, ignoreQueryParams: checked} : null)}
                />
              </div>
            <Button onClick={handleAddRule} className="w-full">Add Rule to Configuration</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
