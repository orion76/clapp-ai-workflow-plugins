import fs from 'node:fs';

import type { IKeyValueData } from '@clapp/common';

import { getAgentsDir } from './agents.js';
import { createConfigFileIfMissing, resolveConfigPath } from './config.js';
import { getCommandsDir } from './commands.js';
import { ensureAgentsFile, getAgentsFilePath } from './instructions.js';
import { getSkillsDir } from './skills.js';

/** Artifacts created or found by the `init` command in a project. */
export interface IInitResult {
  targetDir: string;
  configPath: string;
  configCreated: boolean;
  skillsDir: string;
  commandsDir: string;
  agentsDir: string;
  agentsFilePath: string;
  agentsFileCreated: boolean;
}

/**
 * Scaffold the opencode artifacts of a project: the skills/commands/agents directories,
 * an `opencode.json` config and an `AGENTS.md` file. Existing artifacts are kept.
 * @param targetDir Target project directory (created when missing)
 * @returns Descriptions of the artifacts that were created or found
 */
export function initProject(targetDir: string): IInitResult {
  fs.mkdirSync(targetDir, { recursive: true });

  const skillsDir = getSkillsDir(targetDir);
  const commandsDir = getCommandsDir(targetDir);
  const agentsDir = getAgentsDir(targetDir);
  for (const dir of [skillsDir, commandsDir, agentsDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const configPath = resolveConfigPath(targetDir);
  const configCreated = createConfigFileIfMissing(configPath);

  const agentsFileCreated = ensureAgentsFile(targetDir);

  return {
    targetDir,
    configPath,
    configCreated,
    skillsDir,
    commandsDir,
    agentsDir,
    agentsFilePath: getAgentsFilePath(targetDir),
    agentsFileCreated,
  };
}

/**
 * Build the key-value data of an init run. Pure: performs no output.
 * @param result Result of {@link initProject}
 * @returns Data of the `init` command: the title and the artifact pairs, both always set
 */
export function buildInitResultData(result: IInitResult): Required<Pick<IKeyValueData, 'title' | 'pairs'>> {
  const state = (created: boolean): string => (created ? 'created' : 'existing');

  return {
    title: `Initialized opencode artifacts in ${result.targetDir}`,
    pairs: [
      { key: 'config', value: `${result.configPath} (${state(result.configCreated)})` },
      { key: 'skills', value: result.skillsDir },
      { key: 'commands', value: result.commandsDir },
      { key: 'agents', value: result.agentsDir },
      { key: 'file', value: `${result.agentsFilePath} (${state(result.agentsFileCreated)})` },
    ],
  };
}
