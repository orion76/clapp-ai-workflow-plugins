import path from 'node:path';

import { NodePlugin } from '@orion76/node-plugin';
import { injectable } from 'inversify';

import { resolveSkillScope, writeSkill } from '@clapp/ai-workflow-plugins';
import {
  COMMAND_KIND_TOOL,
  IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
  type ICommandResult,
  type TFormatterData
} from '@clapp/common';

import type { ISkillAddCommandConfig } from './types.js';

/**
 * Tool `skill/add`: creates an opencode skill on disk.
 *
 * The command has side effects, so it maps to the MCP Tools surface under the path
 * `skill/add` and is invoked as `skill add` by the CLI (the former `skill-add` command). It
 * returns its data instead of printing it: the `key-value` formatter renders the created skill
 * (name, scope and path) and the core prints that text — to stdout of the CLI, as the content
 * of the MCP tool result. A rejected write — an invalid name or description, an existing skill
 * without `force` — is returned as a failed result, so the surface answers with the error and
 * the server keeps its stdout for the protocol stream.
 */
@NodePlugin<IPluginCommandDefinitionData<ISkillAddCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_TOOL,
  id: 'skill_add',
  command: 'add',
  parent: 'skill',
  label: 'Create a new opencode skill',
  formatter: 'key-value',
  config: {
    description: 'Create a new opencode skill (.opencode/skills/<name>/SKILL.md)',
    arguments: [{ name: 'name', description: 'Skill name (lowercase-with-hyphens)', required: true }],
    options: [
      { name: 'description', description: 'Skill description', type: 'string' },
      { name: 'dir', description: 'Target project directory', type: 'string' },
      { name: 'scope', description: 'Storage scope: project | global', type: 'string' },
      { name: 'force', description: 'Overwrite an existing skill', type: 'boolean' },
    ],
  },
})
@injectable()
export class SkillAddCommandPlugin extends PluginCommandBase<ISkillAddCommandConfig> {
  /**
   * Writes the skill and reports it as key-value data. The target directory defaults to the
   * process working directory, the scope to `project` and the description to one built from
   * the name.
   * @param args Command arguments
   * @returns Data for the `key-value` formatter, or a failed result carrying the write error
   */
  async action(args: ISkillAddCommandConfig): Promise<ICommandResult<TFormatterData<'key-value'>>> {
    const targetDir = path.resolve(args.dir ?? process.cwd());
    const scope = resolveSkillScope(args.scope) ?? 'project';
    const description = args.description ?? `Skill ${args.name}`;

    try {
      const skillPath = writeSkill(targetDir, { name: args.name, description }, { scope, force: args.force });

      return {
        success: true,
        data: {
          title: 'Skill created',
          pairs: [
            { key: 'name', value: args.name },
            { key: 'scope', value: scope },
            { key: 'path', value: skillPath },
          ],
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      return { success: false, error: [message] };
    }
  }
}
