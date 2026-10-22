import path from 'node:path';

import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import { listTasks, readTaskMeta } from '@clapp/ai-workflow-plugins';
import {
  COMMAND_KIND_RESOURCE,
  type ICommandResult,
  type IFormatterCommandDefinitionData,
  type TFormatterData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/common';

import type { ITaskListCommandConfig } from './types.js';

/**
 * Resource `task_list`: lists tasks for a project.
 *
 * A read-only query, so it maps to the MCP Resources surface under the path `task/list` and is
 * invoked as `task list <project>` by the CLI. The command returns its data instead of printing it:
 * the `table` formatter renders the `id`/`title`/`done`/`total`/`active` columns, and the core
 * prints that text — to stdout of the CLI, as the content of the MCP resource.
 */
@NodePlugin<IFormatterCommandDefinitionData<ITaskListCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_RESOURCE,
  id: 'task_list',
  command: 'list',
  parent: 'task',
  label: 'List tasks',
  formatter: 'table',
  config: {
    description: 'List tasks in a project',
    arguments: [
      { name: 'project', description: 'Project name (workspace package name or "root")', required: true },
    ],
  },
})
@injectable()
export class TaskListCommandPlugin extends PluginCommandBase<ITaskListCommandConfig> {
  /**
   * Collects the tasks as table data. An empty list yields empty data, so the
   * formatter prints nothing instead of a placeholder line.
   * @param args Command arguments
   * @returns Table data with the id/title/done/total/active columns
   */
  async action(args: ITaskListCommandConfig): Promise<ICommandResult<TFormatterData<'table'>>> {
    const project = args.project;

    let tasks: any[];
    try {
      tasks = await listTasks(project);
    } catch (e) {
      // If project is unknown, return failed result with list of available projects
      const repoRoot = await import('@clapp/ai-workflow-plugins').then(m => m.resolveRepoRoot());
      const projects = await import('@clapp/ai-workflow-plugins').then(m => m.collectWorkspaceProjects(repoRoot));
      const available = Array.from(projects.keys()).join(', ');
      return {
        success: false,
        error: [`Unknown project "${project}". Available projects: ${available || 'root'}`],
      };
    }

    // Build table rows
    const rows = tasks.map((task: any) => [
      task.id,
      task.title,
      `${task.done}/${task.total}`,
      `${task.done}/${task.total}`,
      task.active ? 'yes' : 'no',
    ]);

    return {
      success: true,
      data: {
        headers: ['id', 'title', 'done', 'total', 'active'],
        rows,
      },
    };
  }
}