import type { IKeyValueData } from '@clapp/common';

export interface INpmInfoCommandConfig {
  type?: string;
}

/**
 * Data of the `npm-info` command: the requested projection of package.json.
 *
 * Which of the key-value fields are filled depends on the info type, so the interface narrows
 * nothing and the schema `npm-info` allows any of them.
 */
export interface INpmInfoData extends IKeyValueData {}
