'use strict';

exports.type = 'full';

exports.active = true;

exports.params = {
  onlyMatchedOnce: true
};

exports.description = 'inline styles';


var cheerioSupport = require('../lib/svgo/cheerio-support');


/**
  * Moves styles from <style> to element styles
  *
  * @author strarsis <strarsis@gmail.com>
  */
exports.fn = function(data, opts) {
  var juiceOpts = opts.juice;

  // svgo ast to cheerio ast
  var $ = cheerioSupport.svgoAst2CheerioAst(data);

  // TODO

  // cheerio ast back to svgo ast
  var dataNew = cheerioSupport.cheerioAst2SvgoAst($);
  return dataNew;
};
