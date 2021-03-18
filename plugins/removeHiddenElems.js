'use strict';

const { querySelector, closestByName } = require('../lib/xast.js');
const { computeStyle } = require('../lib/style.js');
const { parsePathData } = require('../lib/path.js');

exports.type = 'perItem';

exports.active = true;

exports.description =
  'removes hidden elements (zero sized, with absent attributes)';

exports.params = {
  isHidden: true,
  displayNone: true,
  opacity0: true,
  circleR0: true,
  ellipseRX0: true,
  ellipseRY0: true,
  rectWidth0: true,
  rectHeight0: true,
  patternWidth0: true,
  patternHeight0: true,
  imageWidth0: true,
  imageHeight0: true,
  pathEmptyD: true,
  polylineEmptyPoints: true,
  polygonEmptyPoints: true,
};

/**
 * Remove hidden elements with disabled rendering:
 * - display="none"
 * - opacity="0"
 * - circle with zero radius
 * - ellipse with zero x-axis or y-axis radius
 * - rectangle with zero width or height
 * - pattern with zero width or height
 * - image with zero width or height
 * - path with empty data
 * - polyline with empty points
 * - polygon with empty points
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function (item, params) {
  if (item.type === 'element') {
    // Removes hidden elements
    // https://www.w3schools.com/cssref/pr_class_visibility.asp
    const computedStyle = computeStyle(item);
    if (
      params.isHidden &&
      computedStyle.visibility &&
      computedStyle.visibility.type === 'static' &&
      computedStyle.visibility.value === 'hidden' &&
      // keep if any descendant enables visibility
      querySelector(item, '[visibility=visible]') == null
    ) {
      return false;
    }

    // display="none"
    //
    // https://www.w3.org/TR/SVG11/painting.html#DisplayProperty
    // "A value of display: none indicates that the given element
    // and its children shall not be rendered directly"
    if (
      params.displayNone &&
      computedStyle.display &&
      computedStyle.display.type === 'static' &&
      computedStyle.display.value === 'none' &&
      // markers with display: none still rendered
      item.isElem('marker') === false
    ) {
      return false;
    }

    // opacity="0"
    //
    // https://www.w3.org/TR/SVG11/masking.html#ObjectAndGroupOpacityProperties
    if (
      params.opacity0 &&
      computedStyle.opacity &&
      computedStyle.opacity.type === 'static' &&
      computedStyle.opacity.value === '0' &&
      // transparent element inside clipPath still affect clipped elements
      closestByName(item, 'clipPath') == null
    ) {
      return false;
    }

    // Circles with zero radius
    //
    // https://www.w3.org/TR/SVG11/shapes.html#CircleElementRAttribute
    // "A value of zero disables rendering of the element"
    //
    // <circle r="0">
    if (
      params.circleR0 &&
      item.isElem('circle') &&
      item.children.length === 0 &&
      item.attributes.r === '0'
    ) {
      return false;
    }

    // Ellipse with zero x-axis radius
    //
    // https://www.w3.org/TR/SVG11/shapes.html#EllipseElementRXAttribute
    // "A value of zero disables rendering of the element"
    //
    // <ellipse rx="0">
    if (
      params.ellipseRX0 &&
      item.isElem('ellipse') &&
      item.children.length === 0 &&
      item.attributes.rx === '0'
    ) {
      return false;
    }

    // Ellipse with zero y-axis radius
    //
    // https://www.w3.org/TR/SVG11/shapes.html#EllipseElementRYAttribute
    // "A value of zero disables rendering of the element"
    //
    // <ellipse ry="0">
    if (
      params.ellipseRY0 &&
      item.isElem('ellipse') &&
      item.children.length === 0 &&
      item.attributes.ry === '0'
    ) {
      return false;
    }

    // Rectangle with zero width
    //
    // https://www.w3.org/TR/SVG11/shapes.html#RectElementWidthAttribute
    // "A value of zero disables rendering of the element"
    //
    // <rect width="0">
    if (
      params.rectWidth0 &&
      item.isElem('rect') &&
      item.children.length === 0 &&
      item.attributes.width === '0'
    ) {
      return false;
    }

    // Rectangle with zero height
    //
    // https://www.w3.org/TR/SVG11/shapes.html#RectElementHeightAttribute
    // "A value of zero disables rendering of the element"
    //
    // <rect height="0">
    if (
      params.rectHeight0 &&
      params.rectWidth0 &&
      item.isElem('rect') &&
      item.children.length === 0 &&
      item.attributes.height === '0'
    ) {
      return false;
    }

    // Pattern with zero width
    //
    // https://www.w3.org/TR/SVG11/pservers.html#PatternElementWidthAttribute
    // "A value of zero disables rendering of the element (i.e., no paint is applied)"
    //
    // <pattern width="0">
    if (
      params.patternWidth0 &&
      item.isElem('pattern') &&
      item.attributes.width === '0'
    ) {
      return false;
    }

    // Pattern with zero height
    //
    // https://www.w3.org/TR/SVG11/pservers.html#PatternElementHeightAttribute
    // "A value of zero disables rendering of the element (i.e., no paint is applied)"
    //
    // <pattern height="0">
    if (
      params.patternHeight0 &&
      item.isElem('pattern') &&
      item.attributes.height === '0'
    ) {
      return false;
    }

    // Image with zero width
    //
    // https://www.w3.org/TR/SVG11/struct.html#ImageElementWidthAttribute
    // "A value of zero disables rendering of the element"
    //
    // <image width="0">
    if (
      params.imageWidth0 &&
      item.isElem('image') &&
      item.attributes.width === '0'
    ) {
      return false;
    }

    // Image with zero height
    //
    // https://www.w3.org/TR/SVG11/struct.html#ImageElementHeightAttribute
    // "A value of zero disables rendering of the element"
    //
    // <image height="0">
    if (
      params.imageHeight0 &&
      item.isElem('image') &&
      item.attributes.height === '0'
    ) {
      return false;
    }

    // Path with empty data
    //
    // https://www.w3.org/TR/SVG11/paths.html#DAttribute
    //
    // <path d=""/>
    if (params.pathEmptyD && item.isElem('path')) {
      if (item.attributes.d == null) {
        return false;
      }
      const pathData = parsePathData(item.attributes.d);
      if (pathData.length === 0) {
        return false;
      }
      // keep single point paths for markers
      if (
        pathData.length === 1 &&
        computedStyle['marker-start'] == null &&
        computedStyle['marker-end'] == null
      ) {
        return false;
      }
      return true;
    }

    // Polyline with empty points
    //
    // https://www.w3.org/TR/SVG11/shapes.html#PolylineElementPointsAttribute
    //
    // <polyline points="">
    if (
      params.polylineEmptyPoints &&
      item.isElem('polyline') &&
      item.attributes.points == null
    ) {
      return false;
    }

    // Polygon with empty points
    //
    // https://www.w3.org/TR/SVG11/shapes.html#PolygonElementPointsAttribute
    //
    // <polygon points="">
    if (
      params.polygonEmptyPoints &&
      item.isElem('polygon') &&
      item.attributes.points == null
    ) {
      return false;
    }
  }
};
