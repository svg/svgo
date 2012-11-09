/**
 * Two SVG files rendering and visually comparing with PhantomJS.
 *
 * @see http://phantomjs.org/
 * @see https://github.com/ariya/phantomjs/wiki/Screen-Capture
 */
var page = require('webpage').create(),
    file1 = phantom.args[0],
    file2 = phantom.args[1],
    width = phantom.args[2],
    height = phantom.args[3];

page.viewportSize = {
    width: width,
    height: height
};

open(file1, function(out1) {
    open(file2, function(out2) {
        if (out1.length === out2.length && out1 === out2) {
            phantom.exit(1);
        } else {
            phantom.exit(2);
        }
    });
});

function open(file, callback) {

    page.open(file, function(status) {

        if (status !== 'success') {
            phantom.exit(3);
        } else {
            callback(page.renderBase64('PNG'));
        }

    });

}
