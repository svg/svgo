'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'recreate Styles';

var EXTEND = require('whet.extend'),
    stylingProps = require('./_collections').attrsGroups.presentation,
    rEscape = '\\\\(?:[0-9a-f]{1,6}\\s?|\\r\\n|.)',                 // Like \" or \2051. Code points consume one space.
    rAttr = '\\s*(' + g('[^:;\\\\]', rEscape) + '*?)\\s*',          // attribute name like ‘fill’
    rSingleQuotes = "'(?:[^'\\n\\r\\\\]|" + rEscape + ")*?(?:'|$)", // string in single quotes: 'smth'
    rQuotes = '"(?:[^"\\n\\r\\\\]|' + rEscape + ')*?(?:"|$)',       // string in double quotes: "smth"
    rQuotedString = new RegExp('^' + g(rSingleQuotes, rQuotes) + '$'),
    className = '[.A-Za-z0-9]*',
    classContent = '.+?',
    classStyles = [],
    classList =[],
    styleList =[],
    isStyleSet = false,
    // Parentheses, E.g.: url(data:image/png;base64,iVBO...).
    // ':' and ';' inside of it should be threated as is. (Just like in strings.)
    rParenthesis = '\\(' + g('[^\'"()\\\\]+', rEscape, rSingleQuotes, rQuotes) + '*?' + '\\)',

    // The value. It can have strings and parentheses (see above). Fallbacks to anything in case of unexpected input.
    rValue = '\\s*(' + g('[^\'"();\\\\]+?', rEscape, rSingleQuotes, rQuotes, rParenthesis, '[^;]*?') + '*?' + ')',

    // End of declaration. Spaces outside of capturing groups help to do natural trimming.
    rDeclEnd = '\\s*(?:;\\s*|$)',

    // Final RegExp to parse CSS declarations.
    classDeclarationBlock = new RegExp('('+className + '){(' + classContent+ ')}','ig'),
    regDeclarationBlock = new RegExp(rAttr + ':' + rValue + rDeclEnd, 'ig'),

    // Comments expression. Honors escape sequences and strings.
    regStripComments = new RegExp(g(rEscape, rSingleQuotes, rQuotes, '/\\*[^]*?\\*/'), 'ig');

/**
 * Convert style in attributes.
 * @example
 * <style>
 * .class1{
 *      fill:#fff;
 *      color:#000;
 * }
 * <style>
 * <g class="class1">
 *             ⬇
 * <g fill="#fff" color="#000">
 *
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Prashanth Jain
 */
exports.fn = function(item) {
     if (item.elem == 'style' && !isStyleSet) {
         isStyleSet = true;
         var styleValue = item.content["0"].text,
        styles = [],
        attrs = {},
        // Strip CSS comments preserving escape sequences and strings.
        styleValue = styleValue.replace(regStripComments, function(match) {
            return match[0] == '/' ? '' :
                match[0] == '\\' && /[-g-z]/i.test(match[1]) ? match[1] : match;
        });
        // classDeclarationBlock.lastIndex = 0;
        for (var classValues; classValues = classDeclarationBlock.exec(styleValue);) {
            classList.push(classValues[1]);
            styles[classValues[1]]=classValues[2];
            regDeclarationBlock.lastIndex = 0;
            attrs = {};            
            for (var rule; rule = regDeclarationBlock.exec(styles[classValues[1]]);) {
                if(styleList[classValues[1]] == undefined)
                    styleList[classValues[1]]=[];
                styleList[classValues[1]].push([rule[1], rule[2]]);
            }
            if (styleList[classValues[1]].length) {
                styleList[classValues[1]] = styleList[classValues[1]].filter(function(style) {
                    if (style[0]) {
                        var prop = style[0].toLowerCase(),
                            val = style[1];
                        if (rQuotedString.test(val)) {
                            val = val.slice(1, -1);
                        }
                        if (stylingProps.indexOf(prop) > -1) {
                            attrs[prop] = {
                                name: prop,
                                value: val,
                                local: prop,
                                prefix: ''
                            };
                            return false;
                        }
                    }
                    return true;
                });
                styleList[classValues[1]] = attrs;
            }
        }
        return !item.isElem('style');        
    }
    else if (item.elem && item.hasAttr('class')) {
        var classLength =[];
        classLength = item.attrs.class.value.split(/\s+/);
        if(classLength.length > 0)
            classLength = classLength.filter(function(classAttribute){
                if(classList.includes("."+ classAttribute)){
                        EXTEND(item.attrs, styleList["."+classAttribute]);
                        item.removeAttr("class",classAttribute);
                        return false;
                }
                return true;
            });

        if(classLength.length == 0){
            item.removeAttr("class");
        }
        else
        {
        //    handle this case
        }
    }

};

function g() {
    return '(?:' + Array.prototype.join.call(arguments, '|') + ')';
}