import path from 'node:path';

export function getAgentsDir(targetDir: string): string {
  return path.join(targetDir, '.opencode', 'agents');
}
