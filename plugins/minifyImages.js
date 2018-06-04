'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'minifies PNG images';

exports.params = {

};

const execa = require('execa');
const isPng = require('is-png');
const isStream = require('is-stream');
const pngquant = require('pngquant-bin');


var base64Regexp = new RegExp(/data:image\/([a-zA-Z]*);base64,([^\"]*)/);

/**
 * Minifies images using imagemin
 *
 * @author jboulay <jboulay@ekito.fr>
 */
exports.fn = function(item) {
    if (
        item.isElem('image') &&
        item.hasAttrLocal('href', base64Regexp)
    ) {
        var base64Image = item.attrs['xlink:href'].value;
        var match = base64Regexp.exec(base64Image);

        var imageType = match[1];
        var base64data = match[2];
        
        if (imageType === 'png'){
            var bufferedImage = new Buffer(base64data, 'base64');

            var bufferedImagemin = minifyPng({quality: '70-90', speed: 1, floyd: 1}, bufferedImage)
            var minifiedImage = bufferedImagemin.toString('base64');
            
            item.attrs['xlink:href'].value = 'data:image/png;base64,' + minifiedImage;
            
        }
    }

};

function minifyPng(opts, input){
    opts = Object.assign({}, opts);

    const isBuffer = Buffer.isBuffer(input);

    if (!isBuffer && !isStream(input)) {
        return Promise.reject(new TypeError(`Expected a Buffer or Stream, got ${typeof input}`));
    }

    if (isBuffer && !isPng(input)) {
        return Promise.resolve(input);
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

    if (opts.verbose) {
        args.push('--verbose');
    }

    const cp = execa.sync(pngquant, args, {
        encoding: null,
        input
    });

    return cp.stdout;
}


