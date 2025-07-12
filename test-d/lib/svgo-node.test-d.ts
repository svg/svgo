import { expectType, expectAssignable } from 'tsd';
import {
  type Config,
  type DataUri,
  type Output,
  loadConfig,
  optimize,
} from '../../types/lib/svgo-node.js';

expectType<Output>(optimize('<svg></svg>'));
expectAssignable<DataUri>('enc');

expectType<Promise<Config | null>>(loadConfig());
expectType<Promise<Config | null>>(loadConfig(undefined));
expectType<Promise<Config | null>>(loadConfig(null));
expectType<Promise<Config>>(loadConfig('svgo.config.js'));
