import { assertType, expectTypeOf, test } from 'vitest';
import {
  BuiltinPlugin,
  type Config,
  type DataUri,
  type Output,
  builtinPlugins,
  loadConfig,
  optimize,
} from 'svgo';

// Resolving `svgo` by package name exercises the `types` export condition,
// which no other type test covers (svgo-node.test-d.ts imports by relative
// path). Under the default tsconfig this resolves to the node types entry.

test('svgo types resolve by package name', () => {
  expectTypeOf(optimize('<svg></svg>')).toEqualTypeOf<Output>();
  assertType<DataUri>('enc');

  expectTypeOf(loadConfig()).toEqualTypeOf<Promise<Config | null>>();
  expectTypeOf(loadConfig(undefined)).toEqualTypeOf<Promise<Config | null>>();
  expectTypeOf(loadConfig(null)).toEqualTypeOf<Promise<Config | null>>();
  expectTypeOf(loadConfig('svgo.config.js')).toEqualTypeOf<Promise<Config>>();

  const presetDefault = builtinPlugins.find(
    (plugin) => plugin.name === 'preset-default',
  )!;
  if (!presetDefault.isPreset) {
    throw Error('Could not find preset-default.');
  }

  expectTypeOf(presetDefault.plugins).toEqualTypeOf<
    ReadonlyArray<BuiltinPlugin<string, Object>>
  >();
  expectTypeOf(presetDefault.name).toEqualTypeOf<'preset-default'>();
});
