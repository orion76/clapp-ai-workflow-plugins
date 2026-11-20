import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from '@jest/globals';
import 'reflect-metadata';

import { getPluginDefinition } from '@orion76/node-plugin';

import { BriefCommandPlugin } from '../src/plugins/command/brief/brief.plugin.js';
import { InitCommandPlugin } from '../src/plugins/command/init/init.plugin.js';
import { NpmInfoCommandPlugin } from '../src/plugins/command/npm-info/npm-info.plugin.js';
import { SkillAddCommandPlugin } from '../src/plugins/command/skill/add/add.plugin.js';
import { SkillListCommandPlugin } from '../src/plugins/command/skill/list/list.plugin.js';
import { TaskAddCommandPlugin } from '../src/plugins/command/task/add/add.plugin.js';
import { TaskListCommandPlugin } from '../src/plugins/command/task/list/list.plugin.js';
import { TaskTodoCommandPlugin } from '../src/plugins/command/task/todo/todo.plugin.js';

/** Commands that describe their data with a schema; the groups and `board` print themselves. */
const SCHEMA_COMMANDS = [
  TaskListCommandPlugin,
  TaskTodoCommandPlugin,
  TaskAddCommandPlugin,
  SkillListCommandPlugin,
  SkillAddCommandPlugin,
  NpmInfoCommandPlugin,
  InitCommandPlugin,
  BriefCommandPlugin,
];

const SCHEMAS_DIR = join(process.cwd(), 'schemas');

/**
 * Reads the `$id` of every schema file of the package.
 *
 * The files of this package are hand-written with a top-level `$id` key, so the id is read
 * from the key line instead of parsing the whole document: the parser is the concern of the
 * loader test of `@clapp/core`, and a schema without the key is what this test looks for.
 * @returns File name and declared id of every schema file, in the order of the directory
 */
function readSchemaFiles(): Array<{ file: string; id: string | undefined }> {
  const files = readdirSync(SCHEMAS_DIR).filter((file) => file.endsWith('.schema.yml'));

  return files.map((file) => {
    const content = readFileSync(join(SCHEMAS_DIR, file), 'utf8');
    const match = /^\$id:\s*(\S+)\s*$/m.exec(content);

    return { file, id: match?.[1] };
  });
}

/**
 * Reads the `dataSchema` a command plugin declares.
 *
 * `getPluginDefinition` reports the base plugin definition, which knows nothing about the
 * command fields, so the value is read through the shape the test is about.
 * @param command Class of the command plugin
 * @returns Declared `$id` of the data schema, or `undefined` when the command declares none
 */
function dataSchemaOf(command: unknown): string | undefined {
  const definition = getPluginDefinition(command as Parameters<typeof getPluginDefinition>[0]) as
    | { dataSchema?: string }
    | undefined;

  return definition?.dataSchema;
}

describe('data schemas of the command plugins', () => {
  it('gives every schema command a schema file whose $id is its dataSchema', () => {
    const schemaIds = readSchemaFiles()
      .map((schema) => schema.id)
      .sort();
    const commandSchemaIds = SCHEMA_COMMANDS.map((command) => dataSchemaOf(command)).sort();

    expect(commandSchemaIds).toEqual(schemaIds);
  });

  it('names every schema file after its $id', () => {
    const files = readSchemaFiles();

    for (const { file, id } of files) {
      expect(id).toBeDefined();
      expect(`${id}.schema.yml`).toBe(file);
    }
  });

  it('writes every schema in the 2020-12 dialect', () => {
    for (const { file } of readSchemaFiles()) {
      const content = readFileSync(join(SCHEMAS_DIR, file), 'utf8');

      expect(content).toMatch(/^\$schema:\s*https:\/\/json-schema\.org\/draft\/2020-12\/schema\s*$/m);
    }
  });
});
