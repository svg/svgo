'use strict';

exports.type = 'perItem';

exports.active = true;

exports.params = {
    tolerance: 1,
    highQuality: false
};

var simplify = require('simplify-js'),
    path2js = require('./_path').path2js,
    js2path = require('./_path').js2path;

/**
 * Dramatically reduce the number of points in a polyline while retaining its shape.
 *
 * @see http://mourner.github.io/simplify-js/
 *
 * @param {Number} tolerance Affects the amount of simplification (in the same metric as the point coordinates).
 * @param {Boolean} highQuality Excludes distance-based preprocessing step which leads to highest quality simplification but runs ~10-20 times slower.
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Sebastiaan Deckers
 */
exports.fn = function(item, params) {

    if (item.isElem(['polyline', 'polygon']) && item.hasAttr('points')) {
        var points = item.attr('points');
        points.value = processPoints(points.value, item, params);
    }

    else if (item.isElem(['path', 'glyph']) && item.hasAttr('d')) {
        var d = item.attr('d');
        d.value = processPath(d.value, item, params);
    }

    else if (item.isElem('animateMotion') && item.hasAttr('path')) {
        var path = item.attr('path');
        path.value = processPath(path.value, item, params);
    }

    else if (item.isElem('animate') &&
        item.hasAttr('attributeName') &&
        item.attr('attributeName').value === 'd'
    ) {
        if (item.hasAttr('values')) {
            var values = item.attr('values');
            var paths = values.value.split(/\s*\;\s*/)
                .map(Function.prototype.call, String.prototype.trim);
            values.value = paths.map(function(path) {
                return processPath(path, item, params);
            }).join(';');
        }
        if (item.hasAttr('from')) {
            var from = item.attr('from');
            from.value = processPath(from.value, item, params);
        }
        if (item.hasAttr('to')) {
            var to = item.attr('to');
            to.value = processPath(to.value, item, params);
        }
    }

};

function processPoints(points, item, params) {
    if (points.length === 0) {
        return points;
    }
    var coords = points.split(/\s+/)
        .map(function(pair) {
            var xy = pair.split(',');
            return {
                x: parseFloat(xy[0], 10),
                y: parseFloat(xy[1], 10)
            };
        });
    var simplified = simplify(coords, params.tolerance, params.highQuality);
    return simplified.map(function(coord) {
        return coord.x + ',' + coord.y;
    }).join(' ');
}

function processPath(path, item, params) {
    var instructions = path2js(path, params);
    var sequences = collapseLineInstructions(instructions);
    var simplified = sequences.map(function(sequence) {
        if (isLine(sequence) && sequence.points.length >= 2) {
            sequence.points = simplify(
                sequence.points,
                params.tolerance,
                params.highQuality
            );
        }
        return sequence;
    });
    var instructions = spreadLineSequences(simplified);
    return js2path(instructions, params);
}

function collapseLineInstructions(instructions) {
    var sequences = [];
    var lastInstruction = '';
    instructions.forEach(function(instruction) {
        var sameSequence = lastInstruction === instruction.instruction;
        lastInstruction = instruction.instruction;
        if (isLine(instruction)) {
            if (!sameSequence) {
                sequences.push({
                    instruction: instruction.instruction,
                    points: []
                });
            }
            if (Array.isArray(instruction.data) &&
                instruction.data.length === 2
            ) {
                sequences[sequences.length - 1].points.push({
                    x: instruction.data[0],
                    y: instruction.data[1]
                });
            }
        } else {
            sequences.push(instruction);
        }
    });
    return sequences;
}

function spreadLineSequences(simplified) {
    return simplified.reduce(function(instructions, sequence) {
        if (isLine(sequence)) {
            sequence.points.forEach(function(point) {
                instructions.push({
                    instruction: sequence.instruction,
                    data: [point.x, point.y]
                });
            });
        } else {
            instructions.push(sequence);
        }
        return instructions;
    }, []);
}

function isLine(instruction) {
    return instruction.instruction === 'L' ||
        instruction.instruction === 'l';
}
