import fs from 'fs/promises';
import path from 'path';

export interface Rule {
  id: string;
  sourceUrlPrefix: string;
  localFilePath: string;
}

export interface Config {
  rules: Rule[];
}

const configPath = path.resolve(process.cwd(), 'config.json');

const defaultConfig: Config = {
  rules: [],
};

async function ensureConfigFile() {
  try {
    await fs.access(configPath);
  } catch {
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }
}

export async function getConfig(): Promise<Config> {
  await ensureConfigFile();
  try {
    const fileContent = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(fileContent) as Config;
  } catch (error) {
    console.error('Error reading config file, returning default config:', error);
    return defaultConfig;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigFile();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
