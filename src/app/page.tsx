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

type ActiveTab = "manual" | "ai";

export default function Home() {
  const [config, setConfig] = useState<Config>({ rules: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("manual");

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        console.error("Failed to fetch config:", response.statusText);
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

  const handleSuggestion = (rule: Omit<Rule, 'id'>) => {
    const newRule: Rule = { id: Date.now().toString(), ...rule };
    const updatedConfig = { ...config, rules: [...config.rules, newRule] };
    setConfig(updatedConfig);
    // Switch to manual tab to show the new rule added
    setActiveTab("manual");
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Replace className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Local Model Interceptor</h1>
          <p className="text-muted-foreground">Intercept download requests and serve files locally or from remote URLs.</p>
        </div>
      </header>
      
      <Alert className="mb-8 bg-card border-primary/20">
        <Info className="h-4 w-4" />
        <AlertTitle>How It Works</AlertTitle>
        <AlertDescription>
           Since you can&apos;t change URLs in your application&apos;s source code, the best way to intercept requests is to configure your system to use this tool as an HTTP proxy. This directs your application&apos;s (e.g., Ollama) network traffic through the interceptor without any code changes.
          <br/><br/>
          <strong>Set up your proxy in your terminal before running your application:</strong>
          <br/><br/>
          <strong className="text-foreground">On macOS or Linux:</strong>
          <br/>
          <code className="block mt-1 font-code bg-muted px-2 py-1 rounded text-sm overflow-x-auto">export HTTPS_PROXY=http://localhost:9002</code>
          <br/><br/>
          <strong className="text-foreground">On Windows (Command Prompt):</strong>
          <br/>
          <code className="block mt-1 font-code bg-muted px-2 py-1 rounded text-sm overflow-x-auto">set HTTPS_PROXY=http://localhost:9002</code>
          <br/><br/>
          <strong className="text-foreground">On Windows (PowerShell):</strong>
          <br/>
          <code className="block mt-1 font-code bg-muted px-2 py-1 rounded text-sm overflow-x-auto">$env:HTTPS_PROXY="http://localhost:9002"</code>
          <br/><br/>
          After setting this, run your application (e.g., <code className="font-code bg-muted px-1 py-0.5 rounded text-sm">ollama pull...</code>) in the <strong>same terminal session</strong>. Its download requests will now be processed by the rules you configure below.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Define rules to intercept and redirect download requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="ai">AI Assisted</TabsTrigger>
                </TabsList>
                <TabsContent value="manual">
                   <ConfigurationForm initialData={config} onSave={fetchConfig} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="ai">
                  <AiConfiguration onSuggestion={handleSuggestion} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Request Logs</CardTitle>
              <CardDescription>View a live feed of intercepted requests and their status.</CardDescription>
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
