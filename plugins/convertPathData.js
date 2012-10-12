/**
 * Convert absolute Path to relative,
 * trim useless delimiters and leading zeros,
 * decrease accuracy of floating-point numbers.
 *
 * @see http://www.w3.org/TR/SVG/paths.html#PathData
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.convertPathData = function(item, params) {

    if (item.isElem('path')) {

        var pathJS = path2js(item.attr('d').value),
            pathString = js2path(pathJS);

        item.attr('d').value = pathString;

    }

    /**
     * Convert path string to JS representation.
     *
     * @param {String} pathString input string
     *
     * @return {Array} JS representation array
     */
    function path2js(pathString) {

            // JS representation of the path data
        var pathJS = [],
            // current instruction context
            instruction,
            // current point
            point = [0, 0],
            // regexp for splitting path string into array like ['M', '10 50', 'L', '20 30']
            regPathInstructions = /([MmLlHhVvCcSsQqTtAaZz])\s*/,
            // regexp for splitting path data into items
            regPathData = /(?=-)|[\s,]+/;

        pathString.split(regPathInstructions).forEach(function(data) {
            if (data) {
                // instruction item
                if (regPathInstructions.test(data)) {
                    instruction = data;

                    // z - instruction w/o data
                    if (instruction === 'z' || instruction === 'Z') {
                        pathJS.push({
                            instruction: 'z'
                        });
                    }
                // data item
                } else {

                    // M 35.898 14.374 L 35.898 14.374 → M35.898 14.374L35.898 14.374
                    data = data.trim().split(regPathData).map(function(str) { return +str; });

                    // absolute to relative
                    if (params.relative) {
                        var converted = absolute2relative({
                            instruction: instruction,
                            point: point,
                            data: data
                        });

                        instruction = converted.instruction;
                        data = converted.data;
                        point = converted.point;
                    }

                    pathJS.push({
                        instruction: instruction,
                        data: data
                    });

                }
            }
        });

        return pathJS;

    }

    /**
     * Convert absolute item's data coordinates to relative.
     *
     * @param {Object} item input item
     *
     * @return {Object} output item
     */
    function absolute2relative(item) {

        var instruction = item.instruction,
            data = item.data,
            point = item.point,
            i;

        // already relative
        // recalculate current point
        if (
            instruction === 'm' ||
            instruction === 'c' ||
            instruction === 's' ||
            instruction === 'l' ||
            instruction === 'q' ||
            instruction === 't' ||
            instruction === 'a'
        ) {
            var newPoint = data.slice(-2);

            // x
            point[0] += newPoint[0];
            // y
            point[1] += newPoint[1];
        }

        if (instruction === 'h') {
            // x
            point[0] += data[data.length - 1];
        }

        if (instruction === 'v') {
            // y
            point[1] += data[data.length - 1];
        }

        // absolute
        // M → m
        // L → l
        // T → t
        if (
            instruction === 'M' ||
            instruction === 'L' ||
            instruction === 'T'
        ) {
            instruction = instruction.toLowerCase();

            // x y
            // 0 1
            for(i = 0; i < data.length; i += 2) {
                data[i] -= point[0];
                data[i+1] -= point[1];

                point[0] += data[i];
                point[1] += data[i+1];
            }
        }

        // C → c
        if (instruction === 'C') {
            instruction = 'c';

            // x1 y1 x2 y2 x y
            // 0  1  2  3  4 5
            for(i = 0; i < data.length; i += 6) {
                data[i] -= point[0];
                data[i+1] -= point[1];
                data[i+2] -= point[0];
                data[i+3] -= point[1];
                data[i+4] -= point[0];
                data[i+5] -= point[1];

                point[0] += data[i+4];
                point[1] += data[i+5];
            }
        }

        // S → s
        // Q → q
        if (
            instruction === 'S' ||
            instruction === 'Q'
        ) {
            instruction = instruction.toLowerCase();

            // x1 y1 x y
            // 0  1  2 3
            for(i = 0; i < data.length; i += 4) {
                data[i] -= point[0];
                data[i+1] -= point[1];
                data[i+2] -= point[0];
                data[i+3] -= point[1];

                point[0] += data[i+2];
                point[1] += data[i+3];
            }
        }

        // A → a
        if (instruction === 'A') {
            instruction = 'a';

            // rx ry x-axis-rotation large-arc-flag sweep-flag x y
            // 0  1  2               3              4          5 6
            for(i = 0; i < data.length; i += 7) {
                data[i] -= point[0];
                data[i+1] -= point[1];
                data[i+5] -= point[0];
                data[i+6] -= point[1];

                point[0] += data[i+5];
                point[1] += data[i+6];
            }
        }

        // H → h
        if (instruction === 'H') {
            instruction = 'h';

            for(i = 0; i < data.length; i++) {
                data[i] -= point[0];

                point[0] += data[i];
            }
        }

        // V → v
        if (instruction === 'V') {
            instruction = 'v';

            for(i = 0; i < data.length; i++) {
                data[i] -= point[1];

                point[1] += data[i];
            }
        }

        item.instruction = instruction;
        item.data = data;
        item.point = point;

        return item;

    }

    /**
     * Convert path JS representation to string.
     *
     * @param {Array} pathJS JS representation array
     *
     * @return {String} output string
     */
    function js2path(pathJS) {

            // previous instruction context
        var prevInstruction,
            // out path data string
            pathString = '';

        pathJS.forEach(function(path) {
            // collapse repeated instructions if needed
            if (prevInstruction !== path.instruction) {
                pathString += path.instruction;
            }

            if (path.data) {
                path.data.forEach(function(item, i) {
                    // there is no delimiter by default
                    var delimiter = '';

                    // but if item >= 0 and item index > 0
                    // (M10 50)
                    // or if item >= 0 and item index === 0 and there is no new instruction
                    // (M 10 50 20 30)
                    // then must be a delimiter (space) between an instruction and item
                    if (
                        item >= 0 &&
                        (
                            i > 0 ||
                            (i === 0 && prevInstruction === path.instruction)
                        )
                    ) {
                        delimiter = ' ';
                    }

                    // fixed-point numbers
                    // 12.754997 → 12.755
                    if (params.floatPrecision) {
                        item = +item.toFixed(params.floatPrecision);
                    }

                    // remove floating-point numbers leading zeros
                    // 0.5 → .5
                    // -0.5 → -.5
                    if (params.leadingZero) {
                        if (item > 0 && item < 1) {
                            item = ('' + item).slice(1);
                        }

                        if (item < 0 && item > -1) {
                            item = '-' + ('' + item).slice(2);
                        }
                    }

                    pathString += delimiter + item;

                });
            }

            prevInstruction = path.instruction;
        });

        return pathString;

    }

};
