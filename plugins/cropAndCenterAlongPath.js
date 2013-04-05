'use strict';

var relative2absolute = require('./_path.js').relative2absolute,
    computeCubicBoundingBox = require('./_path.js').computeCubicBoundingBox,
    computeQuadraticBoundingBox = require('./_path.js').computeQuadraticBoundingBox,
    applyTransforms = require('./_path.js').applyTransforms,
    js2path = require('./_path.js').js2path,
    extend = require('../lib/svgo/tools').extend;

exports.cropAndCenterAlongPath = function(data, params) {

    data.content.forEach(function(item) {

        // only for SVG with one Path inside
        if (item.isElem('svg') &&
            item.content.length === 1 &&
            item.content[0].isElem('path')
        ) {

            var svgElem = item,
                pathElem = svgElem.content[0],
                // get absoluted Path data
                path = relative2absolute(extend(true, [], pathElem.pathJS)),
                xs = [],
                ys = [],
                currentPoint = [0, 0],
                controlPoint,
                cubicBoundingBox,
                quadraticBoundingBox,
                i,
                segment;

            path.forEach(function(pathItem) {

                // ML
                if (pathItem.instruction === 'ML') {

                    pathItem.data.forEach(function(d, i) {

                        if (i % 2 === 0) {
                            xs.push(d);
                        } else {
                            ys.push(d);
                        }

                    });

                // H
                } else if (pathItem.instruction === 'H') {

                    pathItem.data.forEach(function(d) {
                        xs.push(d);
                    });

                // V
                } else if (pathItem.instruction === 'V') {

                    pathItem.data.forEach(function(d) {
                        ys.push(d);
                    });

                // C
                } else if (pathItem.instruction === 'C') {

                    for (i = 0; i < pathItem.data.length; i += 6) {

                        segment = pathItem.data.slice(i, i + 6);

                        cubicBoundingBox = computeCubicBoundingBox.apply(this, currentPoint.concat(segment));

                        xs.push(cubicBoundingBox.minx);
                        xs.push(cubicBoundingBox.maxx);

                        ys.push(cubicBoundingBox.miny);
                        ys.push(cubicBoundingBox.maxy);

                        // reflected control point for the next possible S
                        controlPoint = [
                            2 * segment[4] - segment[2],
                            2 * segment[5] - segment[3]
                        ];

                        currentPoint[0] = segment[4];
                        currentPoint[1] = segment[5];

                    }

                // S
                } else if (pathItem.instruction === 'S') {

                    for (i = 0; i < pathItem.data.length; i += 4) {

                        segment = pathItem.data.slice(i, i + 4);

                        cubicBoundingBox = computeCubicBoundingBox.apply(this, currentPoint.concat(controlPoint).concat(segment));

                        xs.push(cubicBoundingBox.minx);
                        xs.push(cubicBoundingBox.maxx);

                        ys.push(cubicBoundingBox.miny);
                        ys.push(cubicBoundingBox.maxy);

                        // reflected control point for the next possible S
                        controlPoint = [
                            2 * segment[2] - controlPoint[0],
                            2 * segment[3] - controlPoint[1],
                        ];

                        currentPoint[0] = segment[2];
                        currentPoint[1] = segment[3];

                    }

                // Q
                } else if (pathItem.instruction === 'Q') {

                    for (i = 0; i < pathItem.data.length; i += 4) {

                        segment = pathItem.data.slice(i, i + 4);

                        quadraticBoundingBox = computeQuadraticBoundingBox.apply(this, currentPoint.concat(segment));

                        xs.push(quadraticBoundingBox.minx);
                        xs.push(quadraticBoundingBox.maxx);

                        ys.push(quadraticBoundingBox.miny);
                        ys.push(quadraticBoundingBox.maxy);

                        // reflected control point for the next possible T
                        controlPoint = [
                            2 * segment[2] - segment[0],
                            2 * segment[3] - segment[1]
                        ];

                        currentPoint[0] = segment[2];
                        currentPoint[1] = segment[3];

                    }

                // S
                } else if (pathItem.instruction === 'T') {

                    for (i = 0; i < pathItem.data.length; i += 2) {

                        segment = pathItem.data.slice(i, i + 2);

                        quadraticBoundingBox = computeQuadraticBoundingBox.apply(this, currentPoint.concat(controlPoint).concat(segment));

                        xs.push(quadraticBoundingBox.minx);
                        xs.push(quadraticBoundingBox.maxx);

                        ys.push(quadraticBoundingBox.miny);
                        ys.push(quadraticBoundingBox.maxy);

                        // reflected control point for the next possible T
                        controlPoint = [
                            2 * segment[0] - segment[0],
                            2 * segment[1] - segment[1]
                        ];

                        currentPoint[0] = segment[0];
                        currentPoint[1] = segment[1];

                    }

                }

                if (pathItem.data) {

                    currentPoint = pathItem.point;

                }

            });

            var xmin = Math.min.apply(this, xs).toFixed(params.floatPrecision),
                xmax = Math.max.apply(this, xs).toFixed(params.floatPrecision),
                ymin = Math.min.apply(this, ys).toFixed(params.floatPrecision),
                ymax = Math.max.apply(this, ys).toFixed(params.floatPrecision),
                svgHeight = +svgElem.attr('height').value,
                realWidth = Math.ceil(xmax - xmin),
                realHeight = Math.ceil(ymax - ymin),
                transform = '';

            if (params.hcrop) {
                transform += 'translate(' + (-xmin) + ' 0)';
            }

            if (params.vcenter) {
                transform += ' translate(0 ' + (((svgHeight - realHeight) / 2) - ymin) + ')';
            }

            if (transform) {
                pathElem.addAttr({
                    name: 'transform',
                    prefix: '',
                    local: 'transform',
                    value: transform
                });

                path = applyTransforms(pathElem, pathElem.pathJS);
            }

            // transformed data rounding
            path.forEach(function(pathItem) {
                if (pathItem.data) {
                    pathItem.data = pathItem.data.map(function(num) {
                        return +num.toFixed(params.floatPrecision);
                    });
                }
            });

            path = js2path(path, params);

            pathElem.attr('d').value = path;
            svgElem.attr('width').value = realWidth;

        }

    });

    return data;

};
