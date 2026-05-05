import { expectType, expectAssignable } from 'tsd';
import {
  BuiltinPlugin,
  type Config,
  type DataUri,
  type Output,
  builtinPlugins,
  loadConfig,
  optimize,
} from '../../types/lib/svgo-node.js';

expectType<Output>(optimize('<svg></svg>'));
expectAssignable<DataUri>('enc');

expectType<Promise<Config | null>>(loadConfig());
expectType<Promise<Config | null>>(loadConfig(undefined));
expectType<Promise<Config | null>>(loadConfig(null));
expectType<Promise<Config>>(loadConfig('svgo.config.js'));

const presetDefault = builtinPlugins.find(
  (plugin) => plugin.name === 'preset-default',
)!;
if (!presetDefault.isPreset) {
  throw Error('Could not find preset-default.');
}

expectType<ReadonlyArray<BuiltinPlugin<string, Object>>>(presetDefault.plugins);
expectType<'preset-default'>(presetDefault.name);
