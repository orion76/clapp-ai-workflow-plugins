import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import {
  COMMAND_KIND_RESOURCE,
  type ICommandResult,
  type IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/command';

import { listBoard, resolveBoardDir } from '@clapp/ai-workflow-plugins';
import type { IBoardListCommandConfig } from './types.js';

@NodePlugin<IPluginCommandDefinitionData<IBoardListCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_RESOURCE,
  id: 'board_list',
  command: 'list',
  parent: 'board',
  label: 'List the board overview',
  config: {
    description: 'Print the task board INDEX.md',
    options: [{ name: 'dir', description: 'Path to the task board', type: 'string', defaultValue: '~/task-board' }],
  },
})
@injectable()
export class BoardListCommandPlugin extends PluginCommandBase<IBoardListCommandConfig> {
  async action(args: IBoardListCommandConfig): Promise<ICommandResult> {
    const boardDir = resolveBoardDir(args.dir);
    const result = listBoard(boardDir);

    for (const warning of result.warnings ?? []) {
      console.error(warning);
    }

    if (result.output) {
      process.stdout.write(result.output);
    }

    if (result.error) {
      return { success: false, error: [result.error] };
    }

    return { success: true };
  }
}
