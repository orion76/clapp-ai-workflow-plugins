import path from 'node:path';

import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import { createTask, resolveTaskTarget } from '@clapp/ai-workflow-plugins';
import {
  COMMAND_KIND_TOOL,
  type ICommandResult,
  type IFormatterCommandDefinitionData,
  type TFormatterData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/command';

import type { ITaskAddCommandConfig } from './types.js';

/**
 * Tool `task_add`: creates a new task in the task workflow.
 *
 * The command has side effects, so it maps to the MCP Tools surface under the path
 * `task/add` and is invoked as `task add <project> <name>` by the CLI. It
 * returns its data instead of printing it: the `key-value` formatter renders the created task
 * (name, project, path, active) and the core prints that text — to stdout of the CLI, as the content
 * of the MCP tool result. A validation error or existing task without `force` — is returned as a
 * failed result, so the surface answers with the error and the server keeps its stdout for the protocol stream.
 */
@NodePlugin<IFormatterCommandDefinitionData<ITaskAddCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_TOOL,
  id: 'task_add',
  command: 'add',
  parent: 'task',
  label: 'Create a new task',
  formatter: 'key-value',
  config: {
    description: 'Create a new task in the task workflow',
    arguments: [
      { name: 'project', description: 'Project name (workspace package name or "root")', required: true },
      { name: 'name', description: 'Task name (kebab-case)', required: true },
    ],
    options: [
      { name: 'description', description: 'Task description', type: 'string' },
    ],
  },
})
@injectable()
export class TaskAddCommandPlugin extends PluginCommandBase<ITaskAddCommandConfig> {
  /**
   * Creates a new task and reports it as key-value data.
   * @param args Command arguments
   * @returns Data for the `key-value` formatter, or a failed result carrying the validation error
   */
  async action(args: ITaskAddCommandConfig): Promise<ICommandResult<TFormatterData<'key-value'>>> {
    const { project, name, description } = args;

    // Resolve the project path
    let projectPath: string;
    let projectType: 'root' | 'workspace';

    try {
      const resolved = resolveTaskTarget({ project, name });
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