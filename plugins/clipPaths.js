'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'clips all paths with a parameter polygon';

exports.params = {
    clipPath : '0,0 100,0 100,100 0,100',
    precision : 1000
};

const martinez = require('martinez-polygon-clipping')

const {
    path2js,
    js2path,
    relative2absolute,
} = require('./_path.js');

const jspath2Polygon = jspath => {
    const absPath = relative2absolute(jspath)
    let firstPoint = null
    let lastPoint = null
    return patchLastEntry(absPath.map( command => {
        let point = null
        switch(command.instruction) {
            case 'M':
                point = command.data;
                break;
            case 'L':
                point = command.data;
                break;
            case 'z': case 'Z':
                return false
                break;
            case 'H':
                point = lastPoint;
                point[0] = command.data[0];
                break;
            case 'V':
                point = lastPoint;
                point[1] = command.data[0];
                break;
            default :
                throw new Error('unknown ' + command.instruction)
        }
        if(!firstPoint)
            firstPoint = point;
        lastPoint = point
        return point.slice(0, 2)
    }).filter( _ => _ ))
}

const patchLastEntry = poly => {
    const last = poly[poly.length - 1]
    const first = poly[0]
    return (last[0] == first[0] && last[1] == first[1]) ? poly : [...poly, first]
}

const roundPoint = (point, precision = 1000) => precision ? [
    Math.round(point[0] * precision) / precision,
    Math.round(point[1] * precision) / precision,
] : point

const polygon2jspath = (poly, params) => [
    {
        instruction : 'M',
        data : roundPoint(poly[0], params.precision)
    },
    ...poly.slice(1, -1).map( point => ({
        instruction : 'L',
        data : roundPoint(point, params.precision)
    })),
    {
        instruction : 'z'
    }
]

/**
 * Merge multiple Paths into one.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich, Lev Solntsev
 */
exports.fn = function(item, params) {
    if (!item.isElem() || item.isEmpty()) return;

    const clip = patchLastEntry(params.clipPath.split(' ').map( pair => pair.split(',').map(parseFloat)))

    item.content = item.content.filter(function(contentItem) {
        if (contentItem.isElem('path') &&
            contentItem.isEmpty() &&
            contentItem.hasAttr('d')
        ) {
            const res = martinez.intersection(
                jspath2Polygon(
                    path2js(contentItem)
                ), clip
            );
            const jspath = polygon2jspath(res[0], params)
            js2path(contentItem, jspath, params);
            return true;
        }
        return true;

    });

};
