import type { IKeyValueData, IKeyValuePair } from '@clapp/common';

export interface IInitCommandConfig {
  dir?: string;
}

/** Data of the `init` command: the artifacts that were created or found, as key-value pairs. */
export interface IInitData extends IKeyValueData {
  /** Heading naming the initialized directory. */
  title: string;
  /** Paths of the config, the directories and the instructions file. */
  pairs: IKeyValuePair[];
}
