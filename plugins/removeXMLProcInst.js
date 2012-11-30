'use strict';

/**
 * Remove XML Processing Instruction.
 *
 * @example
 * <?xml version="1.0" encoding="utf-8"?>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeXMLProcInst = function(item) {

    return !(item.processinginstruction && item.processinginstruction.name === 'xml');

};
