
import { NodePlugin } from '@orion76/node-plugin';
import { inject, injectable } from 'inversify';

import { createTask, resolveTaskTarget } from '@clapp/ai-workflow-plugins';
import {
  COMMAND_KIND_TOOL,
  IPluginCommand,
  IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
  PROJECT_PATH,
  type ICommandResult,
} from '@clapp/common';

import type { ITaskAddCommandConfig, ITaskAddCommandContext, ITaskAddData } from './types.js';

/**
 * Tool `task_add`: creates a new task in the task workflow.
 *
 * The command has side effects, so it maps to the MCP Tools surface under the path
 * `task/add` and is invoked as `task add <project> <name>` by the CLI. It
 * returns its data instead of printing it: the data schema `task-add` declares the created task
 * (name, project, path, active) and the core renders that data through the formatter the app
 * config maps to the schema — to stdout of the CLI, as the content of the MCP tool result. A
 * validation error or existing task without `force` — is returned as a failed result, so the
 * surface answers with the error and the server keeps its stdout for the protocol stream.
 */
@NodePlugin<IPluginCommandDefinitionData<ITaskAddCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_TOOL,
  id: 'task_add',
  command: 'add',
  parent: 'task',
  label: 'Create a new task',
  dataSchema: 'task-add',

  config: {
    description: 'Create a new task in the task workflow',
    arguments: [
      { name: 'project', description: 'Project name (workspace package name or "root")', required: true },
      { name: 'name', description: 'Task name (kebab-case)', required: true },
    ],
    options: [{ name: 'description', description: 'Task description', type: 'string' }],
  },
})
@injectable()
export class TaskAddCommandPlugin
  extends PluginCommandBase<ITaskAddCommandConfig, ITaskAddData>
  implements IPluginCommand<ITaskAddCommandConfig, ITaskAddData> {

  @inject(PROJECT_PATH) project!: string
  /**
   * Creates a new task and reports it as key-value data.
   * @param args Command arguments
   * @returns Data of the created task, or a failed result carrying the validation error
   */
  async action(args: ITaskAddCommandConfig): Promise<ICommandResult<ITaskAddData>> {
    const { name, description } = args;
    const { project } = this;
    // Resolve the project path
    let projectPath: string;
    let projectType: 'root' | 'workspace';

    try {
      const resolved = await resolveTaskTarget({ project, name });
      projectType = resolved.projectType;
      projectPath = resolved.projectPath;
    } catch (e: any) {
      return {
        success: false,
        error: [e.message || 'Failed to resolve project'],
      };
    }

    // Validate task name is kebab-case (already required by commander, but double-check)
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!kebabCaseRegex.test(name)) {
      return {
        success: false,
        error: [`Invalid task name "${name}". Must be kebab-case (lowercase with hyphens).`],
      };
    }

    // Create the task
    try {
      const result = await createTask(projectPath, name, { description });

      if (!result.success) {
        return {
          success: false,
          error: [result.error || 'Failed to create task'],
        };
      }

      return {
        success: true,
        data: {
          title: 'Task created',
          pairs: [
            { key: 'task', value: name },
            { key: 'project', value: project },
            { key: 'path', value: result.taskPath || projectPath },
            { key: 'active', value: result.activated ? 'yes' : 'no' },
          ],
        },
      };
    } catch (e: any) {
      return {
        success: false,
        error: [e.message || 'Failed to create task'],
      };
    }
  }
}
