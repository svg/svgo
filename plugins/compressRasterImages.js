'use strict';
const path = require('path');
const fs = require('fs');
const { tmpdir } = require('os');

const execa = require('execa');
const ect = require('ect-bin');

exports.type = 'perItem';

exports.active = false;

exports.description = 'lossless compress raster images (disabled by default)';

/**
 * @typedef {Object} compressRasterImagesOptions
 * @property {string} optimizationLevel - set to 1-9 based on level of compression require (higher the number better the compression)
 */
exports.params = {
    optimizationLevel: '3'
}

/**
 * compress raster images references in <image>.
 *
 * @param {Object} item current iteration item
 * @param {Object} params current iteration item
 *
 * @author CT1994
 */
exports.fn = function (item, params) {
    validateParams(params);

    if (
        item.isElem('image') &&
        item.hasAttrLocal('href', /(\.|image\/)(jpg|png)/)
    ) {
        const imgData = getImgData(item.attrs['xlink:href'].value);
        const tmpImgPath = path.join(tmpdir(), randomStringGenerator() + imgData.extname);
        base64ToImage(imgData, tmpImgPath);

        runCompression(tmpImgPath, params);
        const compressedBase64 = imageToBase64(tmpImgPath, imgData.extname);
        item.attrs['xlink:href'].value = compressedBase64;
    }

};

/**
 * validate params before running plugin
 * @param {compressRasterImagesOptions} params 
 */
function validateParams(params) {
    if (params.optimizationLevel >= 1 && params.optimizationLevel <= 9) {
        // optimizationLevel passed test
    }
    else {
        throw new Error('optimizationLevel should be a value 1 to 9');
    }
}

/**
 * @param {string} imgPath - path to image 
 * @param {string} extname - extension name of file type
 */
function imageToBase64(imgPath, extname) {
    const imgBuffer = fs.readFileSync(imgPath);
    return 'data:image/' + extname + ';base64,' + imgBuffer.toString('base64');
}

/**
 * @param {imgData} result 
 * @param {string} imgPath 
 */
function base64ToImage(result, imgPath) {
    fs.writeFileSync(imgPath, result.base64, { encoding: 'base64' });
}

/**
 * @returns {string}
 */
function randomStringGenerator() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * @typedef {Object} imgData
 * @property {string} extname - extension type of base64 image
 * @property {string} base64
 */

/**
 * @param {string} data
 * @returns {imgData} 
 */
function getImgData(data) {
    const reg = /^data:image\/([\w+]+);base64,([\s\S]+)/;
    const match = data.match(reg);

    if (!match) {
        throw new Error('image base64 data error');
    }

    const baseType = {
        jpeg: 'jpg'
    };

    baseType['svg+xml'] = 'svg'

    const extname = baseType[match[1]] ? baseType[match[1]] : match[1];

    return {
        extname: '.' + extname,
        base64: match[2]
    };
}

/**
 * @param {string} imgPath - path to the temp image 
 * @param {compressRasterImagesOptions} params 
 */
function runCompression(imgPath, params) {
    execa.sync(ect, ['--mt-deflate', `-${params.optimizationLevel}`, imgPath]);
}