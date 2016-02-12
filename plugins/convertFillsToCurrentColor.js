'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'replaces coloured fills with "currentColor"';

function parseColourString(s) {

 var m = s.match(/^\#|^rgb\(|[\d\w]+$|\d{3}/g);
 var value, values;
 var valid = true, double = false;

 // If no matches, return false
 if (!m) return false;

 // If hex value
 if (m.length < 3) {
   // Get the value
   value = m[m.length-1];

   // Split into parts, either x,x,x or xx,xx,xx
   values = value.length == 3? double = true && value.split('') : value.match(/../g);

   // Convert to decimal values - if #nnn, double up on values 345 => 334455
   values.forEach(function(v,i){values[i] = parseInt(double? ''+v+v : v, 16);});

 // Otherwise it's rgb, get the values
 } else {
   values = m.length == 3? m.slice() : m.slice(1);
 }

 // Check that each value is between 0 and 255 inclusive and return the result
 values.forEach(function(v){valid = valid? v >= 0 && v <= 255 : false;});

 // If string is invalid, return false, otherwise return an array of the values
 return valid && values;
}


/**
 * Reassign coloured fills to "currentColor" so you can style them
 * with the CSS "color" property.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, fills will not get replaced
 *
 * @author @doot0
 */
exports.fn = function(item) {

    if (item.elem) {

        item.eachAttr(function(attr) {

            if (attr.name === 'fill'){
              if( parseColourString(attr.value) !== false ) {
                attr.value = 'currentColor';
              }
            }

        });

    }

};
