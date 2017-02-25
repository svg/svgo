'use strict';

var specificity = require('csso/lib/compressor/restructure/prepare/specificity');

// extracted from https://github.com/keeganstreet/specificity/blob/master/specificity.js#L211
function compareSpecificity(aSpecificity, bSpecificity) {
  for (var i = 0; i < 4; i += 1) {
			if (aSpecificity[i] < bSpecificity[i]) {
				return -1;
			} else if (aSpecificity[i] > bSpecificity[i]) {
				return 1;
			}
		}

		return 0;
}

function compareSimpleSelectorNode(aSimpleSelectorNode, bSimpleSelectorNode) {
  var aSpecificity = specificity(aSimpleSelectorNode),
      bSpecificity = specificity(bSimpleSelectorNode);
  return compareSpecificity(aSpecificity, bSpecificity);
}

module.exports.compareSpecificity        = compareSpecificity;
module.exports.compareSimpleSelectorNode = compareSimpleSelectorNode;