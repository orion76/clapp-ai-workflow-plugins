import { describe, expect, it } from '@jest/globals';

import type { IPackageJson } from '@clapp/utils';

import { buildPackageInfoData, isKnownInfoType, NPM_INFO_TYPES } from '../src/lib/npm/info.js';

const FULL_PACKAGE = {
  name: 'demo',
  version: '1.2.3',
  description: 'Demo package',
  private: true,
  dependencies: { alpha: '^1.0.0', beta: '^2.0.0' },
  devDependencies: { jest: '^30.0.0' },
  scripts: { build: 'tsc', test: 'jest' },
  bin: { demo: './bin/demo.js' },
  repository: { type: 'git', url: 'https://example.com/demo.git' },
  main: 'dist/index.js',
} as unknown as IPackageJson;

describe('isKnownInfoType', () => {
  it.each(NPM_INFO_TYPES)('accepts %s', (type) => {
    expect(isKnownInfoType(type)).toBe(true);
  });

  it('rejects an unknown type', () => {
    expect(isKnownInfoType('everything')).toBe(false);
  });
});

describe('buildPackageInfoData', () => {
  it('returns the present summary fields as top-level pairs', () => {
    const data = buildPackageInfoData(FULL_PACKAGE, 'summary');

    expect(data.sections).toBeUndefined();
    expect(data.pairs).toEqual([
      { key: 'name', value: 'demo' },
      { key: 'version', value: '1.2.3' },
      { key: 'description', value: 'Demo package' },
      { key: 'private', value: 'true' },
    ]);
  });

  it('skips summary fields that are absent', () => {
    const pkg = { name: 'demo', version: '0.0.0' } as unknown as IPackageJson;

    expect(buildPackageInfoData(pkg, 'summary').pairs).toEqual([
      { key: 'name', value: 'demo' },
      { key: 'version', value: '0.0.0' },
    ]);
  });

  it('returns the meta fields as top-level pairs', () => {
    const data = buildPackageInfoData(FULL_PACKAGE, 'meta');

    expect(data.pairs).toEqual([
      { key: 'repository', value: '{"type":"git","url":"https://example.com/demo.git"}' },
      { key: 'main', value: 'dist/index.js' },
    ]);
  });

  it('returns one section per present dependency kind, with the pair count in the title', () => {
    const data = buildPackageInfoData(FULL_PACKAGE, 'deps');

    expect(data.pairs).toBeUndefined();
    expect(data.sections).toEqual([
      { title: 'dependencies (2)', pairs: [{ key: 'alpha', value: '^1.0.0' }, { key: 'beta', value: '^2.0.0' }] },
      { title: 'devDependencies (1)', pairs: [{ key: 'jest', value: '^30.0.0' }] },
    ]);
  });

  it('returns the scripts as a section', () => {
    expect(buildPackageInfoData(FULL_PACKAGE, 'scripts').sections).toEqual([
      { title: 'scripts (2)', pairs: [{ key: 'build', value: 'tsc' }, { key: 'test', value: 'jest' }] },
    ]);
  });

  it('returns a bin string as a top-level pair', () => {
    const pkg = { name: 'demo', version: '0.0.0', bin: './bin/demo.js' } as unknown as IPackageJson;

    expect(buildPackageInfoData(pkg, 'bin')).toEqual({ pairs: [{ key: 'bin', value: './bin/demo.js' }] });
  });

  it('returns a bin record as a section', () => {
    expect(buildPackageInfoData(FULL_PACKAGE, 'bin')).toEqual({
      sections: [{ title: 'bin (1)', pairs: [{ key: 'demo', value: './bin/demo.js' }] }],
    });
  });

  it('returns empty data for absent fields', () => {
    const pkg = { name: 'demo', version: '0.0.0' } as unknown as IPackageJson;

    expect(buildPackageInfoData(pkg, 'deps')).toEqual({ sections: [] });
    expect(buildPackageInfoData(pkg, 'scripts')).toEqual({ sections: [] });
    expect(buildPackageInfoData(pkg, 'bin')).toEqual({});
    expect(buildPackageInfoData(pkg, 'meta')).toEqual({ pairs: [] });
  });

  it('combines summary pairs and dependency/scripts/meta/bin sections for all', () => {
    const data = buildPackageInfoData(FULL_PACKAGE, 'all');

    expect(data.pairs).toEqual([
      { key: 'name', value: 'demo' },
      { key: 'version', value: '1.2.3' },
      { key: 'description', value: 'Demo package' },
      { key: 'private', value: 'true' },
    ]);
    expect(data.sections?.map((section) => section.title)).toEqual([
      'dependencies (2)',
      'devDependencies (1)',
      'scripts (2)',
      'meta',
      'bin (1)',
    ]);
  });

  it('adds a bin string to the top-level pairs for all', () => {
    const pkg = { name: 'demo', version: '0.0.0', bin: './bin/demo.js' } as unknown as IPackageJson;

    expect(buildPackageInfoData(pkg, 'all').pairs).toContainEqual({ key: 'bin', value: './bin/demo.js' });
  });
});
