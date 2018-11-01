'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'embeds linked images as base64 data URIs (disabled by default)';

var path = require('path'),
    fs = require('fs'),
    dataUriPattern = /^data:image\/[^,;]+(;charset=[^;,]*)?(;base64)?,/,
    imageURIs = {
        'svg': 'svg+xml',
        'png': 'png',
        'jpg': 'jpeg',
        'gif': 'gif'
        };

/**
 * Replace linked images with data URIs to make the SVG portable (standalone)
 * and usuable with HTML's <img> tag.
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=628747
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @param {Object} info information about input SVG
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Peter Jonas (shoogle)
 */
exports.fn = function(item, params, info) {

    if (item.isElem('image')) {

        var attrHref = item.attrLocal('href');

        if (
            attrHref !== undefined &&
            !dataUriPattern.test(attrHref.value)
        ) {
            var svgDir; // link paths relative to SVG location
            if (info.path !== undefined)
                svgDir = path.dirname(info.path);
            else
                svgDir = '.'; // SVGs passed though STDIN have no location
            var imgPath = path.resolve(svgDir, attrHref.value);
            var extension = path.extname(imgPath).substring(1).toLowerCase();
            if (extension in imageURIs) {
                try {
                    var data = fs.readFileSync(imgPath).toString('base64');
                    var prefix = 'data:image/' + imageURIs[extension] + ';base64,';
                    attrHref.value = prefix + data;
                } catch (err) {
                    console.warn('Warning: ' + err.message);
                }
            } else {
                console.warn(`Warning: '.${extension}' is not a supported image extension.`);
            }
        }
    }

};
