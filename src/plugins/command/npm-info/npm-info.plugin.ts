import { NodePlugin } from '@orion76/node-plugin';
import { injectable } from 'inversify';

import {
  COMMAND_KIND_RESOURCE,
  IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
  type ICommandResult,
} from '@clapp/common';

import { buildPackageInfoData, isKnownInfoType, NPM_INFO_TYPES, readPackageJson } from '@clapp/ai-workflow-plugins';
import type { INpmInfoCommandConfig, INpmInfoData } from './types.js';

@NodePlugin<IPluginCommandDefinitionData<INpmInfoCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_RESOURCE,
  id: 'npm-info',
  command: 'npm-info',
  label: 'Show local package.json info',
  dataSchema: 'npm-info',
  config: {
    description: 'Print fields of the current directory package.json by info type',
    arguments: [
      {
        name: 'type',
        description: 'Info type to print (default: summary)',
        required: false,
        choices: [...NPM_INFO_TYPES],
      },
    ],
  },
})
@injectable()
export class NpmInfoCommandPlugin extends PluginCommandBase<INpmInfoCommandConfig> {
  /**
   * Reads the local package.json and returns the requested fields as key-value
   * data. An unknown type and a missing package.json stay `success: false`, so
   * the core reports the error instead of formatting it.
   * @param args Command arguments
   * @returns Data of the requested info type
   */
  async action(args: INpmInfoCommandConfig): Promise<ICommandResult<INpmInfoData>> {
    const type = args.type ?? 'summary';

    if (!isKnownInfoType(type)) {
      return { success: false, error: [`Unknown info type: ${type}. Available types: ${NPM_INFO_TYPES.join(', ')}`] };
    }

    const { pkg, error } = readPackageJson(process.cwd());
    if (!pkg) {
      return { success: false, error: [error ?? 'Failed to read package.json'] };
    }

    return { success: true, data: buildPackageInfoData(pkg, type) };
  }
}
