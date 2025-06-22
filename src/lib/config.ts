import fs from 'fs/promises';
import path from 'path';

export interface Rule {
  id: string;
  title: string;
  description?: string;
  sourceUrlPrefix: string;
  localFilePath: string;
  ignoreQueryParams?: boolean;
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
    const config = JSON.parse(fileContent) as Config;
    // Set defaults for backward compatibility
    config.rules = config.rules.map((rule, index) => ({
      ...rule,
      title: rule.title || `Untitled Rule #${index + 1}`,
      description: rule.description || '',
      ignoreQueryParams: rule.ignoreQueryParams !== undefined ? rule.ignoreQueryParams : true,
    }));
    return config;
  } catch (error) {
    console.error('Error reading config file, returning default config:', error);
    return defaultConfig;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigFile();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
