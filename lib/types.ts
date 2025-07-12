import { AddAttributesToSVGElementParams } from '../plugins/addAttributesToSVGElement.js';
import { AddClassesToSVGElementParams } from '../plugins/addClassesToSVGElement.js';
import { CleanupAttrsParams } from '../plugins/cleanupAttrs.js';
import { CleanupIdsParams } from '../plugins/cleanupIds.js';
import { CleanupListOfValuesParams } from '../plugins/cleanupListOfValues.js';
import { CleanupNumericValuesParams } from '../plugins/cleanupNumericValues.js';
import { ConvertColorsParams } from '../plugins/convertColors.js';
import { ConvertPathDataParams } from '../plugins/convertPathData.js';
import { ConvertShapeToPathParams } from '../plugins/convertShapeToPath.js';
import { ConvertStyleToAttrsParams } from '../plugins/convertStyleToAttrs.js';
import { ConvertTransformParams } from '../plugins/convertTransform.js';
import { InlineStylesParams } from '../plugins/inlineStyles.js';
import { MergePathsParams } from '../plugins/mergePaths.js';
import { MinifyStylesParams } from '../plugins/minifyStyles.js';
import { PrefixIdsParams } from '../plugins/prefixIds.js';
import { RemoveAttrsParams } from '../plugins/removeAttrs.js';
import { RemoveCommentsParams } from '../plugins/removeComments.js';
import { RemoveDeprecatedAttrsParams } from '../plugins/removeDeprecatedAttrs.js';
import { RemoveDescParams } from '../plugins/removeDesc.js';
import { RemoveEditorsNSDataParams } from '../plugins/removeEditorsNSData.js';
import { RemoveElementsByAttrParams } from '../plugins/removeElementsByAttr.js';
import { RemoveEmptyTextParams } from '../plugins/removeEmptyText.js';
import { RemoveHiddenElemsParams } from '../plugins/removeHiddenElems.js';
import { RemoveUnknownsAndDefaultsParams } from '../plugins/removeUnknownsAndDefaults.js';
import { RemoveUselessStrokeAndFillParams } from '../plugins/removeUselessStrokeAndFill.js';
import { RemoveXlinkParams } from '../plugins/removeXlink.js';
import { SortAttrsParams } from '../plugins/sortAttrs.js';

export type DefaultPlugins = {
  cleanupAttrs: CleanupAttrsParams;
  cleanupEnableBackground: null;
  cleanupIds: CleanupIdsParams;
  cleanupNumericValues: CleanupNumericValuesParams;
  collapseGroups: null;
  convertColors: ConvertColorsParams;
  convertEllipseToCircle: null;
  convertPathData: ConvertPathDataParams;
  convertShapeToPath: ConvertShapeToPathParams;
  convertTransform: ConvertTransformParams;
  mergeStyles: null;
  inlineStyles: InlineStylesParams;
  mergePaths: MergePathsParams;
  minifyStyles: MinifyStylesParams;
  moveElemsAttrsToGroup: null;
  moveGroupAttrsToElems: null;
  removeComments: RemoveCommentsParams;
  removeDeprecatedAttrs: RemoveDeprecatedAttrsParams;
  removeDesc: RemoveDescParams;
  removeDoctype: null;
  removeEditorsNSData: RemoveEditorsNSDataParams;
  removeEmptyAttrs: null;
  removeEmptyContainers: null;
  removeEmptyText: RemoveEmptyTextParams;
  removeHiddenElems: RemoveHiddenElemsParams;
  removeMetadata: null;
  removeNonInheritableGroupAttrs: null;
  removeUnknownsAndDefaults: RemoveUnknownsAndDefaultsParams;
  removeUnusedNS: null;
  removeUselessDefs: null;
  removeUselessStrokeAndFill: RemoveUselessStrokeAndFillParams;
  removeXMLProcInst: null;
  sortAttrs: SortAttrsParams;
  sortDefsChildren: null;
};

export type PresetDefaultOverrides = {
  [Name in keyof DefaultPlugins]?: DefaultPlugins[Name] | false;
};

export type BuiltinsWithOptionalParams = DefaultPlugins & {
  'preset-default': {
    floatPrecision?: number;
    /**
     * All default plugins can be customized or disabled here
     * for example
     * {
     *   sortAttrs: { xmlnsOrder: "alphabetical" },
     *   cleanupAttrs: false,
     * }
     */
    overrides?: PresetDefaultOverrides;
  };
  cleanupListOfValues: CleanupListOfValuesParams;
  convertOneStopGradients: null;
  convertStyleToAttrs: ConvertStyleToAttrsParams;
  prefixIds: PrefixIdsParams;
  removeDimensions: null;
  removeOffCanvasPaths: null;
  removeRasterImages: null;
  removeScripts: null;
  removeStyleElement: null;
  removeTitle: null;
  removeViewBox: null;
  removeXlink: RemoveXlinkParams;
  removeXMLNS: null;
  reusePaths: null;
};

export type BuiltinsWithRequiredParams = {
  addAttributesToSVGElement: AddAttributesToSVGElementParams;
  addClassesToSVGElement: AddClassesToSVGElementParams;
  removeAttributesBySelector: any;
  removeAttrs: RemoveAttrsParams;
  removeElementsByAttr: RemoveElementsByAttrParams;
};

export type PluginsParams = BuiltinsWithOptionalParams &
  BuiltinsWithRequiredParams;

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

export type BuiltinPlugin<Name extends string, Params> = {
  /** Name of the plugin, also known as the plugin ID. */
  name: Name;
  description?: string;
  fn: Plugin<Params>;
};

export type BuiltinPluginOrPreset<Name extends string, Params> = BuiltinPlugin<
  Name,
  Params
> & {
  /** If the plugin is itself a preset that invokes other plugins. */
  isPreset?: true;
  /**
   * If the plugin is a preset that invokes other plugins, this returns an
   * array of the plugins in the preset in the order that they are invoked.
   */
  plugins?: ReadonlyArray<BuiltinPlugin<string, Object>>;
};

export type XastDoctype = {
  type: 'doctype';
  name: string;
  data: {
    doctype: string;
  };
};

export type XastInstruction = {
  type: 'instruction';
  name: string;
  value: string;
};

export type XastComment = {
  type: 'comment';
  value: string;
};

export type XastCdata = {
  type: 'cdata';
  value: string;
};

export type XastText = {
  type: 'text';
  value: string;
};

export type XastElement = {
  type: 'element';
  name: string;
  attributes: Record<string, string>;
  children: XastChild[];
};

export type XastChild =
  | XastDoctype
  | XastInstruction
  | XastComment
  | XastCdata
  | XastText
  | XastElement;

export type XastRoot = {
  type: 'root';
  children: XastChild[];
};

export type XastParent = XastRoot | XastElement;

export type XastNode = XastRoot | XastChild;

export type StringifyOptions = {
  doctypeStart?: string;
  doctypeEnd?: string;
  procInstStart?: string;
  procInstEnd?: string;
  tagOpenStart?: string;
  tagOpenEnd?: string;
  tagCloseStart?: string;
  tagCloseEnd?: string;
  tagShortStart?: string;
  tagShortEnd?: string;
  attrStart?: string;
  attrEnd?: string;
  commentStart?: string;
  commentEnd?: string;
  cdataStart?: string;
  cdataEnd?: string;
  textStart?: string;
  textEnd?: string;
  indent?: number | string;
  regEntities?: RegExp;
  regValEntities?: RegExp;
  encodeEntity?: (char: string) => string;
  pretty?: boolean;
  useShortTags?: boolean;
  eol?: 'lf' | 'crlf';
  finalNewline?: boolean;
};

export type VisitorNode<Node> = {
  enter?: (node: Node, parentNode: XastParent) => void | symbol;
  exit?: (node: Node, parentNode: XastParent) => void;
};

export type VisitorRoot = {
  enter?: (node: XastRoot, parentNode: null) => void;
  exit?: (node: XastRoot, parentNode: null) => void;
};

export type Visitor = {
  doctype?: VisitorNode<XastDoctype>;
  instruction?: VisitorNode<XastInstruction>;
  comment?: VisitorNode<XastComment>;
  cdata?: VisitorNode<XastCdata>;
  text?: VisitorNode<XastText>;
  element?: VisitorNode<XastElement>;
  root?: VisitorRoot;
};

export type PluginInfo = {
  path?: string;
  multipassCount: number;
};

export type Plugin<P = null> = (
  root: XastRoot,
  params: P,
  info: PluginInfo,
) => Visitor | null | void;

export type Specificity = [number, number, number];

export type StylesheetDeclaration = {
  name: string;
  value: string;
  important: boolean;
};

export type StylesheetRule = {
  dynamic: boolean;
  selector: string;
  specificity: Specificity;
  declarations: StylesheetDeclaration[];
};

export type Stylesheet = {
  rules: StylesheetRule[];
  parents: Map<XastElement, XastParent>;
};

export type StaticStyle = {
  type: 'static';
  inherited: boolean;
  value: string;
};

export type DynamicStyle = {
  type: 'dynamic';
  inherited: boolean;
};

export type ComputedStyles = Record<string, StaticStyle | DynamicStyle>;

export type PathDataCommand =
  | 'M'
  | 'm'
  | 'Z'
  | 'z'
  | 'L'
  | 'l'
  | 'H'
  | 'h'
  | 'V'
  | 'v'
  | 'C'
  | 'c'
  | 'S'
  | 's'
  | 'Q'
  | 'q'
  | 'T'
  | 't'
  | 'A'
  | 'a';

export type PathDataItem = {
  command: PathDataCommand;
  args: number[];
};

export type DataUri = 'base64' | 'enc' | 'unenc';

export type Config = {
  /** Can be used by plugins, for example prefixIds. */
  path?: string;
  /** Pass over SVGs multiple times to ensure all optimizations are applied. */
  multipass?: boolean;
  /**
   * Precision of floating point numbers. Will be passed to each plugin that
   * supports this param.
   */
  floatPrecision?: number;
  /**
   * Plugins configuration. By default SVGO uses `preset-default`, but may
   * contain builtin or custom plugins.
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
