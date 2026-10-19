import path from 'node:path';

import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import { listAllSkills, listSkills, resolveSkillScope } from '@clapp/ai-workflow-plugins';
import {
  COMMAND_KIND_RESOURCE,
  type ICommandResult,
  type IFormatterCommandDefinitionData,
  type TFormatterData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/command';

import type { ISkillListCommandConfig } from './types.js';

/**
 * Resource `skill/list`: the opencode skills available to a project.
 *
 * A read-only query, so it maps to the MCP Resources surface under the path `skill/list` and is
 * invoked as `skill list` by the CLI (the former `skill-list` command); the `dir` and `scope`
 * options turn it into a URI template, since a resource describes no arguments of its own. The
 * command returns its data instead of printing it: the `table` formatter renders the
 * `name`/`scope`/`description` columns, and the core prints that text — to stdout of the CLI,
 * as the content of the MCP resource.
 */
@NodePlugin<IFormatterCommandDefinitionData<ISkillListCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_RESOURCE,
  id: 'skill_list',
  command: 'list',
  parent: 'skill',
  label: 'List opencode skills',
  formatter: 'table',
  config: {
    description: 'List available opencode skills (project and/or global)',
    options: [
      { name: 'dir', description: 'Target project directory', type: 'string' },
      { name: 'scope', description: 'Storage scope: project | global', type: 'string', choices: ['project', 'global'] },
    ],
  },
})
@injectable()
export class SkillListCommandPlugin extends PluginCommandBase<ISkillListCommandConfig> {
  /**
   * Collects the skills as table data. An empty list yields empty data, so the
   * formatter prints nothing instead of a placeholder line.
   * @param args Command arguments
   * @returns Table data with the name/scope/description columns
   */
  async action(args: ISkillListCommandConfig): Promise<ICommandResult<TFormatterData<'table'>>> {
    const targetDir = path.resolve(args.dir ?? process.cwd());
    const scope = resolveSkillScope(args.scope);
    const skills = scope ? listSkills(targetDir, scope) : listAllSkills(targetDir);

    return {
      success: true,
      data: {
        headers: ['name', 'scope', 'description'],
        rows: skills.map((skill) => ({
          name: skill.name,
          scope: skill.scope,
          description: skill.description,
        })),
      },
    };
  }
}
