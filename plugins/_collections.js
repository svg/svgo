// http://wiki.inkscape.org/wiki/index.php/Inkscape-specific_XML_attributes
exports.editorNamespaces = [
    'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
    'http://www.inkscape.org/namespaces/inkscape',
    'http://ns.adobe.com/AdobeIllustrator/10.0/',
    'http://ns.adobe.com/Graphs/1.0/',
    'http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/',
    'http://ns.adobe.com/Variables/1.0/',
    'http://ns.adobe.com/SaveForWeb/1.0/',
    'http://ns.adobe.com/Extensibility/1.0/',
    'http://ns.adobe.com/Flows/1.0/',
    'http://ns.adobe.com/ImageReplacement/1.0/',
    'http://ns.adobe.com/GenericCustomNamespace/1.0/',
    'http://ns.adobe.com/XPath/1.0/'
];

// http://www.w3.org/TR/SVG/styling.html#SVGStylingProperties
exports.stylingProps = [
    'font',
    'font-family',
    'font-size',
    'font-size-adjust',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',,
    'direction',
    'letter-spacing',
    'text-decoration',
    'unicode-bidi',
    'word-spacing',
    'clip',
    'color',
    'cursor',
    'display',
    'overflow',
    'visibility',
    'clip-path',
    'clip-rule',
    'mask',
    'opacity',
    'enable-background',
    'filter',
    'flood-color',
    'flood-opacity',
    'lighting-color',
    'stop-color',
    'stop-opacity',
    'pointer-events',
    'color-interpolation',
    'color-interpolation-filters',
    'color-profile',
    'color-rendering',
    'fill',
    'fill-opacity',
    'fill-rule',
    'image-rendering',
    'marker',
    'marker-end',
    'marker-mid',
    'marker-start',
    'shape-rendering',
    'stroke',
    'stroke-dasharray',
    'stroke-dashoffset',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-opacity',
    'stroke-width',
    'text-rendering',
    'alignment-baseline',
    'baseline-shift',
    'dominant-baseline',
    'glyph-orientation-horizontal',
    'glyph-orientation-vertical',
    'kerning',
    'text-anchor',
    'writing-mode'
];

exports.defaultValues = {
    // http://www.w3.org/TR/SVG/attindex.html#RegularAttributes
    // http://www.w3.org/TR/SVG/attindex.html#PresentationAttributes
    'accumulate': { 'val': 'none', 'inh': true },
    'additive': { 'val': 'replace', 'inh': true },
    'alphabetic': { 'val': '0', 'inh': true },
    'amplitude': { 'val': '1', 'inh': false },
    'arabic-form': { 'val': 'initial', 'inh': true },

    // http://www.w3.org/TR/SVG/propidx.html
    'baseline-shift': { 'val': 'baseline', 'inh': false },
    'clip': { 'val': 'auto', 'inh': false },
    'clip-path': { 'val': 'none', 'inh': false },
    'color-interpolation': { 'val': 'sRGB', 'inh': true },
    'color-interpolation-filters': { 'val': 'linearRGB', 'inh': true },
    'color-profile': { 'val': 'auto', 'inh': true },
    'color-rendering': { 'val': 'auto', 'inh': true },
    'cursor': { 'val': 'auto', 'inh': true },
    'direction': { 'val': 'ltr', 'inh': true },
    'display': { 'val': 'inline', 'inh': false },
    'dominant-baseline': { 'val': 'auto', 'inh': false },
    'enable-background': { 'val': 'accumulate', 'inh': false },
    'fill': { 'val': ['black', '#000000', '#000'], 'inh': true },
    'fill-opacity': { 'val': '1', 'inh': true },
    'filter': { 'val': 'none', 'inh': false },
    'flood-color': { 'val': ['black', '#000000', '#000'], 'inh': false },
    'flood-opacity': { 'val': '1', 'inh': false },
    'font-size': { 'val': 'medium', 'inh': true },
    'font-size-adjust': { 'val': 'none', 'inh': true },
    'font-stretch': { 'val': 'normal', 'inh': true },
    'font-style': { 'val': 'normal', 'inh': true },
    'font-variant': { 'val': 'normal', 'inh': true },
    'font-weight': { 'val': 'normal', 'inh': true },
    'glyph-orientation-horizontal': { 'val': '0deg', 'inh': true },
    'glyph-orientation-vertical': { 'val': 'auto', 'inh': true },
    'image-rendering': { 'val': 'auto', 'inh': true },
    'kerning': { 'val': 'auto', 'inh': true },
    'letter-spacing': { 'val': 'normal', 'inh': true },
    'lighting-color': { 'val': ['white', '#ffffff', '#fff'], 'inh': false },
    'marker-end': { 'val': 'none', 'inh': true },
    'marker-mid': { 'val': 'none', 'inh': true },
    'marker-start': { 'val': 'none', 'inh': true },
    'mask': { 'val': 'none', 'inh': false },
    'opacity': { 'val': '1', 'inh': false },
    'pointer-events': { 'val': 'visiblePainted', 'inh': true },
    'shape-rendering': { 'val': 'auto', 'inh': true },
    'stop-color': { 'val': ['black', '#000000', '#000'], 'inh': false },
    'stop-opacity': { 'val': '1', 'inh': false },
    'stroke': { 'val': 'none', 'inh': true },
    'stroke-dasharray': { 'val': 'none', 'inh': true },
    'stroke-dashoffset': { 'val': '0', 'inh': true },
    'stroke-linecap': { 'val': 'butt', 'inh': true },
    'stroke-linejoin': { 'val': 'miter', 'inh': true },
    'stroke-miterlimit': { 'val': '4', 'inh': true },
    'stroke-opacity': { 'val': '1', 'inh': true },
    'stroke-width': { 'val': '1', 'inh': true },
    'text-anchor': { 'val': 'start', 'inh': true },
    'text-decoration': { 'val': 'none', 'inh': false },
    'text-rendering': { 'val': 'auto', 'inh': true },
    'unicode-bidi': { 'val': 'normal', 'inh': false },
    'visibility': { 'val': 'visible', 'inh': true },
    'word-spacing': { 'val': 'normal', 'inh': true },
    'writing-mode': { 'val': 'lr-tb', 'inh': true }
};

// http://www.w3.org/TR/SVG/intro.html#Definitions
var elems = exports.elems = {
    'animation': ['animate', 'animateColor', 'animateMotion', 'animateTransform', 'set'],
    'descriptive': ['desc', 'metadata', 'title'],
    'shape': ['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect'],
    'structural': ['defs', 'g', 'svg', 'symbol', 'use'],
    'gradient': ['linearGradient', 'radialGradient'],
    // http://www.w3.org/TR/SVG/intro.html#TermContainerElement
    'container': ['a', 'defs', 'glyph', 'g', 'marker', 'mask', 'missing-glyph', 'pattern', 'svg', 'switch', 'symbol']
};

// http://www.w3.org/TR/SVG/intro.html#Definitions
var attrs = exports.attrs = {
    'animationAddition': ['additive', 'accumulate'],
    'animationAttributeTarget': ['attributeType', 'attributeName'],
    'animationEvent': ['onbegin', 'onend', 'onrepeat', 'onload'],
    'animationTiming': ['begin', 'dur', 'end', 'min', 'max', 'restart', 'repeatCount', 'repeatDur', 'fill'],
    'animationValue': ['calcMode', 'values', 'keyTimes', 'keySplines', 'from', 'to', 'by'],
    'conditionalProcessing': ['requiredFeatures', 'requiredExtensions', 'systemLanguage'],
    'core': ['id', 'xml:base', 'xml:lang', 'xml:space'],
    'graphicalEvent': ['onfocusin', 'onfocusout', 'onactivate', 'onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onload'],
    'presentation': ['alignment-baseline', 'baseline-shift', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cursor', 'direction', 'display', 'dominant-baseline', 'enable-background', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'image-rendering', 'kerning', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'opacity', 'overflow', 'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'unicode-bidi', 'visibility', 'word-spacing', 'writing-mode'],
    'xlink': ['xlink:href', 'xlink:show', 'xlink:actuate', 'xlink:type', 'xlink:role', 'xlink:arcrole', 'xlink:title']
};

// http://www.w3.org/TR/SVG/eltindex.html
exports.possibles = {
    'a': {
        'attrs': [attrs.conditionalProcessing, attrs.core, attrs.graphicalEvent, attrs.presentation, attrs.xlink, 'class', 'style', 'externalResourcesRequired', 'transform', 'target'],
        'content': [elems.animation, elems.descriptive, elems.shape, elems.structural, elems.gradient, 'a', 'altGlyphDef', 'clipPath', 'color-profile', 'cursor', 'filter', 'font', 'font-face', 'foreignObject', 'image', 'marker', 'mask', 'pattern', 'script', 'style', 'switch', 'text', 'view']
    },
    'altGlyph': {
        'attrs': [attrs.conditionalProcessing, attrs.core, attrs.graphicalEvent, attrs.presentation, attrs.xlink, 'class', 'style', 'externalResourcesRequired', 'x', 'y', 'dx', 'dy', 'glyphRef', 'format', 'rotate'],
        'content': true
    },
    'altGlyphDef': {
        'attrs': [attrs.core],
        'content': ['glyphRef']
    },
    'altGlyphItem': {
        'attrs': [attrs.core],
        'content': ['glyphRef', 'altGlyphItem']
    },
    'animate': {
        'attrs': [attrs.conditionalProcessing, attrs.core, attrs.animationAddition, attrs.animationAttributeTarget, attrs.animationEvent, attrs.animationTiming, attrs.animationValue, attrs.presentation, attrs.xlink, 'externalResourcesRequired'],
        'content': [elems.descriptive]
    },
    'animateColor': {
        'attrs': [],
        'content': []
    },
    'animateMotion': {
        'attrs': [],
        'content': []
    },
    'animateTransform': {
        'attrs': [],
        'content': []
    },
    'circle': {
        'attrs': [],
        'content': []
    },
    'clipPath': {
        'attrs': [],
        'content': []
    },
    'color-profile': {
        'attrs': [],
        'content': []
    },
    'cursor': {
        'attrs': [],
        'content': []
    },
    'defs': {
        'attrs': [],
        'content': []
    },
    'desc': {
        'attrs': [],
        'content': []
    },
    'ellipse': {
        'attrs': [],
        'content': []
    },
    'feBlend': {
        'attrs': [],
        'content': []
    },
    'feColorMatrix': {
        'attrs': [],
        'content': []
    },
    'feComponentTransfer': {
        'attrs': [],
        'content': []
    },
    'feComposite': {
        'attrs': [],
        'content': []
    },
    'feConvolveMatrix': {
        'attrs': [],
        'content': []
    },
    'feDiffuseLighting': {
        'attrs': [],
        'content': []
    },
    'feDisplacementMap': {
        'attrs': [],
        'content': []
    },
    'feDistantLight': {
        'attrs': [],
        'content': []
    },
    'feFlood': {
        'attrs': [],
        'content': []
    },
    'feFuncA': {
        'attrs': [],
        'content': []
    },
    'feFuncB': {
        'attrs': [],
        'content': []
    },
    'feFuncG': {
        'attrs': [],
        'content': []
    },
    'feFuncR': {
        'attrs': [],
        'content': []
    },
    'feGaussianBlur': {
        'attrs': [],
        'content': []
    },
    'feImage': {
        'attrs': [],
        'content': []
    },
    'feMerge': {
        'attrs': [],
        'content': []
    },
    'feMergeNode': {
        'attrs': [],
        'content': []
    },
    'feMorphology': {
        'attrs': [],
        'content': []
    },
    'feOffset': {
        'attrs': [],
        'content': []
    },
    'fePointLight': {
        'attrs': [],
        'content': []
    },
    'feSpecularLighting': {
        'attrs': [],
        'content': []
    },
    'feSpotLight': {
        'attrs': [],
        'content': []
    },
    'feTile': {
        'attrs': [],
        'content': []
    },
    'feTurbulence': {
        'attrs': [],
        'content': []
    },
    'filter': {
        'attrs': [],
        'content': []
    },
    'font': {
        'attrs': [],
        'content': []
    },
    'font-face': {
        'attrs': [],
        'content': []
    },
    'font-face-format': {
        'attrs': [],
        'content': []
    },
    'font-face-name': {
        'attrs': [],
        'content': []
    },
    'font-face-src': {
        'attrs': [],
        'content': []
    },
    'font-face-uri': {
        'attrs': [],
        'content': []
    },
    'foreignObject': {
        'attrs': [],
        'content': []
    },
    'g': {
        'attrs': [],
        'content': []
    },
    'glyph': {
        'attrs': [],
        'content': []
    },
    'glyphRef': {
        'attrs': [],
        'content': []
    },
    'hkern': {
        'attrs': [],
        'content': []
    },
    'image': {
        'attrs': [],
        'content': []
    },
    'line': {
        'attrs': [],
        'content': []
    },
    'linearGradient': {
        'attrs': [],
        'content': []
    },
    'marker': {
        'attrs': [],
        'content': []
    },
    'mask': {
        'attrs': [],
        'content': []
    },
    'metadata': {
        'attrs': [],
        'content': []
    },
    'missing-glyph': {
        'attrs': [],
        'content': []
    },
    'mpath': {
        'attrs': [],
        'content': []
    },
    'path': {
        'attrs': [],
        'content': []
    },
    'pattern': {
        'attrs': [],
        'content': []
    },
    'polygon': {
        'attrs': [],
        'content': []
    },
    'polyline': {
        'attrs': [],
        'content': []
    },
    'radialGradient': {
        'attrs': [],
        'content': []
    },
    'rect': {
        'attrs': [],
        'content': []
    },
    'script': {
        'attrs': [],
        'content': []
    },
    'set': {
        'attrs': [],
        'content': []
    },
    'stop': {
        'attrs': [],
        'content': []
    },
    'style': {
        'attrs': [],
        'content': []
    },
    'svg': {
        'attrs': [],
        'content': []
    },
    'switch': {
        'attrs': [],
        'content': []
    },
    'symbol': {
        'attrs': [],
        'content': []
    },
    'text': {
        'attrs': [],
        'content': []
    },
    'textPath': {
        'attrs': [],
        'content': []
    },
    'title': {
        'attrs': [],
        'content': []
    },
    'tref': {
        'attrs': [],
        'content': []
    },
    'tspan': {
        'attrs': [],
        'content': []
    },
    'use': {
        'attrs': [],
        'content': []
    },
    'view': {
        'attrs': [],
        'content': []
    },
    'vkern': []
};

// http://www.w3.org/TR/SVG/single-page.html#types-ColorKeywords
exports.colorsNames = {
    'aliceblue': '#f0f8ff',
    'antiquewhite': '#faebd7',
    'aqua': '#00ffff',
    'aquamarine': '#7fffd4',
    'azure': '#f0ffff',
    'beige': '#f5f5dc',
    'bisque': '#ffe4c4',
    'black': '#000000',
    'blanchedalmond': '#ffebcd',
    'blue': '#0000ff',
    'blueviolet': '#8a2be2',
    'brown': '#a52a2a',
    'burlywood': '#deb887',
    'cadetblue': '#5f9ea0',
    'chartreuse': '#7fff00',
    'chocolate': '#d2691e',
    'coral': '#ff7f50',
    'cornflowerblue': '#6495ed',
    'cornsilk': '#fff8dc',
    'crimson': '#dc143c',
    'cyan': '#00ffff',
    'darkblue': '#00008b',
    'darkcyan': '#008b8b',
    'darkgoldenrod': '#b8860b',
    'darkgray': '#a9a9a9',
    'darkgreen': '#006400',
    'darkkhaki': '#bdb76b',
    'darkmagenta': '#8b008b',
    'darkolivegreen': '#556b2f',
    'darkorange': '#ff8c00',
    'darkorchid': '#9932cc',
    'darkred': '#8b0000',
    'darksalmon': '#e9967a',
    'darkseagreen': '#8fbc8f',
    'darkslateblue': '#483d8b',
    'darkslategray': '#2f4f4f',
    'darkturquoise': '#00ced1',
    'darkviolet': '#9400d3',
    'deeppink': '#ff1493',
    'deepskyblue': '#00bfff',
    'dimgray': '#696969',
    'dodgerblue': '#1e90ff',
    'firebrick': '#b22222',
    'floralwhite': '#fffaf0',
    'forestgreen': '#228b22',
    'fuchsia': '#ff00ff',
    'gainsboro': '#dcdcdc',
    'ghostwhite': '#f8f8ff',
    'gold': '#ffd700',
    'goldenrod': '#daa520',
    'gray': '#808080',
    'green': '#008000',
    'greenyellow': '#adff2f',
    'honeydew': '#f0fff0',
    'hotpink': '#ff69b4',
    'indianred': '#cd5c5c',
    'indigo': '#4b0082',
    'ivory': '#fffff0',
    'khaki': '#f0e68c',
    'lavender': '#e6e6fa',
    'lavenderblush': '#fff0f5',
    'lawngreen': '#7cfc00',
    'lemonchiffon': '#fffacd',
    'lightblue': '#add8e6',
    'lightcoral': '#f08080',
    'lightcyan': '#e0ffff',
    'lightgoldenrodyellow': '#fafad2',
    'lightgreen': '#90ee90',
    'lightgrey': '#d3d3d3',
    'lightpink': '#ffb6c1',
    'lightsalmon': '#ffa07a',
    'lightseagreen': '#20b2aa',
    'lightskyblue': '#87cefa',
    'lightslategray': '#778899',
    'lightsteelblue': '#b0c4de',
    'lightyellow': '#ffffe0',
    'lime': '#00ff00',
    'limegreen': '#32cd32',
    'linen': '#faf0e6',
    'magenta': '#ff00ff',
    'maroon': '#800000',
    'mediumaquamarine': '#66cdaa',
    'mediumblue': '#0000cd',
    'mediumorchid': '#ba55d3',
    'mediumpurple': '#9370db',
    'mediumseagreen': '#3cb371',
    'mediumslateblue': '#7b68ee',
    'mediumspringgreen': '#00fa9a',
    'mediumturquoise': '#48d1cc',
    'mediumvioletred': '#c71585',
    'midnightblue': '#191970',
    'mintcream': '#f5fffa',
    'mistyrose': '#ffe4e1',
    'moccasin': '#ffe4b5',
    'navajowhite': '#ffdead',
    'navy': '#000080',
    'oldlace': '#fdf5e6',
    'olive': '#808000',
    'olivedrab': '#6b8e23',
    'orange': '#ffa500',
    'orangered': '#ff4500',
    'orchid': '#da70d6',
    'palegoldenrod': '#eee8aa',
    'palegreen': '#98fb98',
    'paleturquoise': '#afeeee',
    'palevioletred': '#db7093',
    'papayawhip': '#ffefd5',
    'peachpuff': '#ffdab9',
    'peru': '#cd853f',
    'pink': '#ffc0cb',
    'plum': '#dda0dd',
    'powderblue': '#b0e0e6',
    'purple': '#800080',
    'red': '#ff0000',
    'rosybrown': '#bc8f8f',
    'royalblue': '#4169e1',
    'saddlebrown': '#8b4513',
    'salmon': '#fa8072',
    'sandybrown': '#f4a460',
    'seagreen': '#2e8b57',
    'seashell': '#fff5ee',
    'sienna': '#a0522d',
    'silver': '#c0c0c0',
    'skyblue': '#87ceeb',
    'slateblue': '#6a5acd',
    'slategray': '#708090',
    'snow': '#fffafa',
    'springgreen': '#00ff7f',
    'steelblue': '#4682b4',
    'tan': '#d2b48c',
    'teal': '#008080',
    'thistle': '#d8bfd8',
    'tomato': '#ff6347',
    'turquoise': '#40e0d0',
    'violet': '#ee82ee',
    'wheat': '#f5deb3',
    'white': '#ffffff',
    'whitesmoke': '#f5f5f5',
    'yellow': '#ffff00',
    'yellowgreen': '#9acd32'
};

// http://www.w3.org/TR/SVG/single-page.html#types-DataTypeColor
exports.colorsProps = [
    'color', 'fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'
];
