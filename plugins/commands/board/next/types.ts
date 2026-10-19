/** Arguments of the `board next` command. */
export interface IBoardNextCommandConfig {
  /** Project slug to filter the actionable tasks by. */
  slug?: string;
  /** Path to the task board directory. */
  dir?: string;
  /** Whether the caller asked for JSON output. */
  json?: boolean;
}
