import { expectType, expectAssignable } from 'tsd';
import { DataUri, Output, optimize } from '../../types/lib/svgo-node.js';

expectType<Output>(optimize('<svg></svg>'));
expectAssignable<DataUri>('enc');
