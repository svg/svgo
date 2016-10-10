'use strict';

exports.type = 'full';

exports.active = true;

exports.params = {
    juice: {
      onlyMatchedOnce: true
    }
};

exports.description = 'inline styles using the juice module';


var cheerioSupport = require('../lib/svgo/cheerio-support'),
    juice          = require('juice');


/**
  * Moves styles from <style> to element styles
  *
  * @author strarsis <strarsis@gmail.com>
  */
exports.fn = function(data, opts) {
  var juiceOpts = opts.juice;

  // svgo ast to cheerio ast
  var $ = cheerioSupport.svgoAst2CheerioAst(data);

  juiceOpts.xmlMode = true; // juice option required for svg

  var $i = juice.juiceDocument($, juiceOpts);

  // cheerio ast back to svgo ast
  var dataNew = cheerioSupport.cheerioAst2SvgoAst($i);
  return dataNew;
};
