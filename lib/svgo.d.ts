import type { StringifyOptions, DataUri, Plugin as PluginFn } from './types';
import type {
  BuiltinsWithOptionalParams,
  BuiltinsWithRequiredParams,
} from '../plugins/plugins-types';

type CustomPlugin = {
  name: string;
  fn: PluginFn<void>;
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

type AssetTypes =
  | 'ICON_REGULAR'
  | 'ICON_COLOR'
  | 'LOGO'
  | 'ILLUSTRATION'
  | 'AVATAR'
  | 'FLAG'
  | 'DOCUMENT'
  | 'ANIMATION';

type ValidationResult = {
  isSnakeCase?: boolean;
  isArtboardCorrect?: boolean;
  isWorkingAreaCorrect?: boolean;
  isCorrectSvg?: boolean;
  isJSON?: boolean;
  hasNoColorSuffix?: boolean;
  hasNoDiacriticCharacters?: boolean;
  isSuffixPresent?: boolean;
  isText?: boolean;
  areLayersIDsOrderCorrect?: boolean;
  elementsLimitation?: boolean;
  isISO3166_1Alpha2?: boolean;
  hasNoAttribute?: boolean;
  hasCorrectStripeColors?: boolean;
  isPdf?: boolean;
  isSVG?: boolean;
  hasUniqueName?: boolean;
  validationError?: boolean;
};

/**
 * Validates svg file
 *
 * @param {ArrayBuffer | string} input array buffer or base64 svg.
 * @param {string} filename Name of the asset file.
 * @param {AssetTypes} type Type of the asset.
 * @returns {ValidationResult} The resulting state of validated asset.
 */
export declare function validate(
  input: ArrayBuffer | string,
  filename: string,
  type: AssetTypes
): ValidationResult;

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

/**
 * Parses svg file to js object
 *
 * @param {data} string An array of numbers to add.
 * @param {from} string An array of numbers to add.
 * @returns {XastRoot} The resulting sum of all the numbers.
 */
export declare function parseSvg(data: string, from?: string): XastRoot;
