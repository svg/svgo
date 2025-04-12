import type {
  StringifyOptions,
  DataUri,
  Plugin,
  XastChild,
  XastNode,
} from './types.js';
import type {
  BuiltinsWithOptionalParams,
  BuiltinsWithRequiredParams,
  PluginsParams,
} from '../plugins/plugins-types.js';

export type CustomPlugin<T = any> = {
  name: string;
  fn: Plugin<T>;
  params?: T;
};

export type PluginConfig =
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

export type BuiltinPluginOrPreset<Name, Params> = BuiltinPlugin<
  Name,
  Params
> & {
  /** If the plugin is itself a preset that invokes other plugins. */
  isPreset: true | undefined;
  /**
   * If the plugin is a preset that invokes other plugins, this returns an
   * array of the plugins in the preset in the order that they are invoked.
   */
  plugins?: Readonly<BuiltinPlugin<string, Object>[]>;
};

/**
 * Plugins that are bundled with SVGO. This includes plugin presets, and plugins
 * that are not enabled by default.
 */
export declare const builtinPlugins: Array<
  {
    [Name in keyof PluginsParams]: BuiltinPluginOrPreset<
      Name,
      PluginsParams[Name]
    >;
  }[keyof PluginsParams]
>;

export type Config = {
  /** Can be used by plugins, for example prefixIds */
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

export type Output = {
  data: string;
};

export declare const _collections: {
  elemsGroups: Readonly<Record<string, Set<string>>>;
  /**
   * Elements where adding or removing whitespace may affect rendering, metadata,
   * or semantic meaning.
   *
   * @see https://developer.mozilla.org/docs/Web/HTML/Element/pre
   */
  textElems: Readonly<Set<string>>;
  pathElems: Readonly<Set<string>>;
  /**
   * @see https://www.w3.org/TR/SVG11/intro.html#Definitions
   */
  attrsGroups: Readonly<Record<string, Set<string>>>;
  attrsGroupsDefaults: Readonly<Record<string, Record<string, string>>>;
  /**
   * @see https://www.w3.org/TR/SVG11/intro.html#Definitions
   */
  attrsGroupsDeprecated: Readonly<
    Record<string, { safe?: Set<string>; unsafe?: Set<string> }>
  >;
  /**
   * @see https://www.w3.org/TR/SVG11/eltindex.html
   */
  elems: Readonly<
    Record<
      string,
      {
        attrsGroups: Set<string>;
        attrs?: Set<string>;
        defaults?: Record<string, string>;
        deprecated?: {
          safe?: Set<string>;
          unsafe?: Set<string>;
        };
        contentGroups?: Set<string>;
        content?: Set<string>;
      }
    >
  >;
  /**
   * @see https://wiki.inkscape.org/wiki/index.php/Inkscape-specific_XML_attributes
   */
  editorNamespaces: Readonly<Set<string>>;
  /**
   * @see https://www.w3.org/TR/SVG11/linking.html#processingIRI
   */
  referencesProps: Readonly<Set<string>>;
  /**
   * @see https://www.w3.org/TR/SVG11/propidx.html
   */
  inheritableAttrs: Readonly<Set<string>>;
  presentationNonInheritableGroupAttrs: Readonly<Set<string>>;
  /**
   * @see https://www.w3.org/TR/SVG11/single-page.html#types-ColorKeywords
   */
  colorsNames: Readonly<Record<string, string>>;
  colorsShortNames: Readonly<Record<string, string>>;
  /**
   * @see https://www.w3.org/TR/SVG11/single-page.html#types-DataTypeColor
   */
  colorsProps: Readonly<Set<string>>;
  /**
   * @see https://developer.mozilla.org/docs/Web/CSS/Pseudo-classes
   */
  pseudoClasses: Readonly<Record<string, Set<string>>>;
};

export type * from './types.d.ts';

/** Installed version of SVGO. */
export declare const VERSION: string;

/** The core of SVGO */
export declare function optimize(input: string, config?: Config): Output;

/**
 * @param node Element to query the children of.
 * @param selector CSS selector string.
 * @returns First match, or null if there was no match.
 */
export declare function querySelector(
  node: XastNode,
  selector: string,
): XastChild | null;

/**
 * @param node Element to query the children of.
 * @param selector CSS selector string.
 * @returns All matching elements.
 */
export declare function querySelectorAll(
  node: XastNode,
  selector: string,
): XastChild[];
