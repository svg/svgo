'use strict';

// http://www.w3.org/TR/SVG/intro.html#Definitions
var elemsGroups = exports.elemsGroups = {
    animation: ['animate', 'animateColor', 'animateMotion', 'animateTransform', 'set'],
    descriptive: ['desc', 'metadata', 'title'],
    shape: ['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect'],
    structural: ['defs', 'g', 'svg', 'symbol', 'use'],
    gradient: ['linearGradient', 'radialGradient'],
    container: ['a', 'defs', 'glyph', 'g', 'marker', 'mask', 'missing-glyph', 'pattern', 'svg', 'switch', 'symbol']
};

// var defaults = exports.defaults = {
//     'externalResourcesRequired': 'false',
//     'xlink:type': 'simple'
// };

// http://www.w3.org/TR/SVG/intro.html#Definitions
var attrsGroups = exports.attrsGroups = {
    animationAddition: ['additive', 'accumulate'],
    animationAttributeTarget: ['attributeType', 'attributeName'],
    animationEvent: ['onbegin', 'onend', 'onrepeat', 'onload'],
    animationTiming: ['begin', 'dur', 'end', 'min', 'max', 'restart', 'repeatCount', 'repeatDur', 'fill'],
    animationValue: ['calcMode', 'values', 'keyTimes', 'keySplines', 'from', 'to', 'by'],
    conditionalProcessing: ['requiredFeatures', 'requiredExtensions', 'systemLanguage'],
    core: ['id', 'xml:base', 'xml:lang', 'xml:space'],
    graphicalEvent: ['onfocusin', 'onfocusout', 'onactivate', 'onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onload'],
    presentation: ['alignment-baseline', 'baseline-shift', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cursor', 'direction', 'display', 'dominant-baseline', 'enable-background', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'image-rendering', 'kerning', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'opacity', 'overflow', 'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'unicode-bidi', 'visibility', 'word-spacing', 'writing-mode'],
    xlink: ['xlink:href', 'xlink:show', 'xlink:actuate', 'xlink:type', 'xlink:role', 'xlink:arcrole', 'xlink:title'],
    documentEvent: ['onunload', 'onabort', 'onerror', 'onresize', 'onscroll', 'onzoom'],
    filterPrimitive: ['x', 'y', 'width', 'height'],
    transferFunction: ['type', 'tableValues', 'slope', 'intercept', 'amplitude', 'exponent', 'offset']
};

var groupDefaults = exports.groupDefaults = {
    core: {'xml:space': 'preserve'},
    filterPrimitive: {x: '0', y: '0', width: '100%', height: '100%'},
    transferFunction: {slope: '1', intercept: '0', amplitude: '1', exponent: '1', offset: '0'}
};

// http://www.w3.org/TR/SVG/eltindex.html
exports.elems = {
    a: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.graphicalEvent,
            attrsGroups.presentation,
            attrsGroups.xlink,
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'target'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            target: '_self'
        },
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive,
            elemsGroups.shape,
            elemsGroups.structural,
            elemsGroups.gradient,
            'a',
            'altGlyphDef',
            'clipPath',
            'color-profile',
            'cursor',
            'filter',
            'font',
            'font-face',
            'foreignObject',
            'image',
            'marker',
            'mask',
            'pattern',
            'script',
            'style',
            'switch',
            'text',
            'view'
        ]
    },
    altGlyph: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.graphicalEvent,
            attrsGroups.presentation,
            attrsGroups.xlink,
            'class',
            'style',
            'externalResourcesRequired',
            'x',
            'y',
            'dx',
            'dy',
            'glyphRef',
            'format',
            'rotate'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        content: []
    },
    altGlyphDef: {
        attrs: [attrsGroups.core],
        groupDefaults: [
            groupDefaults.core
        ],
        content: ['glyphRef']
    },
    altGlyphItem: {
        attrs: [attrsGroups.core],
        groupDefaults: [
            groupDefaults.core
        ],
        content: [
            'glyphRef',
            'altGlyphItem'
        ]
    },
    animate: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.animationAddition,
            attrsGroups.animationAttributeTarget,
            attrsGroups.animationEvent,
            attrsGroups.animationTiming,
            attrsGroups.animationValue,
            attrsGroups.presentation,
            attrsGroups.xlink,
            'externalResourcesRequired'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        content: [elemsGroups.descriptive]
    },
    animateColor: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.animationEvent,
            attrsGroups.xlink,
            attrsGroups.animationAttributeTarget,
            attrsGroups.animationTiming,
            attrsGroups.animationValue,
            attrsGroups.animationAddition,
            attrsGroups.presentation,
            'externalResourcesRequired'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        content: [elemsGroups.descriptive]
    },
    animateMotion: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.animationEvent,
            attrsGroups.xlink,
            attrsGroups.animationTiming,
            attrsGroups.animationValue,
            attrsGroups.animationAddition,
            'externalResourcesRequired',
            'path',
            'keyPoints',
            'rotate',
            'origin'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            'rotate': '0'
        },
        content: [
            elemsGroups.descriptive,
            'mpath'
        ]
    },
    animateTransform: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.animationEvent,
            attrsGroups.xlink,
            attrsGroups.animationAttributeTarget,
            attrsGroups.animationTiming,
            attrsGroups.animationValue,
            attrsGroups.animationAddition,
            'externalResourcesRequired',
            'type'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            type: 'translate'
        },
        content: [elemsGroups.descriptive]
    },
    circle: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.graphicalEvent,
            attrsGroups.presentation,
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'cx',
            'cy',
            'r'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            cx: 0,
            cy: 0
        },
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive
        ]
    },
    clipPath: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.presentation,
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'clipPathUnits'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            clipPathUnits: 'userSpaceOnUse'
        },
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive,
            elemsGroups.shape,
            'text',
            'use'
        ]
    },
    'color-profile': {
        attrs: [
            attrsGroups.core,
            attrsGroups.xlink,
            'local',
            'name',
            'rendering-intent'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            name: 'sRGB',
            'rendering-intent': 'auto'
        },
        content: [elemsGroups.descriptive]
    },
    cursor: {
        attrs: [
            attrsGroups.core,
            attrsGroups.conditionalProcessing,
            attrsGroups.xlink,
            'externalResourcesRequired',
            'x',
            'y'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            x: '0',
            y: '0'
        },
        content: [elemsGroups.descriptive]
    },
    defs: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.graphicalEvent,
            attrsGroups.presentation,
            'class',
            'style',
            'externalResourcesRequired',
            'transform'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive,
            elemsGroups.shape,
            elemsGroups.structural,
            elemsGroups.gradient,
            'a',
            'altGlyphDef',
            'clipPath',
            'color-profile',
            'cursor',
            'filter',
            'font',
            'font-face',
            'foreignObject',
            'image',
            'marker',
            'mask',
            'pattern',
            'script',
            'style',
            'switch',
            'text',
            'view'
        ]
    },
    desc: {
        attrs: [
            attrsGroups.core,
            'class',
            'style'
        ],
        groupDefaults: [
            groupDefaults.core
        ]
    },
    ellipse: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.graphicalEvent,
            attrsGroups.presentation,
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'cx',
            'cy',
            'rx',
            'ry'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            cx: '0',
            cy: '0'
        },
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive
        ]
    },
    feBlend: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style',
            // TODO: in - 'If no value is provided and this is the first filter primitive,
            // then this filter primitive will use SourceGraphic as its input'
            'in',
            'in2',
            'mode'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        defaults: {
            mode: 'normal'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feColorMatrix: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style',
            'in',
            'type',
            'values'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        defaults: {
            type: 'matrix'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feComponentTransfer: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style',
            'in'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        content: [
            'feFuncA',
            'feFuncB',
            'feFuncG',
            'feFuncR'
        ]
    },
    feComposite: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style',
            'in',
            'in2',
            'operator',
            'k1',
            'k2',
            'k3',
            'k4'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        defaults: {
            operator: 'over',
            k1: '0',
            k2: '0',
            k3: '0',
            k4: '0'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feConvolveMatrix: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style',
            'in',
            'order',
            'kernelMatrix',
            // TODO: divisor - 'The default value is the sum of all values in kernelMatrix,
            // with the exception that if the sum is zero, then the divisor is set to 1'
            'divisor',
            'bias',
            // TODO: targetX - 'By default, the convolution matrix is centered in X over each
            // pixel of the input image (i.e., targetX = floor ( orderX / 2 ))'
            'targetX',
            'targetY',
            'edgeMode',
            // TODO: kernelUnitLength - 'The first number is the <dx> value. The second number
            // is the <dy> value. If the <dy> value is not specified, it defaults to the same value as <dx>'
            'kernelUnitLength',
            'preserveAlpha'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        defaults: {
            order: '3',
            bias: '0',
            edgeMode: 'duplicate',
            preserveAlpha: 'false'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feDiffuseLighting: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style',
            'in',
            'surfaceScale',
            'diffuseConstant',
            'kernelUnitLength'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        defaults: {
            surfaceScale: '1',
            diffuseConstant: '1'
        },
        content: [
            elemsGroups.descriptive,
            // TODO: 'exactly one light source element, in any order'
            'feDistantLight',
            'fePointLight',
            'feSpotLight'
        ]
    },
    feDisplacementMap: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style',
            'in',
            'in2',
            'scale',
            'xChannelSelector',
            'yChannelSelector'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        defaults: {
            scale: '0',
            xChannelSelector: 'A',
            yChannelSelector: 'A'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feDistantLight: {
        attrs: [
            attrsGroups.core,
            'azimuth',
            'elevation'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            azimuth: '0',
            elevation: '0'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feFlood: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        content: [
            'animate',
            'animateColor',
            'set'
        ]
    },
    feFuncA: {
        attrs: [
            attrsGroups.core,
            attrsGroups.transferFunction
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.transferFunction
        ],
        content: [
            'set',
            'animate'
        ]
    },
    feFuncB: {
        attrs: [
            attrsGroups.core,
            attrsGroups.transferFunction
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.transferFunction
        ],
        content: [
            'set',
            'animate'
        ]
    },
    feFuncG: {
        attrs: [
            attrsGroups.core,
            attrsGroups.transferFunction
        ],
        groupDefaults: [
            groupDefaults.transferFunction
        ],
        content: [
            'set',
            'animate'
        ]
    },
    feFuncR: {
        attrs: [
            attrsGroups.core,
            attrsGroups.transferFunction
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.transferFunction
        ],
        content: [
            'set',
            'animate'
        ]
    },
    feGaussianBlur: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.filterPrimitive,
            'class',
            'style',
            'in',
            'stdDeviation'
        ],
        groupDefaults: [
            groupDefaults.core,
            groupDefaults.filterPrimitive
        ],
        defaults: {
            stdDeviation: '0'
        },
        content: [
            'set',
            'animate'
        ]
    },
    feImage: {},
    feMerge: {},
    feMergeNode: {},
    feMorphology: {},
    feOffset: {},
    fePointLight: {},
    feSpecularLighting: {},
    feSpotLight: {},
    feTile: {},
    feTurbulence: {},
    filter: {},
    font: {},
    'font-face': {},
    'font-face-format': {},
    'font-face-name': {},
    'font-face-src': {},
    'font-face-uri': {},
    foreignObject: {},
    g: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.graphicalEvent,
            attrsGroups.presentation,
            'class',
            'style',
            'externalResourcesRequired',
            'transform'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive,
            elemsGroups.shape,
            elemsGroups.structural,
            elemsGroups.gradient,
            'a',
            'altGlyphDef',
            'clipPath',
            'color-profile',
            'cursor',
            'filter',
            'font',
            'font-face',
            'foreignObject',
            'image',
            'marker',
            'mask',
            'pattern',
            'script',
            'style',
            'switch',
            'text',
            'view'
        ]
    },
    glyph: {},
    glyphRef: {},
    hkern: {},
    image: {
        attrs: [
            attrsGroups.core,
            attrsGroups.conditionalProcessing,
            attrsGroups.graphicalEvent,
            attrsGroups.xlink,
            attrsGroups.presentation,
            'class',
            'style',
            'externalResourcesRequired',
            'preserveAspectRatio',
            'transform',
            'x',
            'y',
            'width',
            'height',
            'xlink:href'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            x: '0',
            y: '0',
            preserveAspectRatio: 'xMidYMid meet'
        },
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive
        ]
    },
    line: {},
    linearGradient: {
        attrs: [
            attrsGroups.core,
            attrsGroups.presentation,
            attrsGroups.xlink,
            'class',
            'style',
            'externalResourcesRequired',
            'x1',
            'y1',
            'x2',
            'y2',
            'gradientUnits',
            'gradientTransform',
            'spreadMethod',
            'xlink:href'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            x1: '0',
            y1: '0',
            x2: '100%',
            y2: '0',
            spreadMethod: 'pad'
        },
        content: [
            elemsGroups.descriptive,
            'animate',
            'animateTransform',
            'set',
            'stop'
        ]
    },
    marker: {},
    mask: {},
    metadata: {},
    'missing-glyph': {},
    mpath: {},
    path: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.graphicalEvent,
            attrsGroups.presentation,
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'd',
            'pathLength'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive
        ]
    },
    pattern: {},
    polygon: {},
    polyline: {},
    radialGradient: {
        defaults: {
            cx: '50%',
            cy: '50%',
            r: '50%'
        }
    },
    rect: {},
    script: {},
    set: {},
    stop: {},
    style: {},
    svg: {
        attrs: [
            attrsGroups.conditionalProcessing,
            attrsGroups.core,
            attrsGroups.documentEvent,
            attrsGroups.graphicalEvent,
            attrsGroups.presentation,
            'class',
            'style',
            'x',
            'y',
            'width',
            'height',
            'viewBox',
            'preserveAspectRatio',
            'zoomAndPan',
            'version',
            'baseProfile',
            'contentScriptType',
            'contentStyleType'
        ],
        groupDefaults: [
            groupDefaults.core
        ],
        defaults: {
            x: '0',
            y: '0',
            width: '100%',
            height: '100%',
            preserveAspectRatio: 'xMidYMid meet',
            zoomAndPan: 'magnify',
            version: '1.1',
            baseProfile: 'none',
            contentScriptType: 'application/ecmascript',
            contentStyleType: 'text/css'
        },
        content: [
            elemsGroups.animation,
            elemsGroups.descriptive,
            elemsGroups.shape,
            elemsGroups.structural,
            elemsGroups.gradient,
            'a',
            'altGlyphDef',
            'clipPath',
            'color-profile',
            'cursor',
            'filter',
            'font',
            'font-face',
            'foreignObject',
            'image',
            'marker',
            'mask',
            'pattern',
            'script',
            'style',
            'switch',
            'text',
            'view'
        ]
    },
    switch: {},
    symbol: {},
    text: {},
    textPath: {},
    title: {},
    tref: {},
    tspan: {},
    use: {},
    view: {},
    vkern: {}
};


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

// http://www.w3.org/TR/SVG/propidx.html
exports.inheritableAttrs = [
    'clip-rule',
    'color',
    'color-interpolation',
    'color-interpolation-filters',
    'color-profile',
    'color-rendering',
    'cursor',
    'direction',
    'fill',
    'fill-opacity',
    'fill-rule',
    'font',
    'font-family',
    'font-size',
    'font-size-adjust',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',
    'glyph-orientation-horizontal',
    'glyph-orientation-vertical',
    'image-rendering',
    'kerning',
    'letter-spacing',
    'marker',
    'marker-end',
    'marker-mid',
    'marker-start',
    'pointer-events',
    'shape-rendering',
    'stroke',
    'stroke-dasharray',
    'stroke-dashoffset',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-opacity',
    'stroke-width',
    'text-anchor',
    'text-rendering',
    'transform',
    'visibility',
    'word-spacing',
    'writing-mode'
];

// http://www.w3.org/TR/SVG/single-page.html#types-ColorKeywords
exports.colorsNames = {
    'aliceblue': '#f0f8ff',
    'antiquewhite': '#faebd7',
    'aqua': '#0ff',
    'aquamarine': '#7fffd4',
    'azure': '#f0ffff',
    'beige': '#f5f5dc',
    'bisque': '#ffe4c4',
    'black': '#000',
    'blanchedalmond': '#ffebcd',
    'blue': '#00f',
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
    'cyan': '#0ff',
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
    'fuchsia': '#f0f',
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
    'magenta': '#f0f',
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
    'red': '#f00',
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
    'white': '#fff',
    'whitesmoke': '#f5f5f5',
    'yellow': '#ff00',
    'yellowgreen': '#9acd32'
};

// http://www.w3.org/TR/SVG/single-page.html#types-DataTypeColor
exports.colorsProps = [
    'color', 'fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'
];
