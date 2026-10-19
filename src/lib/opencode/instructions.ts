import fs from 'node:fs';
import path from 'node:path';

/**
 * Starter content of the project `AGENTS.md` created by the `init` command.
 * Lives in the library so the command stays a thin wrapper around it.
 */
export const DEFAULT_AGENTS_MD = `# Project

Describe the project, its conventions and how AI assistants should work with it.
`;

export function getAgentsFilePath(targetDir: string): string {
  return path.join(targetDir, 'AGENTS.md');
}

export function hasAgentsFile(targetDir: string): boolean {
  return fs.existsSync(getAgentsFilePath(targetDir));
}

export function writeAgentsFile(targetDir: string, content: string, force = false): string {
  const filePath = getAgentsFilePath(targetDir);
  if (fs.existsSync(filePath) && !force) {
    throw new Error(`AGENTS.md already exists: ${filePath}. Use --force to overwrite.`);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Create `AGENTS.md` from the default template when the project does not have one yet.
 * An existing file is never overwritten.
 * @param targetDir Target project directory
 * @returns `true` when the file was created, `false` when it already existed
 */
export function ensureAgentsFile(targetDir: string): boolean {
  if (hasAgentsFile(targetDir)) {
    return false;
  }
  writeAgentsFile(targetDir, DEFAULT_AGENTS_MD, true);
  return true;
}
