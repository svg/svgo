import type { StringifyOptions, DataUri, Plugin } from './types.js';
import type {
  BuiltinsWithOptionalParams,
  BuiltinsWithRequiredParams,
  PluginsParams,
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

type BuiltinPlugin<Name, Params> = {
  /** Name of the plugin, also known as the plugin ID. */
  name: Name;
  description?: string;
  fn: Plugin<Params>;
};

/**
 * Plugins that are bundled with SVGO. This includes plugin presets, and plugins
 * that are not enabled by default.
 */
export declare const builtinPlugins: Array<
  {
    [Name in keyof PluginsParams]: BuiltinPlugin<Name, PluginsParams[Name]> & {
      /** If the plugin is itself a preset that invokes other plugins. */
      isPreset: true | undefined;
      /**
       * If the plugin is a preset that invokes other plugins, this returns an
       * array of the plugins in the preset in the order that they are invoked.
       */
      plugins?: BuiltinPlugin<unknown, unknown>[];
    };
  }[keyof PluginsParams]
>;

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
