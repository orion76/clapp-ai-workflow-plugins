import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import {
  COMMAND_KIND_GROUP,
  type ICommandResult,
  type IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/command';

/**
 * Command group `board`: it only groups the `list` and `next` subcommands.
 * The group carries no options of its own — the core never applies `config` of a node
 * with children, and `dir`, `slug`/`json` are declared by the subcommands.
 */
@NodePlugin<IPluginCommandDefinitionData<{}>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_GROUP,
  id: 'board',
  label: 'Work with the task board',
  config: {},
})
@injectable()
export class BoardCommandPlugin extends PluginCommandBase<{}> {
  /**
   * Unreachable defensive fallback.
   *
   * Action handlers are registered only for leaf commands (`Clapp._createCommand`),
   * while a node with children gets a plain command container without an action
   * (`Clapp.createCommands`). Commander therefore intercepts a group call without a
   * subcommand itself via `help({ error: true })` and exits with a non-zero code, so
   * this method never runs. It is kept to make the group implementation explicit and
   * would only be reached if the core ever attached a handler to group nodes.
   * @returns Failure result naming the available subcommands
   */
  async action(): Promise<ICommandResult> {
    return { success: false, error: ['Specify a subcommand: list | next'] };
  }
}
