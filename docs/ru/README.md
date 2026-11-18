> ⚠️ **В разработке.** Пакет ещё не готов к релизу: релиз ожидается в ближайшее время, API может меняться. Использовать в продакшне пока нельзя.

[English](../README.md)

# @clapp/ai-workflow-plugins

Библиотека плагинов для workflow разработки с ИИ: команды и переиспользуемая логика, на которых работают CLI `clapp-ai` и сервер `clapp-ai-mcp`, — артефакты opencode (skills, commands, agents, instructions, config), задачный workflow и доска задач. Пакет входит в монорепозиторий [`orion76/clapp`](https://github.com/orion76/clapp) и построен на `@clapp/core` (контракты плагинов и discovery) и `yaml`.

## Возможности

- **Один набор команд для обоих хостов** — `task list|add|todo`, `board list|next`, `skill list|add`, `init`, `npm-info` и подсказка `brief`; каждая из них — плагин `PLUGIN_COMMAND`, чей `kind` отображает её на инструмент, ресурс или подсказку MCP; одни и те же определения обслуживают CLI и MCP-сервер.
- **Skills opencode** — чтение и запись `SKILL.md` с проверкой имени и описания (`SKILL_NAME_PATTERN`, `SKILL_NAME_MAX_LENGTH`) в области `project` или `global`: `writeSkill`, `readSkill`, `listSkills`, `listAllSkills`, `renderSkill`, `parseSkill`.
- **Данные задачного workflow** — `listTasks`, `createTask`, `readTaskMeta` и `readTodo` поверх `.opencode/tasks/<id>/` (`_task.md` плюс схема `_todo.yml` версии 1), с разрешением проекта в workspace (`collectWorkspaceProjects`, `resolveProject`, `resolveTaskTarget`).
- **Доска задач** — реестр `~/task-board` (`projects.yaml`, `INDEX.yaml`), файлы состояния по каждой задаче и выбор следующей задачи, готовой к работе: `collectProjects`, `listBoard`, `nextBoard`, `selectNext`, `effectiveStatus`.
- **Конфигурация и инструкции opencode** — discovery и создание `opencode.json` / `opencode.jsonc`, помощники для `AGENTS.md` и каталоги артефактов (`getSkillsDir`, `getCommandsDir`, `getAgentsDir`).
- **Инициализация проекта** — `initProject` разворачивает каркас opencode-артефактов проекта, а `buildInitResultData` рендерит их как key-value данные для форматтера.
- **Отчёт по `package.json`** — `readPackageJson` и `buildPackageInfoData` с секциями `summary`, `deps`, `scripts`, `meta`, `bin` и `all`.
- **Переиспользуемые модули** — помощники реестра, состояния, задач и opencode экспортируются из корня пакета, поэтому хост или инструмент может переиспользовать логику, не обращаясь к команде.

## Установка

Пакет ещё не опубликован в npm, поэтому `npm install @clapp/ai-workflow-plugins` ничего не установит до первого релиза. До этого пакет используется как workspace-пакет монорепозитория:

```bash
npm install @clapp/ai-workflow-plugins
```

## Использование

### Как библиотека плагинов хоста

Хосту достаточно объявить этот пакет источником команд в своём `clapp.config.yml`; дальше плагины находятся по glob-паттерну и не требуют ни одного импорта:

```yaml
plugins:
  command:
    sources:
      - type: library
        library: '@clapp/ai-workflow-plugins'
        patterns:
          - src/plugins/command/**/*.plugin.{js,ts}
```

### Как библиотека

Помощники данных — обычные функции, экспортируемые из корня пакета:

```ts
import { createTask, listAllSkills, nextBoard } from '@clapp/ai-workflow-plugins';

const skills = listAllSkills(process.cwd());

const created = await createTask(process.cwd(), 'my-task', { description: 'Do the thing' });

const next = nextBoard(`${process.env.HOME}/task-board`);
```

## Связанные пакеты

| Пакет                                                                       | Репозиторий                                                                              |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`@clapp/common`](https://www.npmjs.com/package/@clapp/common)               | [`orion76/clapp-common`](https://github.com/orion76/clapp-common)                         |
| [`@clapp/core`](https://www.npmjs.com/package/@clapp/core)                   | [`orion76/clapp-core`](https://github.com/orion76/clapp-core)                             |
| [`@clapp/utils`](https://www.npmjs.com/package/@clapp/utils)                 | [`orion76/clapp-utils`](https://github.com/orion76/clapp-utils)                           |
| [`@clapp/ai-workflow-cli`](https://www.npmjs.com/package/@clapp/ai-workflow-cli) | [`orion76/clapp-ai-workflow-cli`](https://github.com/orion76/clapp-ai-workflow-cli)       |
| [`@clapp/ai-workflow-mcp`](https://www.npmjs.com/package/@clapp/ai-workflow-mcp) | [`orion76/clapp-ai-workflow-mcp`](https://github.com/orion76/clapp-ai-workflow-mcp)       |

## Лицензия

MIT
