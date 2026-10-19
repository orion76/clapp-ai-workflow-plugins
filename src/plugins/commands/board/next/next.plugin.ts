import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import {
  COMMAND_KIND_RESOURCE,
  type ICommandResult,
  type IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/command';

import { nextBoard, resolveBoardDir } from '@clapp/ai-workflow-plugins';
import type { IBoardNextCommandConfig } from './types.js';

@NodePlugin<IPluginCommandDefinitionData<IBoardNextCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_RESOURCE,
  id: 'board_next',
  command: 'next',
  parent: 'board',
  label: 'Pick the next actionable task',
  config: {
    description: 'Print the next actionable task of the board',
    arguments: [{ name: 'slug', description: 'Project slug filter', required: false }],
    options: [
      { name: 'dir', description: 'Path to the task board', type: 'string', defaultValue: '~/task-board' },
      { name: 'json', description: 'Print the result as JSON', type: 'boolean' },
    ],
  },
})
@injectable()
export class BoardNextCommandPlugin extends PluginCommandBase<IBoardNextCommandConfig> {
  async action(args: IBoardNextCommandConfig): Promise<ICommandResult> {
    const result = nextBoard(resolveBoardDir(args.dir), args.slug, args.json ?? false);

    for (const warning of result.warnings ?? []) {
      console.error(warning);
    }

    // In JSON mode the envelope (`{ success, task }` / `{ success, error }`) is the requested
    // machine-readable output; the returned error below still sets the exit code.
    if (result.output) {
      process.stdout.write(result.output);
    }

    if (result.error) {
      return { success: false, error: [result.error] };
    }

    return { success: true };
  }
}
