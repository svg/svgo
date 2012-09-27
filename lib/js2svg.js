var INHERIT = require('inherit');

/**
 * Convert SVG-as-JS object to SVG (XML) string.
 *
 * @param {Object} data svg-as-js data object
 * @param {Class} [converter] custom converter class
 * @return {Converter} Converter instance
 */
module.exports = function(data, converter) {

    return new (converter || Converter)(data).run(data);

};

/**
 * @class Converter
 */
var Converter = exports.Converter = INHERIT(
/**
 * @lends Nodes.prototype
 */
    {

        /**
         * @constructs
         * @private
         */
        __constructor: function() {

            /**
             * Converter options.
             *
             * @type {Object}
             */
            this.options = {
                doctypeStart:       '<!DOCTYPE',
                doctypeEnd:         '>',

                procInstStart:      '<?',
                procInstEnd:        '?>',

                tagOpenStart:       '<',
                tagOpenEnd:         '>',
                tagCloseStart:      '</',
                tagCloseEnd:        '>',

                tagShortStart:      '<',
                tagShortEnd:        '/>',

                attrStart:          '="',
                attrEnd:            '"',

                commentStart:       '<!--',
                commentEnd:         '-->',

                cdataStart:         '<![CDATA[',
                cdataEnd:           ']]>'
            };

        },

        /**
         * Start conversion.
         *
         * @param {Object} svg-as-js data object
         * @return {String}
         */
        run: function(data) {

            var svg = '';

            if (data.content) {

                data.content.forEach(function(item) {

                    if (item.isElem()) {
                       svg += this.createElem(item);
                    } else if (item.isText()) {
                       svg += item.text;
                    } else if (item.isDoctype()) {
                        svg += this.createDoctype(item.doctype);
                    } else if (item.isProcInst()) {
                        svg += this.createProcInst(item.processinginstruction);
                    } else if (item.isComment()) {
                        svg += this.createComment(item.comment);
                    } else if (item.isCDATA()) {
                        svg += this.createCDATA(item.cdata);
                    }

                }, this);

            }

            return svg;

        },

        /**
         * Create doctype tag.
         *
         * @param {String} doctype doctype body string
         * @return {String}
         */
        createDoctype: function(doctype) {

            return  this.options.doctypeStart +
                    doctype +
                    this.options.doctypeEnd;

        },

        /**
         * Create XML Processing Instruction tag.
         *
         * @param {Object} instruction instruction object
         * @return {String}
         */
        createProcInst: function(instruction) {

            return  this.options.procInstStart +
                    instruction.name +
                    ' ' +
                    instruction.body +
                    this.options.procInstEnd;

        },

        /**
         * Create comment tag.
         *
         * @param {String} comment comment body
         * @return {String}
         */
        createComment: function(comment) {

            return  this.options.commentStart +
                    comment +
                    this.options.commentEnd;

        },

        /**
         * Create CDATA section.
         *
         * @param {String} cdata CDATA body
         * @return {String}
         */
        createCDATA: function(cdata) {

            return  this.options.cdataStart +
                    cdata +
                    this.options.cdataEnd;

        },

        /**
         * Create element tag.
         *
         * @param {Object} data element object
         * @return {String}
         */
        createElem: function(data) {

            // empty element and short tag
            if (data.isEmpty()) {

                return  this.options.tagShortStart +
                        data.elem +
                        this.createAttrs(data) +
                        this.options.tagShortEnd;

            // non-empty element
            } else {

                return  this.options.tagOpenStart +
                        data.elem +
                        this.createAttrs(data) +
                        this.options.tagOpenEnd +
                        this.run(data) +
                        this.options.tagCloseStart +
                        data.elem +
                        this.options.tagCloseEnd;

            }

        },

        /**
         * Create element attributes.
         *
         * @param {Object} elem attributes object
         * @return {String}
         */
        createAttrs: function(elem) {

            var self = this,
                attrs = '';

            if (elem.hasAttr()) {

                elem.eachAttr(function(attr) {

                    attrs +=    ' ' +
                                attr.name +
                                self.options.attrStart +
                                attr.value +
                                self.options.attrEnd;

                });

            }

            return attrs;

        }

    }
);

/*
var MyConv = INHERIT(Converter, {

    __constructor: function(options) {
        this.__base();
    }

});
*/
