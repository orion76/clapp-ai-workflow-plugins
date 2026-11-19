import path from 'node:path';

import { NodePlugin } from '@orion76/node-plugin';
import { injectable } from 'inversify';

import { listAllSkills, listSkills, resolveSkillScope } from '@clapp/ai-workflow-plugins';
import {
  COMMAND_KIND_RESOURCE,
  IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
  type ICommandResult,
} from '@clapp/common';

import type { ISkillListCommandConfig, ISkillListData } from './types.js';

/**
 * Resource `skill/list`: the opencode skills available to a project.
 *
 * A read-only query, so it maps to the MCP Resources surface under the path `skill/list` and is
 * invoked as `skill list` by the CLI (the former `skill-list` command); the `dir` and `scope`
 * options turn it into a URI template, since a resource describes no arguments of its own. The
 * command returns its data instead of printing it: the data schema `skill-list` declares the
 * `name`/`scope`/`description` columns, and the core renders that data through the formatter the
 * app config maps to the schema — to stdout of the CLI, as the content of the MCP resource.
 */
@NodePlugin<IPluginCommandDefinitionData<ISkillListCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_RESOURCE,
  id: 'skill_list',
  command: 'list',
  parent: 'skill',
  label: 'List opencode skills',
  dataSchema: 'skill-list',
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
   * engine prints nothing instead of a placeholder line.
   * @param args Command arguments
   * @returns Table data with the name/scope/description columns
   */
  async action(args: ISkillListCommandConfig): Promise<ICommandResult<ISkillListData>> {
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
