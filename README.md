> ⚠️ **Work in progress.** This package is under active development. A release is expected soon, but it is **not production-ready** yet: the API may change without notice. Do not use it in production.

> ⚠️ **В разработке.** Пакет ещё не готов к релизу: релиз ожидается в ближайшее время, API может меняться. Использовать в продакшне пока нельзя.

**English** | [Русский](./docs/ru/README.md)

# @clapp/ai-workflow-plugins

The package is published from its own repository, [`orion76/clapp-ai-workflow-plugins`](https://github.com/orion76/clapp-ai-workflow-plugins); it is developed together with the `clapp` host workspace and its `clapp-ai` / `clapp-ai-mcp` hosts ([`orion76/clapp`](https://github.com/orion76/clapp)).

The plugin library of the AI-assisted development workflow: the commands and the reusable logic behind the `clapp-ai` CLI and the `clapp-ai-mcp` server, covering the opencode artifacts (skills, commands, agents, instructions, config) plus the task workflow and the task board. It is built on `@clapp/core` (plugin contracts and discovery) and `yaml`.

## Features

- **One command set for both hosts** — `task list|add|todo`, `board list|next`, `skill list|add`, `init`, `npm-info` and the `brief` prompt, each a `PLUGIN_COMMAND` plugin whose `kind` maps it onto an MCP tool, resource or prompt; the same definitions serve the CLI and the MCP server.
- **opencode skills** — read and write `SKILL.md` with name and description validation (`SKILL_NAME_PATTERN`, `SKILL_NAME_MAX_LENGTH`), in the `project` or `global` scope: `writeSkill`, `readSkill`, `listSkills`, `listAllSkills`, `renderSkill`, `parseSkill`.
- **Task workflow data** — `listTasks`, `createTask`, `readTaskMeta` and `readTodo` over `.opencode/tasks/<id>/` (`_task.md` plus the `_todo.yml` schema v1), with workspace project resolution (`collectWorkspaceProjects`, `resolveProject`, `resolveTaskTarget`).
- **Task board** — the `~/task-board` registry (`projects.yaml`, `INDEX.yaml`), per-task state files and the next actionable task selection: `collectProjects`, `listBoard`, `nextBoard`, `selectNext`, `effectiveStatus`.
- **opencode config and instructions** — discovery and creation of `opencode.json` / `opencode.jsonc`, the `AGENTS.md` helpers and the artifact directories (`getSkillsDir`, `getCommandsDir`, `getAgentsDir`).
- **Project initialisation** — `initProject` scaffolds the opencode artifacts of a project and `buildInitResultData` renders them as key-value data for a formatter.
- **`package.json` report** — `readPackageJson` and `buildPackageInfoData` with the `summary`, `deps`, `scripts`, `meta`, `bin` and `all` sections.
- **Reusable modules** — the registry, state, task and opencode helpers are exported from the package root, so a host or a tool can reuse the logic without going through a command.

## Installation

The package is not published to npm yet, so `npm install @clapp/ai-workflow-plugins` does not resolve until the first release. Until then it is consumed as a workspace package of the `clapp` host workspace ([`orion76/clapp`](https://github.com/orion76/clapp)):

```bash
npm install @clapp/ai-workflow-plugins
```

## Usage

### As a plugin library of a host

A host only declares this package as a command source in its `clapp.config.yml`; the plugins are then discovered by the glob pattern and do not need a single import:

```yaml
plugins:
  command:
    sources:
      - type: library
        library: '@clapp/ai-workflow-plugins'
        patterns:
          - src/plugins/command/**/*.plugin.{js,ts}
```

### As a library

The data helpers are plain functions exported from the package root:

```ts
import { createTask, listAllSkills, nextBoard } from '@clapp/ai-workflow-plugins';

const skills = listAllSkills(process.cwd());

const created = await createTask(process.cwd(), 'my-task', { description: 'Do the thing' });

const next = nextBoard(`${process.env.HOME}/task-board`);
```

## Related packages

| Package                                                                     | Repository                                                                               |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`@clapp/common`](https://www.npmjs.com/package/@clapp/common)               | [`orion76/clapp-common`](https://github.com/orion76/clapp-common)                         |
| [`@clapp/core`](https://www.npmjs.com/package/@clapp/core)                   | [`orion76/clapp-core`](https://github.com/orion76/clapp-core)                             |
| [`@clapp/utils`](https://www.npmjs.com/package/@clapp/utils)                 | [`orion76/clapp-utils`](https://github.com/orion76/clapp-utils)                           |
| [`@clapp/ai-workflow-cli`](https://www.npmjs.com/package/@clapp/ai-workflow-cli) | [`orion76/clapp-ai-workflow-cli`](https://github.com/orion76/clapp-ai-workflow-cli)       |
| [`@clapp/ai-workflow-mcp`](https://www.npmjs.com/package/@clapp/ai-workflow-mcp) | [`orion76/clapp-ai-workflow-mcp`](https://github.com/orion76/clapp-ai-workflow-mcp)       |

## License

MIT
