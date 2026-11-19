import path from 'node:path';

import { NodePlugin } from '@orion76/node-plugin';
import { injectable } from 'inversify';

import {
  COMMAND_KIND_TOOL,
  IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
  type ICommandResult,
} from '@clapp/common';

import { buildInitResultData, initProject } from '@clapp/ai-workflow-plugins';
import type { IInitCommandConfig, IInitData } from './types.js';

@NodePlugin<IPluginCommandDefinitionData<IInitCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_TOOL,
  id: 'init',
  command: 'init',
  label: 'Initialize opencode artifacts in a project',
  dataSchema: 'init',
  config: {
    description: 'Initialize opencode artifacts (skills, commands, agents, config, AGENTS.md)',
    options: [{ name: 'dir', description: 'Target project directory', type: 'string' }],
  },
})
@injectable()
export class InitCommandPlugin extends PluginCommandBase<IInitCommandConfig> {
  /**
   * Scaffolds the opencode artifacts and returns them as key-value data.
   * @param args Command arguments
   * @returns Data with a title and the artifact paths
   */
  async action(args: IInitCommandConfig): Promise<ICommandResult<IInitData>> {
    const targetDir = path.resolve(args.dir ?? process.cwd());

    return { success: true, data: buildInitResultData(initProject(targetDir)) };
  }
}
