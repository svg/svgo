'use strict';

exports.type = 'perItem';

exports.active = false;

exports.params = {
	order: [
		'xmlns',
		'id',
		'width', 'height',
		'x', 'x1', 'x2',
		'y', 'y1', 'y2',
		'cx', 'cy', 'r',
		'fill', 'fill-opacity', 'fill-rule',
		'stroke', 'stroke-opacity', 'stroke-width', 'stroke-miterlimit', 'stroke-dashoffset',
		'd', 'points'
	]
};

/**
 * Sort element attributes for epic readability.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Nikolay Frantsev
 */
exports.fn = function(item, params) {

	var attrs = [],
		sorted = {},
		orderlen = params.order.length + 1;

	if (item.elem) {

		item.eachAttr(function(attr) {
			attrs.push(attr);
		});

		attrs.sort(function(a, b) {
			return ((a = params.order.indexOf(a.name)) > -1 ? a : orderlen) -
				((b = params.order.indexOf(b.name)) > -1 ? b : orderlen);
		});

		attrs.forEach(function (attr) {
			sorted[attr.name] = attr;
		});

		item.attrs = sorted;

	}

};
