/** Arguments of the `skill/add` command. */
export interface ISkillAddCommandConfig {
  /** Skill name (lowercase alphanumeric with single hyphens). */
  name: string;
  /** Skill description; a generated one is used when omitted. */
  description?: string;
  /** Target project directory; the process working directory by default. */
  dir?: string;
  /** Storage scope: `project` or `global`. */
  scope?: string;
  /** Overwrite an existing skill. */
  force?: boolean;
}
