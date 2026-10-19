/** Arguments of the `brief` command. */
export interface IBriefCommandConfig {
  /** What the model should focus on; the instruction is built around it. */
  goal: string;
  /** Depth of the checklist: `brief` or `detailed`. */
  depth?: string;
}
