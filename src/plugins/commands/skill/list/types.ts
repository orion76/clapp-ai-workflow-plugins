/** Arguments of the `skill/list` command. */
export interface ISkillListCommandConfig {
  /** Target project directory; the process working directory by default. */
  dir?: string;
  /** Storage scope: `project` or `global`; both scopes are listed when omitted. */
  scope?: string;
}
