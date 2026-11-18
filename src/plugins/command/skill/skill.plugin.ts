import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import {
  COMMAND_KIND_GROUP,
  type ICommandResult,
  type IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/common';

/**
 * Command group `skill`: the path prefix of the `skill/*` entities of the host.
 *
 * The group only contributes its `command` to the path of its subcommands, so the resource
 * `skill/list` and the tool `skill/add` are built from it (the CLI invokes them as
 * `skill list` and `skill add`). It carries no options of its own and has no surface of its
 * own: both engines walk a node with children as a container and never expose the group, so no
 * `skill` entry appears in `resources/list`, `tools/list` or `prompts/list` of the MCP server.
 */
@NodePlugin<IPluginCommandDefinitionData<{}>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_GROUP,
  id: 'skill',
  command: 'skill',
  label: 'Work with opencode skills',
  config: {},
})
@injectable()
export class SkillCommandPlugin extends PluginCommandBase<{}> {
  /**
   * Unreachable defensive fallback.
   *
   * `PluginCommandBase` declares the action abstract, while the engines register a handler for
   * leaf commands only: a node with children never gets a callable entity, so this method is
   * not reachable through either host. It is kept to make the group implementation explicit
   * and would only run if the core ever attached a handler to group nodes.
   * @returns Failure result naming the available subcommands
   */
  async action(): Promise<ICommandResult> {
    return { success: false, error: ['Specify a subcommand: list | add'] };
  }
}
