'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description
  = "Normalizes all colors to have the required case.\nThis plugin doesn't validate values.";

/* Each can be {lower|upper|false} */
exports.params = {
  hex: 'lower',
  rgb: 'lower',
  hsl: 'lower',
};

const toCheck = [
  'fill',
  'stroke',
  'color',
];

exports.fn = function (
  item, params
) {
  if ( typeof params === 'object' && item.isElem() ) {
    for ( let i = 0; i < toCheck.length; i++ ) {
      const attr = toCheck[ i ];
      if ( item.hasAttr( attr ) ) {
        const origAttr = item.attr( attr );
        const normalizedAttr = normalizeColor(
          origAttr,
          params
        );

        if ( normalizedAttr && normalizedAttr !== origAttr.value ) {
          item.addAttr( {
            name: attr,
            local: attr,
            value: normalizedAttr,
            prefix: '',
          } );
        }
      }
    }
  }
};

const colorTypes = [
  { name: 'hex', startsWith: '#' },
  { name: 'rgb' },
  { name: 'hsl' },
];

/**
 * Takes any color value and returns the color in the correct case based on the config.
 * Returns false if config says to ignore color type
 * If config is not 'upper' or 'false' it defaults to lower
 *
 * @param {object} attrObj The attr to normalize
 * @param {object} params The config for this plugin
 *
 * @example `#2eAf4F` => `#2EAF4F` | `#2eaf4f`
 * @example `rGb(...)` => `RGB(...)` | `rgb(...)`
 * @example `hsL(...)` => `HSL(...)` | `hsl(...)`
 *
 * @returns {string|boolean} String like in examples or false if config says to ignore color type
 */
function normalizeColor(
  attrObj, params
) {
  const trimmedColor = attrObj.value.trim().toLowerCase();

  for ( let i = 0; i < colorTypes.length; i++ ) {
    const name = colorTypes[ i ].name;
    const startsWith = colorTypes[ i ].startsWith || name;

    if ( trimmedColor.startsWith( startsWith ) ) {
      if ( params[ name ].toLowerCase() === 'upper' ) {
        return trimmedColor.toUpperCase();
      }
      if ( params[ name ].toLowerCase() === 'lower' ) {
        return trimmedColor;
      }
      return false;
    }
  }

  return false;
}
