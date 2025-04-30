import type { AddAttributesToSVGElementParams } from './addAttributesToSVGElement.js';
import type { AddClassesToSVGElementParams } from './addClassesToSVGElement.js';
import type { CleanupAttrsParams } from './cleanupAttrs.js';
import type { CleanupIdsParams } from './cleanupIds.js';
import type { CleanupListOfValuesParams } from './cleanupListOfValues.js';
import type { CleanupNumericValuesParams } from './cleanupNumericValues.js';
import type { ConvertColorsParams } from './convertColors.js';
import type { ConvertPathDataParams } from './convertPathData.js';
import type { ConvertShapeToPathParams } from './convertShapeToPath.js';
import type { ConvertStyleToAttrsParams } from './convertStyleToAttrs.js';
import type { ConvertTransformParams } from './convertTransform.js';
import type { InlineStylesParams } from './inlineStyles.js';
import type { MergePathsParams } from './mergePaths.js';
import type { MinifyStylesParams } from './minifyStyles.js';
import type { PrefixIdsParams } from './prefixIds.js';
import type { RemoveAttrsParams } from './removeAttrs.js';
import type { RemoveCommentsParams } from './removeComments.js';
import type { RemoveDeprecatedAttrsParams } from './removeDeprecatedAttrs.js';
import type { RemoveDescParams } from './removeDesc.js';
import type { RemoveEditorsNSDataParams } from './removeEditorsNSData.js';
import type { RemoveElementsByAttrParams } from './removeElementsByAttr.js';
import type { RemoveEmptyTextParams } from './removeEmptyText.js';
import type { RemoveHiddenElemsParams } from './removeHiddenElems.js';
import type { RemoveUnknownsAndDefaultsParams } from './removeUnknownsAndDefaults.js';
import type { RemoveUselessStrokeAndFillParams } from './removeUselessStrokeAndFill.js';
import type { RemoveXlinkParams } from './removeXlink.js';
import type { SortAttrsParams } from './sortAttrs.js';

type DefaultPlugins = {
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

type PresetDefaultOverrides = {
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
