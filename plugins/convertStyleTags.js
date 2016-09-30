'use strict';

exports.type = 'full';
exports.active = false;
exports.description = 'converts style tags to style attributes or inline style';
exports.params = {
    asAttribute: true
};

/**
 * Convert style tag in attributes or inline style.
 *
 * @example {asAttribute: true}
 * <svg><style>.st0{ fill:#000; color:#fff }</style><g class="st0></svg>
 *             ⬇
 * <svg><g fill="#000" color="#fff"></svg>
 *
 * @example {asAttribute: false}
 * <svg><style>.st0{fill="#000" color="#fff"}</style><g class="st0></svg>
 *             ⬇
 * <svg><g class="st0 style="fill:#000; color: #fff; -webkit-blah: blah"></svg>
 *
 *
 * params: { asAttribute: false/true } (see examples above)
 *
 * @param {doc} the whole documenttree
 * @param {Object} params plugin params
 * @return {Object} the whole document
 *
 * @author Jonathan Stoye
 */

exports.fn = function (doc, params) {
    // loop over all svgs
    doc.content = doc.content.map(function (svg) {
        if (svg.content) {
            // extract the style tags from the svg
            var styles = extractStyleTags(svg.content);
            // remove all style tags from the svg
            svg.content = svg.content.filter(function (element) { return element.elem !== 'style' });
            // create the style objects from the existings style string
            var styleArrays = styles.map(createstyleArray);

            // go through all elements and add the style according to their classes       
            svg.content.forEach(function (element) {
                addStyle(element, styleArrays, params.asAttribute);
            });
        }
        return svg;
    });
    return doc;
};

function extractStyleTags(svgContent) {
    var styles = [];
    // loop over all elements and only keep none style ones
    svgContent = svgContent.filter(function (element) {
        if (element.elem === 'style') {
            // push the styles to styles array to return them later
            styles.push(element.content[0].text);
            // remove it if it is a style element
            return false;
        }
        // keep it if it is not a style element
        return true;
    });
    return styles;
}

function createstyleArray(style) {
    var styleArray = [];

    // split up the style blocks
    var blocks = style.split('}');
    // delete the empty item at the end
    blocks.pop();
    // order classes and styles
    blocks.forEach(function (blockString) {
        // seperate each block into class(es) and styles
        var blockParts = blockString.split('{');
        // if there are several classes split them up
        var classNames = blockParts[0].split(',');
        // remove point from class name '.className' => 'className'
        classNames = classNames.map(function (className) {
            return className.replace('.', '');
        });
        // check if the class names already exists and if so just add the styles to
        // the existing class otherwise add a new class with styles
        classNames.forEach(function (className) {
            if (!styleArray[className]) {
                styleArray[className] = blockParts[1];
            } else {
                styleArray[className] += ';' + blockParts[1];
            }
        });
    });
    return styleArray;
}

function addStyle(element, styleArrays, asAttribute) {
    var styleToApply = '';
    styleArrays.forEach(function (styleArray) {
        // loop over all classNames and check if the element has some matching classes
        Object.keys(styleArray).forEach(function (className) {
            var classRegEx = new RegExp(className);
            // if the element has a class attr and it matches the current class add the style accordingly
            if (element.hasAttr('class') && classRegEx.test(element.attrs.class.value)) {
                // if it is not the first style to apply then add a semicolon first 
                // because the last style attr mostly does not have one
                if (styleToApply.length == 0) {
                    styleToApply = styleArray[className];
                } else {
                    styleToApply += ';' + styleArray[className];
                }
            }
        });
    });
    // add the style to the element
    if (asAttribute) {
        // add each style as a seperate attribute
        var styles = styleToApply.split(';');
        styles = styles.map(function (style) {
            return style.split(':');
        });
        styles.forEach(function (style) {
            element.addAttr({
                name: style[0],
                value: style[1],
                prefix: '',
                local: style[0]
            });
        });
    } else {
        // add all styles as a inline style
        element.addAttr({
            name: 'style',
            value: styleToApply,
            prefix: '',
            local: 'style'
        });
    }
}