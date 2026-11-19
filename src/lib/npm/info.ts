import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { IKeyValueData, IKeyValuePair, IKeyValueSection } from '@clapp/common';
import type { IPackageJson } from '@clapp/utils';

export type UNpmInfoType = 'summary' | 'deps' | 'scripts' | 'meta' | 'bin' | 'all';

export const NPM_INFO_TYPES: readonly UNpmInfoType[] = ['summary', 'deps', 'scripts', 'meta', 'bin', 'all'];

const SUMMARY_FIELDS = ['name', 'version', 'description', 'license', 'author', 'private'] as const;

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;

const META_FIELDS = [
  'repository',
  'homepage',
  'bugs',
  'keywords',
  'engines',
  'os',
  'cpu',
  'files',
  'main',
  'types',
  'publishConfig',
] as const;

type TPackageJsonData = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Collects the present scalar fields as key-value pairs, in field order.
 * @param pkg Parsed package.json
 * @param fields Field names to project
 * @returns Pairs of the fields that are neither `undefined` nor `null`
 */
function scalarPairs(pkg: TPackageJsonData, fields: readonly string[]): IKeyValuePair[] {
  const pairs: IKeyValuePair[] = [];
  for (const field of fields) {
    const value = pkg[field];
    if (value === undefined || value === null) {
      continue;
    }
    pairs.push({ key: field, value: formatValue(value) });
  }

  return pairs;
}

/**
 * Converts a record field (for example `scripts`) into pairs.
 * @param value Field value
 * @returns Pairs of the record, or `undefined` when the value is not a non-empty record
 */
function recordPairs(value: unknown): IKeyValuePair[] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return undefined;
  }

  return entries.map(([key, entryValue]) => ({ key, value: formatValue(entryValue) }));
}

/**
 * Wraps pairs into a titled section; the title carries the pair count.
 * @param title Section title
 * @param pairs Section pairs
 * @returns Section with a `title (count)` heading
 */
function pairsSection(title: string, pairs: IKeyValuePair[]): IKeyValueSection {
  return { title: `${title} (${pairs.length})`, pairs };
}

/**
 * Builds one section per dependency kind that is present.
 * @param pkg Parsed package.json
 * @returns Dependency sections in field order
 */
function dependencySections(pkg: TPackageJsonData): IKeyValueSection[] {
  const sections: IKeyValueSection[] = [];
  for (const field of DEPENDENCY_FIELDS) {
    const pairs = recordPairs(pkg[field]);
    if (pairs) {
      sections.push(pairsSection(field, pairs));
    }
  }

  return sections;
}

/**
 * Builds the `scripts` section.
 * @param pkg Parsed package.json
 * @returns Scripts section, or an empty list when the field is absent or empty
 */
function scriptsSections(pkg: TPackageJsonData): IKeyValueSection[] {
  const pairs = recordPairs(pkg.scripts);

  return pairs ? [pairsSection('scripts', pairs)] : [];
}

/**
 * Projects the `bin` field: a string becomes a top-level pair, an object a section.
 * @param pkg Parsed package.json
 * @returns Top-level pairs and sections contributed by `bin`
 */
function binData(pkg: TPackageJsonData): Pick<IKeyValueData, 'pairs' | 'sections'> {
  const bin = pkg.bin;
  if (typeof bin === 'string') {
    return { pairs: [{ key: 'bin', value: bin }] };
  }
  const pairs = recordPairs(bin);

  return pairs ? { sections: [pairsSection('bin', pairs)] } : {};
}

type TInfoBuilder = (pkg: TPackageJsonData) => IKeyValueData;

const INFO_BUILDERS: Record<UNpmInfoType, TInfoBuilder> = {
  summary: (pkg) => ({ pairs: scalarPairs(pkg, SUMMARY_FIELDS) }),
  deps: (pkg) => ({ sections: dependencySections(pkg) }),
  scripts: (pkg) => ({ sections: scriptsSections(pkg) }),
  meta: (pkg) => ({ pairs: scalarPairs(pkg, META_FIELDS) }),
  bin: binData,
  all: (pkg) => {
    const summary = scalarPairs(pkg, SUMMARY_FIELDS);
    const meta = scalarPairs(pkg, META_FIELDS);
    const bin = binData(pkg);

    return {
      pairs: [...summary, ...(bin.pairs ?? [])],
      sections: [
        ...dependencySections(pkg),
        ...scriptsSections(pkg),
        ...(meta.length > 0 ? [{ title: 'meta', pairs: meta }] : []),
        ...(bin.sections ?? []),
      ],
    };
  },
};

export function isKnownInfoType(type: string): type is UNpmInfoType {
  return (NPM_INFO_TYPES as readonly string[]).includes(type);
}

/**
 * Build the key-value data of the requested info type. Pure: performs no output.
 * @param pkg Parsed package.json
 * @param type Known info type
 * @returns Data of the `npm-info` command; a type with no matching fields yields empty data
 */
export function buildPackageInfoData(pkg: IPackageJson, type: UNpmInfoType): IKeyValueData {
  return INFO_BUILDERS[type](pkg as TPackageJsonData);
}

export interface IPackageJsonReadResult {
  pkg?: IPackageJson;
  error?: string;
}

/**
 * Read package.json from a directory without writing anything to stdout/stderr.
 * Returns a result object so callers can render a clean error message.
 */
export function readPackageJson(dir: string): IPackageJsonReadResult {
  const filePath = path.join(dir, 'package.json');
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch {
    return { error: `package.json not found in ${dir}` };
  }
  try {
    const pkg = JSON.parse(raw) as unknown;
    if (!isRecord(pkg)) {
      return { error: `Invalid package.json in ${dir}` };
    }
    return { pkg: pkg as IPackageJson };
  } catch {
    return { error: `Invalid JSON in ${filePath}` };
  }
}
