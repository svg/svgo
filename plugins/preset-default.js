import { createPreset } from '../lib/svgo/plugins.js';
import * as removeDoctype from './removeDoctype.js';
import * as removeXMLProcInst from './removeXMLProcInst.js';
import * as removeComments from './removeComments.js';
import * as removeDeprecatedAttrs from './removeDeprecatedAttrs.js';
import * as removeMetadata from './removeMetadata.js';
import * as removeEditorsNSData from './removeEditorsNSData.js';
import * as cleanupAttrs from './cleanupAttrs.js';
import * as mergeStyles from './mergeStyles.js';
import * as inlineStyles from './inlineStyles.js';
import * as minifyStyles from './minifyStyles.js';
import * as cleanupIds from './cleanupIds.js';
import * as removeUselessDefs from './removeUselessDefs.js';
import * as cleanupNumericValues from './cleanupNumericValues.js';
import * as convertColors from './convertColors.js';
import * as removeUnknownsAndDefaults from './removeUnknownsAndDefaults.js';
import * as removeNonInheritableGroupAttrs from './removeNonInheritableGroupAttrs.js';
import * as removeUselessStrokeAndFill from './removeUselessStrokeAndFill.js';
import * as cleanupEnableBackground from './cleanupEnableBackground.js';
import * as removeHiddenElems from './removeHiddenElems.js';
import * as removeEmptyText from './removeEmptyText.js';
import * as convertShapeToPath from './convertShapeToPath.js';
import * as convertEllipseToCircle from './convertEllipseToCircle.js';
import * as moveElemsAttrsToGroup from './moveElemsAttrsToGroup.js';
import * as moveGroupAttrsToElems from './moveGroupAttrsToElems.js';
import * as collapseGroups from './collapseGroups.js';
import * as convertPathData from './convertPathData.js';
import * as convertTransform from './convertTransform.js';
import * as removeEmptyAttrs from './removeEmptyAttrs.js';
import * as removeEmptyContainers from './removeEmptyContainers.js';
import * as mergePaths from './mergePaths.js';
import * as removeUnusedNS from './removeUnusedNS.js';
import * as sortAttrs from './sortAttrs.js';
import * as sortDefsChildren from './sortDefsChildren.js';
import * as removeDesc from './removeDesc.js';

const presetDefault = createPreset({
  name: 'preset-default',
  plugins: [
    removeDoctype,
    removeXMLProcInst,
    removeComments,
    removeDeprecatedAttrs,
    removeMetadata,
    removeEditorsNSData,
    cleanupAttrs,
    mergeStyles,
    inlineStyles,
    minifyStyles,
    cleanupIds,
    removeUselessDefs,
    cleanupNumericValues,
    convertColors,
    removeUnknownsAndDefaults,
    removeNonInheritableGroupAttrs,
    removeUselessStrokeAndFill,
    cleanupEnableBackground,
    removeHiddenElems,
    removeEmptyText,
    convertShapeToPath,
    convertEllipseToCircle,
    moveElemsAttrsToGroup,
    moveGroupAttrsToElems,
    collapseGroups,
    convertPathData,
    convertTransform,
    removeEmptyAttrs,
    removeEmptyContainers,
    mergePaths,
    removeUnusedNS,
    sortAttrs,
    sortDefsChildren,
    removeDesc,
  ],
});

export default presetDefault;
