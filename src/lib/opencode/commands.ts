import path from 'node:path';

export function getCommandsDir(targetDir: string): string {
  return path.join(targetDir, '.opencode', 'commands');
}
