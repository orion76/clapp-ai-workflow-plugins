import fs from 'node:fs';
import path from 'node:path';

export const OPENCODE_CONFIG_CANDIDATES = ['opencode.json', 'opencode.jsonc'];

export function findConfigPath(dir: string): string | undefined {
  for (const candidate of OPENCODE_CONFIG_CANDIDATES) {
    const fullPath = path.join(dir, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return undefined;
}

export function getDefaultConfigPath(dir: string): string {
  return path.join(dir, OPENCODE_CONFIG_CANDIDATES[0]);
}

/**
 * Resolve the config file of a project: the existing candidate when the project has one,
 * otherwise the default path a new config should be created at.
 * @param dir Target project directory
 * @returns Absolute path of the config file to read or create
 */
export function resolveConfigPath(dir: string): string {
  return findConfigPath(dir) ?? getDefaultConfigPath(dir);
}

export function createConfigFileIfMissing(filePath: string, content: Record<string, unknown> = {}): boolean {
  if (fs.existsSync(filePath)) {
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `${JSON.stringify({ $schema: 'https://opencode.ai/config.json', ...content }, null, 2)}\n`,
    'utf8',
  );
  return true;
}
