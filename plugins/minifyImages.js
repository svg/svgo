'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'minifies PNG images';

exports.params = {
    png: {
        floyd: 1,
        nofs: false,
        posterize: 0,
        quality: '70-90',
        speed: 1
    },
    jpeg:{
        progressive: false,
        arithmetic: false,
    }
};

var execa = require('execa');
var isPng = require('is-png');
var isJpg = require('is-jpg');
var isStream = require('is-stream');
var pngquant = require('pngquant-bin');
var jpegtran = require('jpegtran-bin');

var base64Regexp = new RegExp(/data:image\/([a-zA-Z]*);base64,([^\"]*)/);

/**
 * Minifies images using imagemin
 *
 * @author jboulay <jboulay@ekito.fr>
 */
exports.fn = function(item, options) {
    if (
        item.isElem('image') &&
        item.hasAttrLocal('href', base64Regexp)
    ) {
        var base64Image = item.attrs['xlink:href'].value;
        var match = base64Regexp.exec(base64Image);

        var imageType = match[1];
        var base64data = match[2];
        
        var bufferedImage = new Buffer(base64data, 'base64');
        var bufferedImagemin;

        if (imageType === 'png'){

            bufferedImagemin = minifyPng(options.png, bufferedImage);
        }
        if (imageType === 'jpg' || imageType === 'jpeg'){
            bufferedImagemin = minifyJpeg(options.jpeg, bufferedImage);
        }

        if (bufferedImagemin){
            var minifiedImage = bufferedImagemin.toString('base64');
            var minifiedBase64Image = `data:image/${imageType};base64,${minifiedImage}`;
    
            item.attrs['xlink:href'].value = minifiedBase64Image;
        }
        
    }

};

function minifyPng(opts, input){
    opts = Object.assign({}, opts);

    const isBuffer = Buffer.isBuffer(input);

    if (!isBuffer && !isStream(input)) {
        throw new TypeError(`Expected a Buffer or Stream, got ${typeof input}`);
    }

    if (isBuffer && !isPng(input)) {
        return input;
    }

    const args = ['-'];

    if (opts.floyd && typeof opts.floyd === 'number') {
        args.push(`--floyd=${opts.floyd}`);
    }

    if (opts.floyd && typeof opts.floyd === 'boolean') {
        args.push('--floyd');
    }

    if (opts.nofs) {
        args.push('--nofs');
    }

    if (opts.posterize) {
        args.push('--posterize', opts.posterize);
    }

    if (opts.quality) {
        args.push('--quality', opts.quality);
    }

    if (opts.speed) {
        args.push('--speed', opts.speed);
    }

    const cp = execa.sync(pngquant, args, {
        encoding: null,
        input
    });

    return cp.stdout;
}

function minifyJpeg(opts, input){
    opts = Object.assign({}, opts);

	if (!Buffer.isBuffer(input)) {
		throw new TypeError('Expected a buffer');
	}

	if (!isJpg(input)) {
        return input;
	}

	const args = ['-copy', 'none'];

	if (opts.progressive) {
		args.push('-progressive');
	}

	if (opts.arithmetic) {
		args.push('-arithmetic');
	} else {
		args.push('-optimize');
	}

    const cp = execa.sync(jpegtran, args, {
        encoding: null,
        input
    });

    return cp.stdout;
}

