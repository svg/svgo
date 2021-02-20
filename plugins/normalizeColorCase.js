'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description
  = 'Makes colors consistent and more readable by making the letter case consistent';

/* Each can be {lower|upper|false} */
exports.params = {
  hex: 'lower',
  rgb: 'lower',
  hsl: 'lower',
  colorName: 'lower',
};

exports.fn = function (
  item, params
) {
  if ( typeof params === 'object' && item.isElem() ) {
    item.eachAttr( attrObj => {
      normalizeColor(
        attrObj,
        params
      );
    } );
  }
};

const colorTypes = [
  { name: 'hex', startsWith: '#' },
  { name: 'rgb' },
  { name: 'hsl' },
];
const {
  colorsNames: colorsLongNames,
  colorsShortNames,
  colorsProps,
} = require( './_collections.js' );
const colorsNames = Object.keys( colorsLongNames ).concat( Object.values( colorsShortNames ) );

/**
 * Takes any attribute and modifies it if it is a color
 * If config is not 'upper' or 'lower' it changes nothing
 *
 * @param {object} attrObj The attribute to normalize
 * @param {object} params The config for this plugin
 *
 * @example `#2eAf4F` => `#2EAF4F` | `#2eaf4f`
 * @example `rGb(...)` => `RGB(...)` | `rgb(...)`
 * @example `hsL(...)` => `HSL(...)` | `hsl(...)`
 *
 * @returns {void}
 */
function normalizeColor(
  attrObj, params
) {
  if ( colorsProps.includes( attrObj.name ) ) {
    const lowerAttr = attrObj.value.toLowerCase();

    if ( colorsNames.includes( lowerAttr.trim() ) ) {
      const wantedCase = params.colorName && params.colorName.toLowerCase();

      if ( wantedCase === 'upper' ) {
        attrObj.value = lowerAttr.toUpperCase();
      }
      else if ( wantedCase === 'lower' ) {
        attrObj.value = lowerAttr;
      }
    }
    else {
      for ( const colorType of colorTypes ) {
        const colorTypeName = colorType.name;
        const shouldStartWith = colorType.startsWith || colorTypeName;
        const wantedCase
          = params[ colorTypeName ] && params[ colorTypeName ].toLowerCase();

        if ( lowerAttr.trim().startsWith( shouldStartWith ) ) {
          if ( wantedCase === 'upper' ) {
            attrObj.value = lowerAttr.toUpperCase();
          }
          else if ( wantedCase === 'lower' ) {
            attrObj.value = lowerAttr;
          }

          break;
        }
      }
    }
  }
}
