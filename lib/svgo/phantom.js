var PATH = require('path'),
    Q = require('Q'),
    spawn = require('child_process').spawn;

/**
 * Two SVG files rendering and visually comparing with PhantomJS.
 *
 * @see http://phantomjs.org/
 * @see /lib/phantom_test.js
 *
 * @param {String} file1 file1
 * @param {String} file2 file2
 * @param {Number} width viewport width
 * @param {Number} height viewport height
 *
 * @return {Object} deferred promise with exit code
 */
exports.test = function(file1, file2, width, height) {

    var phantomTestFile = PATH.resolve(__dirname, './phantom_test.js'),
        phantom = spawn('phantomjs', [phantomTestFile, file1, file2, width, height]),
        deferred = Q.defer();

    phantom.on('exit', function(code) {
        deferred.resolve(code);
    });

    return deferred.promise;

};
