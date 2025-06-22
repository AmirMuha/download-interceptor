"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Replace } from 'lucide-react';
import { ConfigurationForm } from '@/components/configuration-form';
import { AiConfiguration } from '@/components/ai-configuration';
import { RequestLogs } from '@/components/request-logs';
import type { Config, Rule } from '@/lib/config';

export default function Home() {
  const [config, setConfig] = useState<Config>({ rules: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Replace className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Local Model Interceptor</h1>
          <p className="text-muted-foreground">Intercept download requests and serve files locally.</p>
        </div>
      </header>
      
      <Alert className="mb-8 bg-card border-primary/20">
        <Info className="h-4 w-4" />
        <AlertTitle>How It Works</AlertTitle>
        <AlertDescription>
          This tool serves local files for specific URL patterns. To intercept requests from an application (like Ollama), you must configure that application or your system to redirect traffic for the target URLs to this server. A common method is editing your system's <code className="font-code bg-muted px-1 py-0.5 rounded text-sm">hosts</code> file to point a domain to <code className="font-code bg-muted px-1 py-0.5 rounded text-sm">127.0.0.1</code>.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Manage interception rules.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manual">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="ai">AI Assisted</TabsTrigger>
                </TabsList>
                <TabsContent value="manual">
                   <ConfigurationForm initialData={config} onSave={fetchConfig} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="ai">
                  <AiConfiguration onSuggestion={(rule) => {
                    const newRule: Rule = { id: Date.now().toString(), ...rule };
                    const updatedConfig = { ...config, rules: [...config.rules, newRule] };
                    setConfig(updatedConfig);
                    // Switch to manual tab to show the new rule added
                    // This requires controlling the Tabs component state, for now user can switch manually
                  }} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Request Logs</CardTitle>
              <CardDescription>Live feed of intercepted requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestLogs />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
