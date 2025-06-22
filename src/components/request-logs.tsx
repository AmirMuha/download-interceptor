'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { LogEntry, HttpMethod } from '@/lib/logger';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function RequestLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterMethod, setFilterMethod] = useState<HttpMethod | 'All'>('All');
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    if (filterMethod === 'All') {
      return true;
    }
    return log.method === filterMethod;
  });

  return (
    <ScrollArea className="h-[calc(100vh-22rem)] min-h-[20rem] rounded-md border">
      <div className="p-4 border-b">
        <Select onValueChange={(value: HttpMethod | 'All') => setFilterMethod(value)} defaultValue="All">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Methods</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="OPTIONS">OPTIONS</SelectItem>
            <SelectItem value="HEAD">HEAD</SelectItem>
          </SelectContent>
        </Select>
      </div>
       <TooltipProvider>
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Request URL</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow key="no-logs">
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No requests logged yet. Waiting for traffic...
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className={log.status === 'success' ? 'bg-accent text-accent-foreground' : ''}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-code text-xs">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="truncate max-w-xs md:max-w-sm">{log.requestUrl}</p>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start">
                            <p>{log.requestUrl}</p>
                        </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-muted-foreground text-xs">
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{new Date(log.timestamp).toLocaleString()}</p>
                        </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}

          </TableBody>
        </Table>
      </TooltipProvider>
    </ScrollArea>
  );
}
