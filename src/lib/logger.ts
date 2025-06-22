import fs from 'fs/promises';
import path from 'path';

export interface LogEntry {
  id: string;
  timestamp: string;
  requestUrl: string;
  servedFile: string;
  status: 'success' | 'error';
}

const logPath = path.resolve(process.cwd(), 'requests.log.json');
const MAX_LOG_ENTRIES = 100;

async function ensureLogFile() {
  try {
    await fs.access(logPath);
  } catch {
    await fs.writeFile(logPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  await ensureLogFile();
  try {
    const fileContent = await fs.readFile(logPath, 'utf-8');
    return JSON.parse(fileContent) as LogEntry[];
  } catch (error) {
    console.error('Error reading log file:', error);
    return [];
  }
}

export async function addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
  await ensureLogFile();
  const logs = await getLogs();
  
  const newLog: LogEntry = {
    ...entry,
    id: new Date().getTime().toString(),
    timestamp: new Date().toISOString(),
  };

  const updatedLogs = [newLog, ...logs].slice(0, MAX_LOG_ENTRIES);

  await fs.writeFile(logPath, JSON.stringify(updatedLogs, null, 2), 'utf-8');
}
