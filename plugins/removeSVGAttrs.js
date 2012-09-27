/**
 * Remove some useless svg element attributes.
 *
 * @see http://www.w3.org/TR/SVG/struct.html#SVGElement
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeSVGAttrs = function(item, params) {

    if (item.isElem('svg') && item.hasAttr()) {

        /**
         * Remove id attribute.
         *
         * @see http://www.w3.org/TR/SVG/struct.html#IDAttribute
         *
         * @example
         * <svg id="svg49">
         */
        if (params.id) item.removeAttr('id');

        /**
         * Remove version attribute.
         *
         * @see http://www.w3.org/TR/SVG/struct.html#SVGElementVersionAttribute
         *
         * @example
         * <svg version="1.1">
         */
        if (params.version) item.removeAttr('version');

        /**
         * Remove xnl:space attribute.
         *
         * @see http://www.w3.org/TR/SVG/struct.html#XMLSpaceAttribute
         *
         * @example
         * <svg xml:space="preserve">
         */
        if (params.xmlspace) item.removeAttr('xml:space');

    }

};
