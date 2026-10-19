import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import {
  COMMAND_KIND_PROMPT,
  type ICommandResult,
  type IFormatterCommandDefinitionData,
  type TFormatterData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/command';

import type { IBriefCommandConfig } from './types.js';

/**
 * Prompt `brief`: hands the model a short instruction and checklist for a goal.
 *
 * A prompt is not an action in the project, so the command declares the prompt kind and maps
 * to the prompt surface of whichever host runs it (the `brief` prompt of the MCP server, the
 * `brief` command of the CLI). It returns its instruction as `ordered-list` data instead of
 * printing it: the engine renders the text through the formatter, and that text becomes the
 * content of the prompt, so nothing is written to stdout by the command itself.
 */
@NodePlugin<IFormatterCommandDefinitionData<IBriefCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_PROMPT,
  id: 'brief',
  command: 'brief',
  label: 'Brief the model on a goal',
  formatter: 'ordered-list',
  config: {
    description: 'Send the model a short instruction and checklist for a goal',
    arguments: [{ name: 'goal', description: 'What the model should focus on', required: true }],
    options: [
      {
        name: 'depth',
        description: 'Checklist depth: brief | detailed',
        type: 'string',
        choices: ['brief', 'detailed'],
      },
    ],
  },
})
@injectable()
export class BriefCommandPlugin extends PluginCommandBase<IBriefCommandConfig> {
  /**
   * Builds the instruction and checklist as ordered-list data. The `depth` option
   * only appends the verification and risk items of the detailed checklist.
   * @param args Command arguments
   * @returns Ordered-list data with the goal, depth and checklist items
   */
  async action(args: IBriefCommandConfig): Promise<ICommandResult<TFormatterData<'ordered-list'>>> {
    if (!args.goal) {
      return { success: false, error: ['The "goal" argument is required'] };
    }

    const goal = args.goal;
    const depth = args.depth ?? 'brief';
    const items = [
      `Restate the goal in one sentence: ${goal}.`,
      'List the files and modules the goal touches.',
      'Propose an implementation plan as a numbered checklist.',
    ];

    if (depth === 'detailed') {
      items.push('For every step, name the exact file and the command that verifies it.');
      items.push('List open questions, risks and everything that stays out of scope.');
    }

    return {
      success: true,
      data: {
        title: 'Task brief',
        description: `Goal: ${goal}. Depth: ${depth}.`,
        items,
      },
    };
  }
}
