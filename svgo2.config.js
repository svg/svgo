'use strict'

const { extendDefaultPlugins } = require('svgo')
console.log('fuck');
throw Error('fuck');

module.exports = {
  multipass: true,
  js2svg: {
    pretty: true,
    indent: 2
  },
  plugins: [
    /*
    {
      name: 'cleanupAttrs'
    },
    {
      name: 'cleanupEnableBackground'
    },
    {
      name: 'cleanupIDs'
    },
    {
      name: 'cleanupListOfValues'
    },
    {
      name: 'cleanupNumericValues'
    },
    {
      name: 'collapseGroups'
    },
    {
      name: 'convertColors'
    },
    {
      name: 'convertPathData',
      params: {
        noSpaceAfterFlags: false
      }
    },
    {
      name: 'convertShapeToPath'
    },
    {
      name: 'convertStyleToAttrs'
    },
    {
      name: 'convertTransform'
    },
    {
      name: 'inlineStyles'
    },
    {
      name: 'mergePaths',
      params: {
        noSpaceAfterFlags: false
      }
    },
    {
      name: 'minifyStyles'
    },
    {
      name: 'moveElemsAttrsToGroup'
    },
    {
      name: 'moveGroupAttrsToElems'
    },
    {
      name: 'removeAttrs',
      params: {
        attrs: [
          'data-name',
          'fill',
          'clip-rule'
        ]
      }
    },
    {
      name: 'removeComments'
    },
    {
      name: 'removeDesc'
    },
    {
      name: 'removeDoctype'
    },
    {
      name: 'removeEditorsNSData'
    },
    {
      name: 'removeEmptyAttrs'
    },
    {
      name: 'removeEmptyContainers'
    },
    {
      name: 'removeEmptyText'
    },
    {
      name: 'removeHiddenElems'
    },
    {
      name: 'removeMetadata'
    },
    {
      name: 'removeNonInheritableGroupAttrs'
    },
    {
      name: 'removeTitle'
    },
    {
      name: 'removeUnknownsAndDefaults',
      params: {
        keepRoleAttr: true
      }
    },
    {
      name: 'removeUnusedNS'
    },
    {
      name: 'removeUselessDefs'
    },
    {
      name: 'removeUselessStrokeAndFill'
    },
    */
    {
      name: 'removeViewBox',
    },
    /*
    {
      name: 'removeXMLNS',
      active: false
    },
    {
      name: 'removeXMLProcInst'
    },
    {
      name: 'sortAttrs'
    }
    */
  ]
}
