import type { StringifyOptions, DataUri, Plugin } from './types.js';
import type {
  BuiltinsWithOptionalParams,
  BuiltinsWithRequiredParams,
} from '../plugins/plugins-types.js';

type CustomPlugin<T = any> = {
  name: string;
  fn: Plugin<T>;
  params?: T;
};

type PluginConfig =
  | keyof BuiltinsWithOptionalParams
  | {
      [Name in keyof BuiltinsWithOptionalParams]: {
        name: Name;
        params?: BuiltinsWithOptionalParams[Name];
      };
    }[keyof BuiltinsWithOptionalParams]
  | {
      [Name in keyof BuiltinsWithRequiredParams]: {
        name: Name;
        params: BuiltinsWithRequiredParams[Name];
      };
    }[keyof BuiltinsWithRequiredParams]
  | CustomPlugin;

export type Config = {
  /** Can be used by plugins, for example prefixids */
  path?: string;
  /** Pass over SVGs multiple times to ensure all optimizations are applied. */
  multipass?: boolean;
  /** Precision of floating point numbers. Will be passed to each plugin that supports this param. */
  floatPrecision?: number;
  /**
   * Plugins configuration
   * ['preset-default'] is default
   * Can also specify any builtin plugin
   * ['sortAttrs', { name: 'prefixIds', params: { prefix: 'my-prefix' } }]
   * Or custom
   * [{ name: 'myPlugin', fn: () => ({}) }]
   */
  plugins?: PluginConfig[];
  /** Options for rendering optimized SVG from AST. */
  js2svg?: StringifyOptions;
  /** Output as Data URI string. */
  datauri?: DataUri;
};

type Output = {
  data: string;
};

/** Installed version of SVGO. */
export declare const VERSION: string;

/** The core of SVGO */
export declare function optimize(input: string, config?: Config): Output;
