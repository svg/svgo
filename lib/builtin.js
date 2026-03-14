import presetDefault from '../plugins/preset-default.js';
import * as addAttributesToSVGElement from '../plugins/addAttributesToSVGElement.js';
import * as addClassesToSVGElement from '../plugins/addClassesToSVGElement.js';
import * as cleanupAttrs from '../plugins/cleanupAttrs.js';
import * as cleanupEnableBackground from '../plugins/cleanupEnableBackground.js';
import * as cleanupIds from '../plugins/cleanupIds.js';
import * as cleanupListOfValues from '../plugins/cleanupListOfValues.js';
import * as cleanupNumericValues from '../plugins/cleanupNumericValues.js';
import * as collapseGroups from '../plugins/collapseGroups.js';
import * as convertColors from '../plugins/convertColors.js';
import * as convertEllipseToCircle from '../plugins/convertEllipseToCircle.js';
import * as convertOneStopGradients from '../plugins/convertOneStopGradients.js';
import * as convertPathData from '../plugins/convertPathData.js';
import * as convertShapeToPath from '../plugins/convertShapeToPath.js';
import * as convertStyleToAttrs from '../plugins/convertStyleToAttrs.js';
import * as convertTransform from '../plugins/convertTransform.js';
import * as mergeStyles from '../plugins/mergeStyles.js';
import * as inlineStyles from '../plugins/inlineStyles.js';
import * as mergePaths from '../plugins/mergePaths.js';
import * as minifyStyles from '../plugins/minifyStyles.js';
import * as moveElemsAttrsToGroup from '../plugins/moveElemsAttrsToGroup.js';
import * as moveGroupAttrsToElems from '../plugins/moveGroupAttrsToElems.js';
import * as prefixIds from '../plugins/prefixIds.js';
import * as removeAttributesBySelector from '../plugins/removeAttributesBySelector.js';
import * as removeAttrs from '../plugins/removeAttrs.js';
import * as removeComments from '../plugins/removeComments.js';
import * as removeDeprecatedAttrs from '../plugins/removeDeprecatedAttrs.js';
import * as removeDesc from '../plugins/removeDesc.js';
import * as removeDimensions from '../plugins/removeDimensions.js';
import * as removeDoctype from '../plugins/removeDoctype.js';
import * as removeEditorsNSData from '../plugins/removeEditorsNSData.js';
import * as removeElementsByAttr from '../plugins/removeElementsByAttr.js';
import * as removeEmptyAttrs from '../plugins/removeEmptyAttrs.js';
import * as removeEmptyContainers from '../plugins/removeEmptyContainers.js';
import * as removeEmptyText from '../plugins/removeEmptyText.js';
import * as removeHiddenElems from '../plugins/removeHiddenElems.js';
import * as removeMetadata from '../plugins/removeMetadata.js';
import * as removeNonInheritableGroupAttrs from '../plugins/removeNonInheritableGroupAttrs.js';
import * as removeOffCanvasPaths from '../plugins/removeOffCanvasPaths.js';
import * as removeRasterImages from '../plugins/removeRasterImages.js';
import * as removeScripts from '../plugins/removeScripts.js';
import * as removeStyleElement from '../plugins/removeStyleElement.js';
import * as removeTitle from '../plugins/removeTitle.js';
import * as removeUnknownsAndDefaults from '../plugins/removeUnknownsAndDefaults.js';
import * as removeUnusedNS from '../plugins/removeUnusedNS.js';
import * as removeUselessDefs from '../plugins/removeUselessDefs.js';
import * as removeUselessStrokeAndFill from '../plugins/removeUselessStrokeAndFill.js';
import * as removeViewBox from '../plugins/removeViewBox.js';
import * as removeXlink from '../plugins/removeXlink.js';
import * as removeXMLNS from '../plugins/removeXMLNS.js';
import * as removeXMLProcInst from '../plugins/removeXMLProcInst.js';
import * as reusePaths from '../plugins/reusePaths.js';
import * as sortAttrs from '../plugins/sortAttrs.js';
import * as sortDefsChildren from '../plugins/sortDefsChildren.js';

/**
 * Plugins that are bundled with SVGO. This includes plugin presets, and plugins
 * that are not enabled by default.
 *
 * @type {ReadonlyArray<{[Name in keyof import('./types.js').PluginsParams]: import('./types.js').BuiltinPluginOrPreset<Name, import('./types.js').PluginsParams[Name]>;}[keyof import('./types.js').PluginsParams]>}
 */
export const builtinPlugins = Object.freeze([
  presetDefault,
  addAttributesToSVGElement,
  addClassesToSVGElement,
  cleanupAttrs,
  cleanupEnableBackground,
  cleanupIds,
  cleanupListOfValues,
  cleanupNumericValues,
  collapseGroups,
  convertColors,
  convertEllipseToCircle,
  convertOneStopGradients,
  convertPathData,
  convertShapeToPath,
  convertStyleToAttrs,
  convertTransform,
  inlineStyles,
  mergePaths,
  mergeStyles,
  minifyStyles,
  moveElemsAttrsToGroup,
  moveGroupAttrsToElems,
  prefixIds,
  removeAttributesBySelector,
  removeAttrs,
  removeComments,
  removeDeprecatedAttrs,
  removeDesc,
  removeDimensions,
  removeDoctype,
  removeEditorsNSData,
  removeElementsByAttr,
  removeEmptyAttrs,
  removeEmptyContainers,
  removeEmptyText,
  removeHiddenElems,
  removeMetadata,
  removeNonInheritableGroupAttrs,
  removeOffCanvasPaths,
  removeRasterImages,
  removeScripts,
  removeStyleElement,
  removeTitle,
  removeUnknownsAndDefaults,
  removeUnusedNS,
  removeUselessDefs,
  removeUselessStrokeAndFill,
  removeViewBox,
  removeXlink,
  removeXMLNS,
  removeXMLProcInst,
  reusePaths,
  sortAttrs,
  sortDefsChildren,
]);
