import { execSync } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * Получает корень git-репозитория из указанной директории.
 * Выбрасывает ошибку, если git недоступен.
 */
export function resolveRepoRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir);
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    throw new Error(
      'Failed to determine repository root: git is not available or not a git repository'
    );
  }
}

/**
 * Собирает карту workspace-проектов по workspaces-паттернам корневого package.json.
 * Возвращает Map<name, { name, path, tasksDir }>, пропуская node_modules/.git/скрытые dirs.
 */
export interface WorkspaceProject {
  name: string;
  path: string;
  tasksDir: string;
}

export async function collectWorkspaceProjects(repoRoot: string): Promise<Map<string, WorkspaceProject>> {
  const pkgPath = join(repoRoot, 'package.json');
  let pkg: Record<string, unknown>;
  try {
    const raw = String(
      require('node:fs').readFileSync(pkgPath, 'utf8')
    );
    pkg = JSON.parse(raw);
  } catch {
    // Если package.json недоступен — возвращаем пустую карту
    return new Map();
  }

  const workspaces = Array.isArray(pkg.workspaces)
    ? pkg.workspaces
    : pkg.workspaces
      ? Object.values(pkg.workspaces as Record<string, unknown>)
      : [];

  const projects = new Map<string, WorkspaceProject>();

  for (const ws of workspaces) {
    const wsPattern = typeof ws === 'string' ? ws : '';
    // Simple pattern matching - for workspace packages in monorepos
    // We'll scan packages/ directory relative to repo root
    const pkgDir = join(repoRoot, 'packages');
    try {
      const entries = await readdir(pkgDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirName = entry.name;
          // Skip node_modules, .git, hidden directories
          if (
            dirName === 'node_modules' ||
            dirName === '.git' ||
            dirName.startsWith('.')
          ) {
            continue;
          }
          const dirPath = join(pkgDir, dirName);
          // Check if it has a package.json
          try {
            await stat(dirPath);
            const pkgJsonPath = join(dirPath, 'package.json');
            let hasPkgJson = false;
            try {
              await readdir(pkgJsonPath); // just check existence
              hasPkgJson = true;
            } catch {
              // no package.json
            }
            if (hasPkgJson) {
              // Determine the workspace name
              let wsName: string;
              if (dirName.startsWith('@')) {
                // scoped package
                wsName = dirName;
              } else {
                wsName = dirName;
              }
              projects.set(wsName, {
                name: wsName,
                path: dirPath,
                tasksDir: join(dirPath, '.opencode', 'tasks'),
              });
            }
          } catch {
            // stat failed
          }
        }
      }
    } catch {
      // pkg dir doesn't exist
    }
  }

  return projects;
}

/**
 * Разрешает имя проекта: 'root' → корень репозитория,
 * неизвестное имя → ошибка с перечём доступных.
 */
export async function resolveProject(
  repoRoot: string,
  projectName?: string
): Promise<{ type: 'root' | 'workspace'; path: string }> {
  if (!projectName) {
    throw new Error(
      'Project name is required (no context fallback). Pass "root" or a workspace package name.'
    );
  }

  if (projectName === 'root' || projectName === undefined) {
    return { type: 'root', path: repoRoot };
  }

  // Check if it's a known workspace package
  const projects = await collectWorkspaceProjects(repoRoot);
  if (projects.has(projectName)) {
    return { type: 'workspace', path: projects.get(projectName)!.path };
  }

  // List available projects for error message
  const available = Array.from(projects.keys()).join(', ');
  throw new Error(
    `Unknown project "${projectName}". Available projects: ${available || 'root'}`
  );
}

/**
 * Парсит [project name] из аргументов команды task.
 * Возвращает { projectType, projectPath, taskName }.
 * Оба project и name обязательны (required: true).
 */
export async function resolveTaskTarget(
  args: { project: string; name: string }
): Promise<{ projectType: 'root' | 'workspace'; projectPath: string; taskName: string }> {
  const repoRoot = resolveRepoRoot();
  const { project, name } = args;

  if (!name) {
    throw new Error('Task name is required');
  }

  let projectPath: string;
  let projectType: 'root' | 'workspace';

  if (project === 'root') {
    projectType = 'root';
    projectPath = repoRoot;
  } else {
    const resolved = await resolveProject(repoRoot, project);
    projectType = resolved.type;
    projectPath = resolved.path;
  }

  return { projectType, projectPath, taskName: name };
}