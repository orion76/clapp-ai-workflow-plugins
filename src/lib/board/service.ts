import fs from 'node:fs';
import path from 'node:path';

import { collectProjects, expandHome } from './registry.js';
import { selectNext } from './select-next.js';

/** Directory of the task board used when the `--dir` option is omitted. */
export const DEFAULT_BOARD_DIR = '~/task-board';

/**
 * Result of a `board` use case: printable stdout payload, non-fatal warnings and,
 * when the use case cannot complete, the single failure message of the command.
 */
export interface BoardOutput {
  /**
   * Text to write to stdout (already formatted). In JSON mode it also carries the
   * unified `{ success, error }` envelope of a failed use case.
   */
  output?: string;
  /** Diagnostics for stderr that do not fail the command. */
  warnings?: string[];
  /** Failure message; when set the command exits with an error. */
  error?: string;
}

/**
 * Resolve the board directory from the command option.
 * @param dir Raw `--dir` value (may be `undefined`, `~` or a relative path)
 * @returns Absolute path of the board directory
 */
export function resolveBoardDir(dir?: string): string {
  return path.resolve(expandHome(dir ?? DEFAULT_BOARD_DIR));
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isIndexStale(boardDir: string): boolean {
  try {
    const index = fs.statSync(path.join(boardDir, 'INDEX.md')).mtimeMs;
    const config = fs.statSync(path.join(boardDir, 'projects.yaml')).mtimeMs;
    return config > index;
  } catch {
    return false;
  }
}

/**
 * Read the board overview: the raw `INDEX.md` content plus a staleness warning.
 * @param boardDir Board directory
 * @returns Output with the index content, or the failure message when it is missing
 */
export function listBoard(boardDir: string): BoardOutput {
  const indexFile = path.join(boardDir, 'INDEX.md');

  try {
    if (!fs.existsSync(indexFile)) {
      return { error: 'No INDEX.md yet. Run: board sync' };
    }

    return {
      output: fs.readFileSync(indexFile, 'utf8'),
      warnings: isIndexStale(boardDir) ? ['Warning: projects.yaml is newer than INDEX.md. Run: board sync'] : undefined,
    };
  } catch (error) {
    return { error: toMessage(error) };
  }
}

/**
 * Pick the next actionable task of the board. In JSON mode the unified envelope
 * (`{ success, task }` / `{ success, error }`) is what the command prints to stdout.
 * @param boardDir Board directory
 * @param slug Optional project slug filter
 * @param json Whether the caller asked for JSON output
 * @returns Output with the next task, or the failure message when none is actionable
 */
export function nextBoard(boardDir: string, slug?: string, json = false): BoardOutput {
  try {
    const { projects } = collectProjects(boardDir);
    const next = selectNext(boardDir, projects, slug);

    if (!next) {
      const message = `No actionable task${slug ? ` in '${slug}'` : ''}.`;
      return {
        output: json ? `${JSON.stringify({ success: false, error: [message] })}\n` : undefined,
        error: message,
      };
    }

    return { output: json ? `${JSON.stringify({ success: true, task: next })}\n` : `${next.slug}/${next.taskId}\n` };
  } catch (error) {
    return { error: toMessage(error) };
  }
}
