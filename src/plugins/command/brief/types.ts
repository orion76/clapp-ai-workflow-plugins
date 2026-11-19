import type { IOrderedListData } from '@clapp/common';

/** Arguments of the `brief` command. */
export interface IBriefCommandConfig {
  /** What the model should focus on; the instruction is built around it. */
  goal: string;
  /** Depth of the checklist: `brief` or `detailed`. */
  depth?: string;
}

/**
 * Data of the `brief` command: the instruction and its checklist.
 *
 * Every item is plain text, so the schema `brief` narrows the items of the base list to strings.
 */
export interface IBriefData extends IOrderedListData {
  /** List title. */
  title: string;
  /** Goal and depth the checklist was built for. */
  description: string;
  /** Checklist items in the order they are proposed. */
  items: string[];
}
