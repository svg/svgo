import type { StringifyOptions, DataUri, Plugin as PluginFn } from './types';

type PluginDef = {
  name: string;
  fn: PluginFn<unknown>;
};

type Usage<T extends PluginDef> = {
  name: T['name'];
  params?: Parameters<T['fn']>[1];
};

type UsageReqParams<T extends PluginDef> = {
  name: T['name'];
  params: Parameters<T['fn']>[1];
};

type CustomPlugin = {
  name: string;
  fn: PluginFn<void>;
};

type DefaultPlugin =
  | Usage<typeof import('../plugins/cleanupAttrs.js')>
  | Usage<typeof import('../plugins/cleanupEnableBackground.js')>
  | Usage<typeof import('../plugins/cleanupIds.js')>
  | Usage<typeof import('../plugins/cleanupNumericValues.js')>
  | Usage<typeof import('../plugins/collapseGroups.js')>
  | Usage<typeof import('../plugins/convertColors.js')>
  | Usage<typeof import('../plugins/convertEllipseToCircle.js')>
  | Usage<typeof import('../plugins/convertPathData.js')>
  | Usage<typeof import('../plugins/convertShapeToPath.js')>
  | Usage<typeof import('../plugins/convertTransform.js')>
  | Usage<typeof import('../plugins/mergeStyles.js')>
  | Usage<typeof import('../plugins/inlineStyles.js')>
  | Usage<typeof import('../plugins/mergePaths.js')>
  | Usage<typeof import('../plugins/minifyStyles.js')>
  | Usage<typeof import('../plugins/moveElemsAttrsToGroup.js')>
  | Usage<typeof import('../plugins/moveGroupAttrsToElems.js')>
  | Usage<typeof import('../plugins/removeComments.js')>
  | Usage<typeof import('../plugins/removeDesc.js')>
  | Usage<typeof import('../plugins/removeDoctype.js')>
  | Usage<typeof import('../plugins/removeEditorsNSData.js')>
  | Usage<typeof import('../plugins/removeEmptyAttrs.js')>
  | Usage<typeof import('../plugins/removeEmptyContainers.js')>
  | Usage<typeof import('../plugins/removeEmptyText.js')>
  | Usage<typeof import('../plugins/removeHiddenElems.js')>
  | Usage<typeof import('../plugins/removeMetadata.js')>
  | Usage<typeof import('../plugins/removeNonInheritableGroupAttrs.js')>
  | Usage<typeof import('../plugins/removeTitle.js')>
  | Usage<typeof import('../plugins/removeUnknownsAndDefaults.js')>
  | Usage<typeof import('../plugins/removeUnusedNS.js')>
  | Usage<typeof import('../plugins/removeUselessDefs.js')>
  | Usage<typeof import('../plugins/removeUselessStrokeAndFill.js')>
  | Usage<typeof import('../plugins/removeViewBox.js')>
  | Usage<typeof import('../plugins/removeXMLProcInst.js')>
  | Usage<typeof import('../plugins/sortAttrs.js')>
  | Usage<typeof import('../plugins/sortDefsChildren.js')>;

type Overrides<T = DefaultPlugin> = T extends DefaultPlugin
  ? { [key in T['name']]?: T['params'] | false }
  : never;

type PresetDefault = {
  name: 'preset-default';
  params?: {
    floatPrecision?: number;
    /**
     * All default plugins can be customized or disabled here
     * for example
     * {
     *   sortAttrs: { xmlnsOrder: "alphabetical" },
     *   cleanupAttrs: false,
     * }
     */
    overrides?: Overrides;
  };
};

type BuiltinPluginWithOptionalParams =
  | DefaultPlugin
  | PresetDefault
  | Usage<typeof import('../plugins/cleanupListOfValues.js')>
  | Usage<typeof import('../plugins/convertStyleToAttrs.js')>
  | Usage<typeof import('../plugins/prefixIds.js')>
  | Usage<typeof import('../plugins/removeDimensions.js')>
  | Usage<typeof import('../plugins/removeOffCanvasPaths.js')>
  | Usage<typeof import('../plugins/removeRasterImages.js')>
  | Usage<typeof import('../plugins/removeScriptElement.js')>
  | Usage<typeof import('../plugins/removeStyleElement.js')>
  | Usage<typeof import('../plugins/removeXMLNS.js')>
  | Usage<typeof import('../plugins/reusePaths.js')>;

type BuiltinPluginWithRequiredParams =
  | UsageReqParams<typeof import('../plugins/addAttributesToSVGElement.js')>
  | UsageReqParams<typeof import('../plugins/addClassesToSVGElement.js')>
  | UsageReqParams<typeof import('../plugins/removeAttributesBySelector.js')>
  | UsageReqParams<typeof import('../plugins/removeAttrs.js')>
  | UsageReqParams<typeof import('../plugins/removeElementsByAttr.js')>;

type PluginConfig =
  | BuiltinPluginWithOptionalParams['name']
  | BuiltinPluginWithOptionalParams
  | BuiltinPluginWithRequiredParams
  | CustomPlugin;

export type Config = {
  /** Can be used by plugins, for example prefixids */
  path?: string;
  /** Pass over SVGs multiple times to ensure all optimizations are applied. */
  multipass?: boolean;
  /** Precision of floating point numbers. Will be passed to each plugin that suppors this param. */
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

/** The core of SVGO */
export declare function optimize(input: string, config?: Config): Output;

/**
 * If you write a tool on top of svgo you might need a way to load svgo config.
 *
 * You can also specify relative or absolute path and customize current working directory.
 */
export declare function loadConfig(
  configFile: string,
  cwd?: string
): Promise<Config>;
export declare function loadConfig(): Promise<Config | null>;
