var type = 'full';

var active = false;

var description = 'adds attributes to an outer <svg> element';

var ENOCLS = `Error in plugin "addAttributesToSVGElement": absent parameters.
It should have a list of "attributes" or one "attribute".
Config example:

plugins: [
  {
    name: 'addAttributesToSVGElement',
    params: {
      attribute: "mySvg"
    }
  }
]

plugins: [
  {
    name: 'addAttributesToSVGElement',
    params: {
      attributes: ["mySvg", "size-big"]
    }
  }
]

plugins: [
  {
    name: 'addAttributesToSVGElement',
    params: {
      attributes: [
        {
          focusable: false
        },
        {
          'data-image': icon
        }
      ]
    }
  }
]
`;

/**
 * Add attributes to an outer <svg> element. Example config:
 *
 * @author April Arcus
 */
var fn = function(data, params) {
    if (!params || !(Array.isArray(params.attributes) || params.attribute)) {
        console.error(ENOCLS);
        return data;
    }

    var attributes = params.attributes || [ params.attribute ],
        svg = data.content[0];

    if (svg.isElem('svg')) {
        attributes.forEach(function (attribute) {
            if (typeof attribute === 'string') {
                if (!svg.hasAttr(attribute)) {
                    svg.addAttr({
                        name: attribute,
                        prefix: '',
                        local: attribute
                    });
                }
            } else if (typeof attribute === 'object') {
                Object.keys(attribute).forEach(function (key) {
                    if (!svg.hasAttr(key)) {
                        svg.addAttr({
                            name: key,
                            value: attribute[key],
                            prefix: '',
                            local: key
                        });
                    }
                });
            }
        });
    }

    return data;

};

var addAttributesToSVGElement = {
	type: type,
	active: active,
	description: description,
	fn: fn
};

var type$1 = 'full';

var active$1 = false;

var description$1 = 'adds classnames to an outer <svg> element';

var ENOCLS$1 = `Error in plugin "addClassesToSVGElement": absent parameters.
It should have a list of classes in "classNames" or one "className".
Config example:

plugins:
- addClassesToSVGElement:
    className: "mySvg"

plugins:
- addClassesToSVGElement:
    classNames: ["mySvg", "size-big"]
`;

/**
 * Add classnames to an outer <svg> element. Example config:
 *
 * plugins:
 * - addClassesToSVGElement:
 *     className: 'mySvg'
 *
 * plugins:
 * - addClassesToSVGElement:
 *     classNames: ['mySvg', 'size-big']
 *
 * @author April Arcus
 */
var fn$1 = function(data, params) {
    if (!params || !(Array.isArray(params.classNames) && params.classNames.some(String) || params.className)) {
        console.error(ENOCLS$1);
        return data;
    }

    var classNames = params.classNames || [ params.className ],
        svg = data.content[0];

    if (svg.isElem('svg')) {
        svg.class.add.apply(svg.class, classNames);
    }

    return data;

};

var addClassesToSVGElement = {
	type: type$1,
	active: active$1,
	description: description$1,
	fn: fn$1
};

var type$2 = 'perItem';

var active$2 = true;

var description$2 = 'cleanups attributes from newlines, trailing and repeating spaces';

var params = {
    newlines: true,
    trim: true,
    spaces: true
};

var regNewlinesNeedSpace = /(\S)\r?\n(\S)/g,
    regNewlines = /\r?\n/g,
    regSpaces = /\s{2,}/g;

/**
 * Cleanup attributes values from newlines, trailing and repeating spaces.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$2 = function(item, params) {

    if (item.isElem()) {

        item.eachAttr(function(attr) {

            if (params.newlines) {
                // new line which requires a space instead of themselve
                attr.value = attr.value.replace(regNewlinesNeedSpace, function(match, p1, p2) {
                    return p1 + ' ' + p2;
                });

                // simple new line
                attr.value = attr.value.replace(regNewlines, '');
            }

            if (params.trim) {
                attr.value = attr.value.trim();
            }

            if (params.spaces) {
                attr.value = attr.value.replace(regSpaces, ' ');
            }

        });

    }

};

var cleanupAttrs = {
	type: type$2,
	active: active$2,
	description: description$2,
	params: params,
	fn: fn$2
};

var type$3 = 'full';

var active$3 = true;

var description$3 = 'remove or cleanup enable-background attribute when possible';

/**
 * Remove or cleanup enable-background attr which coincides with a width/height box.
 *
 * @see http://www.w3.org/TR/SVG/filters.html#EnableBackgroundProperty
 *
 * @example
 * <svg width="100" height="50" enable-background="new 0 0 100 50">
 *             ⬇
 * <svg width="100" height="50">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$3 = function(data) {

    var regEnableBackground = /^new\s0\s0\s([-+]?\d*\.?\d+([eE][-+]?\d+)?)\s([-+]?\d*\.?\d+([eE][-+]?\d+)?)$/,
        hasFilter = false,
        elems = ['svg', 'mask', 'pattern'];

    function checkEnableBackground(item) {
        if (
            item.isElem(elems) &&
            item.hasAttr('enable-background') &&
            item.hasAttr('width') &&
            item.hasAttr('height')
        ) {

            var match = item.attr('enable-background').value.match(regEnableBackground);

            if (match) {
                if (
                    item.attr('width').value === match[1] &&
                    item.attr('height').value === match[3]
                ) {
                    if (item.isElem('svg')) {
                        item.removeAttr('enable-background');
                    } else {
                        item.attr('enable-background').value = 'new';
                    }
                }
            }

        }
    }

    function checkForFilter(item) {
        if (item.isElem('filter')) {
            hasFilter = true;
        }
    }

    function monkeys(items, fn) {
        items.content.forEach(function(item) {
            fn(item);

            if (item.content) {
                monkeys(item, fn);
            }
        });
        return items;
    }

    var firstStep = monkeys(data, function(item) {
        checkEnableBackground(item);
        if (!hasFilter) {
            checkForFilter(item);
        }
    });

    return hasFilter ? firstStep : monkeys(firstStep, function(item) {
            //we don't need 'enable-background' if we have no filters
            item.removeAttr('enable-background');
        });
};

var cleanupEnableBackground = {
	type: type$3,
	active: active$3,
	description: description$3,
	fn: fn$3
};

// http://www.w3.org/TR/SVG11/intro.html#Definitions
var elemsGroups = {
    animation: ['animate', 'animateColor', 'animateMotion', 'animateTransform', 'set'],
    descriptive: ['desc', 'metadata', 'title'],
    shape: ['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect'],
    structural: ['defs', 'g', 'svg', 'symbol', 'use'],
    paintServer: ['solidColor', 'linearGradient', 'radialGradient', 'meshGradient', 'pattern', 'hatch'],
    nonRendering: ['linearGradient', 'radialGradient', 'pattern', 'clipPath', 'mask', 'marker', 'symbol', 'filter', 'solidColor'],
    container: ['a', 'defs', 'g', 'marker', 'mask', 'missing-glyph', 'pattern', 'svg', 'switch', 'symbol', 'foreignObject'],
    textContent: ['altGlyph', 'altGlyphDef', 'altGlyphItem', 'glyph', 'glyphRef', 'textPath', 'text', 'tref', 'tspan'],
    textContentChild: ['altGlyph', 'textPath', 'tref', 'tspan'],
    lightSource: ['feDiffuseLighting', 'feSpecularLighting', 'feDistantLight', 'fePointLight', 'feSpotLight'],
    filterPrimitive: ['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feFlood', 'feGaussianBlur', 'feImage', 'feMerge', 'feMorphology', 'feOffset', 'feSpecularLighting', 'feTile', 'feTurbulence']
};

var pathElems = ['path', 'glyph', 'missing-glyph'];

// http://www.w3.org/TR/SVG11/intro.html#Definitions
var attrsGroups = {
    animationAddition: ['additive', 'accumulate'],
    animationAttributeTarget: ['attributeType', 'attributeName'],
    animationEvent: ['onbegin', 'onend', 'onrepeat', 'onload'],
    animationTiming: ['begin', 'dur', 'end', 'min', 'max', 'restart', 'repeatCount', 'repeatDur', 'fill'],
    animationValue: ['calcMode', 'values', 'keyTimes', 'keySplines', 'from', 'to', 'by'],
    conditionalProcessing: ['requiredFeatures', 'requiredExtensions', 'systemLanguage'],
    core: ['id', 'tabindex', 'xml:base', 'xml:lang', 'xml:space'],
    graphicalEvent: ['onfocusin', 'onfocusout', 'onactivate', 'onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout', 'onload'],
    presentation: [
        'alignment-baseline',
        'baseline-shift',
        'clip',
        'clip-path',
        'clip-rule',
        'color',
        'color-interpolation',
        'color-interpolation-filters',
        'color-profile',
        'color-rendering',
        'cursor',
        'direction',
        'display',
        'dominant-baseline',
        'enable-background',
        'fill',
        'fill-opacity',
        'fill-rule',
        'filter',
        'flood-color',
        'flood-opacity',
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
        'letter-spacing',
        'lighting-color',
        'marker-end',
        'marker-mid',
        'marker-start',
        'mask',
        'opacity',
        'overflow',
        'paint-order',
        'pointer-events',
        'shape-rendering',
        'stop-color',
        'stop-opacity',
        'stroke',
        'stroke-dasharray',
        'stroke-dashoffset',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-miterlimit',
        'stroke-opacity',
        'stroke-width',
        'text-anchor',
        'text-decoration',
        'text-overflow',
        'text-rendering',
        'transform',
        'unicode-bidi',
        'vector-effect',
        'visibility',
        'word-spacing',
        'writing-mode'
    ],
    xlink: ['xlink:href', 'xlink:show', 'xlink:actuate', 'xlink:type', 'xlink:role', 'xlink:arcrole', 'xlink:title'],
    documentEvent: ['onunload', 'onabort', 'onerror', 'onresize', 'onscroll', 'onzoom'],
    filterPrimitive: ['x', 'y', 'width', 'height', 'result'],
    transferFunction: ['type', 'tableValues', 'slope', 'intercept', 'amplitude', 'exponent', 'offset']
};

var attrsGroupsDefaults = {
    core: {'xml:space': 'preserve'},
    filterPrimitive: {x: '0', y: '0', width: '100%', height: '100%'},
    presentation: {
        clip: 'auto',
        'clip-path': 'none',
        'clip-rule': 'nonzero',
        mask: 'none',
        opacity: '1',
        'stop-color': '#000',
        'stop-opacity': '1',
        'fill-opacity': '1',
        'fill-rule': 'nonzero',
        fill: '#000',
        stroke: 'none',
        'stroke-width': '1',
        'stroke-linecap': 'butt',
        'stroke-linejoin': 'miter',
        'stroke-miterlimit': '4',
        'stroke-dasharray': 'none',
        'stroke-dashoffset': '0',
        'stroke-opacity': '1',
        'paint-order': 'normal',
        'vector-effect': 'none',
        display: 'inline',
        visibility: 'visible',
        'marker-start': 'none',
        'marker-mid': 'none',
        'marker-end': 'none',
        'color-interpolation': 'sRGB',
        'color-interpolation-filters': 'linearRGB',
        'color-rendering': 'auto',
        'shape-rendering': 'auto',
        'text-rendering': 'auto',
        'image-rendering': 'auto',
        'font-style': 'normal',
        'font-variant': 'normal',
        'font-weight': 'normal',
        'font-stretch': 'normal',
        'font-size': 'medium',
        'font-size-adjust': 'none',
        kerning: 'auto',
        'letter-spacing': 'normal',
        'word-spacing': 'normal',
        'text-decoration': 'none',
        'text-anchor': 'start',
        'text-overflow': 'clip',
        'writing-mode': 'lr-tb',
        'glyph-orientation-vertical': 'auto',
        'glyph-orientation-horizontal': '0deg',
        direction: 'ltr',
        'unicode-bidi': 'normal',
        'dominant-baseline': 'auto',
        'alignment-baseline': 'baseline',
        'baseline-shift': 'baseline'
    },
    transferFunction: {slope: '1', intercept: '0', amplitude: '1', exponent: '1', offset: '0'}
};

// http://www.w3.org/TR/SVG11/eltindex.html
var elems = {
    a: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'target'
        ],
        defaults: {
            target: '_self'
        },
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation',
            'xlink'
        ],
        attrs: [
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
        ]
    },
    altGlyphDef: {
        attrsGroups: [
            'core'
        ],
        content: [
            'glyphRef'
        ]
    },
    altGlyphItem: {
        attrsGroups: [
            'core'
        ],
        content: [
            'glyphRef',
            'altGlyphItem'
        ]
    },
    animate: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'animationAddition',
            'animationAttributeTarget',
            'animationEvent',
            'animationTiming',
            'animationValue',
            'presentation',
            'xlink'
        ],
        attrs: [
            'externalResourcesRequired'
        ],
        contentGroups: [
            'descriptive'
        ]
    },
    animateColor: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'animationEvent',
            'xlink',
            'animationAttributeTarget',
            'animationTiming',
            'animationValue',
            'animationAddition',
            'presentation'
        ],
        attrs: [
            'externalResourcesRequired'
        ],
        contentGroups: [
            'descriptive'
        ]
    },
    animateMotion: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'animationEvent',
            'xlink',
            'animationTiming',
            'animationValue',
            'animationAddition'
        ],
        attrs: [
            'externalResourcesRequired',
            'path',
            'keyPoints',
            'rotate',
            'origin'
        ],
        defaults: {
            'rotate': '0'
        },
        contentGroups: [
            'descriptive'
        ],
        content: [
            'mpath'
        ]
    },
    animateTransform: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'animationEvent',
            'xlink',
            'animationAttributeTarget',
            'animationTiming',
            'animationValue',
            'animationAddition'
        ],
        attrs: [
            'externalResourcesRequired',
            'type'
        ],
        contentGroups: [
            'descriptive'
        ]
    },
    circle: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'cx',
            'cy',
            'r'
        ],
        defaults: {
            cx: '0',
            cy: '0'
        },
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    clipPath: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'clipPathUnits'
        ],
        defaults: {
            clipPathUnits: 'userSpaceOnUse'
        },
        contentGroups: [
            'animation',
            'descriptive',
            'shape'
        ],
        content: [
            'text',
            'use'
        ]
    },
    'color-profile': {
        attrsGroups: [
            'core',
            'xlink'
        ],
        attrs: [
            'local',
            'name',
            'rendering-intent'
        ],
        defaults: {
            name: 'sRGB',
            'rendering-intent': 'auto'
        },
        contentGroups: [
            'descriptive'
        ]
    },
    cursor: {
        attrsGroups: [
            'core',
            'conditionalProcessing',
            'xlink'
        ],
        attrs: [
            'externalResourcesRequired',
            'x',
            'y'
        ],
        defaults: {
            x: '0',
            y: '0'
        },
        contentGroups: [
            'descriptive'
        ]
    },
    defs: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform'
        ],
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
        attrsGroups: [
            'core'
        ],
        attrs: [
            'class',
            'style'
        ]
    },
    ellipse: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'cx',
            'cy',
            'rx',
            'ry'
        ],
        defaults: {
            cx: '0',
            cy: '0'
        },
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    feBlend: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            // TODO: in - 'If no value is provided and this is the first filter primitive,
            // then this filter primitive will use SourceGraphic as its input'
            'in',
            'in2',
            'mode'
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
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in',
            'type',
            'values'
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
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in'
        ],
        content: [
            'feFuncA',
            'feFuncB',
            'feFuncG',
            'feFuncR'
        ]
    },
    feComposite: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
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
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
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
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in',
            'surfaceScale',
            'diffuseConstant',
            'kernelUnitLength'
        ],
        defaults: {
            surfaceScale: '1',
            diffuseConstant: '1'
        },
        contentGroups: [
            'descriptive'
        ],
        content: [
            // TODO: 'exactly one light source element, in any order'
            'feDistantLight',
            'fePointLight',
            'feSpotLight'
        ]
    },
    feDisplacementMap: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in',
            'in2',
            'scale',
            'xChannelSelector',
            'yChannelSelector'
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
        attrsGroups: [
            'core'
        ],
        attrs: [
            'azimuth',
            'elevation'
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
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style'
        ],
        content: [
            'animate',
            'animateColor',
            'set'
        ]
    },
    feFuncA: {
        attrsGroups: [
            'core',
            'transferFunction'
        ],
        content: [
            'set',
            'animate'
        ]
    },
    feFuncB: {
        attrsGroups: [
            'core',
            'transferFunction'
        ],
        content: [
            'set',
            'animate'
        ]
    },
    feFuncG: {
        attrsGroups: [
            'core',
            'transferFunction'
        ],
        content: [
            'set',
            'animate'
        ]
    },
    feFuncR: {
        attrsGroups: [
            'core',
            'transferFunction'
        ],
        content: [
            'set',
            'animate'
        ]
    },
    feGaussianBlur: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in',
            'stdDeviation'
        ],
        defaults: {
            stdDeviation: '0'
        },
        content: [
            'set',
            'animate'
        ]
    },
    feImage: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'preserveAspectRatio',
            'href',
            'xlink:href'
        ],
        defaults: {
            preserveAspectRatio: 'xMidYMid meet'
        },
        content: [
            'animate',
            'animateTransform',
            'set'
        ]
    },
    feMerge: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style'
        ],
        content: [
            'feMergeNode'
        ]
    },
    feMergeNode: {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'in'
        ],
        content: [
            'animate',
            'set'
        ]
    },
    feMorphology: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in',
            'operator',
            'radius'
        ],
        defaults: {
            operator: 'erode',
            radius: '0'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feOffset: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in',
            'dx',
            'dy'
        ],
        defaults: {
            dx: '0',
            dy: '0'
        },
        content: [
            'animate',
            'set'
        ]
    },
    fePointLight: {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'x',
            'y',
            'z'
        ],
        defaults: {
            x: '0',
            y: '0',
            z: '0'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feSpecularLighting: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in',
            'surfaceScale',
            'specularConstant',
            'specularExponent',
            'kernelUnitLength'
        ],
        defaults: {
            surfaceScale: '1',
            specularConstant: '1',
            specularExponent: '1'
        },
        contentGroups: [
            'descriptive',
            // TODO: exactly one 'light source element'
            'lightSource'
        ]
    },
    feSpotLight: {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'x',
            'y',
            'z',
            'pointsAtX',
            'pointsAtY',
            'pointsAtZ',
            'specularExponent',
            'limitingConeAngle'
        ],
        defaults: {
            x: '0',
            y: '0',
            z: '0',
            pointsAtX: '0',
            pointsAtY: '0',
            pointsAtZ: '0',
            specularExponent: '1'
        },
        content: [
            'animate',
            'set'
        ]
    },
    feTile: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'in'
        ],
        content: [
            'animate',
            'set'
        ]
    },
    feTurbulence: {
        attrsGroups: [
            'core',
            'presentation',
            'filterPrimitive'
        ],
        attrs: [
            'class',
            'style',
            'baseFrequency',
            'numOctaves',
            'seed',
            'stitchTiles',
            'type'
        ],
        defaults: {
            baseFrequency: '0',
            numOctaves: '1',
            seed: '0',
            stitchTiles: 'noStitch',
            type: 'turbulence'
        },
        content: [
            'animate',
            'set'
        ]
    },
    filter: {
        attrsGroups: [
            'core',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'x',
            'y',
            'width',
            'height',
            'filterRes',
            'filterUnits',
            'primitiveUnits',
            'href',
            'xlink:href'
        ],
        defaults: {
            primitiveUnits: 'userSpaceOnUse',
            x: '-10%',
            y: '-10%',
            width: '120%',
            height: '120%'
        },
        contentGroups: [
            'descriptive',
            'filterPrimitive'
        ],
        content: [
            'animate',
            'set'
        ]
    },
    font: {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'horiz-origin-x',
            'horiz-origin-y',
            'horiz-adv-x',
            'vert-origin-x',
            'vert-origin-y',
            'vert-adv-y'
        ],
        defaults: {
            'horiz-origin-x': '0',
            'horiz-origin-y': '0'
        },
        contentGroups: [
            'descriptive'
        ],
        content: [
            'font-face',
            'glyph',
            'hkern',
            'missing-glyph',
            'vkern'
        ]
    },
    'font-face': {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'font-family',
            'font-style',
            'font-variant',
            'font-weight',
            'font-stretch',
            'font-size',
            'unicode-range',
            'units-per-em',
            'panose-1',
            'stemv',
            'stemh',
            'slope',
            'cap-height',
            'x-height',
            'accent-height',
            'ascent',
            'descent',
            'widths',
            'bbox',
            'ideographic',
            'alphabetic',
            'mathematical',
            'hanging',
            'v-ideographic',
            'v-alphabetic',
            'v-mathematical',
            'v-hanging',
            'underline-position',
            'underline-thickness',
            'strikethrough-position',
            'strikethrough-thickness',
            'overline-position',
            'overline-thickness'
        ],
        defaults: {
            'font-style': 'all',
            'font-variant': 'normal',
            'font-weight': 'all',
            'font-stretch': 'normal',
            'unicode-range': 'U+0-10FFFF',
            'units-per-em': '1000',
            'panose-1': '0 0 0 0 0 0 0 0 0 0',
            'slope': '0'
        },
        contentGroups: [
            'descriptive'
        ],
        content: [
            // TODO: "at most one 'font-face-src' element"
            'font-face-src'
        ]
    },
    // TODO: empty content
    'font-face-format': {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'string'
        ]
    },
    'font-face-name': {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'name'
        ]
    },
    'font-face-src': {
        attrsGroups: [
            'core'
        ],
        content: [
            'font-face-name',
            'font-face-uri'
        ]
    },
    'font-face-uri': {
        attrsGroups: [
            'core',
            'xlink'
        ],
        attrs: [
            'href',
            'xlink:href'
        ],
        content: [
            'font-face-format'
        ]
    },
    foreignObject: {
        attrsGroups: [
            'core',
            'conditionalProcessing',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'x',
            'y',
            'width',
            'height'
        ],
        defaults: {
            x: 0,
            y: 0
        }
    },
    g: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform'
        ],
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
    glyph: {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'd',
            'horiz-adv-x',
            'vert-origin-x',
            'vert-origin-y',
            'vert-adv-y',
            'unicode',
            'glyph-name',
            'orientation',
            'arabic-form',
            'lang'
        ],
        defaults: {
            'arabic-form': 'initial'
        },
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
        ],
    },
    glyphRef: {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'd',
            'horiz-adv-x',
            'vert-origin-x',
            'vert-origin-y',
            'vert-adv-y'
        ],
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
    hatch: {
        attrsGroups: [
            'core',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'x',
            'y',
            'pitch',
            'rotate',
            'hatchUnits',
            'hatchContentUnits',
            'transform'
        ],
        defaults: {
            hatchUnits: 'objectBoundingBox',
            hatchContentUnits: 'userSpaceOnUse',
            x: '0',
            y: '0',
            pitch: '0',
            rotate: '0'
        },
        contentGroups: [
            'animation',
            'descriptive'
        ],
        content: [
            'hatchPath'
        ]
    },
    hatchPath: {
        attrsGroups: [
            'core',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'd',
            'offset'
        ],
        defaults: {
            offset: '0'
        },
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    hkern: {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'u1',
            'g1',
            'u2',
            'g2',
            'k'
        ]
    },
    image: {
        attrsGroups: [
            'core',
            'conditionalProcessing',
            'graphicalEvent',
            'xlink',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'preserveAspectRatio',
            'transform',
            'x',
            'y',
            'width',
            'height',
            'href',
            'xlink:href'
        ],
        defaults: {
            x: '0',
            y: '0',
            preserveAspectRatio: 'xMidYMid meet'
        },
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    line: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'x1',
            'y1',
            'x2',
            'y2'
        ],
        defaults: {
            x1: '0',
            y1: '0',
            x2: '0',
            y2: '0'
        },
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    linearGradient: {
        attrsGroups: [
            'core',
            'presentation',
            'xlink'
        ],
        attrs: [
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
            'href',
            'xlink:href'
        ],
        defaults: {
            x1: '0',
            y1: '0',
            x2: '100%',
            y2: '0',
            spreadMethod: 'pad'
        },
        contentGroups: [
            'descriptive'
        ],
        content: [
            'animate',
            'animateTransform',
            'set',
            'stop'
        ]
    },
    marker: {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'viewBox',
            'preserveAspectRatio',
            'refX',
            'refY',
            'markerUnits',
            'markerWidth',
            'markerHeight',
            'orient'
        ],
        defaults: {
            markerUnits: 'strokeWidth',
            refX: '0',
            refY: '0',
            markerWidth: '3',
            markerHeight: '3'
        },
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
    mask: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'x',
            'y',
            'width',
            'height',
            'mask-type',
            'maskUnits',
            'maskContentUnits'
        ],
        defaults: {
            maskUnits: 'objectBoundingBox',
            maskContentUnits: 'userSpaceOnUse',
            x: '-10%',
            y: '-10%',
            width: '120%',
            height: '120%'
        },
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
    metadata: {
        attrsGroups: [
            'core'
        ]
    },
    'missing-glyph': {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'd',
            'horiz-adv-x',
            'vert-origin-x',
            'vert-origin-y',
            'vert-adv-y'
        ],
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
    mpath: {
        attrsGroups: [
            'core',
            'xlink'
        ],
        attrs: [
            'externalResourcesRequired',
            'href',
            'xlink:href'
        ],
        contentGroups: [
            'descriptive'
        ]
    },
    path: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'd',
            'pathLength'
        ],
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    pattern: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'viewBox',
            'preserveAspectRatio',
            'x',
            'y',
            'width',
            'height',
            'patternUnits',
            'patternContentUnits',
            'patternTransform',
            'href',
            'xlink:href'
        ],
        defaults: {
            patternUnits: 'objectBoundingBox',
            patternContentUnits: 'userSpaceOnUse',
            x: '0',
            y: '0',
            width: '0',
            height: '0',
            preserveAspectRatio: 'xMidYMid meet'
        },
        contentGroups: [
            'animation',
            'descriptive',
            'paintServer',
            'shape',
            'structural'
        ],
        content: [
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
    polygon: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'points'
        ],
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    polyline: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'points'
        ],
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    radialGradient: {
        attrsGroups: [
            'core',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'cx',
            'cy',
            'r',
            'fx',
            'fy',
            'fr',
            'gradientUnits',
            'gradientTransform',
            'spreadMethod',
            'href',
            'xlink:href'
        ],
        defaults: {
            gradientUnits: 'objectBoundingBox',
            cx: '50%',
            cy: '50%',
            r: '50%'
        },
        contentGroups: [
            'descriptive'
        ],
        content: [
            'animate',
            'animateTransform',
            'set',
            'stop'
        ]
    },
    meshGradient: {
        attrsGroups: [
            'core',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'x',
            'y',
            'gradientUnits',
            'transform'
        ],
        contentGroups: [
            'descriptive',
            'paintServer',
            'animation',
        ],
        content: [
            'meshRow'
        ]
    },
    meshRow: {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style'
        ],
        contentGroups: [
            'descriptive'
        ],
        content: [
            'meshPatch'
        ]
    },
    meshPatch: {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style'
        ],
        contentGroups: [
            'descriptive'
        ],
        content: [
            'stop'
        ]
    },
    rect: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'x',
            'y',
            'width',
            'height',
            'rx',
            'ry'
        ],
        defaults: {
            x: '0',
            y: '0'
        },
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    script: {
        attrsGroups: [
            'core',
            'xlink'
        ],
        attrs: [
            'externalResourcesRequired',
            'type',
            'href',
            'xlink:href'
        ]
    },
    set: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'animation',
            'xlink',
            'animationAttributeTarget',
            'animationTiming',
        ],
        attrs: [
            'externalResourcesRequired',
            'to'
        ],
        contentGroups: [
            'descriptive'
        ]
    },
    solidColor: {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style'
        ],
        contentGroups: [
            'paintServer'
        ]
    },
    stop: {
        attrsGroups: [
            'core',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'offset',
            'path'
        ],
        content: [
            'animate',
            'animateColor',
            'set'
        ]
    },
    style: {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'type',
            'media',
            'title'
        ],
        defaults: {
            type: 'text/css'
        }
    },
    svg: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'documentEvent',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
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
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
    switch: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform'
        ],
        contentGroups: [
            'animation',
            'descriptive',
            'shape'
        ],
        content: [
            'a',
            'foreignObject',
            'g',
            'image',
            'svg',
            'switch',
            'text',
            'use'
        ]
    },
    symbol: {
        attrsGroups: [
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'preserveAspectRatio',
            'viewBox',
            'refX',
            'refY'
        ],
        defaults: {
            refX: 0,
            refY: 0
        },
        contentGroups: [
            'animation',
            'descriptive',
            'shape',
            'structural',
            'paintServer'
        ],
        content: [
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
    text: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'lengthAdjust',
            'x',
            'y',
            'dx',
            'dy',
            'rotate',
            'textLength'
        ],
        defaults: {
            x: '0',
            y: '0',
            lengthAdjust: 'spacing'
        },
        contentGroups: [
            'animation',
            'descriptive',
            'textContentChild'
        ],
        content: [
            'a'
        ]
    },
    textPath: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'href',
            'xlink:href',
            'startOffset',
            'method',
            'spacing',
            'd'
        ],
        defaults: {
            startOffset: '0',
            method: 'align',
            spacing: 'exact'
        },
        contentGroups: [
            'descriptive'
        ],
        content: [
            'a',
            'altGlyph',
            'animate',
            'animateColor',
            'set',
            'tref',
            'tspan'
        ]
    },
    title: {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'class',
            'style'
        ]
    },
    tref: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'href',
            'xlink:href'
        ],
        contentGroups: [
            'descriptive'
        ],
        content: [
            'animate',
            'animateColor',
            'set'
        ]
    },
    tspan: {
        attrsGroups: [
            'conditionalProcessing',
            'core',
            'graphicalEvent',
            'presentation'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'x',
            'y',
            'dx',
            'dy',
            'rotate',
            'textLength',
            'lengthAdjust'
        ],
        contentGroups: [
            'descriptive'
        ],
        content: [
            'a',
            'altGlyph',
            'animate',
            'animateColor',
            'set',
            'tref',
            'tspan'
        ]
    },
    use: {
        attrsGroups: [
            'core',
            'conditionalProcessing',
            'graphicalEvent',
            'presentation',
            'xlink'
        ],
        attrs: [
            'class',
            'style',
            'externalResourcesRequired',
            'transform',
            'x',
            'y',
            'width',
            'height',
            'href',
            'xlink:href'
        ],
        defaults: {
            x: '0',
            y: '0'
        },
        contentGroups: [
            'animation',
            'descriptive'
        ]
    },
    view: {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'externalResourcesRequired',
            'viewBox',
            'preserveAspectRatio',
            'zoomAndPan',
            'viewTarget'
        ],
        contentGroups: [
            'descriptive'
        ]
    },
    vkern: {
        attrsGroups: [
            'core'
        ],
        attrs: [
            'u1',
            'g1',
            'u2',
            'g2',
            'k'
        ]
    }
};

// http://wiki.inkscape.org/wiki/index.php/Inkscape-specific_XML_attributes
var editorNamespaces = [
    'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
    'http://inkscape.sourceforge.net/DTD/sodipodi-0.dtd',
    'http://www.inkscape.org/namespaces/inkscape',
    'http://www.bohemiancoding.com/sketch/ns',
    'http://ns.adobe.com/AdobeIllustrator/10.0/',
    'http://ns.adobe.com/Graphs/1.0/',
    'http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/',
    'http://ns.adobe.com/Variables/1.0/',
    'http://ns.adobe.com/SaveForWeb/1.0/',
    'http://ns.adobe.com/Extensibility/1.0/',
    'http://ns.adobe.com/Flows/1.0/',
    'http://ns.adobe.com/ImageReplacement/1.0/',
    'http://ns.adobe.com/GenericCustomNamespace/1.0/',
    'http://ns.adobe.com/XPath/1.0/',
    'http://schemas.microsoft.com/visio/2003/SVGExtensions/',
    'http://taptrix.com/vectorillustrator/svg_extensions',
    'http://www.figma.com/figma/ns',
    'http://purl.org/dc/elements/1.1/',
    'http://creativecommons.org/ns#',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'http://www.serif.com/',
    'http://www.vector.evaxdesign.sk'
];

// http://www.w3.org/TR/SVG11/linking.html#processingIRI
var referencesProps = [
    'clip-path',
    'color-profile',
    'fill',
    'filter',
    'marker-start',
    'marker-mid',
    'marker-end',
    'mask',
    'stroke',
    'style'
];

// http://www.w3.org/TR/SVG11/propidx.html
var inheritableAttrs = [
    'clip-rule',
    'color',
    'color-interpolation',
    'color-interpolation-filters',
    'color-profile',
    'color-rendering',
    'cursor',
    'direction',
    'dominant-baseline',
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
    'letter-spacing',
    'marker',
    'marker-end',
    'marker-mid',
    'marker-start',
    'paint-order',
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

var presentationNonInheritableGroupAttrs = [
    'display',
    'clip-path',
    'filter',
    'mask',
    'opacity',
    'text-decoration',
    'transform',
    'unicode-bidi',
    'visibility'
];

// http://www.w3.org/TR/SVG11/single-page.html#types-ColorKeywords
var colorsNames = {
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
    'darkgrey': '#a9a9a9',
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
    'darkslategrey': '#2f4f4f',
    'darkturquoise': '#00ced1',
    'darkviolet': '#9400d3',
    'deeppink': '#ff1493',
    'deepskyblue': '#00bfff',
    'dimgray': '#696969',
    'dimgrey': '#696969',
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
    'grey': '#808080',
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
    'lightgray': '#d3d3d3',
    'lightgreen': '#90ee90',
    'lightgrey': '#d3d3d3',
    'lightpink': '#ffb6c1',
    'lightsalmon': '#ffa07a',
    'lightseagreen': '#20b2aa',
    'lightskyblue': '#87cefa',
    'lightslategray': '#789',
    'lightslategrey': '#789',
    'lightsteelblue': '#b0c4de',
    'lightyellow': '#ffffe0',
    'lime': '#0f0',
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
    'rebeccapurple': '#639',
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
    'slategrey': '#708090',
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
    'yellow': '#ff0',
    'yellowgreen': '#9acd32'
};

var colorsShortNames = {
  '#f0ffff': 'azure',
  '#f5f5dc': 'beige',
  '#ffe4c4': 'bisque',
  '#a52a2a': 'brown',
  '#ff7f50': 'coral',
  '#ffd700': 'gold',
  '#808080': 'gray',
  '#008000': 'green',
  '#4b0082': 'indigo',
  '#fffff0': 'ivory',
  '#f0e68c': 'khaki',
  '#faf0e6': 'linen',
  '#800000': 'maroon',
  '#000080': 'navy',
  '#808000': 'olive',
  '#ffa500': 'orange',
  '#da70d6': 'orchid',
  '#cd853f': 'peru',
  '#ffc0cb': 'pink',
  '#dda0dd': 'plum',
  '#800080': 'purple',
  '#f00': 'red',
  '#ff0000': 'red',
  '#fa8072': 'salmon',
  '#a0522d': 'sienna',
  '#c0c0c0': 'silver',
  '#fffafa': 'snow',
  '#d2b48c': 'tan',
  '#008080': 'teal',
  '#ff6347': 'tomato',
  '#ee82ee': 'violet',
  '#f5deb3': 'wheat'
};

// http://www.w3.org/TR/SVG11/single-page.html#types-DataTypeColor
var colorsProps = [
    'color', 'fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'
];

var _collections = {
	elemsGroups: elemsGroups,
	pathElems: pathElems,
	attrsGroups: attrsGroups,
	attrsGroupsDefaults: attrsGroupsDefaults,
	elems: elems,
	editorNamespaces: editorNamespaces,
	referencesProps: referencesProps,
	inheritableAttrs: inheritableAttrs,
	presentationNonInheritableGroupAttrs: presentationNonInheritableGroupAttrs,
	colorsNames: colorsNames,
	colorsShortNames: colorsShortNames,
	colorsProps: colorsProps
};

var type$4 = 'full';

var active$4 = true;

var description$4 = 'removes unused IDs and minifies used';

var params$1 = {
    remove: true,
    minify: true,
    prefix: '',
    preserve: [],
    preservePrefixes: [],
    force: false
};

var referencesProps$1 = new Set(_collections.referencesProps),
    regReferencesUrl = /\burl\(("|')?#(.+?)\1\)/,
    regReferencesHref = /^#(.+?)$/,
    regReferencesBegin = /(\w+)\./,
    styleOrScript = ['style', 'script'],
    generateIDchars = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ],
    maxIDindex = generateIDchars.length - 1;

/**
 * Remove unused and minify used IDs
 * (only if there are no any <style> or <script>).
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Kir Belevich
 */
var fn$4 = function(data, params) {
    var currentID,
        currentIDstring,
        IDs = new Map(),
        referencesIDs = new Map(),
        hasStyleOrScript = false,
        preserveIDs = new Set(Array.isArray(params.preserve) ? params.preserve : params.preserve ? [params.preserve] : []),
        preserveIDPrefixes = new Set(Array.isArray(params.preservePrefixes) ? params.preservePrefixes : (params.preservePrefixes ? [params.preservePrefixes] : [])),
        idValuePrefix = '#',
        idValuePostfix = '.';

    /**
     * Bananas!
     *
     * @param {Array} items input items
     * @return {Array} output items
     */
    function monkeys(items) {
        for (var i = 0; i < items.content.length && !hasStyleOrScript; i++) {
            var item = items.content[i];

            // quit if <style> or <script> present ('force' param prevents quitting)
            if (!params.force) {
                var isNotEmpty = Boolean(item.content);
                if (item.isElem(styleOrScript) && isNotEmpty) {
                    hasStyleOrScript = true;
                    continue;
                }

                // Don't remove IDs if the whole SVG consists only of defs.
                if (item.isElem('svg')) {
                    var hasDefsOnly = true;

                    for (var j = 0; j < item.content.length; j++) {
                        if (!item.content[j].isElem('defs')) {
                            hasDefsOnly = false;
                            break;
                        }
                    }
                    if (hasDefsOnly) {
                        break;
                    }
                }
            }
            // …and don't remove any ID if yes
            if (item.isElem()) {
                item.eachAttr(function(attr) {
                    var key, match;

                    // save IDs
                    if (attr.name === 'id') {
                        key = attr.value;
                        if (IDs.has(key)) {
                            item.removeAttr('id'); // remove repeated id
                        } else {
                            IDs.set(key, item);
                        }
                        return;
                    }
                    // save references
                    if (referencesProps$1.has(attr.name) && (match = attr.value.match(regReferencesUrl))) {
                        key = match[2]; // url() reference
                    } else if (
                        attr.local === 'href' && (match = attr.value.match(regReferencesHref)) ||
                        attr.name === 'begin' && (match = attr.value.match(regReferencesBegin))
                    ) {
                        key = match[1]; // href reference
                    }
                    if (key) {
                        var ref = referencesIDs.get(key) || [];
                        ref.push(attr);
                        referencesIDs.set(key, ref);
                    }
                });
            }
            // go deeper
            if (item.content) {
                monkeys(item);
            }
        }
        return items;
    }

    data = monkeys(data);

    if (hasStyleOrScript) {
        return data;
    }

    const idPreserved = id => preserveIDs.has(id) || idMatchesPrefix(preserveIDPrefixes, id);

    for (var ref of referencesIDs) {
        var key = ref[0];

        if (IDs.has(key)) {
            // replace referenced IDs with the minified ones
            if (params.minify && !idPreserved(key)) {
                do {
                    currentIDstring = getIDstring(currentID = generateID(currentID), params);
                } while (idPreserved(currentIDstring));

                IDs.get(key).attr('id').value = currentIDstring;

                for (var attr of ref[1]) {
                    attr.value = attr.value.includes(idValuePrefix) ?
                        attr.value.replace(idValuePrefix + key, idValuePrefix + currentIDstring) :
                        attr.value.replace(key + idValuePostfix, currentIDstring + idValuePostfix);
                }
            }
            // don't remove referenced IDs
            IDs.delete(key);
        }
    }
    // remove non-referenced IDs attributes from elements
    if (params.remove) {
        for(var keyElem of IDs) {
            if (!idPreserved(keyElem[0])) {
                keyElem[1].removeAttr('id');
            }
        }
    }
    return data;
};

/**
 * Check if an ID starts with any one of a list of strings.
 *
 * @param {Array} of prefix strings
 * @param {String} current ID
 * @return {Boolean} if currentID starts with one of the strings in prefixArray
 */
function idMatchesPrefix(prefixArray, currentID) {
    if (!currentID) return false;

    for (var prefix of prefixArray) if (currentID.startsWith(prefix)) return true;
    return false;
}

/**
 * Generate unique minimal ID.
 *
 * @param {Array} [currentID] current ID
 * @return {Array} generated ID array
 */
function generateID(currentID) {
    if (!currentID) return [0];

    currentID[currentID.length - 1]++;

    for(var i = currentID.length - 1; i > 0; i--) {
        if (currentID[i] > maxIDindex) {
            currentID[i] = 0;

            if (currentID[i - 1] !== undefined) {
                currentID[i - 1]++;
            }
        }
    }
    if (currentID[0] > maxIDindex) {
        currentID[0] = 0;
        currentID.unshift(0);
    }
    return currentID;
}

/**
 * Get string from generated ID array.
 *
 * @param {Array} arr input ID array
 * @return {String} output ID string
 */
function getIDstring(arr, params) {
    var str = params.prefix;
    return str + arr.map(i => generateIDchars[i]).join('');
}

var cleanupIDs = {
	type: type$4,
	active: active$4,
	description: description$4,
	params: params$1,
	fn: fn$4
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

var tools = createCommonjsModule(function (module, exports) {

/**
 * Encode plain SVG data string into Data URI string.
 *
 * @param {String} str input string
 * @param {String} type Data URI type
 * @return {String} output string
 */
exports.encodeSVGDatauri = function(str, type) {
    var prefix = 'data:image/svg+xml';
    if (!type || type === 'base64') {
        // base64
        prefix += ';base64,';
        str = prefix + Buffer.from(str).toString('base64');
    } else if (type === 'enc') {
        // URI encoded
        str = prefix + ',' + encodeURIComponent(str);
    } else if (type === 'unenc') {
        // unencoded
        str = prefix + ',' + str;
    }
    return str;
};

/**
 * Decode SVG Data URI string into plain SVG string.
 *
 * @param {string} str input string
 * @return {String} output string
 */
exports.decodeSVGDatauri = function(str) {
    var regexp = /data:image\/svg\+xml(;charset=[^;,]*)?(;base64)?,(.*)/;
    var match = regexp.exec(str);

    // plain string
    if (!match) return str;

    var data = match[3];

    if (match[2]) {
        // base64
        str = Buffer.from(data, 'base64').toString('utf8');
    } else if (data.charAt(0) === '%') {
        // URI encoded
        str = decodeURIComponent(data);
    } else if (data.charAt(0) === '<') {
        // unencoded
        str = data;
    }
    return str;
};

exports.intersectArrays = function(a, b) {
    return a.filter(function(n) {
        return b.indexOf(n) > -1;
    });
};

/**
 * Convert a row of numbers to an optimized string view.
 *
 * @example
 * [0, -1, .5, .5] → "0-1 .5.5"
 *
 * @param {number[]} data
 * @param {Object} params
 * @param {string?} command path data instruction
 * @return {string}
 */
exports.cleanupOutData = function(data, params, command) {
    var str = '',
        delimiter,
        prev;

    data.forEach(function(item, i) {
        // space delimiter by default
        delimiter = ' ';

        // no extra space in front of first number
        if (i == 0) delimiter = '';

        // no extra space after 'arcto' command flags(large-arc and sweep flags)
        // a20 60 45 0 1 30 20 → a20 60 45 0130 20
        if (params.noSpaceAfterFlags && (command == 'A' || command == 'a')) {
            var pos = i % 7;
            if (pos == 4 || pos == 5) delimiter = '';
        }

        // remove floating-point numbers leading zeros
        // 0.5 → .5
        // -0.5 → -.5
        if (params.leadingZero) {
            item = removeLeadingZero(item);
        }

        // no extra space in front of negative number or
        // in front of a floating number if a previous number is floating too
        if (
            params.negativeExtraSpace &&
            delimiter != '' &&
            (item < 0 ||
                (String(item).charCodeAt(0) == 46 && prev % 1 !== 0)
            )
        ) {
            delimiter = '';
        }
        // save prev item value
        prev = item;
        str += delimiter + item;
    });
    return str;
};

/**
 * Remove floating-point numbers leading zero.
 *
 * @example
 * 0.5 → .5
 *
 * @example
 * -0.5 → -.5
 *
 * @param {Float} num input number
 *
 * @return {String} output number as string
 */
var removeLeadingZero = exports.removeLeadingZero = function(num) {
    var strNum = num.toString();

    if (0 < num && num < 1 && strNum.charCodeAt(0) == 48) {
        strNum = strNum.slice(1);
    } else if (-1 < num && num < 0 && strNum.charCodeAt(1) == 48) {
        strNum = strNum.charAt(0) + strNum.slice(2);
    }
    return strNum;
};
});

var type$5 = 'perItem';

var active$5 = false;

var description$5 = 'rounds list of values to the fixed precision';

var params$2 = {
    floatPrecision: 3,
    leadingZero: true,
    defaultPx: true,
    convertToPx: true
};

var regNumericValues = /^([-+]?\d*\.?\d+([eE][-+]?\d+)?)(px|pt|pc|mm|cm|m|in|ft|em|ex|%)?$/,
    regSeparator = /\s+,?\s*|,\s*/,
    removeLeadingZero = tools.removeLeadingZero,
    absoluteLengths = { // relative to px
        cm: 96/2.54,
        mm: 96/25.4,
        in: 96,
        pt: 4/3,
        pc: 16
    };

/**
 * Round list of values to the fixed precision.
 *
 * @example
 * <svg viewBox="0 0 200.28423 200.28423" enable-background="new 0 0 200.28423 200.28423">
 *         ⬇
 * <svg viewBox="0 0 200.284 200.284" enable-background="new 0 0 200.284 200.284">
 *
 *
 * <polygon points="208.250977 77.1308594 223.069336 ... "/>
 *         ⬇
 * <polygon points="208.251 77.131 223.069 ... "/>
 *
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author kiyopikko
 */
var fn$5 = function(item, params) {


    if ( item.hasAttr('points') ) {
        roundValues(item.attrs.points);
    }

    if ( item.hasAttr('enable-background') ) {
        roundValues(item.attrs['enable-background']);
    }

    if ( item.hasAttr('viewBox') ) {
        roundValues(item.attrs.viewBox);
    }

    if ( item.hasAttr('stroke-dasharray') ) {
        roundValues(item.attrs['stroke-dasharray']);
    }

    if ( item.hasAttr('dx') ) {
        roundValues(item.attrs.dx);
    }

    if ( item.hasAttr('dy') ) {
        roundValues(item.attrs.dy);
    }

    if ( item.hasAttr('x') ) {
        roundValues(item.attrs.x);
    }

    if ( item.hasAttr('y') ) {
        roundValues(item.attrs.y);
    }


    function roundValues($prop){

        var num, units,
            match,
            matchNew,
            lists = $prop.value,
            listsArr = lists.split(regSeparator),
            roundedListArr = [],
            roundedList;

        listsArr.forEach(function(elem){

            match = elem.match(regNumericValues);
            matchNew = elem.match(/new/);

             // if attribute value matches regNumericValues
            if (match) {
                // round it to the fixed precision
                num = +(+match[1]).toFixed(params.floatPrecision),
                units = match[3] || '';

                // convert absolute values to pixels
                if (params.convertToPx && units && (units in absoluteLengths)) {
                    var pxNum = +(absoluteLengths[units] * match[1]).toFixed(params.floatPrecision);

                    if (String(pxNum).length < match[0].length)
                        num = pxNum,
                        units = 'px';
                }

                 // and remove leading zero
                if (params.leadingZero) {
                    num = removeLeadingZero(num);
                }

                // remove default 'px' units
                if (params.defaultPx && units === 'px') {
                    units = '';
                }

                roundedListArr.push(num+units);
            }
            // if attribute value is "new"(only enable-background).
            else if (matchNew) {
                roundedListArr.push('new');
            } else if (elem) {
                roundedListArr.push(elem);
            }

        });

        roundedList = roundedListArr.join(' ');
        $prop.value = roundedList;

    }

};

var cleanupListOfValues = {
	type: type$5,
	active: active$5,
	description: description$5,
	params: params$2,
	fn: fn$5
};

var type$6 = 'perItem';

var active$6 = true;

var description$6 = 'rounds numeric values to the fixed precision, removes default ‘px’ units';

var params$3 = {
    floatPrecision: 3,
    leadingZero: true,
    defaultPx: true,
    convertToPx: true
};

var regNumericValues$1 = /^([-+]?\d*\.?\d+([eE][-+]?\d+)?)(px|pt|pc|mm|cm|m|in|ft|em|ex|%)?$/,
    removeLeadingZero$1 = tools.removeLeadingZero,
    absoluteLengths$1 = { // relative to px
        cm: 96/2.54,
        mm: 96/25.4,
        in: 96,
        pt: 4/3,
        pc: 16
    };

/**
 * Round numeric values to the fixed precision,
 * remove default 'px' units.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$6 = function(item, params) {

    if (item.isElem()) {

        var floatPrecision = params.floatPrecision;

        if (item.hasAttr('viewBox')) {
            var nums = item.attr('viewBox').value.split(/\s,?\s*|,\s*/g);
            item.attr('viewBox').value = nums.map(function(value) {
                var num = +value;
                return isNaN(num) ? value : +num.toFixed(floatPrecision);
            }).join(' ');
        }

        item.eachAttr(function(attr) {
            // The `version` attribute is a text string and cannot be rounded
            if (attr.name === 'version') { return }

            var match = attr.value.match(regNumericValues$1);

            // if attribute value matches regNumericValues
            if (match) {
                // round it to the fixed precision
                var num = +(+match[1]).toFixed(floatPrecision),
                    units = match[3] || '';

                // convert absolute values to pixels
                if (params.convertToPx && units && (units in absoluteLengths$1)) {
                    var pxNum = +(absoluteLengths$1[units] * match[1]).toFixed(floatPrecision);

                    if (String(pxNum).length < match[0].length) {
                        num = pxNum;
                        units = 'px';
                    }
                }

                // and remove leading zero
                if (params.leadingZero) {
                    num = removeLeadingZero$1(num);
                }

                // remove default 'px' units
                if (params.defaultPx && units === 'px') {
                    units = '';
                }

                attr.value = num + units;
            }
        });

    }

};

var cleanupNumericValues = {
	type: type$6,
	active: active$6,
	description: description$6,
	params: params$3,
	fn: fn$6
};

var type$7 = 'perItemReverse';

var active$7 = true;

var description$7 = 'collapses useless groups';

var attrsInheritable = _collections.inheritableAttrs,
    animationElems = _collections.elemsGroups.animation;

function hasAnimatedAttr(item) {
    return item.isElem(animationElems) && item.hasAttr('attributeName', this) ||
        !item.isEmpty() && item.content.some(hasAnimatedAttr, this);
}

/*
 * Collapse useless groups.
 *
 * @example
 * <g>
 *     <g attr1="val1">
 *         <path d="..."/>
 *     </g>
 * </g>
 *         ⬇
 * <g>
 *     <g>
 *         <path attr1="val1" d="..."/>
 *     </g>
 * </g>
 *         ⬇
 * <path attr1="val1" d="..."/>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$7 = function(item) {

    // non-empty elements
    if (item.isElem() && !item.isElem('switch') && !item.isEmpty()) {
        item.content.forEach(function(g, i) {
            // non-empty groups
            if (g.isElem('g') && !g.isEmpty()) {
                // move group attibutes to the single content element
                if (g.hasAttr() && g.content.length === 1) {
                    var inner = g.content[0];

                    if (inner.isElem() && !inner.hasAttr('id') && !g.hasAttr('filter') &&
                        !(g.hasAttr('class') && inner.hasAttr('class')) && (
                            !g.hasAttr('clip-path') && !g.hasAttr('mask') ||
                            inner.isElem('g') && !g.hasAttr('transform') && !inner.hasAttr('transform')
                        )
                    ) {
                        g.eachAttr(function(attr) {
                            if (g.content.some(hasAnimatedAttr, attr.name)) return;

                            if (!inner.hasAttr(attr.name)) {
                                inner.addAttr(attr);
                            } else if (attr.name == 'transform') {
                                inner.attr(attr.name).value = attr.value + ' ' + inner.attr(attr.name).value;
                            } else if (inner.hasAttr(attr.name, 'inherit')) {
                                inner.attr(attr.name).value = attr.value;
                            } else if (
                                attrsInheritable.indexOf(attr.name) < 0 &&
                                !inner.hasAttr(attr.name, attr.value)
                            ) {
                                return;
                            }

                            g.removeAttr(attr.name);
                        });
                    }
                }

                // collapse groups without attributes
                if (!g.hasAttr() && !g.content.some(function(item) { return item.isElem(animationElems) })) {
                    item.spliceContent(i, 1, g.content);
                }
            }
        });
    }
};

var collapseGroups = {
	type: type$7,
	active: active$7,
	description: description$7,
	fn: fn$7
};

var type$8 = 'perItem';

var active$8 = true;

var description$8 = 'converts colors: rgb() to #rrggbb and #rrggbb to #rgb';

var params$4 = {
    currentColor: false,
    names2hex: true,
    rgb2hex: true,
    shorthex: true,
    shortname: true
};

var rNumber = '([+-]?(?:\\d*\\.\\d+|\\d+\\.?)%?)',
    rComma = '\\s*,\\s*',
    regRGB = new RegExp('^rgb\\(\\s*' + rNumber + rComma + rNumber + rComma + rNumber + '\\s*\\)$'),
    regHEX = /^#(([a-fA-F0-9])\2){3}$/,
    none = /\bnone\b/i;

/**
 * Convert different colors formats in element attributes to hex.
 *
 * @see http://www.w3.org/TR/SVG/types.html#DataTypeColor
 * @see http://www.w3.org/TR/SVG/single-page.html#types-ColorKeywords
 *
 * @example
 * Convert color name keyword to long hex:
 * fuchsia ➡ #ff00ff
 *
 * Convert rgb() to long hex:
 * rgb(255, 0, 255) ➡ #ff00ff
 * rgb(50%, 100, 100%) ➡ #7f64ff
 *
 * Convert long hex to short hex:
 * #aabbcc ➡ #abc
 *
 * Convert hex to short name
 * #000080 ➡ navy
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$8 = function(item, params) {

    if (item.elem) {

        item.eachAttr(function(attr) {

            if (_collections.colorsProps.indexOf(attr.name) > -1) {

                var val = attr.value,
                    match;

                // Convert colors to currentColor
                if (params.currentColor) {
                    if (typeof params.currentColor === 'string') {
                        match = val === params.currentColor;
                    } else if (params.currentColor.exec) {
                        match = params.currentColor.exec(val);
                    } else {
                        match = !val.match(none);
                    }
                    if (match) {
                        val = 'currentColor';
                    }
                }

                // Convert color name keyword to long hex
                if (params.names2hex && val.toLowerCase() in _collections.colorsNames) {
                    val = _collections.colorsNames[val.toLowerCase()];
                }

                // Convert rgb() to long hex
                if (params.rgb2hex && (match = val.match(regRGB))) {
                    match = match.slice(1, 4).map(function(m) {
                        if (m.indexOf('%') > -1)
                            m = Math.round(parseFloat(m) * 2.55);

                        return Math.max(0, Math.min(m, 255));
                    });

                    val = rgb2hex(match);
                }

                // Convert long hex to short hex
                if (params.shorthex && (match = val.match(regHEX))) {
                    val = '#' + match[0][1] + match[0][3] + match[0][5];
                }

                // Convert hex to short name
                if (params.shortname) {
                    var lowerVal = val.toLowerCase();
                    if (lowerVal in _collections.colorsShortNames) {
                        val = _collections.colorsShortNames[lowerVal];
                    }
                }

                attr.value = val;

            }

        });

    }

};

/**
 * Convert [r, g, b] to #rrggbb.
 *
 * @see https://gist.github.com/983535
 *
 * @example
 * rgb2hex([255, 255, 255]) // '#ffffff'
 *
 * @param {Array} rgb [r, g, b]
 * @return {String} #rrggbb
 *
 * @author Jed Schmidt
 */
function rgb2hex(rgb) {
    return '#' + ('00000' + (rgb[0] << 16 | rgb[1] << 8 | rgb[2]).toString(16)).slice(-6).toUpperCase();
}

var convertColors = {
	type: type$8,
	active: active$8,
	description: description$8,
	params: params$4,
	fn: fn$8
};

var type$9 = 'perItem';

var active$9 = true;

var description$9 = 'converts non-eccentric <ellipse>s to <circle>s';

/**
 * Converts non-eccentric <ellipse>s to <circle>s.
 *
 * @see http://www.w3.org/TR/SVG/shapes.html
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Taylor Hunt
 */
var fn$9 = function(item) {
    if (item.isElem('ellipse')) {
      var rx = item.hasAttr('rx') && item.attr('rx').value || 0;
      var ry = item.hasAttr('ry') && item.attr('ry').value || 0;

      if (rx === ry ||
          rx === 'auto' || ry === 'auto' // SVG2
         ) {
        var radius = rx !== 'auto' ? rx : ry;
        item.renameElem('circle');
        item.removeAttr(['rx', 'ry']);
        item.addAttr({
            name: 'r',
            value: radius,
            prefix: '',
            local: 'r',
          });
      }
  }
  return;
};

var convertEllipseToCircle = {
	type: type$9,
	active: active$9,
	description: description$9,
	fn: fn$9
};

var _transforms = createCommonjsModule(function (module, exports) {

var regTransformTypes = /matrix|translate|scale|rotate|skewX|skewY/,
    regTransformSplit = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/,
    regNumericValues = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

/**
 * Convert transform string to JS representation.
 *
 * @param {String} transformString input string
 * @param {Object} params plugin params
 * @return {Array} output array
 */
exports.transform2js = function(transformString) {

        // JS representation of the transform data
    var transforms = [],
        // current transform context
        current;

    // split value into ['', 'translate', '10 50', '', 'scale', '2', '', 'rotate', '-45', '']
    transformString.split(regTransformSplit).forEach(function(item) {
        var num;

        if (item) {
            // if item is a translate function
            if (regTransformTypes.test(item)) {
                // then collect it and change current context
                transforms.push(current = { name: item });
            // else if item is data
            } else {
                // then split it into [10, 50] and collect as context.data
                // eslint-disable-next-line no-cond-assign
                while (num = regNumericValues.exec(item)) {
                    num = Number(num);
                    if (current.data)
                        current.data.push(num);
                    else
                        current.data = [num];
                }
            }
        }
    });

    // return empty array if broken transform (no data)
    return current && current.data ? transforms : [];
};

/**
 * Multiply transforms into one.
 *
 * @param {Array} input transforms array
 * @return {Array} output matrix array
 */
exports.transformsMultiply = function(transforms) {

    // convert transforms objects to the matrices
    transforms = transforms.map(function(transform) {
        if (transform.name === 'matrix') {
            return transform.data;
        }
        return transformToMatrix(transform);
    });

    // multiply all matrices into one
    transforms = {
        name: 'matrix',
        data: transforms.length > 0 ? transforms.reduce(multiplyTransformMatrices) : []
    };

    return transforms;

};

/**
 * Do math like a schoolgirl.
 *
 * @type {Object}
 */
var mth = exports.mth = {

    rad: function(deg) {
        return deg * Math.PI / 180;
    },

    deg: function(rad) {
        return rad * 180 / Math.PI;
    },

    cos: function(deg) {
        return Math.cos(this.rad(deg));
    },

    acos: function(val, floatPrecision) {
        return +(this.deg(Math.acos(val)).toFixed(floatPrecision));
    },

    sin: function(deg) {
        return Math.sin(this.rad(deg));
    },

    asin: function(val, floatPrecision) {
        return +(this.deg(Math.asin(val)).toFixed(floatPrecision));
    },

    tan: function(deg) {
        return Math.tan(this.rad(deg));
    },

    atan: function(val, floatPrecision) {
        return +(this.deg(Math.atan(val)).toFixed(floatPrecision));
    }

};

/**
 * Decompose matrix into simple transforms. See
 * http://frederic-wang.fr/decomposition-of-2d-transform-matrices.html
 *
 * @param {Object} data matrix transform object
 * @return {Object|Array} transforms array or original transform object
 */
exports.matrixToTransform = function(transform, params) {
    var floatPrecision = params.floatPrecision,
        data = transform.data,
        transforms = [],
        sx = +Math.hypot(data[0], data[1]).toFixed(params.transformPrecision),
        sy = +((data[0] * data[3] - data[1] * data[2]) / sx).toFixed(params.transformPrecision),
        colsSum = data[0] * data[2] + data[1] * data[3],
        rowsSum = data[0] * data[1] + data[2] * data[3],
        scaleBefore = rowsSum != 0 || sx == sy;

    // [..., ..., ..., ..., tx, ty] → translate(tx, ty)
    if (data[4] || data[5]) {
        transforms.push({ name: 'translate', data: data.slice(4, data[5] ? 6 : 5) });
    }

    // [sx, 0, tan(a)·sy, sy, 0, 0] → skewX(a)·scale(sx, sy)
    if (!data[1] && data[2]) {
        transforms.push({ name: 'skewX', data: [mth.atan(data[2] / sy, floatPrecision)] });

    // [sx, sx·tan(a), 0, sy, 0, 0] → skewY(a)·scale(sx, sy)
    } else if (data[1] && !data[2]) {
        transforms.push({ name: 'skewY', data: [mth.atan(data[1] / data[0], floatPrecision)] });
        sx = data[0];
        sy = data[3];

    // [sx·cos(a), sx·sin(a), sy·-sin(a), sy·cos(a), x, y] → rotate(a[, cx, cy])·(scale or skewX) or
    // [sx·cos(a), sy·sin(a), sx·-sin(a), sy·cos(a), x, y] → scale(sx, sy)·rotate(a[, cx, cy]) (if !scaleBefore)
    } else if (!colsSum || (sx == 1 && sy == 1) || !scaleBefore) {
        if (!scaleBefore) {
            sx = (data[0] < 0 ? -1 : 1) * Math.hypot(data[0], data[2]);
            sy = (data[3] < 0 ? -1 : 1) * Math.hypot(data[1], data[3]);
            transforms.push({ name: 'scale', data: [sx, sy] });
        }
        var angle = Math.min(Math.max(-1, data[0] / sx), 1),
            rotate = [mth.acos(angle, floatPrecision) * ((scaleBefore ? 1 : sy) * data[1] < 0 ? -1 : 1)];

        if (rotate[0]) transforms.push({ name: 'rotate', data: rotate });

        if (rowsSum && colsSum) transforms.push({
            name: 'skewX',
            data: [mth.atan(colsSum / (sx * sx), floatPrecision)]
        });

        // rotate(a, cx, cy) can consume translate() within optional arguments cx, cy (rotation point)
        if (rotate[0] && (data[4] || data[5])) {
            transforms.shift();
            var cos = data[0] / sx,
                sin = data[1] / (scaleBefore ? sx : sy),
                x = data[4] * (scaleBefore || sy),
                y = data[5] * (scaleBefore || sx),
                denom = (Math.pow(1 - cos, 2) + Math.pow(sin, 2)) * (scaleBefore || sx * sy);
            rotate.push(((1 - cos) * x - sin * y) / denom);
            rotate.push(((1 - cos) * y + sin * x) / denom);
        }

    // Too many transformations, return original matrix if it isn't just a scale/translate
    } else if (data[1] || data[2]) {
        return transform;
    }

    if (scaleBefore && (sx != 1 || sy != 1) || !transforms.length) transforms.push({
        name: 'scale',
        data: sx == sy ? [sx] : [sx, sy]
    });

    return transforms;
};

/**
 * Convert transform to the matrix data.
 *
 * @param {Object} transform transform object
 * @return {Array} matrix data
 */
function transformToMatrix(transform) {

    if (transform.name === 'matrix') return transform.data;

    var matrix;

    switch (transform.name) {
        case 'translate':
            // [1, 0, 0, 1, tx, ty]
            matrix = [1, 0, 0, 1, transform.data[0], transform.data[1] || 0];
            break;
        case 'scale':
            // [sx, 0, 0, sy, 0, 0]
            matrix = [transform.data[0], 0, 0, transform.data[1] || transform.data[0], 0, 0];
            break;
        case 'rotate':
            // [cos(a), sin(a), -sin(a), cos(a), x, y]
            var cos = mth.cos(transform.data[0]),
                sin = mth.sin(transform.data[0]),
                cx = transform.data[1] || 0,
                cy = transform.data[2] || 0;

            matrix = [cos, sin, -sin, cos, (1 - cos) * cx + sin * cy, (1 - cos) * cy - sin * cx];
            break;
        case 'skewX':
            // [1, 0, tan(a), 1, 0, 0]
            matrix = [1, 0, mth.tan(transform.data[0]), 1, 0, 0];
            break;
        case 'skewY':
            // [1, tan(a), 0, 1, 0, 0]
            matrix = [1, mth.tan(transform.data[0]), 0, 1, 0, 0];
            break;
    }

    return matrix;

}

/**
 * Applies transformation to an arc. To do so, we represent ellipse as a matrix, multiply it
 * by the transformation matrix and use a singular value decomposition to represent in a form
 * rotate(θ)·scale(a b)·rotate(φ). This gives us new ellipse params a, b and θ.
 * SVD is being done with the formulae provided by Wolffram|Alpha (svd {{m0, m2}, {m1, m3}})
 *
 * @param {Array} arc [a, b, rotation in deg]
 * @param {Array} transform transformation matrix
 * @return {Array} arc transformed input arc
 */
exports.transformArc = function(arc, transform) {

    var a = arc[0],
        b = arc[1],
        rot = arc[2] * Math.PI / 180,
        cos = Math.cos(rot),
        sin = Math.sin(rot),
        h = Math.pow(arc[5] * cos + arc[6] * sin, 2) / (4 * a * a) +
            Math.pow(arc[6] * cos - arc[5] * sin, 2) / (4 * b * b);
    if (h > 1) {
        h = Math.sqrt(h);
        a *= h;
        b *= h;
    }
    var ellipse = [a * cos, a * sin, -b * sin, b * cos, 0, 0],
        m = multiplyTransformMatrices(transform, ellipse),
        // Decompose the new ellipse matrix
        lastCol = m[2] * m[2] + m[3] * m[3],
        squareSum = m[0] * m[0] + m[1] * m[1] + lastCol,
        root = Math.hypot(m[0] - m[3], m[1] + m[2]) * Math.hypot(m[0] + m[3], m[1] - m[2]);

    if (!root) { // circle
        arc[0] = arc[1] = Math.sqrt(squareSum / 2);
        arc[2] = 0;
    } else {
        var majorAxisSqr = (squareSum + root) / 2,
            minorAxisSqr = (squareSum - root) / 2,
            major = Math.abs(majorAxisSqr - lastCol) > 1e-6,
            sub = (major ? majorAxisSqr : minorAxisSqr) - lastCol,
            rowsSum = m[0] * m[2] + m[1] * m[3],
            term1 = m[0] * sub + m[2] * rowsSum,
            term2 = m[1] * sub + m[3] * rowsSum;
        arc[0] = Math.sqrt(majorAxisSqr);
        arc[1] = Math.sqrt(minorAxisSqr);
        arc[2] = ((major ? term2 < 0 : term1 > 0) ? -1 : 1) *
            Math.acos((major ? term1 : term2) / Math.hypot(term1, term2)) * 180 / Math.PI;
    }

    if ((transform[0] < 0) !== (transform[3] < 0)) {
        // Flip the sweep flag if coordinates are being flipped horizontally XOR vertically
        arc[4] = 1 - arc[4];
    }

    return arc;

};

/**
 * Multiply transformation matrices.
 *
 * @param {Array} a matrix A data
 * @param {Array} b matrix B data
 * @return {Array} result
 */
function multiplyTransformMatrices(a, b) {

    return [
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4],
        a[1] * b[4] + a[3] * b[5] + a[5]
    ];

}
});

var _path = createCommonjsModule(function (module, exports) {

var rNumber = String.raw`[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?\s*`,
    rCommaWsp = String.raw`(?:\s,?\s*|,\s*)`,
    rNumberCommaWsp = `(${rNumber})` + rCommaWsp,
    rFlagCommaWsp = `([01])${rCommaWsp}?`,
    rCoordinatePair = String.raw`(${rNumber})${rCommaWsp}?(${rNumber})`,
    rArcSeq = (rNumberCommaWsp + '?').repeat(2) + rNumberCommaWsp + rFlagCommaWsp.repeat(2) + rCoordinatePair;

var regPathInstructions = /([MmLlHhVvCcSsQqTtAaZz])\s*/,
    regCoordinateSequence = new RegExp(rNumber, 'g'),
    regArcArgumentSequence = new RegExp(rArcSeq, 'g'),
    regNumericValues = /[-+]?(\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/,
    transform2js = _transforms.transform2js,
    transformsMultiply = _transforms.transformsMultiply,
    transformArc = _transforms.transformArc,
    referencesProps = _collections.referencesProps,
    defaultStrokeWidth = _collections.attrsGroupsDefaults.presentation['stroke-width'],
    cleanupOutData = tools.cleanupOutData,
    removeLeadingZero = tools.removeLeadingZero,
    prevCtrlPoint;

/**
 * Convert path string to JS representation.
 *
 * @param {String} pathString input string
 * @param {Object} params plugin params
 * @return {Array} output array
 */
exports.path2js = function(path) {
    if (path.pathJS) return path.pathJS;

    var paramsLength = { // Number of parameters of every path command
            H: 1, V: 1, M: 2, L: 2, T: 2, Q: 4, S: 4, C: 6, A: 7,
            h: 1, v: 1, m: 2, l: 2, t: 2, q: 4, s: 4, c: 6, a: 7
        },
        pathData = [],   // JS representation of the path data
        instruction, // current instruction context
        startMoveto = false;

    // splitting path string into array like ['M', '10 50', 'L', '20 30']
    path.attr('d').value.split(regPathInstructions).forEach(function(data) {
        if (!data) return;
        if (!startMoveto) {
            if (data == 'M' || data == 'm') {
                startMoveto = true;
            } else return;
        }

        // instruction item
        if (regPathInstructions.test(data)) {
            instruction = data;

            // z - instruction w/o data
            if (instruction == 'Z' || instruction == 'z') {
                pathData.push({
                    instruction: 'z'
                });
            }
        // data item
        } else {
            if (instruction == 'A' || instruction == 'a') {
                var newData = [];
                for (var args; (args = regArcArgumentSequence.exec(data));) {
                    for (var i = 1; i < args.length; i++) {
                        newData.push(args[i]);
                    }
                }
                data = newData;
            } else {
                data = data.match(regCoordinateSequence);
            }
            if (!data) return;

            data = data.map(Number);
            // Subsequent moveto pairs of coordinates are threated as implicit lineto commands
            // http://www.w3.org/TR/SVG/paths.html#PathDataMovetoCommands
            if (instruction == 'M' || instruction == 'm') {
                pathData.push({
                    instruction: pathData.length == 0 ? 'M' : instruction,
                    data: data.splice(0, 2)
                });
                instruction = instruction == 'M' ? 'L' : 'l';
            }

            for (var pair = paramsLength[instruction]; data.length;) {
                pathData.push({
                    instruction: instruction,
                    data: data.splice(0, pair)
                });
            }
        }
    });

    // First moveto is actually absolute. Subsequent coordinates were separated above.
    if (pathData.length && pathData[0].instruction == 'm') {
        pathData[0].instruction = 'M';
    }
    path.pathJS = pathData;

    return pathData;
};

/**
 * Convert relative Path data to absolute.
 *
 * @param {Array} data input data
 * @return {Array} output data
 */
var relative2absolute = exports.relative2absolute = function(data) {
    var currentPoint = [0, 0],
        subpathPoint = [0, 0],
        i;

    return data.map(function(item) {

        var instruction = item.instruction,
            itemData = item.data && item.data.slice();

        if (instruction == 'M') {

            set(currentPoint, itemData);
            set(subpathPoint, itemData);

        } else if ('mlcsqt'.indexOf(instruction) > -1) {

            for (i = 0; i < itemData.length; i++) {
                itemData[i] += currentPoint[i % 2];
            }
            set(currentPoint, itemData);

            if (instruction == 'm') {
                set(subpathPoint, itemData);
            }

        } else if (instruction == 'a') {

            itemData[5] += currentPoint[0];
            itemData[6] += currentPoint[1];
            set(currentPoint, itemData);

        } else if (instruction == 'h') {

            itemData[0] += currentPoint[0];
            currentPoint[0] = itemData[0];

        } else if (instruction == 'v') {

            itemData[0] += currentPoint[1];
            currentPoint[1] = itemData[0];

        } else if ('MZLCSQTA'.indexOf(instruction) > -1) {

            set(currentPoint, itemData);

        } else if (instruction == 'H') {

            currentPoint[0] = itemData[0];

        } else if (instruction == 'V') {

            currentPoint[1] = itemData[0];

        } else if (instruction == 'z') {

            set(currentPoint, subpathPoint);

        }

        return instruction == 'z' ?
            { instruction: 'z' } :
            {
                instruction: instruction.toUpperCase(),
                data: itemData
            };

    });
};

/**
 * Apply transformation(s) to the Path data.
 *
 * @param {Object} elem current element
 * @param {Array} path input path data
 * @param {Object} params whether to apply transforms to stroked lines and transform precision (used for stroke width)
 * @return {Array} output path data
 */
exports.applyTransforms = function(elem, path, params) {
    // if there are no 'stroke' attr and references to other objects such as
    // gradiends or clip-path which are also subjects to transform.
    if (!elem.hasAttr('transform') || !elem.attr('transform').value ||
        elem.someAttr(function(attr) {
            return ~referencesProps.indexOf(attr.name) && ~attr.value.indexOf('url(');
        }))
        return path;

    var matrix = transformsMultiply(transform2js(elem.attr('transform').value)),
        stroke = elem.computedAttr('stroke'),
        id = elem.computedAttr('id'),
        transformPrecision = params.transformPrecision,
        newPoint, scale;

    if (stroke && stroke != 'none') {
        if (!params.applyTransformsStroked ||
            (matrix.data[0] != matrix.data[3] || matrix.data[1] != -matrix.data[2]) &&
            (matrix.data[0] != -matrix.data[3] || matrix.data[1] != matrix.data[2]))
            return path;

        // "stroke-width" should be inside the part with ID, otherwise it can be overrided in <use>
        if (id) {
            var idElem = elem,
                hasStrokeWidth = false;

            do {
                if (idElem.hasAttr('stroke-width')) hasStrokeWidth = true;
            } while (!idElem.hasAttr('id', id) && !hasStrokeWidth && (idElem = idElem.parentNode));

            if (!hasStrokeWidth) return path;
        }

        scale = +Math.sqrt(matrix.data[0] * matrix.data[0] + matrix.data[1] * matrix.data[1]).toFixed(transformPrecision);

        if (scale !== 1) {
            var strokeWidth = elem.computedAttr('stroke-width') || defaultStrokeWidth;

            if (!elem.hasAttr('vector-effect') || elem.attr('vector-effect').value !== 'non-scaling-stroke') {
                if (elem.hasAttr('stroke-width')) {
                    elem.attrs['stroke-width'].value = elem.attrs['stroke-width'].value.trim()
                        .replace(regNumericValues, function(num) {
                            return removeLeadingZero(num * scale);
                        });
                } else {
                    elem.addAttr({
                        name: 'stroke-width',
                        prefix: '',
                        local: 'stroke-width',
                        value: strokeWidth.replace(regNumericValues, function(num) {
                            return removeLeadingZero(num * scale);
                        })
                    });
                }
            }
        }
    } else if (id) { // Stroke and stroke-width can be redefined with <use>
        return path;
    }

    path.forEach(function(pathItem) {

        if (pathItem.data) {

            // h -> l
            if (pathItem.instruction === 'h') {

                pathItem.instruction = 'l';
                pathItem.data[1] = 0;

            // v -> l
            } else if (pathItem.instruction === 'v') {

                pathItem.instruction = 'l';
                pathItem.data[1] = pathItem.data[0];
                pathItem.data[0] = 0;

            }

            // if there is a translate() transform
            if (pathItem.instruction === 'M' &&
                (matrix.data[4] !== 0 ||
                matrix.data[5] !== 0)
            ) {

                // then apply it only to the first absoluted M
                newPoint = transformPoint(matrix.data, pathItem.data[0], pathItem.data[1]);
                set(pathItem.data, newPoint);
                set(pathItem.coords, newPoint);

                // clear translate() data from transform matrix
                matrix.data[4] = 0;
                matrix.data[5] = 0;

            } else {

                if (pathItem.instruction == 'a') {

                    transformArc(pathItem.data, matrix.data);

                    // reduce number of digits in rotation angle
                    if (Math.abs(pathItem.data[2]) > 80) {
                        var a = pathItem.data[0],
                            rotation = pathItem.data[2];
                        pathItem.data[0] = pathItem.data[1];
                        pathItem.data[1] = a;
                        pathItem.data[2] = rotation + (rotation > 0 ? -90 : 90);
                    }

                    newPoint = transformPoint(matrix.data, pathItem.data[5], pathItem.data[6]);
                    pathItem.data[5] = newPoint[0];
                    pathItem.data[6] = newPoint[1];

                } else {

                    for (var i = 0; i < pathItem.data.length; i += 2) {
                        newPoint = transformPoint(matrix.data, pathItem.data[i], pathItem.data[i + 1]);
                        pathItem.data[i] = newPoint[0];
                        pathItem.data[i + 1] = newPoint[1];
                    }
                }

                pathItem.coords[0] = pathItem.base[0] + pathItem.data[pathItem.data.length - 2];
                pathItem.coords[1] = pathItem.base[1] + pathItem.data[pathItem.data.length - 1];

            }

        }

    });

    // remove transform attr
    elem.removeAttr('transform');

    return path;
};

/**
 * Apply transform 3x3 matrix to x-y point.
 *
 * @param {Array} matrix transform 3x3 matrix
 * @param {Array} point x-y point
 * @return {Array} point with new coordinates
 */
function transformPoint(matrix, x, y) {

    return [
        matrix[0] * x + matrix[2] * y + matrix[4],
        matrix[1] * x + matrix[3] * y + matrix[5]
    ];

}

/**
 * Compute Cubic Bézie bounding box.
 *
 * @see http://processingjs.nihongoresources.com/bezierinfo/
 *
 * @param {Float} xa
 * @param {Float} ya
 * @param {Float} xb
 * @param {Float} yb
 * @param {Float} xc
 * @param {Float} yc
 * @param {Float} xd
 * @param {Float} yd
 *
 * @return {Object}
 */
exports.computeCubicBoundingBox = function(xa, ya, xb, yb, xc, yc, xd, yd) {

    var minx = Number.POSITIVE_INFINITY,
        miny = Number.POSITIVE_INFINITY,
        maxx = Number.NEGATIVE_INFINITY,
        maxy = Number.NEGATIVE_INFINITY,
        ts,
        t,
        x,
        y,
        i;

    // X
    if (xa < minx) { minx = xa; }
    if (xa > maxx) { maxx = xa; }
    if (xd < minx) { minx= xd; }
    if (xd > maxx) { maxx = xd; }

    ts = computeCubicFirstDerivativeRoots(xa, xb, xc, xd);

    for (i = 0; i < ts.length; i++) {

        t = ts[i];

        if (t >= 0 && t <= 1) {
            x = computeCubicBaseValue(t, xa, xb, xc, xd);
            // y = computeCubicBaseValue(t, ya, yb, yc, yd);

            if (x < minx) { minx = x; }
            if (x > maxx) { maxx = x; }
        }

    }

    // Y
    if (ya < miny) { miny = ya; }
    if (ya > maxy) { maxy = ya; }
    if (yd < miny) { miny = yd; }
    if (yd > maxy) { maxy = yd; }

    ts = computeCubicFirstDerivativeRoots(ya, yb, yc, yd);

    for (i = 0; i < ts.length; i++) {

        t = ts[i];

        if (t >= 0 && t <= 1) {
            // x = computeCubicBaseValue(t, xa, xb, xc, xd);
            y = computeCubicBaseValue(t, ya, yb, yc, yd);

            if (y < miny) { miny = y; }
            if (y > maxy) { maxy = y; }
        }

    }

    return {
        minx: minx,
        miny: miny,
        maxx: maxx,
        maxy: maxy
    };

};

// compute the value for the cubic bezier function at time=t
function computeCubicBaseValue(t, a, b, c, d) {

    var mt = 1 - t;

    return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;

}

// compute the value for the first derivative of the cubic bezier function at time=t
function computeCubicFirstDerivativeRoots(a, b, c, d) {

    var result = [-1, -1],
        tl = -a + 2 * b - c,
        tr = -Math.sqrt(-a * (c - d) + b * b - b * (c + d) + c * c),
        dn = -a + 3 * b - 3 * c + d;

    if (dn !== 0) {
        result[0] = (tl + tr) / dn;
        result[1] = (tl - tr) / dn;
    }

    return result;

}

/**
 * Compute Quadratic Bézier bounding box.
 *
 * @see http://processingjs.nihongoresources.com/bezierinfo/
 *
 * @param {Float} xa
 * @param {Float} ya
 * @param {Float} xb
 * @param {Float} yb
 * @param {Float} xc
 * @param {Float} yc
 *
 * @return {Object}
 */
exports.computeQuadraticBoundingBox = function(xa, ya, xb, yb, xc, yc) {

    var minx = Number.POSITIVE_INFINITY,
        miny = Number.POSITIVE_INFINITY,
        maxx = Number.NEGATIVE_INFINITY,
        maxy = Number.NEGATIVE_INFINITY,
        t,
        x,
        y;

    // X
    if (xa < minx) { minx = xa; }
    if (xa > maxx) { maxx = xa; }
    if (xc < minx) { minx = xc; }
    if (xc > maxx) { maxx = xc; }

    t = computeQuadraticFirstDerivativeRoot(xa, xb, xc);

    if (t >= 0 && t <= 1) {
        x = computeQuadraticBaseValue(t, xa, xb, xc);
        // y = computeQuadraticBaseValue(t, ya, yb, yc);

        if (x < minx) { minx = x; }
        if (x > maxx) { maxx = x; }
    }

    // Y
    if (ya < miny) { miny = ya; }
    if (ya > maxy) { maxy = ya; }
    if (yc < miny) { miny = yc; }
    if (yc > maxy) { maxy = yc; }

    t = computeQuadraticFirstDerivativeRoot(ya, yb, yc);

    if (t >= 0 && t <=1 ) {
        // x = computeQuadraticBaseValue(t, xa, xb, xc);
        y = computeQuadraticBaseValue(t, ya, yb, yc);

        if (y < miny) { miny = y; }
        if (y > maxy) { maxy = y ; }

    }

    return {
        minx: minx,
        miny: miny,
        maxx: maxx,
        maxy: maxy
    };

};

// compute the value for the quadratic bezier function at time=t
function computeQuadraticBaseValue(t, a, b, c) {

    var mt = 1 - t;

    return mt * mt * a + 2 * mt * t * b + t * t * c;

}

// compute the value for the first derivative of the quadratic bezier function at time=t
function computeQuadraticFirstDerivativeRoot(a, b, c) {

    var t = -1,
        denominator = a - 2 * b + c;

    if (denominator !== 0) {
        t = (a - b) / denominator;
    }

    return t;

}

/**
 * Convert path array to string.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {String} output path string
 */
exports.js2path = function(path, data, params) {

    path.pathJS = data;

    if (params.collapseRepeated) {
        data = collapseRepeated(data);
    }

    path.attr('d').value = data.reduce(function(pathString, item) {
        var strData = '';
        if (item.data) {
            strData = cleanupOutData(item.data, params, item.instruction);
        }
        return pathString += item.instruction + strData;
    }, '');

};

/**
 * Collapse repeated instructions data
 *
 * @param {Array} path input path data
 * @return {Array} output path data
 */
function collapseRepeated(data) {

    var prev,
        prevIndex;

    // copy an array and modifieds item to keep original data untouched
    data = data.reduce(function(newPath, item) {
        if (
            prev && item.data &&
            item.instruction == prev.instruction
        ) {
            // concat previous data with current
            if (item.instruction != 'M') {
                prev = newPath[prevIndex] = {
                    instruction: prev.instruction,
                    data: prev.data.concat(item.data),
                    coords: item.coords,
                    base: prev.base
                };
            } else {
                prev.data = item.data;
                prev.coords = item.coords;
            }
        } else {
            newPath.push(item);
            prev = item;
            prevIndex = newPath.length - 1;
        }

        return newPath;
    }, []);

    return data;

}

function set(dest, source) {
    dest[0] = source[source.length - 2];
    dest[1] = source[source.length - 1];
    return dest;
}

/**
 * Checks if two paths have an intersection by checking convex hulls
 * collision using Gilbert-Johnson-Keerthi distance algorithm
 * http://entropyinteractive.com/2011/04/gjk-algorithm/
 *
 * @param {Array} path1 JS path representation
 * @param {Array} path2 JS path representation
 * @return {Boolean}
 */
exports.intersects = function(path1, path2) {
    // Collect points of every subpath.
    var points1 = relative2absolute(path1).reduce(gatherPoints, []),
        points2 = relative2absolute(path2).reduce(gatherPoints, []);

    // Axis-aligned bounding box check.
    if (points1.maxX <= points2.minX || points2.maxX <= points1.minX ||
        points1.maxY <= points2.minY || points2.maxY <= points1.minY ||
        points1.every(function (set1) {
            return points2.every(function (set2) {
                return set1[set1.maxX][0] <= set2[set2.minX][0] ||
                    set2[set2.maxX][0] <= set1[set1.minX][0] ||
                    set1[set1.maxY][1] <= set2[set2.minY][1] ||
                    set2[set2.maxY][1] <= set1[set1.minY][1];
            });
        })
    ) return false;

    // Get a convex hull from points of each subpath. Has the most complexity O(n·log n).
    var hullNest1 = points1.map(convexHull),
        hullNest2 = points2.map(convexHull);

    // Check intersection of every subpath of the first path with every subpath of the second.
    return hullNest1.some(function(hull1) {
        if (hull1.length < 3) return false;

        return hullNest2.some(function(hull2) {
            if (hull2.length < 3) return false;

            var simplex = [getSupport(hull1, hull2, [1, 0])], // create the initial simplex
                direction = minus(simplex[0]); // set the direction to point towards the origin

            var iterations = 1e4; // infinite loop protection, 10 000 iterations is more than enough
            // eslint-disable-next-line no-constant-condition
            while (true) {
                // eslint-disable-next-line no-constant-condition
                if (iterations-- == 0) {
                    console.error('Error: infinite loop while processing mergePaths plugin.');
                    return true; // true is the safe value that means “do nothing with paths”
                }
                // add a new point
                simplex.push(getSupport(hull1, hull2, direction));
                // see if the new point was on the correct side of the origin
                if (dot(direction, simplex[simplex.length - 1]) <= 0) return false;
                // process the simplex
                if (processSimplex(simplex, direction)) return true;
            }
        });
    });

    function getSupport(a, b, direction) {
        return sub(supportPoint(a, direction), supportPoint(b, minus(direction)));
    }

    // Computes farthest polygon point in particular direction.
    // Thanks to knowledge of min/max x and y coordinates we can choose a quadrant to search in.
    // Since we're working on convex hull, the dot product is increasing until we find the farthest point.
    function supportPoint(polygon, direction) {
        var index = direction[1] >= 0 ?
                direction[0] < 0 ? polygon.maxY : polygon.maxX :
                direction[0] < 0 ? polygon.minX : polygon.minY,
            max = -Infinity,
            value;
        while ((value = dot(polygon[index], direction)) > max) {
            max = value;
            index = ++index % polygon.length;
        }
        return polygon[(index || polygon.length) - 1];
    }
};

function processSimplex(simplex, direction) {

    // we only need to handle to 1-simplex and 2-simplex
    if (simplex.length == 2) { // 1-simplex
        let a = simplex[1],
            b = simplex[0],
            AO = minus(simplex[1]),
            AB = sub(b, a);
        // AO is in the same direction as AB
        if (dot(AO, AB) > 0) {
            // get the vector perpendicular to AB facing O
            set(direction, orth(AB, a));
        } else {
            set(direction, AO);
            // only A remains in the simplex
            simplex.shift();
        }
    } else { // 2-simplex
        let a = simplex[2], // [a, b, c] = simplex
            b = simplex[1],
            c = simplex[0],
            AB = sub(b, a),
            AC = sub(c, a),
            AO = minus(a),
            ACB = orth(AB, AC), // the vector perpendicular to AB facing away from C
            ABC = orth(AC, AB); // the vector perpendicular to AC facing away from B

        if (dot(ACB, AO) > 0) {
            if (dot(AB, AO) > 0) { // region 4
                set(direction, ACB);
                simplex.shift(); // simplex = [b, a]
            } else { // region 5
                set(direction, AO);
                simplex.splice(0, 2); // simplex = [a]
            }
        } else if (dot(ABC, AO) > 0) {
            if (dot(AC, AO) > 0) { // region 6
                set(direction, ABC);
                simplex.splice(1, 1); // simplex = [c, a]
            } else { // region 5 (again)
                set(direction, AO);
                simplex.splice(0, 2); // simplex = [a]
            }
        } else // region 7
            return true;
    }
    return false;
}

function minus(v) {
    return [-v[0], -v[1]];
}

function sub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]];
}

function dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1];
}

function orth(v, from) {
    var o = [-v[1], v[0]];
    return dot(o, minus(from)) < 0 ? minus(o) : o;
}

function gatherPoints(points, item, index, path) {

    var subPath = points.length && points[points.length - 1],
        prev = index && path[index - 1],
        basePoint = subPath.length && subPath[subPath.length - 1],
        data = item.data,
        ctrlPoint = basePoint;

    switch (item.instruction) {
        case 'M':
            points.push(subPath = []);
            break;
        case 'H':
            addPoint(subPath, [data[0], basePoint[1]]);
            break;
        case 'V':
            addPoint(subPath, [basePoint[0], data[0]]);
            break;
        case 'Q':
            addPoint(subPath, data.slice(0, 2));
            prevCtrlPoint = [data[2] - data[0], data[3] - data[1]]; // Save control point for shorthand
            break;
        case 'T':
            if (prev.instruction == 'Q' || prev.instruction == 'T') {
                ctrlPoint = [basePoint[0] + prevCtrlPoint[0], basePoint[1] + prevCtrlPoint[1]];
                addPoint(subPath, ctrlPoint);
                prevCtrlPoint = [data[0] - ctrlPoint[0], data[1] - ctrlPoint[1]];
            }
            break;
        case 'C':
            // Approximate quibic Bezier curve with middle points between control points
            addPoint(subPath, [.5 * (basePoint[0] + data[0]), .5 * (basePoint[1] + data[1])]);
            addPoint(subPath, [.5 * (data[0] + data[2]), .5 * (data[1] + data[3])]);
            addPoint(subPath, [.5 * (data[2] + data[4]), .5 * (data[3] + data[5])]);
            prevCtrlPoint = [data[4] - data[2], data[5] - data[3]]; // Save control point for shorthand
            break;
        case 'S':
            if (prev.instruction == 'C' || prev.instruction == 'S') {
                addPoint(subPath, [basePoint[0] + .5 * prevCtrlPoint[0], basePoint[1] + .5 * prevCtrlPoint[1]]);
                ctrlPoint = [basePoint[0] + prevCtrlPoint[0], basePoint[1] + prevCtrlPoint[1]];
            }
            addPoint(subPath, [.5 * (ctrlPoint[0] + data[0]), .5 * (ctrlPoint[1]+ data[1])]);
            addPoint(subPath, [.5 * (data[0] + data[2]), .5 * (data[1] + data[3])]);
            prevCtrlPoint = [data[2] - data[0], data[3] - data[1]];
            break;
        case 'A':
            // Convert the arc to bezier curves and use the same approximation
            var curves = a2c.apply(0, basePoint.concat(data));
            for (var cData; (cData = curves.splice(0,6).map(toAbsolute)).length;) {
                addPoint(subPath, [.5 * (basePoint[0] + cData[0]), .5 * (basePoint[1] + cData[1])]);
                addPoint(subPath, [.5 * (cData[0] + cData[2]), .5 * (cData[1] + cData[3])]);
                addPoint(subPath, [.5 * (cData[2] + cData[4]), .5 * (cData[3] + cData[5])]);
                if (curves.length) addPoint(subPath, basePoint = cData.slice(-2));
            }
            break;
    }
    // Save final command coordinates
    if (data && data.length >= 2) addPoint(subPath, data.slice(-2));
    return points;

    function toAbsolute(n, i) { return n + basePoint[i % 2] }

    // Writes data about the extreme points on each axle
    function addPoint(path, point) {
        if (!path.length || point[1] > path[path.maxY][1]) {
            path.maxY = path.length;
            points.maxY = points.length ? Math.max(point[1], points.maxY) : point[1];
        }
        if (!path.length || point[0] > path[path.maxX][0]) {
            path.maxX = path.length;
            points.maxX = points.length ? Math.max(point[0], points.maxX) : point[0];
        }
        if (!path.length || point[1] < path[path.minY][1]) {
            path.minY = path.length;
            points.minY = points.length ? Math.min(point[1], points.minY) : point[1];
        }
        if (!path.length || point[0] < path[path.minX][0]) {
            path.minX = path.length;
            points.minX = points.length ? Math.min(point[0], points.minX) : point[0];
        }
        path.push(point);
    }
}

/**
 * Forms a convex hull from set of points of every subpath using monotone chain convex hull algorithm.
 * http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
 *
 * @param points An array of [X, Y] coordinates
 */
function convexHull(points) {

    points.sort(function(a, b) {
        return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
    });

    var lower = [],
        minY = 0,
        bottom = 0;
    for (let i = 0; i < points.length; i++) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
            lower.pop();
        }
        if (points[i][1] < points[minY][1]) {
            minY = i;
            bottom = lower.length;
        }
        lower.push(points[i]);
    }

    var upper = [],
        maxY = points.length - 1,
        top = 0;
    for (let i = points.length; i--;) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
            upper.pop();
        }
        if (points[i][1] > points[maxY][1]) {
            maxY = i;
            top = upper.length;
        }
        upper.push(points[i]);
    }

    // last points are equal to starting points of the other part
    upper.pop();
    lower.pop();

    var hull = lower.concat(upper);

    hull.minX = 0; // by sorting
    hull.maxX = lower.length;
    hull.minY = bottom;
    hull.maxY = (lower.length + top) % hull.length;

    return hull;
}

function cross(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/* Based on code from Snap.svg (Apache 2 license). http://snapsvg.io/
 * Thanks to Dmitry Baranovskiy for his great work!
 */

function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
    // for more information of where this Math came from visit:
    // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
    var _120 = Math.PI * 120 / 180,
        rad = Math.PI / 180 * (+angle || 0),
        res = [],
        rotateX = function(x, y, rad) { return x * Math.cos(rad) - y * Math.sin(rad) },
        rotateY = function(x, y, rad) { return x * Math.sin(rad) + y * Math.cos(rad) };
    if (!recursive) {
        x1 = rotateX(x1, y1, -rad);
        y1 = rotateY(x1, y1, -rad);
        x2 = rotateX(x2, y2, -rad);
        y2 = rotateY(x2, y2, -rad);
        var x = (x1 - x2) / 2,
            y = (y1 - y2) / 2;
        var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (h > 1) {
            h = Math.sqrt(h);
            rx = h * rx;
            ry = h * ry;
        }
        var rx2 = rx * rx,
            ry2 = ry * ry,
            k = (large_arc_flag == sweep_flag ? -1 : 1) *
                Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
            cx = k * rx * y / ry + (x1 + x2) / 2,
            cy = k * -ry * x / rx + (y1 + y2) / 2,
            f1 = Math.asin(((y1 - cy) / ry).toFixed(9)),
            f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

        f1 = x1 < cx ? Math.PI - f1 : f1;
        f2 = x2 < cx ? Math.PI - f2 : f2;
        f1 < 0 && (f1 = Math.PI * 2 + f1);
        f2 < 0 && (f2 = Math.PI * 2 + f2);
        if (sweep_flag && f1 > f2) {
            f1 = f1 - Math.PI * 2;
        }
        if (!sweep_flag && f2 > f1) {
            f2 = f2 - Math.PI * 2;
        }
    } else {
        f1 = recursive[0];
        f2 = recursive[1];
        cx = recursive[2];
        cy = recursive[3];
    }
    var df = f2 - f1;
    if (Math.abs(df) > _120) {
        var f2old = f2,
            x2old = x2,
            y2old = y2;
        f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
        x2 = cx + rx * Math.cos(f2);
        y2 = cy + ry * Math.sin(f2);
        res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
    }
    df = f2 - f1;
    var c1 = Math.cos(f1),
        s1 = Math.sin(f1),
        c2 = Math.cos(f2),
        s2 = Math.sin(f2),
        t = Math.tan(df / 4),
        hx = 4 / 3 * rx * t,
        hy = 4 / 3 * ry * t,
        m = [
            - hx * s1, hy * c1,
            x2 + hx * s2 - x1, y2 - hy * c2 - y1,
            x2 - x1, y2 - y1
        ];
    if (recursive) {
        return m.concat(res);
    } else {
        res = m.concat(res);
        var newres = [];
        for (var i = 0, n = res.length; i < n; i++) {
            newres[i] = i % 2 ? rotateY(res[i - 1], res[i], rad) : rotateX(res[i], res[i + 1], rad);
        }
        return newres;
    }
}
});

var type$a = 'perItem';

var active$a = true;

var description$a = 'optimizes path data: writes in shorter form, applies transformations';

var params$5 = {
    applyTransforms: true,
    applyTransformsStroked: true,
    makeArcs: {
        threshold: 2.5, // coefficient of rounding error
        tolerance: 0.5  // percentage of radius
    },
    straightCurves: true,
    lineShorthands: true,
    curveSmoothShorthands: true,
    floatPrecision: 3,
    transformPrecision: 5,
    removeUseless: true,
    collapseRepeated: true,
    utilizeAbsolute: true,
    leadingZero: true,
    negativeExtraSpace: true,
    noSpaceAfterFlags: false, // a20 60 45 0 1 30 20 → a20 60 45 0130 20
    forceAbsolutePath: false,
};

var pathElems$1 = _collections.pathElems,
    path2js = _path.path2js,
    js2path = _path.js2path,
    applyTransforms = _path.applyTransforms,
    cleanupOutData = tools.cleanupOutData,
    roundData,
    precision,
    error,
    arcThreshold,
    arcTolerance,
    hasMarkerMid,
    hasStrokeLinecap;

/**
 * Convert absolute Path to relative,
 * collapse repeated instructions,
 * detect and convert Lineto shorthands,
 * remove useless instructions like "l0,0",
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
var fn$a = function(item, params) {

    if (item.isElem(pathElems$1) && item.hasAttr('d')) {

        precision = params.floatPrecision;
        error = precision !== false ? +Math.pow(.1, precision).toFixed(precision) : 1e-2;
        roundData = precision > 0 && precision < 20 ? strongRound : round;
        if (params.makeArcs) {
            arcThreshold = params.makeArcs.threshold;
            arcTolerance = params.makeArcs.tolerance;
        }
        hasMarkerMid = item.hasAttr('marker-mid');

        var stroke = item.computedAttr('stroke'),
            strokeLinecap = item.computedAttr('stroke');
        hasStrokeLinecap = stroke && stroke != 'none' && strokeLinecap && strokeLinecap != 'butt';

        var data = path2js(item);

        // TODO: get rid of functions returns
        if (data.length) {
            convertToRelative(data);

            if (params.applyTransforms) {
                data = applyTransforms(item, data, params);
            }

            data = filters(data, params);

            if (params.utilizeAbsolute) {
                data = convertToMixed(data, params);
            }

            js2path(item, data, params);
        }

    }

};

/**
 * Convert absolute path data coordinates to relative.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {Array} output path data
 */
function convertToRelative(path) {

    var point = [0, 0],
        subpathPoint = [0, 0],
        baseItem;

    path.forEach(function(item, index) {

        var instruction = item.instruction,
            data = item.data;

        // data !== !z
        if (data) {

            // already relative
            // recalculate current point
            if ('mcslqta'.indexOf(instruction) > -1) {

                point[0] += data[data.length - 2];
                point[1] += data[data.length - 1];

                if (instruction === 'm') {
                    subpathPoint[0] = point[0];
                    subpathPoint[1] = point[1];
                    baseItem = item;
                }

            } else if (instruction === 'h') {

                point[0] += data[0];

            } else if (instruction === 'v') {

                point[1] += data[0];

            }

            // convert absolute path data coordinates to relative
            // if "M" was not transformed from "m"
            // M → m
            if (instruction === 'M') {

                if (index > 0) instruction = 'm';

                data[0] -= point[0];
                data[1] -= point[1];

                subpathPoint[0] = point[0] += data[0];
                subpathPoint[1] = point[1] += data[1];

                baseItem = item;

            }

            // L → l
            // T → t
            else if ('LT'.indexOf(instruction) > -1) {

                instruction = instruction.toLowerCase();

                // x y
                // 0 1
                data[0] -= point[0];
                data[1] -= point[1];

                point[0] += data[0];
                point[1] += data[1];

            // C → c
            } else if (instruction === 'C') {

                instruction = 'c';

                // x1 y1 x2 y2 x y
                // 0  1  2  3  4 5
                data[0] -= point[0];
                data[1] -= point[1];
                data[2] -= point[0];
                data[3] -= point[1];
                data[4] -= point[0];
                data[5] -= point[1];

                point[0] += data[4];
                point[1] += data[5];

            // S → s
            // Q → q
            } else if ('SQ'.indexOf(instruction) > -1) {

                instruction = instruction.toLowerCase();

                // x1 y1 x y
                // 0  1  2 3
                data[0] -= point[0];
                data[1] -= point[1];
                data[2] -= point[0];
                data[3] -= point[1];

                point[0] += data[2];
                point[1] += data[3];

            // A → a
            } else if (instruction === 'A') {

                instruction = 'a';

                // rx ry x-axis-rotation large-arc-flag sweep-flag x y
                // 0  1  2               3              4          5 6
                data[5] -= point[0];
                data[6] -= point[1];

                point[0] += data[5];
                point[1] += data[6];

            // H → h
            } else if (instruction === 'H') {

                instruction = 'h';

                data[0] -= point[0];

                point[0] += data[0];

            // V → v
            } else if (instruction === 'V') {

                instruction = 'v';

                data[0] -= point[1];

                point[1] += data[0];

            }

            item.instruction = instruction;
            item.data = data;

            // store absolute coordinates for later use
            item.coords = point.slice(-2);

        }

        // !data === z, reset current point
        else if (instruction == 'z') {
            if (baseItem) {
                item.coords = baseItem.coords;
            }
            point[0] = subpathPoint[0];
            point[1] = subpathPoint[1];
        }

        item.base = index > 0 ? path[index - 1].coords : [0, 0];

    });

    return path;

}

/**
 * Main filters loop.
 *
 * @param {Array} path input path data
 * @param {Object} params plugin params
 * @return {Array} output path data
 */
function filters(path, params) {

    var stringify = data2Path.bind(null, params),
        relSubpoint = [0, 0],
        pathBase = [0, 0],
        prev = {};

    path = path.filter(function(item, index, path) {

        var instruction = item.instruction,
            data = item.data,
            next = path[index + 1];

        if (data) {

            var sdata = data,
                circle;

            if (instruction === 's') {
                sdata = [0, 0].concat(data);

                if ('cs'.indexOf(prev.instruction) > -1) {
                    var pdata = prev.data,
                        n = pdata.length;

                    // (-x, -y) of the prev tangent point relative to the current point
                    sdata[0] = pdata[n - 2] - pdata[n - 4];
                    sdata[1] = pdata[n - 1] - pdata[n - 3];
                }

            }

            // convert curves to arcs if possible
            if (
                params.makeArcs &&
                (instruction == 'c' || instruction == 's') &&
                isConvex(sdata) &&
                (circle = findCircle(sdata))
            ) {
                var r = roundData([circle.radius])[0],
                    angle = findArcAngle(sdata, circle),
                    sweep = sdata[5] * sdata[0] - sdata[4] * sdata[1] > 0 ? 1 : 0,
                    arc = {
                        instruction: 'a',
                        data: [r, r, 0, 0, sweep, sdata[4], sdata[5]],
                        coords: item.coords.slice(),
                        base: item.base
                    },
                    output = [arc],
                    // relative coordinates to adjust the found circle
                    relCenter = [circle.center[0] - sdata[4], circle.center[1] - sdata[5]],
                    relCircle = { center: relCenter, radius: circle.radius },
                    arcCurves = [item],
                    hasPrev = 0,
                    suffix = '',
                    nextLonghand;

                if (
                    prev.instruction == 'c' && isConvex(prev.data) && isArcPrev(prev.data, circle) ||
                    prev.instruction == 'a' && prev.sdata && isArcPrev(prev.sdata, circle)
                ) {
                    arcCurves.unshift(prev);
                    arc.base = prev.base;
                    arc.data[5] = arc.coords[0] - arc.base[0];
                    arc.data[6] = arc.coords[1] - arc.base[1];
                    var prevData = prev.instruction == 'a' ? prev.sdata : prev.data;
                    var prevAngle = findArcAngle(prevData,
                        {
                            center: [prevData[4] + circle.center[0], prevData[5] + circle.center[1]],
                            radius: circle.radius
                        }
                    );
                    angle += prevAngle;
                    if (angle > Math.PI) arc.data[3] = 1;
                    hasPrev = 1;
                }

                // check if next curves are fitting the arc
                for (var j = index; (next = path[++j]) && ~'cs'.indexOf(next.instruction);) {
                    var nextData = next.data;
                    if (next.instruction == 's') {
                        nextLonghand = makeLonghand({instruction: 's', data: next.data.slice() },
                            path[j - 1].data);
                        nextData = nextLonghand.data;
                        nextLonghand.data = nextData.slice(0, 2);
                        suffix = stringify([nextLonghand]);
                    }
                    if (isConvex(nextData) && isArc(nextData, relCircle)) {
                        angle += findArcAngle(nextData, relCircle);
                        if (angle - 2 * Math.PI > 1e-3) break; // more than 360°
                        if (angle > Math.PI) arc.data[3] = 1;
                        arcCurves.push(next);
                        if (2 * Math.PI - angle > 1e-3) { // less than 360°
                            arc.coords = next.coords;
                            arc.data[5] = arc.coords[0] - arc.base[0];
                            arc.data[6] = arc.coords[1] - arc.base[1];
                        } else {
                            // full circle, make a half-circle arc and add a second one
                            arc.data[5] = 2 * (relCircle.center[0] - nextData[4]);
                            arc.data[6] = 2 * (relCircle.center[1] - nextData[5]);
                            arc.coords = [arc.base[0] + arc.data[5], arc.base[1] + arc.data[6]];
                            arc = {
                                instruction: 'a',
                                data: [r, r, 0, 0, sweep,
                                    next.coords[0] - arc.coords[0], next.coords[1] - arc.coords[1]],
                                coords: next.coords,
                                base: arc.coords
                            };
                            output.push(arc);
                            j++;
                            break;
                        }
                        relCenter[0] -= nextData[4];
                        relCenter[1] -= nextData[5];
                    } else break;
                }

                if ((stringify(output) + suffix).length < stringify(arcCurves).length) {
                    if (path[j] && path[j].instruction == 's') {
                        makeLonghand(path[j], path[j - 1].data);
                    }
                    if (hasPrev) {
                        var prevArc = output.shift();
                        roundData(prevArc.data);
                        relSubpoint[0] += prevArc.data[5] - prev.data[prev.data.length - 2];
                        relSubpoint[1] += prevArc.data[6] - prev.data[prev.data.length - 1];
                        prev.instruction = 'a';
                        prev.data = prevArc.data;
                        item.base = prev.coords = prevArc.coords;
                    }
                    arc = output.shift();
                    if (arcCurves.length == 1) {
                        item.sdata = sdata.slice(); // preserve curve data for future checks
                    } else if (arcCurves.length - 1 - hasPrev > 0) {
                        // filter out consumed next items
                        path.splice.apply(path, [index + 1, arcCurves.length - 1 - hasPrev].concat(output));
                    }
                    if (!arc) return false;
                    instruction = 'a';
                    data = arc.data;
                    item.coords = arc.coords;
                }
            }

            // Rounding relative coordinates, taking in account accummulating error
            // to get closer to absolute coordinates. Sum of rounded value remains same:
            // l .25 3 .25 2 .25 3 .25 2 -> l .3 3 .2 2 .3 3 .2 2
            if (precision !== false) {
                if ('mltqsc'.indexOf(instruction) > -1) {
                    for (var i = data.length; i--;) {
                        data[i] += item.base[i % 2] - relSubpoint[i % 2];
                    }
                } else if (instruction == 'h') {
                    data[0] += item.base[0] - relSubpoint[0];
                } else if (instruction == 'v') {
                    data[0] += item.base[1] - relSubpoint[1];
                } else if (instruction == 'a') {
                    data[5] += item.base[0] - relSubpoint[0];
                    data[6] += item.base[1] - relSubpoint[1];
                }
                roundData(data);

                if      (instruction == 'h') relSubpoint[0] += data[0];
                else if (instruction == 'v') relSubpoint[1] += data[0];
                else {
                    relSubpoint[0] += data[data.length - 2];
                    relSubpoint[1] += data[data.length - 1];
                }
                roundData(relSubpoint);

                if (instruction.toLowerCase() == 'm') {
                    pathBase[0] = relSubpoint[0];
                    pathBase[1] = relSubpoint[1];
                }
            }

            // convert straight curves into lines segments
            if (params.straightCurves) {

                if (
                    instruction === 'c' &&
                    isCurveStraightLine(data) ||
                    instruction === 's' &&
                    isCurveStraightLine(sdata)
                ) {
                    if (next && next.instruction == 's')
                        makeLonghand(next, data); // fix up next curve
                    instruction = 'l';
                    data = data.slice(-2);
                }

                else if (
                    instruction === 'q' &&
                    isCurveStraightLine(data)
                ) {
                    if (next && next.instruction == 't')
                        makeLonghand(next, data); // fix up next curve
                    instruction = 'l';
                    data = data.slice(-2);
                }

                else if (
                    instruction === 't' &&
                    prev.instruction !== 'q' &&
                    prev.instruction !== 't'
                ) {
                    instruction = 'l';
                    data = data.slice(-2);
                }

                else if (
                    instruction === 'a' &&
                    (data[0] === 0 || data[1] === 0)
                ) {
                    instruction = 'l';
                    data = data.slice(-2);
                }
            }

            // horizontal and vertical line shorthands
            // l 50 0 → h 50
            // l 0 50 → v 50
            if (
                params.lineShorthands &&
                instruction === 'l'
            ) {
                if (data[1] === 0) {
                    instruction = 'h';
                    data.pop();
                } else if (data[0] === 0) {
                    instruction = 'v';
                    data.shift();
                }
            }

            // collapse repeated commands
            // h 20 h 30 -> h 50
            if (
                params.collapseRepeated &&
                !hasMarkerMid &&
                ('mhv'.indexOf(instruction) > -1) &&
                prev.instruction &&
                instruction == prev.instruction.toLowerCase() &&
                (
                    (instruction != 'h' && instruction != 'v') ||
                    (prev.data[0] >= 0) == (data[0] >= 0)
            )) {
                prev.data[0] += data[0];
                if (instruction != 'h' && instruction != 'v') {
                    prev.data[1] += data[1];
                }
                prev.coords = item.coords;
                path[index] = prev;
                return false;
            }

            // convert curves into smooth shorthands
            if (params.curveSmoothShorthands && prev.instruction) {

                // curveto
                if (instruction === 'c') {

                    // c + c → c + s
                    if (
                        prev.instruction === 'c' &&
                        data[0] === -(prev.data[2] - prev.data[4]) &&
                        data[1] === -(prev.data[3] - prev.data[5])
                    ) {
                        instruction = 's';
                        data = data.slice(2);
                    }

                    // s + c → s + s
                    else if (
                        prev.instruction === 's' &&
                        data[0] === -(prev.data[0] - prev.data[2]) &&
                        data[1] === -(prev.data[1] - prev.data[3])
                    ) {
                        instruction = 's';
                        data = data.slice(2);
                    }

                    // [^cs] + c → [^cs] + s
                    else if (
                        'cs'.indexOf(prev.instruction) === -1 &&
                        data[0] === 0 &&
                        data[1] === 0
                    ) {
                        instruction = 's';
                        data = data.slice(2);
                    }

                }

                // quadratic Bézier curveto
                else if (instruction === 'q') {

                    // q + q → q + t
                    if (
                        prev.instruction === 'q' &&
                        data[0] === (prev.data[2] - prev.data[0]) &&
                        data[1] === (prev.data[3] - prev.data[1])
                    ) {
                        instruction = 't';
                        data = data.slice(2);
                    }

                    // t + q → t + t
                    else if (
                        prev.instruction === 't' &&
                        data[2] === prev.data[0] &&
                        data[3] === prev.data[1]
                    ) {
                        instruction = 't';
                        data = data.slice(2);
                    }

                }

            }

            // remove useless non-first path segments
            if (params.removeUseless && !hasStrokeLinecap) {

                // l 0,0 / h 0 / v 0 / q 0,0 0,0 / t 0,0 / c 0,0 0,0 0,0 / s 0,0 0,0
                if (
                    (
                     'lhvqtcs'.indexOf(instruction) > -1
                    ) &&
                    data.every(function(i) { return i === 0; })
                ) {
                    path[index] = prev;
                    return false;
                }

                // a 25,25 -30 0,1 0,0
                if (
                    instruction === 'a' &&
                    data[5] === 0 &&
                    data[6] === 0
                ) {
                    path[index] = prev;
                    return false;
                }

            }

            item.instruction = instruction;
            item.data = data;

            prev = item;

        } else {

            // z resets coordinates
            relSubpoint[0] = pathBase[0];
            relSubpoint[1] = pathBase[1];
            if (prev.instruction == 'z') return false;
            prev = item;

        }

        return true;

    });

    return path;

}

/**
 * Writes data in shortest form using absolute or relative coordinates.
 *
 * @param {Array} data input path data
 * @return {Boolean} output
 */
function convertToMixed(path, params) {

    var prev = path[0];

    path = path.filter(function(item, index) {

        if (index == 0) return true;
        if (!item.data) {
            prev = item;
            return true;
        }

        var instruction = item.instruction,
            data = item.data,
            adata = data && data.slice(0);

        if ('mltqsc'.indexOf(instruction) > -1) {
            for (var i = adata.length; i--;) {
                adata[i] += item.base[i % 2];
            }
        } else if (instruction == 'h') {
                adata[0] += item.base[0];
        } else if (instruction == 'v') {
                adata[0] += item.base[1];
        } else if (instruction == 'a') {
                adata[5] += item.base[0];
                adata[6] += item.base[1];
        }

        roundData(adata);

        var absoluteDataStr = cleanupOutData(adata, params),
            relativeDataStr = cleanupOutData(data, params);

        // Convert to absolute coordinates if it's shorter or forceAbsolutePath is true.
        // v-20 -> V0
        // Don't convert if it fits following previous instruction.
        // l20 30-10-50 instead of l20 30L20 30
        if (
            params.forceAbsolutePath || (
            absoluteDataStr.length < relativeDataStr.length &&
            !(
                params.negativeExtraSpace &&
                instruction == prev.instruction &&
                prev.instruction.charCodeAt(0) > 96 &&
                absoluteDataStr.length == relativeDataStr.length - 1 &&
                (data[0] < 0 || /^0\./.test(data[0]) && prev.data[prev.data.length - 1] % 1)
            ))
        ) {
            item.instruction = instruction.toUpperCase();
            item.data = adata;
        }

        prev = item;

        return true;

    });

    return path;

}

/**
 * Checks if curve is convex. Control points of such a curve must form
 * a convex quadrilateral with diagonals crosspoint inside of it.
 *
 * @param {Array} data input path data
 * @return {Boolean} output
 */
function isConvex(data) {

    var center = getIntersection([0, 0, data[2], data[3], data[0], data[1], data[4], data[5]]);

    return center &&
        (data[2] < center[0] == center[0] < 0) &&
        (data[3] < center[1] == center[1] < 0) &&
        (data[4] < center[0] == center[0] < data[0]) &&
        (data[5] < center[1] == center[1] < data[1]);

}

/**
 * Computes lines equations by two points and returns their intersection point.
 *
 * @param {Array} coords 8 numbers for 4 pairs of coordinates (x,y)
 * @return {Array|undefined} output coordinate of lines' crosspoint
 */
function getIntersection(coords) {

        // Prev line equation parameters.
    var a1 = coords[1] - coords[3], // y1 - y2
        b1 = coords[2] - coords[0], // x2 - x1
        c1 = coords[0] * coords[3] - coords[2] * coords[1], // x1 * y2 - x2 * y1

        // Next line equation parameters
        a2 = coords[5] - coords[7], // y1 - y2
        b2 = coords[6] - coords[4], // x2 - x1
        c2 = coords[4] * coords[7] - coords[5] * coords[6], // x1 * y2 - x2 * y1
        denom = (a1 * b2 - a2 * b1);

    if (!denom) return; // parallel lines havn't an intersection

    var cross = [
            (b1 * c2 - b2 * c1) / denom,
            (a1 * c2 - a2 * c1) / -denom
        ];
    if (
        !isNaN(cross[0]) && !isNaN(cross[1]) &&
        isFinite(cross[0]) && isFinite(cross[1])
    ) {
        return cross;
    }

}

/**
 * Decrease accuracy of floating-point numbers
 * in path data keeping a specified number of decimals.
 * Smart rounds values like 2.3491 to 2.35 instead of 2.349.
 * Doesn't apply "smartness" if the number precision fits already.
 *
 * @param {Array} data input data array
 * @return {Array} output data array
 */
function strongRound(data) {
    for (var i = data.length; i-- > 0;) {
        if (data[i].toFixed(precision) != data[i]) {
            var rounded = +data[i].toFixed(precision - 1);
            data[i] = +Math.abs(rounded - data[i]).toFixed(precision + 1) >= error ?
                +data[i].toFixed(precision) :
                rounded;
        }
    }
    return data;
}

/**
 * Simple rounding function if precision is 0.
 *
 * @param {Array} data input data array
 * @return {Array} output data array
 */
function round(data) {
    for (var i = data.length; i-- > 0;) {
        data[i] = Math.round(data[i]);
    }
    return data;
}

/**
 * Checks if a curve is a straight line by measuring distance
 * from middle points to the line formed by end points.
 *
 * @param {Array} xs array of curve points x-coordinates
 * @param {Array} ys array of curve points y-coordinates
 * @return {Boolean}
 */

function isCurveStraightLine(data) {

    // Get line equation a·x + b·y + c = 0 coefficients a, b (c = 0) by start and end points.
    var i = data.length - 2,
        a = -data[i + 1], // y1 − y2 (y1 = 0)
        b = data[i],      // x2 − x1 (x1 = 0)
        d = 1 / (a * a + b * b); // same part for all points

    if (i <= 1 || !isFinite(d)) return false; // curve that ends at start point isn't the case

    // Distance from point (x0, y0) to the line is sqrt((c − a·x0 − b·y0)² / (a² + b²))
    while ((i -= 2) >= 0) {
        if (Math.sqrt(Math.pow(a * data[i] + b * data[i + 1], 2) * d) > error)
            return false;
    }

    return true;

}

/**
 * Converts next curve from shorthand to full form using the current curve data.
 *
 * @param {Object} item curve to convert
 * @param {Array} data current curve data
 */

function makeLonghand(item, data) {
    switch (item.instruction) {
        case 's': item.instruction = 'c'; break;
        case 't': item.instruction = 'q'; break;
    }
    item.data.unshift(data[data.length - 2] - data[data.length - 4], data[data.length - 1] - data[data.length - 3]);
    return item;
}

/**
 * Returns distance between two points
 *
 * @param {Array} point1 first point coordinates
 * @param {Array} point2 second point coordinates
 * @return {Number} distance
 */

function getDistance(point1, point2) {
    return Math.hypot(point1[0] - point2[0], point1[1] - point2[1]);
}

/**
 * Returns coordinates of the curve point corresponding to the certain t
 * a·(1 - t)³·p1 + b·(1 - t)²·t·p2 + c·(1 - t)·t²·p3 + d·t³·p4,
 * where pN are control points and p1 is zero due to relative coordinates.
 *
 * @param {Array} curve array of curve points coordinates
 * @param {Number} t parametric position from 0 to 1
 * @return {Array} Point coordinates
 */

function getCubicBezierPoint(curve, t) {
    var sqrT = t * t,
        cubT = sqrT * t,
        mt = 1 - t,
        sqrMt = mt * mt;

    return [
        3 * sqrMt * t * curve[0] + 3 * mt * sqrT * curve[2] + cubT * curve[4],
        3 * sqrMt * t * curve[1] + 3 * mt * sqrT * curve[3] + cubT * curve[5]
    ];
}

/**
 * Finds circle by 3 points of the curve and checks if the curve fits the found circle.
 *
 * @param {Array} curve
 * @return {Object|undefined} circle
 */

function findCircle(curve) {
    var midPoint = getCubicBezierPoint(curve, 1/2),
        m1 = [midPoint[0] / 2, midPoint[1] / 2],
        m2 = [(midPoint[0] + curve[4]) / 2, (midPoint[1] + curve[5]) / 2],
        center = getIntersection([
            m1[0], m1[1],
            m1[0] + m1[1], m1[1] - m1[0],
            m2[0], m2[1],
            m2[0] + (m2[1] - midPoint[1]), m2[1] - (m2[0] - midPoint[0])
        ]),
        radius = center && getDistance([0, 0], center),
        tolerance = Math.min(arcThreshold * error, arcTolerance * radius / 100);

    if (center && radius < 1e15 &&
        [1/4, 3/4].every(function(point) {
        return Math.abs(getDistance(getCubicBezierPoint(curve, point), center) - radius) <= tolerance;
    }))
        return { center: center, radius: radius};
}

/**
 * Checks if a curve fits the given circle.
 *
 * @param {Object} circle
 * @param {Array} curve
 * @return {Boolean}
 */

function isArc(curve, circle) {
    var tolerance = Math.min(arcThreshold * error, arcTolerance * circle.radius / 100);

    return [0, 1/4, 1/2, 3/4, 1].every(function(point) {
        return Math.abs(getDistance(getCubicBezierPoint(curve, point), circle.center) - circle.radius) <= tolerance;
    });
}

/**
 * Checks if a previous curve fits the given circle.
 *
 * @param {Object} circle
 * @param {Array} curve
 * @return {Boolean}
 */

function isArcPrev(curve, circle) {
    return isArc(curve, {
        center: [circle.center[0] + curve[4], circle.center[1] + curve[5]],
        radius: circle.radius
    });
}

/**
 * Finds angle of a curve fitting the given arc.

 * @param {Array} curve
 * @param {Object} relCircle
 * @return {Number} angle
 */

function findArcAngle(curve, relCircle) {
    var x1 = -relCircle.center[0],
        y1 = -relCircle.center[1],
        x2 = curve[4] - relCircle.center[0],
        y2 = curve[5] - relCircle.center[1];

    return Math.acos(
            (x1 * x2 + y1 * y2) /
            Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2))
        );
}

/**
 * Converts given path data to string.
 *
 * @param {Object} params
 * @param {Array} pathData
 * @return {String}
 */

function data2Path(params, pathData) {
    return pathData.reduce(function(pathString, item) {
        var strData = '';
        if (item.data) {
            strData = cleanupOutData(roundData(item.data.slice()), params);
        }
        return pathString + item.instruction + strData;
    }, '');
}

var convertPathData = {
	type: type$a,
	active: active$a,
	description: description$a,
	params: params$5,
	fn: fn$a
};

var type$b = 'perItem';

var active$b = true;

var description$b = 'converts basic shapes to more compact path form';

var params$6 = {
    convertArcs: false
};

var none$1 = { value: 0 },
    regNumber = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

/**
 * Converts basic shape to more compact path.
 * It also allows further optimizations like
 * combining paths with similar attributes.
 *
 * @see http://www.w3.org/TR/SVG/shapes.html
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Lev Solntsev
 */
var fn$b = function(item, params) {
    var convertArcs = params && params.convertArcs;

    if (
        item.isElem('rect') &&
        item.hasAttr('width') &&
        item.hasAttr('height') &&
        !item.hasAttr('rx') &&
        !item.hasAttr('ry')
    ) {

        var x = +(item.attr('x') || none$1).value,
            y = +(item.attr('y') || none$1).value,
            width  = +item.attr('width').value,
            height = +item.attr('height').value;

            // Values like '100%' compute to NaN, thus running after
            // cleanupNumericValues when 'px' units has already been removed.
            // TODO: Calculate sizes from % and non-px units if possible.
        if (isNaN(x - y + width - height)) return;

        var pathData =
            'M' + x + ' ' + y +
            'H' + (x + width) +
            'V' + (y + height) +
            'H' + x +
            'z';

        item.addAttr({
                name: 'd',
                value: pathData,
                prefix: '',
                local: 'd'
            });

        item.renameElem('path')
            .removeAttr(['x', 'y', 'width', 'height']);

    } else if (item.isElem('line')) {

        var x1 = +(item.attr('x1') || none$1).value,
            y1 = +(item.attr('y1') || none$1).value,
            x2 = +(item.attr('x2') || none$1).value,
            y2 = +(item.attr('y2') || none$1).value;
        if (isNaN(x1 - y1 + x2 - y2)) return;

        item.addAttr({
                name: 'd',
                value: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2,
                prefix: '',
                local: 'd'
            });

        item.renameElem('path')
            .removeAttr(['x1', 'y1', 'x2', 'y2']);

    } else if ((
            item.isElem('polyline') ||
            item.isElem('polygon')
        ) &&
        item.hasAttr('points')
    ) {

        var coords = (item.attr('points').value.match(regNumber) || []).map(Number);
        if (coords.length < 4) return false;

        item.addAttr({
                name: 'd',
                value: 'M' + coords.slice(0,2).join(' ') +
                       'L' + coords.slice(2).join(' ') +
                       (item.isElem('polygon') ? 'z' : ''),
                prefix: '',
                local: 'd'
            });

        item.renameElem('path')
            .removeAttr('points');
    } else if (item.isElem('circle') && convertArcs) {

        var cx = +(item.attr('cx') || none$1).value;
        var cy = +(item.attr('cy') || none$1).value;
        var r = +(item.attr('r') || none$1).value;
        if (isNaN(cx - cy + r)) {
            return;
        }
        var cPathData =
            'M' + cx  + ' ' + (cy - r) +
                'A' + r + ' ' + r + ' 0 1 0 ' + cx + ' ' + (cy + r) +
                'A' + r + ' ' + r + ' 0 1 0 ' + cx + ' ' + (cy - r) +
                'Z';
        item.addAttr({
                name: 'd',
                value: cPathData,
                prefix: '',
                local: 'd',
        });
        item.renameElem('path').removeAttr(['cx', 'cy', 'r']);

    } else if (item.isElem('ellipse') && convertArcs) {

        var ecx = +(item.attr('cx') || none$1).value;
        var ecy = +(item.attr('cy') || none$1).value;
        var rx = +(item.attr('rx') || none$1).value;
        var ry = +(item.attr('ry') || none$1).value;
        if (isNaN(ecx - ecy + rx - ry)) {
            return;
        }
        var ePathData =
            'M' + ecx + ' ' + (ecy - ry) +
                'A' + rx + ' ' + ry + ' 0 1 0 ' + ecx + ' ' + (ecy + ry) +
                'A' + rx + ' ' + ry + ' 0 1 0 ' + ecx + ' ' + (ecy - ry) +
                'Z';
        item.addAttr({
                name: 'd',
                value: ePathData,
                prefix: '',
                local: 'd',
        });
        item.renameElem('path').removeAttr(['cx', 'cy', 'rx', 'ry']);
    }
};

var convertShapeToPath = {
	type: type$b,
	active: active$b,
	description: description$b,
	params: params$6,
	fn: fn$b
};

var type$c = 'perItem';

var active$c = true;

var description$c = 'converts style to attributes';

var params$7 = {
    keepImportant: false
};

var stylingProps = _collections.attrsGroups.presentation,
    rEscape = '\\\\(?:[0-9a-f]{1,6}\\s?|\\r\\n|.)',                 // Like \" or \2051. Code points consume one space.
    rAttr = '\\s*(' + g('[^:;\\\\]', rEscape) + '*?)\\s*',          // attribute name like ‘fill’
    rSingleQuotes = "'(?:[^'\\n\\r\\\\]|" + rEscape + ")*?(?:'|$)", // string in single quotes: 'smth'
    rQuotes = '"(?:[^"\\n\\r\\\\]|' + rEscape + ')*?(?:"|$)',       // string in double quotes: "smth"
    rQuotedString = new RegExp('^' + g(rSingleQuotes, rQuotes) + '$'),

    // Parentheses, E.g.: url(data:image/png;base64,iVBO...).
    // ':' and ';' inside of it should be threated as is. (Just like in strings.)
    rParenthesis = '\\(' + g('[^\'"()\\\\]+', rEscape, rSingleQuotes, rQuotes) + '*?' + '\\)',

    // The value. It can have strings and parentheses (see above). Fallbacks to anything in case of unexpected input.
    rValue = '\\s*(' + g('[^!\'"();\\\\]+?', rEscape, rSingleQuotes, rQuotes, rParenthesis, '[^;]*?') + '*?' + ')',

    // End of declaration. Spaces outside of capturing groups help to do natural trimming.
    rDeclEnd = '\\s*(?:;\\s*|$)',

    // Important rule
    rImportant = '(\\s*!important(?![-(\\w]))?',

    // Final RegExp to parse CSS declarations.
    regDeclarationBlock = new RegExp(rAttr + ':' + rValue + rImportant + rDeclEnd, 'ig'),

    // Comments expression. Honors escape sequences and strings.
    regStripComments = new RegExp(g(rEscape, rSingleQuotes, rQuotes, '/\\*[^]*?\\*/'), 'ig');

/**
 * Convert style in attributes. Cleanups comments and illegal declarations (without colon) as a side effect.
 *
 * @example
 * <g style="fill:#000; color: #fff;">
 *             ⬇
 * <g fill="#000" color="#fff">
 *
 * @example
 * <g style="fill:#000; color: #fff; -webkit-blah: blah">
 *             ⬇
 * <g fill="#000" color="#fff" style="-webkit-blah: blah">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$c = function(item, params) {

    if (item.elem && item.hasAttr('style')) {
            // ['opacity: 1', 'color: #000']
        var styleValue = item.attr('style').value,
            styles = [],
            attrs = {};

        // Strip CSS comments preserving escape sequences and strings.
        styleValue = styleValue.replace(regStripComments, function(match) {
            return match[0] == '/' ? '' :
                match[0] == '\\' && /[-g-z]/i.test(match[1]) ? match[1] : match;
        });

        regDeclarationBlock.lastIndex = 0;
        // eslint-disable-next-line no-cond-assign
        for (var rule; rule = regDeclarationBlock.exec(styleValue);) {
            if (!params.keepImportant || !rule[3]) {
                styles.push([rule[1], rule[2]]);
            }
        }

        if (styles.length) {

            styles = styles.filter(function(style) {
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

            Object.assign(item.attrs, attrs);

            if (styles.length) {
                item.attr('style').value = styles
                    .map(function(declaration) { return declaration.join(':') })
                    .join(';');
            } else {
                item.removeAttr('style');
            }

        }

    }

};

function g() {
    return '(?:' + Array.prototype.join.call(arguments, '|') + ')';
}

var convertStyleToAttrs = {
	type: type$c,
	active: active$c,
	description: description$c,
	params: params$7,
	fn: fn$c
};

var type$d = 'perItem';

var active$d = true;

var description$d = 'collapses multiple transformations and optimizes it';

var params$8 = {
    convertToShorts: true,
    // degPrecision: 3, // transformPrecision (or matrix precision) - 2 by default
    floatPrecision: 3,
    transformPrecision: 5,
    matrixToTransform: true,
    shortTranslate: true,
    shortScale: true,
    shortRotate: true,
    removeUseless: true,
    collapseIntoOne: true,
    leadingZero: true,
    negativeExtraSpace: false
};

var cleanupOutData$1 = tools.cleanupOutData,
    transform2js = _transforms.transform2js,
    transformsMultiply = _transforms.transformsMultiply,
    matrixToTransform = _transforms.matrixToTransform,
    degRound,
    floatRound,
    transformRound;

/**
 * Convert matrices to the short aliases,
 * convert long translate, scale or rotate transform notations to the shorts ones,
 * convert transforms to the matrices and multiply them all into one,
 * remove useless transforms.
 *
 * @see http://www.w3.org/TR/SVG/coords.html#TransformMatrixDefined
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$d = function(item, params) {

    if (item.elem) {

        // transform
        if (item.hasAttr('transform')) {
            convertTransform(item, 'transform', params);
        }

        // gradientTransform
        if (item.hasAttr('gradientTransform')) {
            convertTransform(item, 'gradientTransform', params);
        }

        // patternTransform
        if (item.hasAttr('patternTransform')) {
            convertTransform(item, 'patternTransform', params);
        }

    }

};

/**
 * Main function.
 *
 * @param {Object} item input item
 * @param {String} attrName attribute name
 * @param {Object} params plugin params
 */
function convertTransform(item, attrName, params) {
    var data = transform2js(item.attr(attrName).value);
    params = definePrecision(data, params);

    if (params.collapseIntoOne && data.length > 1) {
        data = [transformsMultiply(data)];
    }

    if (params.convertToShorts) {
        data = convertToShorts(data, params);
    } else {
        data.forEach(roundTransform);
    }

    if (params.removeUseless) {
        data = removeUseless(data);
    }

    if (data.length) {
        item.attr(attrName).value = js2transform(data, params);
    } else {
        item.removeAttr(attrName);
    }
}

/**
 * Defines precision to work with certain parts.
 * transformPrecision - for scale and four first matrix parameters (needs a better precision due to multiplying),
 * floatPrecision - for translate including two last matrix and rotate parameters,
 * degPrecision - for rotate and skew. By default it's equal to (rougly)
 * transformPrecision - 2 or floatPrecision whichever is lower. Can be set in params.
 *
 * @param {Array} transforms input array
 * @param {Object} params plugin params
 * @return {Array} output array
 */
function definePrecision(data, params) {
    var matrixData = data.reduce(getMatrixData, []),
        significantDigits = params.transformPrecision;

    // Clone params so it don't affect other elements transformations.
    params = Object.assign({}, params);

    // Limit transform precision with matrix one. Calculating with larger precision doesn't add any value.
    if (matrixData.length) {
        params.transformPrecision = Math.min(params.transformPrecision,
            Math.max.apply(Math, matrixData.map(floatDigits)) || params.transformPrecision);

        significantDigits = Math.max.apply(Math, matrixData.map(function(n) {
            return String(n).replace(/\D+/g, '').length; // Number of digits in a number. 123.45 → 5
        }));
    }
    // No sense in angle precision more then number of significant digits in matrix.
    if (!('degPrecision' in params)) {
        params.degPrecision = Math.max(0, Math.min(params.floatPrecision, significantDigits - 2));
    }

    floatRound = params.floatPrecision >= 1 && params.floatPrecision < 20 ?
        smartRound.bind(this, params.floatPrecision) :
        round$1;
    degRound = params.degPrecision >= 1 && params.floatPrecision < 20 ?
        smartRound.bind(this, params.degPrecision) :
        round$1;
    transformRound = params.transformPrecision >= 1 && params.floatPrecision < 20 ?
        smartRound.bind(this, params.transformPrecision) :
        round$1;

    return params;
}

/**
 * Gathers four first matrix parameters.
 *
 * @param {Array} a array of data
 * @param {Object} transform
 * @return {Array} output array
 */
function getMatrixData(a, b) {
    return b.name == 'matrix' ? a.concat(b.data.slice(0, 4)) : a;
}

/**
 * Returns number of digits after the point. 0.125 → 3
 */
function floatDigits(n) {
    return (n = String(n)).slice(n.indexOf('.')).length - 1;
}

/**
 * Convert transforms to the shorthand alternatives.
 *
 * @param {Array} transforms input array
 * @param {Object} params plugin params
 * @return {Array} output array
 */
function convertToShorts(transforms, params) {

    for(var i = 0; i < transforms.length; i++) {

        var transform = transforms[i];

        // convert matrix to the short aliases
        if (
            params.matrixToTransform &&
            transform.name === 'matrix'
        ) {
            var decomposed = matrixToTransform(transform, params);
            if (decomposed != transform &&
                js2transform(decomposed, params).length <= js2transform([transform], params).length) {

                transforms.splice.apply(transforms, [i, 1].concat(decomposed));
            }
            transform = transforms[i];
        }

        // fixed-point numbers
        // 12.754997 → 12.755
        roundTransform(transform);

        // convert long translate transform notation to the shorts one
        // translate(10 0) → translate(10)
        if (
            params.shortTranslate &&
            transform.name === 'translate' &&
            transform.data.length === 2 &&
            !transform.data[1]
        ) {
            transform.data.pop();
        }

        // convert long scale transform notation to the shorts one
        // scale(2 2) → scale(2)
        if (
            params.shortScale &&
            transform.name === 'scale' &&
            transform.data.length === 2 &&
            transform.data[0] === transform.data[1]
        ) {
            transform.data.pop();
        }

        // convert long rotate transform notation to the short one
        // translate(cx cy) rotate(a) translate(-cx -cy) → rotate(a cx cy)
        if (
            params.shortRotate &&
            transforms[i - 2] &&
            transforms[i - 2].name === 'translate' &&
            transforms[i - 1].name === 'rotate' &&
            transforms[i].name === 'translate' &&
            transforms[i - 2].data[0] === -transforms[i].data[0] &&
            transforms[i - 2].data[1] === -transforms[i].data[1]
        ) {
            transforms.splice(i - 2, 3, {
                name: 'rotate',
                data: [
                    transforms[i - 1].data[0],
                    transforms[i - 2].data[0],
                    transforms[i - 2].data[1]
                ]
            });

            // splice compensation
            i -= 2;

            transform = transforms[i];
        }

    }

    return transforms;

}

/**
 * Remove useless transforms.
 *
 * @param {Array} transforms input array
 * @return {Array} output array
 */
function removeUseless(transforms) {

    return transforms.filter(function(transform) {

        // translate(0), rotate(0[, cx, cy]), skewX(0), skewY(0)
        if (
            ['translate', 'rotate', 'skewX', 'skewY'].indexOf(transform.name) > -1 &&
            (transform.data.length == 1 || transform.name == 'rotate') &&
            !transform.data[0] ||

            // translate(0, 0)
            transform.name == 'translate' &&
            !transform.data[0] &&
            !transform.data[1] ||

            // scale(1)
            transform.name == 'scale' &&
            transform.data[0] == 1 &&
            (transform.data.length < 2 || transform.data[1] == 1) ||

            // matrix(1 0 0 1 0 0)
            transform.name == 'matrix' &&
            transform.data[0] == 1 &&
            transform.data[3] == 1 &&
            !(transform.data[1] || transform.data[2] || transform.data[4] || transform.data[5])
        ) {
            return false;
        }

        return true;

    });

}

/**
 * Convert transforms JS representation to string.
 *
 * @param {Array} transformJS JS representation array
 * @param {Object} params plugin params
 * @return {String} output string
 */
function js2transform(transformJS, params) {

    var transformString = '';

    // collect output value string
    transformJS.forEach(function(transform) {
        roundTransform(transform);
        transformString += (transformString && ' ') + transform.name + '(' + cleanupOutData$1(transform.data, params) + ')';
    });

    return transformString;

}

function roundTransform(transform) {
    switch (transform.name) {
        case 'translate':
            transform.data = floatRound(transform.data);
            break;
        case 'rotate':
            transform.data = degRound(transform.data.slice(0, 1)).concat(floatRound(transform.data.slice(1)));
            break;
        case 'skewX':
        case 'skewY':
            transform.data = degRound(transform.data);
            break;
        case 'scale':
            transform.data = transformRound(transform.data);
            break;
        case 'matrix':
            transform.data = transformRound(transform.data.slice(0, 4)).concat(floatRound(transform.data.slice(4)));
            break;
    }
    return transform;
}

/**
 * Rounds numbers in array.
 *
 * @param {Array} data input data array
 * @return {Array} output data array
 */
function round$1(data) {
    return data.map(Math.round);
}

/**
 * Decrease accuracy of floating-point numbers
 * in transforms keeping a specified number of decimals.
 * Smart rounds values like 2.349 to 2.35.
 *
 * @param {Number} fixed number of decimals
 * @param {Array} data input data array
 * @return {Array} output data array
 */
function smartRound(precision, data) {
    for (var i = data.length, tolerance = +Math.pow(.1, precision).toFixed(precision); i--;) {
        if (data[i].toFixed(precision) != data[i]) {
            var rounded = +data[i].toFixed(precision - 1);
            data[i] = +Math.abs(rounded - data[i]).toFixed(precision + 1) >= tolerance ?
                +data[i].toFixed(precision) :
                rounded;
        }
    }
    return data;
}

var convertTransform_1 = {
	type: type$d,
	active: active$d,
	description: description$d,
	params: params$8,
	fn: fn$d
};

var csstree_min = createCommonjsModule(function (module, exports) {
!function(e,t){module.exports=t();}(commonjsGlobal,(function(){function e(e){return {prev:null,next:null,data:e}}function t(e,t,n){var i;return null!==r?(i=r,r=r.cursor,i.prev=t,i.next=n,i.cursor=e.cursor):i={prev:t,next:n,cursor:e.cursor},e.cursor=i,i}function n(e){var t=e.cursor;e.cursor=t.cursor,t.prev=null,t.next=null,t.cursor=r,r=t;}var r=null,i=function(){this.cursor=null,this.head=null,this.tail=null;};i.createItem=e,i.prototype.createItem=e,i.prototype.updateCursors=function(e,t,n,r){for(var i=this.cursor;null!==i;)i.prev===e&&(i.prev=t),i.next===n&&(i.next=r),i=i.cursor;},i.prototype.getSize=function(){for(var e=0,t=this.head;t;)e++,t=t.next;return e},i.prototype.fromArray=function(t){var n=null;this.head=null;for(var r=0;r<t.length;r++){var i=e(t[r]);null!==n?n.next=i:this.head=i,i.prev=n,n=i;}return this.tail=n,this},i.prototype.toArray=function(){for(var e=this.head,t=[];e;)t.push(e.data),e=e.next;return t},i.prototype.toJSON=i.prototype.toArray,i.prototype.isEmpty=function(){return null===this.head},i.prototype.first=function(){return this.head&&this.head.data},i.prototype.last=function(){return this.tail&&this.tail.data},i.prototype.each=function(e,r){var i;void 0===r&&(r=this);for(var a=t(this,null,this.head);null!==a.next;)i=a.next,a.next=i.next,e.call(r,i.data,i,this);n(this);},i.prototype.forEach=i.prototype.each,i.prototype.eachRight=function(e,r){var i;void 0===r&&(r=this);for(var a=t(this,this.tail,null);null!==a.prev;)i=a.prev,a.prev=i.prev,e.call(r,i.data,i,this);n(this);},i.prototype.forEachRight=i.prototype.eachRight,i.prototype.reduce=function(e,r,i){var a;void 0===i&&(i=this);for(var o=t(this,null,this.head),s=r;null!==o.next;)a=o.next,o.next=a.next,s=e.call(i,s,a.data,a,this);return n(this),s},i.prototype.reduceRight=function(e,r,i){var a;void 0===i&&(i=this);for(var o=t(this,this.tail,null),s=r;null!==o.prev;)a=o.prev,o.prev=a.prev,s=e.call(i,s,a.data,a,this);return n(this),s},i.prototype.nextUntil=function(e,r,i){if(null!==e){var a;void 0===i&&(i=this);for(var o=t(this,null,e);null!==o.next&&(a=o.next,o.next=a.next,!r.call(i,a.data,a,this)););n(this);}},i.prototype.prevUntil=function(e,r,i){if(null!==e){var a;void 0===i&&(i=this);for(var o=t(this,e,null);null!==o.prev&&(a=o.prev,o.prev=a.prev,!r.call(i,a.data,a,this)););n(this);}},i.prototype.some=function(e,t){var n=this.head;for(void 0===t&&(t=this);null!==n;){if(e.call(t,n.data,n,this))return !0;n=n.next;}return !1},i.prototype.map=function(e,t){var n=new i,r=this.head;for(void 0===t&&(t=this);null!==r;)n.appendData(e.call(t,r.data,r,this)),r=r.next;return n},i.prototype.filter=function(e,t){var n=new i,r=this.head;for(void 0===t&&(t=this);null!==r;)e.call(t,r.data,r,this)&&n.appendData(r.data),r=r.next;return n},i.prototype.clear=function(){this.head=null,this.tail=null;},i.prototype.copy=function(){for(var t=new i,n=this.head;null!==n;)t.insert(e(n.data)),n=n.next;return t},i.prototype.prepend=function(e){return this.updateCursors(null,e,this.head,e),null!==this.head?(this.head.prev=e,e.next=this.head):this.tail=e,this.head=e,this},i.prototype.prependData=function(t){return this.prepend(e(t))},i.prototype.append=function(e){return this.insert(e)},i.prototype.appendData=function(t){return this.insert(e(t))},i.prototype.insert=function(e,t){if(null!=t)if(this.updateCursors(t.prev,e,t,e),null===t.prev){if(this.head!==t)throw new Error("before doesn't belong to list");this.head=e,t.prev=e,e.next=t,this.updateCursors(null,e);}else t.prev.next=e,e.prev=t.prev,t.prev=e,e.next=t;else this.updateCursors(this.tail,e,null,e),null!==this.tail?(this.tail.next=e,e.prev=this.tail):this.head=e,this.tail=e;return this},i.prototype.insertData=function(t,n){return this.insert(e(t),n)},i.prototype.remove=function(e){if(this.updateCursors(e,e.prev,e,e.next),null!==e.prev)e.prev.next=e.next;else {if(this.head!==e)throw new Error("item doesn't belong to list");this.head=e.next;}if(null!==e.next)e.next.prev=e.prev;else {if(this.tail!==e)throw new Error("item doesn't belong to list");this.tail=e.prev;}return e.prev=null,e.next=null,e},i.prototype.push=function(t){this.insert(e(t));},i.prototype.pop=function(){if(null!==this.tail)return this.remove(this.tail)},i.prototype.unshift=function(t){this.prepend(e(t));},i.prototype.shift=function(){if(null!==this.head)return this.remove(this.head)},i.prototype.prependList=function(e){return this.insertList(e,this.head)},i.prototype.appendList=function(e){return this.insertList(e)},i.prototype.insertList=function(e,t){return null===e.head||(null!=t?(this.updateCursors(t.prev,e.tail,t,e.head),null!==t.prev?(t.prev.next=e.head,e.head.prev=t.prev):this.head=e.head,t.prev=e.tail,e.tail.next=t):(this.updateCursors(this.tail,e.tail,null,e.head),null!==this.tail?(this.tail.next=e.head,e.head.prev=this.tail):this.head=e.head,this.tail=e.tail),e.head=null,e.tail=null),this},i.prototype.replace=function(e,t){"head"in t?this.insertList(t,e):this.insert(t,e),this.remove(e);};var a=i,o=function(e,t){var n=Object.create(SyntaxError.prototype),r=new Error;return n.name=e,n.message=t,Object.defineProperty(n,"stack",{get:function(){return (r.stack||"").replace(/^(.+\n){1,3}/,e+": "+t+"\n")}}),n};function s(e,t){function n(e,t){return r.slice(e,t).map((function(t,n){for(var r=String(e+n+1);r.length<l;)r=" "+r;return r+" |"+t})).join("\n")}var r=e.source.split(/\r\n?|\n|\f/),i=e.line,a=e.column,o=Math.max(1,i-t)-1,s=Math.min(i+t,r.length+1),l=Math.max(4,String(s).length)+1,c=0;(a+=("    ".length-1)*(r[i-1].substr(0,a-1).match(/\t/g)||[]).length)>100&&(c=a-60+3,a=58);for(var u=o;u<=s;u++)u>=0&&u<r.length&&(r[u]=r[u].replace(/\t/g,"    "),r[u]=(c>0&&r[u].length>c?"…":"")+r[u].substr(c,98)+(r[u].length>c+100-1?"…":""));return [n(o,i),new Array(a+l+2).join("-")+"^",n(i,s)].filter(Boolean).join("\n")}var l=function(e,t,n,r,i){var a=o("SyntaxError",e);return a.source=t,a.offset=n,a.line=r,a.column=i,a.sourceFragment=function(e){return s(a,isNaN(e)?0:e)},Object.defineProperty(a,"formattedMessage",{get:function(){return "Parse error: "+a.message+"\n"+s(a,2)}}),a.parseError={offset:n,line:r,column:i},a},c={EOF:0,Ident:1,Function:2,AtKeyword:3,Hash:4,String:5,BadString:6,Url:7,BadUrl:8,Delim:9,Number:10,Percentage:11,Dimension:12,WhiteSpace:13,CDO:14,CDC:15,Colon:16,Semicolon:17,Comma:18,LeftSquareBracket:19,RightSquareBracket:20,LeftParenthesis:21,RightParenthesis:22,LeftCurlyBracket:23,RightCurlyBracket:24,Comment:25},u=Object.keys(c).reduce((function(e,t){return e[c[t]]=t,e}),{}),h={TYPE:c,NAME:u};function p(e){return e>=48&&e<=57}function d(e){return e>=65&&e<=90}function m(e){return e>=97&&e<=122}function g(e){return d(e)||m(e)}function f(e){return e>=128}function b(e){return g(e)||f(e)||95===e}function y(e){return e>=0&&e<=8||11===e||e>=14&&e<=31||127===e}function k(e){return 10===e||13===e||12===e}function v(e){return k(e)||32===e||9===e}function x(e,t){return 92===e&&(!k(t)&&0!==t)}var w=new Array(128);C.Eof=128,C.WhiteSpace=130,C.Digit=131,C.NameStart=132,C.NonPrintable=133;for(var S=0;S<w.length;S++)switch(!0){case v(S):w[S]=C.WhiteSpace;break;case p(S):w[S]=C.Digit;break;case b(S):w[S]=C.NameStart;break;case y(S):w[S]=C.NonPrintable;break;default:w[S]=S||C.Eof;}function C(e){return e<128?w[e]:C.NameStart}var z={isDigit:p,isHexDigit:function(e){return p(e)||e>=65&&e<=70||e>=97&&e<=102},isUppercaseLetter:d,isLowercaseLetter:m,isLetter:g,isNonAscii:f,isNameStart:b,isName:function(e){return b(e)||p(e)||45===e},isNonPrintable:y,isNewline:k,isWhiteSpace:v,isValidEscape:x,isIdentifierStart:function(e,t,n){return 45===e?b(t)||45===t||x(t,n):!!b(e)||92===e&&x(e,t)},isNumberStart:function(e,t,n){return 43===e||45===e?p(t)?2:46===t&&p(n)?3:0:46===e?p(t)?2:0:p(e)?1:0},isBOM:function(e){return 65279===e||65534===e?1:0},charCodeCategory:C},A=z.isDigit,P=z.isHexDigit,T=z.isUppercaseLetter,L=z.isName,E=z.isWhiteSpace,D=z.isValidEscape;function O(e,t){return t<e.length?e.charCodeAt(t):0}function B(e,t,n){return 13===n&&10===O(e,t+1)?2:1}function I(e,t,n){var r=e.charCodeAt(t);return T(r)&&(r|=32),r===n}function N(e,t){for(;t<e.length&&A(e.charCodeAt(t));t++);return t}function R(e,t){if(P(O(e,(t+=2)-1))){for(var n=Math.min(e.length,t+5);t<n&&P(O(e,t));t++);var r=O(e,t);E(r)&&(t+=B(e,t,r));}return t}var M={consumeEscaped:R,consumeName:function(e,t){for(;t<e.length;t++){var n=e.charCodeAt(t);if(!L(n)){if(!D(n,O(e,t+1)))break;t=R(e,t)-1;}}return t},consumeNumber:function(e,t){var n=e.charCodeAt(t);if(43!==n&&45!==n||(n=e.charCodeAt(t+=1)),A(n)&&(t=N(e,t+1),n=e.charCodeAt(t)),46===n&&A(e.charCodeAt(t+1))&&(n=e.charCodeAt(t+=2),t=N(e,t)),I(e,t,101)){var r=0;45!==(n=e.charCodeAt(t+1))&&43!==n||(r=1,n=e.charCodeAt(t+2)),A(n)&&(t=N(e,t+1+r+1));}return t},consumeBadUrlRemnants:function(e,t){for(;t<e.length;t++){var n=e.charCodeAt(t);if(41===n){t++;break}D(n,O(e,t+1))&&(t=R(e,t));}return t},cmpChar:I,cmpStr:function(e,t,n,r){if(n-t!==r.length)return !1;if(t<0||n>e.length)return !1;for(var i=t;i<n;i++){var a=e.charCodeAt(i),o=r.charCodeAt(i-t);if(T(a)&&(a|=32),a!==o)return !1}return !0},getNewlineLength:B,findWhiteSpaceStart:function(e,t){for(;t>=0&&E(e.charCodeAt(t));t--);return t+1},findWhiteSpaceEnd:function(e,t){for(;t<e.length&&E(e.charCodeAt(t));t++);return t}},j=h.TYPE,_=h.NAME,F=M.cmpStr,W=j.EOF,q=j.WhiteSpace,Y=j.Comment,U=function(){this.offsetAndType=null,this.balance=null,this.reset();};U.prototype={reset:function(){this.eof=!1,this.tokenIndex=-1,this.tokenType=0,this.tokenStart=this.firstCharOffset,this.tokenEnd=this.firstCharOffset;},lookupType:function(e){return (e+=this.tokenIndex)<this.tokenCount?this.offsetAndType[e]>>24:W},lookupOffset:function(e){return (e+=this.tokenIndex)<this.tokenCount?16777215&this.offsetAndType[e-1]:this.source.length},lookupValue:function(e,t){return (e+=this.tokenIndex)<this.tokenCount&&F(this.source,16777215&this.offsetAndType[e-1],16777215&this.offsetAndType[e],t)},getTokenStart:function(e){return e===this.tokenIndex?this.tokenStart:e>0?e<this.tokenCount?16777215&this.offsetAndType[e-1]:16777215&this.offsetAndType[this.tokenCount]:this.firstCharOffset},getRawLength:function(e,t){var n,r=e,i=16777215&this.offsetAndType[Math.max(r-1,0)];e:for(;r<this.tokenCount&&!((n=this.balance[r])<e);r++)switch(t(this.offsetAndType[r]>>24,this.source,i)){case 1:break e;case 2:r++;break e;default:i=16777215&this.offsetAndType[r],this.balance[n]===r&&(r=n);}return r-this.tokenIndex},isBalanceEdge:function(e){return this.balance[this.tokenIndex]<e},isDelim:function(e,t){return t?this.lookupType(t)===j.Delim&&this.source.charCodeAt(this.lookupOffset(t))===e:this.tokenType===j.Delim&&this.source.charCodeAt(this.tokenStart)===e},getTokenValue:function(){return this.source.substring(this.tokenStart,this.tokenEnd)},getTokenLength:function(){return this.tokenEnd-this.tokenStart},substrToCursor:function(e){return this.source.substring(e,this.tokenStart)},skipWS:function(){for(var e=this.tokenIndex,t=0;e<this.tokenCount&&this.offsetAndType[e]>>24===q;e++,t++);t>0&&this.skip(t);},skipSC:function(){for(;this.tokenType===q||this.tokenType===Y;)this.next();},skip:function(e){var t=this.tokenIndex+e;t<this.tokenCount?(this.tokenIndex=t,this.tokenStart=16777215&this.offsetAndType[t-1],t=this.offsetAndType[t],this.tokenType=t>>24,this.tokenEnd=16777215&t):(this.tokenIndex=this.tokenCount,this.next());},next:function(){var e=this.tokenIndex+1;e<this.tokenCount?(this.tokenIndex=e,this.tokenStart=this.tokenEnd,e=this.offsetAndType[e],this.tokenType=e>>24,this.tokenEnd=16777215&e):(this.tokenIndex=this.tokenCount,this.eof=!0,this.tokenType=W,this.tokenStart=this.tokenEnd=this.source.length);},forEachToken(e){for(var t=0,n=this.firstCharOffset;t<this.tokenCount;t++){var r=n,i=this.offsetAndType[t],a=16777215&i;n=a,e(i>>24,r,a,t);}},dump(){var e=new Array(this.tokenCount);return this.forEachToken((t,n,r,i)=>{e[i]={idx:i,type:_[t],chunk:this.source.substring(n,r),balance:this.balance[i]};}),e}};var H=U;function V(e){return e}function K(e,t,n,r){var i,a;switch(e.type){case"Group":i=function(e,t,n,r){var i=" "===e.combinator||r?e.combinator:" "+e.combinator+" ",a=e.terms.map((function(e){return K(e,t,n,r)})).join(i);return (e.explicit||n)&&(a=(r||","===a[0]?"[":"[ ")+a+(r?"]":" ]")),a}(e,t,n,r)+(e.disallowEmpty?"!":"");break;case"Multiplier":return K(e.term,t,n,r)+t(0===(a=e).min&&0===a.max?"*":0===a.min&&1===a.max?"?":1===a.min&&0===a.max?a.comma?"#":"+":1===a.min&&1===a.max?"":(a.comma?"#":"")+(a.min===a.max?"{"+a.min+"}":"{"+a.min+","+(0!==a.max?a.max:"")+"}"),e);case"Type":i="<"+e.name+(e.opts?t(function(e){switch(e.type){case"Range":return " ["+(null===e.min?"-∞":e.min)+","+(null===e.max?"∞":e.max)+"]";default:throw new Error("Unknown node type `"+e.type+"`")}}(e.opts),e.opts):"")+">";break;case"Property":i="<'"+e.name+"'>";break;case"Keyword":i=e.name;break;case"AtKeyword":i="@"+e.name;break;case"Function":i=e.name+"(";break;case"String":case"Token":i=e.value;break;case"Comma":i=",";break;default:throw new Error("Unknown node type `"+e.type+"`")}return t(i,e)}var G=function(e,t){var n=V,r=!1,i=!1;return "function"==typeof t?n=t:t&&(r=Boolean(t.forceBraces),i=Boolean(t.compact),"function"==typeof t.decorate&&(n=t.decorate)),K(e,n,r,i)};const Q={offset:0,line:1,column:1};function X(e,t){const n=e&&e.loc&&e.loc[t];return n?"line"in n?Z(n):n:null}function Z({offset:e,line:t,column:n},r){const i={offset:e,line:t,column:n};if(r){const e=r.split(/\n|\r\n?|\f/);i.offset+=r.length,i.line+=e.length-1,i.column=1===e.length?i.column+r.length:e.pop().length+1;}return i}var $=function(e,t){const n=o("SyntaxReferenceError",e+(t?" `"+t+"`":""));return n.reference=t,n},J=function(e,t,n,r){const i=o("SyntaxMatchError",e),{css:a,mismatchOffset:s,mismatchLength:l,start:c,end:u}=function(e,t){const n=e.tokens,r=e.longestMatch,i=r<n.length&&n[r].node||null,a=i!==t?i:null;let o,s,l=0,c=0,u=0,h="";for(let e=0;e<n.length;e++){const t=n[e].value;e===r&&(c=t.length,l=h.length),null!==a&&n[e].node===a&&(e<=r?u++:u=0),h+=t;}return r===n.length||u>1?(o=X(a||t,"end")||Z(Q,h),s=Z(o)):(o=X(a,"start")||Z(X(t,"start")||Q,h.slice(0,l)),s=X(a,"end")||Z(o,h.substr(l,c))),{css:h,mismatchOffset:l,mismatchLength:c,start:o,end:s}}(r,n);return i.rawMessage=e,i.syntax=t?G(t):"<generic>",i.css=a,i.mismatchOffset=s,i.mismatchLength=l,i.message=e+"\n  syntax: "+i.syntax+"\n   value: "+(a||"<empty string>")+"\n  --------"+new Array(i.mismatchOffset+1).join("-")+"^",Object.assign(i,c),i.loc={source:n&&n.loc&&n.loc.source||"<unknown>",start:c,end:u},i},ee=Object.prototype.hasOwnProperty,te=Object.create(null),ne=Object.create(null);function re(e,t){return t=t||0,e.length-t>=2&&45===e.charCodeAt(t)&&45===e.charCodeAt(t+1)}function ie(e,t){if(t=t||0,e.length-t>=3&&45===e.charCodeAt(t)&&45!==e.charCodeAt(t+1)){var n=e.indexOf("-",t+2);if(-1!==n)return e.substring(t,n+1)}return ""}var ae={keyword:function(e){if(ee.call(te,e))return te[e];var t=e.toLowerCase();if(ee.call(te,t))return te[e]=te[t];var n=re(t,0),r=n?"":ie(t,0);return te[e]=Object.freeze({basename:t.substr(r.length),name:t,vendor:r,prefix:r,custom:n})},property:function(e){if(ee.call(ne,e))return ne[e];var t=e,n=e[0];"/"===n?n="/"===e[1]?"//":"/":"_"!==n&&"*"!==n&&"$"!==n&&"#"!==n&&"+"!==n&&"&"!==n&&(n="");var r=re(t,n.length);if(!r&&(t=t.toLowerCase(),ee.call(ne,t)))return ne[e]=ne[t];var i=r?"":ie(t,n.length),a=t.substr(0,n.length+i.length);return ne[e]=Object.freeze({basename:t.substr(a.length),name:t.substr(n.length),hack:n,vendor:i,prefix:a,custom:r})},isCustomProperty:re,vendorPrefix:ie},oe="undefined"!=typeof Uint32Array?Uint32Array:Array,se=function(e,t){return null===e||e.length<t?new oe(Math.max(t+1024,16384)):e},le=h.TYPE,ce=z.isNewline,ue=z.isName,he=z.isValidEscape,pe=z.isNumberStart,de=z.isIdentifierStart,me=z.charCodeCategory,ge=z.isBOM,fe=M.cmpStr,be=M.getNewlineLength,ye=M.findWhiteSpaceEnd,ke=M.consumeEscaped,ve=M.consumeName,xe=M.consumeNumber,we=M.consumeBadUrlRemnants;function Se(e,t){function n(t){return t<o?e.charCodeAt(t):0}function r(){return h=xe(e,h),de(n(h),n(h+1),n(h+2))?(f=le.Dimension,void(h=ve(e,h))):37===n(h)?(f=le.Percentage,void h++):void(f=le.Number)}function i(){const t=h;return h=ve(e,h),fe(e,t,h,"url")&&40===n(h)?34===n(h=ye(e,h+1))||39===n(h)?(f=le.Function,void(h=t+4)):void function(){for(f=le.Url,h=ye(e,h);h<e.length;h++){var t=e.charCodeAt(h);switch(me(t)){case 41:return void h++;case me.Eof:return;case me.WhiteSpace:return 41===n(h=ye(e,h))||h>=e.length?void(h<e.length&&h++):(h=we(e,h),void(f=le.BadUrl));case 34:case 39:case 40:case me.NonPrintable:return h=we(e,h),void(f=le.BadUrl);case 92:if(he(t,n(h+1))){h=ke(e,h)-1;break}return h=we(e,h),void(f=le.BadUrl)}}}():40===n(h)?(f=le.Function,void h++):void(f=le.Ident)}function a(t){for(t||(t=n(h++)),f=le.String;h<e.length;h++){var r=e.charCodeAt(h);switch(me(r)){case t:return void h++;case me.Eof:return;case me.WhiteSpace:if(ce(r))return h+=be(e,h,r),void(f=le.BadString);break;case 92:if(h===e.length-1)break;var i=n(h+1);ce(i)?h+=be(e,h+1,i):he(r,i)&&(h=ke(e,h)-1);}}}t||(t=new H);for(var o=(e=String(e||"")).length,s=se(t.offsetAndType,o+1),l=se(t.balance,o+1),c=0,u=ge(n(0)),h=u,p=0,d=0,m=0;h<o;){var g=e.charCodeAt(h),f=0;switch(l[c]=o,me(g)){case me.WhiteSpace:f=le.WhiteSpace,h=ye(e,h+1);break;case 34:a();break;case 35:ue(n(h+1))||he(n(h+1),n(h+2))?(f=le.Hash,h=ve(e,h+1)):(f=le.Delim,h++);break;case 39:a();break;case 40:f=le.LeftParenthesis,h++;break;case 41:f=le.RightParenthesis,h++;break;case 43:pe(g,n(h+1),n(h+2))?r():(f=le.Delim,h++);break;case 44:f=le.Comma,h++;break;case 45:pe(g,n(h+1),n(h+2))?r():45===n(h+1)&&62===n(h+2)?(f=le.CDC,h+=3):de(g,n(h+1),n(h+2))?i():(f=le.Delim,h++);break;case 46:pe(g,n(h+1),n(h+2))?r():(f=le.Delim,h++);break;case 47:42===n(h+1)?(f=le.Comment,1===(h=e.indexOf("*/",h+2)+2)&&(h=e.length)):(f=le.Delim,h++);break;case 58:f=le.Colon,h++;break;case 59:f=le.Semicolon,h++;break;case 60:33===n(h+1)&&45===n(h+2)&&45===n(h+3)?(f=le.CDO,h+=4):(f=le.Delim,h++);break;case 64:de(n(h+1),n(h+2),n(h+3))?(f=le.AtKeyword,h=ve(e,h+1)):(f=le.Delim,h++);break;case 91:f=le.LeftSquareBracket,h++;break;case 92:he(g,n(h+1))?i():(f=le.Delim,h++);break;case 93:f=le.RightSquareBracket,h++;break;case 123:f=le.LeftCurlyBracket,h++;break;case 125:f=le.RightCurlyBracket,h++;break;case me.Digit:r();break;case me.NameStart:i();break;case me.Eof:break;default:f=le.Delim,h++;}switch(f){case p:for(p=(d=l[m=16777215&d])>>24,l[c]=m,l[m++]=c;m<c;m++)l[m]===o&&(l[m]=c);break;case le.LeftParenthesis:case le.Function:l[c]=d,d=(p=le.RightParenthesis)<<24|c;break;case le.LeftSquareBracket:l[c]=d,d=(p=le.RightSquareBracket)<<24|c;break;case le.LeftCurlyBracket:l[c]=d,d=(p=le.RightCurlyBracket)<<24|c;}s[c++]=f<<24|h;}for(s[c]=le.EOF<<24|h,l[c]=o,l[o]=o;0!==d;)d=l[m=16777215&d],l[m]=o;return t.source=e,t.firstCharOffset=u,t.offsetAndType=s,t.tokenCount=c,t.balance=l,t.reset(),t.next(),t}Object.keys(h).forEach((function(e){Se[e]=h[e];})),Object.keys(z).forEach((function(e){Se[e]=z[e];})),Object.keys(M).forEach((function(e){Se[e]=M[e];}));var Ce=Se,ze=Ce.isDigit,Ae=Ce.cmpChar,Pe=Ce.TYPE,Te=Pe.Delim,Le=Pe.WhiteSpace,Ee=Pe.Comment,De=Pe.Ident,Oe=Pe.Number,Be=Pe.Dimension;function Ie(e,t){return null!==e&&e.type===Te&&e.value.charCodeAt(0)===t}function Ne(e,t,n){for(;null!==e&&(e.type===Le||e.type===Ee);)e=n(++t);return t}function Re(e,t,n,r){if(!e)return 0;var i=e.value.charCodeAt(t);if(43===i||45===i){if(n)return 0;t++;}for(;t<e.value.length;t++)if(!ze(e.value.charCodeAt(t)))return 0;return r+1}function Me(e,t,n){var r=!1,i=Ne(e,t,n);if(null===(e=n(i)))return t;if(e.type!==Oe){if(!Ie(e,43)&&!Ie(e,45))return t;if(r=!0,i=Ne(n(++i),i,n),null===(e=n(i))&&e.type!==Oe)return 0}if(!r){var a=e.value.charCodeAt(0);if(43!==a&&45!==a)return 0}return Re(e,r?0:1,r,i)}var je=Ce.isHexDigit,_e=Ce.cmpChar,Fe=Ce.TYPE,We=Fe.Ident,qe=Fe.Delim,Ye=Fe.Number,Ue=Fe.Dimension;function He(e,t){return null!==e&&e.type===qe&&e.value.charCodeAt(0)===t}function Ve(e,t){return e.value.charCodeAt(0)===t}function Ke(e,t,n){for(var r=t,i=0;r<e.value.length;r++){var a=e.value.charCodeAt(r);if(45===a&&n&&0!==i)return Ke(e,t+i+1,!1)>0?6:0;if(!je(a))return 0;if(++i>6)return 0}return i}function Ge(e,t,n){if(!e)return 0;for(;He(n(t),63);){if(++e>6)return 0;t++;}return t}var Qe=Ce.isIdentifierStart,Xe=Ce.isHexDigit,Ze=Ce.isDigit,$e=Ce.cmpStr,Je=Ce.consumeNumber,et=Ce.TYPE,tt=["unset","initial","inherit"],nt=["calc(","-moz-calc(","-webkit-calc("];function rt(e,t){return t<e.length?e.charCodeAt(t):0}function it(e,t){return $e(e,0,e.length,t)}function at(e,t){for(var n=0;n<t.length;n++)if(it(e,t[n]))return !0;return !1}function ot(e,t){return t===e.length-2&&(92===e.charCodeAt(t)&&Ze(e.charCodeAt(t+1)))}function st(e,t,n){if(e&&"Range"===e.type){var r=Number(void 0!==n&&n!==t.length?t.substr(0,n):t);if(isNaN(r))return !0;if(null!==e.min&&r<e.min)return !0;if(null!==e.max&&r>e.max)return !0}return !1}function lt(e,t){var n=e.index,r=0;do{if(r++,e.balance<=n)break}while(e=t(r));return r}function ct(e){return function(t,n,r){return null===t?0:t.type===et.Function&&at(t.value,nt)?lt(t,n):e(t,n,r)}}function ut(e){return function(t){return null===t||t.type!==e?0:1}}function ht(e){return function(t,n,r){if(null===t||t.type!==et.Dimension)return 0;var i=Je(t.value,0);if(null!==e){var a=t.value.indexOf("\\",i),o=-1!==a&&ot(t.value,a)?t.value.substring(i,a):t.value.substr(i);if(!1===e.hasOwnProperty(o.toLowerCase()))return 0}return st(r,t.value,i)?0:1}}function pt(e){return "function"!=typeof e&&(e=function(){return 0}),function(t,n,r){return null!==t&&t.type===et.Number&&0===Number(t.value)?1:e(t,n,r)}}var dt,mt={"ident-token":ut(et.Ident),"function-token":ut(et.Function),"at-keyword-token":ut(et.AtKeyword),"hash-token":ut(et.Hash),"string-token":ut(et.String),"bad-string-token":ut(et.BadString),"url-token":ut(et.Url),"bad-url-token":ut(et.BadUrl),"delim-token":ut(et.Delim),"number-token":ut(et.Number),"percentage-token":ut(et.Percentage),"dimension-token":ut(et.Dimension),"whitespace-token":ut(et.WhiteSpace),"CDO-token":ut(et.CDO),"CDC-token":ut(et.CDC),"colon-token":ut(et.Colon),"semicolon-token":ut(et.Semicolon),"comma-token":ut(et.Comma),"[-token":ut(et.LeftSquareBracket),"]-token":ut(et.RightSquareBracket),"(-token":ut(et.LeftParenthesis),")-token":ut(et.RightParenthesis),"{-token":ut(et.LeftCurlyBracket),"}-token":ut(et.RightCurlyBracket),string:ut(et.String),ident:ut(et.Ident),"custom-ident":function(e){if(null===e||e.type!==et.Ident)return 0;var t=e.value.toLowerCase();return at(t,tt)||it(t,"default")?0:1},"custom-property-name":function(e){return null===e||e.type!==et.Ident||45!==rt(e.value,0)||45!==rt(e.value,1)?0:1},"hex-color":function(e){if(null===e||e.type!==et.Hash)return 0;var t=e.value.length;if(4!==t&&5!==t&&7!==t&&9!==t)return 0;for(var n=1;n<t;n++)if(!Xe(e.value.charCodeAt(n)))return 0;return 1},"id-selector":function(e){return null===e||e.type!==et.Hash?0:Qe(rt(e.value,1),rt(e.value,2),rt(e.value,3))?1:0},"an-plus-b":function(e,t){var n=0;if(!e)return 0;if(e.type===Oe)return Re(e,0,!1,n);if(e.type===De&&45===e.value.charCodeAt(0)){if(!Ae(e.value,1,110))return 0;switch(e.value.length){case 2:return Me(t(++n),n,t);case 3:return 45!==e.value.charCodeAt(2)?0:(n=Ne(t(++n),n,t),Re(e=t(n),0,!0,n));default:return 45!==e.value.charCodeAt(2)?0:Re(e,3,!0,n)}}else if(e.type===De||Ie(e,43)&&t(n+1).type===De){if(e.type!==De&&(e=t(++n)),null===e||!Ae(e.value,0,110))return 0;switch(e.value.length){case 1:return Me(t(++n),n,t);case 2:return 45!==e.value.charCodeAt(1)?0:(n=Ne(t(++n),n,t),Re(e=t(n),0,!0,n));default:return 45!==e.value.charCodeAt(1)?0:Re(e,2,!0,n)}}else if(e.type===Be){for(var r=e.value.charCodeAt(0),i=43===r||45===r?1:0,a=i;a<e.value.length&&ze(e.value.charCodeAt(a));a++);return a===i?0:Ae(e.value,a,110)?a+1===e.value.length?Me(t(++n),n,t):45!==e.value.charCodeAt(a+1)?0:a+2===e.value.length?(n=Ne(t(++n),n,t),Re(e=t(n),0,!0,n)):Re(e,a+2,!0,n):0}return 0},urange:function(e,t){var n=0;if(null===e||e.type!==We||!_e(e.value,0,117))return 0;if(null===(e=t(++n)))return 0;if(He(e,43))return null===(e=t(++n))?0:e.type===We?Ge(Ke(e,0,!0),++n,t):He(e,63)?Ge(1,++n,t):0;if(e.type===Ye){if(!Ve(e,43))return 0;var r=Ke(e,1,!0);return 0===r?0:null===(e=t(++n))?n:e.type===Ue||e.type===Ye?Ve(e,45)&&Ke(e,1,!1)?n+1:0:Ge(r,n,t)}return e.type===Ue&&Ve(e,43)?Ge(Ke(e,1,!0),++n,t):0},"declaration-value":function(e,t){if(!e)return 0;var n=0,r=0,i=e.index;e:do{switch(e.type){case et.BadString:case et.BadUrl:break e;case et.RightCurlyBracket:case et.RightParenthesis:case et.RightSquareBracket:if(e.balance>e.index||e.balance<i)break e;r--;break;case et.Semicolon:if(0===r)break e;break;case et.Delim:if("!"===e.value&&0===r)break e;break;case et.Function:case et.LeftParenthesis:case et.LeftSquareBracket:case et.LeftCurlyBracket:r++;}if(n++,e.balance<=i)break}while(e=t(n));return n},"any-value":function(e,t){if(!e)return 0;var n=e.index,r=0;e:do{switch(e.type){case et.BadString:case et.BadUrl:break e;case et.RightCurlyBracket:case et.RightParenthesis:case et.RightSquareBracket:if(e.balance>e.index||e.balance<n)break e}if(r++,e.balance<=n)break}while(e=t(r));return r},dimension:ct(ht(null)),angle:ct(ht({deg:!0,grad:!0,rad:!0,turn:!0})),decibel:ct(ht({db:!0})),frequency:ct(ht({hz:!0,khz:!0})),flex:ct(ht({fr:!0})),length:ct(pt(ht({px:!0,mm:!0,cm:!0,in:!0,pt:!0,pc:!0,q:!0,em:!0,ex:!0,ch:!0,rem:!0,vh:!0,vw:!0,vmin:!0,vmax:!0,vm:!0}))),resolution:ct(ht({dpi:!0,dpcm:!0,dppx:!0,x:!0})),semitones:ct(ht({st:!0})),time:ct(ht({s:!0,ms:!0})),percentage:ct((function(e,t,n){return null===e||e.type!==et.Percentage||st(n,e.value,e.value.length-1)?0:1})),zero:pt(),number:ct((function(e,t,n){if(null===e)return 0;var r=Je(e.value,0);return r===e.value.length||ot(e.value,r)?st(n,e.value,r)?0:1:0})),integer:ct((function(e,t,n){if(null===e||e.type!==et.Number)return 0;for(var r=43===e.value.charCodeAt(0)||45===e.value.charCodeAt(0)?1:0;r<e.value.length;r++)if(!Ze(e.value.charCodeAt(r)))return 0;return st(n,e.value,r)?0:1})),"-ms-legacy-expression":(dt="expression",dt+="(",function(e,t){return null!==e&&it(e.value,dt)?lt(e,t):0})},gt=function(e,t,n){var r=o("SyntaxError",e);return r.input=t,r.offset=n,r.rawMessage=e,r.message=r.rawMessage+"\n  "+r.input+"\n--"+new Array((r.offset||r.input.length)+1).join("-")+"^",r},ft=function(e){this.str=e,this.pos=0;};ft.prototype={charCodeAt:function(e){return e<this.str.length?this.str.charCodeAt(e):0},charCode:function(){return this.charCodeAt(this.pos)},nextCharCode:function(){return this.charCodeAt(this.pos+1)},nextNonWsCode:function(e){return this.charCodeAt(this.findWsEnd(e))},findWsEnd:function(e){for(;e<this.str.length;e++){var t=this.str.charCodeAt(e);if(13!==t&&10!==t&&12!==t&&32!==t&&9!==t)break}return e},substringToPos:function(e){return this.str.substring(this.pos,this.pos=e)},eat:function(e){this.charCode()!==e&&this.error("Expect `"+String.fromCharCode(e)+"`"),this.pos++;},peek:function(){return this.pos<this.str.length?this.str.charAt(this.pos++):""},error:function(e){throw new gt(e,this.str,this.pos)}};var bt=ft,yt=function(e){for(var t="function"==typeof Uint32Array?new Uint32Array(128):new Array(128),n=0;n<128;n++)t[n]=e(String.fromCharCode(n))?1:0;return t}((function(e){return /[a-zA-Z0-9\-]/.test(e)})),kt={" ":1,"&&":2,"||":3,"|":4};function vt(e){return e.substringToPos(e.findWsEnd(e.pos))}function xt(e){for(var t=e.pos;t<e.str.length;t++){var n=e.str.charCodeAt(t);if(n>=128||0===yt[n])break}return e.pos===t&&e.error("Expect a keyword"),e.substringToPos(t)}function wt(e){for(var t=e.pos;t<e.str.length;t++){var n=e.str.charCodeAt(t);if(n<48||n>57)break}return e.pos===t&&e.error("Expect a number"),e.substringToPos(t)}function St(e){var t=e.str.indexOf("'",e.pos+1);return -1===t&&(e.pos=e.str.length,e.error("Expect an apostrophe")),e.substringToPos(t+1)}function Ct(e){var t,n=null;return e.eat(123),t=wt(e),44===e.charCode()?(e.pos++,125!==e.charCode()&&(n=wt(e))):n=t,e.eat(125),{min:Number(t),max:n?Number(n):0}}function zt(e,t){var n=function(e){var t=null,n=!1;switch(e.charCode()){case 42:e.pos++,t={min:0,max:0};break;case 43:e.pos++,t={min:1,max:0};break;case 63:e.pos++,t={min:0,max:1};break;case 35:e.pos++,n=!0,t=123===e.charCode()?Ct(e):{min:1,max:0};break;case 123:t=Ct(e);break;default:return null}return {type:"Multiplier",comma:n,min:t.min,max:t.max,term:null}}(e);return null!==n?(n.term=t,n):t}function At(e){var t=e.peek();return ""===t?null:{type:"Token",value:t}}function Pt(e){var t,n=null;return e.eat(60),t=xt(e),40===e.charCode()&&41===e.nextCharCode()&&(e.pos+=2,t+="()"),91===e.charCodeAt(e.findWsEnd(e.pos))&&(vt(e),n=function(e){var t=null,n=null,r=1;return e.eat(91),45===e.charCode()&&(e.peek(),r=-1),-1==r&&8734===e.charCode()?e.peek():t=r*Number(wt(e)),vt(e),e.eat(44),vt(e),8734===e.charCode()?e.peek():(r=1,45===e.charCode()&&(e.peek(),r=-1),n=r*Number(wt(e))),e.eat(93),null===t&&null===n?null:{type:"Range",min:t,max:n}}(e)),e.eat(62),zt(e,{type:"Type",name:t,opts:n})}function Tt(e,t){function n(e,t){return {type:"Group",terms:e,combinator:t,disallowEmpty:!1,explicit:!1}}for(t=Object.keys(t).sort((function(e,t){return kt[e]-kt[t]}));t.length>0;){for(var r=t.shift(),i=0,a=0;i<e.length;i++){var o=e[i];"Combinator"===o.type&&(o.value===r?(-1===a&&(a=i-1),e.splice(i,1),i--):(-1!==a&&i-a>1&&(e.splice(a,i-a,n(e.slice(a,i),r)),i=a+1),a=-1));}-1!==a&&t.length&&e.splice(a,i-a,n(e.slice(a,i),r));}return r}function Lt(e){for(var t,n=[],r={},i=null,a=e.pos;t=Et(e);)"Spaces"!==t.type&&("Combinator"===t.type?(null!==i&&"Combinator"!==i.type||(e.pos=a,e.error("Unexpected combinator")),r[t.value]=!0):null!==i&&"Combinator"!==i.type&&(r[" "]=!0,n.push({type:"Combinator",value:" "})),n.push(t),i=t,a=e.pos);return null!==i&&"Combinator"===i.type&&(e.pos-=a,e.error("Unexpected combinator")),{type:"Group",terms:n,combinator:Tt(n,r)||" ",disallowEmpty:!1,explicit:!1}}function Et(e){var t=e.charCode();if(t<128&&1===yt[t])return function(e){var t;return t=xt(e),40===e.charCode()?(e.pos++,{type:"Function",name:t}):zt(e,{type:"Keyword",name:t})}(e);switch(t){case 93:break;case 91:return zt(e,function(e){var t;return e.eat(91),t=Lt(e),e.eat(93),t.explicit=!0,33===e.charCode()&&(e.pos++,t.disallowEmpty=!0),t}(e));case 60:return 39===e.nextCharCode()?function(e){var t;return e.eat(60),e.eat(39),t=xt(e),e.eat(39),e.eat(62),zt(e,{type:"Property",name:t})}(e):Pt(e);case 124:return {type:"Combinator",value:e.substringToPos(124===e.nextCharCode()?e.pos+2:e.pos+1)};case 38:return e.pos++,e.eat(38),{type:"Combinator",value:"&&"};case 44:return e.pos++,{type:"Comma"};case 39:return zt(e,{type:"String",value:St(e)});case 32:case 9:case 10:case 13:case 12:return {type:"Spaces",value:vt(e)};case 64:return (t=e.nextCharCode())<128&&1===yt[t]?(e.pos++,{type:"AtKeyword",name:xt(e)}):At(e);case 42:case 43:case 63:case 35:case 33:break;case 123:if((t=e.nextCharCode())<48||t>57)return At(e);break;default:return At(e)}}function Dt(e){var t=new bt(e),n=Lt(t);return t.pos!==e.length&&t.error("Unexpected input"),1===n.terms.length&&"Group"===n.terms[0].type&&(n=n.terms[0]),n}Dt("[a&&<b>#|<'c'>*||e() f{2} /,(% g#{1,2} h{2,})]!");var Ot=Dt,Bt=function(){};function It(e){return "function"==typeof e?e:Bt}var Nt=function(e,t,n){var r=Bt,i=Bt;if("function"==typeof t?r=t:t&&(r=It(t.enter),i=It(t.leave)),r===Bt&&i===Bt)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");!function e(t){switch(r.call(n,t),t.type){case"Group":t.terms.forEach(e);break;case"Multiplier":e(t.term);break;case"Type":case"Property":case"Keyword":case"AtKeyword":case"Function":case"String":case"Token":case"Comma":break;default:throw new Error("Unknown type: "+t.type)}i.call(n,t);}(e);},Rt=new H,Mt={decorator:function(e){var t=null,n={len:0,node:null},r=[n],i="";return {children:e.children,node:function(n){var r=t;t=n,e.node.call(this,n),t=r;},chunk:function(e){i+=e,n.node!==t?r.push({len:e.length,node:t}):n.len+=e.length;},result:function(){return jt(i,r)}}}};function jt(e,t){var n=[],r=0,i=0,a=t?t[i].node:null;for(Ce(e,Rt);!Rt.eof;){if(t)for(;i<t.length&&r+t[i].len<=Rt.tokenStart;)r+=t[i++].len,a=t[i].node;n.push({type:Rt.tokenType,value:Rt.getTokenValue(),index:Rt.tokenIndex,balance:Rt.balance[Rt.tokenIndex],node:a}),Rt.next();}return n}var _t={type:"Match"},Ft={type:"Mismatch"},Wt={type:"DisallowEmpty"};function qt(e,t,n){return t===_t&&n===Ft||e===_t&&t===_t&&n===_t?e:("If"===e.type&&e.else===Ft&&t===_t&&(t=e.then,e=e.match),{type:"If",match:e,then:t,else:n})}function Yt(e){return e.length>2&&40===e.charCodeAt(e.length-2)&&41===e.charCodeAt(e.length-1)}function Ut(e){return "Keyword"===e.type||"AtKeyword"===e.type||"Function"===e.type||"Type"===e.type&&Yt(e.name)}function Ht(e){if("function"==typeof e)return {type:"Generic",fn:e};switch(e.type){case"Group":var t=function e(t,n,r){switch(t){case" ":for(var i=_t,a=n.length-1;a>=0;a--){i=qt(l=n[a],i,Ft);}return i;case"|":i=Ft;var o=null;for(a=n.length-1;a>=0;a--){if(Ut(l=n[a])&&(null===o&&a>0&&Ut(n[a-1])&&(i=qt({type:"Enum",map:o=Object.create(null)},_t,i)),null!==o)){var s=(Yt(l.name)?l.name.slice(0,-1):l.name).toLowerCase();if(s in o==!1){o[s]=l;continue}}o=null,i=qt(l,_t,i);}return i;case"&&":if(n.length>5)return {type:"MatchOnce",terms:n,all:!0};for(i=Ft,a=n.length-1;a>=0;a--){var l=n[a];c=n.length>1?e(t,n.filter((function(e){return e!==l})),!1):_t,i=qt(l,c,i);}return i;case"||":if(n.length>5)return {type:"MatchOnce",terms:n,all:!1};for(i=r?_t:Ft,a=n.length-1;a>=0;a--){var c;l=n[a];c=n.length>1?e(t,n.filter((function(e){return e!==l})),!0):_t,i=qt(l,c,i);}return i}}(e.combinator,e.terms.map(Ht),!1);return e.disallowEmpty&&(t=qt(t,Wt,Ft)),t;case"Multiplier":return function(e){var t=_t,n=Ht(e.term);if(0===e.max)n=qt(n,Wt,Ft),(t=qt(n,null,Ft)).then=qt(_t,_t,t),e.comma&&(t.then.else=qt({type:"Comma",syntax:e},t,Ft));else for(var r=e.min||1;r<=e.max;r++)e.comma&&t!==_t&&(t=qt({type:"Comma",syntax:e},t,Ft)),t=qt(n,qt(_t,_t,t),Ft);if(0===e.min)t=qt(_t,_t,t);else for(r=0;r<e.min-1;r++)e.comma&&t!==_t&&(t=qt({type:"Comma",syntax:e},t,Ft)),t=qt(n,t,Ft);return t}(e);case"Type":case"Property":return {type:e.type,name:e.name,syntax:e};case"Keyword":return {type:e.type,name:e.name.toLowerCase(),syntax:e};case"AtKeyword":return {type:e.type,name:"@"+e.name.toLowerCase(),syntax:e};case"Function":return {type:e.type,name:e.name.toLowerCase()+"(",syntax:e};case"String":return 3===e.value.length?{type:"Token",value:e.value.charAt(1),syntax:e}:{type:e.type,value:e.value.substr(1,e.value.length-2).replace(/\\'/g,"'"),syntax:e};case"Token":return {type:e.type,value:e.value,syntax:e};case"Comma":return {type:e.type,syntax:e};default:throw new Error("Unknown node type:",e.type)}}var Vt=_t,Kt=Ft,Gt=Wt,Qt=function(e,t){return "string"==typeof e&&(e=Ot(e)),{type:"MatchGraph",match:Ht(e),syntax:t||null,source:e}},Xt=Object.prototype.hasOwnProperty,Zt=Vt,$t=Kt,Jt=Gt,en=h.TYPE;function tn(e){for(var t=null,n=null,r=e;null!==r;)n=r.prev,r.prev=t,t=r,r=n;return t}function nn(e,t){if(e.length!==t.length)return !1;for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r>=65&&r<=90&&(r|=32),r!==t.charCodeAt(n))return !1}return !0}function rn(e){return null===e||(e.type===en.Comma||e.type===en.Function||e.type===en.LeftParenthesis||e.type===en.LeftSquareBracket||e.type===en.LeftCurlyBracket||function(e){return e.type===en.Delim&&"?"!==e.value}(e))}function an(e){return null===e||(e.type===en.RightParenthesis||e.type===en.RightSquareBracket||e.type===en.RightCurlyBracket||e.type===en.Delim)}function on(e,t,n){function r(){do{b++,f=b<e.length?e[b]:null;}while(null!==f&&(f.type===en.WhiteSpace||f.type===en.Comment))}function i(t){var n=b+t;return n<e.length?e[n]:null}function a(e,t){return {nextState:e,matchStack:k,syntaxStack:u,thenStack:h,tokenIndex:b,prev:t}}function o(e){h={nextState:e,matchStack:k,syntaxStack:u,prev:h};}function s(e){p=a(e,p);}function l(){k={type:1,syntax:t.syntax,token:f,prev:k},r(),d=null,b>y&&(y=b);}function c(){k=2===k.type?k.prev:{type:3,syntax:u.syntax,token:k.token,prev:k},u=u.prev;}var u=null,h=null,p=null,d=null,m=0,g=null,f=null,b=-1,y=0,k={type:0,syntax:null,token:null,prev:null};for(r();null===g&&++m<15e3;)switch(t.type){case"Match":if(null===h){if(null!==f&&(b!==e.length-1||"\\0"!==f.value&&"\\9"!==f.value)){t=$t;break}g="Match";break}if((t=h.nextState)===Jt){if(h.matchStack===k){t=$t;break}t=Zt;}for(;h.syntaxStack!==u;)c();h=h.prev;break;case"Mismatch":if(null!==d&&!1!==d)(null===p||b>p.tokenIndex)&&(p=d,d=!1);else if(null===p){g="Mismatch";break}t=p.nextState,h=p.thenStack,u=p.syntaxStack,k=p.matchStack,b=p.tokenIndex,f=b<e.length?e[b]:null,p=p.prev;break;case"MatchGraph":t=t.match;break;case"If":t.else!==$t&&s(t.else),t.then!==Zt&&o(t.then),t=t.match;break;case"MatchOnce":t={type:"MatchOnceBuffer",syntax:t,index:0,mask:0};break;case"MatchOnceBuffer":var v=t.syntax.terms;if(t.index===v.length){if(0===t.mask||t.syntax.all){t=$t;break}t=Zt;break}if(t.mask===(1<<v.length)-1){t=Zt;break}for(;t.index<v.length;t.index++){var x=1<<t.index;if(0==(t.mask&x)){s(t),o({type:"AddMatchOnce",syntax:t.syntax,mask:t.mask|x}),t=v[t.index++];break}}break;case"AddMatchOnce":t={type:"MatchOnceBuffer",syntax:t.syntax,index:0,mask:t.mask};break;case"Enum":if(null!==f)if(-1!==(A=f.value.toLowerCase()).indexOf("\\")&&(A=A.replace(/\\[09].*$/,"")),Xt.call(t.map,A)){t=t.map[A];break}t=$t;break;case"Generic":var w=null!==u?u.opts:null,S=b+Math.floor(t.fn(f,i,w));if(!isNaN(S)&&S>b){for(;b<S;)l();t=Zt;}else t=$t;break;case"Type":case"Property":var C="Type"===t.type?"types":"properties",z=Xt.call(n,C)?n[C][t.name]:null;if(!z||!z.match)throw new Error("Bad syntax reference: "+("Type"===t.type?"<"+t.name+">":"<'"+t.name+"'>"));if(!1!==d&&null!==f&&"Type"===t.type)if("custom-ident"===t.name&&f.type===en.Ident||"length"===t.name&&"0"===f.value){null===d&&(d=a(t,p)),t=$t;break}u={syntax:t.syntax,opts:t.syntax.opts||null!==u&&u.opts||null,prev:u},k={type:2,syntax:t.syntax,token:k.token,prev:k},t=z.match;break;case"Keyword":var A=t.name;if(null!==f){var P=f.value;if(-1!==P.indexOf("\\")&&(P=P.replace(/\\[09].*$/,"")),nn(P,A)){l(),t=Zt;break}}t=$t;break;case"AtKeyword":case"Function":if(null!==f&&nn(f.value,t.name)){l(),t=Zt;break}t=$t;break;case"Token":if(null!==f&&f.value===t.value){l(),t=Zt;break}t=$t;break;case"Comma":null!==f&&f.type===en.Comma?rn(k.token)?t=$t:(l(),t=an(f)?$t:Zt):t=rn(k.token)||an(f)?Zt:$t;break;case"String":var T="";for(S=b;S<e.length&&T.length<t.value.length;S++)T+=e[S].value;if(nn(T,t.value)){for(;b<S;)l();t=Zt;}else t=$t;break;default:throw new Error("Unknown node type: "+t.type)}switch(g){case null:console.warn("[csstree-match] BREAK after 15000 iterations"),g="Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)",k=null;break;case"Match":for(;null!==u;)c();break;default:k=null;}return {tokens:e,reason:g,iterations:m,match:k,longestMatch:y}}var sn=function(e,t,n){var r=on(e,t,n||{});if(null===r.match)return r;var i=r.match,a=r.match={syntax:t.syntax||null,match:[]},o=[a];for(i=tn(i).prev;null!==i;){switch(i.type){case 2:a.match.push(a={syntax:i.syntax,match:[]}),o.push(a);break;case 3:o.pop(),a=o[o.length-1];break;default:a.match.push({syntax:i.syntax||null,token:i.token.value,node:i.token.node});}i=i.prev;}return r};function ln(e){function t(e){return null!==e&&("Type"===e.type||"Property"===e.type||"Keyword"===e.type)}var n=null;return null!==this.matched&&function r(i){if(Array.isArray(i.match)){for(var a=0;a<i.match.length;a++)if(r(i.match[a]))return t(i.syntax)&&n.unshift(i.syntax),!0}else if(i.node===e)return n=t(i.syntax)?[i.syntax]:[],!0;return !1}(this.matched),n}function cn(e,t,n){var r=ln.call(e,t);return null!==r&&r.some(n)}var un={getTrace:ln,isType:function(e,t){return cn(this,e,(function(e){return "Type"===e.type&&e.name===t}))},isProperty:function(e,t){return cn(this,e,(function(e){return "Property"===e.type&&e.name===t}))},isKeyword:function(e){return cn(this,e,(function(e){return "Keyword"===e.type}))}};var hn={matchFragments:function(e,t,n,r,i){var o=[];return null!==n.matched&&function n(s){if(null!==s.syntax&&s.syntax.type===r&&s.syntax.name===i){var l=function e(t){return "node"in t?t.node:e(t.match[0])}(s),c=function e(t){return "node"in t?t.node:e(t.match[t.match.length-1])}(s);e.syntax.walk(t,(function(e,t,n){if(e===l){var r=new a;do{if(r.appendData(t.data),t.data===c)break;t=t.next;}while(null!==t);o.push({parent:n,nodes:r});}}));}Array.isArray(s.match)&&s.match.forEach(n);}(n.matched),o}},pn=Object.prototype.hasOwnProperty;function dn(e){return "number"==typeof e&&isFinite(e)&&Math.floor(e)===e&&e>=0}function mn(e){return Boolean(e)&&dn(e.offset)&&dn(e.line)&&dn(e.column)}function gn(e,t){return function(n,r){if(!n||n.constructor!==Object)return r(n,"Type of node should be an Object");for(var i in n){var o=!0;if(!1!==pn.call(n,i)){if("type"===i)n.type!==e&&r(n,"Wrong node type `"+n.type+"`, expected `"+e+"`");else if("loc"===i){if(null===n.loc)continue;if(n.loc&&n.loc.constructor===Object)if("string"!=typeof n.loc.source)i+=".source";else if(mn(n.loc.start)){if(mn(n.loc.end))continue;i+=".end";}else i+=".start";o=!1;}else if(t.hasOwnProperty(i)){var s=0;for(o=!1;!o&&s<t[i].length;s++){var l=t[i][s];switch(l){case String:o="string"==typeof n[i];break;case Boolean:o="boolean"==typeof n[i];break;case null:o=null===n[i];break;default:"string"==typeof l?o=n[i]&&n[i].type===l:Array.isArray(l)&&(o=n[i]instanceof a);}}}else r(n,"Unknown field `"+i+"` for "+e+" node type");o||r(n,"Bad value for `"+e+"."+i+"`");}}for(var i in t)pn.call(t,i)&&!1===pn.call(n,i)&&r(n,"Field `"+e+"."+i+"` is missed");}}function fn(e,t){var n=t.structure,r={type:String,loc:!0},i={type:'"'+e+'"'};for(var a in n)if(!1!==pn.call(n,a)){for(var o=[],s=r[a]=Array.isArray(n[a])?n[a].slice():[n[a]],l=0;l<s.length;l++){var c=s[l];if(c===String||c===Boolean)o.push(c.name);else if(null===c)o.push("null");else if("string"==typeof c)o.push("<"+c+">");else {if(!Array.isArray(c))throw new Error("Wrong value `"+c+"` in `"+e+"."+a+"` structure definition");o.push("List");}}i[a]=o.join(" | ");}return {docs:i,check:gn(e,r)}}var bn=$,yn=J,kn=Qt,vn=sn,xn=function(e){var t={};if(e.node)for(var n in e.node)if(pn.call(e.node,n)){var r=e.node[n];if(!r.structure)throw new Error("Missed `structure` field in `"+n+"` node type definition");t[n]=fn(n,r);}return t},wn=kn("inherit | initial | unset"),Sn=kn("inherit | initial | unset | <-ms-legacy-expression>");function Cn(e,t,n){var r={};for(var i in e)e[i].syntax&&(r[i]=n?e[i].syntax:G(e[i].syntax,{compact:t}));return r}function zn(e,t,n){const r={};for(const[i,a]of Object.entries(e))r[i]={prelude:a.prelude&&(n?a.prelude.syntax:G(a.prelude.syntax,{compact:t})),descriptors:a.descriptors&&Cn(a.descriptors,t,n)};return r}function An(e,t,n){return {matched:e,iterations:n,error:t,getTrace:un.getTrace,isType:un.isType,isProperty:un.isProperty,isKeyword:un.isKeyword}}function Pn(e,t,n,r){var i,a=function(e,t){return "string"==typeof e?jt(e,null):t.generate(e,Mt)}(n,e.syntax);return function(e){for(var t=0;t<e.length;t++)if("var("===e[t].value.toLowerCase())return !0;return !1}(a)?An(null,new Error("Matching for a tree with var() is not supported")):(r&&(i=vn(a,e.valueCommonSyntax,e)),r&&i.match||(i=vn(a,t.match,e)).match?An(i.match,null,i.iterations):An(null,new yn(i.reason,t.syntax,n,i),i.iterations))}var Tn=function(e,t,n){if(this.valueCommonSyntax=wn,this.syntax=t,this.generic=!1,this.atrules={},this.properties={},this.types={},this.structure=n||xn(e),e){if(e.types)for(var r in e.types)this.addType_(r,e.types[r]);if(e.generic)for(var r in this.generic=!0,mt)this.addType_(r,mt[r]);if(e.atrules)for(var r in e.atrules)this.addAtrule_(r,e.atrules[r]);if(e.properties)for(var r in e.properties)this.addProperty_(r,e.properties[r]);}};Tn.prototype={structure:{},checkStructure:function(e){function t(e,t){r.push({node:e,message:t});}var n=this.structure,r=[];return this.syntax.walk(e,(function(e){n.hasOwnProperty(e.type)?n[e.type].check(e,t):t(e,"Unknown node type `"+e.type+"`");})),!!r.length&&r},createDescriptor:function(e,t,n,r=null){var i={type:t,name:n},a={type:t,name:n,parent:r,syntax:null,match:null};return "function"==typeof e?a.match=kn(e,i):("string"==typeof e?Object.defineProperty(a,"syntax",{get:function(){return Object.defineProperty(a,"syntax",{value:Ot(e)}),a.syntax}}):a.syntax=e,Object.defineProperty(a,"match",{get:function(){return Object.defineProperty(a,"match",{value:kn(a.syntax,i)}),a.match}})),a},addAtrule_:function(e,t){t&&(this.atrules[e]={type:"Atrule",name:e,prelude:t.prelude?this.createDescriptor(t.prelude,"AtrulePrelude",e):null,descriptors:t.descriptors?Object.keys(t.descriptors).reduce((n,r)=>(n[r]=this.createDescriptor(t.descriptors[r],"AtruleDescriptor",r,e),n),{}):null});},addProperty_:function(e,t){t&&(this.properties[e]=this.createDescriptor(t,"Property",e));},addType_:function(e,t){t&&(this.types[e]=this.createDescriptor(t,"Type",e),t===mt["-ms-legacy-expression"]&&(this.valueCommonSyntax=Sn));},checkAtruleName:function(e){if(!this.getAtrule(e))return new bn("Unknown at-rule","@"+e)},checkAtrulePrelude:function(e,t){let n=this.checkAtruleName(e);if(n)return n;var r=this.getAtrule(e);return !r.prelude&&t?new SyntaxError("At-rule `@"+e+"` should not contain a prelude"):r.prelude&&!t?new SyntaxError("At-rule `@"+e+"` should contain a prelude"):void 0},checkAtruleDescriptorName:function(e,t){let n=this.checkAtruleName(e);if(n)return n;var r=this.getAtrule(e),i=ae.keyword(t);return r.descriptors?r.descriptors[i.name]||r.descriptors[i.basename]?void 0:new bn("Unknown at-rule descriptor",t):new SyntaxError("At-rule `@"+e+"` has no known descriptors")},checkPropertyName:function(e){return ae.property(e).custom?new Error("Lexer matching doesn't applicable for custom properties"):this.getProperty(e)?void 0:new bn("Unknown property",e)},matchAtrulePrelude:function(e,t){var n=this.checkAtrulePrelude(e,t);return n?An(null,n):t?Pn(this,this.getAtrule(e).prelude,t,!0):An(null,null)},matchAtruleDescriptor:function(e,t,n){var r=this.checkAtruleDescriptorName(e,t);if(r)return An(null,r);var i=this.getAtrule(e),a=ae.keyword(t);return Pn(this,i.descriptors[a.name]||i.descriptors[a.basename],n,!0)},matchDeclaration:function(e){return "Declaration"!==e.type?An(null,new Error("Not a Declaration node")):this.matchProperty(e.property,e.value)},matchProperty:function(e,t){var n=this.checkPropertyName(e);return n?An(null,n):Pn(this,this.getProperty(e),t,!0)},matchType:function(e,t){var n=this.getType(e);return n?Pn(this,n,t,!1):An(null,new bn("Unknown type",e))},match:function(e,t){return "string"==typeof e||e&&e.type?("string"!=typeof e&&e.match||(e=this.createDescriptor(e,"Type","anonymous")),Pn(this,e,t,!1)):An(null,new bn("Bad syntax"))},findValueFragments:function(e,t,n,r){return hn.matchFragments(this,t,this.matchProperty(e,t),n,r)},findDeclarationValueFragments:function(e,t,n){return hn.matchFragments(this,e.value,this.matchDeclaration(e),t,n)},findAllFragments:function(e,t,n){var r=[];return this.syntax.walk(e,{visit:"Declaration",enter:function(e){r.push.apply(r,this.findDeclarationValueFragments(e,t,n));}.bind(this)}),r},getAtrule:function(e,t=!0){var n=ae.keyword(e);return (n.vendor&&t?this.atrules[n.name]||this.atrules[n.basename]:this.atrules[n.name])||null},getAtrulePrelude:function(e,t=!0){const n=this.getAtrule(e,t);return n&&n.prelude||null},getAtruleDescriptor:function(e,t){return this.atrules.hasOwnProperty(e)&&this.atrules.declarators&&this.atrules[e].declarators[t]||null},getProperty:function(e,t=!0){var n=ae.property(e);return (n.vendor&&t?this.properties[n.name]||this.properties[n.basename]:this.properties[n.name])||null},getType:function(e){return this.types.hasOwnProperty(e)?this.types[e]:null},validate:function(){function e(r,i,a,o){if(a.hasOwnProperty(i))return a[i];a[i]=!1,null!==o.syntax&&Nt(o.syntax,(function(o){if("Type"===o.type||"Property"===o.type){var s="Type"===o.type?r.types:r.properties,l="Type"===o.type?t:n;s.hasOwnProperty(o.name)&&!e(r,o.name,l,s[o.name])||(a[i]=!0);}}),this);}var t={},n={};for(var r in this.types)e(this,r,t,this.types[r]);for(var r in this.properties)e(this,r,n,this.properties[r]);return t=Object.keys(t).filter((function(e){return t[e]})),n=Object.keys(n).filter((function(e){return n[e]})),t.length||n.length?{types:t,properties:n}:null},dump:function(e,t){return {generic:this.generic,types:Cn(this.types,!t,e),properties:Cn(this.properties,!t,e),atrules:zn(this.atrules,!t,e)}},toString:function(){return JSON.stringify(this.dump())}};var Ln=Tn,En={SyntaxError:gt,parse:Ot,generate:G,walk:Nt},Dn=Ce.isBOM;var On=function(){this.lines=null,this.columns=null,this.linesAndColumnsComputed=!1;};On.prototype={setSource:function(e,t,n,r){this.source=e,this.startOffset=void 0===t?0:t,this.startLine=void 0===n?1:n,this.startColumn=void 0===r?1:r,this.linesAndColumnsComputed=!1;},ensureLinesAndColumnsComputed:function(){this.linesAndColumnsComputed||(!function(e,t){for(var n=t.length,r=se(e.lines,n),i=e.startLine,a=se(e.columns,n),o=e.startColumn,s=t.length>0?Dn(t.charCodeAt(0)):0;s<n;s++){var l=t.charCodeAt(s);r[s]=i,a[s]=o++,10!==l&&13!==l&&12!==l||(13===l&&s+1<n&&10===t.charCodeAt(s+1)&&(r[++s]=i,a[s]=o),i++,o=1);}r[s]=i,a[s]=o,e.lines=r,e.columns=a;}(this,this.source),this.linesAndColumnsComputed=!0);},getLocation:function(e,t){return this.ensureLinesAndColumnsComputed(),{source:t,offset:this.startOffset+e,line:this.lines[e],column:this.columns[e]}},getLocationRange:function(e,t,n){return this.ensureLinesAndColumnsComputed(),{source:n,start:{offset:this.startOffset+e,line:this.lines[e],column:this.columns[e]},end:{offset:this.startOffset+t,line:this.lines[t],column:this.columns[t]}}}};var Bn=On,In=Ce.TYPE,Nn=In.WhiteSpace,Rn=In.Comment,Mn=function(e){var t=this.createList(),n=null,r={recognizer:e,space:null,ignoreWS:!1,ignoreWSAfter:!1};for(this.scanner.skipSC();!this.scanner.eof;){switch(this.scanner.tokenType){case Rn:this.scanner.next();continue;case Nn:r.ignoreWS?this.scanner.next():r.space=this.WhiteSpace();continue}if(void 0===(n=e.getNode.call(this,r)))break;null!==r.space&&(t.push(r.space),r.space=null),t.push(n),r.ignoreWSAfter?(r.ignoreWSAfter=!1,r.ignoreWS=!0):r.ignoreWS=!1;}return t},{findWhiteSpaceStart:jn,cmpStr:_n}=M,Fn=function(){},Wn=h.TYPE,qn=h.NAME,Yn=Wn.WhiteSpace,Un=Wn.Comment,Hn=Wn.Ident,Vn=Wn.Function,Kn=Wn.Url,Gn=Wn.Hash,Qn=Wn.Percentage,Xn=Wn.Number;function Zn(e){return function(){return this[e]()}}var $n=function(e){var t={scanner:new H,locationMap:new Bn,filename:"<unknown>",needPositions:!1,onParseError:Fn,onParseErrorThrow:!1,parseAtrulePrelude:!0,parseRulePrelude:!0,parseValue:!0,parseCustomProperty:!1,readSequence:Mn,createList:function(){return new a},createSingleNodeList:function(e){return (new a).appendData(e)},getFirstListNode:function(e){return e&&e.first()},getLastListNode:function(e){return e.last()},parseWithFallback:function(e,t){var n=this.scanner.tokenIndex;try{return e.call(this)}catch(e){if(this.onParseErrorThrow)throw e;var r=t.call(this,n);return this.onParseErrorThrow=!0,this.onParseError(e,r),this.onParseErrorThrow=!1,r}},lookupNonWSType:function(e){do{var t=this.scanner.lookupType(e++);if(t!==Yn)return t}while(0!==t);return 0},eat:function(e){if(this.scanner.tokenType!==e){var t=this.scanner.tokenStart,n=qn[e]+" is expected";switch(e){case Hn:this.scanner.tokenType===Vn||this.scanner.tokenType===Kn?(t=this.scanner.tokenEnd-1,n="Identifier is expected but function found"):n="Identifier is expected";break;case Gn:this.scanner.isDelim(35)&&(this.scanner.next(),t++,n="Name is expected");break;case Qn:this.scanner.tokenType===Xn&&(t=this.scanner.tokenEnd,n="Percent sign is expected");break;default:this.scanner.source.charCodeAt(this.scanner.tokenStart)===e&&(t+=1);}this.error(n,t);}this.scanner.next();},consume:function(e){var t=this.scanner.getTokenValue();return this.eat(e),t},consumeFunctionName:function(){var e=this.scanner.source.substring(this.scanner.tokenStart,this.scanner.tokenEnd-1);return this.eat(Vn),e},getLocation:function(e,t){return this.needPositions?this.locationMap.getLocationRange(e,t,this.filename):null},getLocationFromList:function(e){if(this.needPositions){var t=this.getFirstListNode(e),n=this.getLastListNode(e);return this.locationMap.getLocationRange(null!==t?t.loc.start.offset-this.locationMap.startOffset:this.scanner.tokenStart,null!==n?n.loc.end.offset-this.locationMap.startOffset:this.scanner.tokenStart,this.filename)}return null},error:function(e,t){var n=void 0!==t&&t<this.scanner.source.length?this.locationMap.getLocation(t):this.scanner.eof?this.locationMap.getLocation(jn(this.scanner.source,this.scanner.source.length-1)):this.locationMap.getLocation(this.scanner.tokenStart);throw new l(e||"Unexpected input",this.scanner.source,n.offset,n.line,n.column)}};for(var n in e=function(e){var t={context:{},scope:{},atrule:{},pseudo:{}};if(e.parseContext)for(var n in e.parseContext)switch(typeof e.parseContext[n]){case"function":t.context[n]=e.parseContext[n];break;case"string":t.context[n]=Zn(e.parseContext[n]);}if(e.scope)for(var n in e.scope)t.scope[n]=e.scope[n];if(e.atrule)for(var n in e.atrule){var r=e.atrule[n];r.parse&&(t.atrule[n]=r.parse);}if(e.pseudo)for(var n in e.pseudo){var i=e.pseudo[n];i.parse&&(t.pseudo[n]=i.parse);}if(e.node)for(var n in e.node)t[n]=e.node[n].parse;return t}(e||{}))t[n]=e[n];return function(e,n){var r,i=(n=n||{}).context||"default",a=n.onComment;if(Ce(e,t.scanner),t.locationMap.setSource(e,n.offset,n.line,n.column),t.filename=n.filename||"<unknown>",t.needPositions=Boolean(n.positions),t.onParseError="function"==typeof n.onParseError?n.onParseError:Fn,t.onParseErrorThrow=!1,t.parseAtrulePrelude=!("parseAtrulePrelude"in n)||Boolean(n.parseAtrulePrelude),t.parseRulePrelude=!("parseRulePrelude"in n)||Boolean(n.parseRulePrelude),t.parseValue=!("parseValue"in n)||Boolean(n.parseValue),t.parseCustomProperty="parseCustomProperty"in n&&Boolean(n.parseCustomProperty),!t.context.hasOwnProperty(i))throw new Error("Unknown context `"+i+"`");return "function"==typeof a&&t.scanner.forEachToken((n,r,i)=>{if(n===Un){const n=t.getLocation(r,i),o=_n(e,i-2,i,"*/")?e.slice(r+2,i-2):e.slice(r+2,i);a(o,n);}}),r=t.context[i].call(t,n),t.scanner.eof||t.error(),r}},Jn="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(""),er=function(e){if(0<=e&&e<Jn.length)return Jn[e];throw new TypeError("Must be between 0 and 63: "+e)};var tr=function(e){var t,n="",r=function(e){return e<0?1+(-e<<1):0+(e<<1)}(e);do{t=31&r,(r>>>=5)>0&&(t|=32),n+=er(t);}while(r>0);return n};var nr=function(e,t){return e(t={exports:{}},t.exports),t.exports}((function(e,t){t.getArg=function(e,t,n){if(t in e)return e[t];if(3===arguments.length)return n;throw new Error('"'+t+'" is a required argument.')};var n=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/,r=/^data:.+\,.+$/;function i(e){var t=e.match(n);return t?{scheme:t[1],auth:t[2],host:t[3],port:t[4],path:t[5]}:null}function a(e){var t="";return e.scheme&&(t+=e.scheme+":"),t+="//",e.auth&&(t+=e.auth+"@"),e.host&&(t+=e.host),e.port&&(t+=":"+e.port),e.path&&(t+=e.path),t}function o(e){var n=e,r=i(e);if(r){if(!r.path)return e;n=r.path;}for(var o,s=t.isAbsolute(n),l=n.split(/\/+/),c=0,u=l.length-1;u>=0;u--)"."===(o=l[u])?l.splice(u,1):".."===o?c++:c>0&&(""===o?(l.splice(u+1,c),c=0):(l.splice(u,2),c--));return ""===(n=l.join("/"))&&(n=s?"/":"."),r?(r.path=n,a(r)):n}function s(e,t){""===e&&(e="."),""===t&&(t=".");var n=i(t),s=i(e);if(s&&(e=s.path||"/"),n&&!n.scheme)return s&&(n.scheme=s.scheme),a(n);if(n||t.match(r))return t;if(s&&!s.host&&!s.path)return s.host=t,a(s);var l="/"===t.charAt(0)?t:o(e.replace(/\/+$/,"")+"/"+t);return s?(s.path=l,a(s)):l}t.urlParse=i,t.urlGenerate=a,t.normalize=o,t.join=s,t.isAbsolute=function(e){return "/"===e.charAt(0)||n.test(e)},t.relative=function(e,t){""===e&&(e="."),e=e.replace(/\/$/,"");for(var n=0;0!==t.indexOf(e+"/");){var r=e.lastIndexOf("/");if(r<0)return t;if((e=e.slice(0,r)).match(/^([^\/]+:\/)?\/*$/))return t;++n;}return Array(n+1).join("../")+t.substr(e.length+1)};var l=!("__proto__"in Object.create(null));function c(e){return e}function u(e){if(!e)return !1;var t=e.length;if(t<9)return !1;if(95!==e.charCodeAt(t-1)||95!==e.charCodeAt(t-2)||111!==e.charCodeAt(t-3)||116!==e.charCodeAt(t-4)||111!==e.charCodeAt(t-5)||114!==e.charCodeAt(t-6)||112!==e.charCodeAt(t-7)||95!==e.charCodeAt(t-8)||95!==e.charCodeAt(t-9))return !1;for(var n=t-10;n>=0;n--)if(36!==e.charCodeAt(n))return !1;return !0}function h(e,t){return e===t?0:null===e?1:null===t?-1:e>t?1:-1}t.toSetString=l?c:function(e){return u(e)?"$"+e:e},t.fromSetString=l?c:function(e){return u(e)?e.slice(1):e},t.compareByOriginalPositions=function(e,t,n){var r=h(e.source,t.source);return 0!==r||0!==(r=e.originalLine-t.originalLine)||0!==(r=e.originalColumn-t.originalColumn)||n||0!==(r=e.generatedColumn-t.generatedColumn)||0!==(r=e.generatedLine-t.generatedLine)?r:h(e.name,t.name)},t.compareByGeneratedPositionsDeflated=function(e,t,n){var r=e.generatedLine-t.generatedLine;return 0!==r||0!==(r=e.generatedColumn-t.generatedColumn)||n||0!==(r=h(e.source,t.source))||0!==(r=e.originalLine-t.originalLine)||0!==(r=e.originalColumn-t.originalColumn)?r:h(e.name,t.name)},t.compareByGeneratedPositionsInflated=function(e,t){var n=e.generatedLine-t.generatedLine;return 0!==n||0!==(n=e.generatedColumn-t.generatedColumn)||0!==(n=h(e.source,t.source))||0!==(n=e.originalLine-t.originalLine)||0!==(n=e.originalColumn-t.originalColumn)?n:h(e.name,t.name)},t.parseSourceMapInput=function(e){return JSON.parse(e.replace(/^\)]}'[^\n]*\n/,""))},t.computeSourceURL=function(e,t,n){if(t=t||"",e&&("/"!==e[e.length-1]&&"/"!==t[0]&&(e+="/"),t=e+t),n){var r=i(n);if(!r)throw new Error("sourceMapURL could not be parsed");if(r.path){var l=r.path.lastIndexOf("/");l>=0&&(r.path=r.path.substring(0,l+1));}t=s(a(r),t);}return o(t)};})),rr=(nr.getArg,nr.urlParse,nr.urlGenerate,nr.normalize,nr.join,nr.isAbsolute,nr.relative,nr.toSetString,nr.fromSetString,nr.compareByOriginalPositions,nr.compareByGeneratedPositionsDeflated,nr.compareByGeneratedPositionsInflated,nr.parseSourceMapInput,nr.computeSourceURL,Object.prototype.hasOwnProperty),ir="undefined"!=typeof Map;function ar(){this._array=[],this._set=ir?new Map:Object.create(null);}ar.fromArray=function(e,t){for(var n=new ar,r=0,i=e.length;r<i;r++)n.add(e[r],t);return n},ar.prototype.size=function(){return ir?this._set.size:Object.getOwnPropertyNames(this._set).length},ar.prototype.add=function(e,t){var n=ir?e:nr.toSetString(e),r=ir?this.has(e):rr.call(this._set,n),i=this._array.length;r&&!t||this._array.push(e),r||(ir?this._set.set(e,i):this._set[n]=i);},ar.prototype.has=function(e){if(ir)return this._set.has(e);var t=nr.toSetString(e);return rr.call(this._set,t)},ar.prototype.indexOf=function(e){if(ir){var t=this._set.get(e);if(t>=0)return t}else {var n=nr.toSetString(e);if(rr.call(this._set,n))return this._set[n]}throw new Error('"'+e+'" is not in the set.')},ar.prototype.at=function(e){if(e>=0&&e<this._array.length)return this._array[e];throw new Error("No element indexed by "+e)},ar.prototype.toArray=function(){return this._array.slice()};var or={ArraySet:ar};function sr(){this._array=[],this._sorted=!0,this._last={generatedLine:-1,generatedColumn:0};}sr.prototype.unsortedForEach=function(e,t){this._array.forEach(e,t);},sr.prototype.add=function(e){var t,n,r,i,a,o;t=this._last,n=e,r=t.generatedLine,i=n.generatedLine,a=t.generatedColumn,o=n.generatedColumn,i>r||i==r&&o>=a||nr.compareByGeneratedPositionsInflated(t,n)<=0?(this._last=e,this._array.push(e)):(this._sorted=!1,this._array.push(e));},sr.prototype.toArray=function(){return this._sorted||(this._array.sort(nr.compareByGeneratedPositionsInflated),this._sorted=!0),this._array};var lr=or.ArraySet,cr={MappingList:sr}.MappingList;function ur(e){e||(e={}),this._file=nr.getArg(e,"file",null),this._sourceRoot=nr.getArg(e,"sourceRoot",null),this._skipValidation=nr.getArg(e,"skipValidation",!1),this._sources=new lr,this._names=new lr,this._mappings=new cr,this._sourcesContents=null;}ur.prototype._version=3,ur.fromSourceMap=function(e){var t=e.sourceRoot,n=new ur({file:e.file,sourceRoot:t});return e.eachMapping((function(e){var r={generated:{line:e.generatedLine,column:e.generatedColumn}};null!=e.source&&(r.source=e.source,null!=t&&(r.source=nr.relative(t,r.source)),r.original={line:e.originalLine,column:e.originalColumn},null!=e.name&&(r.name=e.name)),n.addMapping(r);})),e.sources.forEach((function(r){var i=r;null!==t&&(i=nr.relative(t,r)),n._sources.has(i)||n._sources.add(i);var a=e.sourceContentFor(r);null!=a&&n.setSourceContent(r,a);})),n},ur.prototype.addMapping=function(e){var t=nr.getArg(e,"generated"),n=nr.getArg(e,"original",null),r=nr.getArg(e,"source",null),i=nr.getArg(e,"name",null);this._skipValidation||this._validateMapping(t,n,r,i),null!=r&&(r=String(r),this._sources.has(r)||this._sources.add(r)),null!=i&&(i=String(i),this._names.has(i)||this._names.add(i)),this._mappings.add({generatedLine:t.line,generatedColumn:t.column,originalLine:null!=n&&n.line,originalColumn:null!=n&&n.column,source:r,name:i});},ur.prototype.setSourceContent=function(e,t){var n=e;null!=this._sourceRoot&&(n=nr.relative(this._sourceRoot,n)),null!=t?(this._sourcesContents||(this._sourcesContents=Object.create(null)),this._sourcesContents[nr.toSetString(n)]=t):this._sourcesContents&&(delete this._sourcesContents[nr.toSetString(n)],0===Object.keys(this._sourcesContents).length&&(this._sourcesContents=null));},ur.prototype.applySourceMap=function(e,t,n){var r=t;if(null==t){if(null==e.file)throw new Error('SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map\'s "file" property. Both were omitted.');r=e.file;}var i=this._sourceRoot;null!=i&&(r=nr.relative(i,r));var a=new lr,o=new lr;this._mappings.unsortedForEach((function(t){if(t.source===r&&null!=t.originalLine){var s=e.originalPositionFor({line:t.originalLine,column:t.originalColumn});null!=s.source&&(t.source=s.source,null!=n&&(t.source=nr.join(n,t.source)),null!=i&&(t.source=nr.relative(i,t.source)),t.originalLine=s.line,t.originalColumn=s.column,null!=s.name&&(t.name=s.name));}var l=t.source;null==l||a.has(l)||a.add(l);var c=t.name;null==c||o.has(c)||o.add(c);}),this),this._sources=a,this._names=o,e.sources.forEach((function(t){var r=e.sourceContentFor(t);null!=r&&(null!=n&&(t=nr.join(n,t)),null!=i&&(t=nr.relative(i,t)),this.setSourceContent(t,r));}),this);},ur.prototype._validateMapping=function(e,t,n,r){if(t&&"number"!=typeof t.line&&"number"!=typeof t.column)throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");if((!(e&&"line"in e&&"column"in e&&e.line>0&&e.column>=0)||t||n||r)&&!(e&&"line"in e&&"column"in e&&t&&"line"in t&&"column"in t&&e.line>0&&e.column>=0&&t.line>0&&t.column>=0&&n))throw new Error("Invalid mapping: "+JSON.stringify({generated:e,source:n,original:t,name:r}))},ur.prototype._serializeMappings=function(){for(var e,t,n,r,i=0,a=1,o=0,s=0,l=0,c=0,u="",h=this._mappings.toArray(),p=0,d=h.length;p<d;p++){if(e="",(t=h[p]).generatedLine!==a)for(i=0;t.generatedLine!==a;)e+=";",a++;else if(p>0){if(!nr.compareByGeneratedPositionsInflated(t,h[p-1]))continue;e+=",";}e+=tr(t.generatedColumn-i),i=t.generatedColumn,null!=t.source&&(r=this._sources.indexOf(t.source),e+=tr(r-c),c=r,e+=tr(t.originalLine-1-s),s=t.originalLine-1,e+=tr(t.originalColumn-o),o=t.originalColumn,null!=t.name&&(n=this._names.indexOf(t.name),e+=tr(n-l),l=n)),u+=e;}return u},ur.prototype._generateSourcesContent=function(e,t){return e.map((function(e){if(!this._sourcesContents)return null;null!=t&&(e=nr.relative(t,e));var n=nr.toSetString(e);return Object.prototype.hasOwnProperty.call(this._sourcesContents,n)?this._sourcesContents[n]:null}),this)},ur.prototype.toJSON=function(){var e={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};return null!=this._file&&(e.file=this._file),null!=this._sourceRoot&&(e.sourceRoot=this._sourceRoot),this._sourcesContents&&(e.sourcesContent=this._generateSourcesContent(e.sources,e.sourceRoot)),e},ur.prototype.toString=function(){return JSON.stringify(this.toJSON())};var hr={SourceMapGenerator:ur}.SourceMapGenerator,pr={Atrule:!0,Selector:!0,Declaration:!0},dr=Object.prototype.hasOwnProperty;function mr(e,t){var n=e.children,r=null;"function"!=typeof t?n.forEach(this.node,this):n.forEach((function(e){null!==r&&t.call(this,r),this.node(e),r=e;}),this);}var gr=function(e){function t(e){if(!dr.call(n,e.type))throw new Error("Unknown node type: "+e.type);n[e.type].call(this,e);}var n={};if(e.node)for(var r in e.node)n[r]=e.node[r].generate;return function(e,n){var r="",i={children:mr,node:t,chunk:function(e){r+=e;},result:function(){return r}};return n&&("function"==typeof n.decorator&&(i=n.decorator(i)),n.sourceMap&&(i=function(e){var t=new hr,n=1,r=0,i={line:1,column:0},a={line:0,column:0},o=!1,s={line:1,column:0},l={generated:s},c=e.node;e.node=function(e){if(e.loc&&e.loc.start&&pr.hasOwnProperty(e.type)){var u=e.loc.start.line,h=e.loc.start.column-1;a.line===u&&a.column===h||(a.line=u,a.column=h,i.line=n,i.column=r,o&&(o=!1,i.line===s.line&&i.column===s.column||t.addMapping(l)),o=!0,t.addMapping({source:e.loc.source,original:a,generated:i}));}c.call(this,e),o&&pr.hasOwnProperty(e.type)&&(s.line=n,s.column=r);};var u=e.chunk;e.chunk=function(e){for(var t=0;t<e.length;t++)10===e.charCodeAt(t)?(n++,r=0):r++;u(e);};var h=e.result;return e.result=function(){return o&&t.addMapping(l),{css:h(),map:t}},e}(i))),i.node(e),i.result()}},fr=Object.prototype.hasOwnProperty,br=function(){};function yr(e){return "function"==typeof e?e:br}function kr(e,t){return function(n,r,i){n.type===t&&e.call(this,n,r,i);}}function vr(e,t){var n=t.structure,r=[];for(var i in n)if(!1!==fr.call(n,i)){var a=n[i],o={name:i,type:!1,nullable:!1};Array.isArray(n[i])||(a=[n[i]]);for(var s=0;s<a.length;s++){var l=a[s];null===l?o.nullable=!0:"string"==typeof l?o.type="node":Array.isArray(l)&&(o.type="list");}o.type&&r.push(o);}return r.length?{context:t.walkContext,fields:r}:null}function xr(e,t){var n=e.fields.slice(),r=e.context,i="string"==typeof r;return t&&n.reverse(),function(e,a,o,s){var l;i&&(l=a[r],a[r]=e);for(var c=0;c<n.length;c++){var u=n[c],h=e[u.name];if(!u.nullable||h)if("list"===u.type){if(t?h.reduceRight(s,!1):h.reduce(s,!1))return !0}else if(o(h))return !0}i&&(a[r]=l);}}function wr(e){return {Atrule:{StyleSheet:e.StyleSheet,Atrule:e.Atrule,Rule:e.Rule,Block:e.Block},Rule:{StyleSheet:e.StyleSheet,Atrule:e.Atrule,Rule:e.Rule,Block:e.Block},Declaration:{StyleSheet:e.StyleSheet,Atrule:e.Atrule,Rule:e.Rule,Block:e.Block,DeclarationList:e.DeclarationList}}}var Sr=function(e){var t=function(e){var t={};for(var n in e.node)if(fr.call(e.node,n)){var r=e.node[n];if(!r.structure)throw new Error("Missed `structure` field in `"+n+"` node type definition");t[n]=vr(0,r);}return t}(e),n={},r={},i=Symbol("break-walk"),a=Symbol("skip-node");for(var o in t)fr.call(t,o)&&null!==t[o]&&(n[o]=xr(t[o],!1),r[o]=xr(t[o],!0));var s=wr(n),l=wr(r),c=function(e,o){function c(e,t,n){var r=h.call(m,e,t,n);return r===i||r!==a&&(!(!d.hasOwnProperty(e.type)||!d[e.type](e,m,c,u))||p.call(m,e,t,n)===i)}var u=(e,t,n,r)=>e||c(t,n,r),h=br,p=br,d=n,m={break:i,skip:a,root:e,stylesheet:null,atrule:null,atrulePrelude:null,rule:null,selector:null,block:null,declaration:null,function:null};if("function"==typeof o)h=o;else if(o&&(h=yr(o.enter),p=yr(o.leave),o.reverse&&(d=r),o.visit)){if(s.hasOwnProperty(o.visit))d=o.reverse?l[o.visit]:s[o.visit];else if(!t.hasOwnProperty(o.visit))throw new Error("Bad value `"+o.visit+"` for `visit` option (should be: "+Object.keys(t).join(", ")+")");h=kr(h,o.visit),p=kr(p,o.visit);}if(h===br&&p===br)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");c(e);};return c.break=i,c.skip=a,c.find=function(e,t){var n=null;return c(e,(function(e,r,a){if(t.call(this,e,r,a))return n=e,i})),n},c.findLast=function(e,t){var n=null;return c(e,{reverse:!0,enter:function(e,r,a){if(t.call(this,e,r,a))return n=e,i}}),n},c.findAll=function(e,t){var n=[];return c(e,(function(e,r,i){t.call(this,e,r,i)&&n.push(e);})),n},c},Cr=function e(t){var n={};for(var r in t){var i=t[r];i&&(Array.isArray(i)||i instanceof a?i=i.map(e):i.constructor===Object&&(i=e(i))),n[r]=i;}return n};const zr=Object.prototype.hasOwnProperty,Ar={generic:!0,types:Er,atrules:{prelude:Dr,descriptors:Dr},properties:Er,parseContext:function(e,t){return Object.assign(e,t)},scope:function e(t,n){for(const r in n)zr.call(n,r)&&(Pr(t[r])?e(t[r],Tr(n[r])):t[r]=Tr(n[r]));return t},atrule:["parse"],pseudo:["parse"],node:["name","structure","parse","generate","walkContext"]};function Pr(e){return e&&e.constructor===Object}function Tr(e){return Pr(e)?Object.assign({},e):e}function Lr(e,t){return "string"==typeof t&&/^\s*\|/.test(t)?"string"==typeof e?e+t:t.replace(/^\s*\|\s*/,""):t||null}function Er(e,t){if("string"==typeof t)return Lr(e,t);const n=Object.assign({},e);for(let r in t)zr.call(t,r)&&(n[r]=Lr(zr.call(e,r)?e[r]:void 0,t[r]));return n}function Dr(e,t){const n=Er(e,t);return !Pr(n)||Object.keys(n).length?n:null}var Or=(e,t)=>function e(t,n,r){for(const i in r)if(!1!==zr.call(r,i))if(!0===r[i])i in n&&zr.call(n,i)&&(t[i]=Tr(n[i]));else if(r[i])if("function"==typeof r[i]){const e=r[i];t[i]=e({},t[i]),t[i]=e(t[i]||{},n[i]);}else if(Pr(r[i])){const a={};for(let n in t[i])a[n]=e({},t[i][n],r[i]);for(let t in n[i])a[t]=e(a[t]||{},n[i][t],r[i]);t[i]=a;}else if(Array.isArray(r[i])){const a={},o=r[i].reduce((function(e,t){return e[t]=!0,e}),{});for(const[n,r]of Object.entries(t[i]||{}))a[n]={},r&&e(a[n],r,o);for(const t in n[i])zr.call(n[i],t)&&(a[t]||(a[t]={}),n[i]&&n[i][t]&&e(a[t],n[i][t],o));t[i]=a;}return t}(e,t,Ar);function Br(e){var t=$n(e),n=Sr(e),r=gr(e),i=function(e){return {fromPlainObject:function(t){return e(t,{enter:function(e){e.children&&e.children instanceof a==!1&&(e.children=(new a).fromArray(e.children));}}),t},toPlainObject:function(t){return e(t,{leave:function(e){e.children&&e.children instanceof a&&(e.children=e.children.toArray());}}),t}}}(n),o={List:a,SyntaxError:l,TokenStream:H,Lexer:Ln,vendorPrefix:ae.vendorPrefix,keyword:ae.keyword,property:ae.property,isCustomProperty:ae.isCustomProperty,definitionSyntax:En,lexer:null,createLexer:function(e){return new Ln(e,o,o.lexer.structure)},tokenize:Ce,parse:t,walk:n,generate:r,find:n.find,findLast:n.findLast,findAll:n.findAll,clone:Cr,fromPlainObject:i.fromPlainObject,toPlainObject:i.toPlainObject,createSyntax:function(e){return Br(Or({},e))},fork:function(t){var n=Or({},e);return Br("function"==typeof t?t(n,Object.assign):Or(n,t))}};return o.lexer=new Ln({generic:!0,types:e.types,atrules:e.atrules,properties:e.properties,node:e.node},o),o}var Ir=function(e){return Br(Or({},e))},Nr={generic:!0,types:{"absolute-size":"xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large","alpha-value":"<number>|<percentage>","angle-percentage":"<angle>|<percentage>","angular-color-hint":"<angle-percentage>","angular-color-stop":"<color>&&<color-stop-angle>?","angular-color-stop-list":"[<angular-color-stop> [, <angular-color-hint>]?]# , <angular-color-stop>","animateable-feature":"scroll-position|contents|<custom-ident>",attachment:"scroll|fixed|local","attr()":"attr( <attr-name> <type-or-unit>? [, <attr-fallback>]? )","attr-matcher":"['~'|'|'|'^'|'$'|'*']? '='","attr-modifier":"i|s","attribute-selector":"'[' <wq-name> ']'|'[' <wq-name> <attr-matcher> [<string-token>|<ident-token>] <attr-modifier>? ']'","auto-repeat":"repeat( [auto-fill|auto-fit] , [<line-names>? <fixed-size>]+ <line-names>? )","auto-track-list":"[<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>? <auto-repeat> [<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>?","baseline-position":"[first|last]? baseline","basic-shape":"<inset()>|<circle()>|<ellipse()>|<polygon()>|<path()>","bg-image":"none|<image>","bg-layer":"<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>","bg-position":"[[left|center|right|top|bottom|<length-percentage>]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]|[center|[left|right] <length-percentage>?]&&[center|[top|bottom] <length-percentage>?]]","bg-size":"[<length-percentage>|auto]{1,2}|cover|contain","blur()":"blur( <length> )","blend-mode":"normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity",box:"border-box|padding-box|content-box","brightness()":"brightness( <number-percentage> )","calc()":"calc( <calc-sum> )","calc-sum":"<calc-product> [['+'|'-'] <calc-product>]*","calc-product":"<calc-value> ['*' <calc-value>|'/' <number>]*","calc-value":"<number>|<dimension>|<percentage>|( <calc-sum> )","cf-final-image":"<image>|<color>","cf-mixing-image":"<percentage>?&&<image>","circle()":"circle( [<shape-radius>]? [at <position>]? )","clamp()":"clamp( <calc-sum>#{3} )","class-selector":"'.' <ident-token>","clip-source":"<url>",color:"<rgb()>|<rgba()>|<hsl()>|<hsla()>|<hex-color>|<named-color>|currentcolor|<deprecated-system-color>","color-stop":"<color-stop-length>|<color-stop-angle>","color-stop-angle":"<angle-percentage>{1,2}","color-stop-length":"<length-percentage>{1,2}","color-stop-list":"[<linear-color-stop> [, <linear-color-hint>]?]# , <linear-color-stop>",combinator:"'>'|'+'|'~'|['||']","common-lig-values":"[common-ligatures|no-common-ligatures]","compat-auto":"searchfield|textarea|push-button|slider-horizontal|checkbox|radio|square-button|menulist|listbox|meter|progress-bar|button","composite-style":"clear|copy|source-over|source-in|source-out|source-atop|destination-over|destination-in|destination-out|destination-atop|xor","compositing-operator":"add|subtract|intersect|exclude","compound-selector":"[<type-selector>? <subclass-selector>* [<pseudo-element-selector> <pseudo-class-selector>*]*]!","compound-selector-list":"<compound-selector>#","complex-selector":"<compound-selector> [<combinator>? <compound-selector>]*","complex-selector-list":"<complex-selector>#","conic-gradient()":"conic-gradient( [from <angle>]? [at <position>]? , <angular-color-stop-list> )","contextual-alt-values":"[contextual|no-contextual]","content-distribution":"space-between|space-around|space-evenly|stretch","content-list":"[<string>|contents|<image>|<quote>|<target>|<leader()>|<attr()>|counter( <ident> , <'list-style-type'>? )]+","content-position":"center|start|end|flex-start|flex-end","content-replacement":"<image>","contrast()":"contrast( [<number-percentage>] )","counter()":"counter( <custom-ident> , <counter-style>? )","counter-style":"<counter-style-name>|symbols( )","counter-style-name":"<custom-ident>","counters()":"counters( <custom-ident> , <string> , <counter-style>? )","cross-fade()":"cross-fade( <cf-mixing-image> , <cf-final-image>? )","cubic-bezier-timing-function":"ease|ease-in|ease-out|ease-in-out|cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )","deprecated-system-color":"ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonFace|ButtonHighlight|ButtonShadow|ButtonText|CaptionText|GrayText|Highlight|HighlightText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText","discretionary-lig-values":"[discretionary-ligatures|no-discretionary-ligatures]","display-box":"contents|none","display-inside":"flow|flow-root|table|flex|grid|ruby","display-internal":"table-row-group|table-header-group|table-footer-group|table-row|table-cell|table-column-group|table-column|table-caption|ruby-base|ruby-text|ruby-base-container|ruby-text-container","display-legacy":"inline-block|inline-list-item|inline-table|inline-flex|inline-grid","display-listitem":"<display-outside>?&&[flow|flow-root]?&&list-item","display-outside":"block|inline|run-in","drop-shadow()":"drop-shadow( <length>{2,3} <color>? )","east-asian-variant-values":"[jis78|jis83|jis90|jis04|simplified|traditional]","east-asian-width-values":"[full-width|proportional-width]","element()":"element( <custom-ident> , [first|start|last|first-except]? )|element( <id-selector> )","ellipse()":"ellipse( [<shape-radius>{2}]? [at <position>]? )","ending-shape":"circle|ellipse","env()":"env( <custom-ident> , <declaration-value>? )","explicit-track-list":"[<line-names>? <track-size>]+ <line-names>?","family-name":"<string>|<custom-ident>+","feature-tag-value":"<string> [<integer>|on|off]?","feature-type":"@stylistic|@historical-forms|@styleset|@character-variant|@swash|@ornaments|@annotation","feature-value-block":"<feature-type> '{' <feature-value-declaration-list> '}'","feature-value-block-list":"<feature-value-block>+","feature-value-declaration":"<custom-ident> : <integer>+ ;","feature-value-declaration-list":"<feature-value-declaration>","feature-value-name":"<custom-ident>","fill-rule":"nonzero|evenodd","filter-function":"<blur()>|<brightness()>|<contrast()>|<drop-shadow()>|<grayscale()>|<hue-rotate()>|<invert()>|<opacity()>|<saturate()>|<sepia()>","filter-function-list":"[<filter-function>|<url>]+","final-bg-layer":"<'background-color'>||<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>","fit-content()":"fit-content( [<length>|<percentage>] )","fixed-breadth":"<length-percentage>","fixed-repeat":"repeat( [<positive-integer>] , [<line-names>? <fixed-size>]+ <line-names>? )","fixed-size":"<fixed-breadth>|minmax( <fixed-breadth> , <track-breadth> )|minmax( <inflexible-breadth> , <fixed-breadth> )","font-stretch-absolute":"normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded|<percentage>","font-variant-css21":"[normal|small-caps]","font-weight-absolute":"normal|bold|<number [1,1000]>","frequency-percentage":"<frequency>|<percentage>","general-enclosed":"[<function-token> <any-value> )]|( <ident> <any-value> )","generic-family":"serif|sans-serif|cursive|fantasy|monospace|-apple-system","generic-name":"serif|sans-serif|cursive|fantasy|monospace","geometry-box":"<shape-box>|fill-box|stroke-box|view-box",gradient:"<linear-gradient()>|<repeating-linear-gradient()>|<radial-gradient()>|<repeating-radial-gradient()>|<conic-gradient()>|<-legacy-gradient>","grayscale()":"grayscale( <number-percentage> )","grid-line":"auto|<custom-ident>|[<integer>&&<custom-ident>?]|[span&&[<integer>||<custom-ident>]]","historical-lig-values":"[historical-ligatures|no-historical-ligatures]","hsl()":"hsl( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsl( <hue> , <percentage> , <percentage> , <alpha-value>? )","hsla()":"hsla( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsla( <hue> , <percentage> , <percentage> , <alpha-value>? )",hue:"<number>|<angle>","hue-rotate()":"hue-rotate( <angle> )",image:"<url>|<image()>|<image-set()>|<element()>|<paint()>|<cross-fade()>|<gradient>","image()":"image( <image-tags>? [<image-src>? , <color>?]! )","image-set()":"image-set( <image-set-option># )","image-set-option":"[<image>|<string>] <resolution>","image-src":"<url>|<string>","image-tags":"ltr|rtl","inflexible-breadth":"<length>|<percentage>|min-content|max-content|auto","inset()":"inset( <length-percentage>{1,4} [round <'border-radius'>]? )","invert()":"invert( <number-percentage> )","keyframes-name":"<custom-ident>|<string>","keyframe-block":"<keyframe-selector># { <declaration-list> }","keyframe-block-list":"<keyframe-block>+","keyframe-selector":"from|to|<percentage>","leader()":"leader( <leader-type> )","leader-type":"dotted|solid|space|<string>","length-percentage":"<length>|<percentage>","line-names":"'[' <custom-ident>* ']'","line-name-list":"[<line-names>|<name-repeat>]+","line-style":"none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset","line-width":"<length>|thin|medium|thick","linear-color-hint":"<length-percentage>","linear-color-stop":"<color> <color-stop-length>?","linear-gradient()":"linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )","mask-layer":"<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||<geometry-box>||[<geometry-box>|no-clip]||<compositing-operator>||<masking-mode>","mask-position":"[<length-percentage>|left|center|right] [<length-percentage>|top|center|bottom]?","mask-reference":"none|<image>|<mask-source>","mask-source":"<url>","masking-mode":"alpha|luminance|match-source","matrix()":"matrix( <number>#{6} )","matrix3d()":"matrix3d( <number>#{16} )","max()":"max( <calc-sum># )","media-and":"<media-in-parens> [and <media-in-parens>]+","media-condition":"<media-not>|<media-and>|<media-or>|<media-in-parens>","media-condition-without-or":"<media-not>|<media-and>|<media-in-parens>","media-feature":"( [<mf-plain>|<mf-boolean>|<mf-range>] )","media-in-parens":"( <media-condition> )|<media-feature>|<general-enclosed>","media-not":"not <media-in-parens>","media-or":"<media-in-parens> [or <media-in-parens>]+","media-query":"<media-condition>|[not|only]? <media-type> [and <media-condition-without-or>]?","media-query-list":"<media-query>#","media-type":"<ident>","mf-boolean":"<mf-name>","mf-name":"<ident>","mf-plain":"<mf-name> : <mf-value>","mf-range":"<mf-name> ['<'|'>']? '='? <mf-value>|<mf-value> ['<'|'>']? '='? <mf-name>|<mf-value> '<' '='? <mf-name> '<' '='? <mf-value>|<mf-value> '>' '='? <mf-name> '>' '='? <mf-value>","mf-value":"<number>|<dimension>|<ident>|<ratio>","min()":"min( <calc-sum># )","minmax()":"minmax( [<length>|<percentage>|min-content|max-content|auto] , [<length>|<percentage>|<flex>|min-content|max-content|auto] )","named-color":"transparent|aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|<-non-standard-color>","namespace-prefix":"<ident>","ns-prefix":"[<ident-token>|'*']? '|'","number-percentage":"<number>|<percentage>","numeric-figure-values":"[lining-nums|oldstyle-nums]","numeric-fraction-values":"[diagonal-fractions|stacked-fractions]","numeric-spacing-values":"[proportional-nums|tabular-nums]",nth:"<an-plus-b>|even|odd","opacity()":"opacity( [<number-percentage>] )","overflow-position":"unsafe|safe","outline-radius":"<length>|<percentage>","page-body":"<declaration>? [; <page-body>]?|<page-margin-box> <page-body>","page-margin-box":"<page-margin-box-type> '{' <declaration-list> '}'","page-margin-box-type":"@top-left-corner|@top-left|@top-center|@top-right|@top-right-corner|@bottom-left-corner|@bottom-left|@bottom-center|@bottom-right|@bottom-right-corner|@left-top|@left-middle|@left-bottom|@right-top|@right-middle|@right-bottom","page-selector-list":"[<page-selector>#]?","page-selector":"<pseudo-page>+|<ident> <pseudo-page>*","path()":"path( [<fill-rule> ,]? <string> )","paint()":"paint( <ident> , <declaration-value>? )","perspective()":"perspective( <length> )","polygon()":"polygon( <fill-rule>? , [<length-percentage> <length-percentage>]# )",position:"[[left|center|right]||[top|center|bottom]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]?|[[left|right] <length-percentage>]&&[[top|bottom] <length-percentage>]]","pseudo-class-selector":"':' <ident-token>|':' <function-token> <any-value> ')'","pseudo-element-selector":"':' <pseudo-class-selector>","pseudo-page":": [left|right|first|blank]",quote:"open-quote|close-quote|no-open-quote|no-close-quote","radial-gradient()":"radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )","relative-selector":"<combinator>? <complex-selector>","relative-selector-list":"<relative-selector>#","relative-size":"larger|smaller","repeat-style":"repeat-x|repeat-y|[repeat|space|round|no-repeat]{1,2}","repeating-linear-gradient()":"repeating-linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )","repeating-radial-gradient()":"repeating-radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )","rgb()":"rgb( <percentage>{3} [/ <alpha-value>]? )|rgb( <number>{3} [/ <alpha-value>]? )|rgb( <percentage>#{3} , <alpha-value>? )|rgb( <number>#{3} , <alpha-value>? )","rgba()":"rgba( <percentage>{3} [/ <alpha-value>]? )|rgba( <number>{3} [/ <alpha-value>]? )|rgba( <percentage>#{3} , <alpha-value>? )|rgba( <number>#{3} , <alpha-value>? )","rotate()":"rotate( [<angle>|<zero>] )","rotate3d()":"rotate3d( <number> , <number> , <number> , [<angle>|<zero>] )","rotateX()":"rotateX( [<angle>|<zero>] )","rotateY()":"rotateY( [<angle>|<zero>] )","rotateZ()":"rotateZ( [<angle>|<zero>] )","saturate()":"saturate( <number-percentage> )","scale()":"scale( <number> , <number>? )","scale3d()":"scale3d( <number> , <number> , <number> )","scaleX()":"scaleX( <number> )","scaleY()":"scaleY( <number> )","scaleZ()":"scaleZ( <number> )","self-position":"center|start|end|self-start|self-end|flex-start|flex-end","shape-radius":"<length-percentage>|closest-side|farthest-side","skew()":"skew( [<angle>|<zero>] , [<angle>|<zero>]? )","skewX()":"skewX( [<angle>|<zero>] )","skewY()":"skewY( [<angle>|<zero>] )","sepia()":"sepia( <number-percentage> )",shadow:"inset?&&<length>{2,4}&&<color>?","shadow-t":"[<length>{2,3}&&<color>?]",shape:"rect( <top> , <right> , <bottom> , <left> )|rect( <top> <right> <bottom> <left> )","shape-box":"<box>|margin-box","side-or-corner":"[left|right]||[top|bottom]","single-animation":"<time>||<timing-function>||<time>||<single-animation-iteration-count>||<single-animation-direction>||<single-animation-fill-mode>||<single-animation-play-state>||[none|<keyframes-name>]","single-animation-direction":"normal|reverse|alternate|alternate-reverse","single-animation-fill-mode":"none|forwards|backwards|both","single-animation-iteration-count":"infinite|<number>","single-animation-play-state":"running|paused","single-transition":"[none|<single-transition-property>]||<time>||<timing-function>||<time>","single-transition-property":"all|<custom-ident>",size:"closest-side|farthest-side|closest-corner|farthest-corner|<length>|<length-percentage>{2}","step-position":"jump-start|jump-end|jump-none|jump-both|start|end","step-timing-function":"step-start|step-end|steps( <integer> [, <step-position>]? )","subclass-selector":"<id-selector>|<class-selector>|<attribute-selector>|<pseudo-class-selector>","supports-condition":"not <supports-in-parens>|<supports-in-parens> [and <supports-in-parens>]*|<supports-in-parens> [or <supports-in-parens>]*","supports-in-parens":"( <supports-condition> )|<supports-feature>|<general-enclosed>","supports-feature":"<supports-decl>|<supports-selector-fn>","supports-decl":"( <declaration> )","supports-selector-fn":"selector( <complex-selector> )",symbol:"<string>|<image>|<custom-ident>",target:"<target-counter()>|<target-counters()>|<target-text()>","target-counter()":"target-counter( [<string>|<url>] , <custom-ident> , <counter-style>? )","target-counters()":"target-counters( [<string>|<url>] , <custom-ident> , <string> , <counter-style>? )","target-text()":"target-text( [<string>|<url>] , [content|before|after|first-letter]? )","time-percentage":"<time>|<percentage>","timing-function":"linear|<cubic-bezier-timing-function>|<step-timing-function>","track-breadth":"<length-percentage>|<flex>|min-content|max-content|auto","track-list":"[<line-names>? [<track-size>|<track-repeat>]]+ <line-names>?","track-repeat":"repeat( [<positive-integer>] , [<line-names>? <track-size>]+ <line-names>? )","track-size":"<track-breadth>|minmax( <inflexible-breadth> , <track-breadth> )|fit-content( [<length>|<percentage>] )","transform-function":"<matrix()>|<translate()>|<translateX()>|<translateY()>|<scale()>|<scaleX()>|<scaleY()>|<rotate()>|<skew()>|<skewX()>|<skewY()>|<matrix3d()>|<translate3d()>|<translateZ()>|<scale3d()>|<scaleZ()>|<rotate3d()>|<rotateX()>|<rotateY()>|<rotateZ()>|<perspective()>","transform-list":"<transform-function>+","translate()":"translate( <length-percentage> , <length-percentage>? )","translate3d()":"translate3d( <length-percentage> , <length-percentage> , <length> )","translateX()":"translateX( <length-percentage> )","translateY()":"translateY( <length-percentage> )","translateZ()":"translateZ( <length> )","type-or-unit":"string|color|url|integer|number|length|angle|time|frequency|cap|ch|em|ex|ic|lh|rlh|rem|vb|vi|vw|vh|vmin|vmax|mm|Q|cm|in|pt|pc|px|deg|grad|rad|turn|ms|s|Hz|kHz|%","type-selector":"<wq-name>|<ns-prefix>? '*'","var()":"var( <custom-property-name> , <declaration-value>? )","viewport-length":"auto|<length-percentage>","wq-name":"<ns-prefix>? <ident-token>","-legacy-gradient":"<-webkit-gradient()>|<-legacy-linear-gradient>|<-legacy-repeating-linear-gradient>|<-legacy-radial-gradient>|<-legacy-repeating-radial-gradient>","-legacy-linear-gradient":"-moz-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-repeating-linear-gradient":"-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-linear-gradient-arguments":"[<angle>|<side-or-corner>]? , <color-stop-list>","-legacy-radial-gradient":"-moz-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-repeating-radial-gradient":"-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-radial-gradient-arguments":"[<position> ,]? [[[<-legacy-radial-gradient-shape>||<-legacy-radial-gradient-size>]|[<length>|<percentage>]{2}] ,]? <color-stop-list>","-legacy-radial-gradient-size":"closest-side|closest-corner|farthest-side|farthest-corner|contain|cover","-legacy-radial-gradient-shape":"circle|ellipse","-non-standard-font":"-apple-system-body|-apple-system-headline|-apple-system-subheadline|-apple-system-caption1|-apple-system-caption2|-apple-system-footnote|-apple-system-short-body|-apple-system-short-headline|-apple-system-short-subheadline|-apple-system-short-caption1|-apple-system-short-footnote|-apple-system-tall-body","-non-standard-color":"-moz-ButtonDefault|-moz-ButtonHoverFace|-moz-ButtonHoverText|-moz-CellHighlight|-moz-CellHighlightText|-moz-Combobox|-moz-ComboboxText|-moz-Dialog|-moz-DialogText|-moz-dragtargetzone|-moz-EvenTreeRow|-moz-Field|-moz-FieldText|-moz-html-CellHighlight|-moz-html-CellHighlightText|-moz-mac-accentdarkestshadow|-moz-mac-accentdarkshadow|-moz-mac-accentface|-moz-mac-accentlightesthighlight|-moz-mac-accentlightshadow|-moz-mac-accentregularhighlight|-moz-mac-accentregularshadow|-moz-mac-chrome-active|-moz-mac-chrome-inactive|-moz-mac-focusring|-moz-mac-menuselect|-moz-mac-menushadow|-moz-mac-menutextselect|-moz-MenuHover|-moz-MenuHoverText|-moz-MenuBarText|-moz-MenuBarHoverText|-moz-nativehyperlinktext|-moz-OddTreeRow|-moz-win-communicationstext|-moz-win-mediatext|-moz-activehyperlinktext|-moz-default-background-color|-moz-default-color|-moz-hyperlinktext|-moz-visitedhyperlinktext|-webkit-activelink|-webkit-focus-ring-color|-webkit-link|-webkit-text","-non-standard-image-rendering":"optimize-contrast|-moz-crisp-edges|-o-crisp-edges|-webkit-optimize-contrast","-non-standard-overflow":"-moz-scrollbars-none|-moz-scrollbars-horizontal|-moz-scrollbars-vertical|-moz-hidden-unscrollable","-non-standard-width":"fill-available|min-intrinsic|intrinsic|-moz-available|-moz-fit-content|-moz-min-content|-moz-max-content|-webkit-min-content|-webkit-max-content","-webkit-gradient()":"-webkit-gradient( <-webkit-gradient-type> , <-webkit-gradient-point> [, <-webkit-gradient-point>|, <-webkit-gradient-radius> , <-webkit-gradient-point>] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )","-webkit-gradient-color-stop":"from( <color> )|color-stop( [<number-zero-one>|<percentage>] , <color> )|to( <color> )","-webkit-gradient-point":"[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]","-webkit-gradient-radius":"<length>|<percentage>","-webkit-gradient-type":"linear|radial","-webkit-mask-box-repeat":"repeat|stretch|round","-webkit-mask-clip-style":"border|border-box|padding|padding-box|content|content-box|text","-ms-filter-function-list":"<-ms-filter-function>+","-ms-filter-function":"<-ms-filter-function-progid>|<-ms-filter-function-legacy>","-ms-filter-function-progid":"'progid:' [<ident-token> '.']* [<ident-token>|<function-token> <any-value>? )]","-ms-filter-function-legacy":"<ident-token>|<function-token> <any-value>? )","-ms-filter":"<string>",age:"child|young|old","attr-name":"<wq-name>","attr-fallback":"<any-value>","border-radius":"<length-percentage>{1,2}",bottom:"<length>|auto","generic-voice":"[<age>? <gender> <integer>?]",gender:"male|female|neutral",left:"<length>|auto","mask-image":"<mask-reference>#","name-repeat":"repeat( [<positive-integer>|auto-fill] , <line-names>+ )",paint:"none|<color>|<url> [none|<color>]?|context-fill|context-stroke","page-size":"A5|A4|A3|B5|B4|JIS-B5|JIS-B4|letter|legal|ledger",ratio:"<integer> / <integer>",right:"<length>|auto","svg-length":"<percentage>|<length>|<number>","svg-writing-mode":"lr-tb|rl-tb|tb-rl|lr|rl|tb",top:"<length>|auto","track-group":"'(' [<string>* <track-minmax> <string>*]+ ')' ['[' <positive-integer> ']']?|<track-minmax>","track-list-v0":"[<string>* <track-group> <string>*]+|none","track-minmax":"minmax( <track-breadth> , <track-breadth> )|auto|<track-breadth>|fit-content",x:"<number>",y:"<number>",declaration:"<ident-token> : <declaration-value>? ['!' important]?","declaration-list":"[<declaration>? ';']* <declaration>?",url:"url( <string> <url-modifier>* )|<url-token>","url-modifier":"<ident>|<function-token> <any-value> )","number-zero-one":"<number [0,1]>","number-one-or-greater":"<number [1,∞]>","positive-integer":"<integer [0,∞]>","-non-standard-display":"-ms-inline-flexbox|-ms-grid|-ms-inline-grid|-webkit-flex|-webkit-inline-flex|-webkit-box|-webkit-inline-box|-moz-inline-stack|-moz-box|-moz-inline-box"},properties:{"--*":"<declaration-value>","-ms-accelerator":"false|true","-ms-block-progression":"tb|rl|bt|lr","-ms-content-zoom-chaining":"none|chained","-ms-content-zooming":"none|zoom","-ms-content-zoom-limit":"<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>","-ms-content-zoom-limit-max":"<percentage>","-ms-content-zoom-limit-min":"<percentage>","-ms-content-zoom-snap":"<'-ms-content-zoom-snap-type'>||<'-ms-content-zoom-snap-points'>","-ms-content-zoom-snap-points":"snapInterval( <percentage> , <percentage> )|snapList( <percentage># )","-ms-content-zoom-snap-type":"none|proximity|mandatory","-ms-filter":"<string>","-ms-flow-from":"[none|<custom-ident>]#","-ms-flow-into":"[none|<custom-ident>]#","-ms-grid-columns":"none|<track-list>|<auto-track-list>","-ms-grid-rows":"none|<track-list>|<auto-track-list>","-ms-high-contrast-adjust":"auto|none","-ms-hyphenate-limit-chars":"auto|<integer>{1,3}","-ms-hyphenate-limit-lines":"no-limit|<integer>","-ms-hyphenate-limit-zone":"<percentage>|<length>","-ms-ime-align":"auto|after","-ms-overflow-style":"auto|none|scrollbar|-ms-autohiding-scrollbar","-ms-scrollbar-3dlight-color":"<color>","-ms-scrollbar-arrow-color":"<color>","-ms-scrollbar-base-color":"<color>","-ms-scrollbar-darkshadow-color":"<color>","-ms-scrollbar-face-color":"<color>","-ms-scrollbar-highlight-color":"<color>","-ms-scrollbar-shadow-color":"<color>","-ms-scrollbar-track-color":"<color>","-ms-scroll-chaining":"chained|none","-ms-scroll-limit":"<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>","-ms-scroll-limit-x-max":"auto|<length>","-ms-scroll-limit-x-min":"<length>","-ms-scroll-limit-y-max":"auto|<length>","-ms-scroll-limit-y-min":"<length>","-ms-scroll-rails":"none|railed","-ms-scroll-snap-points-x":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-points-y":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-type":"none|proximity|mandatory","-ms-scroll-snap-x":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>","-ms-scroll-snap-y":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>","-ms-scroll-translation":"none|vertical-to-horizontal","-ms-text-autospace":"none|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space","-ms-touch-select":"grippers|none","-ms-user-select":"none|element|text","-ms-wrap-flow":"auto|both|start|end|maximum|clear","-ms-wrap-margin":"<length>","-ms-wrap-through":"wrap|none","-moz-appearance":"none|button|button-arrow-down|button-arrow-next|button-arrow-previous|button-arrow-up|button-bevel|button-focus|caret|checkbox|checkbox-container|checkbox-label|checkmenuitem|dualbutton|groupbox|listbox|listitem|menuarrow|menubar|menucheckbox|menuimage|menuitem|menuitemtext|menulist|menulist-button|menulist-text|menulist-textfield|menupopup|menuradio|menuseparator|meterbar|meterchunk|progressbar|progressbar-vertical|progresschunk|progresschunk-vertical|radio|radio-container|radio-label|radiomenuitem|range|range-thumb|resizer|resizerpanel|scale-horizontal|scalethumbend|scalethumb-horizontal|scalethumbstart|scalethumbtick|scalethumb-vertical|scale-vertical|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|separator|sheet|spinner|spinner-downbutton|spinner-textfield|spinner-upbutton|splitter|statusbar|statusbarpanel|tab|tabpanel|tabpanels|tab-scroll-arrow-back|tab-scroll-arrow-forward|textfield|textfield-multiline|toolbar|toolbarbutton|toolbarbutton-dropdown|toolbargripper|toolbox|tooltip|treeheader|treeheadercell|treeheadersortarrow|treeitem|treeline|treetwisty|treetwistyopen|treeview|-moz-mac-unified-toolbar|-moz-win-borderless-glass|-moz-win-browsertabbar-toolbox|-moz-win-communicationstext|-moz-win-communications-toolbox|-moz-win-exclude-glass|-moz-win-glass|-moz-win-mediatext|-moz-win-media-toolbox|-moz-window-button-box|-moz-window-button-box-maximized|-moz-window-button-close|-moz-window-button-maximize|-moz-window-button-minimize|-moz-window-button-restore|-moz-window-frame-bottom|-moz-window-frame-left|-moz-window-frame-right|-moz-window-titlebar|-moz-window-titlebar-maximized","-moz-binding":"<url>|none","-moz-border-bottom-colors":"<color>+|none","-moz-border-left-colors":"<color>+|none","-moz-border-right-colors":"<color>+|none","-moz-border-top-colors":"<color>+|none","-moz-context-properties":"none|[fill|fill-opacity|stroke|stroke-opacity]#","-moz-float-edge":"border-box|content-box|margin-box|padding-box","-moz-force-broken-image-icon":"<integer [0,1]>","-moz-image-region":"<shape>|auto","-moz-orient":"inline|block|horizontal|vertical","-moz-outline-radius":"<outline-radius>{1,4} [/ <outline-radius>{1,4}]?","-moz-outline-radius-bottomleft":"<outline-radius>","-moz-outline-radius-bottomright":"<outline-radius>","-moz-outline-radius-topleft":"<outline-radius>","-moz-outline-radius-topright":"<outline-radius>","-moz-stack-sizing":"ignore|stretch-to-fit","-moz-text-blink":"none|blink","-moz-user-focus":"ignore|normal|select-after|select-before|select-menu|select-same|select-all|none","-moz-user-input":"auto|none|enabled|disabled","-moz-user-modify":"read-only|read-write|write-only","-moz-window-dragging":"drag|no-drag","-moz-window-shadow":"default|menu|tooltip|sheet|none","-webkit-appearance":"none|button|button-bevel|caps-lock-indicator|caret|checkbox|default-button|inner-spin-button|listbox|listitem|media-controls-background|media-controls-fullscreen-background|media-current-time-display|media-enter-fullscreen-button|media-exit-fullscreen-button|media-fullscreen-button|media-mute-button|media-overlay-play-button|media-play-button|media-seek-back-button|media-seek-forward-button|media-slider|media-sliderthumb|media-time-remaining-display|media-toggle-closed-captions-button|media-volume-slider|media-volume-slider-container|media-volume-sliderthumb|menulist|menulist-button|menulist-text|menulist-textfield|meter|progress-bar|progress-bar-value|push-button|radio|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbargripper-horizontal|scrollbargripper-vertical|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|searchfield-cancel-button|searchfield-decoration|searchfield-results-button|searchfield-results-decoration|slider-horizontal|slider-vertical|sliderthumb-horizontal|sliderthumb-vertical|square-button|textarea|textfield|-apple-pay-button","-webkit-border-before":"<'border-width'>||<'border-style'>||<'color'>","-webkit-border-before-color":"<'color'>","-webkit-border-before-style":"<'border-style'>","-webkit-border-before-width":"<'border-width'>","-webkit-box-reflect":"[above|below|right|left]? <length>? <image>?","-webkit-line-clamp":"none|<integer>","-webkit-mask":"[<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||[<box>|border|padding|content|text]||[<box>|border|padding|content]]#","-webkit-mask-attachment":"<attachment>#","-webkit-mask-clip":"[<box>|border|padding|content|text]#","-webkit-mask-composite":"<composite-style>#","-webkit-mask-image":"<mask-reference>#","-webkit-mask-origin":"[<box>|border|padding|content]#","-webkit-mask-position":"<position>#","-webkit-mask-position-x":"[<length-percentage>|left|center|right]#","-webkit-mask-position-y":"[<length-percentage>|top|center|bottom]#","-webkit-mask-repeat":"<repeat-style>#","-webkit-mask-repeat-x":"repeat|no-repeat|space|round","-webkit-mask-repeat-y":"repeat|no-repeat|space|round","-webkit-mask-size":"<bg-size>#","-webkit-overflow-scrolling":"auto|touch","-webkit-tap-highlight-color":"<color>","-webkit-text-fill-color":"<color>","-webkit-text-stroke":"<length>||<color>","-webkit-text-stroke-color":"<color>","-webkit-text-stroke-width":"<length>","-webkit-touch-callout":"default|none","-webkit-user-modify":"read-only|read-write|read-write-plaintext-only","align-content":"normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>","align-items":"normal|stretch|<baseline-position>|[<overflow-position>? <self-position>]","align-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? <self-position>","align-tracks":"[normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>]#",all:"initial|inherit|unset|revert",animation:"<single-animation>#","animation-delay":"<time>#","animation-direction":"<single-animation-direction>#","animation-duration":"<time>#","animation-fill-mode":"<single-animation-fill-mode>#","animation-iteration-count":"<single-animation-iteration-count>#","animation-name":"[none|<keyframes-name>]#","animation-play-state":"<single-animation-play-state>#","animation-timing-function":"<timing-function>#",appearance:"none|auto|textfield|menulist-button|<compat-auto>","aspect-ratio":"auto|<ratio>",azimuth:"<angle>|[[left-side|far-left|left|center-left|center|center-right|right|far-right|right-side]||behind]|leftwards|rightwards","backdrop-filter":"none|<filter-function-list>","backface-visibility":"visible|hidden",background:"[<bg-layer> ,]* <final-bg-layer>","background-attachment":"<attachment>#","background-blend-mode":"<blend-mode>#","background-clip":"<box>#","background-color":"<color>","background-image":"<bg-image>#","background-origin":"<box>#","background-position":"<bg-position>#","background-position-x":"[center|[[left|right|x-start|x-end]? <length-percentage>?]!]#","background-position-y":"[center|[[top|bottom|y-start|y-end]? <length-percentage>?]!]#","background-repeat":"<repeat-style>#","background-size":"<bg-size>#","block-overflow":"clip|ellipsis|<string>","block-size":"<'width'>",border:"<line-width>||<line-style>||<color>","border-block":"<'border-top-width'>||<'border-top-style'>||<'color'>","border-block-color":"<'border-top-color'>{1,2}","border-block-style":"<'border-top-style'>","border-block-width":"<'border-top-width'>","border-block-end":"<'border-top-width'>||<'border-top-style'>||<'color'>","border-block-end-color":"<'border-top-color'>","border-block-end-style":"<'border-top-style'>","border-block-end-width":"<'border-top-width'>","border-block-start":"<'border-top-width'>||<'border-top-style'>||<'color'>","border-block-start-color":"<'border-top-color'>","border-block-start-style":"<'border-top-style'>","border-block-start-width":"<'border-top-width'>","border-bottom":"<line-width>||<line-style>||<color>","border-bottom-color":"<'border-top-color'>","border-bottom-left-radius":"<length-percentage>{1,2}","border-bottom-right-radius":"<length-percentage>{1,2}","border-bottom-style":"<line-style>","border-bottom-width":"<line-width>","border-collapse":"collapse|separate","border-color":"<color>{1,4}","border-end-end-radius":"<length-percentage>{1,2}","border-end-start-radius":"<length-percentage>{1,2}","border-image":"<'border-image-source'>||<'border-image-slice'> [/ <'border-image-width'>|/ <'border-image-width'>? / <'border-image-outset'>]?||<'border-image-repeat'>","border-image-outset":"[<length>|<number>]{1,4}","border-image-repeat":"[stretch|repeat|round|space]{1,2}","border-image-slice":"<number-percentage>{1,4}&&fill?","border-image-source":"none|<image>","border-image-width":"[<length-percentage>|<number>|auto]{1,4}","border-inline":"<'border-top-width'>||<'border-top-style'>||<'color'>","border-inline-end":"<'border-top-width'>||<'border-top-style'>||<'color'>","border-inline-color":"<'border-top-color'>{1,2}","border-inline-style":"<'border-top-style'>","border-inline-width":"<'border-top-width'>","border-inline-end-color":"<'border-top-color'>","border-inline-end-style":"<'border-top-style'>","border-inline-end-width":"<'border-top-width'>","border-inline-start":"<'border-top-width'>||<'border-top-style'>||<'color'>","border-inline-start-color":"<'border-top-color'>","border-inline-start-style":"<'border-top-style'>","border-inline-start-width":"<'border-top-width'>","border-left":"<line-width>||<line-style>||<color>","border-left-color":"<color>","border-left-style":"<line-style>","border-left-width":"<line-width>","border-radius":"<length-percentage>{1,4} [/ <length-percentage>{1,4}]?","border-right":"<line-width>||<line-style>||<color>","border-right-color":"<color>","border-right-style":"<line-style>","border-right-width":"<line-width>","border-spacing":"<length> <length>?","border-start-end-radius":"<length-percentage>{1,2}","border-start-start-radius":"<length-percentage>{1,2}","border-style":"<line-style>{1,4}","border-top":"<line-width>||<line-style>||<color>","border-top-color":"<color>","border-top-left-radius":"<length-percentage>{1,2}","border-top-right-radius":"<length-percentage>{1,2}","border-top-style":"<line-style>","border-top-width":"<line-width>","border-width":"<line-width>{1,4}",bottom:"<length>|<percentage>|auto","box-align":"start|center|end|baseline|stretch","box-decoration-break":"slice|clone","box-direction":"normal|reverse|inherit","box-flex":"<number>","box-flex-group":"<integer>","box-lines":"single|multiple","box-ordinal-group":"<integer>","box-orient":"horizontal|vertical|inline-axis|block-axis|inherit","box-pack":"start|center|end|justify","box-shadow":"none|<shadow>#","box-sizing":"content-box|border-box","break-after":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-before":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-inside":"auto|avoid|avoid-page|avoid-column|avoid-region","caption-side":"top|bottom|block-start|block-end|inline-start|inline-end","caret-color":"auto|<color>",clear:"none|left|right|both|inline-start|inline-end",clip:"<shape>|auto","clip-path":"<clip-source>|[<basic-shape>||<geometry-box>]|none",color:"<color>","color-adjust":"economy|exact","column-count":"<integer>|auto","column-fill":"auto|balance|balance-all","column-gap":"normal|<length-percentage>","column-rule":"<'column-rule-width'>||<'column-rule-style'>||<'column-rule-color'>","column-rule-color":"<color>","column-rule-style":"<'border-style'>","column-rule-width":"<'border-width'>","column-span":"none|all","column-width":"<length>|auto",columns:"<'column-width'>||<'column-count'>",contain:"none|strict|content|[size||layout||style||paint]",content:"normal|none|[<content-replacement>|<content-list>] [/ <string>]?","counter-increment":"[<custom-ident> <integer>?]+|none","counter-reset":"[<custom-ident> <integer>?]+|none","counter-set":"[<custom-ident> <integer>?]+|none",cursor:"[[<url> [<x> <y>]? ,]* [auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out|grab|grabbing|hand|-webkit-grab|-webkit-grabbing|-webkit-zoom-in|-webkit-zoom-out|-moz-grab|-moz-grabbing|-moz-zoom-in|-moz-zoom-out]]",direction:"ltr|rtl",display:"[<display-outside>||<display-inside>]|<display-listitem>|<display-internal>|<display-box>|<display-legacy>|<-non-standard-display>","empty-cells":"show|hide",filter:"none|<filter-function-list>|<-ms-filter-function-list>",flex:"none|[<'flex-grow'> <'flex-shrink'>?||<'flex-basis'>]","flex-basis":"content|<'width'>","flex-direction":"row|row-reverse|column|column-reverse","flex-flow":"<'flex-direction'>||<'flex-wrap'>","flex-grow":"<number>","flex-shrink":"<number>","flex-wrap":"nowrap|wrap|wrap-reverse",float:"left|right|none|inline-start|inline-end",font:"[[<'font-style'>||<font-variant-css21>||<'font-weight'>||<'font-stretch'>]? <'font-size'> [/ <'line-height'>]? <'font-family'>]|caption|icon|menu|message-box|small-caption|status-bar","font-family":"[<family-name>|<generic-family>]#","font-feature-settings":"normal|<feature-tag-value>#","font-kerning":"auto|normal|none","font-language-override":"normal|<string>","font-optical-sizing":"auto|none","font-variation-settings":"normal|[<string> <number>]#","font-size":"<absolute-size>|<relative-size>|<length-percentage>","font-size-adjust":"none|<number>","font-smooth":"auto|never|always|<absolute-size>|<length>","font-stretch":"<font-stretch-absolute>","font-style":"normal|italic|oblique <angle>?","font-synthesis":"none|[weight||style]","font-variant":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-alternates":"normal|[stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )]","font-variant-caps":"normal|small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps","font-variant-east-asian":"normal|[<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-ligatures":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>]","font-variant-numeric":"normal|[<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero]","font-variant-position":"normal|sub|super","font-weight":"<font-weight-absolute>|bolder|lighter",gap:"<'row-gap'> <'column-gap'>?",grid:"<'grid-template'>|<'grid-template-rows'> / [auto-flow&&dense?] <'grid-auto-columns'>?|[auto-flow&&dense?] <'grid-auto-rows'>? / <'grid-template-columns'>","grid-area":"<grid-line> [/ <grid-line>]{0,3}","grid-auto-columns":"<track-size>+","grid-auto-flow":"[row|column]||dense","grid-auto-rows":"<track-size>+","grid-column":"<grid-line> [/ <grid-line>]?","grid-column-end":"<grid-line>","grid-column-gap":"<length-percentage>","grid-column-start":"<grid-line>","grid-gap":"<'grid-row-gap'> <'grid-column-gap'>?","grid-row":"<grid-line> [/ <grid-line>]?","grid-row-end":"<grid-line>","grid-row-gap":"<length-percentage>","grid-row-start":"<grid-line>","grid-template":"none|[<'grid-template-rows'> / <'grid-template-columns'>]|[<line-names>? <string> <track-size>? <line-names>?]+ [/ <explicit-track-list>]?","grid-template-areas":"none|<string>+","grid-template-columns":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","grid-template-rows":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","hanging-punctuation":"none|[first||[force-end|allow-end]||last]",height:"auto|<length>|<percentage>|min-content|max-content|fit-content( <length-percentage> )",hyphens:"none|manual|auto","image-orientation":"from-image|<angle>|[<angle>? flip]","image-rendering":"auto|crisp-edges|pixelated|optimizeSpeed|optimizeQuality|<-non-standard-image-rendering>","image-resolution":"[from-image||<resolution>]&&snap?","ime-mode":"auto|normal|active|inactive|disabled","initial-letter":"normal|[<number> <integer>?]","initial-letter-align":"[auto|alphabetic|hanging|ideographic]","inline-size":"<'width'>",inset:"<'top'>{1,4}","inset-block":"<'top'>{1,2}","inset-block-end":"<'top'>","inset-block-start":"<'top'>","inset-inline":"<'top'>{1,2}","inset-inline-end":"<'top'>","inset-inline-start":"<'top'>",isolation:"auto|isolate","justify-content":"normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]","justify-items":"normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]|legacy|legacy&&[left|right|center]","justify-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]","justify-tracks":"[normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]]#",left:"<length>|<percentage>|auto","letter-spacing":"normal|<length-percentage>","line-break":"auto|loose|normal|strict|anywhere","line-clamp":"none|<integer>","line-height":"normal|<number>|<length>|<percentage>","line-height-step":"<length>","list-style":"<'list-style-type'>||<'list-style-position'>||<'list-style-image'>","list-style-image":"<url>|none","list-style-position":"inside|outside","list-style-type":"<counter-style>|<string>|none",margin:"[<length>|<percentage>|auto]{1,4}","margin-block":"<'margin-left'>{1,2}","margin-block-end":"<'margin-left'>","margin-block-start":"<'margin-left'>","margin-bottom":"<length>|<percentage>|auto","margin-inline":"<'margin-left'>{1,2}","margin-inline-end":"<'margin-left'>","margin-inline-start":"<'margin-left'>","margin-left":"<length>|<percentage>|auto","margin-right":"<length>|<percentage>|auto","margin-top":"<length>|<percentage>|auto","margin-trim":"none|in-flow|all",mask:"<mask-layer>#","mask-border":"<'mask-border-source'>||<'mask-border-slice'> [/ <'mask-border-width'>? [/ <'mask-border-outset'>]?]?||<'mask-border-repeat'>||<'mask-border-mode'>","mask-border-mode":"luminance|alpha","mask-border-outset":"[<length>|<number>]{1,4}","mask-border-repeat":"[stretch|repeat|round|space]{1,2}","mask-border-slice":"<number-percentage>{1,4} fill?","mask-border-source":"none|<image>","mask-border-width":"[<length-percentage>|<number>|auto]{1,4}","mask-clip":"[<geometry-box>|no-clip]#","mask-composite":"<compositing-operator>#","mask-image":"<mask-reference>#","mask-mode":"<masking-mode>#","mask-origin":"<geometry-box>#","mask-position":"<position>#","mask-repeat":"<repeat-style>#","mask-size":"<bg-size>#","mask-type":"luminance|alpha","masonry-auto-flow":"[pack|next]||[definite-first|ordered]","math-style":"normal|compact","max-block-size":"<'max-width'>","max-height":"none|<length-percentage>|min-content|max-content|fit-content( <length-percentage> )","max-inline-size":"<'max-width'>","max-lines":"none|<integer>","max-width":"none|<length-percentage>|min-content|max-content|fit-content( <length-percentage> )|<-non-standard-width>","min-block-size":"<'min-width'>","min-height":"auto|<length>|<percentage>|min-content|max-content|fit-content( <length-percentage> )","min-inline-size":"<'min-width'>","min-width":"auto|<length-percentage>|min-content|max-content|fit-content( <length-percentage> )|<-non-standard-width>","mix-blend-mode":"<blend-mode>","object-fit":"fill|contain|cover|none|scale-down","object-position":"<position>",offset:"[<'offset-position'>? [<'offset-path'> [<'offset-distance'>||<'offset-rotate'>]?]?]! [/ <'offset-anchor'>]?","offset-anchor":"auto|<position>","offset-distance":"<length-percentage>","offset-path":"none|ray( [<angle>&&<size>&&contain?] )|<path()>|<url>|[<basic-shape>||<geometry-box>]","offset-position":"auto|<position>","offset-rotate":"[auto|reverse]||<angle>",opacity:"<alpha-value>",order:"<integer>",orphans:"<integer>",outline:"[<'outline-color'>||<'outline-style'>||<'outline-width'>]","outline-color":"<color>|invert","outline-offset":"<length>","outline-style":"auto|<'border-style'>","outline-width":"<line-width>",overflow:"[visible|hidden|clip|scroll|auto]{1,2}|<-non-standard-overflow>","overflow-anchor":"auto|none","overflow-block":"visible|hidden|clip|scroll|auto","overflow-clip-box":"padding-box|content-box","overflow-inline":"visible|hidden|clip|scroll|auto","overflow-wrap":"normal|break-word|anywhere","overflow-x":"visible|hidden|clip|scroll|auto","overflow-y":"visible|hidden|clip|scroll|auto","overscroll-behavior":"[contain|none|auto]{1,2}","overscroll-behavior-block":"contain|none|auto","overscroll-behavior-inline":"contain|none|auto","overscroll-behavior-x":"contain|none|auto","overscroll-behavior-y":"contain|none|auto",padding:"[<length>|<percentage>]{1,4}","padding-block":"<'padding-left'>{1,2}","padding-block-end":"<'padding-left'>","padding-block-start":"<'padding-left'>","padding-bottom":"<length>|<percentage>","padding-inline":"<'padding-left'>{1,2}","padding-inline-end":"<'padding-left'>","padding-inline-start":"<'padding-left'>","padding-left":"<length>|<percentage>","padding-right":"<length>|<percentage>","padding-top":"<length>|<percentage>","page-break-after":"auto|always|avoid|left|right|recto|verso","page-break-before":"auto|always|avoid|left|right|recto|verso","page-break-inside":"auto|avoid","paint-order":"normal|[fill||stroke||markers]",perspective:"none|<length>","perspective-origin":"<position>","place-content":"<'align-content'> <'justify-content'>?","place-items":"<'align-items'> <'justify-items'>?","place-self":"<'align-self'> <'justify-self'>?","pointer-events":"auto|none|visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|inherit",position:"static|relative|absolute|sticky|fixed|-webkit-sticky",quotes:"none|auto|[<string> <string>]+",resize:"none|both|horizontal|vertical|block|inline",right:"<length>|<percentage>|auto",rotate:"none|<angle>|[x|y|z|<number>{3}]&&<angle>","row-gap":"normal|<length-percentage>","ruby-align":"start|center|space-between|space-around","ruby-merge":"separate|collapse|auto","ruby-position":"over|under|inter-character",scale:"none|<number>{1,3}","scrollbar-color":"auto|dark|light|<color>{2}","scrollbar-gutter":"auto|[stable|always]&&both?&&force?","scrollbar-width":"auto|thin|none","scroll-behavior":"auto|smooth","scroll-margin":"<length>{1,4}","scroll-margin-block":"<length>{1,2}","scroll-margin-block-start":"<length>","scroll-margin-block-end":"<length>","scroll-margin-bottom":"<length>","scroll-margin-inline":"<length>{1,2}","scroll-margin-inline-start":"<length>","scroll-margin-inline-end":"<length>","scroll-margin-left":"<length>","scroll-margin-right":"<length>","scroll-margin-top":"<length>","scroll-padding":"[auto|<length-percentage>]{1,4}","scroll-padding-block":"[auto|<length-percentage>]{1,2}","scroll-padding-block-start":"auto|<length-percentage>","scroll-padding-block-end":"auto|<length-percentage>","scroll-padding-bottom":"auto|<length-percentage>","scroll-padding-inline":"[auto|<length-percentage>]{1,2}","scroll-padding-inline-start":"auto|<length-percentage>","scroll-padding-inline-end":"auto|<length-percentage>","scroll-padding-left":"auto|<length-percentage>","scroll-padding-right":"auto|<length-percentage>","scroll-padding-top":"auto|<length-percentage>","scroll-snap-align":"[none|start|end|center]{1,2}","scroll-snap-coordinate":"none|<position>#","scroll-snap-destination":"<position>","scroll-snap-points-x":"none|repeat( <length-percentage> )","scroll-snap-points-y":"none|repeat( <length-percentage> )","scroll-snap-stop":"normal|always","scroll-snap-type":"none|[x|y|block|inline|both] [mandatory|proximity]?","scroll-snap-type-x":"none|mandatory|proximity","scroll-snap-type-y":"none|mandatory|proximity","shape-image-threshold":"<alpha-value>","shape-margin":"<length-percentage>","shape-outside":"none|<shape-box>||<basic-shape>|<image>","tab-size":"<integer>|<length>","table-layout":"auto|fixed","text-align":"start|end|left|right|center|justify|match-parent","text-align-last":"auto|start|end|left|right|center|justify","text-combine-upright":"none|all|[digits <integer>?]","text-decoration":"<'text-decoration-line'>||<'text-decoration-style'>||<'text-decoration-color'>||<'text-decoration-thickness'>","text-decoration-color":"<color>","text-decoration-line":"none|[underline||overline||line-through||blink]|spelling-error|grammar-error","text-decoration-skip":"none|[objects||[spaces|[leading-spaces||trailing-spaces]]||edges||box-decoration]","text-decoration-skip-ink":"auto|all|none","text-decoration-style":"solid|double|dotted|dashed|wavy","text-decoration-thickness":"auto|from-font|<length>|<percentage>","text-emphasis":"<'text-emphasis-style'>||<'text-emphasis-color'>","text-emphasis-color":"<color>","text-emphasis-position":"[over|under]&&[right|left]","text-emphasis-style":"none|[[filled|open]||[dot|circle|double-circle|triangle|sesame]]|<string>","text-indent":"<length-percentage>&&hanging?&&each-line?","text-justify":"auto|inter-character|inter-word|none","text-orientation":"mixed|upright|sideways","text-overflow":"[clip|ellipsis|<string>]{1,2}","text-rendering":"auto|optimizeSpeed|optimizeLegibility|geometricPrecision","text-shadow":"none|<shadow-t>#","text-size-adjust":"none|auto|<percentage>","text-transform":"none|capitalize|uppercase|lowercase|full-width|full-size-kana","text-underline-offset":"auto|<length>|<percentage>","text-underline-position":"auto|from-font|[under||[left|right]]",top:"<length>|<percentage>|auto","touch-action":"auto|none|[[pan-x|pan-left|pan-right]||[pan-y|pan-up|pan-down]||pinch-zoom]|manipulation",transform:"none|<transform-list>","transform-box":"content-box|border-box|fill-box|stroke-box|view-box","transform-origin":"[<length-percentage>|left|center|right|top|bottom]|[[<length-percentage>|left|center|right]&&[<length-percentage>|top|center|bottom]] <length>?","transform-style":"flat|preserve-3d",transition:"<single-transition>#","transition-delay":"<time>#","transition-duration":"<time>#","transition-property":"none|<single-transition-property>#","transition-timing-function":"<timing-function>#",translate:"none|<length-percentage> [<length-percentage> <length>?]?","unicode-bidi":"normal|embed|isolate|bidi-override|isolate-override|plaintext|-moz-isolate|-moz-isolate-override|-moz-plaintext|-webkit-isolate|-webkit-isolate-override|-webkit-plaintext","user-select":"auto|text|none|contain|all","vertical-align":"baseline|sub|super|text-top|text-bottom|middle|top|bottom|<percentage>|<length>",visibility:"visible|hidden|collapse","white-space":"normal|pre|nowrap|pre-wrap|pre-line|break-spaces",widows:"<integer>",width:"auto|<length>|<percentage>|min-content|max-content|fit-content( <length-percentage> )","will-change":"auto|<animateable-feature>#","word-break":"normal|break-all|keep-all|break-word","word-spacing":"normal|<length-percentage>","word-wrap":"normal|break-word","writing-mode":"horizontal-tb|vertical-rl|vertical-lr|sideways-rl|sideways-lr|<svg-writing-mode>","z-index":"auto|<integer>",zoom:"normal|reset|<number>|<percentage>","-moz-background-clip":"padding|border","-moz-border-radius-bottomleft":"<'border-bottom-left-radius'>","-moz-border-radius-bottomright":"<'border-bottom-right-radius'>","-moz-border-radius-topleft":"<'border-top-left-radius'>","-moz-border-radius-topright":"<'border-bottom-right-radius'>","-moz-control-character-visibility":"visible|hidden","-moz-osx-font-smoothing":"auto|grayscale","-moz-user-select":"none|text|all|-moz-none","-ms-flex-align":"start|end|center|baseline|stretch","-ms-flex-item-align":"auto|start|end|center|baseline|stretch","-ms-flex-line-pack":"start|end|center|justify|distribute|stretch","-ms-flex-negative":"<'flex-shrink'>","-ms-flex-pack":"start|end|center|justify|distribute","-ms-flex-order":"<integer>","-ms-flex-positive":"<'flex-grow'>","-ms-flex-preferred-size":"<'flex-basis'>","-ms-interpolation-mode":"nearest-neighbor|bicubic","-ms-grid-column-align":"start|end|center|stretch","-ms-grid-row-align":"start|end|center|stretch","-ms-hyphenate-limit-last":"none|always|column|page|spread","-webkit-background-clip":"[<box>|border|padding|content|text]#","-webkit-column-break-after":"always|auto|avoid","-webkit-column-break-before":"always|auto|avoid","-webkit-column-break-inside":"always|auto|avoid","-webkit-font-smoothing":"auto|none|antialiased|subpixel-antialiased","-webkit-mask-box-image":"[<url>|<gradient>|none] [<length-percentage>{4} <-webkit-mask-box-repeat>{2}]?","-webkit-print-color-adjust":"economy|exact","-webkit-text-security":"none|circle|disc|square","-webkit-user-drag":"none|element|auto","-webkit-user-select":"auto|none|text|all","alignment-baseline":"auto|baseline|before-edge|text-before-edge|middle|central|after-edge|text-after-edge|ideographic|alphabetic|hanging|mathematical","baseline-shift":"baseline|sub|super|<svg-length>",behavior:"<url>+","clip-rule":"nonzero|evenodd",cue:"<'cue-before'> <'cue-after'>?","cue-after":"<url> <decibel>?|none","cue-before":"<url> <decibel>?|none","dominant-baseline":"auto|use-script|no-change|reset-size|ideographic|alphabetic|hanging|mathematical|central|middle|text-after-edge|text-before-edge",fill:"<paint>","fill-opacity":"<number-zero-one>","fill-rule":"nonzero|evenodd","glyph-orientation-horizontal":"<angle>","glyph-orientation-vertical":"<angle>",kerning:"auto|<svg-length>",marker:"none|<url>","marker-end":"none|<url>","marker-mid":"none|<url>","marker-start":"none|<url>",pause:"<'pause-before'> <'pause-after'>?","pause-after":"<time>|none|x-weak|weak|medium|strong|x-strong","pause-before":"<time>|none|x-weak|weak|medium|strong|x-strong",rest:"<'rest-before'> <'rest-after'>?","rest-after":"<time>|none|x-weak|weak|medium|strong|x-strong","rest-before":"<time>|none|x-weak|weak|medium|strong|x-strong","shape-rendering":"auto|optimizeSpeed|crispEdges|geometricPrecision",src:"[<url> [format( <string># )]?|local( <family-name> )]#",speak:"auto|none|normal","speak-as":"normal|spell-out||digits||[literal-punctuation|no-punctuation]",stroke:"<paint>","stroke-dasharray":"none|[<svg-length>+]#","stroke-dashoffset":"<svg-length>","stroke-linecap":"butt|round|square","stroke-linejoin":"miter|round|bevel","stroke-miterlimit":"<number-one-or-greater>","stroke-opacity":"<number-zero-one>","stroke-width":"<svg-length>","text-anchor":"start|middle|end","unicode-range":"<urange>#","voice-balance":"<number>|left|center|right|leftwards|rightwards","voice-duration":"auto|<time>","voice-family":"[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve","voice-pitch":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-range":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-rate":"[normal|x-slow|slow|medium|fast|x-fast]||<percentage>","voice-stress":"normal|strong|moderate|none|reduced","voice-volume":"silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]"},atrules:{charset:{prelude:"<string>",descriptors:null},"counter-style":{prelude:"<counter-style-name>",descriptors:{"additive-symbols":"[<integer>&&<symbol>]#",fallback:"<counter-style-name>",negative:"<symbol> <symbol>?",pad:"<integer>&&<symbol>",prefix:"<symbol>",range:"[[<integer>|infinite]{2}]#|auto","speak-as":"auto|bullets|numbers|words|spell-out|<counter-style-name>",suffix:"<symbol>",symbols:"<symbol>+",system:"cyclic|numeric|alphabetic|symbolic|additive|[fixed <integer>?]|[extends <counter-style-name>]"}},document:{prelude:"[<url>|url-prefix( <string> )|domain( <string> )|media-document( <string> )|regexp( <string> )]#",descriptors:null},"font-face":{prelude:null,descriptors:{"font-display":"[auto|block|swap|fallback|optional]","font-family":"<family-name>","font-feature-settings":"normal|<feature-tag-value>#","font-variation-settings":"normal|[<string> <number>]#","font-stretch":"<font-stretch-absolute>{1,2}","font-style":"normal|italic|oblique <angle>{0,2}","font-weight":"<font-weight-absolute>{1,2}","font-variant":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]",src:"[<url> [format( <string># )]?|local( <family-name> )]#","unicode-range":"<urange>#"}},"font-feature-values":{prelude:"<family-name>#",descriptors:null},import:{prelude:"[<string>|<url>] [<media-query-list>]?",descriptors:null},keyframes:{prelude:"<keyframes-name>",descriptors:null},media:{prelude:"<media-query-list>",descriptors:null},namespace:{prelude:"<namespace-prefix>? [<string>|<url>]",descriptors:null},page:{prelude:"<page-selector-list>",descriptors:{bleed:"auto|<length>",marks:"none|[crop||cross]",size:"<length>{1,2}|auto|[<page-size>||[portrait|landscape]]"}},property:{prelude:"<custom-property-name>",descriptors:{syntax:"<string>",inherits:"true|false","initial-value":"<string>"}},supports:{prelude:"<supports-condition>",descriptors:null},viewport:{prelude:null,descriptors:{height:"<viewport-length>{1,2}","max-height":"<viewport-length>","max-width":"<viewport-length>","max-zoom":"auto|<number>|<percentage>","min-height":"<viewport-length>","min-width":"<viewport-length>","min-zoom":"auto|<number>|<percentage>",orientation:"auto|portrait|landscape","user-zoom":"zoom|fixed","viewport-fit":"auto|contain|cover",width:"<viewport-length>{1,2}",zoom:"auto|<number>|<percentage>"}}}},Rr=Ce.cmpChar,Mr=Ce.isDigit,jr=Ce.TYPE,_r=jr.WhiteSpace,Fr=jr.Comment,Wr=jr.Ident,qr=jr.Number,Yr=jr.Dimension;function Ur(e,t){var n=this.scanner.tokenStart+e,r=this.scanner.source.charCodeAt(n);for(43!==r&&45!==r||(t&&this.error("Number sign is not allowed"),n++);n<this.scanner.tokenEnd;n++)Mr(this.scanner.source.charCodeAt(n))||this.error("Integer is expected",n);}function Hr(e){return Ur.call(this,0,e)}function Vr(e,t){if(!Rr(this.scanner.source,this.scanner.tokenStart+e,t)){var n="";switch(t){case 110:n="N is expected";break;case 45:n="HyphenMinus is expected";}this.error(n,this.scanner.tokenStart+e);}}function Kr(){for(var e=0,t=0,n=this.scanner.tokenType;n===_r||n===Fr;)n=this.scanner.lookupType(++e);if(n!==qr){if(!this.scanner.isDelim(43,e)&&!this.scanner.isDelim(45,e))return null;t=this.scanner.isDelim(43,e)?43:45;do{n=this.scanner.lookupType(++e);}while(n===_r||n===Fr);n!==qr&&(this.scanner.skip(e),Hr.call(this,!0));}return e>0&&this.scanner.skip(e),0===t&&43!==(n=this.scanner.source.charCodeAt(this.scanner.tokenStart))&&45!==n&&this.error("Number sign is expected"),Hr.call(this,0!==t),45===t?"-"+this.consume(qr):this.consume(qr)}var Gr={name:"AnPlusB",structure:{a:[String,null],b:[String,null]},parse:function(){var e=this.scanner.tokenStart,t=null,n=null;if(this.scanner.tokenType===qr)Hr.call(this,!1),n=this.consume(qr);else if(this.scanner.tokenType===Wr&&Rr(this.scanner.source,this.scanner.tokenStart,45))switch(t="-1",Vr.call(this,1,110),this.scanner.getTokenLength()){case 2:this.scanner.next(),n=Kr.call(this);break;case 3:Vr.call(this,2,45),this.scanner.next(),this.scanner.skipSC(),Hr.call(this,!0),n="-"+this.consume(qr);break;default:Vr.call(this,2,45),Ur.call(this,3,!0),this.scanner.next(),n=this.scanner.substrToCursor(e+2);}else if(this.scanner.tokenType===Wr||this.scanner.isDelim(43)&&this.scanner.lookupType(1)===Wr){var r=0;switch(t="1",this.scanner.isDelim(43)&&(r=1,this.scanner.next()),Vr.call(this,0,110),this.scanner.getTokenLength()){case 1:this.scanner.next(),n=Kr.call(this);break;case 2:Vr.call(this,1,45),this.scanner.next(),this.scanner.skipSC(),Hr.call(this,!0),n="-"+this.consume(qr);break;default:Vr.call(this,1,45),Ur.call(this,2,!0),this.scanner.next(),n=this.scanner.substrToCursor(e+r+1);}}else if(this.scanner.tokenType===Yr){for(var i=this.scanner.source.charCodeAt(this.scanner.tokenStart),a=(r=43===i||45===i,this.scanner.tokenStart+r);a<this.scanner.tokenEnd&&Mr(this.scanner.source.charCodeAt(a));a++);a===this.scanner.tokenStart+r&&this.error("Integer is expected",this.scanner.tokenStart+r),Vr.call(this,a-this.scanner.tokenStart,110),t=this.scanner.source.substring(e,a),a+1===this.scanner.tokenEnd?(this.scanner.next(),n=Kr.call(this)):(Vr.call(this,a-this.scanner.tokenStart+1,45),a+2===this.scanner.tokenEnd?(this.scanner.next(),this.scanner.skipSC(),Hr.call(this,!0),n="-"+this.consume(qr)):(Ur.call(this,a-this.scanner.tokenStart+2,!0),this.scanner.next(),n=this.scanner.substrToCursor(a+1)));}else this.error();return null!==t&&43===t.charCodeAt(0)&&(t=t.substr(1)),null!==n&&43===n.charCodeAt(0)&&(n=n.substr(1)),{type:"AnPlusB",loc:this.getLocation(e,this.scanner.tokenStart),a:t,b:n}},generate:function(e){var t=null!==e.a&&void 0!==e.a,n=null!==e.b&&void 0!==e.b;t?(this.chunk("+1"===e.a?"+n":"1"===e.a?"n":"-1"===e.a?"-n":e.a+"n"),n&&("-"===(n=String(e.b)).charAt(0)||"+"===n.charAt(0)?(this.chunk(n.charAt(0)),this.chunk(n.substr(1))):(this.chunk("+"),this.chunk(n)))):this.chunk(String(e.b));}},Qr=Ce.TYPE,Xr=Qr.WhiteSpace,Zr=Qr.Semicolon,$r=Qr.LeftCurlyBracket,Jr=Qr.Delim;function ei(){return this.scanner.tokenIndex>0&&this.scanner.lookupType(-1)===Xr?this.scanner.tokenIndex>1?this.scanner.getTokenStart(this.scanner.tokenIndex-1):this.scanner.firstCharOffset:this.scanner.tokenStart}function ti(){return 0}var ni={name:"Raw",structure:{value:String},parse:function(e,t,n){var r,i=this.scanner.getTokenStart(e);return this.scanner.skip(this.scanner.getRawLength(e,t||ti)),r=n&&this.scanner.tokenStart>i?ei.call(this):this.scanner.tokenStart,{type:"Raw",loc:this.getLocation(i,r),value:this.scanner.source.substring(i,r)}},generate:function(e){this.chunk(e.value);},mode:{default:ti,leftCurlyBracket:function(e){return e===$r?1:0},leftCurlyBracketOrSemicolon:function(e){return e===$r||e===Zr?1:0},exclamationMarkOrSemicolon:function(e,t,n){return e===Jr&&33===t.charCodeAt(n)||e===Zr?1:0},semicolonIncluded:function(e){return e===Zr?2:0}}},ri=Ce.TYPE,ii=ni.mode,ai=ri.AtKeyword,oi=ri.Semicolon,si=ri.LeftCurlyBracket,li=ri.RightCurlyBracket;function ci(e){return this.Raw(e,ii.leftCurlyBracketOrSemicolon,!0)}function ui(){for(var e,t=1;e=this.scanner.lookupType(t);t++){if(e===li)return !0;if(e===si||e===ai)return !1}return !1}var hi={name:"Atrule",structure:{name:String,prelude:["AtrulePrelude","Raw",null],block:["Block",null]},parse:function(){var e,t,n=this.scanner.tokenStart,r=null,i=null;switch(this.eat(ai),t=(e=this.scanner.substrToCursor(n+1)).toLowerCase(),this.scanner.skipSC(),!1===this.scanner.eof&&this.scanner.tokenType!==si&&this.scanner.tokenType!==oi&&(this.parseAtrulePrelude?"AtrulePrelude"===(r=this.parseWithFallback(this.AtrulePrelude.bind(this,e),ci)).type&&null===r.children.head&&(r=null):r=ci.call(this,this.scanner.tokenIndex),this.scanner.skipSC()),this.scanner.tokenType){case oi:this.scanner.next();break;case si:i=this.atrule.hasOwnProperty(t)&&"function"==typeof this.atrule[t].block?this.atrule[t].block.call(this):this.Block(ui.call(this));}return {type:"Atrule",loc:this.getLocation(n,this.scanner.tokenStart),name:e,prelude:r,block:i}},generate:function(e){this.chunk("@"),this.chunk(e.name),null!==e.prelude&&(this.chunk(" "),this.node(e.prelude)),e.block?this.node(e.block):this.chunk(";");},walkContext:"atrule"},pi=Ce.TYPE,di=pi.Semicolon,mi=pi.LeftCurlyBracket,gi={name:"AtrulePrelude",structure:{children:[[]]},parse:function(e){var t=null;return null!==e&&(e=e.toLowerCase()),this.scanner.skipSC(),t=this.atrule.hasOwnProperty(e)&&"function"==typeof this.atrule[e].prelude?this.atrule[e].prelude.call(this):this.readSequence(this.scope.AtrulePrelude),this.scanner.skipSC(),!0!==this.scanner.eof&&this.scanner.tokenType!==mi&&this.scanner.tokenType!==di&&this.error("Semicolon or block is expected"),null===t&&(t=this.createList()),{type:"AtrulePrelude",loc:this.getLocationFromList(t),children:t}},generate:function(e){this.children(e);},walkContext:"atrulePrelude"},fi=Ce.TYPE,bi=fi.Ident,yi=fi.String,ki=fi.Colon,vi=fi.LeftSquareBracket,xi=fi.RightSquareBracket;function wi(){this.scanner.eof&&this.error("Unexpected end of input");var e=this.scanner.tokenStart,t=!1,n=!0;return this.scanner.isDelim(42)?(t=!0,n=!1,this.scanner.next()):this.scanner.isDelim(124)||this.eat(bi),this.scanner.isDelim(124)?61!==this.scanner.source.charCodeAt(this.scanner.tokenStart+1)?(this.scanner.next(),this.eat(bi)):t&&this.error("Identifier is expected",this.scanner.tokenEnd):t&&this.error("Vertical line is expected"),n&&this.scanner.tokenType===ki&&(this.scanner.next(),this.eat(bi)),{type:"Identifier",loc:this.getLocation(e,this.scanner.tokenStart),name:this.scanner.substrToCursor(e)}}function Si(){var e=this.scanner.tokenStart,t=this.scanner.source.charCodeAt(e);return 61!==t&&126!==t&&94!==t&&36!==t&&42!==t&&124!==t&&this.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected"),this.scanner.next(),61!==t&&(this.scanner.isDelim(61)||this.error("Equal sign is expected"),this.scanner.next()),this.scanner.substrToCursor(e)}var Ci={name:"AttributeSelector",structure:{name:"Identifier",matcher:[String,null],value:["String","Identifier",null],flags:[String,null]},parse:function(){var e,t=this.scanner.tokenStart,n=null,r=null,i=null;return this.eat(vi),this.scanner.skipSC(),e=wi.call(this),this.scanner.skipSC(),this.scanner.tokenType!==xi&&(this.scanner.tokenType!==bi&&(n=Si.call(this),this.scanner.skipSC(),r=this.scanner.tokenType===yi?this.String():this.Identifier(),this.scanner.skipSC()),this.scanner.tokenType===bi&&(i=this.scanner.getTokenValue(),this.scanner.next(),this.scanner.skipSC())),this.eat(xi),{type:"AttributeSelector",loc:this.getLocation(t,this.scanner.tokenStart),name:e,matcher:n,value:r,flags:i}},generate:function(e){var t=" ";this.chunk("["),this.node(e.name),null!==e.matcher&&(this.chunk(e.matcher),null!==e.value&&(this.node(e.value),"String"===e.value.type&&(t=""))),null!==e.flags&&(this.chunk(t),this.chunk(e.flags)),this.chunk("]");}},zi=Ce.TYPE,Ai=ni.mode,Pi=zi.WhiteSpace,Ti=zi.Comment,Li=zi.Semicolon,Ei=zi.AtKeyword,Di=zi.LeftCurlyBracket,Oi=zi.RightCurlyBracket;function Bi(e){return this.Raw(e,null,!0)}function Ii(){return this.parseWithFallback(this.Rule,Bi)}function Ni(e){return this.Raw(e,Ai.semicolonIncluded,!0)}function Ri(){if(this.scanner.tokenType===Li)return Ni.call(this,this.scanner.tokenIndex);var e=this.parseWithFallback(this.Declaration,Ni);return this.scanner.tokenType===Li&&this.scanner.next(),e}var Mi={name:"Block",structure:{children:[["Atrule","Rule","Declaration"]]},parse:function(e){var t=e?Ri:Ii,n=this.scanner.tokenStart,r=this.createList();this.eat(Di);e:for(;!this.scanner.eof;)switch(this.scanner.tokenType){case Oi:break e;case Pi:case Ti:this.scanner.next();break;case Ei:r.push(this.parseWithFallback(this.Atrule,Bi));break;default:r.push(t.call(this));}return this.scanner.eof||this.eat(Oi),{type:"Block",loc:this.getLocation(n,this.scanner.tokenStart),children:r}},generate:function(e){this.chunk("{"),this.children(e,(function(e){"Declaration"===e.type&&this.chunk(";");})),this.chunk("}");},walkContext:"block"},ji=Ce.TYPE,_i=ji.LeftSquareBracket,Fi=ji.RightSquareBracket,Wi={name:"Brackets",structure:{children:[[]]},parse:function(e,t){var n,r=this.scanner.tokenStart;return this.eat(_i),n=e.call(this,t),this.scanner.eof||this.eat(Fi),{type:"Brackets",loc:this.getLocation(r,this.scanner.tokenStart),children:n}},generate:function(e){this.chunk("["),this.children(e),this.chunk("]");}},qi=Ce.TYPE.CDC,Yi={name:"CDC",structure:[],parse:function(){var e=this.scanner.tokenStart;return this.eat(qi),{type:"CDC",loc:this.getLocation(e,this.scanner.tokenStart)}},generate:function(){this.chunk("--\x3e");}},Ui=Ce.TYPE.CDO,Hi={name:"CDO",structure:[],parse:function(){var e=this.scanner.tokenStart;return this.eat(Ui),{type:"CDO",loc:this.getLocation(e,this.scanner.tokenStart)}},generate:function(){this.chunk("\x3c!--");}},Vi=Ce.TYPE.Ident,Ki={name:"ClassSelector",structure:{name:String},parse:function(){return this.scanner.isDelim(46)||this.error("Full stop is expected"),this.scanner.next(),{type:"ClassSelector",loc:this.getLocation(this.scanner.tokenStart-1,this.scanner.tokenEnd),name:this.consume(Vi)}},generate:function(e){this.chunk("."),this.chunk(e.name);}},Gi=Ce.TYPE.Ident,Qi={name:"Combinator",structure:{name:String},parse:function(){var e=this.scanner.tokenStart;switch(this.scanner.source.charCodeAt(this.scanner.tokenStart)){case 62:case 43:case 126:this.scanner.next();break;case 47:this.scanner.next(),this.scanner.tokenType===Gi&&!1!==this.scanner.lookupValue(0,"deep")||this.error("Identifier `deep` is expected"),this.scanner.next(),this.scanner.isDelim(47)||this.error("Solidus is expected"),this.scanner.next();break;default:this.error("Combinator is expected");}return {type:"Combinator",loc:this.getLocation(e,this.scanner.tokenStart),name:this.scanner.substrToCursor(e)}},generate:function(e){this.chunk(e.name);}},Xi=Ce.TYPE.Comment,Zi={name:"Comment",structure:{value:String},parse:function(){var e=this.scanner.tokenStart,t=this.scanner.tokenEnd;return this.eat(Xi),t-e+2>=2&&42===this.scanner.source.charCodeAt(t-2)&&47===this.scanner.source.charCodeAt(t-1)&&(t-=2),{type:"Comment",loc:this.getLocation(e,this.scanner.tokenStart),value:this.scanner.source.substring(e+2,t)}},generate:function(e){this.chunk("/*"),this.chunk(e.value),this.chunk("*/");}},$i=ae.isCustomProperty,Ji=Ce.TYPE,ea=ni.mode,ta=Ji.Ident,na=Ji.Hash,ra=Ji.Colon,ia=Ji.Semicolon,aa=Ji.Delim,oa=Ji.WhiteSpace;function sa(e){return this.Raw(e,ea.exclamationMarkOrSemicolon,!0)}function la(e){return this.Raw(e,ea.exclamationMarkOrSemicolon,!1)}function ca(){var e=this.scanner.tokenIndex,t=this.Value();return "Raw"!==t.type&&!1===this.scanner.eof&&this.scanner.tokenType!==ia&&!1===this.scanner.isDelim(33)&&!1===this.scanner.isBalanceEdge(e)&&this.error(),t}var ua={name:"Declaration",structure:{important:[Boolean,String],property:String,value:["Value","Raw"]},parse:function(){var e,t=this.scanner.tokenStart,n=this.scanner.tokenIndex,r=ha.call(this),i=$i(r),a=i?this.parseCustomProperty:this.parseValue,o=i?la:sa,s=!1;this.scanner.skipSC(),this.eat(ra);const l=this.scanner.tokenIndex;if(i||this.scanner.skipSC(),e=a?this.parseWithFallback(ca,o):o.call(this,this.scanner.tokenIndex),i&&"Value"===e.type&&e.children.isEmpty())for(let t=l-this.scanner.tokenIndex;t<=0;t++)if(this.scanner.lookupType(t)===oa){e.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}return this.scanner.isDelim(33)&&(s=pa.call(this),this.scanner.skipSC()),!1===this.scanner.eof&&this.scanner.tokenType!==ia&&!1===this.scanner.isBalanceEdge(n)&&this.error(),{type:"Declaration",loc:this.getLocation(t,this.scanner.tokenStart),important:s,property:r,value:e}},generate:function(e){this.chunk(e.property),this.chunk(":"),this.node(e.value),e.important&&this.chunk(!0===e.important?"!important":"!"+e.important);},walkContext:"declaration"};function ha(){var e=this.scanner.tokenStart;if(this.scanner.tokenType===aa)switch(this.scanner.source.charCodeAt(this.scanner.tokenStart)){case 42:case 36:case 43:case 35:case 38:this.scanner.next();break;case 47:this.scanner.next(),this.scanner.isDelim(47)&&this.scanner.next();}return this.scanner.tokenType===na?this.eat(na):this.eat(ta),this.scanner.substrToCursor(e)}function pa(){this.eat(aa),this.scanner.skipSC();var e=this.consume(ta);return "important"===e||e}var da=Ce.TYPE,ma=ni.mode,ga=da.WhiteSpace,fa=da.Comment,ba=da.Semicolon;function ya(e){return this.Raw(e,ma.semicolonIncluded,!0)}var ka={name:"DeclarationList",structure:{children:[["Declaration"]]},parse:function(){for(var e=this.createList();!this.scanner.eof;)switch(this.scanner.tokenType){case ga:case fa:case ba:this.scanner.next();break;default:e.push(this.parseWithFallback(this.Declaration,ya));}return {type:"DeclarationList",loc:this.getLocationFromList(e),children:e}},generate:function(e){this.children(e,(function(e){"Declaration"===e.type&&this.chunk(";");}));}},va=M.consumeNumber,xa=Ce.TYPE.Dimension,wa={name:"Dimension",structure:{value:String,unit:String},parse:function(){var e=this.scanner.tokenStart,t=va(this.scanner.source,e);return this.eat(xa),{type:"Dimension",loc:this.getLocation(e,this.scanner.tokenStart),value:this.scanner.source.substring(e,t),unit:this.scanner.source.substring(t,this.scanner.tokenStart)}},generate:function(e){this.chunk(e.value),this.chunk(e.unit);}},Sa=Ce.TYPE.RightParenthesis,Ca={name:"Function",structure:{name:String,children:[[]]},parse:function(e,t){var n,r=this.scanner.tokenStart,i=this.consumeFunctionName(),a=i.toLowerCase();return n=t.hasOwnProperty(a)?t[a].call(this,t):e.call(this,t),this.scanner.eof||this.eat(Sa),{type:"Function",loc:this.getLocation(r,this.scanner.tokenStart),name:i,children:n}},generate:function(e){this.chunk(e.name),this.chunk("("),this.children(e),this.chunk(")");},walkContext:"function"},za=Ce.TYPE.Hash,Aa={name:"Hash",structure:{value:String},parse:function(){var e=this.scanner.tokenStart;return this.eat(za),{type:"Hash",loc:this.getLocation(e,this.scanner.tokenStart),value:this.scanner.substrToCursor(e+1)}},generate:function(e){this.chunk("#"),this.chunk(e.value);}},Pa=Ce.TYPE.Ident,Ta={name:"Identifier",structure:{name:String},parse:function(){return {type:"Identifier",loc:this.getLocation(this.scanner.tokenStart,this.scanner.tokenEnd),name:this.consume(Pa)}},generate:function(e){this.chunk(e.name);}},La=Ce.TYPE.Hash,Ea={name:"IdSelector",structure:{name:String},parse:function(){var e=this.scanner.tokenStart;return this.eat(La),{type:"IdSelector",loc:this.getLocation(e,this.scanner.tokenStart),name:this.scanner.substrToCursor(e+1)}},generate:function(e){this.chunk("#"),this.chunk(e.name);}},Da=Ce.TYPE,Oa=Da.Ident,Ba=Da.Number,Ia=Da.Dimension,Na=Da.LeftParenthesis,Ra=Da.RightParenthesis,Ma=Da.Colon,ja=Da.Delim,_a={name:"MediaFeature",structure:{name:String,value:["Identifier","Number","Dimension","Ratio",null]},parse:function(){var e,t=this.scanner.tokenStart,n=null;if(this.eat(Na),this.scanner.skipSC(),e=this.consume(Oa),this.scanner.skipSC(),this.scanner.tokenType!==Ra){switch(this.eat(Ma),this.scanner.skipSC(),this.scanner.tokenType){case Ba:n=this.lookupNonWSType(1)===ja?this.Ratio():this.Number();break;case Ia:n=this.Dimension();break;case Oa:n=this.Identifier();break;default:this.error("Number, dimension, ratio or identifier is expected");}this.scanner.skipSC();}return this.eat(Ra),{type:"MediaFeature",loc:this.getLocation(t,this.scanner.tokenStart),name:e,value:n}},generate:function(e){this.chunk("("),this.chunk(e.name),null!==e.value&&(this.chunk(":"),this.node(e.value)),this.chunk(")");}},Fa=Ce.TYPE,Wa=Fa.WhiteSpace,qa=Fa.Comment,Ya=Fa.Ident,Ua=Fa.LeftParenthesis,Ha={name:"MediaQuery",structure:{children:[["Identifier","MediaFeature","WhiteSpace"]]},parse:function(){this.scanner.skipSC();var e=this.createList(),t=null,n=null;e:for(;!this.scanner.eof;){switch(this.scanner.tokenType){case qa:this.scanner.next();continue;case Wa:n=this.WhiteSpace();continue;case Ya:t=this.Identifier();break;case Ua:t=this.MediaFeature();break;default:break e}null!==n&&(e.push(n),n=null),e.push(t);}return null===t&&this.error("Identifier or parenthesis is expected"),{type:"MediaQuery",loc:this.getLocationFromList(e),children:e}},generate:function(e){this.children(e);}},Va=Ce.TYPE.Comma,Ka={name:"MediaQueryList",structure:{children:[["MediaQuery"]]},parse:function(e){var t=this.createList();for(this.scanner.skipSC();!this.scanner.eof&&(t.push(this.MediaQuery(e)),this.scanner.tokenType===Va);)this.scanner.next();return {type:"MediaQueryList",loc:this.getLocationFromList(t),children:t}},generate:function(e){this.children(e,(function(){this.chunk(",");}));}},Ga=Ce.TYPE.Number,Qa={name:"Number",structure:{value:String},parse:function(){return {type:"Number",loc:this.getLocation(this.scanner.tokenStart,this.scanner.tokenEnd),value:this.consume(Ga)}},generate:function(e){this.chunk(e.value);}},Xa={name:"Operator",structure:{value:String},parse:function(){var e=this.scanner.tokenStart;return this.scanner.next(),{type:"Operator",loc:this.getLocation(e,this.scanner.tokenStart),value:this.scanner.substrToCursor(e)}},generate:function(e){this.chunk(e.value);}},Za=Ce.TYPE,$a=Za.LeftParenthesis,Ja=Za.RightParenthesis,eo={name:"Parentheses",structure:{children:[[]]},parse:function(e,t){var n,r=this.scanner.tokenStart;return this.eat($a),n=e.call(this,t),this.scanner.eof||this.eat(Ja),{type:"Parentheses",loc:this.getLocation(r,this.scanner.tokenStart),children:n}},generate:function(e){this.chunk("("),this.children(e),this.chunk(")");}},to=M.consumeNumber,no=Ce.TYPE.Percentage,ro={name:"Percentage",structure:{value:String},parse:function(){var e=this.scanner.tokenStart,t=to(this.scanner.source,e);return this.eat(no),{type:"Percentage",loc:this.getLocation(e,this.scanner.tokenStart),value:this.scanner.source.substring(e,t)}},generate:function(e){this.chunk(e.value),this.chunk("%");}},io=Ce.TYPE,ao=io.Ident,oo=io.Function,so=io.Colon,lo=io.RightParenthesis,co={name:"PseudoClassSelector",structure:{name:String,children:[["Raw"],null]},parse:function(){var e,t,n=this.scanner.tokenStart,r=null;return this.eat(so),this.scanner.tokenType===oo?(t=(e=this.consumeFunctionName()).toLowerCase(),this.pseudo.hasOwnProperty(t)?(this.scanner.skipSC(),r=this.pseudo[t].call(this),this.scanner.skipSC()):(r=this.createList()).push(this.Raw(this.scanner.tokenIndex,null,!1)),this.eat(lo)):e=this.consume(ao),{type:"PseudoClassSelector",loc:this.getLocation(n,this.scanner.tokenStart),name:e,children:r}},generate:function(e){this.chunk(":"),this.chunk(e.name),null!==e.children&&(this.chunk("("),this.children(e),this.chunk(")"));},walkContext:"function"},uo=Ce.TYPE,ho=uo.Ident,po=uo.Function,mo=uo.Colon,go=uo.RightParenthesis,fo={name:"PseudoElementSelector",structure:{name:String,children:[["Raw"],null]},parse:function(){var e,t,n=this.scanner.tokenStart,r=null;return this.eat(mo),this.eat(mo),this.scanner.tokenType===po?(t=(e=this.consumeFunctionName()).toLowerCase(),this.pseudo.hasOwnProperty(t)?(this.scanner.skipSC(),r=this.pseudo[t].call(this),this.scanner.skipSC()):(r=this.createList()).push(this.Raw(this.scanner.tokenIndex,null,!1)),this.eat(go)):e=this.consume(ho),{type:"PseudoElementSelector",loc:this.getLocation(n,this.scanner.tokenStart),name:e,children:r}},generate:function(e){this.chunk("::"),this.chunk(e.name),null!==e.children&&(this.chunk("("),this.children(e),this.chunk(")"));},walkContext:"function"},bo=Ce.isDigit,yo=Ce.TYPE,ko=yo.Number,vo=yo.Delim;function xo(){this.scanner.skipWS();for(var e=this.consume(ko),t=0;t<e.length;t++){var n=e.charCodeAt(t);bo(n)||46===n||this.error("Unsigned number is expected",this.scanner.tokenStart-e.length+t);}return 0===Number(e)&&this.error("Zero number is not allowed",this.scanner.tokenStart-e.length),e}var wo={name:"Ratio",structure:{left:String,right:String},parse:function(){var e,t=this.scanner.tokenStart,n=xo.call(this);return this.scanner.skipWS(),this.scanner.isDelim(47)||this.error("Solidus is expected"),this.eat(vo),e=xo.call(this),{type:"Ratio",loc:this.getLocation(t,this.scanner.tokenStart),left:n,right:e}},generate:function(e){this.chunk(e.left),this.chunk("/"),this.chunk(e.right);}},So=Ce.TYPE,Co=ni.mode,zo=So.LeftCurlyBracket;function Ao(e){return this.Raw(e,Co.leftCurlyBracket,!0)}function Po(){var e=this.SelectorList();return "Raw"!==e.type&&!1===this.scanner.eof&&this.scanner.tokenType!==zo&&this.error(),e}var To={name:"Rule",structure:{prelude:["SelectorList","Raw"],block:["Block"]},parse:function(){var e,t,n=this.scanner.tokenIndex,r=this.scanner.tokenStart;return e=this.parseRulePrelude?this.parseWithFallback(Po,Ao):Ao.call(this,n),t=this.Block(!0),{type:"Rule",loc:this.getLocation(r,this.scanner.tokenStart),prelude:e,block:t}},generate:function(e){this.node(e.prelude),this.node(e.block);},walkContext:"rule"},Lo=Ce.TYPE.Comma,Eo={name:"SelectorList",structure:{children:[["Selector","Raw"]]},parse:function(){for(var e=this.createList();!this.scanner.eof&&(e.push(this.Selector()),this.scanner.tokenType===Lo);)this.scanner.next();return {type:"SelectorList",loc:this.getLocationFromList(e),children:e}},generate:function(e){this.children(e,(function(){this.chunk(",");}));},walkContext:"selector"},Do=Ce.TYPE.String,Oo={name:"String",structure:{value:String},parse:function(){return {type:"String",loc:this.getLocation(this.scanner.tokenStart,this.scanner.tokenEnd),value:this.consume(Do)}},generate:function(e){this.chunk(e.value);}},Bo=Ce.TYPE,Io=Bo.WhiteSpace,No=Bo.Comment,Ro=Bo.AtKeyword,Mo=Bo.CDO,jo=Bo.CDC;function _o(e){return this.Raw(e,null,!1)}var Fo={name:"StyleSheet",structure:{children:[["Comment","CDO","CDC","Atrule","Rule","Raw"]]},parse:function(){for(var e,t=this.scanner.tokenStart,n=this.createList();!this.scanner.eof;){switch(this.scanner.tokenType){case Io:this.scanner.next();continue;case No:if(33!==this.scanner.source.charCodeAt(this.scanner.tokenStart+2)){this.scanner.next();continue}e=this.Comment();break;case Mo:e=this.CDO();break;case jo:e=this.CDC();break;case Ro:e=this.parseWithFallback(this.Atrule,_o);break;default:e=this.parseWithFallback(this.Rule,_o);}n.push(e);}return {type:"StyleSheet",loc:this.getLocation(t,this.scanner.tokenStart),children:n}},generate:function(e){this.children(e);},walkContext:"stylesheet"},Wo=Ce.TYPE.Ident;function qo(){this.scanner.tokenType!==Wo&&!1===this.scanner.isDelim(42)&&this.error("Identifier or asterisk is expected"),this.scanner.next();}var Yo={name:"TypeSelector",structure:{name:String},parse:function(){var e=this.scanner.tokenStart;return this.scanner.isDelim(124)?(this.scanner.next(),qo.call(this)):(qo.call(this),this.scanner.isDelim(124)&&(this.scanner.next(),qo.call(this))),{type:"TypeSelector",loc:this.getLocation(e,this.scanner.tokenStart),name:this.scanner.substrToCursor(e)}},generate:function(e){this.chunk(e.name);}},Uo=Ce.isHexDigit,Ho=Ce.cmpChar,Vo=Ce.TYPE,Ko=Ce.NAME,Go=Vo.Ident,Qo=Vo.Number,Xo=Vo.Dimension;function Zo(e,t){for(var n=this.scanner.tokenStart+e,r=0;n<this.scanner.tokenEnd;n++){var i=this.scanner.source.charCodeAt(n);if(45===i&&t&&0!==r)return 0===Zo.call(this,e+r+1,!1)&&this.error(),-1;Uo(i)||this.error(t&&0!==r?"HyphenMinus"+(r<6?" or hex digit":"")+" is expected":r<6?"Hex digit is expected":"Unexpected input",n),++r>6&&this.error("Too many hex digits",n);}return this.scanner.next(),r}function $o(e){for(var t=0;this.scanner.isDelim(63);)++t>e&&this.error("Too many question marks"),this.scanner.next();}function Jo(e){this.scanner.source.charCodeAt(this.scanner.tokenStart)!==e&&this.error(Ko[e]+" is expected");}function es(){var e=0;return this.scanner.isDelim(43)?(this.scanner.next(),this.scanner.tokenType===Go?void((e=Zo.call(this,0,!0))>0&&$o.call(this,6-e)):this.scanner.isDelim(63)?(this.scanner.next(),void $o.call(this,5)):void this.error("Hex digit or question mark is expected")):this.scanner.tokenType===Qo?(Jo.call(this,43),e=Zo.call(this,1,!0),this.scanner.isDelim(63)?void $o.call(this,6-e):this.scanner.tokenType===Xo||this.scanner.tokenType===Qo?(Jo.call(this,45),void Zo.call(this,1,!1)):void 0):this.scanner.tokenType===Xo?(Jo.call(this,43),void((e=Zo.call(this,1,!0))>0&&$o.call(this,6-e))):void this.error()}var ts={name:"UnicodeRange",structure:{value:String},parse:function(){var e=this.scanner.tokenStart;return Ho(this.scanner.source,e,117)||this.error("U is expected"),Ho(this.scanner.source,e+1,43)||this.error("Plus sign is expected"),this.scanner.next(),es.call(this),{type:"UnicodeRange",loc:this.getLocation(e,this.scanner.tokenStart),value:this.scanner.substrToCursor(e)}},generate:function(e){this.chunk(e.value);}},ns=Ce.isWhiteSpace,rs=Ce.cmpStr,is=Ce.TYPE,as=is.Function,os=is.Url,ss=is.RightParenthesis,ls={name:"Url",structure:{value:["String","Raw"]},parse:function(){var e,t=this.scanner.tokenStart;switch(this.scanner.tokenType){case os:for(var n=t+4,r=this.scanner.tokenEnd-1;n<r&&ns(this.scanner.source.charCodeAt(n));)n++;for(;n<r&&ns(this.scanner.source.charCodeAt(r-1));)r--;e={type:"Raw",loc:this.getLocation(n,r),value:this.scanner.source.substring(n,r)},this.eat(os);break;case as:rs(this.scanner.source,this.scanner.tokenStart,this.scanner.tokenEnd,"url(")||this.error("Function name must be `url`"),this.eat(as),this.scanner.skipSC(),e=this.String(),this.scanner.skipSC(),this.eat(ss);break;default:this.error("Url or Function is expected");}return {type:"Url",loc:this.getLocation(t,this.scanner.tokenStart),value:e}},generate:function(e){this.chunk("url"),this.chunk("("),this.node(e.value),this.chunk(")");}},cs=Ce.TYPE.WhiteSpace,us=Object.freeze({type:"WhiteSpace",loc:null,value:" "}),hs={AnPlusB:Gr,Atrule:hi,AtrulePrelude:gi,AttributeSelector:Ci,Block:Mi,Brackets:Wi,CDC:Yi,CDO:Hi,ClassSelector:Ki,Combinator:Qi,Comment:Zi,Declaration:ua,DeclarationList:ka,Dimension:wa,Function:Ca,Hash:Aa,Identifier:Ta,IdSelector:Ea,MediaFeature:_a,MediaQuery:Ha,MediaQueryList:Ka,Nth:{name:"Nth",structure:{nth:["AnPlusB","Identifier"],selector:["SelectorList",null]},parse:function(e){this.scanner.skipSC();var t,n=this.scanner.tokenStart,r=n,i=null;return t=this.scanner.lookupValue(0,"odd")||this.scanner.lookupValue(0,"even")?this.Identifier():this.AnPlusB(),this.scanner.skipSC(),e&&this.scanner.lookupValue(0,"of")?(this.scanner.next(),i=this.SelectorList(),this.needPositions&&(r=this.getLastListNode(i.children).loc.end.offset)):this.needPositions&&(r=t.loc.end.offset),{type:"Nth",loc:this.getLocation(n,r),nth:t,selector:i}},generate:function(e){this.node(e.nth),null!==e.selector&&(this.chunk(" of "),this.node(e.selector));}},Number:Qa,Operator:Xa,Parentheses:eo,Percentage:ro,PseudoClassSelector:co,PseudoElementSelector:fo,Ratio:wo,Raw:ni,Rule:To,Selector:{name:"Selector",structure:{children:[["TypeSelector","IdSelector","ClassSelector","AttributeSelector","PseudoClassSelector","PseudoElementSelector","Combinator","WhiteSpace"]]},parse:function(){var e=this.readSequence(this.scope.Selector);return null===this.getFirstListNode(e)&&this.error("Selector is expected"),{type:"Selector",loc:this.getLocationFromList(e),children:e}},generate:function(e){this.children(e);}},SelectorList:Eo,String:Oo,StyleSheet:Fo,TypeSelector:Yo,UnicodeRange:ts,Url:ls,Value:{name:"Value",structure:{children:[[]]},parse:function(){var e=this.scanner.tokenStart,t=this.readSequence(this.scope.Value);return {type:"Value",loc:this.getLocation(e,this.scanner.tokenStart),children:t}},generate:function(e){this.children(e);}},WhiteSpace:{name:"WhiteSpace",structure:{value:String},parse:function(){return this.eat(cs),us},generate:function(e){this.chunk(e.value);}}},ps={generic:!0,types:Nr.types,atrules:Nr.atrules,properties:Nr.properties,node:hs},ds=Ce.cmpChar,ms=Ce.cmpStr,gs=Ce.TYPE,fs=gs.Ident,bs=gs.String,ys=gs.Number,ks=gs.Function,vs=gs.Url,xs=gs.Hash,ws=gs.Dimension,Ss=gs.Percentage,Cs=gs.LeftParenthesis,zs=gs.LeftSquareBracket,As=gs.Comma,Ps=gs.Delim,Ts=function(e){switch(this.scanner.tokenType){case xs:return this.Hash();case As:return e.space=null,e.ignoreWSAfter=!0,this.Operator();case Cs:return this.Parentheses(this.readSequence,e.recognizer);case zs:return this.Brackets(this.readSequence,e.recognizer);case bs:return this.String();case ws:return this.Dimension();case Ss:return this.Percentage();case ys:return this.Number();case ks:return ms(this.scanner.source,this.scanner.tokenStart,this.scanner.tokenEnd,"url(")?this.Url():this.Function(this.readSequence,e.recognizer);case vs:return this.Url();case fs:return ds(this.scanner.source,this.scanner.tokenStart,117)&&ds(this.scanner.source,this.scanner.tokenStart+1,43)?this.UnicodeRange():this.Identifier();case Ps:var t=this.scanner.source.charCodeAt(this.scanner.tokenStart);if(47===t||42===t||43===t||45===t)return this.Operator();35===t&&this.error("Hex or identifier is expected",this.scanner.tokenStart+1);}},Ls={getNode:Ts},Es=Ce.TYPE,Ds=Es.Delim,Os=Es.Ident,Bs=Es.Dimension,Is=Es.Percentage,Ns=Es.Number,Rs=Es.Hash,Ms=Es.Colon,js=Es.LeftSquareBracket;var _s={getNode:function(e){switch(this.scanner.tokenType){case js:return this.AttributeSelector();case Rs:return this.IdSelector();case Ms:return this.scanner.lookupType(1)===Ms?this.PseudoElementSelector():this.PseudoClassSelector();case Os:return this.TypeSelector();case Ns:case Is:return this.Percentage();case Bs:46===this.scanner.source.charCodeAt(this.scanner.tokenStart)&&this.error("Identifier is expected",this.scanner.tokenStart+1);break;case Ds:switch(this.scanner.source.charCodeAt(this.scanner.tokenStart)){case 43:case 62:case 126:return e.space=null,e.ignoreWSAfter=!0,this.Combinator();case 47:return this.Combinator();case 46:return this.ClassSelector();case 42:case 124:return this.TypeSelector();case 35:return this.IdSelector()}}}},Fs=Ce.TYPE,Ws=ni.mode,qs=Fs.Comma,Ys=Fs.WhiteSpace,Us={AtrulePrelude:Ls,Selector:_s,Value:{getNode:Ts,expression:function(){return this.createSingleNodeList(this.Raw(this.scanner.tokenIndex,null,!1))},var:function(){var e=this.createList();if(this.scanner.skipSC(),e.push(this.Identifier()),this.scanner.skipSC(),this.scanner.tokenType===qs){e.push(this.Operator());const t=this.scanner.tokenIndex,n=this.parseCustomProperty?this.Value(null):this.Raw(this.scanner.tokenIndex,Ws.exclamationMarkOrSemicolon,!1);if("Value"===n.type&&n.children.isEmpty())for(let e=t-this.scanner.tokenIndex;e<=0;e++)if(this.scanner.lookupType(e)===Ys){n.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}e.push(n);}return e}}},Hs=Ce.TYPE,Vs=Hs.String,Ks=Hs.Ident,Gs=Hs.Url,Qs=Hs.Function,Xs=Hs.LeftParenthesis,Zs={parse:{prelude:function(){var e=this.createList();switch(this.scanner.skipSC(),this.scanner.tokenType){case Vs:e.push(this.String());break;case Gs:case Qs:e.push(this.Url());break;default:this.error("String or url() is expected");}return this.lookupNonWSType(0)!==Ks&&this.lookupNonWSType(0)!==Xs||(e.push(this.WhiteSpace()),e.push(this.MediaQueryList())),e},block:null}},$s=Ce.TYPE,Js=$s.WhiteSpace,el=$s.Comment,tl=$s.Ident,nl=$s.Function,rl=$s.Colon,il=$s.LeftParenthesis;function al(){return this.createSingleNodeList(this.Raw(this.scanner.tokenIndex,null,!1))}function ol(){return this.scanner.skipSC(),this.scanner.tokenType===tl&&this.lookupNonWSType(1)===rl?this.createSingleNodeList(this.Declaration()):sl.call(this)}function sl(){var e,t=this.createList(),n=null;this.scanner.skipSC();e:for(;!this.scanner.eof;){switch(this.scanner.tokenType){case Js:n=this.WhiteSpace();continue;case el:this.scanner.next();continue;case nl:e=this.Function(al,this.scope.AtrulePrelude);break;case tl:e=this.Identifier();break;case il:e=this.Parentheses(ol,this.scope.AtrulePrelude);break;default:break e}null!==n&&(t.push(n),n=null),t.push(e);}return t}var ll,cl={parse:function(){return this.createSingleNodeList(this.SelectorList())}},ul={parse:function(){return this.createSingleNodeList(this.Nth(!0))}},hl={parse:function(){return this.createSingleNodeList(this.Nth(!1))}},pl={parseContext:{default:"StyleSheet",stylesheet:"StyleSheet",atrule:"Atrule",atrulePrelude:function(e){return this.AtrulePrelude(e.atrule?String(e.atrule):null)},mediaQueryList:"MediaQueryList",mediaQuery:"MediaQuery",rule:"Rule",selectorList:"SelectorList",selector:"Selector",block:function(){return this.Block(!0)},declarationList:"DeclarationList",declaration:"Declaration",value:"Value"},scope:Us,atrule:{"font-face":{parse:{prelude:null,block:function(){return this.Block(!0)}}},import:Zs,media:{parse:{prelude:function(){return this.createSingleNodeList(this.MediaQueryList())},block:function(){return this.Block(!1)}}},page:{parse:{prelude:function(){return this.createSingleNodeList(this.SelectorList())},block:function(){return this.Block(!0)}}},supports:{parse:{prelude:function(){var e=sl.call(this);return null===this.getFirstListNode(e)&&this.error("Condition is expected"),e},block:function(){return this.Block(!1)}}}},pseudo:{dir:{parse:function(){return this.createSingleNodeList(this.Identifier())}},has:{parse:function(){return this.createSingleNodeList(this.SelectorList())}},lang:{parse:function(){return this.createSingleNodeList(this.Identifier())}},matches:cl,not:cl,"nth-child":ul,"nth-last-child":ul,"nth-last-of-type":hl,"nth-of-type":hl,slotted:{parse:function(){return this.createSingleNodeList(this.Selector())}}},node:hs},dl={node:hs},ml={version:"1.1.2"},gl=(ll=Object.freeze({__proto__:null,version:"1.1.2",default:ml}))&&ll.default||ll;var fl=Ir(function(){for(var e={},t=0;t<arguments.length;t++){var n=arguments[t];for(var r in n)e[r]=n[r];}return e}(ps,pl,dl)),bl=gl.version;return fl.version=bl,fl}));
});

var stable = createCommonjsModule(function (module, exports) {
//! stable.js 0.1.8, https://github.com/Two-Screen/stable
//! © 2018 Angry Bytes and contributors. MIT licensed.

(function (global, factory) {
  module.exports = factory() ;
}(commonjsGlobal, (function () {
  // A stable array sort, because `Array#sort()` is not guaranteed stable.
  // This is an implementation of merge sort, without recursion.

  var stable = function (arr, comp) {
    return exec(arr.slice(), comp)
  };

  stable.inplace = function (arr, comp) {
    var result = exec(arr, comp);

    // This simply copies back if the result isn't in the original array,
    // which happens on an odd number of passes.
    if (result !== arr) {
      pass(result, null, arr.length, arr);
    }

    return arr
  };

  // Execute the sort using the input array and a second buffer as work space.
  // Returns one of those two, containing the final result.
  function exec(arr, comp) {
    if (typeof(comp) !== 'function') {
      comp = function (a, b) {
        return String(a).localeCompare(b)
      };
    }

    // Short-circuit when there's nothing to sort.
    var len = arr.length;
    if (len <= 1) {
      return arr
    }

    // Rather than dividing input, simply iterate chunks of 1, 2, 4, 8, etc.
    // Chunks are the size of the left or right hand in merge sort.
    // Stop when the left-hand covers all of the array.
    var buffer = new Array(len);
    for (var chk = 1; chk < len; chk *= 2) {
      pass(arr, comp, chk, buffer);

      var tmp = arr;
      arr = buffer;
      buffer = tmp;
    }

    return arr
  }

  // Run a single pass with the given chunk size.
  var pass = function (arr, comp, chk, result) {
    var len = arr.length;
    var i = 0;
    // Step size / double chunk size.
    var dbl = chk * 2;
    // Bounds of the left and right chunks.
    var l, r, e;
    // Iterators over the left and right chunk.
    var li, ri;

    // Iterate over pairs of chunks.
    for (l = 0; l < len; l += dbl) {
      r = l + chk;
      e = r + chk;
      if (r > len) r = len;
      if (e > len) e = len;

      // Iterate both chunks in parallel.
      li = l;
      ri = r;
      while (true) {
        // Compare the chunks.
        if (li < r && ri < e) {
          // This works for a regular `sort()` compatible comparator,
          // but also for a simple comparator like: `a > b`
          if (comp(arr[li], arr[ri]) <= 0) {
            result[i++] = arr[li++];
          }
          else {
            result[i++] = arr[ri++];
          }
        }
        // Nothing to compare, just flush what's left.
        else if (li < r) {
          result[i++] = arr[li++];
        }
        else if (ri < e) {
          result[i++] = arr[ri++];
        }
        // Both iterators are at the chunk ends.
        else {
          break
        }
      }
    }
  };

  return stable;

})));
});

var specificity = function specificity(simpleSelector) {
    var A = 0;
    var B = 0;
    var C = 0;

    simpleSelector.children.each(function walk(node) {
        switch (node.type) {
            case 'SelectorList':
            case 'Selector':
                node.children.each(walk);
                break;

            case 'IdSelector':
                A++;
                break;

            case 'ClassSelector':
            case 'AttributeSelector':
                B++;
                break;

            case 'PseudoClassSelector':
                switch (node.name.toLowerCase()) {
                    case 'not':
                        node.children.each(walk);
                        break;

                    case 'before':
                    case 'after':
                    case 'first-line':
                    case 'first-letter':
                        C++;
                        break;

                    // TODO: support for :nth-*(.. of <SelectorList>), :matches(), :has()
                    default:
                        B++;
                }
                break;

            case 'PseudoElementSelector':
                C++;
                break;

            case 'TypeSelector':
                // ignore universal selector
                if (node.name.charAt(node.name.length - 1) !== '*') {
                    C++;
                }
                break;

        }
    });

    return [A, B, C];
};

var List        = csstree_min.List;


/**
 * Flatten a CSS AST to a selectors list.
 *
 * @param {Object} cssAst css-tree AST to flatten
 * @return {Array} selectors
 */
function flattenToSelectors(cssAst) {
    var selectors = [];

    csstree_min.walk(cssAst, {visit: 'Rule', enter: function(node) {
        if (node.type !== 'Rule') {
            return;
        }

        var atrule = this.atrule;
        var rule = node;

        node.prelude.children.each(function(selectorNode, selectorItem) {
            var selector = {
                item: selectorItem,
                atrule: atrule,
                rule: rule,
                pseudos: []
            };

            selectorNode.children.each(function(selectorChildNode, selectorChildItem, selectorChildList) {
                if (selectorChildNode.type === 'PseudoClassSelector' ||
                    selectorChildNode.type === 'PseudoElementSelector') {
                    selector.pseudos.push({
                        item: selectorChildItem,
                        list: selectorChildList
                    });
                }
            });

            selectors.push(selector);
        });
    }});

    return selectors;
}

/**
 * Filter selectors by Media Query.
 *
 * @param {Array} selectors to filter
 * @param {Array} useMqs Array with strings of media queries that should pass (<name> <expression>)
 * @return {Array} Filtered selectors that match the passed media queries
 */
function filterByMqs(selectors, useMqs) {
    return selectors.filter(function(selector) {
        if (selector.atrule === null) {
            return ~useMqs.indexOf('');
        }

        var mqName = selector.atrule.name;
        var mqStr = mqName;
        if (selector.atrule.expression &&
            selector.atrule.expression.children.first().type === 'MediaQueryList') {
            var mqExpr = csstree_min.generate(selector.atrule.expression);
            mqStr = [mqName, mqExpr].join(' ');
        }

        return ~useMqs.indexOf(mqStr);
    });
}

/**
 * Filter selectors by the pseudo-elements and/or -classes they contain.
 *
 * @param {Array} selectors to filter
 * @param {Array} usePseudos Array with strings of single or sequence of pseudo-elements and/or -classes that should pass
 * @return {Array} Filtered selectors that match the passed pseudo-elements and/or -classes
 */
function filterByPseudos(selectors, usePseudos) {
    return selectors.filter(function(selector) {
        var pseudoSelectorsStr = csstree_min.generate({
            type: 'Selector',
            children: new List().fromArray(selector.pseudos.map(function(pseudo) {
                return pseudo.item.data;
            }))
        });
        return ~usePseudos.indexOf(pseudoSelectorsStr);
    });
}

/**
 * Remove pseudo-elements and/or -classes from the selectors for proper matching.
 *
 * @param {Array} selectors to clean
 * @return {Array} Selectors without pseudo-elements and/or -classes
 */
function cleanPseudos(selectors) {
    selectors.forEach(function(selector) {
        selector.pseudos.forEach(function(pseudo) {
            pseudo.list.remove(pseudo.item);
        });
    });
}


/**
 * Compares two selector specificities.
 * extracted from https://github.com/keeganstreet/specificity/blob/master/specificity.js#L211
 *
 * @param {Array} aSpecificity Specificity of selector A
 * @param {Array} bSpecificity Specificity of selector B
 * @return {Number} Score of selector specificity A compared to selector specificity B
 */
function compareSpecificity(aSpecificity, bSpecificity) {
    for (var i = 0; i < 4; i += 1) {
        if (aSpecificity[i] < bSpecificity[i]) {
            return -1;
        } else if (aSpecificity[i] > bSpecificity[i]) {
            return 1;
        }
    }

    return 0;
}


/**
 * Compare two simple selectors.
 *
 * @param {Object} aSimpleSelectorNode Simple selector A
 * @param {Object} bSimpleSelectorNode Simple selector B
 * @return {Number} Score of selector A compared to selector B
 */
function compareSimpleSelectorNode(aSimpleSelectorNode, bSimpleSelectorNode) {
    var aSpecificity = specificity(aSimpleSelectorNode),
        bSpecificity = specificity(bSimpleSelectorNode);
    return compareSpecificity(aSpecificity, bSpecificity);
}

function _bySelectorSpecificity(selectorA, selectorB) {
    return compareSimpleSelectorNode(selectorA.item.data, selectorB.item.data);
}


/**
 * Sort selectors stably by their specificity.
 *
 * @param {Array} selectors to be sorted
 * @return {Array} Stable sorted selectors
 */
function sortSelectors(selectors) {
    return stable(selectors, _bySelectorSpecificity);
}


/**
 * Convert a css-tree AST style declaration to CSSStyleDeclaration property.
 *
 * @param {Object} declaration css-tree style declaration
 * @return {Object} CSSStyleDeclaration property
 */
function csstreeToStyleDeclaration(declaration) {
    var propertyName = declaration.property,
        propertyValue = csstree_min.generate(declaration.value),
        propertyPriority = (declaration.important ? 'important' : '');
    return {
        name: propertyName,
        value: propertyValue,
        priority: propertyPriority
    };
}


/**
 * Gets the CSS string of a style element
 *
 * @param {Object} element style element
 * @return {String|Array} CSS string or empty array if no styles are set
 */
function getCssStr(elem) {
    return elem.content[0].text || elem.content[0].cdata || [];
}

/**
 * Sets the CSS string of a style element
 *
 * @param {Object} element style element
 * @param {String} CSS string to be set
 * @return {Object} reference to field with CSS
 */
function setCssStr(elem, css) {
    // in case of cdata field
    if(elem.content[0].cdata) {
        elem.content[0].cdata = css;
        return elem.content[0].cdata;
    }

    // in case of text field + if nothing was set yet
    elem.content[0].text  = css;
    return elem.content[0].text;
}


var flattenToSelectors_1 = flattenToSelectors;

var filterByMqs_1 = filterByMqs;
var filterByPseudos_1 = filterByPseudos;
var cleanPseudos_1 = cleanPseudos;

var compareSpecificity_1 = compareSpecificity;
var compareSimpleSelectorNode_1 = compareSimpleSelectorNode;

var sortSelectors_1 = sortSelectors;

var csstreeToStyleDeclaration_1 = csstreeToStyleDeclaration;

var getCssStr_1 = getCssStr;
var setCssStr_1 = setCssStr;

var cssTools = {
	flattenToSelectors: flattenToSelectors_1,
	filterByMqs: filterByMqs_1,
	filterByPseudos: filterByPseudos_1,
	cleanPseudos: cleanPseudos_1,
	compareSpecificity: compareSpecificity_1,
	compareSimpleSelectorNode: compareSimpleSelectorNode_1,
	sortSelectors: sortSelectors_1,
	csstreeToStyleDeclaration: csstreeToStyleDeclaration_1,
	getCssStr: getCssStr_1,
	setCssStr: setCssStr_1
};

var type$e = 'full';

var active$e = true;

var params$9 = {
    onlyMatchedOnce: true,
    removeMatchedSelectors: true,
    useMqs: ['', 'screen'],
    usePseudos: ['']
};

var description$e = 'inline styles (additional options)';




/**
 * Moves + merges styles from style elements to element styles
 *
 * Options
 *   onlyMatchedOnce (default: true)
 *     inline only selectors that match once
 *
 *   removeMatchedSelectors (default: true)
 *     clean up matched selectors,
 *     leave selectors that hadn't matched
 *
 *   useMqs (default: ['', 'screen'])
 *     what media queries to be used
 *     empty string element for styles outside media queries
 *
 *   usePseudos (default: [''])
 *     what pseudo-classes/-elements to be used
 *     empty string element for all non-pseudo-classes and/or -elements
 *
 * @param {Object} document document element
 * @param {Object} opts plugin params
 *
 * @author strarsis <strarsis@gmail.com>
 */
var fn$e = function(document, opts) {

    // collect <style/>s
    var styleEls = document.querySelectorAll('style');

    //no <styles/>s, nothing to do
    if (styleEls === null) {
        return document;
    }

    var styles = [],
        selectors = [];

    for (var styleEl of styleEls) {
        if (styleEl.isEmpty() || styleEl.closestElem('foreignObject')) {
            // skip empty <style/>s or <foreignObject> content.
            continue;
        }

        var cssStr = cssTools.getCssStr(styleEl);

        // collect <style/>s and their css ast
        var cssAst = {};
        try {
            cssAst = csstree_min.parse(cssStr, {
                parseValue: false,
                parseCustomProperty: false
            });
        } catch (parseError) {
            // console.warn('Warning: Parse error of styles of <style/> element, skipped. Error details: ' + parseError);
            continue;
        }

        styles.push({
            styleEl: styleEl,
            cssAst: cssAst
        });

        selectors = selectors.concat(cssTools.flattenToSelectors(cssAst));
    }


    // filter for mediaqueries to be used or without any mediaquery
    var selectorsMq = cssTools.filterByMqs(selectors, opts.useMqs);


    // filter for pseudo elements to be used
    var selectorsPseudo = cssTools.filterByPseudos(selectorsMq, opts.usePseudos);

    // remove PseudoClass from its SimpleSelector for proper matching
    cssTools.cleanPseudos(selectorsPseudo);


    // stable sort selectors
    var sortedSelectors = cssTools.sortSelectors(selectorsPseudo).reverse();


    var selector,
        selectedEl;

    // match selectors
    for (selector of sortedSelectors) {
        var selectorStr = csstree_min.generate(selector.item.data),
            selectedEls = null;

        try {
            selectedEls = document.querySelectorAll(selectorStr);
        } catch (selectError) {
            // console.warn('Warning: Syntax error when trying to select \n\n' + selectorStr + '\n\n, skipped. Error details: ' + selectError);
            continue;
        }

        if (selectedEls === null) {
            // nothing selected
            continue;
        }

        selector.selectedEls = selectedEls;
    }


    // apply <style/> styles to matched elements
    for (selector of sortedSelectors) {
        if(!selector.selectedEls) {
            continue;
        }

        if (opts.onlyMatchedOnce && selector.selectedEls !== null && selector.selectedEls.length > 1) {
            // skip selectors that match more than once if option onlyMatchedOnce is enabled
            continue;
        }

        // apply <style/> to matched elements
        for (selectedEl of selector.selectedEls) {
            if (selector.rule === null) {
                continue;
            }

            // merge declarations
            csstree_min.walk(selector.rule, {visit: 'Declaration', enter: function(styleCsstreeDeclaration) {

                // existing inline styles have higher priority
                // no inline styles, external styles,                                    external styles used
                // inline styles,    external styles same   priority as inline styles,   inline   styles used
                // inline styles,    external styles higher priority than inline styles, external styles used
                var styleDeclaration = cssTools.csstreeToStyleDeclaration(styleCsstreeDeclaration);
                if (selectedEl.style.getPropertyValue(styleDeclaration.name) !== null &&
                    selectedEl.style.getPropertyPriority(styleDeclaration.name) >= styleDeclaration.priority) {
                    return;
                }
                selectedEl.style.setProperty(styleDeclaration.name, styleDeclaration.value, styleDeclaration.priority);
            }});
        }

        if (opts.removeMatchedSelectors && selector.selectedEls !== null && selector.selectedEls.length > 0) {
            // clean up matching simple selectors if option removeMatchedSelectors is enabled
            selector.rule.prelude.children.remove(selector.item);
        }
    }


    if (!opts.removeMatchedSelectors) {
        return document; // no further processing required
    }


    // clean up matched class + ID attribute values
    for (selector of sortedSelectors) {
        if(!selector.selectedEls) {
            continue;
        }

        if (opts.onlyMatchedOnce && selector.selectedEls !== null && selector.selectedEls.length > 1) {
            // skip selectors that match more than once if option onlyMatchedOnce is enabled
            continue;
        }

        for (selectedEl of selector.selectedEls) {
            // class
            var firstSubSelector = selector.item.data.children.first();
            if(firstSubSelector.type === 'ClassSelector') {
                selectedEl.class.remove(firstSubSelector.name);
            }
            // clean up now empty class attributes
            if(typeof selectedEl.class.item(0) === 'undefined') {
                selectedEl.removeAttr('class');
            }

            // ID
            if(firstSubSelector.type === 'IdSelector') {
                selectedEl.removeAttr('id', firstSubSelector.name);
            }
        }
    }


    // clean up now empty elements
    for (var style of styles) {
        csstree_min.walk(style.cssAst, {visit: 'Rule', enter: function(node, item, list) {
            // clean up <style/> atrules without any rulesets left
            if (node.type === 'Atrule' &&
                // only Atrules containing rulesets
                node.block !== null &&
                node.block.children.isEmpty()) {
                list.remove(item);
                return;
            }

            // clean up <style/> rulesets without any css selectors left
            if (node.type === 'Rule' &&
                node.prelude.children.isEmpty()) {
                list.remove(item);
            }
        }});


        if (style.cssAst.children.isEmpty()) {
            // clean up now emtpy <style/>s
            var styleParentEl = style.styleEl.parentNode;
            styleParentEl.spliceContent(styleParentEl.content.indexOf(style.styleEl), 1);

            if (styleParentEl.elem === 'defs' &&
                styleParentEl.content.length === 0) {
                // also clean up now empty <def/>s
                var defsParentEl = styleParentEl.parentNode;
                defsParentEl.spliceContent(defsParentEl.content.indexOf(styleParentEl), 1);
            }

            continue;
        }


        // update existing, left over <style>s
        cssTools.setCssStr(style.styleEl, csstree_min.generate(style.cssAst));
    }


    return document;
};

var inlineStyles = {
	type: type$e,
	active: active$e,
	params: params$9,
	description: description$e,
	fn: fn$e
};

var type$f = 'perItem';

var active$f = true;

var description$f = 'merges multiple paths in one if possible';

var params$a = {
    collapseRepeated: true,
    force: false,
    leadingZero: true,
    negativeExtraSpace: true,
    noSpaceAfterFlags: false, // a20 60 45 0 1 30 20 → a20 60 45 0130 20
};

var path2js$1 = _path.path2js,
    js2path$1 = _path.js2path,
    intersects = _path.intersects;

/**
 * Merge multiple Paths into one.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich, Lev Solntsev
 */
var fn$f = function(item, params) {

    if (!item.isElem() || item.isEmpty()) return;

    var prevContentItem = null,
        prevContentItemKeys = null;

    item.content = item.content.filter(function(contentItem) {

        if (prevContentItem &&
            prevContentItem.isElem('path') &&
            prevContentItem.isEmpty() &&
            prevContentItem.hasAttr('d') &&
            contentItem.isElem('path') &&
            contentItem.isEmpty() &&
            contentItem.hasAttr('d')
        ) {

            if (!prevContentItemKeys) {
                prevContentItemKeys = Object.keys(prevContentItem.attrs);
            }

            var contentItemAttrs = Object.keys(contentItem.attrs),
                equalData = prevContentItemKeys.length == contentItemAttrs.length &&
                    contentItemAttrs.every(function(key) {
                        return key == 'd' ||
                            prevContentItem.hasAttr(key) &&
                            prevContentItem.attr(key).value == contentItem.attr(key).value;
                    }),
                prevPathJS = path2js$1(prevContentItem),
                curPathJS = path2js$1(contentItem);

            if (equalData && (params.force || !intersects(prevPathJS, curPathJS))) {
                js2path$1(prevContentItem, prevPathJS.concat(curPathJS), params);
                return false;
            }
        }

        prevContentItem = contentItem;
        prevContentItemKeys = null;
        return true;

    });

};

var mergePaths = {
	type: type$f,
	active: active$f,
	description: description$f,
	params: params$a,
	fn: fn$f
};

var hasOwnProperty = Object.prototype.hasOwnProperty;

function buildMap(list, caseInsensitive) {
    var map = Object.create(null);

    if (!Array.isArray(list)) {
        return null;
    }

    for (var i = 0; i < list.length; i++) {
        var name = list[i];

        if (caseInsensitive) {
            name = name.toLowerCase();
        }

        map[name] = true;
    }

    return map;
}

function buildList(data) {
    if (!data) {
        return null;
    }

    var tags = buildMap(data.tags, true);
    var ids = buildMap(data.ids);
    var classes = buildMap(data.classes);

    if (tags === null &&
        ids === null &&
        classes === null) {
        return null;
    }

    return {
        tags: tags,
        ids: ids,
        classes: classes
    };
}

function buildIndex(data) {
    var scopes = false;

    if (data.scopes && Array.isArray(data.scopes)) {
        scopes = Object.create(null);

        for (var i = 0; i < data.scopes.length; i++) {
            var list = data.scopes[i];

            if (!list || !Array.isArray(list)) {
                throw new Error('Wrong usage format');
            }

            for (var j = 0; j < list.length; j++) {
                var name = list[j];

                if (hasOwnProperty.call(scopes, name)) {
                    throw new Error('Class can\'t be used for several scopes: ' + name);
                }

                scopes[name] = i + 1;
            }
        }
    }

    return {
        whitelist: buildList(data),
        blacklist: buildList(data.blacklist),
        scopes: scopes
    };
}

var usage = {
    buildIndex: buildIndex
};

var utils = {
    hasNoChildren: function(node) {
        return !node || !node.children || node.children.isEmpty();
    },
    isNodeChildrenList: function(node, list) {
        return node !== null && node.children === list;
    }
};

var resolveKeyword = csstree_min.keyword;
var { hasNoChildren } = utils;

var Atrule = function cleanAtrule(node, item, list) {
    if (node.block) {
        // otherwise removed at-rule don't prevent @import for removal
        if (this.stylesheet !== null) {
            this.stylesheet.firstAtrulesAllowed = false;
        }

        if (hasNoChildren(node.block)) {
            list.remove(item);
            return;
        }
    }

    switch (node.name) {
        case 'charset':
            if (hasNoChildren(node.prelude)) {
                list.remove(item);
                return;
            }

            // if there is any rule before @charset -> remove it
            if (item.prev) {
                list.remove(item);
                return;
            }

            break;

        case 'import':
            if (this.stylesheet === null || !this.stylesheet.firstAtrulesAllowed) {
                list.remove(item);
                return;
            }

            // if there are some rules that not an @import or @charset before @import
            // remove it
            list.prevUntil(item.prev, function(rule) {
                if (rule.type === 'Atrule') {
                    if (rule.name === 'import' || rule.name === 'charset') {
                        return;
                    }
                }

                this.root.firstAtrulesAllowed = false;
                list.remove(item);
                return true;
            }, this);

            break;

        default:
            var name = resolveKeyword(node.name).basename;
            if (name === 'keyframes' ||
                name === 'media' ||
                name === 'supports') {

                // drop at-rule with no prelude
                if (hasNoChildren(node.prelude) || hasNoChildren(node.block)) {
                    list.remove(item);
                }
            }
    }
};

var Comment = function cleanComment(data, item, list) {
    list.remove(item);
};

var property = csstree_min.property;

var Declaration = function cleanDeclartion(node, item, list) {
    if (node.value.children && node.value.children.isEmpty()) {
        list.remove(item);
        return;
    }

    if (property(node.property).custom) {
        if (/\S/.test(node.value.value)) {
            node.value.value = node.value.value.trim();
        }
    }
};

var { isNodeChildrenList } = utils;

var Raw = function cleanRaw(node, item, list) {
    // raw in stylesheet or block children
    if (isNodeChildrenList(this.stylesheet, list) ||
        isNodeChildrenList(this.block, list)) {
        list.remove(item);
    }
};

var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var walk = csstree_min.walk;
var { hasNoChildren: hasNoChildren$1 } = utils;

function cleanUnused(selectorList, usageData) {
    selectorList.children.each(function(selector, item, list) {
        var shouldRemove = false;

        walk(selector, function(node) {
            // ignore nodes in nested selectors
            if (this.selector === null || this.selector === selectorList) {
                switch (node.type) {
                    case 'SelectorList':
                        // TODO: remove toLowerCase when pseudo selectors will be normalized
                        // ignore selectors inside :not()
                        if (this.function === null || this.function.name.toLowerCase() !== 'not') {
                            if (cleanUnused(node, usageData)) {
                                shouldRemove = true;
                            }
                        }
                        break;

                    case 'ClassSelector':
                        if (usageData.whitelist !== null &&
                            usageData.whitelist.classes !== null &&
                            !hasOwnProperty$1.call(usageData.whitelist.classes, node.name)) {
                            shouldRemove = true;
                        }
                        if (usageData.blacklist !== null &&
                            usageData.blacklist.classes !== null &&
                            hasOwnProperty$1.call(usageData.blacklist.classes, node.name)) {
                            shouldRemove = true;
                        }
                        break;

                    case 'IdSelector':
                        if (usageData.whitelist !== null &&
                            usageData.whitelist.ids !== null &&
                            !hasOwnProperty$1.call(usageData.whitelist.ids, node.name)) {
                            shouldRemove = true;
                        }
                        if (usageData.blacklist !== null &&
                            usageData.blacklist.ids !== null &&
                            hasOwnProperty$1.call(usageData.blacklist.ids, node.name)) {
                            shouldRemove = true;
                        }
                        break;

                    case 'TypeSelector':
                        // TODO: remove toLowerCase when type selectors will be normalized
                        // ignore universal selectors
                        if (node.name.charAt(node.name.length - 1) !== '*') {
                            if (usageData.whitelist !== null &&
                                usageData.whitelist.tags !== null &&
                                !hasOwnProperty$1.call(usageData.whitelist.tags, node.name.toLowerCase())) {
                                shouldRemove = true;
                            }
                            if (usageData.blacklist !== null &&
                                usageData.blacklist.tags !== null &&
                                hasOwnProperty$1.call(usageData.blacklist.tags, node.name.toLowerCase())) {
                                shouldRemove = true;
                            }
                        }
                        break;
                }
            }
        });

        if (shouldRemove) {
            list.remove(item);
        }
    });

    return selectorList.children.isEmpty();
}

var Rule = function cleanRule(node, item, list, options) {
    if (hasNoChildren$1(node.prelude) || hasNoChildren$1(node.block)) {
        list.remove(item);
        return;
    }

    var usageData = options.usage;

    if (usageData && (usageData.whitelist !== null || usageData.blacklist !== null)) {
        cleanUnused(node.prelude, usageData);

        if (hasNoChildren$1(node.prelude)) {
            list.remove(item);
            return;
        }
    }
};

// remove useless universal selector
var TypeSelector = function cleanTypeSelector(node, item, list) {
    var name = item.data.name;

    // check it's a non-namespaced universal selector
    if (name !== '*') {
        return;
    }

    // remove when universal selector before other selectors
    var nextType = item.next && item.next.data.type;
    if (nextType === 'IdSelector' ||
        nextType === 'ClassSelector' ||
        nextType === 'AttributeSelector' ||
        nextType === 'PseudoClassSelector' ||
        nextType === 'PseudoElementSelector') {
        list.remove(item);
    }
};

var { isNodeChildrenList: isNodeChildrenList$1 } = utils;

function isSafeOperator(node) {
    return node.type === 'Operator' && node.value !== '+' && node.value !== '-';
}

var WhiteSpace = function cleanWhitespace(node, item, list) {
    // remove when first or last item in sequence
    if (item.next === null || item.prev === null) {
        list.remove(item);
        return;
    }

    // white space in stylesheet or block children
    if (isNodeChildrenList$1(this.stylesheet, list) ||
        isNodeChildrenList$1(this.block, list)) {
        list.remove(item);
        return;
    }

    if (item.next.data.type === 'WhiteSpace') {
        list.remove(item);
        return;
    }

    if (isSafeOperator(item.prev.data) || isSafeOperator(item.next.data)) {
        list.remove(item);
        return;
    }
};

var walk$1 = csstree_min.walk;
var handlers = {
    Atrule: Atrule,
    Comment: Comment,
    Declaration: Declaration,
    Raw: Raw,
    Rule: Rule,
    TypeSelector: TypeSelector,
    WhiteSpace: WhiteSpace
};

var clean = function(ast, options) {
    walk$1(ast, {
        leave: function(node, item, list) {
            if (handlers.hasOwnProperty(node.type)) {
                handlers[node.type].call(this, node, item, list, options);
            }
        }
    });
};

var keyframes = function(node) {
    node.block.children.each(function(rule) {
        rule.prelude.children.each(function(simpleselector) {
            simpleselector.children.each(function(data, item) {
                if (data.type === 'Percentage' && data.value === '100') {
                    item.data = {
                        type: 'TypeSelector',
                        loc: data.loc,
                        name: 'to'
                    };
                } else if (data.type === 'TypeSelector' && data.name === 'from') {
                    item.data = {
                        type: 'Percentage',
                        loc: data.loc,
                        value: '0'
                    };
                }
            });
        });
    });
};

var resolveKeyword$1 = csstree_min.keyword;


var Atrule$1 = function(node) {
    // compress @keyframe selectors
    if (resolveKeyword$1(node.name).basename === 'keyframes') {
        keyframes(node);
    }
};

// Can unquote attribute detection
// Adopted implementation of Mathias Bynens
// https://github.com/mathiasbynens/mothereff.in/blob/master/unquoted-attributes/eff.js
var escapesRx = /\\([0-9A-Fa-f]{1,6})(\r\n|[ \t\n\f\r])?|\\./g;
var blockUnquoteRx = /^(-?\d|--)|[\u0000-\u002c\u002e\u002f\u003A-\u0040\u005B-\u005E\u0060\u007B-\u009f]/;

function canUnquote(value) {
    if (value === '' || value === '-') {
        return;
    }

    // Escapes are valid, so replace them with a valid non-empty string
    value = value.replace(escapesRx, 'a');

    return !blockUnquoteRx.test(value);
}

var AttributeSelector = function(node) {
    var attrValue = node.value;

    if (!attrValue || attrValue.type !== 'String') {
        return;
    }

    var unquotedValue = attrValue.value.replace(/^(.)(.*)\1$/, '$2');
    if (canUnquote(unquotedValue)) {
        node.value = {
            type: 'Identifier',
            loc: attrValue.loc,
            name: unquotedValue
        };
    }
};

var font = function compressFont(node) {
    var list = node.children;

    list.eachRight(function(node, item) {
        if (node.type === 'Identifier') {
            if (node.name === 'bold') {
                item.data = {
                    type: 'Number',
                    loc: node.loc,
                    value: '700'
                };
            } else if (node.name === 'normal') {
                var prev = item.prev;

                if (prev && prev.data.type === 'Operator' && prev.data.value === '/') {
                    this.remove(prev);
                }

                this.remove(item);
            } else if (node.name === 'medium') {
                var next = item.next;

                if (!next || next.data.type !== 'Operator') {
                    this.remove(item);
                }
            }
        }
    });

    // remove redundant spaces
    list.each(function(node, item) {
        if (node.type === 'WhiteSpace') {
            if (!item.prev || !item.next || item.next.data.type === 'WhiteSpace') {
                this.remove(item);
            }
        }
    });

    if (list.isEmpty()) {
        list.insert(list.createItem({
            type: 'Identifier',
            name: 'normal'
        }));
    }
};

var fontWeight = function compressFontWeight(node) {
    var value = node.children.head.data;

    if (value.type === 'Identifier') {
        switch (value.name) {
            case 'normal':
                node.children.head.data = {
                    type: 'Number',
                    loc: value.loc,
                    value: '400'
                };
                break;
            case 'bold':
                node.children.head.data = {
                    type: 'Number',
                    loc: value.loc,
                    value: '700'
                };
                break;
        }
    }
};

var List$1 = csstree_min.List;

var background = function compressBackground(node) {
    function lastType() {
        if (buffer.length) {
            return buffer[buffer.length - 1].type;
        }
    }

    function flush() {
        if (lastType() === 'WhiteSpace') {
            buffer.pop();
        }

        if (!buffer.length) {
            buffer.unshift(
                {
                    type: 'Number',
                    loc: null,
                    value: '0'
                },
                {
                    type: 'WhiteSpace',
                    value: ' '
                },
                {
                    type: 'Number',
                    loc: null,
                    value: '0'
                }
            );
        }

        newValue.push.apply(newValue, buffer);

        buffer = [];
    }

    var newValue = [];
    var buffer = [];

    node.children.each(function(node) {
        if (node.type === 'Operator' && node.value === ',') {
            flush();
            newValue.push(node);
            return;
        }

        // remove defaults
        if (node.type === 'Identifier') {
            if (node.name === 'transparent' ||
                node.name === 'none' ||
                node.name === 'repeat' ||
                node.name === 'scroll') {
                return;
            }
        }

        // don't add redundant spaces
        if (node.type === 'WhiteSpace' && (!buffer.length || lastType() === 'WhiteSpace')) {
            return;
        }

        buffer.push(node);
    });

    flush();
    node.children = new List$1().fromArray(newValue);
};

function removeItemAndRedundantWhiteSpace(list, item) {
    var prev = item.prev;
    var next = item.next;

    if (next !== null) {
        if (next.data.type === 'WhiteSpace' && (prev === null || prev.data.type === 'WhiteSpace')) {
            list.remove(next);
        }
    } else if (prev !== null && prev.data.type === 'WhiteSpace') {
        list.remove(prev);
    }

    list.remove(item);
}

var border = function compressBorder(node) {
    node.children.each(function(node, item, list) {
        if (node.type === 'Identifier' && node.name.toLowerCase() === 'none') {
            if (list.head === list.tail) {
                // replace `none` for zero when `none` is a single term
                item.data = {
                    type: 'Number',
                    loc: node.loc,
                    value: '0'
                };
            } else {
                removeItemAndRedundantWhiteSpace(list, item);
            }
        }
    });
};

var resolveName = csstree_min.property;
var handlers$1 = {
    'font': font,
    'font-weight': fontWeight,
    'background': background,
    'border': border,
    'outline': border
};

var Value = function compressValue(node) {
    if (!this.declaration) {
        return;
    }

    var property = resolveName(this.declaration.property);

    if (handlers$1.hasOwnProperty(property.basename)) {
        handlers$1[property.basename](node);
    }
};

var OMIT_PLUSSIGN = /^(?:\+|(-))?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/;
var KEEP_PLUSSIGN = /^([\+\-])?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/;
var unsafeToRemovePlusSignAfter = {
    Dimension: true,
    Hash: true,
    Identifier: true,
    Number: true,
    Raw: true,
    UnicodeRange: true
};

function packNumber(value, item) {
    // omit plus sign only if no prev or prev is safe type
    var regexp = item && item.prev !== null && unsafeToRemovePlusSignAfter.hasOwnProperty(item.prev.data.type)
        ? KEEP_PLUSSIGN
        : OMIT_PLUSSIGN;

    // 100 -> '100'
    // 00100 -> '100'
    // +100 -> '100' (only when safe, e.g. omitting plus sign for 1px+1px leads to single dimension instead of two)
    // -100 -> '-100'
    // 0.123 -> '.123'
    // 0.12300 -> '.123'
    // 0.0 -> ''
    // 0 -> ''
    // -0 -> '-'
    value = String(value).replace(regexp, '$1$2$3');

    if (value === '' || value === '-') {
        value = '0';
    }

    return value;
}

var _Number = function(node, item) {
    node.value = packNumber(node.value, item);
};
var pack = packNumber;
_Number.pack = pack;

var packNumber$1 = _Number.pack;
var MATH_FUNCTIONS = {
    'calc': true,
    'min': true,
    'max': true,
    'clamp': true
};
var LENGTH_UNIT = {
    // absolute length units
    'px': true,
    'mm': true,
    'cm': true,
    'in': true,
    'pt': true,
    'pc': true,

    // relative length units
    'em': true,
    'ex': true,
    'ch': true,
    'rem': true,

    // viewport-percentage lengths
    'vh': true,
    'vw': true,
    'vmin': true,
    'vmax': true,
    'vm': true
};

var Dimension = function compressDimension(node, item) {
    var value = packNumber$1(node.value, item);

    node.value = value;

    if (value === '0' && this.declaration !== null && this.atrulePrelude === null) {
        var unit = node.unit.toLowerCase();

        // only length values can be compressed
        if (!LENGTH_UNIT.hasOwnProperty(unit)) {
            return;
        }

        // issue #362: shouldn't remove unit in -ms-flex since it breaks flex in IE10/11
        // issue #200: shouldn't remove unit in flex since it breaks flex in IE10/11
        if (this.declaration.property === '-ms-flex' ||
            this.declaration.property === 'flex') {
            return;
        }

        // issue #222: don't remove units inside calc
        if (this.function && MATH_FUNCTIONS.hasOwnProperty(this.function.name)) {
            return;
        }

        item.data = {
            type: 'Number',
            loc: node.loc,
            value: value
        };
    }
};

var lexer = csstree_min.lexer;
var packNumber$2 = _Number.pack;
var blacklist = new Set([
    // see https://github.com/jakubpawlowicz/clean-css/issues/957
    'width',
    'min-width',
    'max-width',
    'height',
    'min-height',
    'max-height',

    // issue #410: Don’t remove units in flex-basis value for (-ms-)flex shorthand
    // issue #362: shouldn't remove unit in -ms-flex since it breaks flex in IE10/11
    // issue #200: shouldn't remove unit in flex since it breaks flex in IE10/11
    'flex',
    '-ms-flex'
]);

var Percentage = function compressPercentage(node, item) {
    node.value = packNumber$2(node.value, item);

    if (node.value === '0' && this.declaration && !blacklist.has(this.declaration.property)) {
        // try to convert a number
        item.data = {
            type: 'Number',
            loc: node.loc,
            value: node.value
        };

        // that's ok only when new value matches on length
        if (!lexer.matchDeclaration(this.declaration).isType(item.data, 'length')) {
            // otherwise rollback changes
            item.data = node;
        }
    }
};

var _String = function(node) {
    var value = node.value;

    // remove escaped newlines, i.e.
    // .a { content: "foo\
    // bar"}
    // ->
    // .a { content: "foobar" }
    value = value.replace(/\\(\r\n|\r|\n|\f)/g, '');

    node.value = value;
};

var UNICODE = '\\\\[0-9a-f]{1,6}(\\r\\n|[ \\n\\r\\t\\f])?';
var ESCAPE = '(' + UNICODE + '|\\\\[^\\n\\r\\f0-9a-fA-F])';
var NONPRINTABLE = '\u0000\u0008\u000b\u000e-\u001f\u007f';
var SAFE_URL = new RegExp('^(' + ESCAPE + '|[^\"\'\\(\\)\\\\\\s' + NONPRINTABLE + '])*$', 'i');

var Url = function(node) {
    var value = node.value;

    if (value.type !== 'String') {
        return;
    }

    var quote = value.value[0];
    var url = value.value.substr(1, value.value.length - 2);

    // convert `\\` to `/`
    url = url.replace(/\\\\/g, '/');

    // remove quotes when safe
    // https://www.w3.org/TR/css-syntax-3/#url-unquoted-diagram
    if (SAFE_URL.test(url)) {
        node.value = {
            type: 'Raw',
            loc: node.value.loc,
            value: url
        };
    } else {
        // use double quotes if string has no double quotes
        // otherwise use original quotes
        // TODO: make better quote type selection
        node.value.value = url.indexOf('"') === -1 ? '"' + url + '"' : quote + url + quote;
    }
};

var lexer$1 = csstree_min.lexer;
var packNumber$3 = _Number.pack;

// http://www.w3.org/TR/css3-color/#svg-color
var NAME_TO_HEX = {
    'aliceblue': 'f0f8ff',
    'antiquewhite': 'faebd7',
    'aqua': '0ff',
    'aquamarine': '7fffd4',
    'azure': 'f0ffff',
    'beige': 'f5f5dc',
    'bisque': 'ffe4c4',
    'black': '000',
    'blanchedalmond': 'ffebcd',
    'blue': '00f',
    'blueviolet': '8a2be2',
    'brown': 'a52a2a',
    'burlywood': 'deb887',
    'cadetblue': '5f9ea0',
    'chartreuse': '7fff00',
    'chocolate': 'd2691e',
    'coral': 'ff7f50',
    'cornflowerblue': '6495ed',
    'cornsilk': 'fff8dc',
    'crimson': 'dc143c',
    'cyan': '0ff',
    'darkblue': '00008b',
    'darkcyan': '008b8b',
    'darkgoldenrod': 'b8860b',
    'darkgray': 'a9a9a9',
    'darkgrey': 'a9a9a9',
    'darkgreen': '006400',
    'darkkhaki': 'bdb76b',
    'darkmagenta': '8b008b',
    'darkolivegreen': '556b2f',
    'darkorange': 'ff8c00',
    'darkorchid': '9932cc',
    'darkred': '8b0000',
    'darksalmon': 'e9967a',
    'darkseagreen': '8fbc8f',
    'darkslateblue': '483d8b',
    'darkslategray': '2f4f4f',
    'darkslategrey': '2f4f4f',
    'darkturquoise': '00ced1',
    'darkviolet': '9400d3',
    'deeppink': 'ff1493',
    'deepskyblue': '00bfff',
    'dimgray': '696969',
    'dimgrey': '696969',
    'dodgerblue': '1e90ff',
    'firebrick': 'b22222',
    'floralwhite': 'fffaf0',
    'forestgreen': '228b22',
    'fuchsia': 'f0f',
    'gainsboro': 'dcdcdc',
    'ghostwhite': 'f8f8ff',
    'gold': 'ffd700',
    'goldenrod': 'daa520',
    'gray': '808080',
    'grey': '808080',
    'green': '008000',
    'greenyellow': 'adff2f',
    'honeydew': 'f0fff0',
    'hotpink': 'ff69b4',
    'indianred': 'cd5c5c',
    'indigo': '4b0082',
    'ivory': 'fffff0',
    'khaki': 'f0e68c',
    'lavender': 'e6e6fa',
    'lavenderblush': 'fff0f5',
    'lawngreen': '7cfc00',
    'lemonchiffon': 'fffacd',
    'lightblue': 'add8e6',
    'lightcoral': 'f08080',
    'lightcyan': 'e0ffff',
    'lightgoldenrodyellow': 'fafad2',
    'lightgray': 'd3d3d3',
    'lightgrey': 'd3d3d3',
    'lightgreen': '90ee90',
    'lightpink': 'ffb6c1',
    'lightsalmon': 'ffa07a',
    'lightseagreen': '20b2aa',
    'lightskyblue': '87cefa',
    'lightslategray': '789',
    'lightslategrey': '789',
    'lightsteelblue': 'b0c4de',
    'lightyellow': 'ffffe0',
    'lime': '0f0',
    'limegreen': '32cd32',
    'linen': 'faf0e6',
    'magenta': 'f0f',
    'maroon': '800000',
    'mediumaquamarine': '66cdaa',
    'mediumblue': '0000cd',
    'mediumorchid': 'ba55d3',
    'mediumpurple': '9370db',
    'mediumseagreen': '3cb371',
    'mediumslateblue': '7b68ee',
    'mediumspringgreen': '00fa9a',
    'mediumturquoise': '48d1cc',
    'mediumvioletred': 'c71585',
    'midnightblue': '191970',
    'mintcream': 'f5fffa',
    'mistyrose': 'ffe4e1',
    'moccasin': 'ffe4b5',
    'navajowhite': 'ffdead',
    'navy': '000080',
    'oldlace': 'fdf5e6',
    'olive': '808000',
    'olivedrab': '6b8e23',
    'orange': 'ffa500',
    'orangered': 'ff4500',
    'orchid': 'da70d6',
    'palegoldenrod': 'eee8aa',
    'palegreen': '98fb98',
    'paleturquoise': 'afeeee',
    'palevioletred': 'db7093',
    'papayawhip': 'ffefd5',
    'peachpuff': 'ffdab9',
    'peru': 'cd853f',
    'pink': 'ffc0cb',
    'plum': 'dda0dd',
    'powderblue': 'b0e0e6',
    'purple': '800080',
    'rebeccapurple': '639',
    'red': 'f00',
    'rosybrown': 'bc8f8f',
    'royalblue': '4169e1',
    'saddlebrown': '8b4513',
    'salmon': 'fa8072',
    'sandybrown': 'f4a460',
    'seagreen': '2e8b57',
    'seashell': 'fff5ee',
    'sienna': 'a0522d',
    'silver': 'c0c0c0',
    'skyblue': '87ceeb',
    'slateblue': '6a5acd',
    'slategray': '708090',
    'slategrey': '708090',
    'snow': 'fffafa',
    'springgreen': '00ff7f',
    'steelblue': '4682b4',
    'tan': 'd2b48c',
    'teal': '008080',
    'thistle': 'd8bfd8',
    'tomato': 'ff6347',
    'turquoise': '40e0d0',
    'violet': 'ee82ee',
    'wheat': 'f5deb3',
    'white': 'fff',
    'whitesmoke': 'f5f5f5',
    'yellow': 'ff0',
    'yellowgreen': '9acd32'
};

var HEX_TO_NAME = {
    '800000': 'maroon',
    '800080': 'purple',
    '808000': 'olive',
    '808080': 'gray',
    '00ffff': 'cyan',
    'f0ffff': 'azure',
    'f5f5dc': 'beige',
    'ffe4c4': 'bisque',
    '000000': 'black',
    '0000ff': 'blue',
    'a52a2a': 'brown',
    'ff7f50': 'coral',
    'ffd700': 'gold',
    '008000': 'green',
    '4b0082': 'indigo',
    'fffff0': 'ivory',
    'f0e68c': 'khaki',
    '00ff00': 'lime',
    'faf0e6': 'linen',
    '000080': 'navy',
    'ffa500': 'orange',
    'da70d6': 'orchid',
    'cd853f': 'peru',
    'ffc0cb': 'pink',
    'dda0dd': 'plum',
    'f00': 'red',
    'ff0000': 'red',
    'fa8072': 'salmon',
    'a0522d': 'sienna',
    'c0c0c0': 'silver',
    'fffafa': 'snow',
    'd2b48c': 'tan',
    '008080': 'teal',
    'ff6347': 'tomato',
    'ee82ee': 'violet',
    'f5deb3': 'wheat',
    'ffffff': 'white',
    'ffff00': 'yellow'
};

function hueToRgb(p, q, t) {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
        return q;
    }
    if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
}

function hslToRgb(h, s, l, a) {
    var r;
    var g;
    var b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;

        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        a
    ];
}

function toHex(value) {
    value = value.toString(16);
    return value.length === 1 ? '0' + value : value;
}

function parseFunctionArgs(functionArgs, count, rgb) {
    var cursor = functionArgs.head;
    var args = [];
    var wasValue = false;

    while (cursor !== null) {
        var node = cursor.data;
        var type = node.type;

        switch (type) {
            case 'Number':
            case 'Percentage':
                if (wasValue) {
                    return;
                }

                wasValue = true;
                args.push({
                    type: type,
                    value: Number(node.value)
                });
                break;

            case 'Operator':
                if (node.value === ',') {
                    if (!wasValue) {
                        return;
                    }
                    wasValue = false;
                } else if (wasValue || node.value !== '+') {
                    return;
                }
                break;

            default:
                // something we couldn't understand
                return;
        }

        cursor = cursor.next;
    }

    if (args.length !== count) {
        // invalid arguments count
        // TODO: remove those tokens
        return;
    }

    if (args.length === 4) {
        if (args[3].type !== 'Number') {
            // 4th argument should be a number
            // TODO: remove those tokens
            return;
        }

        args[3].type = 'Alpha';
    }

    if (rgb) {
        if (args[0].type !== args[1].type || args[0].type !== args[2].type) {
            // invalid color, numbers and percentage shouldn't be mixed
            // TODO: remove those tokens
            return;
        }
    } else {
        if (args[0].type !== 'Number' ||
            args[1].type !== 'Percentage' ||
            args[2].type !== 'Percentage') {
            // invalid color, for hsl values should be: number, percentage, percentage
            // TODO: remove those tokens
            return;
        }

        args[0].type = 'Angle';
    }

    return args.map(function(arg) {
        var value = Math.max(0, arg.value);

        switch (arg.type) {
            case 'Number':
                // fit value to [0..255] range
                value = Math.min(value, 255);
                break;

            case 'Percentage':
                // convert 0..100% to value in [0..255] range
                value = Math.min(value, 100) / 100;

                if (!rgb) {
                    return value;
                }

                value = 255 * value;
                break;

            case 'Angle':
                // fit value to (-360..360) range
                return (((value % 360) + 360) % 360) / 360;

            case 'Alpha':
                // fit value to [0..1] range
                return Math.min(value, 1);
        }

        return Math.round(value);
    });
}

function compressFunction(node, item, list) {
    var functionName = node.name;
    var args;

    if (functionName === 'rgba' || functionName === 'hsla') {
        args = parseFunctionArgs(node.children, 4, functionName === 'rgba');

        if (!args) {
            // something went wrong
            return;
        }

        if (functionName === 'hsla') {
            args = hslToRgb.apply(null, args);
            node.name = 'rgba';
        }

        if (args[3] === 0) {
            // try to replace `rgba(x, x, x, 0)` to `transparent`
            // always replace `rgba(0, 0, 0, 0)` to `transparent`
            // otherwise avoid replacement in gradients since it may break color transition
            // http://stackoverflow.com/questions/11829410/css3-gradient-rendering-issues-from-transparent-to-white
            var scopeFunctionName = this.function && this.function.name;
            if ((args[0] === 0 && args[1] === 0 && args[2] === 0) ||
                !/^(?:to|from|color-stop)$|gradient$/i.test(scopeFunctionName)) {

                item.data = {
                    type: 'Identifier',
                    loc: node.loc,
                    name: 'transparent'
                };

                return;
            }
        }

        if (args[3] !== 1) {
            // replace argument values for normalized/interpolated
            node.children.each(function(node, item, list) {
                if (node.type === 'Operator') {
                    if (node.value !== ',') {
                        list.remove(item);
                    }
                    return;
                }

                item.data = {
                    type: 'Number',
                    loc: node.loc,
                    value: packNumber$3(args.shift(), null)
                };
            });

            return;
        }

        // otherwise convert to rgb, i.e. rgba(255, 0, 0, 1) -> rgb(255, 0, 0)
        functionName = 'rgb';
    }

    if (functionName === 'hsl') {
        args = args || parseFunctionArgs(node.children, 3, false);

        if (!args) {
            // something went wrong
            return;
        }

        // convert to rgb
        args = hslToRgb.apply(null, args);
        functionName = 'rgb';
    }

    if (functionName === 'rgb') {
        args = args || parseFunctionArgs(node.children, 3, true);

        if (!args) {
            // something went wrong
            return;
        }

        // check if color is not at the end and not followed by space
        var next = item.next;
        if (next && next.data.type !== 'WhiteSpace') {
            list.insert(list.createItem({
                type: 'WhiteSpace',
                value: ' '
            }), next);
        }

        item.data = {
            type: 'Hash',
            loc: node.loc,
            value: toHex(args[0]) + toHex(args[1]) + toHex(args[2])
        };

        compressHex(item.data, item);
    }
}

function compressIdent(node, item) {
    if (this.declaration === null) {
        return;
    }

    var color = node.name.toLowerCase();

    if (NAME_TO_HEX.hasOwnProperty(color) &&
        lexer$1.matchDeclaration(this.declaration).isType(node, 'color')) {
        var hex = NAME_TO_HEX[color];

        if (hex.length + 1 <= color.length) {
            // replace for shorter hex value
            item.data = {
                type: 'Hash',
                loc: node.loc,
                value: hex
            };
        } else {
            // special case for consistent colors
            if (color === 'grey') {
                color = 'gray';
            }

            // just replace value for lower cased name
            node.name = color;
        }
    }
}

function compressHex(node, item) {
    var color = node.value.toLowerCase();

    // #112233 -> #123
    if (color.length === 6 &&
        color[0] === color[1] &&
        color[2] === color[3] &&
        color[4] === color[5]) {
        color = color[0] + color[2] + color[4];
    }

    if (HEX_TO_NAME[color]) {
        item.data = {
            type: 'Identifier',
            loc: node.loc,
            name: HEX_TO_NAME[color]
        };
    } else {
        node.value = color;
    }
}

var color = {
    compressFunction: compressFunction,
    compressIdent: compressIdent,
    compressHex: compressHex
};

var walk$2 = csstree_min.walk;
var handlers$2 = {
    Atrule: Atrule$1,
    AttributeSelector: AttributeSelector,
    Value: Value,
    Dimension: Dimension,
    Percentage: Percentage,
    Number: _Number,
    String: _String,
    Url: Url,
    Hash: color.compressHex,
    Identifier: color.compressIdent,
    Function: color.compressFunction
};

var replace = function(ast) {
    walk$2(ast, {
        leave: function(node, item, list) {
            if (handlers$2.hasOwnProperty(node.type)) {
                handlers$2[node.type].call(this, node, item, list);
            }
        }
    });
};

var generate = csstree_min.generate;

function Index() {
    this.seed = 0;
    this.map = Object.create(null);
}

Index.prototype.resolve = function(str) {
    var index = this.map[str];

    if (!index) {
        index = ++this.seed;
        this.map[str] = index;
    }

    return index;
};

var createDeclarationIndexer = function createDeclarationIndexer() {
    var ids = new Index();

    return function markDeclaration(node) {
        var id = generate(node);

        node.id = ids.resolve(id);
        node.length = id.length;
        node.fingerprint = null;

        return node;
    };
};

var generate$1 = csstree_min.generate;


var nonFreezePseudoElements = {
    'first-letter': true,
    'first-line': true,
    'after': true,
    'before': true
};
var nonFreezePseudoClasses = {
    'link': true,
    'visited': true,
    'hover': true,
    'active': true,
    'first-letter': true,
    'first-line': true,
    'after': true,
    'before': true
};

var processSelector = function freeze(node, usageData) {
    var pseudos = Object.create(null);
    var hasPseudo = false;

    node.prelude.children.each(function(simpleSelector) {
        var tagName = '*';
        var scope = 0;

        simpleSelector.children.each(function(node) {
            switch (node.type) {
                case 'ClassSelector':
                    if (usageData && usageData.scopes) {
                        var classScope = usageData.scopes[node.name] || 0;

                        if (scope !== 0 && classScope !== scope) {
                            throw new Error('Selector can\'t has classes from different scopes: ' + generate$1(simpleSelector));
                        }

                        scope = classScope;
                    }
                    break;

                case 'PseudoClassSelector':
                    var name = node.name.toLowerCase();

                    if (!nonFreezePseudoClasses.hasOwnProperty(name)) {
                        pseudos[':' + name] = true;
                        hasPseudo = true;
                    }
                    break;

                case 'PseudoElementSelector':
                    var name = node.name.toLowerCase();

                    if (!nonFreezePseudoElements.hasOwnProperty(name)) {
                        pseudos['::' + name] = true;
                        hasPseudo = true;
                    }
                    break;

                case 'TypeSelector':
                    tagName = node.name.toLowerCase();
                    break;

                case 'AttributeSelector':
                    if (node.flags) {
                        pseudos['[' + node.flags.toLowerCase() + ']'] = true;
                        hasPseudo = true;
                    }
                    break;

                case 'WhiteSpace':
                case 'Combinator':
                    tagName = '*';
                    break;
            }
        });

        simpleSelector.compareMarker = specificity(simpleSelector).toString();
        simpleSelector.id = null; // pre-init property to avoid multiple hidden class
        simpleSelector.id = generate$1(simpleSelector);

        if (scope) {
            simpleSelector.compareMarker += ':' + scope;
        }

        if (tagName !== '*') {
            simpleSelector.compareMarker += ',' + tagName;
        }
    });

    // add property to all rule nodes to avoid multiple hidden class
    node.pseudoSignature = hasPseudo && Object.keys(pseudos).sort().join(',');
};

var resolveKeyword$2 = csstree_min.keyword;
var walk$3 = csstree_min.walk;
var generate$2 = csstree_min.generate;



var prepare = function prepare(ast, options) {
    var markDeclaration = createDeclarationIndexer();

    walk$3(ast, {
        visit: 'Rule',
        enter: function processRule(node) {
            node.block.children.each(markDeclaration);
            processSelector(node, options.usage);
        }
    });

    walk$3(ast, {
        visit: 'Atrule',
        enter: function(node) {
            if (node.prelude) {
                node.prelude.id = null; // pre-init property to avoid multiple hidden class for generate
                node.prelude.id = generate$2(node.prelude);
            }

            // compare keyframe selectors by its values
            // NOTE: still no clarification about problems with keyframes selector grouping (issue #197)
            if (resolveKeyword$2(node.name).basename === 'keyframes') {
                node.block.avoidRulesMerge = true;  /* probably we don't need to prevent those merges for @keyframes
                                                       TODO: need to be checked */
                node.block.children.each(function(rule) {
                    rule.prelude.children.each(function(simpleselector) {
                        simpleselector.compareMarker = simpleselector.id;
                    });
                });
            }
        }
    });

    return {
        declaration: markDeclaration
    };
};

var List$2 = csstree_min.List;
var resolveKeyword$3 = csstree_min.keyword;
var hasOwnProperty$2 = Object.prototype.hasOwnProperty;
var walk$4 = csstree_min.walk;

function addRuleToMap(map, item, list, single) {
    var node = item.data;
    var name = resolveKeyword$3(node.name).basename;
    var id = node.name.toLowerCase() + '/' + (node.prelude ? node.prelude.id : null);

    if (!hasOwnProperty$2.call(map, name)) {
        map[name] = Object.create(null);
    }

    if (single) {
        delete map[name][id];
    }

    if (!hasOwnProperty$2.call(map[name], id)) {
        map[name][id] = new List$2();
    }

    map[name][id].append(list.remove(item));
}

function relocateAtrules(ast, options) {
    var collected = Object.create(null);
    var topInjectPoint = null;

    ast.children.each(function(node, item, list) {
        if (node.type === 'Atrule') {
            var name = resolveKeyword$3(node.name).basename;

            switch (name) {
                case 'keyframes':
                    addRuleToMap(collected, item, list, true);
                    return;

                case 'media':
                    if (options.forceMediaMerge) {
                        addRuleToMap(collected, item, list, false);
                        return;
                    }
                    break;
            }

            if (topInjectPoint === null &&
                name !== 'charset' &&
                name !== 'import') {
                topInjectPoint = item;
            }
        } else {
            if (topInjectPoint === null) {
                topInjectPoint = item;
            }
        }
    });

    for (var atrule in collected) {
        for (var id in collected[atrule]) {
            ast.children.insertList(
                collected[atrule][id],
                atrule === 'media' ? null : topInjectPoint
            );
        }
    }
}
function isMediaRule(node) {
    return node.type === 'Atrule' && node.name === 'media';
}

function processAtrule(node, item, list) {
    if (!isMediaRule(node)) {
        return;
    }

    var prev = item.prev && item.prev.data;

    if (!prev || !isMediaRule(prev)) {
        return;
    }

    // merge @media with same query
    if (node.prelude &&
        prev.prelude &&
        node.prelude.id === prev.prelude.id) {
        prev.block.children.appendList(node.block.children);
        list.remove(item);

        // TODO: use it when we can refer to several points in source
        // prev.loc = {
        //     primary: prev.loc,
        //     merged: node.loc
        // };
    }
}

var _1MergeAtrule = function rejoinAtrule(ast, options) {
    relocateAtrules(ast, options);

    walk$4(ast, {
        visit: 'Atrule',
        reverse: true,
        enter: processAtrule
    });
};

var hasOwnProperty$3 = Object.prototype.hasOwnProperty;

function isEqualSelectors(a, b) {
    var cursor1 = a.head;
    var cursor2 = b.head;

    while (cursor1 !== null && cursor2 !== null && cursor1.data.id === cursor2.data.id) {
        cursor1 = cursor1.next;
        cursor2 = cursor2.next;
    }

    return cursor1 === null && cursor2 === null;
}

function isEqualDeclarations(a, b) {
    var cursor1 = a.head;
    var cursor2 = b.head;

    while (cursor1 !== null && cursor2 !== null && cursor1.data.id === cursor2.data.id) {
        cursor1 = cursor1.next;
        cursor2 = cursor2.next;
    }

    return cursor1 === null && cursor2 === null;
}

function compareDeclarations(declarations1, declarations2) {
    var result = {
        eq: [],
        ne1: [],
        ne2: [],
        ne2overrided: []
    };

    var fingerprints = Object.create(null);
    var declarations2hash = Object.create(null);

    for (var cursor = declarations2.head; cursor; cursor = cursor.next)  {
        declarations2hash[cursor.data.id] = true;
    }

    for (var cursor = declarations1.head; cursor; cursor = cursor.next)  {
        var data = cursor.data;

        if (data.fingerprint) {
            fingerprints[data.fingerprint] = data.important;
        }

        if (declarations2hash[data.id]) {
            declarations2hash[data.id] = false;
            result.eq.push(data);
        } else {
            result.ne1.push(data);
        }
    }

    for (var cursor = declarations2.head; cursor; cursor = cursor.next)  {
        var data = cursor.data;

        if (declarations2hash[data.id]) {
            // when declarations1 has an overriding declaration, this is not a difference
            // unless no !important is used on prev and !important is used on the following
            if (!hasOwnProperty$3.call(fingerprints, data.fingerprint) ||
                (!fingerprints[data.fingerprint] && data.important)) {
                result.ne2.push(data);
            }

            result.ne2overrided.push(data);
        }
    }

    return result;
}

function addSelectors(dest, source) {
    source.each(function(sourceData) {
        var newStr = sourceData.id;
        var cursor = dest.head;

        while (cursor) {
            var nextStr = cursor.data.id;

            if (nextStr === newStr) {
                return;
            }

            if (nextStr > newStr) {
                break;
            }

            cursor = cursor.next;
        }

        dest.insert(dest.createItem(sourceData), cursor);
    });

    return dest;
}

// check if simpleselectors has no equal specificity and element selector
function hasSimilarSelectors(selectors1, selectors2) {
    var cursor1 = selectors1.head;

    while (cursor1 !== null) {
        var cursor2 = selectors2.head;

        while (cursor2 !== null) {
            if (cursor1.data.compareMarker === cursor2.data.compareMarker) {
                return true;
            }

            cursor2 = cursor2.next;
        }

        cursor1 = cursor1.next;
    }

    return false;
}

// test node can't to be skipped
function unsafeToSkipNode(node) {
    switch (node.type) {
        case 'Rule':
            // unsafe skip ruleset with selector similarities
            return hasSimilarSelectors(node.prelude.children, this);

        case 'Atrule':
            // can skip at-rules with blocks
            if (node.block) {
                // unsafe skip at-rule if block contains something unsafe to skip
                return node.block.children.some(unsafeToSkipNode, this);
            }
            break;

        case 'Declaration':
            return false;
    }

    // unsafe by default
    return true;
}

var utils$1 = {
    isEqualSelectors: isEqualSelectors,
    isEqualDeclarations: isEqualDeclarations,
    compareDeclarations: compareDeclarations,
    addSelectors: addSelectors,
    hasSimilarSelectors: hasSimilarSelectors,
    unsafeToSkipNode: unsafeToSkipNode
};

var walk$5 = csstree_min.walk;


function processRule(node, item, list) {
    var selectors = node.prelude.children;
    var declarations = node.block.children;

    list.prevUntil(item.prev, function(prev) {
        // skip non-ruleset node if safe
        if (prev.type !== 'Rule') {
            return utils$1.unsafeToSkipNode.call(selectors, prev);
        }

        var prevSelectors = prev.prelude.children;
        var prevDeclarations = prev.block.children;

        // try to join rulesets with equal pseudo signature
        if (node.pseudoSignature === prev.pseudoSignature) {
            // try to join by selectors
            if (utils$1.isEqualSelectors(prevSelectors, selectors)) {
                prevDeclarations.appendList(declarations);
                list.remove(item);
                return true;
            }

            // try to join by declarations
            if (utils$1.isEqualDeclarations(declarations, prevDeclarations)) {
                utils$1.addSelectors(prevSelectors, selectors);
                list.remove(item);
                return true;
            }
        }

        // go to prev ruleset if has no selector similarities
        return utils$1.hasSimilarSelectors(selectors, prevSelectors);
    });
}

// NOTE: direction should be left to right, since rulesets merge to left
// ruleset. When direction right to left unmerged rulesets may prevent lookup
// TODO: remove initial merge
var _2InitialMergeRuleset = function initialMergeRule(ast) {
    walk$5(ast, {
        visit: 'Rule',
        enter: processRule
    });
};

var List$3 = csstree_min.List;
var walk$6 = csstree_min.walk;

function processRule$1(node, item, list) {
    var selectors = node.prelude.children;

    // generate new rule sets:
    // .a, .b { color: red; }
    // ->
    // .a { color: red; }
    // .b { color: red; }

    // while there are more than 1 simple selector split for rulesets
    while (selectors.head !== selectors.tail) {
        var newSelectors = new List$3();
        newSelectors.insert(selectors.remove(selectors.head));

        list.insert(list.createItem({
            type: 'Rule',
            loc: node.loc,
            prelude: {
                type: 'SelectorList',
                loc: node.prelude.loc,
                children: newSelectors
            },
            block: {
                type: 'Block',
                loc: node.block.loc,
                children: node.block.children.copy()
            },
            pseudoSignature: node.pseudoSignature
        }), item);
    }
}

var _3DisjoinRuleset = function disjoinRule(ast) {
    walk$6(ast, {
        visit: 'Rule',
        reverse: true,
        enter: processRule$1
    });
};

var List$4 = csstree_min.List;
var generate$3 = csstree_min.generate;
var walk$7 = csstree_min.walk;

var REPLACE = 1;
var REMOVE = 2;
var TOP = 0;
var RIGHT = 1;
var BOTTOM = 2;
var LEFT = 3;
var SIDES = ['top', 'right', 'bottom', 'left'];
var SIDE = {
    'margin-top': 'top',
    'margin-right': 'right',
    'margin-bottom': 'bottom',
    'margin-left': 'left',

    'padding-top': 'top',
    'padding-right': 'right',
    'padding-bottom': 'bottom',
    'padding-left': 'left',

    'border-top-color': 'top',
    'border-right-color': 'right',
    'border-bottom-color': 'bottom',
    'border-left-color': 'left',
    'border-top-width': 'top',
    'border-right-width': 'right',
    'border-bottom-width': 'bottom',
    'border-left-width': 'left',
    'border-top-style': 'top',
    'border-right-style': 'right',
    'border-bottom-style': 'bottom',
    'border-left-style': 'left'
};
var MAIN_PROPERTY = {
    'margin': 'margin',
    'margin-top': 'margin',
    'margin-right': 'margin',
    'margin-bottom': 'margin',
    'margin-left': 'margin',

    'padding': 'padding',
    'padding-top': 'padding',
    'padding-right': 'padding',
    'padding-bottom': 'padding',
    'padding-left': 'padding',

    'border-color': 'border-color',
    'border-top-color': 'border-color',
    'border-right-color': 'border-color',
    'border-bottom-color': 'border-color',
    'border-left-color': 'border-color',
    'border-width': 'border-width',
    'border-top-width': 'border-width',
    'border-right-width': 'border-width',
    'border-bottom-width': 'border-width',
    'border-left-width': 'border-width',
    'border-style': 'border-style',
    'border-top-style': 'border-style',
    'border-right-style': 'border-style',
    'border-bottom-style': 'border-style',
    'border-left-style': 'border-style'
};

function TRBL(name) {
    this.name = name;
    this.loc = null;
    this.iehack = undefined;
    this.sides = {
        'top': null,
        'right': null,
        'bottom': null,
        'left': null
    };
}

TRBL.prototype.getValueSequence = function(declaration, count) {
    var values = [];
    var iehack = '';
    var hasBadValues = declaration.value.type !== 'Value' || declaration.value.children.some(function(child) {
        var special = false;

        switch (child.type) {
            case 'Identifier':
                switch (child.name) {
                    case '\\0':
                    case '\\9':
                        iehack = child.name;
                        return;

                    case 'inherit':
                    case 'initial':
                    case 'unset':
                    case 'revert':
                        special = child.name;
                        break;
                }
                break;

            case 'Dimension':
                switch (child.unit) {
                    // is not supported until IE11
                    case 'rem':

                    // v* units is too buggy across browsers and better
                    // don't merge values with those units
                    case 'vw':
                    case 'vh':
                    case 'vmin':
                    case 'vmax':
                    case 'vm': // IE9 supporting "vm" instead of "vmin".
                        special = child.unit;
                        break;
                }
                break;

            case 'Hash': // color
            case 'Number':
            case 'Percentage':
                break;

            case 'Function':
                if (child.name === 'var') {
                    return true;
                }

                special = child.name;
                break;

            case 'WhiteSpace':
                return false; // ignore space

            default:
                return true;  // bad value
        }

        values.push({
            node: child,
            special: special,
            important: declaration.important
        });
    });

    if (hasBadValues || values.length > count) {
        return false;
    }

    if (typeof this.iehack === 'string' && this.iehack !== iehack) {
        return false;
    }

    this.iehack = iehack; // move outside

    return values;
};

TRBL.prototype.canOverride = function(side, value) {
    var currentValue = this.sides[side];

    return !currentValue || (value.important && !currentValue.important);
};

TRBL.prototype.add = function(name, declaration) {
    function attemptToAdd() {
        var sides = this.sides;
        var side = SIDE[name];

        if (side) {
            if (side in sides === false) {
                return false;
            }

            var values = this.getValueSequence(declaration, 1);

            if (!values || !values.length) {
                return false;
            }

            // can mix only if specials are equal
            for (var key in sides) {
                if (sides[key] !== null && sides[key].special !== values[0].special) {
                    return false;
                }
            }

            if (!this.canOverride(side, values[0])) {
                return true;
            }

            sides[side] = values[0];
            return true;
        } else if (name === this.name) {
            var values = this.getValueSequence(declaration, 4);

            if (!values || !values.length) {
                return false;
            }

            switch (values.length) {
                case 1:
                    values[RIGHT] = values[TOP];
                    values[BOTTOM] = values[TOP];
                    values[LEFT] = values[TOP];
                    break;

                case 2:
                    values[BOTTOM] = values[TOP];
                    values[LEFT] = values[RIGHT];
                    break;

                case 3:
                    values[LEFT] = values[RIGHT];
                    break;
            }

            // can mix only if specials are equal
            for (var i = 0; i < 4; i++) {
                for (var key in sides) {
                    if (sides[key] !== null && sides[key].special !== values[i].special) {
                        return false;
                    }
                }
            }

            for (var i = 0; i < 4; i++) {
                if (this.canOverride(SIDES[i], values[i])) {
                    sides[SIDES[i]] = values[i];
                }
            }

            return true;
        }
    }

    if (!attemptToAdd.call(this)) {
        return false;
    }

    // TODO: use it when we can refer to several points in source
    // if (this.loc) {
    //     this.loc = {
    //         primary: this.loc,
    //         merged: declaration.loc
    //     };
    // } else {
    //     this.loc = declaration.loc;
    // }
    if (!this.loc) {
        this.loc = declaration.loc;
    }

    return true;
};

TRBL.prototype.isOkToMinimize = function() {
    var top = this.sides.top;
    var right = this.sides.right;
    var bottom = this.sides.bottom;
    var left = this.sides.left;

    if (top && right && bottom && left) {
        var important =
            top.important +
            right.important +
            bottom.important +
            left.important;

        return important === 0 || important === 4;
    }

    return false;
};

TRBL.prototype.getValue = function() {
    var result = new List$4();
    var sides = this.sides;
    var values = [
        sides.top,
        sides.right,
        sides.bottom,
        sides.left
    ];
    var stringValues = [
        generate$3(sides.top.node),
        generate$3(sides.right.node),
        generate$3(sides.bottom.node),
        generate$3(sides.left.node)
    ];

    if (stringValues[LEFT] === stringValues[RIGHT]) {
        values.pop();
        if (stringValues[BOTTOM] === stringValues[TOP]) {
            values.pop();
            if (stringValues[RIGHT] === stringValues[TOP]) {
                values.pop();
            }
        }
    }

    for (var i = 0; i < values.length; i++) {
        if (i) {
            result.appendData({ type: 'WhiteSpace', value: ' ' });
        }

        result.appendData(values[i].node);
    }

    if (this.iehack) {
        result.appendData({ type: 'WhiteSpace', value: ' ' });
        result.appendData({
            type: 'Identifier',
            loc: null,
            name: this.iehack
        });
    }

    return {
        type: 'Value',
        loc: null,
        children: result
    };
};

TRBL.prototype.getDeclaration = function() {
    return {
        type: 'Declaration',
        loc: this.loc,
        important: this.sides.top.important,
        property: this.name,
        value: this.getValue()
    };
};

function processRule$2(rule, shorts, shortDeclarations, lastShortSelector) {
    var declarations = rule.block.children;
    var selector = rule.prelude.children.first().id;

    rule.block.children.eachRight(function(declaration, item) {
        var property = declaration.property;

        if (!MAIN_PROPERTY.hasOwnProperty(property)) {
            return;
        }

        var key = MAIN_PROPERTY[property];
        var shorthand;
        var operation;

        if (!lastShortSelector || selector === lastShortSelector) {
            if (key in shorts) {
                operation = REMOVE;
                shorthand = shorts[key];
            }
        }

        if (!shorthand || !shorthand.add(property, declaration)) {
            operation = REPLACE;
            shorthand = new TRBL(key);

            // if can't parse value ignore it and break shorthand children
            if (!shorthand.add(property, declaration)) {
                lastShortSelector = null;
                return;
            }
        }

        shorts[key] = shorthand;
        shortDeclarations.push({
            operation: operation,
            block: declarations,
            item: item,
            shorthand: shorthand
        });

        lastShortSelector = selector;
    });

    return lastShortSelector;
}

function processShorthands(shortDeclarations, markDeclaration) {
    shortDeclarations.forEach(function(item) {
        var shorthand = item.shorthand;

        if (!shorthand.isOkToMinimize()) {
            return;
        }

        if (item.operation === REPLACE) {
            item.item.data = markDeclaration(shorthand.getDeclaration());
        } else {
            item.block.remove(item.item);
        }
    });
}

var _4RestructShorthand = function restructBlock(ast, indexer) {
    var stylesheetMap = {};
    var shortDeclarations = [];

    walk$7(ast, {
        visit: 'Rule',
        reverse: true,
        enter: function(node) {
            var stylesheet = this.block || this.stylesheet;
            var ruleId = (node.pseudoSignature || '') + '|' + node.prelude.children.first().id;
            var ruleMap;
            var shorts;

            if (!stylesheetMap.hasOwnProperty(stylesheet.id)) {
                ruleMap = {
                    lastShortSelector: null
                };
                stylesheetMap[stylesheet.id] = ruleMap;
            } else {
                ruleMap = stylesheetMap[stylesheet.id];
            }

            if (ruleMap.hasOwnProperty(ruleId)) {
                shorts = ruleMap[ruleId];
            } else {
                shorts = {};
                ruleMap[ruleId] = shorts;
            }

            ruleMap.lastShortSelector = processRule$2.call(this, node, shorts, shortDeclarations, ruleMap.lastShortSelector);
        }
    });

    processShorthands(shortDeclarations, indexer.declaration);
};

var resolveProperty = csstree_min.property;
var resolveKeyword$4 = csstree_min.keyword;
var walk$8 = csstree_min.walk;
var generate$4 = csstree_min.generate;
var fingerprintId = 1;
var dontRestructure = {
    'src': 1 // https://github.com/afelix/csso/issues/50
};

var DONT_MIX_VALUE = {
    // https://developer.mozilla.org/en-US/docs/Web/CSS/display#Browser_compatibility
    'display': /table|ruby|flex|-(flex)?box$|grid|contents|run-in/i,
    // https://developer.mozilla.org/en/docs/Web/CSS/text-align
    'text-align': /^(start|end|match-parent|justify-all)$/i
};

var SAFE_VALUES = {
    cursor: [
        'auto', 'crosshair', 'default', 'move', 'text', 'wait', 'help',
        'n-resize', 'e-resize', 's-resize', 'w-resize',
        'ne-resize', 'nw-resize', 'se-resize', 'sw-resize',
        'pointer', 'progress', 'not-allowed', 'no-drop', 'vertical-text', 'all-scroll',
        'col-resize', 'row-resize'
    ],
    overflow: [
        'hidden', 'visible', 'scroll', 'auto'
    ],
    position: [
        'static', 'relative', 'absolute', 'fixed'
    ]
};

var NEEDLESS_TABLE = {
    'border-width': ['border'],
    'border-style': ['border'],
    'border-color': ['border'],
    'border-top': ['border'],
    'border-right': ['border'],
    'border-bottom': ['border'],
    'border-left': ['border'],
    'border-top-width': ['border-top', 'border-width', 'border'],
    'border-right-width': ['border-right', 'border-width', 'border'],
    'border-bottom-width': ['border-bottom', 'border-width', 'border'],
    'border-left-width': ['border-left', 'border-width', 'border'],
    'border-top-style': ['border-top', 'border-style', 'border'],
    'border-right-style': ['border-right', 'border-style', 'border'],
    'border-bottom-style': ['border-bottom', 'border-style', 'border'],
    'border-left-style': ['border-left', 'border-style', 'border'],
    'border-top-color': ['border-top', 'border-color', 'border'],
    'border-right-color': ['border-right', 'border-color', 'border'],
    'border-bottom-color': ['border-bottom', 'border-color', 'border'],
    'border-left-color': ['border-left', 'border-color', 'border'],
    'margin-top': ['margin'],
    'margin-right': ['margin'],
    'margin-bottom': ['margin'],
    'margin-left': ['margin'],
    'padding-top': ['padding'],
    'padding-right': ['padding'],
    'padding-bottom': ['padding'],
    'padding-left': ['padding'],
    'font-style': ['font'],
    'font-variant': ['font'],
    'font-weight': ['font'],
    'font-size': ['font'],
    'font-family': ['font'],
    'list-style-type': ['list-style'],
    'list-style-position': ['list-style'],
    'list-style-image': ['list-style']
};

function getPropertyFingerprint(propertyName, declaration, fingerprints) {
    var realName = resolveProperty(propertyName).basename;

    if (realName === 'background') {
        return propertyName + ':' + generate$4(declaration.value);
    }

    var declarationId = declaration.id;
    var fingerprint = fingerprints[declarationId];

    if (!fingerprint) {
        switch (declaration.value.type) {
            case 'Value':
                var vendorId = '';
                var iehack = '';
                var special = {};
                var raw = false;

                declaration.value.children.each(function walk(node) {
                    switch (node.type) {
                        case 'Value':
                        case 'Brackets':
                        case 'Parentheses':
                            node.children.each(walk);
                            break;

                        case 'Raw':
                            raw = true;
                            break;

                        case 'Identifier':
                            var name = node.name;

                            if (!vendorId) {
                                vendorId = resolveKeyword$4(name).vendor;
                            }

                            if (/\\[09]/.test(name)) {
                                iehack = RegExp.lastMatch;
                            }

                            if (SAFE_VALUES.hasOwnProperty(realName)) {
                                if (SAFE_VALUES[realName].indexOf(name) === -1) {
                                    special[name] = true;
                                }
                            } else if (DONT_MIX_VALUE.hasOwnProperty(realName)) {
                                if (DONT_MIX_VALUE[realName].test(name)) {
                                    special[name] = true;
                                }
                            }

                            break;

                        case 'Function':
                            var name = node.name;

                            if (!vendorId) {
                                vendorId = resolveKeyword$4(name).vendor;
                            }

                            if (name === 'rect') {
                                // there are 2 forms of rect:
                                //   rect(<top>, <right>, <bottom>, <left>) - standart
                                //   rect(<top> <right> <bottom> <left>) – backwards compatible syntax
                                // only the same form values can be merged
                                var hasComma = node.children.some(function(node) {
                                    return node.type === 'Operator' && node.value === ',';
                                });
                                if (!hasComma) {
                                    name = 'rect-backward';
                                }
                            }

                            special[name + '()'] = true;

                            // check nested tokens too
                            node.children.each(walk);

                            break;

                        case 'Dimension':
                            var unit = node.unit;

                            if (/\\[09]/.test(unit)) {
                                iehack = RegExp.lastMatch;
                            }

                            switch (unit) {
                                // is not supported until IE11
                                case 'rem':

                                // v* units is too buggy across browsers and better
                                // don't merge values with those units
                                case 'vw':
                                case 'vh':
                                case 'vmin':
                                case 'vmax':
                                case 'vm': // IE9 supporting "vm" instead of "vmin".
                                    special[unit] = true;
                                    break;
                            }
                            break;
                    }
                });

                fingerprint = raw
                    ? '!' + fingerprintId++
                    : '!' + Object.keys(special).sort() + '|' + iehack + vendorId;
                break;

            case 'Raw':
                fingerprint = '!' + declaration.value.value;
                break;

            default:
                fingerprint = generate$4(declaration.value);
        }

        fingerprints[declarationId] = fingerprint;
    }

    return propertyName + fingerprint;
}

function needless(props, declaration, fingerprints) {
    var property = resolveProperty(declaration.property);

    if (NEEDLESS_TABLE.hasOwnProperty(property.basename)) {
        var table = NEEDLESS_TABLE[property.basename];

        for (var i = 0; i < table.length; i++) {
            var ppre = getPropertyFingerprint(property.prefix + table[i], declaration, fingerprints);
            var prev = props.hasOwnProperty(ppre) ? props[ppre] : null;

            if (prev && (!declaration.important || prev.item.data.important)) {
                return prev;
            }
        }
    }
}

function processRule$3(rule, item, list, props, fingerprints) {
    var declarations = rule.block.children;

    declarations.eachRight(function(declaration, declarationItem) {
        var property = declaration.property;
        var fingerprint = getPropertyFingerprint(property, declaration, fingerprints);
        var prev = props[fingerprint];

        if (prev && !dontRestructure.hasOwnProperty(property)) {
            if (declaration.important && !prev.item.data.important) {
                props[fingerprint] = {
                    block: declarations,
                    item: declarationItem
                };

                prev.block.remove(prev.item);

                // TODO: use it when we can refer to several points in source
                // declaration.loc = {
                //     primary: declaration.loc,
                //     merged: prev.item.data.loc
                // };
            } else {
                declarations.remove(declarationItem);

                // TODO: use it when we can refer to several points in source
                // prev.item.data.loc = {
                //     primary: prev.item.data.loc,
                //     merged: declaration.loc
                // };
            }
        } else {
            var prev = needless(props, declaration, fingerprints);

            if (prev) {
                declarations.remove(declarationItem);

                // TODO: use it when we can refer to several points in source
                // prev.item.data.loc = {
                //     primary: prev.item.data.loc,
                //     merged: declaration.loc
                // };
            } else {
                declaration.fingerprint = fingerprint;

                props[fingerprint] = {
                    block: declarations,
                    item: declarationItem
                };
            }
        }
    });

    if (declarations.isEmpty()) {
        list.remove(item);
    }
}

var _6RestructBlock = function restructBlock(ast) {
    var stylesheetMap = {};
    var fingerprints = Object.create(null);

    walk$8(ast, {
        visit: 'Rule',
        reverse: true,
        enter: function(node, item, list) {
            var stylesheet = this.block || this.stylesheet;
            var ruleId = (node.pseudoSignature || '') + '|' + node.prelude.children.first().id;
            var ruleMap;
            var props;

            if (!stylesheetMap.hasOwnProperty(stylesheet.id)) {
                ruleMap = {};
                stylesheetMap[stylesheet.id] = ruleMap;
            } else {
                ruleMap = stylesheetMap[stylesheet.id];
            }

            if (ruleMap.hasOwnProperty(ruleId)) {
                props = ruleMap[ruleId];
            } else {
                props = {};
                ruleMap[ruleId] = props;
            }

            processRule$3.call(this, node, item, list, props, fingerprints);
        }
    });
};

var walk$9 = csstree_min.walk;


/*
    At this step all rules has single simple selector. We try to join by equal
    declaration blocks to first rule, e.g.

    .a { color: red }
    b { ... }
    .b { color: red }
    ->
    .a, .b { color: red }
    b { ... }
*/

function processRule$4(node, item, list) {
    var selectors = node.prelude.children;
    var declarations = node.block.children;
    var nodeCompareMarker = selectors.first().compareMarker;
    var skippedCompareMarkers = {};

    list.nextUntil(item.next, function(next, nextItem) {
        // skip non-ruleset node if safe
        if (next.type !== 'Rule') {
            return utils$1.unsafeToSkipNode.call(selectors, next);
        }

        if (node.pseudoSignature !== next.pseudoSignature) {
            return true;
        }

        var nextFirstSelector = next.prelude.children.head;
        var nextDeclarations = next.block.children;
        var nextCompareMarker = nextFirstSelector.data.compareMarker;

        // if next ruleset has same marked as one of skipped then stop joining
        if (nextCompareMarker in skippedCompareMarkers) {
            return true;
        }

        // try to join by selectors
        if (selectors.head === selectors.tail) {
            if (selectors.first().id === nextFirstSelector.data.id) {
                declarations.appendList(nextDeclarations);
                list.remove(nextItem);
                return;
            }
        }

        // try to join by properties
        if (utils$1.isEqualDeclarations(declarations, nextDeclarations)) {
            var nextStr = nextFirstSelector.data.id;

            selectors.some(function(data, item) {
                var curStr = data.id;

                if (nextStr < curStr) {
                    selectors.insert(nextFirstSelector, item);
                    return true;
                }

                if (!item.next) {
                    selectors.insert(nextFirstSelector);
                    return true;
                }
            });

            list.remove(nextItem);
            return;
        }

        // go to next ruleset if current one can be skipped (has no equal specificity nor element selector)
        if (nextCompareMarker === nodeCompareMarker) {
            return true;
        }

        skippedCompareMarkers[nextCompareMarker] = true;
    });
}

var _7MergeRuleset = function mergeRule(ast) {
    walk$9(ast, {
        visit: 'Rule',
        enter: processRule$4
    });
};

var List$5 = csstree_min.List;
var walk$a = csstree_min.walk;


function calcSelectorLength(list) {
    var length = 0;

    list.each(function(data) {
        length += data.id.length + 1;
    });

    return length - 1;
}

function calcDeclarationsLength(tokens) {
    var length = 0;

    for (var i = 0; i < tokens.length; i++) {
        length += tokens[i].length;
    }

    return (
        length +          // declarations
        tokens.length - 1 // delimeters
    );
}

function processRule$5(node, item, list) {
    var avoidRulesMerge = this.block !== null ? this.block.avoidRulesMerge : false;
    var selectors = node.prelude.children;
    var block = node.block;
    var disallowDownMarkers = Object.create(null);
    var allowMergeUp = true;
    var allowMergeDown = true;

    list.prevUntil(item.prev, function(prev, prevItem) {
        var prevBlock = prev.block;
        var prevType = prev.type;

        if (prevType !== 'Rule') {
            var unsafe = utils$1.unsafeToSkipNode.call(selectors, prev);

            if (!unsafe && prevType === 'Atrule' && prevBlock) {
                walk$a(prevBlock, {
                    visit: 'Rule',
                    enter: function(node) {
                        node.prelude.children.each(function(data) {
                            disallowDownMarkers[data.compareMarker] = true;
                        });
                    }
                });
            }

            return unsafe;
        }

        var prevSelectors = prev.prelude.children;

        if (node.pseudoSignature !== prev.pseudoSignature) {
            return true;
        }

        allowMergeDown = !prevSelectors.some(function(selector) {
            return selector.compareMarker in disallowDownMarkers;
        });

        // try prev ruleset if simpleselectors has no equal specifity and element selector
        if (!allowMergeDown && !allowMergeUp) {
            return true;
        }

        // try to join by selectors
        if (allowMergeUp && utils$1.isEqualSelectors(prevSelectors, selectors)) {
            prevBlock.children.appendList(block.children);
            list.remove(item);
            return true;
        }

        // try to join by properties
        var diff = utils$1.compareDeclarations(block.children, prevBlock.children);

        // console.log(diff.eq, diff.ne1, diff.ne2);

        if (diff.eq.length) {
            if (!diff.ne1.length && !diff.ne2.length) {
                // equal blocks
                if (allowMergeDown) {
                    utils$1.addSelectors(selectors, prevSelectors);
                    list.remove(prevItem);
                }

                return true;
            } else if (!avoidRulesMerge) { /* probably we don't need to prevent those merges for @keyframes
                                              TODO: need to be checked */

                if (diff.ne1.length && !diff.ne2.length) {
                    // prevBlock is subset block
                    var selectorLength = calcSelectorLength(selectors);
                    var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    if (allowMergeUp && selectorLength < blockLength) {
                        utils$1.addSelectors(prevSelectors, selectors);
                        block.children = new List$5().fromArray(diff.ne1);
                    }
                } else if (!diff.ne1.length && diff.ne2.length) {
                    // node is subset of prevBlock
                    var selectorLength = calcSelectorLength(prevSelectors);
                    var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    if (allowMergeDown && selectorLength < blockLength) {
                        utils$1.addSelectors(selectors, prevSelectors);
                        prevBlock.children = new List$5().fromArray(diff.ne2);
                    }
                } else {
                    // diff.ne1.length && diff.ne2.length
                    // extract equal block
                    var newSelector = {
                        type: 'SelectorList',
                        loc: null,
                        children: utils$1.addSelectors(prevSelectors.copy(), selectors)
                    };
                    var newBlockLength = calcSelectorLength(newSelector.children) + 2; // selectors length + curly braces length
                    var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                    // create new ruleset if declarations length greater than
                    // ruleset description overhead
                    if (blockLength >= newBlockLength) {
                        var newItem = list.createItem({
                            type: 'Rule',
                            loc: null,
                            prelude: newSelector,
                            block: {
                                type: 'Block',
                                loc: null,
                                children: new List$5().fromArray(diff.eq)
                            },
                            pseudoSignature: node.pseudoSignature
                        });

                        block.children = new List$5().fromArray(diff.ne1);
                        prevBlock.children = new List$5().fromArray(diff.ne2overrided);

                        if (allowMergeUp) {
                            list.insert(newItem, prevItem);
                        } else {
                            list.insert(newItem, item);
                        }

                        return true;
                    }
                }
            }
        }

        if (allowMergeUp) {
            // TODO: disallow up merge only if any property interception only (i.e. diff.ne2overrided.length > 0);
            // await property families to find property interception correctly
            allowMergeUp = !prevSelectors.some(function(prevSelector) {
                return selectors.some(function(selector) {
                    return selector.compareMarker === prevSelector.compareMarker;
                });
            });
        }

        prevSelectors.each(function(data) {
            disallowDownMarkers[data.compareMarker] = true;
        });
    });
}

var _8RestructRuleset = function restructRule(ast) {
    walk$a(ast, {
        visit: 'Rule',
        reverse: true,
        enter: processRule$5
    });
};

var restructure = function(ast, options) {
    // prepare ast for restructing
    var indexer = prepare(ast, options);
    options.logger('prepare', ast);

    _1MergeAtrule(ast, options);
    options.logger('mergeAtrule', ast);

    _2InitialMergeRuleset(ast);
    options.logger('initialMergeRuleset', ast);

    _3DisjoinRuleset(ast);
    options.logger('disjoinRuleset', ast);

    _4RestructShorthand(ast, indexer);
    options.logger('restructShorthand', ast);

    _6RestructBlock(ast);
    options.logger('restructBlock', ast);

    _7MergeRuleset(ast);
    options.logger('mergeRuleset', ast);

    _8RestructRuleset(ast);
    options.logger('restructRuleset', ast);
};

var List$6 = csstree_min.List;
var clone = csstree_min.clone;




var walk$b = csstree_min.walk;

function readChunk(children, specialComments) {
    var buffer = new List$6();
    var nonSpaceTokenInBuffer = false;
    var protectedComment;

    children.nextUntil(children.head, function(node, item, list) {
        if (node.type === 'Comment') {
            if (!specialComments || node.value.charAt(0) !== '!') {
                list.remove(item);
                return;
            }

            if (nonSpaceTokenInBuffer || protectedComment) {
                return true;
            }

            list.remove(item);
            protectedComment = node;
            return;
        }

        if (node.type !== 'WhiteSpace') {
            nonSpaceTokenInBuffer = true;
        }

        buffer.insert(list.remove(item));
    });

    return {
        comment: protectedComment,
        stylesheet: {
            type: 'StyleSheet',
            loc: null,
            children: buffer
        }
    };
}

function compressChunk(ast, firstAtrulesAllowed, num, options) {
    options.logger('Compress block #' + num, null, true);

    var seed = 1;

    if (ast.type === 'StyleSheet') {
        ast.firstAtrulesAllowed = firstAtrulesAllowed;
        ast.id = seed++;
    }

    walk$b(ast, {
        visit: 'Atrule',
        enter: function markScopes(node) {
            if (node.block !== null) {
                node.block.id = seed++;
            }
        }
    });
    options.logger('init', ast);

    // remove redundant
    clean(ast, options);
    options.logger('clean', ast);

    // replace nodes for shortened forms
    replace(ast);
    options.logger('replace', ast);

    // structure optimisations
    if (options.restructuring) {
        restructure(ast, options);
    }

    return ast;
}

function getCommentsOption(options) {
    var comments = 'comments' in options ? options.comments : 'exclamation';

    if (typeof comments === 'boolean') {
        comments = comments ? 'exclamation' : false;
    } else if (comments !== 'exclamation' && comments !== 'first-exclamation') {
        comments = false;
    }

    return comments;
}

function getRestructureOption(options) {
    if ('restructure' in options) {
        return options.restructure;
    }

    return 'restructuring' in options ? options.restructuring : true;
}

function wrapBlock(block) {
    return new List$6().appendData({
        type: 'Rule',
        loc: null,
        prelude: {
            type: 'SelectorList',
            loc: null,
            children: new List$6().appendData({
                type: 'Selector',
                loc: null,
                children: new List$6().appendData({
                    type: 'TypeSelector',
                    loc: null,
                    name: 'x'
                })
            })
        },
        block: block
    });
}

var compress = function compress(ast, options) {
    ast = ast || { type: 'StyleSheet', loc: null, children: new List$6() };
    options = options || {};

    var compressOptions = {
        logger: typeof options.logger === 'function' ? options.logger : function() {},
        restructuring: getRestructureOption(options),
        forceMediaMerge: Boolean(options.forceMediaMerge),
        usage: options.usage ? usage.buildIndex(options.usage) : false
    };
    var specialComments = getCommentsOption(options);
    var firstAtrulesAllowed = true;
    var input;
    var output = new List$6();
    var chunk;
    var chunkNum = 1;
    var chunkChildren;

    if (options.clone) {
        ast = clone(ast);
    }

    if (ast.type === 'StyleSheet') {
        input = ast.children;
        ast.children = output;
    } else {
        input = wrapBlock(ast);
    }

    do {
        chunk = readChunk(input, Boolean(specialComments));
        compressChunk(chunk.stylesheet, firstAtrulesAllowed, chunkNum++, compressOptions);
        chunkChildren = chunk.stylesheet.children;

        if (chunk.comment) {
            // add \n before comment if there is another content in output
            if (!output.isEmpty()) {
                output.insert(List$6.createItem({
                    type: 'Raw',
                    value: '\n'
                }));
            }

            output.insert(List$6.createItem(chunk.comment));

            // add \n after comment if chunk is not empty
            if (!chunkChildren.isEmpty()) {
                output.insert(List$6.createItem({
                    type: 'Raw',
                    value: '\n'
                }));
            }
        }

        if (firstAtrulesAllowed && !chunkChildren.isEmpty()) {
            var lastRule = chunkChildren.last();

            if (lastRule.type !== 'Atrule' ||
               (lastRule.name !== 'import' && lastRule.name !== 'charset')) {
                firstAtrulesAllowed = false;
            }
        }

        if (specialComments !== 'exclamation') {
            specialComments = false;
        }

        output.appendList(chunkChildren);
    } while (!input.isEmpty());

    return {
        ast: ast
    };
};

var _args = [
	[
		"csso@4.2.0",
		"/Users/bogdancadkin/host/svgo"
	]
];
var _from = "csso@4.2.0";
var _id = "csso@4.2.0";
var _inBundle = false;
var _integrity = "sha512-wvlcdIbf6pwKEk7vHj8/Bkc0B4ylXZruLvOgs9doS5eOsOpuodOV2zJChSpkp+pRpYQLQMeF04nr3Z68Sta9jA==";
var _location = "/csso";
var _phantomChildren = {
};
var _requested = {
	type: "version",
	registry: true,
	raw: "csso@4.2.0",
	name: "csso",
	escapedName: "csso",
	rawSpec: "4.2.0",
	saveSpec: null,
	fetchSpec: "4.2.0"
};
var _requiredBy = [
	"/"
];
var _resolved = "https://registry.npmjs.org/csso/-/csso-4.2.0.tgz";
var _spec = "4.2.0";
var _where = "/Users/bogdancadkin/host/svgo";
var author = {
	name: "Sergey Kryzhanovsky",
	email: "skryzhanovsky@ya.ru",
	url: "https://github.com/afelix"
};
var bugs = {
	url: "https://github.com/css/csso/issues"
};
var dependencies = {
	"css-tree": "^1.1.2"
};
var description$g = "CSS minifier with structural optimisations";
var devDependencies = {
	"@rollup/plugin-commonjs": "^11.0.1",
	"@rollup/plugin-json": "^4.0.1",
	"@rollup/plugin-node-resolve": "^7.0.0",
	coveralls: "^3.0.11",
	eslint: "^6.8.0",
	mocha: "^7.1.1",
	nyc: "^15.0.0",
	rollup: "^1.29.0",
	"source-map": "^0.6.1",
	terser: "^4.6.3"
};
var engines = {
	node: ">=8.0.0"
};
var files = [
	"dist",
	"lib"
];
var homepage = "https://github.com/css/csso";
var keywords = [
	"css",
	"compress",
	"minifier",
	"minify",
	"optimise",
	"optimisation",
	"csstree"
];
var license = "MIT";
var main = "./lib/index";
var maintainers = [
	{
		name: "Roman Dvornov",
		email: "rdvornov@gmail.com"
	}
];
var name = "csso";
var repository = {
	type: "git",
	url: "git+https://github.com/css/csso.git"
};
var scripts = {
	build: "rollup --config && terser dist/csso.js --compress --mangle -o dist/csso.min.js",
	coverage: "nyc npm test",
	coveralls: "nyc report --reporter=text-lcov | coveralls",
	hydrogen: "node --trace-hydrogen --trace-phase=Z --trace-deopt --code-comments --hydrogen-track-positions --redirect-code-traces --redirect-code-traces-to=code.asm --trace_hydrogen_file=code.cfg --print-opt-code bin/csso --stat -o /dev/null",
	lint: "eslint lib test",
	"lint-and-test": "npm run lint && npm test",
	prepublishOnly: "npm run build",
	test: "mocha --reporter dot",
	travis: "nyc npm run lint-and-test && npm run coveralls"
};
var version = "4.2.0";
var require$$0 = {
	_args: _args,
	_from: _from,
	_id: _id,
	_inBundle: _inBundle,
	_integrity: _integrity,
	_location: _location,
	_phantomChildren: _phantomChildren,
	_requested: _requested,
	_requiredBy: _requiredBy,
	_resolved: _resolved,
	_spec: _spec,
	_where: _where,
	author: author,
	bugs: bugs,
	dependencies: dependencies,
	description: description$g,
	devDependencies: devDependencies,
	engines: engines,
	files: files,
	homepage: homepage,
	keywords: keywords,
	license: license,
	main: main,
	maintainers: maintainers,
	name: name,
	repository: repository,
	scripts: scripts,
	version: version
};

var parse = csstree_min.parse;

var generate$5 = csstree_min.generate;

function debugOutput(name, options, startTime, data) {
    if (options.debug) {
        console.error('## ' + name + ' done in %d ms\n', Date.now() - startTime);
    }

    return data;
}

function createDefaultLogger(level) {
    var lastDebug;

    return function logger(title, ast) {
        var line = title;

        if (ast) {
            line = '[' + ((Date.now() - lastDebug) / 1000).toFixed(3) + 's] ' + line;
        }

        if (level > 1 && ast) {
            var css = generate$5(ast);

            // when level 2, limit css to 256 symbols
            if (level === 2 && css.length > 256) {
                css = css.substr(0, 256) + '...';
            }

            line += '\n  ' + css + '\n';
        }

        console.error(line);
        lastDebug = Date.now();
    };
}

function copy(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
}

function buildCompressOptions(options) {
    options = copy(options);

    if (typeof options.logger !== 'function' && options.debug) {
        options.logger = createDefaultLogger(options.debug);
    }

    return options;
}

function runHandler(ast, options, handlers) {
    if (!Array.isArray(handlers)) {
        handlers = [handlers];
    }

    handlers.forEach(function(fn) {
        fn(ast, options);
    });
}

function minify(context, source, options) {
    options = options || {};

    var filename = options.filename || '<unknown>';
    var result;

    // parse
    var ast = debugOutput('parsing', options, Date.now(),
        parse(source, {
            context: context,
            filename: filename,
            positions: Boolean(options.sourceMap)
        })
    );

    // before compress handlers
    if (options.beforeCompress) {
        debugOutput('beforeCompress', options, Date.now(),
            runHandler(ast, options, options.beforeCompress)
        );
    }

    // compress
    var compressResult = debugOutput('compress', options, Date.now(),
        compress(ast, buildCompressOptions(options))
    );

    // after compress handlers
    if (options.afterCompress) {
        debugOutput('afterCompress', options, Date.now(),
            runHandler(compressResult, options, options.afterCompress)
        );
    }

    // generate
    if (options.sourceMap) {
        result = debugOutput('generate(sourceMap: true)', options, Date.now(), (function() {
            var tmp = generate$5(compressResult.ast, { sourceMap: true });
            tmp.map._file = filename; // since other tools can relay on file in source map transform chain
            tmp.map.setSourceContent(filename, source);
            return tmp;
        }()));
    } else {
        result = debugOutput('generate', options, Date.now(), {
            css: generate$5(compressResult.ast),
            map: null
        });
    }

    return result;
}

function minifyStylesheet(source, options) {
    return minify('stylesheet', source, options);
}

function minifyBlock(source, options) {
    return minify('declarationList', source, options);
}

var lib = {
    version: require$$0.version,

    // main methods
    minify: minifyStylesheet,
    minifyBlock: minifyBlock,

    // css syntax parser/walkers/generator/etc
    syntax: Object.assign({
        compress: compress
    }, csstree_min)
};

var type$g = 'full';

var active$g = true;

var description$h = 'minifies styles and removes unused styles based on usage data';

var params$b = {
    // ... CSSO options goes here

    // additional 
    usage: {
        force: false,  // force to use usage data even if it unsafe (document contains <script> or on* attributes)
        ids: true,
        classes: true,
        tags: true
    }
};



/**
 * Minifies styles (<style> element + style attribute) using CSSO
 *
 * @author strarsis <strarsis@gmail.com>
 */
var fn$g = function(ast, options) {
    options = options || {};

    var minifyOptionsForStylesheet = cloneObject(options);
    var minifyOptionsForAttribute = cloneObject(options);
    var elems = findStyleElems(ast);

    minifyOptionsForStylesheet.usage = collectUsageData(ast, options);
    minifyOptionsForAttribute.usage = null;

    elems.forEach(function(elem) {
        if (elem.isElem('style')) {
            // <style> element
            var styleCss = elem.content[0].text || elem.content[0].cdata || [];
            var DATA = styleCss.indexOf('>') >= 0 || styleCss.indexOf('<') >= 0 ? 'cdata' : 'text';

            elem.content[0][DATA] = lib.minify(styleCss, minifyOptionsForStylesheet).css;
        } else {
            // style attribute
            var elemStyle = elem.attr('style').value;

            elem.attr('style').value = lib.minifyBlock(elemStyle, minifyOptionsForAttribute).css;
        }
    });

    return ast;
};

function cloneObject(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
}

function findStyleElems(ast) {

    function walk(items, styles) {
        for (var i = 0; i < items.content.length; i++) {
            var item = items.content[i];

            // go deeper
            if (item.content) {
                walk(item, styles);
            }

            if (item.isElem('style') && !item.isEmpty()) {
                styles.push(item);
            } else if (item.isElem() && item.hasAttr('style')) {
                styles.push(item);
            }
        }

        return styles;
    }

    return walk(ast, []);
}

function shouldFilter(options, name) {
    if ('usage' in options === false) {
        return true;
    }

    if (options.usage && name in options.usage === false) {
        return true;
    }

    return Boolean(options.usage && options.usage[name]);
}

function collectUsageData(ast, options) {

    function walk(items, usageData) {
        for (var i = 0; i < items.content.length; i++) {
            var item = items.content[i];

            // go deeper
            if (item.content) {
                walk(item, usageData);
            }

            if (item.isElem('script')) {
                safe = false;
            }

            if (item.isElem()) {
                usageData.tags[item.elem] = true;

                if (item.hasAttr('id')) {
                    usageData.ids[item.attr('id').value] = true;
                }

                if (item.hasAttr('class')) {
                    item.attr('class').value.replace(/^\s+|\s+$/g, '').split(/\s+/).forEach(function(className) {
                        usageData.classes[className] = true;
                    });
                }

                if (item.attrs && Object.keys(item.attrs).some(function(name) { return /^on/i.test(name); })) {
                    safe = false;
                }
            }
        }

        return usageData;
    }

    var safe = true;
    var usageData = {};
    var hasData = false;
    var rawData = walk(ast, {
        ids: Object.create(null),
        classes: Object.create(null),
        tags: Object.create(null)
    });

    if (!safe && options.usage && options.usage.force) {
        safe = true;
    }

    for (var key in rawData) {
        if (shouldFilter(options, key)) {
            usageData[key] = Object.keys(rawData[key]);
            hasData = true;
        }
    }

    return safe && hasData ? usageData : null;
}

var minifyStyles = {
	type: type$g,
	active: active$g,
	description: description$h,
	params: params$b,
	fn: fn$g
};

var type$h = 'perItemReverse';

var active$h = true;

var description$i = 'moves elements attributes to the existing group wrapper';

var inheritableAttrs$1 = _collections.inheritableAttrs,
    pathElems$2 = _collections.pathElems;

/**
 * Collapse content's intersected and inheritable
 * attributes to the existing group wrapper.
 *
 * @example
 * <g attr1="val1">
 *     <g attr2="val2">
 *         text
 *     </g>
 *     <circle attr2="val2" attr3="val3"/>
 * </g>
 *              ⬇
 * <g attr1="val1" attr2="val2">
 *     <g>
 *         text
 *     </g>
 *    <circle attr3="val3"/>
 * </g>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$h = function(item) {

    if (item.isElem('g') && !item.isEmpty() && item.content.length > 1) {

        var intersection = {},
            hasTransform = false,
            hasClip = item.hasAttr('clip-path') || item.hasAttr('mask'),
            intersected = item.content.every(function(inner) {
                if (inner.isElem() && inner.hasAttr()) {
                    // don't mess with possible styles (hack until CSS parsing is implemented)
                    if (inner.hasAttr('class')) return false;
                    if (!Object.keys(intersection).length) {
                        intersection = inner.attrs;
                    } else {
                        intersection = intersectInheritableAttrs(intersection, inner.attrs);

                        if (!intersection) return false;
                    }

                    return true;
                }
            }),
            allPath = item.content.every(function(inner) {
                return inner.isElem(pathElems$2);
            });

        if (intersected) {

            item.content.forEach(function(g) {

                for (var name in intersection) {

                    if (!allPath && !hasClip || name !== 'transform') {

                        g.removeAttr(name);

                        if (name === 'transform') {
                            if (!hasTransform) {
                                if (item.hasAttr('transform')) {
                                    item.attr('transform').value += ' ' + intersection[name].value;
                                } else {
                                    item.addAttr(intersection[name]);
                                }

                                hasTransform = true;
                            }
                        } else {
                            item.addAttr(intersection[name]);
                        }

                    }
                }

            });

        }

    }

};

/**
 * Intersect inheritable attributes.
 *
 * @param {Object} a first attrs object
 * @param {Object} b second attrs object
 *
 * @return {Object} intersected attrs object
 */
function intersectInheritableAttrs(a, b) {

    var c = {};

    for (var n in a) {
        if (
            // eslint-disable-next-line no-prototype-builtins
            b.hasOwnProperty(n) &&
            inheritableAttrs$1.indexOf(n) > -1 &&
            a[n].name === b[n].name &&
            a[n].value === b[n].value &&
            a[n].prefix === b[n].prefix &&
            a[n].local === b[n].local
        ) {
            c[n] = a[n];
        }
    }

    if (!Object.keys(c).length) return false;

    return c;

}

var moveElemsAttrsToGroup = {
	type: type$h,
	active: active$h,
	description: description$i,
	fn: fn$h
};

var type$i = 'perItem';

var active$i = true;

var description$j = 'moves some group attributes to the content elements';

var pathElems$3 = _collections.pathElems.concat(['g', 'text']),
    referencesProps$2 = _collections.referencesProps;

/**
 * Move group attrs to the content elements.
 *
 * @example
 * <g transform="scale(2)">
 *     <path transform="rotate(45)" d="M0,0 L10,20"/>
 *     <path transform="translate(10, 20)" d="M0,10 L20,30"/>
 * </g>
 *                          ⬇
 * <g>
 *     <path transform="scale(2) rotate(45)" d="M0,0 L10,20"/>
 *     <path transform="scale(2) translate(10, 20)" d="M0,10 L20,30"/>
 * </g>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$i = function(item) {

    // move group transform attr to content's pathElems
    if (
        item.isElem('g') &&
        item.hasAttr('transform') &&
        !item.isEmpty() &&
        !item.someAttr(function(attr) {
            return ~referencesProps$2.indexOf(attr.name) && ~attr.value.indexOf('url(');
        }) &&
        item.content.every(function(inner) {
            return inner.isElem(pathElems$3) && !inner.hasAttr('id');
        })
    ) {
        item.content.forEach(function(inner) {
            var attr = item.attr('transform');
            if (inner.hasAttr('transform')) {
                inner.attr('transform').value = attr.value + ' ' + inner.attr('transform').value;
            } else {
                inner.addAttr({
                    'name': attr.name,
                    'local': attr.local,
                    'prefix': attr.prefix,
                    'value': attr.value
                });
            }
        });

        item.removeAttr('transform');
    }

};

var moveGroupAttrsToElems = {
	type: type$i,
	active: active$i,
	description: description$j,
	fn: fn$i
};

var type$j = 'perItem';

var active$j = false;

var params$c = {
    delim: '__',
    prefixIds: true,
    prefixClassNames: true,
};

var description$k = 'prefix IDs';

var referencesProps$3 = _collections.referencesProps,
    rxId = /^#(.*)$/, // regular expression for matching an ID + extracing its name
    addPrefix = null;

const unquote = (string) => {
  const first = string.charAt(0);
  if (first === "'" || first === '"') {
    if (first === string.charAt(string.length - 1)) {
      return string.slice(1, -1);
    }
  }
  return string;
};

// Escapes a string for being used as ID
var escapeIdentifierName = function(str) {
    return str.replace(/[. ]/g, '_');
};

// Matches an #ID value, captures the ID name
var matchId = function(urlVal) {
    var idUrlMatches = urlVal.match(rxId);
    if (idUrlMatches === null) {
        return false;
    }
    return idUrlMatches[1];
};

// Matches an url(...) value, captures the URL
var matchUrl = function(val) {
    var urlMatches = /url\((.*?)\)/gi.exec(val);
    if (urlMatches === null) {
        return false;
    }
    return urlMatches[1];
};

// Checks if attribute is empty
var attrNotEmpty = function(attr) {
    return (attr && attr.value && attr.value.length > 0);
};

// prefixes an #ID
var prefixId = function(val) {
    var idName = matchId(val);
    if (!idName) {
        return false;
    }
    return '#' + addPrefix(idName);
};


// attr.value helper methods

// prefixes a class attribute value
var addPrefixToClassAttr = function(attr) {
    if (!attrNotEmpty(attr)) {
        return;
    }

    attr.value = attr.value.split(/\s+/).map(addPrefix).join(' ');
};

// prefixes an ID attribute value
var addPrefixToIdAttr = function(attr) {
    if (!attrNotEmpty(attr)) {
        return;
    }

    attr.value = addPrefix(attr.value);
};

// prefixes a href attribute value
var addPrefixToHrefAttr = function(attr) {
    if (!attrNotEmpty(attr)) {
        return;
    }

    var idPrefixed = prefixId(attr.value);
    if (!idPrefixed) {
        return;
    }
    attr.value = idPrefixed;
};

// prefixes an URL attribute value
var addPrefixToUrlAttr = function(attr) {
    if (!attrNotEmpty(attr)) {
        return;
    }

    // url(...) in value
    var urlVal = matchUrl(attr.value);
    if (!urlVal) {
        return;
    }

    var idPrefixed = prefixId(urlVal);
    if (!idPrefixed) {
        return;
    }

    attr.value = 'url(' + idPrefixed + ')';
};

// prefixes begin/end attribute value
var addPrefixToBeginEndAttr = function(attr) {
    if (!attrNotEmpty(attr)) {
        return;
    }

    var parts = attr.value.split('; ').map(function(val) {
        val = val.trim();

        if (val.endsWith('.end') || val.endsWith('.start')) {
            var idPostfix = val.split('.'),
                id = idPostfix[0],
                postfix = idPostfix[1];

            var idPrefixed = prefixId(`#${id}`);

            if (!idPrefixed) {
                return val;
            }

            idPrefixed = idPrefixed.slice(1);
            return `${idPrefixed}.${postfix}`;
        } else {
            return val;
        }
    });

    attr.value = parts.join('; ');
};

const getBasename = (path) => {
  // extract everything after latest slash or backslash
  const matched = path.match(/[/\\]([^/\\]+)$/);
  if (matched) {
    return matched[1];
  }
  return '';
};

/**
 * Prefixes identifiers
 *
 * @param {Object} node node
 * @param {Object} opts plugin params
 * @param {Object} extra plugin extra information
 *
 * @author strarsis <strarsis@gmail.com>
 */
var fn$j = function(node, opts, extra) {

    // skip subsequent passes when multipass is used
    if(extra.multipassCount && extra.multipassCount > 0) {
        return node;
    }

    // prefix, from file name or option
    var prefix = 'prefix';
    if (opts.prefix) {
        if (typeof opts.prefix === 'function') {
            prefix = opts.prefix(node, extra);
        } else {
            prefix = opts.prefix;
        }
    } else if (opts.prefix === false) {
        prefix = false;
    } else if (extra && extra.path && extra.path.length > 0) {
        var filename = getBasename(extra.path);
        prefix = filename;
    }


    // prefixes a normal value
    addPrefix = function(name) {
        if(prefix === false){
            return escapeIdentifierName(name);
        }
        return escapeIdentifierName(prefix + opts.delim + name);
    };


    // <style/> property values

    if (node.elem === 'style') {
        if (node.isEmpty()) {
            // skip empty <style/>s
            return node;
        }

        var cssStr = node.content[0].text || node.content[0].cdata || [];

        var cssAst = {};
        try {
            cssAst = csstree_min.parse(cssStr, {
                parseValue: true,
                parseCustomProperty: false
            });
        } catch (parseError) {
            console.warn('Warning: Parse error of styles of <style/> element, skipped. Error details: ' + parseError);
            return node;
        }

        var idPrefixed = '';
        csstree_min.walk(cssAst, function(node) {

            // #ID, .class
            if (((opts.prefixIds        && node.type === 'IdSelector') ||
                 (opts.prefixClassNames && node.type === 'ClassSelector')) &&
                 node.name) {
                node.name = addPrefix(node.name);
                return;
            }

            // url(...) in value
            if (node.type === 'Url' &&
                node.value.value && node.value.value.length > 0) {
                idPrefixed = prefixId(unquote(node.value.value));
                if (!idPrefixed) {
                    return;
                }
                node.value.value = idPrefixed;
            }

        });

        // update <style>s
        node.content[0].text = csstree_min.generate(cssAst);
        return node;
    }


    // element attributes

    if (!node.attrs) {
        return node;
    }


    // Nodes

    if(opts.prefixIds) {
        // ID
        addPrefixToIdAttr(node.attrs.id);
    }

    if(opts.prefixClassNames) {
        // Class
        addPrefixToClassAttr(node.attrs.class);
    }


    // References

    // href
    addPrefixToHrefAttr(node.attrs.href);

    // (xlink:)href (deprecated, must be still supported)
    addPrefixToHrefAttr(node.attrs['xlink:href']);

    // (referenceable) properties
    for (var referencesProp of referencesProps$3) {
        addPrefixToUrlAttr(node.attrs[referencesProp]);
    }

    addPrefixToBeginEndAttr(node.attrs.begin);
    addPrefixToBeginEndAttr(node.attrs.end);

    return node;
};

var prefixIds = {
	type: type$j,
	active: active$j,
	params: params$c,
	description: description$k,
	fn: fn$j
};

var type$k = 'perItem';

var active$k = false;

var description$l = 'removes attributes of elements that match a css selector';


/**
 * Removes attributes of elements that match a css selector.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @example
 * <caption>A selector removing a single attribute</caption>
 * plugins:
 *   - removeAttributesBySelector:
 *       selector: "[fill='#00ff00']"
 *       attributes: "fill"
 *
 * <rect x="0" y="0" width="100" height="100" fill="#00ff00" stroke="#00ff00"/>
 *   ↓
 * <rect x="0" y="0" width="100" height="100" stroke="#00ff00"/>     
 *
 * <caption>A selector removing multiple attributes</caption>
 * plugins:
 *   - removeAttributesBySelector:
 *       selector: "[fill='#00ff00']"
 *       attributes:
 *         - fill
 *         - stroke
 *
 * <rect x="0" y="0" width="100" height="100" fill="#00ff00" stroke="#00ff00"/>
 *   ↓
 * <rect x="0" y="0" width="100" height="100"/>     
 *
 * <caption>Multiple selectors removing attributes</caption>
 * plugins:
 *   - removeAttributesBySelector:
 *       selectors:
 *         - selector: "[fill='#00ff00']"
 *           attributes: "fill"
 *
 *         - selector: "#remove"
 *           attributes:
 *             - stroke
 *             - id
 *
 * <rect x="0" y="0" width="100" height="100" fill="#00ff00" stroke="#00ff00"/>
 *   ↓
 * <rect x="0" y="0" width="100" height="100"/>
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors|MDN CSS Selectors}
 *
 * @author Bradley Mease
 */
var fn$k = function(item, params) {

    var selectors = Array.isArray(params.selectors) ? params.selectors : [params];

    selectors.map(function(i) {
        if (item.matches(i.selector)) {
            item.removeAttr(i.attributes);
        }
    });

};

var removeAttributesBySelector = {
	type: type$k,
	active: active$k,
	description: description$l,
	fn: fn$k
};

var DEFAULT_SEPARATOR = ':';

var type$l = 'perItem';

var active$l = false;

var description$m = 'removes specified attributes';

var params$d = {
    elemSeparator: DEFAULT_SEPARATOR,
    preserveCurrentColor: false,
    attrs: []
};

/**
 * Remove attributes
 *
 * @param elemSeparator
 *   format: string
 *
 * @param preserveCurrentColor
 *   format: boolean
 *
 * @param attrs:
 *
 *   format: [ element* : attribute* : value* ]
 *
 *   element   : regexp (wrapped into ^...$), single * or omitted > all elements (must be present when value is used)
 *   attribute : regexp (wrapped into ^...$)
 *   value     : regexp (wrapped into ^...$), single * or omitted > all values
 *
 *   examples:
 *
 *     > basic: remove fill attribute
 *     ---
 *     removeAttrs:
 *       attrs: 'fill'
 *
 *     > remove fill attribute on path element
 *     ---
 *       attrs: 'path:fill'
 *
 *     > remove fill attribute on path element where value is none
 *     ---
 *       attrs: 'path:fill:none'
 *
 *
 *     > remove all fill and stroke attribute
 *     ---
 *       attrs:
 *         - 'fill'
 *         - 'stroke'
 *
 *     [is same as]
 *
 *       attrs: '(fill|stroke)'
 *
 *     [is same as]
 *
 *       attrs: '*:(fill|stroke)'
 *
 *     [is same as]
 *
 *       attrs: '.*:(fill|stroke)'
 *
 *     [is same as]
 *
 *       attrs: '.*:(fill|stroke):.*'
 *
 *
 *     > remove all stroke related attributes
 *     ----
 *     attrs: 'stroke.*'
 *
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Benny Schudel
 */
var fn$l = function(item, params) {
        // wrap into an array if params is not
    if (!Array.isArray(params.attrs)) {
        params.attrs = [params.attrs];
    }

    if (item.isElem()) {
        var elemSeparator = typeof params.elemSeparator == 'string' ? params.elemSeparator : DEFAULT_SEPARATOR;
        var preserveCurrentColor = typeof params.preserveCurrentColor == 'boolean' ? params.preserveCurrentColor : false;

            // prepare patterns
        var patterns = params.attrs.map(function(pattern) {

                // if no element separators (:), assume it's attribute name, and apply to all elements *regardless of value*
            if (pattern.indexOf(elemSeparator) === -1) {
                pattern = ['.*', elemSeparator, pattern, elemSeparator, '.*'].join('');

                // if only 1 separator, assume it's element and attribute name, and apply regardless of attribute value
            } else if (pattern.split(elemSeparator).length < 3) {
                pattern = [pattern, elemSeparator, '.*'].join('');
            }

                // create regexps for element, attribute name, and attribute value
            return pattern.split(elemSeparator)
                .map(function(value) {

                        // adjust single * to match anything
                    if (value === '*') { value = '.*'; }

                    return new RegExp(['^', value, '$'].join(''), 'i');
                });

        });

            // loop patterns
        patterns.forEach(function(pattern) {

                // matches element
            if (pattern[0].test(item.elem)) {

                    // loop attributes
                item.eachAttr(function(attr) {
                    var name = attr.name;
                    var value = attr.value;
                    var isFillCurrentColor = preserveCurrentColor && name == 'fill' && value == 'currentColor';
                    var isStrokeCurrentColor = preserveCurrentColor && name == 'stroke' && value == 'currentColor';

                    if (!(isFillCurrentColor || isStrokeCurrentColor)) {
                        // matches attribute name
                        if (pattern[1].test(name)) {

                            // matches attribute value
                            if (pattern[2].test(attr.value)) {
                                item.removeAttr(name);
                            }
                        }
                    }

                });

            }

        });

    }

};

var removeAttrs = {
	type: type$l,
	active: active$l,
	description: description$m,
	params: params$d,
	fn: fn$l
};

var type$m = 'perItem';

var active$m = true;

var description$n = 'removes comments';

/**
 * Remove comments.
 *
 * @example
 * <!-- Generator: Adobe Illustrator 15.0.0, SVG Export
 * Plug-In . SVG Version: 6.00 Build 0)  -->
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$m = function(item) {

    if (item.comment && item.comment.charAt(0) !== '!') {
        return false;
    }

};

var removeComments = {
	type: type$m,
	active: active$m,
	description: description$n,
	fn: fn$m
};

var type$n = 'perItem';

var active$n = true;

var params$e = {
    removeAny: true
};

var description$o = 'removes <desc>';

var standardDescs = /^(Created with|Created using)/;

/**
 * Removes <desc>.
 * Removes only standard editors content or empty elements 'cause it can be used for accessibility.
 * Enable parameter 'removeAny' to remove any description.
 *
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Daniel Wabyick
 */
var fn$n = function(item, params) {

    return !item.isElem('desc') || !(params.removeAny || item.isEmpty() ||
            standardDescs.test(item.content[0].text));

};

var removeDesc = {
	type: type$n,
	active: active$n,
	params: params$e,
	description: description$o,
	fn: fn$n
};

var type$o = 'perItem';

var active$o = false;

var description$p = 'removes width and height in presence of viewBox (opposite to removeViewBox, disable it first)';

/**
 * Remove width/height attributes and add the viewBox attribute if it's missing
 *
 * @example
 * <svg width="100" height="50" />
 *   ↓
 * <svg viewBox="0 0 100 50" />
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if true, with and height will be filtered out
 *
 * @author Benny Schudel
 */
var fn$o = function(item) {

    if (item.isElem('svg')) {
        if (item.hasAttr('viewBox')) {
            item.removeAttr('width');
            item.removeAttr('height');
        } else if (
            item.hasAttr('width') &&
            item.hasAttr('height') &&
            !isNaN(Number(item.attr('width').value)) &&
            !isNaN(Number(item.attr('height').value))
        ) {
            item.addAttr({
                name: 'viewBox',
                value:
                    '0 0 ' +
                    Number(item.attr('width').value) +
                    ' ' +
                    Number(item.attr('height').value),
                prefix: '',
                local: 'viewBox'
            });
            item.removeAttr('width');
            item.removeAttr('height');
        }
    }

};

var removeDimensions = {
	type: type$o,
	active: active$o,
	description: description$p,
	fn: fn$o
};

var type$p = 'perItem';

var active$p = true;

var description$q = 'removes doctype declaration';

/**
 * Remove DOCTYPE declaration.
 *
 * "Unfortunately the SVG DTDs are a source of so many
 * issues that the SVG WG has decided not to write one
 * for the upcoming SVG 1.2 standard. In fact SVG WG
 * members are even telling people not to use a DOCTYPE
 * declaration in SVG 1.0 and 1.1 documents"
 * https://jwatt.org/svg/authoring/#doctype-declaration
 *
 * @example
 * <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
 * q"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
 *
 * @example
 * <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
 * "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" [
 *     <!-- an internal subset can be embedded here -->
 * ]>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$p = function(item) {

    if (item.doctype) {
        return false;
    }

};

var removeDoctype = {
	type: type$p,
	active: active$p,
	description: description$q,
	fn: fn$p
};

var type$q = 'perItem';

var active$q = true;

var description$r = 'removes editors namespaces, elements and attributes';

var editorNamespaces$1 = _collections.editorNamespaces,
    prefixes = [];

var params$f = {
    additionalNamespaces: []
};

/**
 * Remove editors namespaces, elements and attributes.
 *
 * @example
 * <svg xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd">
 * <sodipodi:namedview/>
 * <path sodipodi:nodetypes="cccc"/>
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$q = function(item, params) {

    if (Array.isArray(params.additionalNamespaces)) {
        editorNamespaces$1 = editorNamespaces$1.concat(params.additionalNamespaces);
    }

    if (item.elem) {

        if (item.isElem('svg')) {

            item.eachAttr(function(attr) {
                if (attr.prefix === 'xmlns' && editorNamespaces$1.indexOf(attr.value) > -1) {
                    prefixes.push(attr.local);

                    // <svg xmlns:sodipodi="">
                    item.removeAttr(attr.name);
                }
            });

        }

        // <* sodipodi:*="">
        item.eachAttr(function(attr) {
            if (prefixes.indexOf(attr.prefix) > -1) {
                item.removeAttr(attr.name);
            }
        });

        // <sodipodi:*>
        if (prefixes.indexOf(item.prefix) > -1) {
            return false;
        }

    }

};

var removeEditorsNSData = {
	type: type$q,
	active: active$q,
	description: description$r,
	params: params$f,
	fn: fn$q
};

var type$r = 'perItem';

var active$r = false;

var description$s = 'removes arbitrary elements by ID or className (disabled by default)';

var params$g = {
  id: [],
  class: []
};

/**
 * Remove arbitrary SVG elements by ID or className.
 *
 * @param id
 *   examples:
 *
 *     > single: remove element with ID of `elementID`
 *     ---
 *     removeElementsByAttr:
 *       id: 'elementID'
 *
 *     > list: remove multiple elements by ID
 *     ---
 *     removeElementsByAttr:
 *       id:
 *         - 'elementID'
 *         - 'anotherID'
 *
 * @param class
 *   examples:
 *
 *     > single: remove all elements with class of `elementClass`
 *     ---
 *     removeElementsByAttr:
 *       class: 'elementClass'
 *
 *     > list: remove all elements with class of `elementClass` or `anotherClass`
 *     ---
 *     removeElementsByAttr:
 *       class:
 *         - 'elementClass'
 *         - 'anotherClass'
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Eli Dupuis (@elidupuis)
 */
var fn$r = function(item, params) {
  // wrap params in an array if not already
  ['id', 'class'].forEach(function(key) {
    if (!Array.isArray(params[key])) {
      params[key] = [ params[key] ];
    }
  });

  // abort if current item is no an element
  if (!item.isElem()) {
    return;
  }

  // remove element if it's `id` matches configured `id` params
  const elemId = item.attr('id');
  if (elemId && params.id.length !== 0) {
    return params.id.includes(elemId.value) === false;
  }

  // remove element if it's `class` contains any of the configured `class` params
  const elemClass = item.attr('class');
  if (elemClass && params.class.length !== 0) {
    const classList = elemClass.value.split(' ');
    return params.class.some(item => classList.includes(item)) === false;
  }
};

var removeElementsByAttr = {
	type: type$r,
	active: active$r,
	description: description$s,
	params: params$g,
	fn: fn$r
};

var type$s = 'perItem';

var active$s = true;

var description$t = 'removes empty attributes';

/**
 * Remove attributes with empty values.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$s = function(item) {

    if (item.elem) {

        item.eachAttr(function(attr) {
            if (attr.value === '') {
                item.removeAttr(attr.name);
            }
        });

    }

};

var removeEmptyAttrs = {
	type: type$s,
	active: active$s,
	description: description$t,
	fn: fn$s
};

var type$t = 'perItemReverse';

var active$t = true;

var description$u = 'removes empty container elements';

var container = _collections.elemsGroups.container;

/**
 * Remove empty containers.
 *
 * @see http://www.w3.org/TR/SVG/intro.html#TermContainerElement
 *
 * @example
 * <defs/>
 *
 * @example
 * <g><marker><a/></marker></g>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$t = function(item) {

    return !(item.isElem(container) && !item.isElem('svg') && item.isEmpty() &&
        (!item.isElem('pattern') || !item.hasAttrLocal('href')));

};

var removeEmptyContainers = {
	type: type$t,
	active: active$t,
	description: description$u,
	fn: fn$t
};

var type$u = 'perItem';

var active$u = true;

var description$v = 'removes empty <text> elements';

var params$h = {
    text: true,
    tspan: true,
    tref: true
};

/**
 * Remove empty Text elements.
 *
 * @see http://www.w3.org/TR/SVG/text.html
 *
 * @example
 * Remove empty text element:
 * <text/>
 *
 * Remove empty tspan element:
 * <tspan/>
 *
 * Remove tref with empty xlink:href attribute:
 * <tref xlink:href=""/>
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$u = function(item, params) {

    // Remove empty text element
    if (
        params.text &&
        item.isElem('text') &&
        item.isEmpty()
    ) return false;

    // Remove empty tspan element
    if (
        params.tspan &&
        item.isElem('tspan') &&
        item.isEmpty()
    ) return false;

    // Remove tref with empty xlink:href attribute
    if (
        params.tref &&
        item.isElem('tref') &&
        !item.hasAttrLocal('href')
    ) return false;

};

var removeEmptyText = {
	type: type$u,
	active: active$u,
	description: description$v,
	params: params$h,
	fn: fn$u
};

var type$v = 'perItem';

var active$v = true;

var description$w = 'removes hidden elements (zero sized, with absent attributes)';

var params$i = {
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
    polygonEmptyPoints: true
};

var regValidPath = /M\s*(?:[-+]?(?:\d*\.\d+|\d+(?:\.|(?!\.)))([eE][-+]?\d+)?(?!\d)\s*,?\s*){2}\D*\d/i;

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
var fn$v = function (item, params) {

    if (item.elem) {
        // Removes hidden elements
        // https://www.w3schools.com/cssref/pr_class_visibility.asp
        if (
            params.isHidden &&
            item.hasAttr('visibility', 'hidden')
        ) return false;

        // display="none"
        //
        // http://www.w3.org/TR/SVG/painting.html#DisplayProperty
        // "A value of display: none indicates that the given element
        // and its children shall not be rendered directly"
        if (
            params.displayNone &&
            item.hasAttr('display', 'none')
        ) return false;

        // opacity="0"
        //
        // http://www.w3.org/TR/SVG/masking.html#ObjectAndGroupOpacityProperties
        if (
            params.opacity0 &&
            item.hasAttr('opacity', '0')
        ) return false;

        // Circles with zero radius
        //
        // http://www.w3.org/TR/SVG/shapes.html#CircleElementRAttribute
        // "A value of zero disables rendering of the element"
        //
        // <circle r="0">
        if (
            params.circleR0 &&
            item.isElem('circle') &&
            item.isEmpty() &&
            item.hasAttr('r', '0')
        ) return false;

        // Ellipse with zero x-axis radius
        //
        // http://www.w3.org/TR/SVG/shapes.html#EllipseElementRXAttribute
        // "A value of zero disables rendering of the element"
        //
        // <ellipse rx="0">
        if (
            params.ellipseRX0 &&
            item.isElem('ellipse') &&
            item.isEmpty() &&
            item.hasAttr('rx', '0')
        ) return false;

        // Ellipse with zero y-axis radius
        //
        // http://www.w3.org/TR/SVG/shapes.html#EllipseElementRYAttribute
        // "A value of zero disables rendering of the element"
        //
        // <ellipse ry="0">
        if (
            params.ellipseRY0 &&
            item.isElem('ellipse') &&
            item.isEmpty() &&
            item.hasAttr('ry', '0')
        ) return false;

        // Rectangle with zero width
        //
        // http://www.w3.org/TR/SVG/shapes.html#RectElementWidthAttribute
        // "A value of zero disables rendering of the element"
        //
        // <rect width="0">
        if (
            params.rectWidth0 &&
            item.isElem('rect') &&
            item.isEmpty() &&
            item.hasAttr('width', '0')
        ) return false;

        // Rectangle with zero height
        //
        // http://www.w3.org/TR/SVG/shapes.html#RectElementHeightAttribute
        // "A value of zero disables rendering of the element"
        //
        // <rect height="0">
        if (
            params.rectHeight0 &&
            params.rectWidth0 &&
            item.isElem('rect') &&
            item.isEmpty() &&
            item.hasAttr('height', '0')
        ) return false;

        // Pattern with zero width
        //
        // http://www.w3.org/TR/SVG/pservers.html#PatternElementWidthAttribute
        // "A value of zero disables rendering of the element (i.e., no paint is applied)"
        //
        // <pattern width="0">
        if (
            params.patternWidth0 &&
            item.isElem('pattern') &&
            item.hasAttr('width', '0')
        ) return false;

        // Pattern with zero height
        //
        // http://www.w3.org/TR/SVG/pservers.html#PatternElementHeightAttribute
        // "A value of zero disables rendering of the element (i.e., no paint is applied)"
        //
        // <pattern height="0">
        if (
            params.patternHeight0 &&
            item.isElem('pattern') &&
            item.hasAttr('height', '0')
        ) return false;

        // Image with zero width
        //
        // http://www.w3.org/TR/SVG/struct.html#ImageElementWidthAttribute
        // "A value of zero disables rendering of the element"
        //
        // <image width="0">
        if (
            params.imageWidth0 &&
            item.isElem('image') &&
            item.hasAttr('width', '0')
        ) return false;

        // Image with zero height
        //
        // http://www.w3.org/TR/SVG/struct.html#ImageElementHeightAttribute
        // "A value of zero disables rendering of the element"
        //
        // <image height="0">
        if (
            params.imageHeight0 &&
            item.isElem('image') &&
            item.hasAttr('height', '0')
        ) return false;

        // Path with empty data
        //
        // http://www.w3.org/TR/SVG/paths.html#DAttribute
        //
        // <path d=""/>
        if (
            params.pathEmptyD &&
            item.isElem('path') &&
            (!item.hasAttr('d') || !regValidPath.test(item.attr('d').value))
        ) return false;

        // Polyline with empty points
        //
        // http://www.w3.org/TR/SVG/shapes.html#PolylineElementPointsAttribute
        //
        // <polyline points="">
        if (
            params.polylineEmptyPoints &&
            item.isElem('polyline') &&
            !item.hasAttr('points')
        ) return false;

        // Polygon with empty points
        //
        // http://www.w3.org/TR/SVG/shapes.html#PolygonElementPointsAttribute
        //
        // <polygon points="">
        if (
            params.polygonEmptyPoints &&
            item.isElem('polygon') &&
            !item.hasAttr('points')
        ) return false;

    }

};

var removeHiddenElems = {
	type: type$v,
	active: active$v,
	description: description$w,
	params: params$i,
	fn: fn$v
};

var type$w = 'perItem';

var active$w = true;

var description$x = 'removes <metadata>';

/**
 * Remove <metadata>.
 *
 * http://www.w3.org/TR/SVG/metadata.html
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$w = function(item) {

    return !item.isElem('metadata');

};

var removeMetadata = {
	type: type$w,
	active: active$w,
	description: description$x,
	fn: fn$w
};

var type$x = 'perItem';

var active$x = true;

var description$y = 'removes non-inheritable group’s presentational attributes';

var inheritableAttrs$2 = _collections.inheritableAttrs,
    attrsGroups$1 = _collections.attrsGroups,
    applyGroups = _collections.presentationNonInheritableGroupAttrs;

/**
 * Remove non-inheritable group's "presentation" attributes.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$x = function(item) {

    if (item.isElem('g')) {

        item.eachAttr(function(attr) {
            if (
                ~attrsGroups$1.presentation.indexOf(attr.name) &&
                !~inheritableAttrs$2.indexOf(attr.name) &&
                !~applyGroups.indexOf(attr.name)
            ) {
                item.removeAttr(attr.name);
            }
        });

    }

};

var removeNonInheritableGroupAttrs = {
	type: type$x,
	active: active$x,
	description: description$y,
	fn: fn$x
};

var lib$1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doctype = exports.CDATA = exports.Tag = exports.Style = exports.Script = exports.Comment = exports.Directive = exports.Text = exports.Root = exports.isTag = void 0;
/**
 * Tests whether an element is a tag or not.
 *
 * @param elem Element to test
 */
function isTag(elem) {
    return (elem.type === "tag" /* Tag */ ||
        elem.type === "script" /* Script */ ||
        elem.type === "style" /* Style */);
}
exports.isTag = isTag;
// Exports for backwards compatibility
/** Type for the root element of a document */
exports.Root = "root" /* Root */;
/** Type for Text */
exports.Text = "text" /* Text */;
/** Type for <? ... ?> */
exports.Directive = "directive" /* Directive */;
/** Type for <!-- ... --> */
exports.Comment = "comment" /* Comment */;
/** Type for <script> tags */
exports.Script = "script" /* Script */;
/** Type for <style> tags */
exports.Style = "style" /* Style */;
/** Type for Any tag */
exports.Tag = "tag" /* Tag */;
/** Type for <![CDATA[ ... ]]> */
exports.CDATA = "cdata" /* CDATA */;
/** Type for <!doctype ...> */
exports.Doctype = "doctype" /* Doctype */;
});

var tagtypes = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasChildren = exports.isComment = exports.isText = exports.isCDATA = exports.isTag = void 0;

/**
 * @param node Node to check.
 * @returns `true` if the node is a `Element`, `false` otherwise.
 */
function isTag(node) {
    return lib$1.isTag(node);
}
exports.isTag = isTag;
/**
 * @param node Node to check.
 * @returns `true` if the node is a `NodeWithChildren`, `false` otherwise.
 */
function isCDATA(node) {
    return node.type === "cdata" /* CDATA */;
}
exports.isCDATA = isCDATA;
/**
 * @param node Node to check.
 * @returns `true` if the node is a `DataNode`, `false` otherwise.
 */
function isText(node) {
    return node.type === "text" /* Text */;
}
exports.isText = isText;
/**
 * @param node Node to check.
 * @returns `true` if the node is a `DataNode`, `false` otherwise.
 */
function isComment(node) {
    return node.type === "comment" /* Comment */;
}
exports.isComment = isComment;
/**
 * @param node Node to check.
 * @returns `true` if the node is a `NodeWithChildren` (has children), `false` otherwise.
 */
function hasChildren(node) {
    return Object.prototype.hasOwnProperty.call(node, "children");
}
exports.hasChildren = hasChildren;
});

var Aacute = "Á";
var aacute = "á";
var Abreve = "Ă";
var abreve = "ă";
var ac = "∾";
var acd = "∿";
var acE = "∾̳";
var Acirc = "Â";
var acirc = "â";
var acute = "´";
var Acy = "А";
var acy = "а";
var AElig = "Æ";
var aelig = "æ";
var af = "⁡";
var Afr = "𝔄";
var afr = "𝔞";
var Agrave = "À";
var agrave = "à";
var alefsym = "ℵ";
var aleph = "ℵ";
var Alpha = "Α";
var alpha = "α";
var Amacr = "Ā";
var amacr = "ā";
var amalg = "⨿";
var amp = "&";
var AMP = "&";
var andand = "⩕";
var And = "⩓";
var and = "∧";
var andd = "⩜";
var andslope = "⩘";
var andv = "⩚";
var ang = "∠";
var ange = "⦤";
var angle = "∠";
var angmsdaa = "⦨";
var angmsdab = "⦩";
var angmsdac = "⦪";
var angmsdad = "⦫";
var angmsdae = "⦬";
var angmsdaf = "⦭";
var angmsdag = "⦮";
var angmsdah = "⦯";
var angmsd = "∡";
var angrt = "∟";
var angrtvb = "⊾";
var angrtvbd = "⦝";
var angsph = "∢";
var angst = "Å";
var angzarr = "⍼";
var Aogon = "Ą";
var aogon = "ą";
var Aopf = "𝔸";
var aopf = "𝕒";
var apacir = "⩯";
var ap = "≈";
var apE = "⩰";
var ape = "≊";
var apid = "≋";
var apos = "'";
var ApplyFunction = "⁡";
var approx = "≈";
var approxeq = "≊";
var Aring = "Å";
var aring = "å";
var Ascr = "𝒜";
var ascr = "𝒶";
var Assign = "≔";
var ast = "*";
var asymp = "≈";
var asympeq = "≍";
var Atilde = "Ã";
var atilde = "ã";
var Auml = "Ä";
var auml = "ä";
var awconint = "∳";
var awint = "⨑";
var backcong = "≌";
var backepsilon = "϶";
var backprime = "‵";
var backsim = "∽";
var backsimeq = "⋍";
var Backslash = "∖";
var Barv = "⫧";
var barvee = "⊽";
var barwed = "⌅";
var Barwed = "⌆";
var barwedge = "⌅";
var bbrk = "⎵";
var bbrktbrk = "⎶";
var bcong = "≌";
var Bcy = "Б";
var bcy = "б";
var bdquo = "„";
var becaus = "∵";
var because = "∵";
var Because = "∵";
var bemptyv = "⦰";
var bepsi = "϶";
var bernou = "ℬ";
var Bernoullis = "ℬ";
var Beta = "Β";
var beta = "β";
var beth = "ℶ";
var between = "≬";
var Bfr = "𝔅";
var bfr = "𝔟";
var bigcap = "⋂";
var bigcirc = "◯";
var bigcup = "⋃";
var bigodot = "⨀";
var bigoplus = "⨁";
var bigotimes = "⨂";
var bigsqcup = "⨆";
var bigstar = "★";
var bigtriangledown = "▽";
var bigtriangleup = "△";
var biguplus = "⨄";
var bigvee = "⋁";
var bigwedge = "⋀";
var bkarow = "⤍";
var blacklozenge = "⧫";
var blacksquare = "▪";
var blacktriangle = "▴";
var blacktriangledown = "▾";
var blacktriangleleft = "◂";
var blacktriangleright = "▸";
var blank = "␣";
var blk12 = "▒";
var blk14 = "░";
var blk34 = "▓";
var block = "█";
var bne = "=⃥";
var bnequiv = "≡⃥";
var bNot = "⫭";
var bnot = "⌐";
var Bopf = "𝔹";
var bopf = "𝕓";
var bot = "⊥";
var bottom = "⊥";
var bowtie = "⋈";
var boxbox = "⧉";
var boxdl = "┐";
var boxdL = "╕";
var boxDl = "╖";
var boxDL = "╗";
var boxdr = "┌";
var boxdR = "╒";
var boxDr = "╓";
var boxDR = "╔";
var boxh = "─";
var boxH = "═";
var boxhd = "┬";
var boxHd = "╤";
var boxhD = "╥";
var boxHD = "╦";
var boxhu = "┴";
var boxHu = "╧";
var boxhU = "╨";
var boxHU = "╩";
var boxminus = "⊟";
var boxplus = "⊞";
var boxtimes = "⊠";
var boxul = "┘";
var boxuL = "╛";
var boxUl = "╜";
var boxUL = "╝";
var boxur = "└";
var boxuR = "╘";
var boxUr = "╙";
var boxUR = "╚";
var boxv = "│";
var boxV = "║";
var boxvh = "┼";
var boxvH = "╪";
var boxVh = "╫";
var boxVH = "╬";
var boxvl = "┤";
var boxvL = "╡";
var boxVl = "╢";
var boxVL = "╣";
var boxvr = "├";
var boxvR = "╞";
var boxVr = "╟";
var boxVR = "╠";
var bprime = "‵";
var breve = "˘";
var Breve = "˘";
var brvbar = "¦";
var bscr = "𝒷";
var Bscr = "ℬ";
var bsemi = "⁏";
var bsim = "∽";
var bsime = "⋍";
var bsolb = "⧅";
var bsol = "\\";
var bsolhsub = "⟈";
var bull = "•";
var bullet = "•";
var bump = "≎";
var bumpE = "⪮";
var bumpe = "≏";
var Bumpeq = "≎";
var bumpeq = "≏";
var Cacute = "Ć";
var cacute = "ć";
var capand = "⩄";
var capbrcup = "⩉";
var capcap = "⩋";
var cap = "∩";
var Cap = "⋒";
var capcup = "⩇";
var capdot = "⩀";
var CapitalDifferentialD = "ⅅ";
var caps = "∩︀";
var caret = "⁁";
var caron = "ˇ";
var Cayleys = "ℭ";
var ccaps = "⩍";
var Ccaron = "Č";
var ccaron = "č";
var Ccedil = "Ç";
var ccedil = "ç";
var Ccirc = "Ĉ";
var ccirc = "ĉ";
var Cconint = "∰";
var ccups = "⩌";
var ccupssm = "⩐";
var Cdot = "Ċ";
var cdot = "ċ";
var cedil = "¸";
var Cedilla = "¸";
var cemptyv = "⦲";
var cent = "¢";
var centerdot = "·";
var CenterDot = "·";
var cfr = "𝔠";
var Cfr = "ℭ";
var CHcy = "Ч";
var chcy = "ч";
var check = "✓";
var checkmark = "✓";
var Chi = "Χ";
var chi = "χ";
var circ = "ˆ";
var circeq = "≗";
var circlearrowleft = "↺";
var circlearrowright = "↻";
var circledast = "⊛";
var circledcirc = "⊚";
var circleddash = "⊝";
var CircleDot = "⊙";
var circledR = "®";
var circledS = "Ⓢ";
var CircleMinus = "⊖";
var CirclePlus = "⊕";
var CircleTimes = "⊗";
var cir = "○";
var cirE = "⧃";
var cire = "≗";
var cirfnint = "⨐";
var cirmid = "⫯";
var cirscir = "⧂";
var ClockwiseContourIntegral = "∲";
var CloseCurlyDoubleQuote = "”";
var CloseCurlyQuote = "’";
var clubs = "♣";
var clubsuit = "♣";
var colon = ":";
var Colon = "∷";
var Colone = "⩴";
var colone = "≔";
var coloneq = "≔";
var comma = ",";
var commat = "@";
var comp = "∁";
var compfn = "∘";
var complement = "∁";
var complexes = "ℂ";
var cong = "≅";
var congdot = "⩭";
var Congruent = "≡";
var conint = "∮";
var Conint = "∯";
var ContourIntegral = "∮";
var copf = "𝕔";
var Copf = "ℂ";
var coprod = "∐";
var Coproduct = "∐";
var copy$1 = "©";
var COPY = "©";
var copysr = "℗";
var CounterClockwiseContourIntegral = "∳";
var crarr = "↵";
var cross = "✗";
var Cross = "⨯";
var Cscr = "𝒞";
var cscr = "𝒸";
var csub = "⫏";
var csube = "⫑";
var csup = "⫐";
var csupe = "⫒";
var ctdot = "⋯";
var cudarrl = "⤸";
var cudarrr = "⤵";
var cuepr = "⋞";
var cuesc = "⋟";
var cularr = "↶";
var cularrp = "⤽";
var cupbrcap = "⩈";
var cupcap = "⩆";
var CupCap = "≍";
var cup = "∪";
var Cup = "⋓";
var cupcup = "⩊";
var cupdot = "⊍";
var cupor = "⩅";
var cups = "∪︀";
var curarr = "↷";
var curarrm = "⤼";
var curlyeqprec = "⋞";
var curlyeqsucc = "⋟";
var curlyvee = "⋎";
var curlywedge = "⋏";
var curren = "¤";
var curvearrowleft = "↶";
var curvearrowright = "↷";
var cuvee = "⋎";
var cuwed = "⋏";
var cwconint = "∲";
var cwint = "∱";
var cylcty = "⌭";
var dagger = "†";
var Dagger = "‡";
var daleth = "ℸ";
var darr = "↓";
var Darr = "↡";
var dArr = "⇓";
var dash = "‐";
var Dashv = "⫤";
var dashv = "⊣";
var dbkarow = "⤏";
var dblac = "˝";
var Dcaron = "Ď";
var dcaron = "ď";
var Dcy = "Д";
var dcy = "д";
var ddagger = "‡";
var ddarr = "⇊";
var DD = "ⅅ";
var dd = "ⅆ";
var DDotrahd = "⤑";
var ddotseq = "⩷";
var deg = "°";
var Del = "∇";
var Delta = "Δ";
var delta = "δ";
var demptyv = "⦱";
var dfisht = "⥿";
var Dfr = "𝔇";
var dfr = "𝔡";
var dHar = "⥥";
var dharl = "⇃";
var dharr = "⇂";
var DiacriticalAcute = "´";
var DiacriticalDot = "˙";
var DiacriticalDoubleAcute = "˝";
var DiacriticalGrave = "`";
var DiacriticalTilde = "˜";
var diam = "⋄";
var diamond = "⋄";
var Diamond = "⋄";
var diamondsuit = "♦";
var diams = "♦";
var die = "¨";
var DifferentialD = "ⅆ";
var digamma = "ϝ";
var disin = "⋲";
var div = "÷";
var divide = "÷";
var divideontimes = "⋇";
var divonx = "⋇";
var DJcy = "Ђ";
var djcy = "ђ";
var dlcorn = "⌞";
var dlcrop = "⌍";
var dollar = "$";
var Dopf = "𝔻";
var dopf = "𝕕";
var Dot = "¨";
var dot = "˙";
var DotDot = "⃜";
var doteq = "≐";
var doteqdot = "≑";
var DotEqual = "≐";
var dotminus = "∸";
var dotplus = "∔";
var dotsquare = "⊡";
var doublebarwedge = "⌆";
var DoubleContourIntegral = "∯";
var DoubleDot = "¨";
var DoubleDownArrow = "⇓";
var DoubleLeftArrow = "⇐";
var DoubleLeftRightArrow = "⇔";
var DoubleLeftTee = "⫤";
var DoubleLongLeftArrow = "⟸";
var DoubleLongLeftRightArrow = "⟺";
var DoubleLongRightArrow = "⟹";
var DoubleRightArrow = "⇒";
var DoubleRightTee = "⊨";
var DoubleUpArrow = "⇑";
var DoubleUpDownArrow = "⇕";
var DoubleVerticalBar = "∥";
var DownArrowBar = "⤓";
var downarrow = "↓";
var DownArrow = "↓";
var Downarrow = "⇓";
var DownArrowUpArrow = "⇵";
var DownBreve = "̑";
var downdownarrows = "⇊";
var downharpoonleft = "⇃";
var downharpoonright = "⇂";
var DownLeftRightVector = "⥐";
var DownLeftTeeVector = "⥞";
var DownLeftVectorBar = "⥖";
var DownLeftVector = "↽";
var DownRightTeeVector = "⥟";
var DownRightVectorBar = "⥗";
var DownRightVector = "⇁";
var DownTeeArrow = "↧";
var DownTee = "⊤";
var drbkarow = "⤐";
var drcorn = "⌟";
var drcrop = "⌌";
var Dscr = "𝒟";
var dscr = "𝒹";
var DScy = "Ѕ";
var dscy = "ѕ";
var dsol = "⧶";
var Dstrok = "Đ";
var dstrok = "đ";
var dtdot = "⋱";
var dtri = "▿";
var dtrif = "▾";
var duarr = "⇵";
var duhar = "⥯";
var dwangle = "⦦";
var DZcy = "Џ";
var dzcy = "џ";
var dzigrarr = "⟿";
var Eacute = "É";
var eacute = "é";
var easter = "⩮";
var Ecaron = "Ě";
var ecaron = "ě";
var Ecirc = "Ê";
var ecirc = "ê";
var ecir = "≖";
var ecolon = "≕";
var Ecy = "Э";
var ecy = "э";
var eDDot = "⩷";
var Edot = "Ė";
var edot = "ė";
var eDot = "≑";
var ee = "ⅇ";
var efDot = "≒";
var Efr = "𝔈";
var efr = "𝔢";
var eg = "⪚";
var Egrave = "È";
var egrave = "è";
var egs = "⪖";
var egsdot = "⪘";
var el = "⪙";
var Element = "∈";
var elinters = "⏧";
var ell = "ℓ";
var els = "⪕";
var elsdot = "⪗";
var Emacr = "Ē";
var emacr = "ē";
var empty = "∅";
var emptyset = "∅";
var EmptySmallSquare = "◻";
var emptyv = "∅";
var EmptyVerySmallSquare = "▫";
var emsp13 = " ";
var emsp14 = " ";
var emsp = " ";
var ENG = "Ŋ";
var eng = "ŋ";
var ensp = " ";
var Eogon = "Ę";
var eogon = "ę";
var Eopf = "𝔼";
var eopf = "𝕖";
var epar = "⋕";
var eparsl = "⧣";
var eplus = "⩱";
var epsi = "ε";
var Epsilon = "Ε";
var epsilon = "ε";
var epsiv = "ϵ";
var eqcirc = "≖";
var eqcolon = "≕";
var eqsim = "≂";
var eqslantgtr = "⪖";
var eqslantless = "⪕";
var Equal = "⩵";
var equals = "=";
var EqualTilde = "≂";
var equest = "≟";
var Equilibrium = "⇌";
var equiv = "≡";
var equivDD = "⩸";
var eqvparsl = "⧥";
var erarr = "⥱";
var erDot = "≓";
var escr = "ℯ";
var Escr = "ℰ";
var esdot = "≐";
var Esim = "⩳";
var esim = "≂";
var Eta = "Η";
var eta = "η";
var ETH = "Ð";
var eth = "ð";
var Euml = "Ë";
var euml = "ë";
var euro = "€";
var excl = "!";
var exist = "∃";
var Exists = "∃";
var expectation = "ℰ";
var exponentiale = "ⅇ";
var ExponentialE = "ⅇ";
var fallingdotseq = "≒";
var Fcy = "Ф";
var fcy = "ф";
var female = "♀";
var ffilig = "ﬃ";
var fflig = "ﬀ";
var ffllig = "ﬄ";
var Ffr = "𝔉";
var ffr = "𝔣";
var filig = "ﬁ";
var FilledSmallSquare = "◼";
var FilledVerySmallSquare = "▪";
var fjlig = "fj";
var flat = "♭";
var fllig = "ﬂ";
var fltns = "▱";
var fnof = "ƒ";
var Fopf = "𝔽";
var fopf = "𝕗";
var forall = "∀";
var ForAll = "∀";
var fork = "⋔";
var forkv = "⫙";
var Fouriertrf = "ℱ";
var fpartint = "⨍";
var frac12 = "½";
var frac13 = "⅓";
var frac14 = "¼";
var frac15 = "⅕";
var frac16 = "⅙";
var frac18 = "⅛";
var frac23 = "⅔";
var frac25 = "⅖";
var frac34 = "¾";
var frac35 = "⅗";
var frac38 = "⅜";
var frac45 = "⅘";
var frac56 = "⅚";
var frac58 = "⅝";
var frac78 = "⅞";
var frasl = "⁄";
var frown = "⌢";
var fscr = "𝒻";
var Fscr = "ℱ";
var gacute = "ǵ";
var Gamma = "Γ";
var gamma = "γ";
var Gammad = "Ϝ";
var gammad = "ϝ";
var gap = "⪆";
var Gbreve = "Ğ";
var gbreve = "ğ";
var Gcedil = "Ģ";
var Gcirc = "Ĝ";
var gcirc = "ĝ";
var Gcy = "Г";
var gcy = "г";
var Gdot = "Ġ";
var gdot = "ġ";
var ge = "≥";
var gE = "≧";
var gEl = "⪌";
var gel = "⋛";
var geq = "≥";
var geqq = "≧";
var geqslant = "⩾";
var gescc = "⪩";
var ges = "⩾";
var gesdot = "⪀";
var gesdoto = "⪂";
var gesdotol = "⪄";
var gesl = "⋛︀";
var gesles = "⪔";
var Gfr = "𝔊";
var gfr = "𝔤";
var gg = "≫";
var Gg = "⋙";
var ggg = "⋙";
var gimel = "ℷ";
var GJcy = "Ѓ";
var gjcy = "ѓ";
var gla = "⪥";
var gl = "≷";
var glE = "⪒";
var glj = "⪤";
var gnap = "⪊";
var gnapprox = "⪊";
var gne = "⪈";
var gnE = "≩";
var gneq = "⪈";
var gneqq = "≩";
var gnsim = "⋧";
var Gopf = "𝔾";
var gopf = "𝕘";
var grave = "`";
var GreaterEqual = "≥";
var GreaterEqualLess = "⋛";
var GreaterFullEqual = "≧";
var GreaterGreater = "⪢";
var GreaterLess = "≷";
var GreaterSlantEqual = "⩾";
var GreaterTilde = "≳";
var Gscr = "𝒢";
var gscr = "ℊ";
var gsim = "≳";
var gsime = "⪎";
var gsiml = "⪐";
var gtcc = "⪧";
var gtcir = "⩺";
var gt = ">";
var GT = ">";
var Gt = "≫";
var gtdot = "⋗";
var gtlPar = "⦕";
var gtquest = "⩼";
var gtrapprox = "⪆";
var gtrarr = "⥸";
var gtrdot = "⋗";
var gtreqless = "⋛";
var gtreqqless = "⪌";
var gtrless = "≷";
var gtrsim = "≳";
var gvertneqq = "≩︀";
var gvnE = "≩︀";
var Hacek = "ˇ";
var hairsp = " ";
var half = "½";
var hamilt = "ℋ";
var HARDcy = "Ъ";
var hardcy = "ъ";
var harrcir = "⥈";
var harr = "↔";
var hArr = "⇔";
var harrw = "↭";
var Hat = "^";
var hbar = "ℏ";
var Hcirc = "Ĥ";
var hcirc = "ĥ";
var hearts = "♥";
var heartsuit = "♥";
var hellip = "…";
var hercon = "⊹";
var hfr = "𝔥";
var Hfr = "ℌ";
var HilbertSpace = "ℋ";
var hksearow = "⤥";
var hkswarow = "⤦";
var hoarr = "⇿";
var homtht = "∻";
var hookleftarrow = "↩";
var hookrightarrow = "↪";
var hopf = "𝕙";
var Hopf = "ℍ";
var horbar = "―";
var HorizontalLine = "─";
var hscr = "𝒽";
var Hscr = "ℋ";
var hslash = "ℏ";
var Hstrok = "Ħ";
var hstrok = "ħ";
var HumpDownHump = "≎";
var HumpEqual = "≏";
var hybull = "⁃";
var hyphen = "‐";
var Iacute = "Í";
var iacute = "í";
var ic = "⁣";
var Icirc = "Î";
var icirc = "î";
var Icy = "И";
var icy = "и";
var Idot = "İ";
var IEcy = "Е";
var iecy = "е";
var iexcl = "¡";
var iff = "⇔";
var ifr = "𝔦";
var Ifr = "ℑ";
var Igrave = "Ì";
var igrave = "ì";
var ii = "ⅈ";
var iiiint = "⨌";
var iiint = "∭";
var iinfin = "⧜";
var iiota = "℩";
var IJlig = "Ĳ";
var ijlig = "ĳ";
var Imacr = "Ī";
var imacr = "ī";
var image = "ℑ";
var ImaginaryI = "ⅈ";
var imagline = "ℐ";
var imagpart = "ℑ";
var imath = "ı";
var Im = "ℑ";
var imof = "⊷";
var imped = "Ƶ";
var Implies = "⇒";
var incare = "℅";
var infin = "∞";
var infintie = "⧝";
var inodot = "ı";
var intcal = "⊺";
var int = "∫";
var Int = "∬";
var integers = "ℤ";
var Integral = "∫";
var intercal = "⊺";
var Intersection = "⋂";
var intlarhk = "⨗";
var intprod = "⨼";
var InvisibleComma = "⁣";
var InvisibleTimes = "⁢";
var IOcy = "Ё";
var iocy = "ё";
var Iogon = "Į";
var iogon = "į";
var Iopf = "𝕀";
var iopf = "𝕚";
var Iota = "Ι";
var iota = "ι";
var iprod = "⨼";
var iquest = "¿";
var iscr = "𝒾";
var Iscr = "ℐ";
var isin = "∈";
var isindot = "⋵";
var isinE = "⋹";
var isins = "⋴";
var isinsv = "⋳";
var isinv = "∈";
var it = "⁢";
var Itilde = "Ĩ";
var itilde = "ĩ";
var Iukcy = "І";
var iukcy = "і";
var Iuml = "Ï";
var iuml = "ï";
var Jcirc = "Ĵ";
var jcirc = "ĵ";
var Jcy = "Й";
var jcy = "й";
var Jfr = "𝔍";
var jfr = "𝔧";
var jmath = "ȷ";
var Jopf = "𝕁";
var jopf = "𝕛";
var Jscr = "𝒥";
var jscr = "𝒿";
var Jsercy = "Ј";
var jsercy = "ј";
var Jukcy = "Є";
var jukcy = "є";
var Kappa = "Κ";
var kappa = "κ";
var kappav = "ϰ";
var Kcedil = "Ķ";
var kcedil = "ķ";
var Kcy = "К";
var kcy = "к";
var Kfr = "𝔎";
var kfr = "𝔨";
var kgreen = "ĸ";
var KHcy = "Х";
var khcy = "х";
var KJcy = "Ќ";
var kjcy = "ќ";
var Kopf = "𝕂";
var kopf = "𝕜";
var Kscr = "𝒦";
var kscr = "𝓀";
var lAarr = "⇚";
var Lacute = "Ĺ";
var lacute = "ĺ";
var laemptyv = "⦴";
var lagran = "ℒ";
var Lambda = "Λ";
var lambda = "λ";
var lang = "⟨";
var Lang = "⟪";
var langd = "⦑";
var langle = "⟨";
var lap = "⪅";
var Laplacetrf = "ℒ";
var laquo = "«";
var larrb = "⇤";
var larrbfs = "⤟";
var larr = "←";
var Larr = "↞";
var lArr = "⇐";
var larrfs = "⤝";
var larrhk = "↩";
var larrlp = "↫";
var larrpl = "⤹";
var larrsim = "⥳";
var larrtl = "↢";
var latail = "⤙";
var lAtail = "⤛";
var lat = "⪫";
var late = "⪭";
var lates = "⪭︀";
var lbarr = "⤌";
var lBarr = "⤎";
var lbbrk = "❲";
var lbrace = "{";
var lbrack = "[";
var lbrke = "⦋";
var lbrksld = "⦏";
var lbrkslu = "⦍";
var Lcaron = "Ľ";
var lcaron = "ľ";
var Lcedil = "Ļ";
var lcedil = "ļ";
var lceil = "⌈";
var lcub = "{";
var Lcy = "Л";
var lcy = "л";
var ldca = "⤶";
var ldquo = "“";
var ldquor = "„";
var ldrdhar = "⥧";
var ldrushar = "⥋";
var ldsh = "↲";
var le = "≤";
var lE = "≦";
var LeftAngleBracket = "⟨";
var LeftArrowBar = "⇤";
var leftarrow = "←";
var LeftArrow = "←";
var Leftarrow = "⇐";
var LeftArrowRightArrow = "⇆";
var leftarrowtail = "↢";
var LeftCeiling = "⌈";
var LeftDoubleBracket = "⟦";
var LeftDownTeeVector = "⥡";
var LeftDownVectorBar = "⥙";
var LeftDownVector = "⇃";
var LeftFloor = "⌊";
var leftharpoondown = "↽";
var leftharpoonup = "↼";
var leftleftarrows = "⇇";
var leftrightarrow = "↔";
var LeftRightArrow = "↔";
var Leftrightarrow = "⇔";
var leftrightarrows = "⇆";
var leftrightharpoons = "⇋";
var leftrightsquigarrow = "↭";
var LeftRightVector = "⥎";
var LeftTeeArrow = "↤";
var LeftTee = "⊣";
var LeftTeeVector = "⥚";
var leftthreetimes = "⋋";
var LeftTriangleBar = "⧏";
var LeftTriangle = "⊲";
var LeftTriangleEqual = "⊴";
var LeftUpDownVector = "⥑";
var LeftUpTeeVector = "⥠";
var LeftUpVectorBar = "⥘";
var LeftUpVector = "↿";
var LeftVectorBar = "⥒";
var LeftVector = "↼";
var lEg = "⪋";
var leg = "⋚";
var leq = "≤";
var leqq = "≦";
var leqslant = "⩽";
var lescc = "⪨";
var les = "⩽";
var lesdot = "⩿";
var lesdoto = "⪁";
var lesdotor = "⪃";
var lesg = "⋚︀";
var lesges = "⪓";
var lessapprox = "⪅";
var lessdot = "⋖";
var lesseqgtr = "⋚";
var lesseqqgtr = "⪋";
var LessEqualGreater = "⋚";
var LessFullEqual = "≦";
var LessGreater = "≶";
var lessgtr = "≶";
var LessLess = "⪡";
var lesssim = "≲";
var LessSlantEqual = "⩽";
var LessTilde = "≲";
var lfisht = "⥼";
var lfloor = "⌊";
var Lfr = "𝔏";
var lfr = "𝔩";
var lg = "≶";
var lgE = "⪑";
var lHar = "⥢";
var lhard = "↽";
var lharu = "↼";
var lharul = "⥪";
var lhblk = "▄";
var LJcy = "Љ";
var ljcy = "љ";
var llarr = "⇇";
var ll = "≪";
var Ll = "⋘";
var llcorner = "⌞";
var Lleftarrow = "⇚";
var llhard = "⥫";
var lltri = "◺";
var Lmidot = "Ŀ";
var lmidot = "ŀ";
var lmoustache = "⎰";
var lmoust = "⎰";
var lnap = "⪉";
var lnapprox = "⪉";
var lne = "⪇";
var lnE = "≨";
var lneq = "⪇";
var lneqq = "≨";
var lnsim = "⋦";
var loang = "⟬";
var loarr = "⇽";
var lobrk = "⟦";
var longleftarrow = "⟵";
var LongLeftArrow = "⟵";
var Longleftarrow = "⟸";
var longleftrightarrow = "⟷";
var LongLeftRightArrow = "⟷";
var Longleftrightarrow = "⟺";
var longmapsto = "⟼";
var longrightarrow = "⟶";
var LongRightArrow = "⟶";
var Longrightarrow = "⟹";
var looparrowleft = "↫";
var looparrowright = "↬";
var lopar = "⦅";
var Lopf = "𝕃";
var lopf = "𝕝";
var loplus = "⨭";
var lotimes = "⨴";
var lowast = "∗";
var lowbar = "_";
var LowerLeftArrow = "↙";
var LowerRightArrow = "↘";
var loz = "◊";
var lozenge = "◊";
var lozf = "⧫";
var lpar = "(";
var lparlt = "⦓";
var lrarr = "⇆";
var lrcorner = "⌟";
var lrhar = "⇋";
var lrhard = "⥭";
var lrm = "‎";
var lrtri = "⊿";
var lsaquo = "‹";
var lscr = "𝓁";
var Lscr = "ℒ";
var lsh = "↰";
var Lsh = "↰";
var lsim = "≲";
var lsime = "⪍";
var lsimg = "⪏";
var lsqb = "[";
var lsquo = "‘";
var lsquor = "‚";
var Lstrok = "Ł";
var lstrok = "ł";
var ltcc = "⪦";
var ltcir = "⩹";
var lt = "<";
var LT = "<";
var Lt = "≪";
var ltdot = "⋖";
var lthree = "⋋";
var ltimes = "⋉";
var ltlarr = "⥶";
var ltquest = "⩻";
var ltri = "◃";
var ltrie = "⊴";
var ltrif = "◂";
var ltrPar = "⦖";
var lurdshar = "⥊";
var luruhar = "⥦";
var lvertneqq = "≨︀";
var lvnE = "≨︀";
var macr = "¯";
var male = "♂";
var malt = "✠";
var maltese = "✠";
var map = "↦";
var mapsto = "↦";
var mapstodown = "↧";
var mapstoleft = "↤";
var mapstoup = "↥";
var marker = "▮";
var mcomma = "⨩";
var Mcy = "М";
var mcy = "м";
var mdash = "—";
var mDDot = "∺";
var measuredangle = "∡";
var MediumSpace = " ";
var Mellintrf = "ℳ";
var Mfr = "𝔐";
var mfr = "𝔪";
var mho = "℧";
var micro = "µ";
var midast = "*";
var midcir = "⫰";
var mid = "∣";
var middot = "·";
var minusb = "⊟";
var minus = "−";
var minusd = "∸";
var minusdu = "⨪";
var MinusPlus = "∓";
var mlcp = "⫛";
var mldr = "…";
var mnplus = "∓";
var models = "⊧";
var Mopf = "𝕄";
var mopf = "𝕞";
var mp = "∓";
var mscr = "𝓂";
var Mscr = "ℳ";
var mstpos = "∾";
var Mu = "Μ";
var mu = "μ";
var multimap = "⊸";
var mumap = "⊸";
var nabla = "∇";
var Nacute = "Ń";
var nacute = "ń";
var nang = "∠⃒";
var nap = "≉";
var napE = "⩰̸";
var napid = "≋̸";
var napos = "ŉ";
var napprox = "≉";
var natural = "♮";
var naturals = "ℕ";
var natur = "♮";
var nbsp = " ";
var nbump = "≎̸";
var nbumpe = "≏̸";
var ncap = "⩃";
var Ncaron = "Ň";
var ncaron = "ň";
var Ncedil = "Ņ";
var ncedil = "ņ";
var ncong = "≇";
var ncongdot = "⩭̸";
var ncup = "⩂";
var Ncy = "Н";
var ncy = "н";
var ndash = "–";
var nearhk = "⤤";
var nearr = "↗";
var neArr = "⇗";
var nearrow = "↗";
var ne = "≠";
var nedot = "≐̸";
var NegativeMediumSpace = "​";
var NegativeThickSpace = "​";
var NegativeThinSpace = "​";
var NegativeVeryThinSpace = "​";
var nequiv = "≢";
var nesear = "⤨";
var nesim = "≂̸";
var NestedGreaterGreater = "≫";
var NestedLessLess = "≪";
var NewLine = "\n";
var nexist = "∄";
var nexists = "∄";
var Nfr = "𝔑";
var nfr = "𝔫";
var ngE = "≧̸";
var nge = "≱";
var ngeq = "≱";
var ngeqq = "≧̸";
var ngeqslant = "⩾̸";
var nges = "⩾̸";
var nGg = "⋙̸";
var ngsim = "≵";
var nGt = "≫⃒";
var ngt = "≯";
var ngtr = "≯";
var nGtv = "≫̸";
var nharr = "↮";
var nhArr = "⇎";
var nhpar = "⫲";
var ni = "∋";
var nis = "⋼";
var nisd = "⋺";
var niv = "∋";
var NJcy = "Њ";
var njcy = "њ";
var nlarr = "↚";
var nlArr = "⇍";
var nldr = "‥";
var nlE = "≦̸";
var nle = "≰";
var nleftarrow = "↚";
var nLeftarrow = "⇍";
var nleftrightarrow = "↮";
var nLeftrightarrow = "⇎";
var nleq = "≰";
var nleqq = "≦̸";
var nleqslant = "⩽̸";
var nles = "⩽̸";
var nless = "≮";
var nLl = "⋘̸";
var nlsim = "≴";
var nLt = "≪⃒";
var nlt = "≮";
var nltri = "⋪";
var nltrie = "⋬";
var nLtv = "≪̸";
var nmid = "∤";
var NoBreak = "⁠";
var NonBreakingSpace = " ";
var nopf = "𝕟";
var Nopf = "ℕ";
var Not = "⫬";
var not = "¬";
var NotCongruent = "≢";
var NotCupCap = "≭";
var NotDoubleVerticalBar = "∦";
var NotElement = "∉";
var NotEqual = "≠";
var NotEqualTilde = "≂̸";
var NotExists = "∄";
var NotGreater = "≯";
var NotGreaterEqual = "≱";
var NotGreaterFullEqual = "≧̸";
var NotGreaterGreater = "≫̸";
var NotGreaterLess = "≹";
var NotGreaterSlantEqual = "⩾̸";
var NotGreaterTilde = "≵";
var NotHumpDownHump = "≎̸";
var NotHumpEqual = "≏̸";
var notin = "∉";
var notindot = "⋵̸";
var notinE = "⋹̸";
var notinva = "∉";
var notinvb = "⋷";
var notinvc = "⋶";
var NotLeftTriangleBar = "⧏̸";
var NotLeftTriangle = "⋪";
var NotLeftTriangleEqual = "⋬";
var NotLess = "≮";
var NotLessEqual = "≰";
var NotLessGreater = "≸";
var NotLessLess = "≪̸";
var NotLessSlantEqual = "⩽̸";
var NotLessTilde = "≴";
var NotNestedGreaterGreater = "⪢̸";
var NotNestedLessLess = "⪡̸";
var notni = "∌";
var notniva = "∌";
var notnivb = "⋾";
var notnivc = "⋽";
var NotPrecedes = "⊀";
var NotPrecedesEqual = "⪯̸";
var NotPrecedesSlantEqual = "⋠";
var NotReverseElement = "∌";
var NotRightTriangleBar = "⧐̸";
var NotRightTriangle = "⋫";
var NotRightTriangleEqual = "⋭";
var NotSquareSubset = "⊏̸";
var NotSquareSubsetEqual = "⋢";
var NotSquareSuperset = "⊐̸";
var NotSquareSupersetEqual = "⋣";
var NotSubset = "⊂⃒";
var NotSubsetEqual = "⊈";
var NotSucceeds = "⊁";
var NotSucceedsEqual = "⪰̸";
var NotSucceedsSlantEqual = "⋡";
var NotSucceedsTilde = "≿̸";
var NotSuperset = "⊃⃒";
var NotSupersetEqual = "⊉";
var NotTilde = "≁";
var NotTildeEqual = "≄";
var NotTildeFullEqual = "≇";
var NotTildeTilde = "≉";
var NotVerticalBar = "∤";
var nparallel = "∦";
var npar = "∦";
var nparsl = "⫽⃥";
var npart = "∂̸";
var npolint = "⨔";
var npr = "⊀";
var nprcue = "⋠";
var nprec = "⊀";
var npreceq = "⪯̸";
var npre = "⪯̸";
var nrarrc = "⤳̸";
var nrarr = "↛";
var nrArr = "⇏";
var nrarrw = "↝̸";
var nrightarrow = "↛";
var nRightarrow = "⇏";
var nrtri = "⋫";
var nrtrie = "⋭";
var nsc = "⊁";
var nsccue = "⋡";
var nsce = "⪰̸";
var Nscr = "𝒩";
var nscr = "𝓃";
var nshortmid = "∤";
var nshortparallel = "∦";
var nsim = "≁";
var nsime = "≄";
var nsimeq = "≄";
var nsmid = "∤";
var nspar = "∦";
var nsqsube = "⋢";
var nsqsupe = "⋣";
var nsub = "⊄";
var nsubE = "⫅̸";
var nsube = "⊈";
var nsubset = "⊂⃒";
var nsubseteq = "⊈";
var nsubseteqq = "⫅̸";
var nsucc = "⊁";
var nsucceq = "⪰̸";
var nsup = "⊅";
var nsupE = "⫆̸";
var nsupe = "⊉";
var nsupset = "⊃⃒";
var nsupseteq = "⊉";
var nsupseteqq = "⫆̸";
var ntgl = "≹";
var Ntilde = "Ñ";
var ntilde = "ñ";
var ntlg = "≸";
var ntriangleleft = "⋪";
var ntrianglelefteq = "⋬";
var ntriangleright = "⋫";
var ntrianglerighteq = "⋭";
var Nu = "Ν";
var nu = "ν";
var num = "#";
var numero = "№";
var numsp = " ";
var nvap = "≍⃒";
var nvdash = "⊬";
var nvDash = "⊭";
var nVdash = "⊮";
var nVDash = "⊯";
var nvge = "≥⃒";
var nvgt = ">⃒";
var nvHarr = "⤄";
var nvinfin = "⧞";
var nvlArr = "⤂";
var nvle = "≤⃒";
var nvlt = "<⃒";
var nvltrie = "⊴⃒";
var nvrArr = "⤃";
var nvrtrie = "⊵⃒";
var nvsim = "∼⃒";
var nwarhk = "⤣";
var nwarr = "↖";
var nwArr = "⇖";
var nwarrow = "↖";
var nwnear = "⤧";
var Oacute = "Ó";
var oacute = "ó";
var oast = "⊛";
var Ocirc = "Ô";
var ocirc = "ô";
var ocir = "⊚";
var Ocy = "О";
var ocy = "о";
var odash = "⊝";
var Odblac = "Ő";
var odblac = "ő";
var odiv = "⨸";
var odot = "⊙";
var odsold = "⦼";
var OElig = "Œ";
var oelig = "œ";
var ofcir = "⦿";
var Ofr = "𝔒";
var ofr = "𝔬";
var ogon = "˛";
var Ograve = "Ò";
var ograve = "ò";
var ogt = "⧁";
var ohbar = "⦵";
var ohm = "Ω";
var oint = "∮";
var olarr = "↺";
var olcir = "⦾";
var olcross = "⦻";
var oline = "‾";
var olt = "⧀";
var Omacr = "Ō";
var omacr = "ō";
var Omega = "Ω";
var omega = "ω";
var Omicron = "Ο";
var omicron = "ο";
var omid = "⦶";
var ominus = "⊖";
var Oopf = "𝕆";
var oopf = "𝕠";
var opar = "⦷";
var OpenCurlyDoubleQuote = "“";
var OpenCurlyQuote = "‘";
var operp = "⦹";
var oplus = "⊕";
var orarr = "↻";
var Or = "⩔";
var or = "∨";
var ord = "⩝";
var order = "ℴ";
var orderof = "ℴ";
var ordf = "ª";
var ordm = "º";
var origof = "⊶";
var oror = "⩖";
var orslope = "⩗";
var orv = "⩛";
var oS = "Ⓢ";
var Oscr = "𝒪";
var oscr = "ℴ";
var Oslash = "Ø";
var oslash = "ø";
var osol = "⊘";
var Otilde = "Õ";
var otilde = "õ";
var otimesas = "⨶";
var Otimes = "⨷";
var otimes = "⊗";
var Ouml = "Ö";
var ouml = "ö";
var ovbar = "⌽";
var OverBar = "‾";
var OverBrace = "⏞";
var OverBracket = "⎴";
var OverParenthesis = "⏜";
var para = "¶";
var parallel = "∥";
var par = "∥";
var parsim = "⫳";
var parsl = "⫽";
var part = "∂";
var PartialD = "∂";
var Pcy = "П";
var pcy = "п";
var percnt = "%";
var period = ".";
var permil = "‰";
var perp = "⊥";
var pertenk = "‱";
var Pfr = "𝔓";
var pfr = "𝔭";
var Phi = "Φ";
var phi = "φ";
var phiv = "ϕ";
var phmmat = "ℳ";
var phone = "☎";
var Pi = "Π";
var pi = "π";
var pitchfork = "⋔";
var piv = "ϖ";
var planck = "ℏ";
var planckh = "ℎ";
var plankv = "ℏ";
var plusacir = "⨣";
var plusb = "⊞";
var pluscir = "⨢";
var plus = "+";
var plusdo = "∔";
var plusdu = "⨥";
var pluse = "⩲";
var PlusMinus = "±";
var plusmn = "±";
var plussim = "⨦";
var plustwo = "⨧";
var pm = "±";
var Poincareplane = "ℌ";
var pointint = "⨕";
var popf = "𝕡";
var Popf = "ℙ";
var pound = "£";
var prap = "⪷";
var Pr = "⪻";
var pr = "≺";
var prcue = "≼";
var precapprox = "⪷";
var prec = "≺";
var preccurlyeq = "≼";
var Precedes = "≺";
var PrecedesEqual = "⪯";
var PrecedesSlantEqual = "≼";
var PrecedesTilde = "≾";
var preceq = "⪯";
var precnapprox = "⪹";
var precneqq = "⪵";
var precnsim = "⋨";
var pre = "⪯";
var prE = "⪳";
var precsim = "≾";
var prime = "′";
var Prime = "″";
var primes = "ℙ";
var prnap = "⪹";
var prnE = "⪵";
var prnsim = "⋨";
var prod = "∏";
var Product = "∏";
var profalar = "⌮";
var profline = "⌒";
var profsurf = "⌓";
var prop = "∝";
var Proportional = "∝";
var Proportion = "∷";
var propto = "∝";
var prsim = "≾";
var prurel = "⊰";
var Pscr = "𝒫";
var pscr = "𝓅";
var Psi = "Ψ";
var psi = "ψ";
var puncsp = " ";
var Qfr = "𝔔";
var qfr = "𝔮";
var qint = "⨌";
var qopf = "𝕢";
var Qopf = "ℚ";
var qprime = "⁗";
var Qscr = "𝒬";
var qscr = "𝓆";
var quaternions = "ℍ";
var quatint = "⨖";
var quest = "?";
var questeq = "≟";
var quot = "\"";
var QUOT = "\"";
var rAarr = "⇛";
var race = "∽̱";
var Racute = "Ŕ";
var racute = "ŕ";
var radic = "√";
var raemptyv = "⦳";
var rang = "⟩";
var Rang = "⟫";
var rangd = "⦒";
var range = "⦥";
var rangle = "⟩";
var raquo = "»";
var rarrap = "⥵";
var rarrb = "⇥";
var rarrbfs = "⤠";
var rarrc = "⤳";
var rarr = "→";
var Rarr = "↠";
var rArr = "⇒";
var rarrfs = "⤞";
var rarrhk = "↪";
var rarrlp = "↬";
var rarrpl = "⥅";
var rarrsim = "⥴";
var Rarrtl = "⤖";
var rarrtl = "↣";
var rarrw = "↝";
var ratail = "⤚";
var rAtail = "⤜";
var ratio = "∶";
var rationals = "ℚ";
var rbarr = "⤍";
var rBarr = "⤏";
var RBarr = "⤐";
var rbbrk = "❳";
var rbrace = "}";
var rbrack = "]";
var rbrke = "⦌";
var rbrksld = "⦎";
var rbrkslu = "⦐";
var Rcaron = "Ř";
var rcaron = "ř";
var Rcedil = "Ŗ";
var rcedil = "ŗ";
var rceil = "⌉";
var rcub = "}";
var Rcy = "Р";
var rcy = "р";
var rdca = "⤷";
var rdldhar = "⥩";
var rdquo = "”";
var rdquor = "”";
var rdsh = "↳";
var real = "ℜ";
var realine = "ℛ";
var realpart = "ℜ";
var reals = "ℝ";
var Re = "ℜ";
var rect = "▭";
var reg = "®";
var REG = "®";
var ReverseElement = "∋";
var ReverseEquilibrium = "⇋";
var ReverseUpEquilibrium = "⥯";
var rfisht = "⥽";
var rfloor = "⌋";
var rfr = "𝔯";
var Rfr = "ℜ";
var rHar = "⥤";
var rhard = "⇁";
var rharu = "⇀";
var rharul = "⥬";
var Rho = "Ρ";
var rho = "ρ";
var rhov = "ϱ";
var RightAngleBracket = "⟩";
var RightArrowBar = "⇥";
var rightarrow = "→";
var RightArrow = "→";
var Rightarrow = "⇒";
var RightArrowLeftArrow = "⇄";
var rightarrowtail = "↣";
var RightCeiling = "⌉";
var RightDoubleBracket = "⟧";
var RightDownTeeVector = "⥝";
var RightDownVectorBar = "⥕";
var RightDownVector = "⇂";
var RightFloor = "⌋";
var rightharpoondown = "⇁";
var rightharpoonup = "⇀";
var rightleftarrows = "⇄";
var rightleftharpoons = "⇌";
var rightrightarrows = "⇉";
var rightsquigarrow = "↝";
var RightTeeArrow = "↦";
var RightTee = "⊢";
var RightTeeVector = "⥛";
var rightthreetimes = "⋌";
var RightTriangleBar = "⧐";
var RightTriangle = "⊳";
var RightTriangleEqual = "⊵";
var RightUpDownVector = "⥏";
var RightUpTeeVector = "⥜";
var RightUpVectorBar = "⥔";
var RightUpVector = "↾";
var RightVectorBar = "⥓";
var RightVector = "⇀";
var ring = "˚";
var risingdotseq = "≓";
var rlarr = "⇄";
var rlhar = "⇌";
var rlm = "‏";
var rmoustache = "⎱";
var rmoust = "⎱";
var rnmid = "⫮";
var roang = "⟭";
var roarr = "⇾";
var robrk = "⟧";
var ropar = "⦆";
var ropf = "𝕣";
var Ropf = "ℝ";
var roplus = "⨮";
var rotimes = "⨵";
var RoundImplies = "⥰";
var rpar = ")";
var rpargt = "⦔";
var rppolint = "⨒";
var rrarr = "⇉";
var Rrightarrow = "⇛";
var rsaquo = "›";
var rscr = "𝓇";
var Rscr = "ℛ";
var rsh = "↱";
var Rsh = "↱";
var rsqb = "]";
var rsquo = "’";
var rsquor = "’";
var rthree = "⋌";
var rtimes = "⋊";
var rtri = "▹";
var rtrie = "⊵";
var rtrif = "▸";
var rtriltri = "⧎";
var RuleDelayed = "⧴";
var ruluhar = "⥨";
var rx = "℞";
var Sacute = "Ś";
var sacute = "ś";
var sbquo = "‚";
var scap = "⪸";
var Scaron = "Š";
var scaron = "š";
var Sc = "⪼";
var sc = "≻";
var sccue = "≽";
var sce = "⪰";
var scE = "⪴";
var Scedil = "Ş";
var scedil = "ş";
var Scirc = "Ŝ";
var scirc = "ŝ";
var scnap = "⪺";
var scnE = "⪶";
var scnsim = "⋩";
var scpolint = "⨓";
var scsim = "≿";
var Scy = "С";
var scy = "с";
var sdotb = "⊡";
var sdot = "⋅";
var sdote = "⩦";
var searhk = "⤥";
var searr = "↘";
var seArr = "⇘";
var searrow = "↘";
var sect = "§";
var semi = ";";
var seswar = "⤩";
var setminus = "∖";
var setmn = "∖";
var sext = "✶";
var Sfr = "𝔖";
var sfr = "𝔰";
var sfrown = "⌢";
var sharp = "♯";
var SHCHcy = "Щ";
var shchcy = "щ";
var SHcy = "Ш";
var shcy = "ш";
var ShortDownArrow = "↓";
var ShortLeftArrow = "←";
var shortmid = "∣";
var shortparallel = "∥";
var ShortRightArrow = "→";
var ShortUpArrow = "↑";
var shy = "­";
var Sigma = "Σ";
var sigma = "σ";
var sigmaf = "ς";
var sigmav = "ς";
var sim = "∼";
var simdot = "⩪";
var sime = "≃";
var simeq = "≃";
var simg = "⪞";
var simgE = "⪠";
var siml = "⪝";
var simlE = "⪟";
var simne = "≆";
var simplus = "⨤";
var simrarr = "⥲";
var slarr = "←";
var SmallCircle = "∘";
var smallsetminus = "∖";
var smashp = "⨳";
var smeparsl = "⧤";
var smid = "∣";
var smile = "⌣";
var smt = "⪪";
var smte = "⪬";
var smtes = "⪬︀";
var SOFTcy = "Ь";
var softcy = "ь";
var solbar = "⌿";
var solb = "⧄";
var sol = "/";
var Sopf = "𝕊";
var sopf = "𝕤";
var spades = "♠";
var spadesuit = "♠";
var spar = "∥";
var sqcap = "⊓";
var sqcaps = "⊓︀";
var sqcup = "⊔";
var sqcups = "⊔︀";
var Sqrt = "√";
var sqsub = "⊏";
var sqsube = "⊑";
var sqsubset = "⊏";
var sqsubseteq = "⊑";
var sqsup = "⊐";
var sqsupe = "⊒";
var sqsupset = "⊐";
var sqsupseteq = "⊒";
var square = "□";
var Square = "□";
var SquareIntersection = "⊓";
var SquareSubset = "⊏";
var SquareSubsetEqual = "⊑";
var SquareSuperset = "⊐";
var SquareSupersetEqual = "⊒";
var SquareUnion = "⊔";
var squarf = "▪";
var squ = "□";
var squf = "▪";
var srarr = "→";
var Sscr = "𝒮";
var sscr = "𝓈";
var ssetmn = "∖";
var ssmile = "⌣";
var sstarf = "⋆";
var Star = "⋆";
var star = "☆";
var starf = "★";
var straightepsilon = "ϵ";
var straightphi = "ϕ";
var strns = "¯";
var sub = "⊂";
var Sub = "⋐";
var subdot = "⪽";
var subE = "⫅";
var sube = "⊆";
var subedot = "⫃";
var submult = "⫁";
var subnE = "⫋";
var subne = "⊊";
var subplus = "⪿";
var subrarr = "⥹";
var subset = "⊂";
var Subset = "⋐";
var subseteq = "⊆";
var subseteqq = "⫅";
var SubsetEqual = "⊆";
var subsetneq = "⊊";
var subsetneqq = "⫋";
var subsim = "⫇";
var subsub = "⫕";
var subsup = "⫓";
var succapprox = "⪸";
var succ = "≻";
var succcurlyeq = "≽";
var Succeeds = "≻";
var SucceedsEqual = "⪰";
var SucceedsSlantEqual = "≽";
var SucceedsTilde = "≿";
var succeq = "⪰";
var succnapprox = "⪺";
var succneqq = "⪶";
var succnsim = "⋩";
var succsim = "≿";
var SuchThat = "∋";
var sum = "∑";
var Sum = "∑";
var sung = "♪";
var sup1 = "¹";
var sup2 = "²";
var sup3 = "³";
var sup = "⊃";
var Sup = "⋑";
var supdot = "⪾";
var supdsub = "⫘";
var supE = "⫆";
var supe = "⊇";
var supedot = "⫄";
var Superset = "⊃";
var SupersetEqual = "⊇";
var suphsol = "⟉";
var suphsub = "⫗";
var suplarr = "⥻";
var supmult = "⫂";
var supnE = "⫌";
var supne = "⊋";
var supplus = "⫀";
var supset = "⊃";
var Supset = "⋑";
var supseteq = "⊇";
var supseteqq = "⫆";
var supsetneq = "⊋";
var supsetneqq = "⫌";
var supsim = "⫈";
var supsub = "⫔";
var supsup = "⫖";
var swarhk = "⤦";
var swarr = "↙";
var swArr = "⇙";
var swarrow = "↙";
var swnwar = "⤪";
var szlig = "ß";
var Tab = "\t";
var target = "⌖";
var Tau = "Τ";
var tau = "τ";
var tbrk = "⎴";
var Tcaron = "Ť";
var tcaron = "ť";
var Tcedil = "Ţ";
var tcedil = "ţ";
var Tcy = "Т";
var tcy = "т";
var tdot = "⃛";
var telrec = "⌕";
var Tfr = "𝔗";
var tfr = "𝔱";
var there4 = "∴";
var therefore = "∴";
var Therefore = "∴";
var Theta = "Θ";
var theta = "θ";
var thetasym = "ϑ";
var thetav = "ϑ";
var thickapprox = "≈";
var thicksim = "∼";
var ThickSpace = "  ";
var ThinSpace = " ";
var thinsp = " ";
var thkap = "≈";
var thksim = "∼";
var THORN = "Þ";
var thorn = "þ";
var tilde = "˜";
var Tilde = "∼";
var TildeEqual = "≃";
var TildeFullEqual = "≅";
var TildeTilde = "≈";
var timesbar = "⨱";
var timesb = "⊠";
var times = "×";
var timesd = "⨰";
var tint = "∭";
var toea = "⤨";
var topbot = "⌶";
var topcir = "⫱";
var top = "⊤";
var Topf = "𝕋";
var topf = "𝕥";
var topfork = "⫚";
var tosa = "⤩";
var tprime = "‴";
var trade = "™";
var TRADE = "™";
var triangle = "▵";
var triangledown = "▿";
var triangleleft = "◃";
var trianglelefteq = "⊴";
var triangleq = "≜";
var triangleright = "▹";
var trianglerighteq = "⊵";
var tridot = "◬";
var trie = "≜";
var triminus = "⨺";
var TripleDot = "⃛";
var triplus = "⨹";
var trisb = "⧍";
var tritime = "⨻";
var trpezium = "⏢";
var Tscr = "𝒯";
var tscr = "𝓉";
var TScy = "Ц";
var tscy = "ц";
var TSHcy = "Ћ";
var tshcy = "ћ";
var Tstrok = "Ŧ";
var tstrok = "ŧ";
var twixt = "≬";
var twoheadleftarrow = "↞";
var twoheadrightarrow = "↠";
var Uacute = "Ú";
var uacute = "ú";
var uarr = "↑";
var Uarr = "↟";
var uArr = "⇑";
var Uarrocir = "⥉";
var Ubrcy = "Ў";
var ubrcy = "ў";
var Ubreve = "Ŭ";
var ubreve = "ŭ";
var Ucirc = "Û";
var ucirc = "û";
var Ucy = "У";
var ucy = "у";
var udarr = "⇅";
var Udblac = "Ű";
var udblac = "ű";
var udhar = "⥮";
var ufisht = "⥾";
var Ufr = "𝔘";
var ufr = "𝔲";
var Ugrave = "Ù";
var ugrave = "ù";
var uHar = "⥣";
var uharl = "↿";
var uharr = "↾";
var uhblk = "▀";
var ulcorn = "⌜";
var ulcorner = "⌜";
var ulcrop = "⌏";
var ultri = "◸";
var Umacr = "Ū";
var umacr = "ū";
var uml = "¨";
var UnderBar = "_";
var UnderBrace = "⏟";
var UnderBracket = "⎵";
var UnderParenthesis = "⏝";
var Union = "⋃";
var UnionPlus = "⊎";
var Uogon = "Ų";
var uogon = "ų";
var Uopf = "𝕌";
var uopf = "𝕦";
var UpArrowBar = "⤒";
var uparrow = "↑";
var UpArrow = "↑";
var Uparrow = "⇑";
var UpArrowDownArrow = "⇅";
var updownarrow = "↕";
var UpDownArrow = "↕";
var Updownarrow = "⇕";
var UpEquilibrium = "⥮";
var upharpoonleft = "↿";
var upharpoonright = "↾";
var uplus = "⊎";
var UpperLeftArrow = "↖";
var UpperRightArrow = "↗";
var upsi = "υ";
var Upsi = "ϒ";
var upsih = "ϒ";
var Upsilon = "Υ";
var upsilon = "υ";
var UpTeeArrow = "↥";
var UpTee = "⊥";
var upuparrows = "⇈";
var urcorn = "⌝";
var urcorner = "⌝";
var urcrop = "⌎";
var Uring = "Ů";
var uring = "ů";
var urtri = "◹";
var Uscr = "𝒰";
var uscr = "𝓊";
var utdot = "⋰";
var Utilde = "Ũ";
var utilde = "ũ";
var utri = "▵";
var utrif = "▴";
var uuarr = "⇈";
var Uuml = "Ü";
var uuml = "ü";
var uwangle = "⦧";
var vangrt = "⦜";
var varepsilon = "ϵ";
var varkappa = "ϰ";
var varnothing = "∅";
var varphi = "ϕ";
var varpi = "ϖ";
var varpropto = "∝";
var varr = "↕";
var vArr = "⇕";
var varrho = "ϱ";
var varsigma = "ς";
var varsubsetneq = "⊊︀";
var varsubsetneqq = "⫋︀";
var varsupsetneq = "⊋︀";
var varsupsetneqq = "⫌︀";
var vartheta = "ϑ";
var vartriangleleft = "⊲";
var vartriangleright = "⊳";
var vBar = "⫨";
var Vbar = "⫫";
var vBarv = "⫩";
var Vcy = "В";
var vcy = "в";
var vdash = "⊢";
var vDash = "⊨";
var Vdash = "⊩";
var VDash = "⊫";
var Vdashl = "⫦";
var veebar = "⊻";
var vee = "∨";
var Vee = "⋁";
var veeeq = "≚";
var vellip = "⋮";
var verbar = "|";
var Verbar = "‖";
var vert = "|";
var Vert = "‖";
var VerticalBar = "∣";
var VerticalLine = "|";
var VerticalSeparator = "❘";
var VerticalTilde = "≀";
var VeryThinSpace = " ";
var Vfr = "𝔙";
var vfr = "𝔳";
var vltri = "⊲";
var vnsub = "⊂⃒";
var vnsup = "⊃⃒";
var Vopf = "𝕍";
var vopf = "𝕧";
var vprop = "∝";
var vrtri = "⊳";
var Vscr = "𝒱";
var vscr = "𝓋";
var vsubnE = "⫋︀";
var vsubne = "⊊︀";
var vsupnE = "⫌︀";
var vsupne = "⊋︀";
var Vvdash = "⊪";
var vzigzag = "⦚";
var Wcirc = "Ŵ";
var wcirc = "ŵ";
var wedbar = "⩟";
var wedge = "∧";
var Wedge = "⋀";
var wedgeq = "≙";
var weierp = "℘";
var Wfr = "𝔚";
var wfr = "𝔴";
var Wopf = "𝕎";
var wopf = "𝕨";
var wp = "℘";
var wr = "≀";
var wreath = "≀";
var Wscr = "𝒲";
var wscr = "𝓌";
var xcap = "⋂";
var xcirc = "◯";
var xcup = "⋃";
var xdtri = "▽";
var Xfr = "𝔛";
var xfr = "𝔵";
var xharr = "⟷";
var xhArr = "⟺";
var Xi = "Ξ";
var xi = "ξ";
var xlarr = "⟵";
var xlArr = "⟸";
var xmap = "⟼";
var xnis = "⋻";
var xodot = "⨀";
var Xopf = "𝕏";
var xopf = "𝕩";
var xoplus = "⨁";
var xotime = "⨂";
var xrarr = "⟶";
var xrArr = "⟹";
var Xscr = "𝒳";
var xscr = "𝓍";
var xsqcup = "⨆";
var xuplus = "⨄";
var xutri = "△";
var xvee = "⋁";
var xwedge = "⋀";
var Yacute = "Ý";
var yacute = "ý";
var YAcy = "Я";
var yacy = "я";
var Ycirc = "Ŷ";
var ycirc = "ŷ";
var Ycy = "Ы";
var ycy = "ы";
var yen = "¥";
var Yfr = "𝔜";
var yfr = "𝔶";
var YIcy = "Ї";
var yicy = "ї";
var Yopf = "𝕐";
var yopf = "𝕪";
var Yscr = "𝒴";
var yscr = "𝓎";
var YUcy = "Ю";
var yucy = "ю";
var yuml = "ÿ";
var Yuml = "Ÿ";
var Zacute = "Ź";
var zacute = "ź";
var Zcaron = "Ž";
var zcaron = "ž";
var Zcy = "З";
var zcy = "з";
var Zdot = "Ż";
var zdot = "ż";
var zeetrf = "ℨ";
var ZeroWidthSpace = "​";
var Zeta = "Ζ";
var zeta = "ζ";
var zfr = "𝔷";
var Zfr = "ℨ";
var ZHcy = "Ж";
var zhcy = "ж";
var zigrarr = "⇝";
var zopf = "𝕫";
var Zopf = "ℤ";
var Zscr = "𝒵";
var zscr = "𝓏";
var zwj = "‍";
var zwnj = "‌";
var require$$1 = {
	Aacute: Aacute,
	aacute: aacute,
	Abreve: Abreve,
	abreve: abreve,
	ac: ac,
	acd: acd,
	acE: acE,
	Acirc: Acirc,
	acirc: acirc,
	acute: acute,
	Acy: Acy,
	acy: acy,
	AElig: AElig,
	aelig: aelig,
	af: af,
	Afr: Afr,
	afr: afr,
	Agrave: Agrave,
	agrave: agrave,
	alefsym: alefsym,
	aleph: aleph,
	Alpha: Alpha,
	alpha: alpha,
	Amacr: Amacr,
	amacr: amacr,
	amalg: amalg,
	amp: amp,
	AMP: AMP,
	andand: andand,
	And: And,
	and: and,
	andd: andd,
	andslope: andslope,
	andv: andv,
	ang: ang,
	ange: ange,
	angle: angle,
	angmsdaa: angmsdaa,
	angmsdab: angmsdab,
	angmsdac: angmsdac,
	angmsdad: angmsdad,
	angmsdae: angmsdae,
	angmsdaf: angmsdaf,
	angmsdag: angmsdag,
	angmsdah: angmsdah,
	angmsd: angmsd,
	angrt: angrt,
	angrtvb: angrtvb,
	angrtvbd: angrtvbd,
	angsph: angsph,
	angst: angst,
	angzarr: angzarr,
	Aogon: Aogon,
	aogon: aogon,
	Aopf: Aopf,
	aopf: aopf,
	apacir: apacir,
	ap: ap,
	apE: apE,
	ape: ape,
	apid: apid,
	apos: apos,
	ApplyFunction: ApplyFunction,
	approx: approx,
	approxeq: approxeq,
	Aring: Aring,
	aring: aring,
	Ascr: Ascr,
	ascr: ascr,
	Assign: Assign,
	ast: ast,
	asymp: asymp,
	asympeq: asympeq,
	Atilde: Atilde,
	atilde: atilde,
	Auml: Auml,
	auml: auml,
	awconint: awconint,
	awint: awint,
	backcong: backcong,
	backepsilon: backepsilon,
	backprime: backprime,
	backsim: backsim,
	backsimeq: backsimeq,
	Backslash: Backslash,
	Barv: Barv,
	barvee: barvee,
	barwed: barwed,
	Barwed: Barwed,
	barwedge: barwedge,
	bbrk: bbrk,
	bbrktbrk: bbrktbrk,
	bcong: bcong,
	Bcy: Bcy,
	bcy: bcy,
	bdquo: bdquo,
	becaus: becaus,
	because: because,
	Because: Because,
	bemptyv: bemptyv,
	bepsi: bepsi,
	bernou: bernou,
	Bernoullis: Bernoullis,
	Beta: Beta,
	beta: beta,
	beth: beth,
	between: between,
	Bfr: Bfr,
	bfr: bfr,
	bigcap: bigcap,
	bigcirc: bigcirc,
	bigcup: bigcup,
	bigodot: bigodot,
	bigoplus: bigoplus,
	bigotimes: bigotimes,
	bigsqcup: bigsqcup,
	bigstar: bigstar,
	bigtriangledown: bigtriangledown,
	bigtriangleup: bigtriangleup,
	biguplus: biguplus,
	bigvee: bigvee,
	bigwedge: bigwedge,
	bkarow: bkarow,
	blacklozenge: blacklozenge,
	blacksquare: blacksquare,
	blacktriangle: blacktriangle,
	blacktriangledown: blacktriangledown,
	blacktriangleleft: blacktriangleleft,
	blacktriangleright: blacktriangleright,
	blank: blank,
	blk12: blk12,
	blk14: blk14,
	blk34: blk34,
	block: block,
	bne: bne,
	bnequiv: bnequiv,
	bNot: bNot,
	bnot: bnot,
	Bopf: Bopf,
	bopf: bopf,
	bot: bot,
	bottom: bottom,
	bowtie: bowtie,
	boxbox: boxbox,
	boxdl: boxdl,
	boxdL: boxdL,
	boxDl: boxDl,
	boxDL: boxDL,
	boxdr: boxdr,
	boxdR: boxdR,
	boxDr: boxDr,
	boxDR: boxDR,
	boxh: boxh,
	boxH: boxH,
	boxhd: boxhd,
	boxHd: boxHd,
	boxhD: boxhD,
	boxHD: boxHD,
	boxhu: boxhu,
	boxHu: boxHu,
	boxhU: boxhU,
	boxHU: boxHU,
	boxminus: boxminus,
	boxplus: boxplus,
	boxtimes: boxtimes,
	boxul: boxul,
	boxuL: boxuL,
	boxUl: boxUl,
	boxUL: boxUL,
	boxur: boxur,
	boxuR: boxuR,
	boxUr: boxUr,
	boxUR: boxUR,
	boxv: boxv,
	boxV: boxV,
	boxvh: boxvh,
	boxvH: boxvH,
	boxVh: boxVh,
	boxVH: boxVH,
	boxvl: boxvl,
	boxvL: boxvL,
	boxVl: boxVl,
	boxVL: boxVL,
	boxvr: boxvr,
	boxvR: boxvR,
	boxVr: boxVr,
	boxVR: boxVR,
	bprime: bprime,
	breve: breve,
	Breve: Breve,
	brvbar: brvbar,
	bscr: bscr,
	Bscr: Bscr,
	bsemi: bsemi,
	bsim: bsim,
	bsime: bsime,
	bsolb: bsolb,
	bsol: bsol,
	bsolhsub: bsolhsub,
	bull: bull,
	bullet: bullet,
	bump: bump,
	bumpE: bumpE,
	bumpe: bumpe,
	Bumpeq: Bumpeq,
	bumpeq: bumpeq,
	Cacute: Cacute,
	cacute: cacute,
	capand: capand,
	capbrcup: capbrcup,
	capcap: capcap,
	cap: cap,
	Cap: Cap,
	capcup: capcup,
	capdot: capdot,
	CapitalDifferentialD: CapitalDifferentialD,
	caps: caps,
	caret: caret,
	caron: caron,
	Cayleys: Cayleys,
	ccaps: ccaps,
	Ccaron: Ccaron,
	ccaron: ccaron,
	Ccedil: Ccedil,
	ccedil: ccedil,
	Ccirc: Ccirc,
	ccirc: ccirc,
	Cconint: Cconint,
	ccups: ccups,
	ccupssm: ccupssm,
	Cdot: Cdot,
	cdot: cdot,
	cedil: cedil,
	Cedilla: Cedilla,
	cemptyv: cemptyv,
	cent: cent,
	centerdot: centerdot,
	CenterDot: CenterDot,
	cfr: cfr,
	Cfr: Cfr,
	CHcy: CHcy,
	chcy: chcy,
	check: check,
	checkmark: checkmark,
	Chi: Chi,
	chi: chi,
	circ: circ,
	circeq: circeq,
	circlearrowleft: circlearrowleft,
	circlearrowright: circlearrowright,
	circledast: circledast,
	circledcirc: circledcirc,
	circleddash: circleddash,
	CircleDot: CircleDot,
	circledR: circledR,
	circledS: circledS,
	CircleMinus: CircleMinus,
	CirclePlus: CirclePlus,
	CircleTimes: CircleTimes,
	cir: cir,
	cirE: cirE,
	cire: cire,
	cirfnint: cirfnint,
	cirmid: cirmid,
	cirscir: cirscir,
	ClockwiseContourIntegral: ClockwiseContourIntegral,
	CloseCurlyDoubleQuote: CloseCurlyDoubleQuote,
	CloseCurlyQuote: CloseCurlyQuote,
	clubs: clubs,
	clubsuit: clubsuit,
	colon: colon,
	Colon: Colon,
	Colone: Colone,
	colone: colone,
	coloneq: coloneq,
	comma: comma,
	commat: commat,
	comp: comp,
	compfn: compfn,
	complement: complement,
	complexes: complexes,
	cong: cong,
	congdot: congdot,
	Congruent: Congruent,
	conint: conint,
	Conint: Conint,
	ContourIntegral: ContourIntegral,
	copf: copf,
	Copf: Copf,
	coprod: coprod,
	Coproduct: Coproduct,
	copy: copy$1,
	COPY: COPY,
	copysr: copysr,
	CounterClockwiseContourIntegral: CounterClockwiseContourIntegral,
	crarr: crarr,
	cross: cross,
	Cross: Cross,
	Cscr: Cscr,
	cscr: cscr,
	csub: csub,
	csube: csube,
	csup: csup,
	csupe: csupe,
	ctdot: ctdot,
	cudarrl: cudarrl,
	cudarrr: cudarrr,
	cuepr: cuepr,
	cuesc: cuesc,
	cularr: cularr,
	cularrp: cularrp,
	cupbrcap: cupbrcap,
	cupcap: cupcap,
	CupCap: CupCap,
	cup: cup,
	Cup: Cup,
	cupcup: cupcup,
	cupdot: cupdot,
	cupor: cupor,
	cups: cups,
	curarr: curarr,
	curarrm: curarrm,
	curlyeqprec: curlyeqprec,
	curlyeqsucc: curlyeqsucc,
	curlyvee: curlyvee,
	curlywedge: curlywedge,
	curren: curren,
	curvearrowleft: curvearrowleft,
	curvearrowright: curvearrowright,
	cuvee: cuvee,
	cuwed: cuwed,
	cwconint: cwconint,
	cwint: cwint,
	cylcty: cylcty,
	dagger: dagger,
	Dagger: Dagger,
	daleth: daleth,
	darr: darr,
	Darr: Darr,
	dArr: dArr,
	dash: dash,
	Dashv: Dashv,
	dashv: dashv,
	dbkarow: dbkarow,
	dblac: dblac,
	Dcaron: Dcaron,
	dcaron: dcaron,
	Dcy: Dcy,
	dcy: dcy,
	ddagger: ddagger,
	ddarr: ddarr,
	DD: DD,
	dd: dd,
	DDotrahd: DDotrahd,
	ddotseq: ddotseq,
	deg: deg,
	Del: Del,
	Delta: Delta,
	delta: delta,
	demptyv: demptyv,
	dfisht: dfisht,
	Dfr: Dfr,
	dfr: dfr,
	dHar: dHar,
	dharl: dharl,
	dharr: dharr,
	DiacriticalAcute: DiacriticalAcute,
	DiacriticalDot: DiacriticalDot,
	DiacriticalDoubleAcute: DiacriticalDoubleAcute,
	DiacriticalGrave: DiacriticalGrave,
	DiacriticalTilde: DiacriticalTilde,
	diam: diam,
	diamond: diamond,
	Diamond: Diamond,
	diamondsuit: diamondsuit,
	diams: diams,
	die: die,
	DifferentialD: DifferentialD,
	digamma: digamma,
	disin: disin,
	div: div,
	divide: divide,
	divideontimes: divideontimes,
	divonx: divonx,
	DJcy: DJcy,
	djcy: djcy,
	dlcorn: dlcorn,
	dlcrop: dlcrop,
	dollar: dollar,
	Dopf: Dopf,
	dopf: dopf,
	Dot: Dot,
	dot: dot,
	DotDot: DotDot,
	doteq: doteq,
	doteqdot: doteqdot,
	DotEqual: DotEqual,
	dotminus: dotminus,
	dotplus: dotplus,
	dotsquare: dotsquare,
	doublebarwedge: doublebarwedge,
	DoubleContourIntegral: DoubleContourIntegral,
	DoubleDot: DoubleDot,
	DoubleDownArrow: DoubleDownArrow,
	DoubleLeftArrow: DoubleLeftArrow,
	DoubleLeftRightArrow: DoubleLeftRightArrow,
	DoubleLeftTee: DoubleLeftTee,
	DoubleLongLeftArrow: DoubleLongLeftArrow,
	DoubleLongLeftRightArrow: DoubleLongLeftRightArrow,
	DoubleLongRightArrow: DoubleLongRightArrow,
	DoubleRightArrow: DoubleRightArrow,
	DoubleRightTee: DoubleRightTee,
	DoubleUpArrow: DoubleUpArrow,
	DoubleUpDownArrow: DoubleUpDownArrow,
	DoubleVerticalBar: DoubleVerticalBar,
	DownArrowBar: DownArrowBar,
	downarrow: downarrow,
	DownArrow: DownArrow,
	Downarrow: Downarrow,
	DownArrowUpArrow: DownArrowUpArrow,
	DownBreve: DownBreve,
	downdownarrows: downdownarrows,
	downharpoonleft: downharpoonleft,
	downharpoonright: downharpoonright,
	DownLeftRightVector: DownLeftRightVector,
	DownLeftTeeVector: DownLeftTeeVector,
	DownLeftVectorBar: DownLeftVectorBar,
	DownLeftVector: DownLeftVector,
	DownRightTeeVector: DownRightTeeVector,
	DownRightVectorBar: DownRightVectorBar,
	DownRightVector: DownRightVector,
	DownTeeArrow: DownTeeArrow,
	DownTee: DownTee,
	drbkarow: drbkarow,
	drcorn: drcorn,
	drcrop: drcrop,
	Dscr: Dscr,
	dscr: dscr,
	DScy: DScy,
	dscy: dscy,
	dsol: dsol,
	Dstrok: Dstrok,
	dstrok: dstrok,
	dtdot: dtdot,
	dtri: dtri,
	dtrif: dtrif,
	duarr: duarr,
	duhar: duhar,
	dwangle: dwangle,
	DZcy: DZcy,
	dzcy: dzcy,
	dzigrarr: dzigrarr,
	Eacute: Eacute,
	eacute: eacute,
	easter: easter,
	Ecaron: Ecaron,
	ecaron: ecaron,
	Ecirc: Ecirc,
	ecirc: ecirc,
	ecir: ecir,
	ecolon: ecolon,
	Ecy: Ecy,
	ecy: ecy,
	eDDot: eDDot,
	Edot: Edot,
	edot: edot,
	eDot: eDot,
	ee: ee,
	efDot: efDot,
	Efr: Efr,
	efr: efr,
	eg: eg,
	Egrave: Egrave,
	egrave: egrave,
	egs: egs,
	egsdot: egsdot,
	el: el,
	Element: Element,
	elinters: elinters,
	ell: ell,
	els: els,
	elsdot: elsdot,
	Emacr: Emacr,
	emacr: emacr,
	empty: empty,
	emptyset: emptyset,
	EmptySmallSquare: EmptySmallSquare,
	emptyv: emptyv,
	EmptyVerySmallSquare: EmptyVerySmallSquare,
	emsp13: emsp13,
	emsp14: emsp14,
	emsp: emsp,
	ENG: ENG,
	eng: eng,
	ensp: ensp,
	Eogon: Eogon,
	eogon: eogon,
	Eopf: Eopf,
	eopf: eopf,
	epar: epar,
	eparsl: eparsl,
	eplus: eplus,
	epsi: epsi,
	Epsilon: Epsilon,
	epsilon: epsilon,
	epsiv: epsiv,
	eqcirc: eqcirc,
	eqcolon: eqcolon,
	eqsim: eqsim,
	eqslantgtr: eqslantgtr,
	eqslantless: eqslantless,
	Equal: Equal,
	equals: equals,
	EqualTilde: EqualTilde,
	equest: equest,
	Equilibrium: Equilibrium,
	equiv: equiv,
	equivDD: equivDD,
	eqvparsl: eqvparsl,
	erarr: erarr,
	erDot: erDot,
	escr: escr,
	Escr: Escr,
	esdot: esdot,
	Esim: Esim,
	esim: esim,
	Eta: Eta,
	eta: eta,
	ETH: ETH,
	eth: eth,
	Euml: Euml,
	euml: euml,
	euro: euro,
	excl: excl,
	exist: exist,
	Exists: Exists,
	expectation: expectation,
	exponentiale: exponentiale,
	ExponentialE: ExponentialE,
	fallingdotseq: fallingdotseq,
	Fcy: Fcy,
	fcy: fcy,
	female: female,
	ffilig: ffilig,
	fflig: fflig,
	ffllig: ffllig,
	Ffr: Ffr,
	ffr: ffr,
	filig: filig,
	FilledSmallSquare: FilledSmallSquare,
	FilledVerySmallSquare: FilledVerySmallSquare,
	fjlig: fjlig,
	flat: flat,
	fllig: fllig,
	fltns: fltns,
	fnof: fnof,
	Fopf: Fopf,
	fopf: fopf,
	forall: forall,
	ForAll: ForAll,
	fork: fork,
	forkv: forkv,
	Fouriertrf: Fouriertrf,
	fpartint: fpartint,
	frac12: frac12,
	frac13: frac13,
	frac14: frac14,
	frac15: frac15,
	frac16: frac16,
	frac18: frac18,
	frac23: frac23,
	frac25: frac25,
	frac34: frac34,
	frac35: frac35,
	frac38: frac38,
	frac45: frac45,
	frac56: frac56,
	frac58: frac58,
	frac78: frac78,
	frasl: frasl,
	frown: frown,
	fscr: fscr,
	Fscr: Fscr,
	gacute: gacute,
	Gamma: Gamma,
	gamma: gamma,
	Gammad: Gammad,
	gammad: gammad,
	gap: gap,
	Gbreve: Gbreve,
	gbreve: gbreve,
	Gcedil: Gcedil,
	Gcirc: Gcirc,
	gcirc: gcirc,
	Gcy: Gcy,
	gcy: gcy,
	Gdot: Gdot,
	gdot: gdot,
	ge: ge,
	gE: gE,
	gEl: gEl,
	gel: gel,
	geq: geq,
	geqq: geqq,
	geqslant: geqslant,
	gescc: gescc,
	ges: ges,
	gesdot: gesdot,
	gesdoto: gesdoto,
	gesdotol: gesdotol,
	gesl: gesl,
	gesles: gesles,
	Gfr: Gfr,
	gfr: gfr,
	gg: gg,
	Gg: Gg,
	ggg: ggg,
	gimel: gimel,
	GJcy: GJcy,
	gjcy: gjcy,
	gla: gla,
	gl: gl,
	glE: glE,
	glj: glj,
	gnap: gnap,
	gnapprox: gnapprox,
	gne: gne,
	gnE: gnE,
	gneq: gneq,
	gneqq: gneqq,
	gnsim: gnsim,
	Gopf: Gopf,
	gopf: gopf,
	grave: grave,
	GreaterEqual: GreaterEqual,
	GreaterEqualLess: GreaterEqualLess,
	GreaterFullEqual: GreaterFullEqual,
	GreaterGreater: GreaterGreater,
	GreaterLess: GreaterLess,
	GreaterSlantEqual: GreaterSlantEqual,
	GreaterTilde: GreaterTilde,
	Gscr: Gscr,
	gscr: gscr,
	gsim: gsim,
	gsime: gsime,
	gsiml: gsiml,
	gtcc: gtcc,
	gtcir: gtcir,
	gt: gt,
	GT: GT,
	Gt: Gt,
	gtdot: gtdot,
	gtlPar: gtlPar,
	gtquest: gtquest,
	gtrapprox: gtrapprox,
	gtrarr: gtrarr,
	gtrdot: gtrdot,
	gtreqless: gtreqless,
	gtreqqless: gtreqqless,
	gtrless: gtrless,
	gtrsim: gtrsim,
	gvertneqq: gvertneqq,
	gvnE: gvnE,
	Hacek: Hacek,
	hairsp: hairsp,
	half: half,
	hamilt: hamilt,
	HARDcy: HARDcy,
	hardcy: hardcy,
	harrcir: harrcir,
	harr: harr,
	hArr: hArr,
	harrw: harrw,
	Hat: Hat,
	hbar: hbar,
	Hcirc: Hcirc,
	hcirc: hcirc,
	hearts: hearts,
	heartsuit: heartsuit,
	hellip: hellip,
	hercon: hercon,
	hfr: hfr,
	Hfr: Hfr,
	HilbertSpace: HilbertSpace,
	hksearow: hksearow,
	hkswarow: hkswarow,
	hoarr: hoarr,
	homtht: homtht,
	hookleftarrow: hookleftarrow,
	hookrightarrow: hookrightarrow,
	hopf: hopf,
	Hopf: Hopf,
	horbar: horbar,
	HorizontalLine: HorizontalLine,
	hscr: hscr,
	Hscr: Hscr,
	hslash: hslash,
	Hstrok: Hstrok,
	hstrok: hstrok,
	HumpDownHump: HumpDownHump,
	HumpEqual: HumpEqual,
	hybull: hybull,
	hyphen: hyphen,
	Iacute: Iacute,
	iacute: iacute,
	ic: ic,
	Icirc: Icirc,
	icirc: icirc,
	Icy: Icy,
	icy: icy,
	Idot: Idot,
	IEcy: IEcy,
	iecy: iecy,
	iexcl: iexcl,
	iff: iff,
	ifr: ifr,
	Ifr: Ifr,
	Igrave: Igrave,
	igrave: igrave,
	ii: ii,
	iiiint: iiiint,
	iiint: iiint,
	iinfin: iinfin,
	iiota: iiota,
	IJlig: IJlig,
	ijlig: ijlig,
	Imacr: Imacr,
	imacr: imacr,
	image: image,
	ImaginaryI: ImaginaryI,
	imagline: imagline,
	imagpart: imagpart,
	imath: imath,
	Im: Im,
	imof: imof,
	imped: imped,
	Implies: Implies,
	incare: incare,
	"in": "∈",
	infin: infin,
	infintie: infintie,
	inodot: inodot,
	intcal: intcal,
	int: int,
	Int: Int,
	integers: integers,
	Integral: Integral,
	intercal: intercal,
	Intersection: Intersection,
	intlarhk: intlarhk,
	intprod: intprod,
	InvisibleComma: InvisibleComma,
	InvisibleTimes: InvisibleTimes,
	IOcy: IOcy,
	iocy: iocy,
	Iogon: Iogon,
	iogon: iogon,
	Iopf: Iopf,
	iopf: iopf,
	Iota: Iota,
	iota: iota,
	iprod: iprod,
	iquest: iquest,
	iscr: iscr,
	Iscr: Iscr,
	isin: isin,
	isindot: isindot,
	isinE: isinE,
	isins: isins,
	isinsv: isinsv,
	isinv: isinv,
	it: it,
	Itilde: Itilde,
	itilde: itilde,
	Iukcy: Iukcy,
	iukcy: iukcy,
	Iuml: Iuml,
	iuml: iuml,
	Jcirc: Jcirc,
	jcirc: jcirc,
	Jcy: Jcy,
	jcy: jcy,
	Jfr: Jfr,
	jfr: jfr,
	jmath: jmath,
	Jopf: Jopf,
	jopf: jopf,
	Jscr: Jscr,
	jscr: jscr,
	Jsercy: Jsercy,
	jsercy: jsercy,
	Jukcy: Jukcy,
	jukcy: jukcy,
	Kappa: Kappa,
	kappa: kappa,
	kappav: kappav,
	Kcedil: Kcedil,
	kcedil: kcedil,
	Kcy: Kcy,
	kcy: kcy,
	Kfr: Kfr,
	kfr: kfr,
	kgreen: kgreen,
	KHcy: KHcy,
	khcy: khcy,
	KJcy: KJcy,
	kjcy: kjcy,
	Kopf: Kopf,
	kopf: kopf,
	Kscr: Kscr,
	kscr: kscr,
	lAarr: lAarr,
	Lacute: Lacute,
	lacute: lacute,
	laemptyv: laemptyv,
	lagran: lagran,
	Lambda: Lambda,
	lambda: lambda,
	lang: lang,
	Lang: Lang,
	langd: langd,
	langle: langle,
	lap: lap,
	Laplacetrf: Laplacetrf,
	laquo: laquo,
	larrb: larrb,
	larrbfs: larrbfs,
	larr: larr,
	Larr: Larr,
	lArr: lArr,
	larrfs: larrfs,
	larrhk: larrhk,
	larrlp: larrlp,
	larrpl: larrpl,
	larrsim: larrsim,
	larrtl: larrtl,
	latail: latail,
	lAtail: lAtail,
	lat: lat,
	late: late,
	lates: lates,
	lbarr: lbarr,
	lBarr: lBarr,
	lbbrk: lbbrk,
	lbrace: lbrace,
	lbrack: lbrack,
	lbrke: lbrke,
	lbrksld: lbrksld,
	lbrkslu: lbrkslu,
	Lcaron: Lcaron,
	lcaron: lcaron,
	Lcedil: Lcedil,
	lcedil: lcedil,
	lceil: lceil,
	lcub: lcub,
	Lcy: Lcy,
	lcy: lcy,
	ldca: ldca,
	ldquo: ldquo,
	ldquor: ldquor,
	ldrdhar: ldrdhar,
	ldrushar: ldrushar,
	ldsh: ldsh,
	le: le,
	lE: lE,
	LeftAngleBracket: LeftAngleBracket,
	LeftArrowBar: LeftArrowBar,
	leftarrow: leftarrow,
	LeftArrow: LeftArrow,
	Leftarrow: Leftarrow,
	LeftArrowRightArrow: LeftArrowRightArrow,
	leftarrowtail: leftarrowtail,
	LeftCeiling: LeftCeiling,
	LeftDoubleBracket: LeftDoubleBracket,
	LeftDownTeeVector: LeftDownTeeVector,
	LeftDownVectorBar: LeftDownVectorBar,
	LeftDownVector: LeftDownVector,
	LeftFloor: LeftFloor,
	leftharpoondown: leftharpoondown,
	leftharpoonup: leftharpoonup,
	leftleftarrows: leftleftarrows,
	leftrightarrow: leftrightarrow,
	LeftRightArrow: LeftRightArrow,
	Leftrightarrow: Leftrightarrow,
	leftrightarrows: leftrightarrows,
	leftrightharpoons: leftrightharpoons,
	leftrightsquigarrow: leftrightsquigarrow,
	LeftRightVector: LeftRightVector,
	LeftTeeArrow: LeftTeeArrow,
	LeftTee: LeftTee,
	LeftTeeVector: LeftTeeVector,
	leftthreetimes: leftthreetimes,
	LeftTriangleBar: LeftTriangleBar,
	LeftTriangle: LeftTriangle,
	LeftTriangleEqual: LeftTriangleEqual,
	LeftUpDownVector: LeftUpDownVector,
	LeftUpTeeVector: LeftUpTeeVector,
	LeftUpVectorBar: LeftUpVectorBar,
	LeftUpVector: LeftUpVector,
	LeftVectorBar: LeftVectorBar,
	LeftVector: LeftVector,
	lEg: lEg,
	leg: leg,
	leq: leq,
	leqq: leqq,
	leqslant: leqslant,
	lescc: lescc,
	les: les,
	lesdot: lesdot,
	lesdoto: lesdoto,
	lesdotor: lesdotor,
	lesg: lesg,
	lesges: lesges,
	lessapprox: lessapprox,
	lessdot: lessdot,
	lesseqgtr: lesseqgtr,
	lesseqqgtr: lesseqqgtr,
	LessEqualGreater: LessEqualGreater,
	LessFullEqual: LessFullEqual,
	LessGreater: LessGreater,
	lessgtr: lessgtr,
	LessLess: LessLess,
	lesssim: lesssim,
	LessSlantEqual: LessSlantEqual,
	LessTilde: LessTilde,
	lfisht: lfisht,
	lfloor: lfloor,
	Lfr: Lfr,
	lfr: lfr,
	lg: lg,
	lgE: lgE,
	lHar: lHar,
	lhard: lhard,
	lharu: lharu,
	lharul: lharul,
	lhblk: lhblk,
	LJcy: LJcy,
	ljcy: ljcy,
	llarr: llarr,
	ll: ll,
	Ll: Ll,
	llcorner: llcorner,
	Lleftarrow: Lleftarrow,
	llhard: llhard,
	lltri: lltri,
	Lmidot: Lmidot,
	lmidot: lmidot,
	lmoustache: lmoustache,
	lmoust: lmoust,
	lnap: lnap,
	lnapprox: lnapprox,
	lne: lne,
	lnE: lnE,
	lneq: lneq,
	lneqq: lneqq,
	lnsim: lnsim,
	loang: loang,
	loarr: loarr,
	lobrk: lobrk,
	longleftarrow: longleftarrow,
	LongLeftArrow: LongLeftArrow,
	Longleftarrow: Longleftarrow,
	longleftrightarrow: longleftrightarrow,
	LongLeftRightArrow: LongLeftRightArrow,
	Longleftrightarrow: Longleftrightarrow,
	longmapsto: longmapsto,
	longrightarrow: longrightarrow,
	LongRightArrow: LongRightArrow,
	Longrightarrow: Longrightarrow,
	looparrowleft: looparrowleft,
	looparrowright: looparrowright,
	lopar: lopar,
	Lopf: Lopf,
	lopf: lopf,
	loplus: loplus,
	lotimes: lotimes,
	lowast: lowast,
	lowbar: lowbar,
	LowerLeftArrow: LowerLeftArrow,
	LowerRightArrow: LowerRightArrow,
	loz: loz,
	lozenge: lozenge,
	lozf: lozf,
	lpar: lpar,
	lparlt: lparlt,
	lrarr: lrarr,
	lrcorner: lrcorner,
	lrhar: lrhar,
	lrhard: lrhard,
	lrm: lrm,
	lrtri: lrtri,
	lsaquo: lsaquo,
	lscr: lscr,
	Lscr: Lscr,
	lsh: lsh,
	Lsh: Lsh,
	lsim: lsim,
	lsime: lsime,
	lsimg: lsimg,
	lsqb: lsqb,
	lsquo: lsquo,
	lsquor: lsquor,
	Lstrok: Lstrok,
	lstrok: lstrok,
	ltcc: ltcc,
	ltcir: ltcir,
	lt: lt,
	LT: LT,
	Lt: Lt,
	ltdot: ltdot,
	lthree: lthree,
	ltimes: ltimes,
	ltlarr: ltlarr,
	ltquest: ltquest,
	ltri: ltri,
	ltrie: ltrie,
	ltrif: ltrif,
	ltrPar: ltrPar,
	lurdshar: lurdshar,
	luruhar: luruhar,
	lvertneqq: lvertneqq,
	lvnE: lvnE,
	macr: macr,
	male: male,
	malt: malt,
	maltese: maltese,
	"Map": "⤅",
	map: map,
	mapsto: mapsto,
	mapstodown: mapstodown,
	mapstoleft: mapstoleft,
	mapstoup: mapstoup,
	marker: marker,
	mcomma: mcomma,
	Mcy: Mcy,
	mcy: mcy,
	mdash: mdash,
	mDDot: mDDot,
	measuredangle: measuredangle,
	MediumSpace: MediumSpace,
	Mellintrf: Mellintrf,
	Mfr: Mfr,
	mfr: mfr,
	mho: mho,
	micro: micro,
	midast: midast,
	midcir: midcir,
	mid: mid,
	middot: middot,
	minusb: minusb,
	minus: minus,
	minusd: minusd,
	minusdu: minusdu,
	MinusPlus: MinusPlus,
	mlcp: mlcp,
	mldr: mldr,
	mnplus: mnplus,
	models: models,
	Mopf: Mopf,
	mopf: mopf,
	mp: mp,
	mscr: mscr,
	Mscr: Mscr,
	mstpos: mstpos,
	Mu: Mu,
	mu: mu,
	multimap: multimap,
	mumap: mumap,
	nabla: nabla,
	Nacute: Nacute,
	nacute: nacute,
	nang: nang,
	nap: nap,
	napE: napE,
	napid: napid,
	napos: napos,
	napprox: napprox,
	natural: natural,
	naturals: naturals,
	natur: natur,
	nbsp: nbsp,
	nbump: nbump,
	nbumpe: nbumpe,
	ncap: ncap,
	Ncaron: Ncaron,
	ncaron: ncaron,
	Ncedil: Ncedil,
	ncedil: ncedil,
	ncong: ncong,
	ncongdot: ncongdot,
	ncup: ncup,
	Ncy: Ncy,
	ncy: ncy,
	ndash: ndash,
	nearhk: nearhk,
	nearr: nearr,
	neArr: neArr,
	nearrow: nearrow,
	ne: ne,
	nedot: nedot,
	NegativeMediumSpace: NegativeMediumSpace,
	NegativeThickSpace: NegativeThickSpace,
	NegativeThinSpace: NegativeThinSpace,
	NegativeVeryThinSpace: NegativeVeryThinSpace,
	nequiv: nequiv,
	nesear: nesear,
	nesim: nesim,
	NestedGreaterGreater: NestedGreaterGreater,
	NestedLessLess: NestedLessLess,
	NewLine: NewLine,
	nexist: nexist,
	nexists: nexists,
	Nfr: Nfr,
	nfr: nfr,
	ngE: ngE,
	nge: nge,
	ngeq: ngeq,
	ngeqq: ngeqq,
	ngeqslant: ngeqslant,
	nges: nges,
	nGg: nGg,
	ngsim: ngsim,
	nGt: nGt,
	ngt: ngt,
	ngtr: ngtr,
	nGtv: nGtv,
	nharr: nharr,
	nhArr: nhArr,
	nhpar: nhpar,
	ni: ni,
	nis: nis,
	nisd: nisd,
	niv: niv,
	NJcy: NJcy,
	njcy: njcy,
	nlarr: nlarr,
	nlArr: nlArr,
	nldr: nldr,
	nlE: nlE,
	nle: nle,
	nleftarrow: nleftarrow,
	nLeftarrow: nLeftarrow,
	nleftrightarrow: nleftrightarrow,
	nLeftrightarrow: nLeftrightarrow,
	nleq: nleq,
	nleqq: nleqq,
	nleqslant: nleqslant,
	nles: nles,
	nless: nless,
	nLl: nLl,
	nlsim: nlsim,
	nLt: nLt,
	nlt: nlt,
	nltri: nltri,
	nltrie: nltrie,
	nLtv: nLtv,
	nmid: nmid,
	NoBreak: NoBreak,
	NonBreakingSpace: NonBreakingSpace,
	nopf: nopf,
	Nopf: Nopf,
	Not: Not,
	not: not,
	NotCongruent: NotCongruent,
	NotCupCap: NotCupCap,
	NotDoubleVerticalBar: NotDoubleVerticalBar,
	NotElement: NotElement,
	NotEqual: NotEqual,
	NotEqualTilde: NotEqualTilde,
	NotExists: NotExists,
	NotGreater: NotGreater,
	NotGreaterEqual: NotGreaterEqual,
	NotGreaterFullEqual: NotGreaterFullEqual,
	NotGreaterGreater: NotGreaterGreater,
	NotGreaterLess: NotGreaterLess,
	NotGreaterSlantEqual: NotGreaterSlantEqual,
	NotGreaterTilde: NotGreaterTilde,
	NotHumpDownHump: NotHumpDownHump,
	NotHumpEqual: NotHumpEqual,
	notin: notin,
	notindot: notindot,
	notinE: notinE,
	notinva: notinva,
	notinvb: notinvb,
	notinvc: notinvc,
	NotLeftTriangleBar: NotLeftTriangleBar,
	NotLeftTriangle: NotLeftTriangle,
	NotLeftTriangleEqual: NotLeftTriangleEqual,
	NotLess: NotLess,
	NotLessEqual: NotLessEqual,
	NotLessGreater: NotLessGreater,
	NotLessLess: NotLessLess,
	NotLessSlantEqual: NotLessSlantEqual,
	NotLessTilde: NotLessTilde,
	NotNestedGreaterGreater: NotNestedGreaterGreater,
	NotNestedLessLess: NotNestedLessLess,
	notni: notni,
	notniva: notniva,
	notnivb: notnivb,
	notnivc: notnivc,
	NotPrecedes: NotPrecedes,
	NotPrecedesEqual: NotPrecedesEqual,
	NotPrecedesSlantEqual: NotPrecedesSlantEqual,
	NotReverseElement: NotReverseElement,
	NotRightTriangleBar: NotRightTriangleBar,
	NotRightTriangle: NotRightTriangle,
	NotRightTriangleEqual: NotRightTriangleEqual,
	NotSquareSubset: NotSquareSubset,
	NotSquareSubsetEqual: NotSquareSubsetEqual,
	NotSquareSuperset: NotSquareSuperset,
	NotSquareSupersetEqual: NotSquareSupersetEqual,
	NotSubset: NotSubset,
	NotSubsetEqual: NotSubsetEqual,
	NotSucceeds: NotSucceeds,
	NotSucceedsEqual: NotSucceedsEqual,
	NotSucceedsSlantEqual: NotSucceedsSlantEqual,
	NotSucceedsTilde: NotSucceedsTilde,
	NotSuperset: NotSuperset,
	NotSupersetEqual: NotSupersetEqual,
	NotTilde: NotTilde,
	NotTildeEqual: NotTildeEqual,
	NotTildeFullEqual: NotTildeFullEqual,
	NotTildeTilde: NotTildeTilde,
	NotVerticalBar: NotVerticalBar,
	nparallel: nparallel,
	npar: npar,
	nparsl: nparsl,
	npart: npart,
	npolint: npolint,
	npr: npr,
	nprcue: nprcue,
	nprec: nprec,
	npreceq: npreceq,
	npre: npre,
	nrarrc: nrarrc,
	nrarr: nrarr,
	nrArr: nrArr,
	nrarrw: nrarrw,
	nrightarrow: nrightarrow,
	nRightarrow: nRightarrow,
	nrtri: nrtri,
	nrtrie: nrtrie,
	nsc: nsc,
	nsccue: nsccue,
	nsce: nsce,
	Nscr: Nscr,
	nscr: nscr,
	nshortmid: nshortmid,
	nshortparallel: nshortparallel,
	nsim: nsim,
	nsime: nsime,
	nsimeq: nsimeq,
	nsmid: nsmid,
	nspar: nspar,
	nsqsube: nsqsube,
	nsqsupe: nsqsupe,
	nsub: nsub,
	nsubE: nsubE,
	nsube: nsube,
	nsubset: nsubset,
	nsubseteq: nsubseteq,
	nsubseteqq: nsubseteqq,
	nsucc: nsucc,
	nsucceq: nsucceq,
	nsup: nsup,
	nsupE: nsupE,
	nsupe: nsupe,
	nsupset: nsupset,
	nsupseteq: nsupseteq,
	nsupseteqq: nsupseteqq,
	ntgl: ntgl,
	Ntilde: Ntilde,
	ntilde: ntilde,
	ntlg: ntlg,
	ntriangleleft: ntriangleleft,
	ntrianglelefteq: ntrianglelefteq,
	ntriangleright: ntriangleright,
	ntrianglerighteq: ntrianglerighteq,
	Nu: Nu,
	nu: nu,
	num: num,
	numero: numero,
	numsp: numsp,
	nvap: nvap,
	nvdash: nvdash,
	nvDash: nvDash,
	nVdash: nVdash,
	nVDash: nVDash,
	nvge: nvge,
	nvgt: nvgt,
	nvHarr: nvHarr,
	nvinfin: nvinfin,
	nvlArr: nvlArr,
	nvle: nvle,
	nvlt: nvlt,
	nvltrie: nvltrie,
	nvrArr: nvrArr,
	nvrtrie: nvrtrie,
	nvsim: nvsim,
	nwarhk: nwarhk,
	nwarr: nwarr,
	nwArr: nwArr,
	nwarrow: nwarrow,
	nwnear: nwnear,
	Oacute: Oacute,
	oacute: oacute,
	oast: oast,
	Ocirc: Ocirc,
	ocirc: ocirc,
	ocir: ocir,
	Ocy: Ocy,
	ocy: ocy,
	odash: odash,
	Odblac: Odblac,
	odblac: odblac,
	odiv: odiv,
	odot: odot,
	odsold: odsold,
	OElig: OElig,
	oelig: oelig,
	ofcir: ofcir,
	Ofr: Ofr,
	ofr: ofr,
	ogon: ogon,
	Ograve: Ograve,
	ograve: ograve,
	ogt: ogt,
	ohbar: ohbar,
	ohm: ohm,
	oint: oint,
	olarr: olarr,
	olcir: olcir,
	olcross: olcross,
	oline: oline,
	olt: olt,
	Omacr: Omacr,
	omacr: omacr,
	Omega: Omega,
	omega: omega,
	Omicron: Omicron,
	omicron: omicron,
	omid: omid,
	ominus: ominus,
	Oopf: Oopf,
	oopf: oopf,
	opar: opar,
	OpenCurlyDoubleQuote: OpenCurlyDoubleQuote,
	OpenCurlyQuote: OpenCurlyQuote,
	operp: operp,
	oplus: oplus,
	orarr: orarr,
	Or: Or,
	or: or,
	ord: ord,
	order: order,
	orderof: orderof,
	ordf: ordf,
	ordm: ordm,
	origof: origof,
	oror: oror,
	orslope: orslope,
	orv: orv,
	oS: oS,
	Oscr: Oscr,
	oscr: oscr,
	Oslash: Oslash,
	oslash: oslash,
	osol: osol,
	Otilde: Otilde,
	otilde: otilde,
	otimesas: otimesas,
	Otimes: Otimes,
	otimes: otimes,
	Ouml: Ouml,
	ouml: ouml,
	ovbar: ovbar,
	OverBar: OverBar,
	OverBrace: OverBrace,
	OverBracket: OverBracket,
	OverParenthesis: OverParenthesis,
	para: para,
	parallel: parallel,
	par: par,
	parsim: parsim,
	parsl: parsl,
	part: part,
	PartialD: PartialD,
	Pcy: Pcy,
	pcy: pcy,
	percnt: percnt,
	period: period,
	permil: permil,
	perp: perp,
	pertenk: pertenk,
	Pfr: Pfr,
	pfr: pfr,
	Phi: Phi,
	phi: phi,
	phiv: phiv,
	phmmat: phmmat,
	phone: phone,
	Pi: Pi,
	pi: pi,
	pitchfork: pitchfork,
	piv: piv,
	planck: planck,
	planckh: planckh,
	plankv: plankv,
	plusacir: plusacir,
	plusb: plusb,
	pluscir: pluscir,
	plus: plus,
	plusdo: plusdo,
	plusdu: plusdu,
	pluse: pluse,
	PlusMinus: PlusMinus,
	plusmn: plusmn,
	plussim: plussim,
	plustwo: plustwo,
	pm: pm,
	Poincareplane: Poincareplane,
	pointint: pointint,
	popf: popf,
	Popf: Popf,
	pound: pound,
	prap: prap,
	Pr: Pr,
	pr: pr,
	prcue: prcue,
	precapprox: precapprox,
	prec: prec,
	preccurlyeq: preccurlyeq,
	Precedes: Precedes,
	PrecedesEqual: PrecedesEqual,
	PrecedesSlantEqual: PrecedesSlantEqual,
	PrecedesTilde: PrecedesTilde,
	preceq: preceq,
	precnapprox: precnapprox,
	precneqq: precneqq,
	precnsim: precnsim,
	pre: pre,
	prE: prE,
	precsim: precsim,
	prime: prime,
	Prime: Prime,
	primes: primes,
	prnap: prnap,
	prnE: prnE,
	prnsim: prnsim,
	prod: prod,
	Product: Product,
	profalar: profalar,
	profline: profline,
	profsurf: profsurf,
	prop: prop,
	Proportional: Proportional,
	Proportion: Proportion,
	propto: propto,
	prsim: prsim,
	prurel: prurel,
	Pscr: Pscr,
	pscr: pscr,
	Psi: Psi,
	psi: psi,
	puncsp: puncsp,
	Qfr: Qfr,
	qfr: qfr,
	qint: qint,
	qopf: qopf,
	Qopf: Qopf,
	qprime: qprime,
	Qscr: Qscr,
	qscr: qscr,
	quaternions: quaternions,
	quatint: quatint,
	quest: quest,
	questeq: questeq,
	quot: quot,
	QUOT: QUOT,
	rAarr: rAarr,
	race: race,
	Racute: Racute,
	racute: racute,
	radic: radic,
	raemptyv: raemptyv,
	rang: rang,
	Rang: Rang,
	rangd: rangd,
	range: range,
	rangle: rangle,
	raquo: raquo,
	rarrap: rarrap,
	rarrb: rarrb,
	rarrbfs: rarrbfs,
	rarrc: rarrc,
	rarr: rarr,
	Rarr: Rarr,
	rArr: rArr,
	rarrfs: rarrfs,
	rarrhk: rarrhk,
	rarrlp: rarrlp,
	rarrpl: rarrpl,
	rarrsim: rarrsim,
	Rarrtl: Rarrtl,
	rarrtl: rarrtl,
	rarrw: rarrw,
	ratail: ratail,
	rAtail: rAtail,
	ratio: ratio,
	rationals: rationals,
	rbarr: rbarr,
	rBarr: rBarr,
	RBarr: RBarr,
	rbbrk: rbbrk,
	rbrace: rbrace,
	rbrack: rbrack,
	rbrke: rbrke,
	rbrksld: rbrksld,
	rbrkslu: rbrkslu,
	Rcaron: Rcaron,
	rcaron: rcaron,
	Rcedil: Rcedil,
	rcedil: rcedil,
	rceil: rceil,
	rcub: rcub,
	Rcy: Rcy,
	rcy: rcy,
	rdca: rdca,
	rdldhar: rdldhar,
	rdquo: rdquo,
	rdquor: rdquor,
	rdsh: rdsh,
	real: real,
	realine: realine,
	realpart: realpart,
	reals: reals,
	Re: Re,
	rect: rect,
	reg: reg,
	REG: REG,
	ReverseElement: ReverseElement,
	ReverseEquilibrium: ReverseEquilibrium,
	ReverseUpEquilibrium: ReverseUpEquilibrium,
	rfisht: rfisht,
	rfloor: rfloor,
	rfr: rfr,
	Rfr: Rfr,
	rHar: rHar,
	rhard: rhard,
	rharu: rharu,
	rharul: rharul,
	Rho: Rho,
	rho: rho,
	rhov: rhov,
	RightAngleBracket: RightAngleBracket,
	RightArrowBar: RightArrowBar,
	rightarrow: rightarrow,
	RightArrow: RightArrow,
	Rightarrow: Rightarrow,
	RightArrowLeftArrow: RightArrowLeftArrow,
	rightarrowtail: rightarrowtail,
	RightCeiling: RightCeiling,
	RightDoubleBracket: RightDoubleBracket,
	RightDownTeeVector: RightDownTeeVector,
	RightDownVectorBar: RightDownVectorBar,
	RightDownVector: RightDownVector,
	RightFloor: RightFloor,
	rightharpoondown: rightharpoondown,
	rightharpoonup: rightharpoonup,
	rightleftarrows: rightleftarrows,
	rightleftharpoons: rightleftharpoons,
	rightrightarrows: rightrightarrows,
	rightsquigarrow: rightsquigarrow,
	RightTeeArrow: RightTeeArrow,
	RightTee: RightTee,
	RightTeeVector: RightTeeVector,
	rightthreetimes: rightthreetimes,
	RightTriangleBar: RightTriangleBar,
	RightTriangle: RightTriangle,
	RightTriangleEqual: RightTriangleEqual,
	RightUpDownVector: RightUpDownVector,
	RightUpTeeVector: RightUpTeeVector,
	RightUpVectorBar: RightUpVectorBar,
	RightUpVector: RightUpVector,
	RightVectorBar: RightVectorBar,
	RightVector: RightVector,
	ring: ring,
	risingdotseq: risingdotseq,
	rlarr: rlarr,
	rlhar: rlhar,
	rlm: rlm,
	rmoustache: rmoustache,
	rmoust: rmoust,
	rnmid: rnmid,
	roang: roang,
	roarr: roarr,
	robrk: robrk,
	ropar: ropar,
	ropf: ropf,
	Ropf: Ropf,
	roplus: roplus,
	rotimes: rotimes,
	RoundImplies: RoundImplies,
	rpar: rpar,
	rpargt: rpargt,
	rppolint: rppolint,
	rrarr: rrarr,
	Rrightarrow: Rrightarrow,
	rsaquo: rsaquo,
	rscr: rscr,
	Rscr: Rscr,
	rsh: rsh,
	Rsh: Rsh,
	rsqb: rsqb,
	rsquo: rsquo,
	rsquor: rsquor,
	rthree: rthree,
	rtimes: rtimes,
	rtri: rtri,
	rtrie: rtrie,
	rtrif: rtrif,
	rtriltri: rtriltri,
	RuleDelayed: RuleDelayed,
	ruluhar: ruluhar,
	rx: rx,
	Sacute: Sacute,
	sacute: sacute,
	sbquo: sbquo,
	scap: scap,
	Scaron: Scaron,
	scaron: scaron,
	Sc: Sc,
	sc: sc,
	sccue: sccue,
	sce: sce,
	scE: scE,
	Scedil: Scedil,
	scedil: scedil,
	Scirc: Scirc,
	scirc: scirc,
	scnap: scnap,
	scnE: scnE,
	scnsim: scnsim,
	scpolint: scpolint,
	scsim: scsim,
	Scy: Scy,
	scy: scy,
	sdotb: sdotb,
	sdot: sdot,
	sdote: sdote,
	searhk: searhk,
	searr: searr,
	seArr: seArr,
	searrow: searrow,
	sect: sect,
	semi: semi,
	seswar: seswar,
	setminus: setminus,
	setmn: setmn,
	sext: sext,
	Sfr: Sfr,
	sfr: sfr,
	sfrown: sfrown,
	sharp: sharp,
	SHCHcy: SHCHcy,
	shchcy: shchcy,
	SHcy: SHcy,
	shcy: shcy,
	ShortDownArrow: ShortDownArrow,
	ShortLeftArrow: ShortLeftArrow,
	shortmid: shortmid,
	shortparallel: shortparallel,
	ShortRightArrow: ShortRightArrow,
	ShortUpArrow: ShortUpArrow,
	shy: shy,
	Sigma: Sigma,
	sigma: sigma,
	sigmaf: sigmaf,
	sigmav: sigmav,
	sim: sim,
	simdot: simdot,
	sime: sime,
	simeq: simeq,
	simg: simg,
	simgE: simgE,
	siml: siml,
	simlE: simlE,
	simne: simne,
	simplus: simplus,
	simrarr: simrarr,
	slarr: slarr,
	SmallCircle: SmallCircle,
	smallsetminus: smallsetminus,
	smashp: smashp,
	smeparsl: smeparsl,
	smid: smid,
	smile: smile,
	smt: smt,
	smte: smte,
	smtes: smtes,
	SOFTcy: SOFTcy,
	softcy: softcy,
	solbar: solbar,
	solb: solb,
	sol: sol,
	Sopf: Sopf,
	sopf: sopf,
	spades: spades,
	spadesuit: spadesuit,
	spar: spar,
	sqcap: sqcap,
	sqcaps: sqcaps,
	sqcup: sqcup,
	sqcups: sqcups,
	Sqrt: Sqrt,
	sqsub: sqsub,
	sqsube: sqsube,
	sqsubset: sqsubset,
	sqsubseteq: sqsubseteq,
	sqsup: sqsup,
	sqsupe: sqsupe,
	sqsupset: sqsupset,
	sqsupseteq: sqsupseteq,
	square: square,
	Square: Square,
	SquareIntersection: SquareIntersection,
	SquareSubset: SquareSubset,
	SquareSubsetEqual: SquareSubsetEqual,
	SquareSuperset: SquareSuperset,
	SquareSupersetEqual: SquareSupersetEqual,
	SquareUnion: SquareUnion,
	squarf: squarf,
	squ: squ,
	squf: squf,
	srarr: srarr,
	Sscr: Sscr,
	sscr: sscr,
	ssetmn: ssetmn,
	ssmile: ssmile,
	sstarf: sstarf,
	Star: Star,
	star: star,
	starf: starf,
	straightepsilon: straightepsilon,
	straightphi: straightphi,
	strns: strns,
	sub: sub,
	Sub: Sub,
	subdot: subdot,
	subE: subE,
	sube: sube,
	subedot: subedot,
	submult: submult,
	subnE: subnE,
	subne: subne,
	subplus: subplus,
	subrarr: subrarr,
	subset: subset,
	Subset: Subset,
	subseteq: subseteq,
	subseteqq: subseteqq,
	SubsetEqual: SubsetEqual,
	subsetneq: subsetneq,
	subsetneqq: subsetneqq,
	subsim: subsim,
	subsub: subsub,
	subsup: subsup,
	succapprox: succapprox,
	succ: succ,
	succcurlyeq: succcurlyeq,
	Succeeds: Succeeds,
	SucceedsEqual: SucceedsEqual,
	SucceedsSlantEqual: SucceedsSlantEqual,
	SucceedsTilde: SucceedsTilde,
	succeq: succeq,
	succnapprox: succnapprox,
	succneqq: succneqq,
	succnsim: succnsim,
	succsim: succsim,
	SuchThat: SuchThat,
	sum: sum,
	Sum: Sum,
	sung: sung,
	sup1: sup1,
	sup2: sup2,
	sup3: sup3,
	sup: sup,
	Sup: Sup,
	supdot: supdot,
	supdsub: supdsub,
	supE: supE,
	supe: supe,
	supedot: supedot,
	Superset: Superset,
	SupersetEqual: SupersetEqual,
	suphsol: suphsol,
	suphsub: suphsub,
	suplarr: suplarr,
	supmult: supmult,
	supnE: supnE,
	supne: supne,
	supplus: supplus,
	supset: supset,
	Supset: Supset,
	supseteq: supseteq,
	supseteqq: supseteqq,
	supsetneq: supsetneq,
	supsetneqq: supsetneqq,
	supsim: supsim,
	supsub: supsub,
	supsup: supsup,
	swarhk: swarhk,
	swarr: swarr,
	swArr: swArr,
	swarrow: swarrow,
	swnwar: swnwar,
	szlig: szlig,
	Tab: Tab,
	target: target,
	Tau: Tau,
	tau: tau,
	tbrk: tbrk,
	Tcaron: Tcaron,
	tcaron: tcaron,
	Tcedil: Tcedil,
	tcedil: tcedil,
	Tcy: Tcy,
	tcy: tcy,
	tdot: tdot,
	telrec: telrec,
	Tfr: Tfr,
	tfr: tfr,
	there4: there4,
	therefore: therefore,
	Therefore: Therefore,
	Theta: Theta,
	theta: theta,
	thetasym: thetasym,
	thetav: thetav,
	thickapprox: thickapprox,
	thicksim: thicksim,
	ThickSpace: ThickSpace,
	ThinSpace: ThinSpace,
	thinsp: thinsp,
	thkap: thkap,
	thksim: thksim,
	THORN: THORN,
	thorn: thorn,
	tilde: tilde,
	Tilde: Tilde,
	TildeEqual: TildeEqual,
	TildeFullEqual: TildeFullEqual,
	TildeTilde: TildeTilde,
	timesbar: timesbar,
	timesb: timesb,
	times: times,
	timesd: timesd,
	tint: tint,
	toea: toea,
	topbot: topbot,
	topcir: topcir,
	top: top,
	Topf: Topf,
	topf: topf,
	topfork: topfork,
	tosa: tosa,
	tprime: tprime,
	trade: trade,
	TRADE: TRADE,
	triangle: triangle,
	triangledown: triangledown,
	triangleleft: triangleleft,
	trianglelefteq: trianglelefteq,
	triangleq: triangleq,
	triangleright: triangleright,
	trianglerighteq: trianglerighteq,
	tridot: tridot,
	trie: trie,
	triminus: triminus,
	TripleDot: TripleDot,
	triplus: triplus,
	trisb: trisb,
	tritime: tritime,
	trpezium: trpezium,
	Tscr: Tscr,
	tscr: tscr,
	TScy: TScy,
	tscy: tscy,
	TSHcy: TSHcy,
	tshcy: tshcy,
	Tstrok: Tstrok,
	tstrok: tstrok,
	twixt: twixt,
	twoheadleftarrow: twoheadleftarrow,
	twoheadrightarrow: twoheadrightarrow,
	Uacute: Uacute,
	uacute: uacute,
	uarr: uarr,
	Uarr: Uarr,
	uArr: uArr,
	Uarrocir: Uarrocir,
	Ubrcy: Ubrcy,
	ubrcy: ubrcy,
	Ubreve: Ubreve,
	ubreve: ubreve,
	Ucirc: Ucirc,
	ucirc: ucirc,
	Ucy: Ucy,
	ucy: ucy,
	udarr: udarr,
	Udblac: Udblac,
	udblac: udblac,
	udhar: udhar,
	ufisht: ufisht,
	Ufr: Ufr,
	ufr: ufr,
	Ugrave: Ugrave,
	ugrave: ugrave,
	uHar: uHar,
	uharl: uharl,
	uharr: uharr,
	uhblk: uhblk,
	ulcorn: ulcorn,
	ulcorner: ulcorner,
	ulcrop: ulcrop,
	ultri: ultri,
	Umacr: Umacr,
	umacr: umacr,
	uml: uml,
	UnderBar: UnderBar,
	UnderBrace: UnderBrace,
	UnderBracket: UnderBracket,
	UnderParenthesis: UnderParenthesis,
	Union: Union,
	UnionPlus: UnionPlus,
	Uogon: Uogon,
	uogon: uogon,
	Uopf: Uopf,
	uopf: uopf,
	UpArrowBar: UpArrowBar,
	uparrow: uparrow,
	UpArrow: UpArrow,
	Uparrow: Uparrow,
	UpArrowDownArrow: UpArrowDownArrow,
	updownarrow: updownarrow,
	UpDownArrow: UpDownArrow,
	Updownarrow: Updownarrow,
	UpEquilibrium: UpEquilibrium,
	upharpoonleft: upharpoonleft,
	upharpoonright: upharpoonright,
	uplus: uplus,
	UpperLeftArrow: UpperLeftArrow,
	UpperRightArrow: UpperRightArrow,
	upsi: upsi,
	Upsi: Upsi,
	upsih: upsih,
	Upsilon: Upsilon,
	upsilon: upsilon,
	UpTeeArrow: UpTeeArrow,
	UpTee: UpTee,
	upuparrows: upuparrows,
	urcorn: urcorn,
	urcorner: urcorner,
	urcrop: urcrop,
	Uring: Uring,
	uring: uring,
	urtri: urtri,
	Uscr: Uscr,
	uscr: uscr,
	utdot: utdot,
	Utilde: Utilde,
	utilde: utilde,
	utri: utri,
	utrif: utrif,
	uuarr: uuarr,
	Uuml: Uuml,
	uuml: uuml,
	uwangle: uwangle,
	vangrt: vangrt,
	varepsilon: varepsilon,
	varkappa: varkappa,
	varnothing: varnothing,
	varphi: varphi,
	varpi: varpi,
	varpropto: varpropto,
	varr: varr,
	vArr: vArr,
	varrho: varrho,
	varsigma: varsigma,
	varsubsetneq: varsubsetneq,
	varsubsetneqq: varsubsetneqq,
	varsupsetneq: varsupsetneq,
	varsupsetneqq: varsupsetneqq,
	vartheta: vartheta,
	vartriangleleft: vartriangleleft,
	vartriangleright: vartriangleright,
	vBar: vBar,
	Vbar: Vbar,
	vBarv: vBarv,
	Vcy: Vcy,
	vcy: vcy,
	vdash: vdash,
	vDash: vDash,
	Vdash: Vdash,
	VDash: VDash,
	Vdashl: Vdashl,
	veebar: veebar,
	vee: vee,
	Vee: Vee,
	veeeq: veeeq,
	vellip: vellip,
	verbar: verbar,
	Verbar: Verbar,
	vert: vert,
	Vert: Vert,
	VerticalBar: VerticalBar,
	VerticalLine: VerticalLine,
	VerticalSeparator: VerticalSeparator,
	VerticalTilde: VerticalTilde,
	VeryThinSpace: VeryThinSpace,
	Vfr: Vfr,
	vfr: vfr,
	vltri: vltri,
	vnsub: vnsub,
	vnsup: vnsup,
	Vopf: Vopf,
	vopf: vopf,
	vprop: vprop,
	vrtri: vrtri,
	Vscr: Vscr,
	vscr: vscr,
	vsubnE: vsubnE,
	vsubne: vsubne,
	vsupnE: vsupnE,
	vsupne: vsupne,
	Vvdash: Vvdash,
	vzigzag: vzigzag,
	Wcirc: Wcirc,
	wcirc: wcirc,
	wedbar: wedbar,
	wedge: wedge,
	Wedge: Wedge,
	wedgeq: wedgeq,
	weierp: weierp,
	Wfr: Wfr,
	wfr: wfr,
	Wopf: Wopf,
	wopf: wopf,
	wp: wp,
	wr: wr,
	wreath: wreath,
	Wscr: Wscr,
	wscr: wscr,
	xcap: xcap,
	xcirc: xcirc,
	xcup: xcup,
	xdtri: xdtri,
	Xfr: Xfr,
	xfr: xfr,
	xharr: xharr,
	xhArr: xhArr,
	Xi: Xi,
	xi: xi,
	xlarr: xlarr,
	xlArr: xlArr,
	xmap: xmap,
	xnis: xnis,
	xodot: xodot,
	Xopf: Xopf,
	xopf: xopf,
	xoplus: xoplus,
	xotime: xotime,
	xrarr: xrarr,
	xrArr: xrArr,
	Xscr: Xscr,
	xscr: xscr,
	xsqcup: xsqcup,
	xuplus: xuplus,
	xutri: xutri,
	xvee: xvee,
	xwedge: xwedge,
	Yacute: Yacute,
	yacute: yacute,
	YAcy: YAcy,
	yacy: yacy,
	Ycirc: Ycirc,
	ycirc: ycirc,
	Ycy: Ycy,
	ycy: ycy,
	yen: yen,
	Yfr: Yfr,
	yfr: yfr,
	YIcy: YIcy,
	yicy: yicy,
	Yopf: Yopf,
	yopf: yopf,
	Yscr: Yscr,
	yscr: yscr,
	YUcy: YUcy,
	yucy: yucy,
	yuml: yuml,
	Yuml: Yuml,
	Zacute: Zacute,
	zacute: zacute,
	Zcaron: Zcaron,
	zcaron: zcaron,
	Zcy: Zcy,
	zcy: zcy,
	Zdot: Zdot,
	zdot: zdot,
	zeetrf: zeetrf,
	ZeroWidthSpace: ZeroWidthSpace,
	Zeta: Zeta,
	zeta: zeta,
	zfr: zfr,
	Zfr: Zfr,
	ZHcy: ZHcy,
	zhcy: zhcy,
	zigrarr: zigrarr,
	zopf: zopf,
	Zopf: Zopf,
	Zscr: Zscr,
	zscr: zscr,
	zwj: zwj,
	zwnj: zwnj
};

var Aacute$1 = "Á";
var aacute$1 = "á";
var Acirc$1 = "Â";
var acirc$1 = "â";
var acute$1 = "´";
var AElig$1 = "Æ";
var aelig$1 = "æ";
var Agrave$1 = "À";
var agrave$1 = "à";
var amp$1 = "&";
var AMP$1 = "&";
var Aring$1 = "Å";
var aring$1 = "å";
var Atilde$1 = "Ã";
var atilde$1 = "ã";
var Auml$1 = "Ä";
var auml$1 = "ä";
var brvbar$1 = "¦";
var Ccedil$1 = "Ç";
var ccedil$1 = "ç";
var cedil$1 = "¸";
var cent$1 = "¢";
var copy$2 = "©";
var COPY$1 = "©";
var curren$1 = "¤";
var deg$1 = "°";
var divide$1 = "÷";
var Eacute$1 = "É";
var eacute$1 = "é";
var Ecirc$1 = "Ê";
var ecirc$1 = "ê";
var Egrave$1 = "È";
var egrave$1 = "è";
var ETH$1 = "Ð";
var eth$1 = "ð";
var Euml$1 = "Ë";
var euml$1 = "ë";
var frac12$1 = "½";
var frac14$1 = "¼";
var frac34$1 = "¾";
var gt$1 = ">";
var GT$1 = ">";
var Iacute$1 = "Í";
var iacute$1 = "í";
var Icirc$1 = "Î";
var icirc$1 = "î";
var iexcl$1 = "¡";
var Igrave$1 = "Ì";
var igrave$1 = "ì";
var iquest$1 = "¿";
var Iuml$1 = "Ï";
var iuml$1 = "ï";
var laquo$1 = "«";
var lt$1 = "<";
var LT$1 = "<";
var macr$1 = "¯";
var micro$1 = "µ";
var middot$1 = "·";
var nbsp$1 = " ";
var not$1 = "¬";
var Ntilde$1 = "Ñ";
var ntilde$1 = "ñ";
var Oacute$1 = "Ó";
var oacute$1 = "ó";
var Ocirc$1 = "Ô";
var ocirc$1 = "ô";
var Ograve$1 = "Ò";
var ograve$1 = "ò";
var ordf$1 = "ª";
var ordm$1 = "º";
var Oslash$1 = "Ø";
var oslash$1 = "ø";
var Otilde$1 = "Õ";
var otilde$1 = "õ";
var Ouml$1 = "Ö";
var ouml$1 = "ö";
var para$1 = "¶";
var plusmn$1 = "±";
var pound$1 = "£";
var quot$1 = "\"";
var QUOT$1 = "\"";
var raquo$1 = "»";
var reg$1 = "®";
var REG$1 = "®";
var sect$1 = "§";
var shy$1 = "­";
var sup1$1 = "¹";
var sup2$1 = "²";
var sup3$1 = "³";
var szlig$1 = "ß";
var THORN$1 = "Þ";
var thorn$1 = "þ";
var times$1 = "×";
var Uacute$1 = "Ú";
var uacute$1 = "ú";
var Ucirc$1 = "Û";
var ucirc$1 = "û";
var Ugrave$1 = "Ù";
var ugrave$1 = "ù";
var uml$1 = "¨";
var Uuml$1 = "Ü";
var uuml$1 = "ü";
var Yacute$1 = "Ý";
var yacute$1 = "ý";
var yen$1 = "¥";
var yuml$1 = "ÿ";
var require$$1$1 = {
	Aacute: Aacute$1,
	aacute: aacute$1,
	Acirc: Acirc$1,
	acirc: acirc$1,
	acute: acute$1,
	AElig: AElig$1,
	aelig: aelig$1,
	Agrave: Agrave$1,
	agrave: agrave$1,
	amp: amp$1,
	AMP: AMP$1,
	Aring: Aring$1,
	aring: aring$1,
	Atilde: Atilde$1,
	atilde: atilde$1,
	Auml: Auml$1,
	auml: auml$1,
	brvbar: brvbar$1,
	Ccedil: Ccedil$1,
	ccedil: ccedil$1,
	cedil: cedil$1,
	cent: cent$1,
	copy: copy$2,
	COPY: COPY$1,
	curren: curren$1,
	deg: deg$1,
	divide: divide$1,
	Eacute: Eacute$1,
	eacute: eacute$1,
	Ecirc: Ecirc$1,
	ecirc: ecirc$1,
	Egrave: Egrave$1,
	egrave: egrave$1,
	ETH: ETH$1,
	eth: eth$1,
	Euml: Euml$1,
	euml: euml$1,
	frac12: frac12$1,
	frac14: frac14$1,
	frac34: frac34$1,
	gt: gt$1,
	GT: GT$1,
	Iacute: Iacute$1,
	iacute: iacute$1,
	Icirc: Icirc$1,
	icirc: icirc$1,
	iexcl: iexcl$1,
	Igrave: Igrave$1,
	igrave: igrave$1,
	iquest: iquest$1,
	Iuml: Iuml$1,
	iuml: iuml$1,
	laquo: laquo$1,
	lt: lt$1,
	LT: LT$1,
	macr: macr$1,
	micro: micro$1,
	middot: middot$1,
	nbsp: nbsp$1,
	not: not$1,
	Ntilde: Ntilde$1,
	ntilde: ntilde$1,
	Oacute: Oacute$1,
	oacute: oacute$1,
	Ocirc: Ocirc$1,
	ocirc: ocirc$1,
	Ograve: Ograve$1,
	ograve: ograve$1,
	ordf: ordf$1,
	ordm: ordm$1,
	Oslash: Oslash$1,
	oslash: oslash$1,
	Otilde: Otilde$1,
	otilde: otilde$1,
	Ouml: Ouml$1,
	ouml: ouml$1,
	para: para$1,
	plusmn: plusmn$1,
	pound: pound$1,
	quot: quot$1,
	QUOT: QUOT$1,
	raquo: raquo$1,
	reg: reg$1,
	REG: REG$1,
	sect: sect$1,
	shy: shy$1,
	sup1: sup1$1,
	sup2: sup2$1,
	sup3: sup3$1,
	szlig: szlig$1,
	THORN: THORN$1,
	thorn: thorn$1,
	times: times$1,
	Uacute: Uacute$1,
	uacute: uacute$1,
	Ucirc: Ucirc$1,
	ucirc: ucirc$1,
	Ugrave: Ugrave$1,
	ugrave: ugrave$1,
	uml: uml$1,
	Uuml: Uuml$1,
	uuml: uuml$1,
	Yacute: Yacute$1,
	yacute: yacute$1,
	yen: yen$1,
	yuml: yuml$1
};

var amp$2 = "&";
var apos$1 = "'";
var gt$2 = ">";
var lt$2 = "<";
var quot$2 = "\"";
var require$$0$1 = {
	amp: amp$2,
	apos: apos$1,
	gt: gt$2,
	lt: lt$2,
	quot: quot$2
};

var require$$0$2 = {
	"0": 65533,
	"128": 8364,
	"130": 8218,
	"131": 402,
	"132": 8222,
	"133": 8230,
	"134": 8224,
	"135": 8225,
	"136": 710,
	"137": 8240,
	"138": 352,
	"139": 8249,
	"140": 338,
	"142": 381,
	"145": 8216,
	"146": 8217,
	"147": 8220,
	"148": 8221,
	"149": 8226,
	"150": 8211,
	"151": 8212,
	"152": 732,
	"153": 8482,
	"154": 353,
	"155": 8250,
	"156": 339,
	"158": 382,
	"159": 376
};

var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

var decode_json_1 = __importDefault(require$$0$2);
// Adapted from https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
var fromCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.fromCodePoint ||
    function (codePoint) {
        var output = "";
        if (codePoint > 0xffff) {
            codePoint -= 0x10000;
            output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
            codePoint = 0xdc00 | (codePoint & 0x3ff);
        }
        output += String.fromCharCode(codePoint);
        return output;
    };
function decodeCodePoint(codePoint) {
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return "\uFFFD";
    }
    if (codePoint in decode_json_1.default) {
        codePoint = decode_json_1.default[codePoint];
    }
    return fromCodePoint(codePoint);
}
var _default = decodeCodePoint;

var decode_codepoint = /*#__PURE__*/Object.defineProperty({
	default: _default
}, '__esModule', {value: true});

var decode = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
var entities_json_1 = __importDefault(require$$1);
var legacy_json_1 = __importDefault(require$$1$1);
var xml_json_1 = __importDefault(require$$0$1);
var decode_codepoint_1 = __importDefault(decode_codepoint);
var strictEntityRe = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
exports.decodeXML = getStrictDecoder(xml_json_1.default);
exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
function getStrictDecoder(map) {
    var replace = getReplacer(map);
    return function (str) { return String(str).replace(strictEntityRe, replace); };
}
var sorter = function (a, b) { return (a < b ? 1 : -1); };
exports.decodeHTML = (function () {
    var legacy = Object.keys(legacy_json_1.default).sort(sorter);
    var keys = Object.keys(entities_json_1.default).sort(sorter);
    for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
            keys[i] += ";?";
            j++;
        }
        else {
            keys[i] += ";";
        }
    }
    var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
    var replace = getReplacer(entities_json_1.default);
    function replacer(str) {
        if (str.substr(-1) !== ";")
            str += ";";
        return replace(str);
    }
    // TODO consider creating a merged map
    return function (str) { return String(str).replace(re, replacer); };
})();
function getReplacer(map) {
    return function replace(str) {
        if (str.charAt(1) === "#") {
            var secondChar = str.charAt(2);
            if (secondChar === "X" || secondChar === "x") {
                return decode_codepoint_1.default(parseInt(str.substr(3), 16));
            }
            return decode_codepoint_1.default(parseInt(str.substr(2), 10));
        }
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return map[str.slice(1, -1)] || str;
    };
}
});

var encode = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = void 0;
var xml_json_1 = __importDefault(require$$0$1);
var inverseXML = getInverseObj(xml_json_1.default);
var xmlReplacer = getInverseReplacer(inverseXML);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeXML = getASCIIEncoder(inverseXML);
var entities_json_1 = __importDefault(require$$1);
var inverseHTML = getInverseObj(entities_json_1.default);
var htmlReplacer = getInverseReplacer(inverseHTML);
/**
 * Encodes all entities and non-ASCII characters in the input.
 *
 * This includes characters that are valid ASCII characters in HTML documents.
 * For example `#` will be encoded as `&num;`. To get a more compact output,
 * consider using the `encodeNonAsciiHTML` function.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in HTML
 * documents using HTML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeNonAsciiHTML = getASCIIEncoder(inverseHTML);
function getInverseObj(obj) {
    return Object.keys(obj)
        .sort()
        .reduce(function (inverse, name) {
        inverse[obj[name]] = "&" + name + ";";
        return inverse;
    }, {});
}
function getInverseReplacer(inverse) {
    var single = [];
    var multiple = [];
    for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
        var k = _a[_i];
        if (k.length === 1) {
            // Add value to single array
            single.push("\\" + k);
        }
        else {
            // Add value to multiple array
            multiple.push(k);
        }
    }
    // Add ranges to single characters.
    single.sort();
    for (var start = 0; start < single.length - 1; start++) {
        // Find the end of a run of characters
        var end = start;
        while (end < single.length - 1 &&
            single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
            end += 1;
        }
        var count = 1 + end - start;
        // We want to replace at least three characters
        if (count < 3)
            continue;
        single.splice(start, count, single[start] + "-" + single[end]);
    }
    multiple.unshift("[" + single.join("") + "]");
    return new RegExp(multiple.join("|"), "g");
}
// /[^\0-\x7F]/gu
var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
var getCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.prototype.codePointAt != null
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        function (str) { return str.codePointAt(0); }
    : // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        function (c) {
            return (c.charCodeAt(0) - 0xd800) * 0x400 +
                c.charCodeAt(1) -
                0xdc00 +
                0x10000;
        };
function singleCharReplacer(c) {
    return "&#x" + (c.length > 1 ? getCodePoint(c) : c.charCodeAt(0))
        .toString(16)
        .toUpperCase() + ";";
}
function getInverse(inverse, re) {
    return function (data) {
        return data
            .replace(re, function (name) { return inverse[name]; })
            .replace(reNonASCII, singleCharReplacer);
    };
}
var reEscapeChars = new RegExp(xmlReplacer.source + "|" + reNonASCII.source, "g");
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 *
 * @param data String to escape.
 */
function escape(data) {
    return data.replace(reEscapeChars, singleCharReplacer);
}
exports.escape = escape;
/**
 * Encodes all characters not valid in XML documents using numeric hexadecimal
 * reference (eg. `&#xfc;`).
 *
 * Note that the output will be character-set dependent.
 *
 * @param data String to escape.
 */
function escapeUTF8(data) {
    return data.replace(xmlReplacer, singleCharReplacer);
}
exports.escapeUTF8 = escapeUTF8;
function getASCIIEncoder(obj) {
    return function (data) {
        return data.replace(reEscapeChars, function (c) { return obj[c] || singleCharReplacer(c); });
    };
}
});

var lib$2 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.encodeHTML5 = exports.encodeHTML4 = exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = void 0;


/**
 * Decodes a string with entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeXML` or `decodeHTML` directly.
 */
function decode$1(data, level) {
    return (!level || level <= 0 ? decode.decodeXML : decode.decodeHTML)(data);
}
exports.decode = decode$1;
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeHTMLStrict` or `decodeXML` directly.
 */
function decodeStrict(data, level) {
    return (!level || level <= 0 ? decode.decodeXML : decode.decodeHTMLStrict)(data);
}
exports.decodeStrict = decodeStrict;
/**
 * Encodes a string with entities.
 *
 * @param data String to encode.
 * @param level Optional level to encode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `encodeHTML`, `encodeXML` or `encodeNonAsciiHTML` directly.
 */
function encode$1(data, level) {
    return (!level || level <= 0 ? encode.encodeXML : encode.encodeHTML)(data);
}
exports.encode = encode$1;
var encode_2 = encode;
Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return encode_2.encodeXML; } });
Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeNonAsciiHTML", { enumerable: true, get: function () { return encode_2.encodeNonAsciiHTML; } });
Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return encode_2.escape; } });
Object.defineProperty(exports, "escapeUTF8", { enumerable: true, get: function () { return encode_2.escapeUTF8; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
var decode_2 = decode;
Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_2.decodeXML; } });
Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_2.decodeXML; } });
});

var foreignNames = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeNames = exports.elementNames = void 0;
exports.elementNames = new Map([
    ["altglyph", "altGlyph"],
    ["altglyphdef", "altGlyphDef"],
    ["altglyphitem", "altGlyphItem"],
    ["animatecolor", "animateColor"],
    ["animatemotion", "animateMotion"],
    ["animatetransform", "animateTransform"],
    ["clippath", "clipPath"],
    ["feblend", "feBlend"],
    ["fecolormatrix", "feColorMatrix"],
    ["fecomponenttransfer", "feComponentTransfer"],
    ["fecomposite", "feComposite"],
    ["feconvolvematrix", "feConvolveMatrix"],
    ["fediffuselighting", "feDiffuseLighting"],
    ["fedisplacementmap", "feDisplacementMap"],
    ["fedistantlight", "feDistantLight"],
    ["fedropshadow", "feDropShadow"],
    ["feflood", "feFlood"],
    ["fefunca", "feFuncA"],
    ["fefuncb", "feFuncB"],
    ["fefuncg", "feFuncG"],
    ["fefuncr", "feFuncR"],
    ["fegaussianblur", "feGaussianBlur"],
    ["feimage", "feImage"],
    ["femerge", "feMerge"],
    ["femergenode", "feMergeNode"],
    ["femorphology", "feMorphology"],
    ["feoffset", "feOffset"],
    ["fepointlight", "fePointLight"],
    ["fespecularlighting", "feSpecularLighting"],
    ["fespotlight", "feSpotLight"],
    ["fetile", "feTile"],
    ["feturbulence", "feTurbulence"],
    ["foreignobject", "foreignObject"],
    ["glyphref", "glyphRef"],
    ["lineargradient", "linearGradient"],
    ["radialgradient", "radialGradient"],
    ["textpath", "textPath"],
]);
exports.attributeNames = new Map([
    ["definitionurl", "definitionURL"],
    ["attributename", "attributeName"],
    ["attributetype", "attributeType"],
    ["basefrequency", "baseFrequency"],
    ["baseprofile", "baseProfile"],
    ["calcmode", "calcMode"],
    ["clippathunits", "clipPathUnits"],
    ["diffuseconstant", "diffuseConstant"],
    ["edgemode", "edgeMode"],
    ["filterunits", "filterUnits"],
    ["glyphref", "glyphRef"],
    ["gradienttransform", "gradientTransform"],
    ["gradientunits", "gradientUnits"],
    ["kernelmatrix", "kernelMatrix"],
    ["kernelunitlength", "kernelUnitLength"],
    ["keypoints", "keyPoints"],
    ["keysplines", "keySplines"],
    ["keytimes", "keyTimes"],
    ["lengthadjust", "lengthAdjust"],
    ["limitingconeangle", "limitingConeAngle"],
    ["markerheight", "markerHeight"],
    ["markerunits", "markerUnits"],
    ["markerwidth", "markerWidth"],
    ["maskcontentunits", "maskContentUnits"],
    ["maskunits", "maskUnits"],
    ["numoctaves", "numOctaves"],
    ["pathlength", "pathLength"],
    ["patterncontentunits", "patternContentUnits"],
    ["patterntransform", "patternTransform"],
    ["patternunits", "patternUnits"],
    ["pointsatx", "pointsAtX"],
    ["pointsaty", "pointsAtY"],
    ["pointsatz", "pointsAtZ"],
    ["preservealpha", "preserveAlpha"],
    ["preserveaspectratio", "preserveAspectRatio"],
    ["primitiveunits", "primitiveUnits"],
    ["refx", "refX"],
    ["refy", "refY"],
    ["repeatcount", "repeatCount"],
    ["repeatdur", "repeatDur"],
    ["requiredextensions", "requiredExtensions"],
    ["requiredfeatures", "requiredFeatures"],
    ["specularconstant", "specularConstant"],
    ["specularexponent", "specularExponent"],
    ["spreadmethod", "spreadMethod"],
    ["startoffset", "startOffset"],
    ["stddeviation", "stdDeviation"],
    ["stitchtiles", "stitchTiles"],
    ["surfacescale", "surfaceScale"],
    ["systemlanguage", "systemLanguage"],
    ["tablevalues", "tableValues"],
    ["targetx", "targetX"],
    ["targety", "targetY"],
    ["textlength", "textLength"],
    ["viewbox", "viewBox"],
    ["viewtarget", "viewTarget"],
    ["xchannelselector", "xChannelSelector"],
    ["ychannelselector", "yChannelSelector"],
    ["zoomandpan", "zoomAndPan"],
]);
});

var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};

/*
 * Module dependencies
 */
var ElementType = __importStar(lib$1);

/*
 * Mixed-case SVG and MathML tags & attributes
 * recognized by the HTML parser, see
 * https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
 */

var unencodedElements = new Set([
    "style",
    "script",
    "xmp",
    "iframe",
    "noembed",
    "noframes",
    "plaintext",
    "noscript",
]);
/**
 * Format attributes
 */
function formatAttributes(attributes, opts) {
    if (!attributes)
        return;
    return Object.keys(attributes)
        .map(function (key) {
        var _a, _b;
        var value = (_a = attributes[key]) !== null && _a !== void 0 ? _a : "";
        if (opts.xmlMode === "foreign") {
            /* Fix up mixed-case attribute names */
            key = (_b = foreignNames.attributeNames.get(key)) !== null && _b !== void 0 ? _b : key;
        }
        if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
            return key;
        }
        return key + "=\"" + (opts.decodeEntities ? lib$2.encodeXML(value) : value.replace(/"/g, "&quot;")) + "\"";
    })
        .join(" ");
}
/**
 * Self-enclosing tags
 */
var singleTag = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);
/**
 * Renders a DOM node or an array of DOM nodes to a string.
 *
 * Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
 *
 * @param node Node to be rendered.
 * @param options Changes serialization behavior
 */
function render(node, options) {
    if (options === void 0) { options = {}; }
    // TODO: This is a bit hacky.
    var nodes = Array.isArray(node) || node.cheerio ? node : [node];
    var output = "";
    for (var i = 0; i < nodes.length; i++) {
        output += renderNode(nodes[i], options);
    }
    return output;
}
var _default$1 = render;
function renderNode(node, options) {
    switch (node.type) {
        case ElementType.Root:
            return render(node.children, options);
        case ElementType.Directive:
        case ElementType.Doctype:
            return renderDirective(node);
        case ElementType.Comment:
            return renderComment(node);
        case ElementType.CDATA:
            return renderCdata(node);
        case ElementType.Script:
        case ElementType.Style:
        case ElementType.Tag:
            return renderTag(node, options);
        case ElementType.Text:
            return renderText(node, options);
    }
}
var foreignModeIntegrationPoints = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignObject",
    "desc",
    "title",
]);
var foreignElements = new Set(["svg", "math"]);
function renderTag(elem, opts) {
    var _a;
    // Handle SVG / MathML in HTML
    if (opts.xmlMode === "foreign") {
        /* Fix up mixed-case element names */
        elem.name = (_a = foreignNames.elementNames.get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
        /* Exit foreign mode at integration points */
        if (elem.parent &&
            foreignModeIntegrationPoints.has(elem.parent.name)) {
            opts = __assign(__assign({}, opts), { xmlMode: false });
        }
    }
    if (!opts.xmlMode && foreignElements.has(elem.name)) {
        opts = __assign(__assign({}, opts), { xmlMode: "foreign" });
    }
    var tag = "<" + elem.name;
    var attribs = formatAttributes(elem.attribs, opts);
    if (attribs) {
        tag += " " + attribs;
    }
    if (elem.children.length === 0 &&
        (opts.xmlMode
            ? // In XML mode or foreign mode, and user hasn't explicitly turned off self-closing tags
                opts.selfClosingTags !== false
            : // User explicitly asked for self-closing tags, even in HTML mode
                opts.selfClosingTags && singleTag.has(elem.name))) {
        if (!opts.xmlMode)
            tag += " ";
        tag += "/>";
    }
    else {
        tag += ">";
        if (elem.children.length > 0) {
            tag += render(elem.children, opts);
        }
        if (opts.xmlMode || !singleTag.has(elem.name)) {
            tag += "</" + elem.name + ">";
        }
    }
    return tag;
}
function renderDirective(elem) {
    return "<" + elem.data + ">";
}
function renderText(elem, opts) {
    var data = elem.data || "";
    // If entities weren't decoded, no need to encode them back
    if (opts.decodeEntities &&
        !(elem.parent && unencodedElements.has(elem.parent.name))) {
        data = lib$2.encodeXML(data);
    }
    return data;
}
function renderCdata(elem) {
    return "<![CDATA[" + elem.children[0].data + "]]>";
}
function renderComment(elem) {
    return "<!--" + elem.data + "-->";
}

var lib$3 = /*#__PURE__*/Object.defineProperty({
	default: _default$1
}, '__esModule', {value: true});

var stringify = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getText = exports.getInnerHTML = exports.getOuterHTML = void 0;

var dom_serializer_1 = __importDefault(lib$3);
/**
 * @param node Node to get the outer HTML of.
 * @param options Options for serialization.
 * @deprecated Use the `dom-serializer` module directly.
 * @returns `node`'s outer HTML.
 */
function getOuterHTML(node, options) {
    return dom_serializer_1.default(node, options);
}
exports.getOuterHTML = getOuterHTML;
/**
 * @param node Node to get the inner HTML of.
 * @param options Options for serialization.
 * @deprecated Use the `dom-serializer` module directly.
 * @returns `node`'s inner HTML.
 */
function getInnerHTML(node, options) {
    return tagtypes.hasChildren(node)
        ? node.children.map(function (node) { return getOuterHTML(node, options); }).join("")
        : "";
}
exports.getInnerHTML = getInnerHTML;
/**
 * Get a node's inner text.
 *
 * @param node Node to get the inner text of.
 * @returns `node`'s inner text.
 */
function getText(node) {
    if (Array.isArray(node))
        return node.map(getText).join("");
    if (tagtypes.isTag(node))
        return node.name === "br" ? "\n" : getText(node.children);
    if (tagtypes.isCDATA(node))
        return getText(node.children);
    if (tagtypes.isText(node))
        return node.data;
    return "";
}
exports.getText = getText;
});

var traversal = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextElementSibling = exports.getName = exports.hasAttrib = exports.getAttributeValue = exports.getSiblings = exports.getParent = exports.getChildren = void 0;

var emptyArray = [];
/**
 * Get a node's children.
 *
 * @param elem Node to get the children of.
 * @returns `elem`'s children, or an empty array.
 */
function getChildren(elem) {
    var _a;
    return (_a = elem.children) !== null && _a !== void 0 ? _a : emptyArray;
}
exports.getChildren = getChildren;
/**
 * Get a node's parent.
 *
 * @param elem Node to get the parent of.
 * @returns `elem`'s parent node.
 */
function getParent(elem) {
    return elem.parent || null;
}
exports.getParent = getParent;
/**
 * Gets an elements siblings, including the element itself.
 *
 * Attempts to get the children through the element's parent first.
 * If we don't have a parent (the element is a root node),
 * we walk the element's `prev` & `next` to get all remaining nodes.
 *
 * @param elem Element to get the siblings of.
 * @returns `elem`'s siblings.
 */
function getSiblings(elem) {
    var _a, _b;
    var parent = getParent(elem);
    if (parent != null)
        return getChildren(parent);
    var siblings = [elem];
    var prev = elem.prev, next = elem.next;
    while (prev != null) {
        siblings.unshift(prev);
        (_a = prev, prev = _a.prev);
    }
    while (next != null) {
        siblings.push(next);
        (_b = next, next = _b.next);
    }
    return siblings;
}
exports.getSiblings = getSiblings;
/**
 * Gets an attribute from an element.
 *
 * @param elem Element to check.
 * @param name Attribute name to retrieve.
 * @returns The element's attribute value, or `undefined`.
 */
function getAttributeValue(elem, name) {
    var _a;
    return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
}
exports.getAttributeValue = getAttributeValue;
/**
 * Checks whether an element has an attribute.
 *
 * @param elem Element to check.
 * @param name Attribute name to look for.
 * @returns Returns whether `elem` has the attribute `name`.
 */
function hasAttrib(elem, name) {
    return (elem.attribs != null &&
        Object.prototype.hasOwnProperty.call(elem.attribs, name) &&
        elem.attribs[name] != null);
}
exports.hasAttrib = hasAttrib;
/**
 * Get the tag name of an element.
 *
 * @param elem The element to get the name for.
 * @returns The tag name of `elem`.
 */
function getName(elem) {
    return elem.name;
}
exports.getName = getName;
/**
 * Returns the next element sibling of a node.
 *
 * @param elem The element to get the next sibling of.
 * @returns `elem`'s next sibling that is a tag.
 */
function nextElementSibling(elem) {
    var _a;
    var next = elem.next;
    while (next !== null && !tagtypes.isTag(next))
        (_a = next, next = _a.next);
    return next;
}
exports.nextElementSibling = nextElementSibling;
});

var manipulation = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepend = exports.prependChild = exports.append = exports.appendChild = exports.replaceElement = exports.removeElement = void 0;
/**
 * Remove an element from the dom
 *
 * @param elem The element to be removed
 */
function removeElement(elem) {
    if (elem.prev)
        elem.prev.next = elem.next;
    if (elem.next)
        elem.next.prev = elem.prev;
    if (elem.parent) {
        var childs = elem.parent.children;
        childs.splice(childs.lastIndexOf(elem), 1);
    }
}
exports.removeElement = removeElement;
/**
 * Replace an element in the dom
 *
 * @param elem The element to be replaced
 * @param replacement The element to be added
 */
function replaceElement(elem, replacement) {
    var prev = (replacement.prev = elem.prev);
    if (prev) {
        prev.next = replacement;
    }
    var next = (replacement.next = elem.next);
    if (next) {
        next.prev = replacement;
    }
    var parent = (replacement.parent = elem.parent);
    if (parent) {
        var childs = parent.children;
        childs[childs.lastIndexOf(elem)] = replacement;
    }
}
exports.replaceElement = replaceElement;
/**
 * Append a child to an element.
 *
 * @param elem The element to append to.
 * @param child The element to be added as a child.
 */
function appendChild(elem, child) {
    removeElement(child);
    child.next = null;
    child.parent = elem;
    if (elem.children.push(child) > 1) {
        var sibling = elem.children[elem.children.length - 2];
        sibling.next = child;
        child.prev = sibling;
    }
    else {
        child.prev = null;
    }
}
exports.appendChild = appendChild;
/**
 * Append an element after another.
 *
 * @param elem The element to append after.
 * @param next The element be added.
 */
function append(elem, next) {
    removeElement(next);
    var parent = elem.parent;
    var currNext = elem.next;
    next.next = currNext;
    next.prev = elem;
    elem.next = next;
    next.parent = parent;
    if (currNext) {
        currNext.prev = next;
        if (parent) {
            var childs = parent.children;
            childs.splice(childs.lastIndexOf(currNext), 0, next);
        }
    }
    else if (parent) {
        parent.children.push(next);
    }
}
exports.append = append;
/**
 * Prepend a child to an element.
 *
 * @param elem The element to prepend before.
 * @param child The element to be added as a child.
 */
function prependChild(elem, child) {
    removeElement(child);
    child.parent = elem;
    child.prev = null;
    if (elem.children.unshift(child) !== 1) {
        var sibling = elem.children[1];
        sibling.prev = child;
        child.next = sibling;
    }
    else {
        child.next = null;
    }
}
exports.prependChild = prependChild;
/**
 * Prepend an element before another.
 *
 * @param elem The element to prepend before.
 * @param prev The element be added.
 */
function prepend(elem, prev) {
    removeElement(prev);
    var parent = elem.parent;
    if (parent) {
        var childs = parent.children;
        childs.splice(childs.indexOf(elem), 0, prev);
    }
    if (elem.prev) {
        elem.prev.next = prev;
    }
    prev.parent = parent;
    prev.prev = elem.prev;
    prev.next = elem;
    elem.prev = prev;
}
exports.prepend = prepend;
});

var querying = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = exports.existsOne = exports.findOne = exports.findOneChild = exports.find = exports.filter = void 0;

/**
 * Search a node and its children for nodes passing a test function.
 *
 * @param test Function to test nodes on.
 * @param node Node to search. Will be included in the result set if it matches.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes passing `test`.
 */
function filter(test, node, recurse, limit) {
    if (recurse === void 0) { recurse = true; }
    if (limit === void 0) { limit = Infinity; }
    if (!Array.isArray(node))
        node = [node];
    return find(test, node, recurse, limit);
}
exports.filter = filter;
/**
 * Search an array of node and its children for nodes passing a test function.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes passing `test`.
 */
function find(test, nodes, recurse, limit) {
    var result = [];
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var elem = nodes_1[_i];
        if (test(elem)) {
            result.push(elem);
            if (--limit <= 0)
                break;
        }
        if (recurse && tagtypes.hasChildren(elem) && elem.children.length > 0) {
            var children = find(test, elem.children, recurse, limit);
            result.push.apply(result, children);
            limit -= children.length;
            if (limit <= 0)
                break;
        }
    }
    return result;
}
exports.find = find;
/**
 * Finds the first element inside of an array that matches a test function.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @returns The first node in the array that passes `test`.
 */
function findOneChild(test, nodes) {
    return nodes.find(test);
}
exports.findOneChild = findOneChild;
/**
 * Finds one element in a tree that passes a test.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @param recurse Also consider child nodes.
 * @returns The first child node that passes `test`.
 */
function findOne(test, nodes, recurse) {
    if (recurse === void 0) { recurse = true; }
    var elem = null;
    for (var i = 0; i < nodes.length && !elem; i++) {
        var checked = nodes[i];
        if (!tagtypes.isTag(checked)) {
            continue;
        }
        else if (test(checked)) {
            elem = checked;
        }
        else if (recurse && checked.children.length > 0) {
            elem = findOne(test, checked.children);
        }
    }
    return elem;
}
exports.findOne = findOne;
/**
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @returns Whether a tree of nodes contains at least one node passing a test.
 */
function existsOne(test, nodes) {
    return nodes.some(function (checked) {
        return tagtypes.isTag(checked) &&
            (test(checked) ||
                (checked.children.length > 0 &&
                    existsOne(test, checked.children)));
    });
}
exports.existsOne = existsOne;
/**
 * Search and array of nodes and its children for nodes passing a test function.
 *
 * Same as `find`, only with less options, leading to reduced complexity.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @returns All nodes passing `test`.
 */
function findAll(test, nodes) {
    var _a;
    var result = [];
    var stack = nodes.filter(tagtypes.isTag);
    var elem;
    while ((elem = stack.shift())) {
        var children = (_a = elem.children) === null || _a === void 0 ? void 0 : _a.filter(tagtypes.isTag);
        if (children && children.length > 0) {
            stack.unshift.apply(stack, children);
        }
        if (test(elem))
            result.push(elem);
    }
    return result;
}
exports.findAll = findAll;
});

var legacy = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElementsByTagType = exports.getElementsByTagName = exports.getElementById = exports.getElements = exports.testElement = void 0;


var Checks = {
    tag_name: function (name) {
        if (typeof name === "function") {
            return function (elem) { return tagtypes.isTag(elem) && name(elem.name); };
        }
        else if (name === "*") {
            return tagtypes.isTag;
        }
        return function (elem) { return tagtypes.isTag(elem) && elem.name === name; };
    },
    tag_type: function (type) {
        if (typeof type === "function") {
            return function (elem) { return type(elem.type); };
        }
        return function (elem) { return elem.type === type; };
    },
    tag_contains: function (data) {
        if (typeof data === "function") {
            return function (elem) { return tagtypes.isText(elem) && data(elem.data); };
        }
        return function (elem) { return tagtypes.isText(elem) && elem.data === data; };
    },
};
/**
 * @param attrib Attribute to check.
 * @param value Attribute value to look for.
 * @returns A function to check whether the a node has an attribute with a particular value.
 */
function getAttribCheck(attrib, value) {
    if (typeof value === "function") {
        return function (elem) { return tagtypes.isTag(elem) && value(elem.attribs[attrib]); };
    }
    return function (elem) { return tagtypes.isTag(elem) && elem.attribs[attrib] === value; };
}
/**
 * @param a First function to combine.
 * @param b Second function to combine.
 * @returns A function taking a node and returning `true` if either
 * of the input functions returns `true` for the node.
 */
function combineFuncs(a, b) {
    return function (elem) { return a(elem) || b(elem); };
}
/**
 * @param options An object describing nodes to look for.
 * @returns A function executing all checks in `options` and returning `true`
 * if any of them match a node.
 */
function compileTest(options) {
    var funcs = Object.keys(options).map(function (key) {
        var value = options[key];
        return key in Checks
            ? Checks[key](value)
            : getAttribCheck(key, value);
    });
    return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
/**
 * @param options An object describing nodes to look for.
 * @param node The element to test.
 * @returns Whether the element matches the description in `options`.
 */
function testElement(options, node) {
    var test = compileTest(options);
    return test ? test(node) : true;
}
exports.testElement = testElement;
/**
 * @param options An object describing nodes to look for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes that match `options`.
 */
function getElements(options, nodes, recurse, limit) {
    if (limit === void 0) { limit = Infinity; }
    var test = compileTest(options);
    return test ? querying.filter(test, nodes, recurse, limit) : [];
}
exports.getElements = getElements;
/**
 * @param id The unique ID attribute value to look for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @returns The node with the supplied ID.
 */
function getElementById(id, nodes, recurse) {
    if (recurse === void 0) { recurse = true; }
    if (!Array.isArray(nodes))
        nodes = [nodes];
    return querying.findOne(getAttribCheck("id", id), nodes, recurse);
}
exports.getElementById = getElementById;
/**
 * @param tagName Tag name to search for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes with the supplied `tagName`.
 */
function getElementsByTagName(tagName, nodes, recurse, limit) {
    if (recurse === void 0) { recurse = true; }
    if (limit === void 0) { limit = Infinity; }
    return querying.filter(Checks.tag_name(tagName), nodes, recurse, limit);
}
exports.getElementsByTagName = getElementsByTagName;
/**
 * @param type Element type to look for.
 * @param nodes Nodes to search through.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 * @returns All nodes with the supplied `type`.
 */
function getElementsByTagType(type, nodes, recurse, limit) {
    if (recurse === void 0) { recurse = true; }
    if (limit === void 0) { limit = Infinity; }
    return querying.filter(Checks.tag_type(type), nodes, recurse, limit);
}
exports.getElementsByTagType = getElementsByTagType;
});

var helpers = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueSort = exports.compareDocumentPosition = exports.removeSubsets = void 0;

/**
 * Given an array of nodes, remove any member that is contained by another.
 *
 * @param nodes Nodes to filter.
 * @returns Remaining nodes that aren't subtrees of each other.
 */
function removeSubsets(nodes) {
    var idx = nodes.length;
    /*
     * Check if each node (or one of its ancestors) is already contained in the
     * array.
     */
    while (--idx >= 0) {
        var node = nodes[idx];
        /*
         * Remove the node if it is not unique.
         * We are going through the array from the end, so we only
         * have to check nodes that preceed the node under consideration in the array.
         */
        if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
            nodes.splice(idx, 1);
            continue;
        }
        for (var ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
            if (nodes.includes(ancestor)) {
                nodes.splice(idx, 1);
                break;
            }
        }
    }
    return nodes;
}
exports.removeSubsets = removeSubsets;
/**
 * Compare the position of one node against another node in any other document.
 * The return value is a bitmask with the following values:
 *
 * Document order:
 * > There is an ordering, document order, defined on all the nodes in the
 * > document corresponding to the order in which the first character of the
 * > XML representation of each node occurs in the XML representation of the
 * > document after expansion of general entities. Thus, the document element
 * > node will be the first node. Element nodes occur before their children.
 * > Thus, document order orders element nodes in order of the occurrence of
 * > their start-tag in the XML (after expansion of entities). The attribute
 * > nodes of an element occur after the element and before its children. The
 * > relative order of attribute nodes is implementation-dependent./
 *
 * Source:
 * http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
 *
 * @param nodeA The first node to use in the comparison
 * @param nodeB The second node to use in the comparison
 * @returns A bitmask describing the input nodes' relative position.
 *
 * See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
 * a description of these values.
 */
function compareDocumentPosition(nodeA, nodeB) {
    var aParents = [];
    var bParents = [];
    if (nodeA === nodeB) {
        return 0;
    }
    var current = tagtypes.hasChildren(nodeA) ? nodeA : nodeA.parent;
    while (current) {
        aParents.unshift(current);
        current = current.parent;
    }
    current = tagtypes.hasChildren(nodeB) ? nodeB : nodeB.parent;
    while (current) {
        bParents.unshift(current);
        current = current.parent;
    }
    var maxIdx = Math.min(aParents.length, bParents.length);
    var idx = 0;
    while (idx < maxIdx && aParents[idx] === bParents[idx]) {
        idx++;
    }
    if (idx === 0) {
        return 1 /* DISCONNECTED */;
    }
    var sharedParent = aParents[idx - 1];
    var siblings = sharedParent.children;
    var aSibling = aParents[idx];
    var bSibling = bParents[idx];
    if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
        if (sharedParent === nodeB) {
            return 4 /* FOLLOWING */ | 16 /* CONTAINED_BY */;
        }
        return 4 /* FOLLOWING */;
    }
    if (sharedParent === nodeA) {
        return 2 /* PRECEDING */ | 8 /* CONTAINS */;
    }
    return 2 /* PRECEDING */;
}
exports.compareDocumentPosition = compareDocumentPosition;
/**
 * Sort an array of nodes based on their relative position in the document and
 * remove any duplicate nodes. If the array contains nodes that do not belong
 * to the same document, sort order is unspecified.
 *
 * @param nodes Array of DOM nodes.
 * @returns Collection of unique nodes, sorted in document order.
 */
function uniqueSort(nodes) {
    nodes = nodes.filter(function (node, i, arr) { return !arr.includes(node, i + 1); });
    nodes.sort(function (a, b) {
        var relative = compareDocumentPosition(a, b);
        if (relative & 2 /* PRECEDING */) {
            return -1;
        }
        else if (relative & 4 /* FOLLOWING */) {
            return 1;
        }
        return 0;
    });
    return nodes;
}
exports.uniqueSort = uniqueSort;
});

var lib$4 = createCommonjsModule(function (module, exports) {
var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(stringify, exports);
__exportStar(traversal, exports);
__exportStar(manipulation, exports);
__exportStar(querying, exports);
__exportStar(legacy, exports);
__exportStar(helpers, exports);
__exportStar(tagtypes, exports);
});

var boolbase = {
	trueFunc: function trueFunc(){
		return true;
	},
	falseFunc: function falseFunc(){
		return false;
	}
};

var parse_1 = createCommonjsModule(function (module, exports) {
var __spreadArrays = (commonjsGlobal && commonjsGlobal.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTraversal = void 0;
var reName = /^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/;
var reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
// Modified version of https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L87
var reAttr = /^\s*(?:(\*|[-\w]*)\|)?((?:\\.|[\w\u00b0-\uFFFF-])+)\s*(?:(\S?)=\s*(?:(['"])((?:[^\\]|\\[^])*?)\4|(#?(?:\\.|[\w\u00b0-\uFFFF-])*)|)|)\s*([iI])?\]/;
var actionTypes = {
    undefined: "exists",
    "": "equals",
    "~": "element",
    "^": "start",
    $: "end",
    "*": "any",
    "!": "not",
    "|": "hyphen",
};
var Traversals = {
    ">": "child",
    "<": "parent",
    "~": "sibling",
    "+": "adjacent",
};
var attribSelectors = {
    "#": ["id", "equals"],
    ".": ["class", "element"],
};
// Pseudos, whose data property is parsed as well.
var unpackPseudos = new Set([
    "has",
    "not",
    "matches",
    "is",
    "host",
    "host-context",
]);
var traversalNames = new Set(__spreadArrays([
    "descendant"
], Object.keys(Traversals).map(function (k) { return Traversals[k]; })));
/**
 * Checks whether a specific selector is a traversal.
 * This is useful eg. in swapping the order of elements that
 * are not traversals.
 *
 * @param selector Selector to check.
 */
function isTraversal(selector) {
    return traversalNames.has(selector.type);
}
exports.isTraversal = isTraversal;
var stripQuotesFromPseudos = new Set(["contains", "icontains"]);
var quotes = new Set(['"', "'"]);
// Unescape function taken from https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L152
function funescape(_, escaped, escapedWhitespace) {
    var high = parseInt(escaped, 16) - 0x10000;
    // NaN means non-codepoint
    return high !== high || escapedWhitespace
        ? escaped
        : high < 0
            ? // BMP codepoint
                String.fromCharCode(high + 0x10000)
            : // Supplemental Plane codepoint (surrogate pair)
                String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
}
function unescapeCSS(str) {
    return str.replace(reEscape, funescape);
}
function isWhitespace(c) {
    return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
}
/**
 * Parses `selector`, optionally with the passed `options`.
 *
 * @param selector Selector to parse.
 * @param options Options for parsing.
 * @returns Returns a two-dimensional array.
 * The first dimension represents selectors separated by commas (eg. `sub1, sub2`),
 * the second contains the relevant tokens for that selector.
 */
function parse(selector, options) {
    var subselects = [];
    var endIndex = parseSelector(subselects, "" + selector, options, 0);
    if (endIndex < selector.length) {
        throw new Error("Unmatched selector: " + selector.slice(endIndex));
    }
    return subselects;
}
exports.default = parse;
function parseSelector(subselects, selector, options, selectorIndex) {
    var _a, _b;
    if (options === void 0) { options = {}; }
    var tokens = [];
    var sawWS = false;
    function getName(offset) {
        var match = selector.slice(selectorIndex + offset).match(reName);
        if (!match) {
            throw new Error("Expected name, found " + selector.slice(selectorIndex));
        }
        var name = match[0];
        selectorIndex += offset + name.length;
        return unescapeCSS(name);
    }
    function stripWhitespace(offset) {
        while (isWhitespace(selector.charAt(selectorIndex + offset)))
            offset++;
        selectorIndex += offset;
    }
    function isEscaped(pos) {
        var slashCount = 0;
        while (selector.charAt(--pos) === "\\")
            slashCount++;
        return (slashCount & 1) === 1;
    }
    function ensureNotTraversal() {
        if (tokens.length > 0 && isTraversal(tokens[tokens.length - 1])) {
            throw new Error("Did not expect successive traversals.");
        }
    }
    stripWhitespace(0);
    while (selector !== "") {
        var firstChar = selector.charAt(selectorIndex);
        if (isWhitespace(firstChar)) {
            sawWS = true;
            stripWhitespace(1);
        }
        else if (firstChar in Traversals) {
            ensureNotTraversal();
            tokens.push({ type: Traversals[firstChar] });
            sawWS = false;
            stripWhitespace(1);
        }
        else if (firstChar === ",") {
            if (tokens.length === 0) {
                throw new Error("Empty sub-selector");
            }
            subselects.push(tokens);
            tokens = [];
            sawWS = false;
            stripWhitespace(1);
        }
        else {
            if (sawWS) {
                ensureNotTraversal();
                tokens.push({ type: "descendant" });
                sawWS = false;
            }
            if (firstChar in attribSelectors) {
                var _c = attribSelectors[firstChar], name_1 = _c[0], action = _c[1];
                tokens.push({
                    type: "attribute",
                    name: name_1,
                    action: action,
                    value: getName(1),
                    ignoreCase: false,
                    namespace: null,
                });
            }
            else if (firstChar === "[") {
                var attributeMatch = selector
                    .slice(selectorIndex + 1)
                    .match(reAttr);
                if (!attributeMatch) {
                    throw new Error("Malformed attribute selector: " + selector.slice(selectorIndex));
                }
                var completeSelector = attributeMatch[0], _d = attributeMatch[1], namespace = _d === void 0 ? null : _d, baseName = attributeMatch[2], actionType = attributeMatch[3], _e = attributeMatch[5], quotedValue = _e === void 0 ? "" : _e, _f = attributeMatch[6], value = _f === void 0 ? quotedValue : _f, ignoreCase = attributeMatch[7];
                selectorIndex += completeSelector.length + 1;
                var name_2 = unescapeCSS(baseName);
                if ((_a = options.lowerCaseAttributeNames) !== null && _a !== void 0 ? _a : !options.xmlMode) {
                    name_2 = name_2.toLowerCase();
                }
                tokens.push({
                    type: "attribute",
                    name: name_2,
                    action: actionTypes[actionType],
                    value: unescapeCSS(value),
                    namespace: namespace,
                    ignoreCase: !!ignoreCase,
                });
            }
            else if (firstChar === ":") {
                if (selector.charAt(selectorIndex + 1) === ":") {
                    tokens.push({
                        type: "pseudo-element",
                        name: getName(2).toLowerCase(),
                    });
                    continue;
                }
                var name_3 = getName(1).toLowerCase();
                var data = null;
                if (selector.charAt(selectorIndex) === "(") {
                    if (unpackPseudos.has(name_3)) {
                        if (quotes.has(selector.charAt(selectorIndex + 1))) {
                            throw new Error("Pseudo-selector " + name_3 + " cannot be quoted");
                        }
                        data = [];
                        selectorIndex = parseSelector(data, selector, options, selectorIndex + 1);
                        if (selector.charAt(selectorIndex) !== ")") {
                            throw new Error("Missing closing parenthesis in :" + name_3 + " (" + selector + ")");
                        }
                        selectorIndex += 1;
                    }
                    else {
                        selectorIndex += 1;
                        var start = selectorIndex;
                        var counter = 1;
                        for (; counter > 0 && selectorIndex < selector.length; selectorIndex++) {
                            if (selector.charAt(selectorIndex) === "(" &&
                                !isEscaped(selectorIndex)) {
                                counter++;
                            }
                            else if (selector.charAt(selectorIndex) === ")" &&
                                !isEscaped(selectorIndex)) {
                                counter--;
                            }
                        }
                        if (counter) {
                            throw new Error("Parenthesis not matched");
                        }
                        data = selector.slice(start, selectorIndex - 1);
                        if (stripQuotesFromPseudos.has(name_3)) {
                            var quot = data.charAt(0);
                            if (quot === data.slice(-1) && quotes.has(quot)) {
                                data = data.slice(1, -1);
                            }
                            data = unescapeCSS(data);
                        }
                    }
                }
                tokens.push({ type: "pseudo", name: name_3, data: data });
            }
            else {
                var namespace = null;
                var name_4 = void 0;
                if (firstChar === "*") {
                    selectorIndex += 1;
                    name_4 = "*";
                }
                else if (reName.test(selector.slice(selectorIndex))) {
                    name_4 = getName(0);
                }
                else {
                    /*
                     * We have finished parsing the selector.
                     * Remove descendant tokens at the end if they exist,
                     * and return the last index, so that parsing can be
                     * picked up from here.
                     */
                    if (tokens.length &&
                        tokens[tokens.length - 1].type === "descendant") {
                        tokens.pop();
                    }
                    addToken(subselects, tokens);
                    return selectorIndex;
                }
                if (selector.charAt(selectorIndex) === "|") {
                    namespace = name_4;
                    if (selector.charAt(selectorIndex + 1) === "*") {
                        name_4 = "*";
                        selectorIndex += 2;
                    }
                    else {
                        name_4 = getName(1);
                    }
                }
                if (name_4 === "*") {
                    tokens.push({ type: "universal", namespace: namespace });
                }
                else {
                    if ((_b = options.lowerCaseTags) !== null && _b !== void 0 ? _b : !options.xmlMode) {
                        name_4 = name_4.toLowerCase();
                    }
                    tokens.push({ type: "tag", name: name_4, namespace: namespace });
                }
            }
        }
    }
    addToken(subselects, tokens);
    return selectorIndex;
}
function addToken(subselects, tokens) {
    if (subselects.length > 0 && tokens.length === 0) {
        throw new Error("Empty sub-selector");
    }
    subselects.push(tokens);
}
});

var __spreadArrays = (commonjsGlobal && commonjsGlobal.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

var actionTypes = {
    equals: "",
    element: "~",
    start: "^",
    end: "$",
    any: "*",
    not: "!",
    hyphen: "|",
};
var charsToEscape = new Set(__spreadArrays(Object.keys(actionTypes)
    .map(function (typeKey) { return actionTypes[typeKey]; })
    .filter(Boolean), [
    ":",
    "[",
    "]",
    " ",
    "\\",
    "(",
    ")",
]));
/**
 * Turns `selector` back into a string.
 *
 * @param selector Selector to stringify.
 */
function stringify$1(selector) {
    return selector.map(stringifySubselector).join(", ");
}
var _default$2 = stringify$1;
function stringifySubselector(token) {
    return token.map(stringifyToken).join("");
}
function stringifyToken(token) {
    switch (token.type) {
        // Simple types
        case "child":
            return " > ";
        case "parent":
            return " < ";
        case "sibling":
            return " ~ ";
        case "adjacent":
            return " + ";
        case "descendant":
            return " ";
        case "universal":
            return getNamespace(token.namespace) + "*";
        case "tag":
            return getNamespacedName(token);
        case "pseudo-element":
            return "::" + escapeName(token.name);
        case "pseudo":
            if (token.data === null)
                return ":" + escapeName(token.name);
            if (typeof token.data === "string") {
                return ":" + escapeName(token.name) + "(" + escapeName(token.data) + ")";
            }
            return ":" + escapeName(token.name) + "(" + stringify$1(token.data) + ")";
        case "attribute": {
            if (token.name === "id" &&
                token.action === "equals" &&
                !token.ignoreCase &&
                !token.namespace) {
                return "#" + escapeName(token.value);
            }
            if (token.name === "class" &&
                token.action === "element" &&
                !token.ignoreCase &&
                !token.namespace) {
                return "." + escapeName(token.value);
            }
            var name_1 = getNamespacedName(token);
            if (token.action === "exists") {
                return "[" + name_1 + "]";
            }
            return "[" + name_1 + actionTypes[token.action] + "='" + escapeName(token.value) + "'" + (token.ignoreCase ? "i" : "") + "]";
        }
    }
}
function getNamespacedName(token) {
    return "" + getNamespace(token.namespace) + escapeName(token.name);
}
function getNamespace(namespace) {
    return namespace
        ? (namespace === "*" ? "*" : escapeName(namespace)) + "|"
        : "";
}
function escapeName(str) {
    return str
        .split("")
        .map(function (c) { return (charsToEscape.has(c) ? "\\" + c : c); })
        .join("");
}

var stringify_1 = /*#__PURE__*/Object.defineProperty({
	default: _default$2
}, '__esModule', {value: true});

var lib$5 = createCommonjsModule(function (module, exports) {
var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringify = exports.parse = void 0;
__exportStar(parse_1, exports);

Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return __importDefault(parse_1).default; } });

Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return __importDefault(stringify_1).default; } });
});

var procedure = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTraversal = exports.procedure = void 0;
exports.procedure = {
    universal: 50,
    tag: 30,
    attribute: 1,
    pseudo: 0,
    "pseudo-element": 0,
    descendant: -1,
    child: -1,
    parent: -1,
    sibling: -1,
    adjacent: -1,
    _flexibleDescendant: -1,
};
function isTraversal(t) {
    return exports.procedure[t.type] < 0;
}
exports.isTraversal = isTraversal;
});

var attributes = {
    exists: 10,
    equals: 8,
    not: 7,
    start: 6,
    end: 6,
    any: 5,
    hyphen: 4,
    element: 4,
};
/**
 * Sort the parts of the passed selector,
 * as there is potential for optimization
 * (some types of selectors are faster than others)
 *
 * @param arr Selector to sort
 */
function sortByProcedure(arr) {
    var procs = arr.map(getProcedure);
    for (var i = 1; i < arr.length; i++) {
        var procNew = procs[i];
        if (procNew < 0)
            continue;
        for (var j = i - 1; j >= 0 && procNew < procs[j]; j--) {
            var token = arr[j + 1];
            arr[j + 1] = arr[j];
            arr[j] = token;
            procs[j + 1] = procs[j];
            procs[j] = procNew;
        }
    }
}
var _default$3 = sortByProcedure;
function getProcedure(token) {
    var proc = procedure.procedure[token.type];
    if (token.type === "attribute") {
        proc = attributes[token.action];
        if (proc === attributes.equals && token.name === "id") {
            // Prefer ID selectors (eg. #ID)
            proc = 9;
        }
        if (token.ignoreCase) {
            /*
             * IgnoreCase adds some overhead, prefer "normal" token
             * this is a binary operation, to ensure it's still an int
             */
            proc >>= 1;
        }
    }
    else if (token.type === "pseudo") {
        if (!token.data) {
            proc = 3;
        }
        else if (token.name === "has" || token.name === "contains") {
            proc = 0; // Expensive in any case
        }
        else if (Array.isArray(token.data)) {
            // "matches" and "not"
            proc = 0;
            for (var i = 0; i < token.data.length; i++) {
                // TODO better handling of complex selectors
                if (token.data[i].length !== 1)
                    continue;
                var cur = getProcedure(token.data[i][0]);
                // Avoid executing :has or :contains
                if (cur === 0) {
                    proc = 0;
                    break;
                }
                if (cur > proc)
                    proc = cur;
            }
            if (token.data.length > 1 && proc > 0)
                proc -= 1;
        }
        else {
            proc = 1;
        }
    }
    return proc;
}

var sort = /*#__PURE__*/Object.defineProperty({
	default: _default$3
}, '__esModule', {value: true});

var attributes$1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeRules = void 0;

/**
 * All reserved characters in a regex, used for escaping.
 *
 * Taken from XRegExp, (c) 2007-2020 Steven Levithan under the MIT license
 * https://github.com/slevithan/xregexp/blob/95eeebeb8fac8754d54eafe2b4743661ac1cf028/src/xregexp.js#L794
 */
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
function escapeRegex(value) {
    return value.replace(reChars, "\\$&");
}
/**
 * Attribute selectors
 */
exports.attributeRules = {
    equals: function (next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        if (data.ignoreCase) {
            value = value.toLowerCase();
            return function (elem) {
                var _a;
                return ((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.toLowerCase()) ===
                    value && next(elem);
            };
        }
        return function (elem) {
            return adapter.getAttributeValue(elem, name) === value && next(elem);
        };
    },
    hyphen: function (next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        var len = value.length;
        if (data.ignoreCase) {
            value = value.toLowerCase();
            return function hyphenIC(elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return (attr != null &&
                    (attr.length === len || attr.charAt(len) === "-") &&
                    attr.substr(0, len).toLowerCase() === value &&
                    next(elem));
            };
        }
        return function hyphen(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return (attr != null &&
                attr.substr(0, len) === value &&
                (attr.length === len || attr.charAt(len) === "-") &&
                next(elem));
        };
    },
    element: function (next, _a, _b) {
        var name = _a.name, value = _a.value, ignoreCase = _a.ignoreCase;
        var adapter = _b.adapter;
        if (/\s/.test(value)) {
            return boolbase.falseFunc;
        }
        var regex = new RegExp("(?:^|\\s)" + escapeRegex(value) + "(?:$|\\s)", ignoreCase ? "i" : "");
        return function element(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && regex.test(attr) && next(elem);
        };
    },
    exists: function (next, _a, _b) {
        var name = _a.name;
        var adapter = _b.adapter;
        return function (elem) { return adapter.hasAttrib(elem, name) && next(elem); };
    },
    start: function (next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        var len = value.length;
        if (len === 0) {
            return boolbase.falseFunc;
        }
        if (data.ignoreCase) {
            value = value.toLowerCase();
            return function (elem) {
                var _a;
                return ((_a = adapter
                    .getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.substr(0, len).toLowerCase()) === value && next(elem);
            };
        }
        return function (elem) {
            var _a;
            return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.startsWith(value)) &&
                next(elem);
        };
    },
    end: function (next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        var len = -value.length;
        if (len === 0) {
            return boolbase.falseFunc;
        }
        if (data.ignoreCase) {
            value = value.toLowerCase();
            return function (elem) {
                var _a;
                return ((_a = adapter
                    .getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.substr(len).toLowerCase()) === value && next(elem);
            };
        }
        return function (elem) {
            var _a;
            return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.endsWith(value)) &&
                next(elem);
        };
    },
    any: function (next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name, value = data.value;
        if (value === "") {
            return boolbase.falseFunc;
        }
        if (data.ignoreCase) {
            var regex_1 = new RegExp(escapeRegex(value), "i");
            return function anyIC(elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return attr != null && regex_1.test(attr) && next(elem);
            };
        }
        return function (elem) {
            var _a;
            return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.includes(value)) &&
                next(elem);
        };
    },
    not: function (next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        if (value === "") {
            return function (elem) {
                return !!adapter.getAttributeValue(elem, name) && next(elem);
            };
        }
        else if (data.ignoreCase) {
            value = value.toLowerCase();
            return function (elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return (attr != null &&
                    attr.toLocaleLowerCase() !== value &&
                    next(elem));
            };
        }
        return function (elem) {
            return adapter.getAttributeValue(elem, name) !== value && next(elem);
        };
    },
};
});

var parse_1$1 = createCommonjsModule(function (module, exports) {
// Following http://www.w3.org/TR/css3-selectors/#nth-child-pseudo
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
// [ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]?
var RE_NTH_ELEMENT = /^([+-]?\d*n)?\s*(?:([+-]?)\s*(\d+))?$/;
/**
 * Parses an expression.
 *
 * @throws An `Error` if parsing fails.
 * @returns An array containing the integer step size and the integer offset of the nth rule.
 * @example nthCheck.parse("2n+3"); // returns [2, 3]
 */
function parse(formula) {
    formula = formula.trim().toLowerCase();
    if (formula === "even") {
        return [2, 0];
    }
    else if (formula === "odd") {
        return [2, 1];
    }
    var parsed = formula.match(RE_NTH_ELEMENT);
    if (!parsed) {
        throw new Error("n-th rule couldn't be parsed ('" + formula + "')");
    }
    var a;
    if (parsed[1]) {
        a = parseInt(parsed[1], 10);
        if (isNaN(a)) {
            a = parsed[1].startsWith("-") ? -1 : 1;
        }
    }
    else
        a = 0;
    var b = (parsed[2] === "-" ? -1 : 1) *
        (parsed[3] ? parseInt(parsed[3], 10) : 0);
    return [a, b];
}
exports.parse = parse;
});

var compile_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;

/**
 * Returns a function that checks if an elements index matches the given rule
 * highly optimized to return the fastest solution.
 *
 * @param parsed A tuple [a, b], as returned by `parse`.
 * @returns A highly optimized function that returns whether an index matches the nth-check.
 * @example
 * const check = nthCheck.compile([2, 3]);
 *
 * check(0); // `false`
 * check(1); // `false`
 * check(2); // `true`
 * check(3); // `false`
 * check(4); // `true`
 * check(5); // `false`
 * check(6); // `true`
 */
function compile(parsed) {
    var a = parsed[0];
    // Subtract 1 from `b`, to convert from one- to zero-indexed.
    var b = parsed[1] - 1;
    /*
     * When `b <= 0`, `a * n` won't be lead to any matches for `a < 0`.
     * Besides, the specification states that no elements are
     * matched when `a` and `b` are 0.
     *
     * `b < 0` here as we subtracted 1 from `b` above.
     */
    if (b < 0 && a <= 0)
        return boolbase.falseFunc;
    // When `a` is in the range -1..1, it matches any element (so only `b` is checked).
    if (a === -1)
        return function (index) { return index <= b; };
    if (a === 0)
        return function (index) { return index === b; };
    // When `b <= 0` and `a === 1`, they match any element.
    if (a === 1)
        return b < 0 ? boolbase.trueFunc : function (index) { return index >= b; };
    /*
     * Otherwise, modulo can be used to check if there is a match.
     *
     * Modulo doesn't care about the sign, so let's use `a`s absolute value.
     */
    var absA = Math.abs(a);
    // Get `b mod a`, + a if this is negative.
    var bMod = ((b % absA) + absA) % absA;
    return a > 1
        ? function (index) { return index >= b && index % absA === bMod; }
        : function (index) { return index <= b && index % absA === bMod; };
}
exports.compile = compile;
});

var lib$6 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.parse = void 0;

Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parse_1$1.parse; } });

Object.defineProperty(exports, "compile", { enumerable: true, get: function () { return compile_1.compile; } });
/**
 * Parses and compiles a formula to a highly optimized function.
 * Combination of `parse` and `compile`.
 *
 * If the formula doesn't match any elements,
 * it returns [`boolbase`](https://github.com/fb55/boolbase)'s `falseFunc`.
 * Otherwise, a function accepting an _index_ is returned, which returns
 * whether or not the passed _index_ matches the formula.
 *
 * Note: The nth-rule starts counting at `1`, the returned function at `0`.
 *
 * @param formula The formula to compile.
 * @example
 * const check = nthCheck("2n+3");
 *
 * check(0); // `false`
 * check(1); // `false`
 * check(2); // `true`
 * check(3); // `false`
 * check(4); // `true`
 * check(5); // `false`
 * check(6); // `true`
 */
function nthCheck(formula) {
    return compile_1.compile(parse_1$1.parse(formula));
}
exports.default = nthCheck;
});

var filters$1 = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filters = void 0;
var nth_check_1 = __importDefault(lib$6);


var checkAttrib = attributes$1.attributeRules.equals;
function getAttribFunc(name, value) {
    var data = {
        type: "attribute",
        action: "equals",
        ignoreCase: false,
        namespace: null,
        name: name,
        value: value,
    };
    return function attribFunc(next, _rule, options) {
        return checkAttrib(next, data, options);
    };
}
function getChildFunc(next, adapter) {
    return function (elem) {
        var parent = adapter.getParent(elem);
        return !!parent && adapter.isTag(parent) && next(elem);
    };
}
exports.filters = {
    contains: function (next, text, _a) {
        var adapter = _a.adapter;
        return function contains(elem) {
            return next(elem) && adapter.getText(elem).includes(text);
        };
    },
    icontains: function (next, text, _a) {
        var adapter = _a.adapter;
        var itext = text.toLowerCase();
        return function icontains(elem) {
            return (next(elem) &&
                adapter.getText(elem).toLowerCase().includes(itext));
        };
    },
    // Location specific methods
    "nth-child": function (next, rule, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var func = nth_check_1.default(rule);
        if (func === boolbase.falseFunc)
            return boolbase.falseFunc;
        if (func === boolbase.trueFunc)
            return getChildFunc(next, adapter);
        return function nthChild(elem) {
            var siblings = adapter.getSiblings(elem);
            var pos = 0;
            for (var i = 0; i < siblings.length; i++) {
                if (equals(elem, siblings[i]))
                    break;
                if (adapter.isTag(siblings[i])) {
                    pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-last-child": function (next, rule, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var func = nth_check_1.default(rule);
        if (func === boolbase.falseFunc)
            return boolbase.falseFunc;
        if (func === boolbase.trueFunc)
            return getChildFunc(next, adapter);
        return function nthLastChild(elem) {
            var siblings = adapter.getSiblings(elem);
            var pos = 0;
            for (var i = siblings.length - 1; i >= 0; i--) {
                if (equals(elem, siblings[i]))
                    break;
                if (adapter.isTag(siblings[i])) {
                    pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-of-type": function (next, rule, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var func = nth_check_1.default(rule);
        if (func === boolbase.falseFunc)
            return boolbase.falseFunc;
        if (func === boolbase.trueFunc)
            return getChildFunc(next, adapter);
        return function nthOfType(elem) {
            var siblings = adapter.getSiblings(elem);
            var pos = 0;
            for (var i = 0; i < siblings.length; i++) {
                var currentSibling = siblings[i];
                if (equals(elem, currentSibling))
                    break;
                if (adapter.isTag(currentSibling) &&
                    adapter.getName(currentSibling) === adapter.getName(elem)) {
                    pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-last-of-type": function (next, rule, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var func = nth_check_1.default(rule);
        if (func === boolbase.falseFunc)
            return boolbase.falseFunc;
        if (func === boolbase.trueFunc)
            return getChildFunc(next, adapter);
        return function nthLastOfType(elem) {
            var siblings = adapter.getSiblings(elem);
            var pos = 0;
            for (var i = siblings.length - 1; i >= 0; i--) {
                var currentSibling = siblings[i];
                if (equals(elem, currentSibling))
                    break;
                if (adapter.isTag(currentSibling) &&
                    adapter.getName(currentSibling) === adapter.getName(elem)) {
                    pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    // TODO determine the actual root element
    root: function (next, _rule, _a) {
        var adapter = _a.adapter;
        return function (elem) {
            var parent = adapter.getParent(elem);
            return (parent == null || !adapter.isTag(parent)) && next(elem);
        };
    },
    scope: function (next, rule, options, context) {
        var equals = options.equals;
        if (!context || context.length === 0) {
            // Equivalent to :root
            return exports.filters.root(next, rule, options);
        }
        if (context.length === 1) {
            // NOTE: can't be unpacked, as :has uses this for side-effects
            return function (elem) { return equals(context[0], elem) && next(elem); };
        }
        return function (elem) { return context.includes(elem) && next(elem); };
    },
    // JQuery extensions (others follow as pseudos)
    checkbox: getAttribFunc("type", "checkbox"),
    file: getAttribFunc("type", "file"),
    password: getAttribFunc("type", "password"),
    radio: getAttribFunc("type", "radio"),
    reset: getAttribFunc("type", "reset"),
    image: getAttribFunc("type", "image"),
    submit: getAttribFunc("type", "submit"),
    // Dynamic state pseudos. These depend on optional Adapter methods.
    hover: function (next, _rule, _a) {
        var adapter = _a.adapter;
        var isHovered = adapter.isHovered;
        if (typeof isHovered !== "function") {
            return boolbase.falseFunc;
        }
        return function hover(elem) {
            return isHovered(elem) && next(elem);
        };
    },
    visited: function (next, _rule, _a) {
        var adapter = _a.adapter;
        var isVisited = adapter.isVisited;
        if (typeof isVisited !== "function") {
            return boolbase.falseFunc;
        }
        return function visited(elem) {
            return isVisited(elem) && next(elem);
        };
    },
    active: function (next, _rule, _a) {
        var adapter = _a.adapter;
        var isActive = adapter.isActive;
        if (typeof isActive !== "function") {
            return boolbase.falseFunc;
        }
        return function active(elem) {
            return isActive(elem) && next(elem);
        };
    },
};
});

var pseudos = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPseudoArgs = exports.pseudos = void 0;
var isLinkTag = namePseudo(["a", "area", "link"]);
// While filters are precompiled, pseudos get called when they are needed
exports.pseudos = {
    empty: function (elem, _a) {
        var adapter = _a.adapter;
        return !adapter.getChildren(elem).some(function (elem) {
            // FIXME: `getText` call is potentially expensive.
            return adapter.isTag(elem) || adapter.getText(elem) !== "";
        });
    },
    "first-child": function (elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var firstChild = adapter
            .getSiblings(elem)
            .find(function (elem) { return adapter.isTag(elem); });
        return firstChild != null && equals(elem, firstChild);
    },
    "last-child": function (elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var siblings = adapter.getSiblings(elem);
        for (var i = siblings.length - 1; i >= 0; i--) {
            if (equals(elem, siblings[i]))
                return true;
            if (adapter.isTag(siblings[i]))
                break;
        }
        return false;
    },
    "first-of-type": function (elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var siblings = adapter.getSiblings(elem);
        var elemName = adapter.getName(elem);
        for (var i = 0; i < siblings.length; i++) {
            var currentSibling = siblings[i];
            if (equals(elem, currentSibling))
                return true;
            if (adapter.isTag(currentSibling) &&
                adapter.getName(currentSibling) === elemName) {
                break;
            }
        }
        return false;
    },
    "last-of-type": function (elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var siblings = adapter.getSiblings(elem);
        var elemName = adapter.getName(elem);
        for (var i = siblings.length - 1; i >= 0; i--) {
            var currentSibling = siblings[i];
            if (equals(elem, currentSibling))
                return true;
            if (adapter.isTag(currentSibling) &&
                adapter.getName(currentSibling) === elemName) {
                break;
            }
        }
        return false;
    },
    "only-of-type": function (elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var elemName = adapter.getName(elem);
        return adapter
            .getSiblings(elem)
            .every(function (sibling) {
            return equals(elem, sibling) ||
                !adapter.isTag(sibling) ||
                adapter.getName(sibling) !== elemName;
        });
    },
    "only-child": function (elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        return adapter
            .getSiblings(elem)
            .every(function (sibling) { return equals(elem, sibling) || !adapter.isTag(sibling); });
    },
    // :matches(a, area, link)[href]
    "any-link": function (elem, options) {
        return (isLinkTag(elem, options) && options.adapter.hasAttrib(elem, "href"));
    },
    // :any-link:not(:visited)
    link: function (elem, options) {
        var _a, _b;
        return (((_b = (_a = options.adapter).isVisited) === null || _b === void 0 ? void 0 : _b.call(_a, elem)) !== true &&
            exports.pseudos["any-link"](elem, options));
    },
    /*
     * Forms
     * to consider: :target
     */
    // :matches([selected], select:not([multiple]):not(> option[selected]) > option:first-of-type)
    selected: function (elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        if (adapter.hasAttrib(elem, "selected"))
            return true;
        else if (adapter.getName(elem) !== "option")
            return false;
        // The first <option> in a <select> is also selected
        var parent = adapter.getParent(elem);
        if (!parent ||
            !adapter.isTag(parent) ||
            adapter.getName(parent) !== "select" ||
            adapter.hasAttrib(parent, "multiple")) {
            return false;
        }
        var siblings = adapter.getChildren(parent);
        var sawElem = false;
        for (var i = 0; i < siblings.length; i++) {
            var currentSibling = siblings[i];
            if (adapter.isTag(currentSibling)) {
                if (equals(elem, currentSibling)) {
                    sawElem = true;
                }
                else if (!sawElem) {
                    return false;
                }
                else if (adapter.hasAttrib(currentSibling, "selected")) {
                    return false;
                }
            }
        }
        return sawElem;
    },
    /*
     * https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
     * :matches(
     *   :matches(button, input, select, textarea, menuitem, optgroup, option)[disabled],
     *   optgroup[disabled] > option),
     *  fieldset[disabled] * //TODO not child of first <legend>
     * )
     */
    disabled: function (elem, _a) {
        var adapter = _a.adapter;
        return adapter.hasAttrib(elem, "disabled");
    },
    enabled: function (elem, _a) {
        var adapter = _a.adapter;
        return !adapter.hasAttrib(elem, "disabled");
    },
    // :matches(:matches(:radio, :checkbox)[checked], :selected) (TODO menuitem)
    checked: function (elem, options) {
        return (options.adapter.hasAttrib(elem, "checked") ||
            exports.pseudos.selected(elem, options));
    },
    // :matches(input, select, textarea)[required]
    required: function (elem, _a) {
        var adapter = _a.adapter;
        return adapter.hasAttrib(elem, "required");
    },
    // :matches(input, select, textarea):not([required])
    optional: function (elem, _a) {
        var adapter = _a.adapter;
        return !adapter.hasAttrib(elem, "required");
    },
    // JQuery extensions
    // :not(:empty)
    parent: function (elem, options) {
        return !exports.pseudos.empty(elem, options);
    },
    // :matches(h1, h2, h3, h4, h5, h6)
    header: namePseudo(["h1", "h2", "h3", "h4", "h5", "h6"]),
    // :matches(button, input[type=button])
    button: function (elem, _a) {
        var adapter = _a.adapter;
        var name = adapter.getName(elem);
        return (name === "button" ||
            (name === "input" &&
                adapter.getAttributeValue(elem, "type") === "button"));
    },
    // :matches(input, textarea, select, button)
    input: namePseudo(["input", "textarea", "select", "button"]),
    // `input:matches(:not([type!='']), [type='text' i])`
    text: function (elem, _a) {
        var adapter = _a.adapter;
        var type = adapter.getAttributeValue(elem, "type");
        return (adapter.getName(elem) === "input" &&
            (!type || type.toLowerCase() === "text"));
    },
};
function namePseudo(names) {
    if (typeof Set !== "undefined") {
        var nameSet_1 = new Set(names);
        return function (elem, _a) {
            var adapter = _a.adapter;
            return nameSet_1.has(adapter.getName(elem));
        };
    }
    return function (elem, _a) {
        var adapter = _a.adapter;
        return names.includes(adapter.getName(elem));
    };
}
function verifyPseudoArgs(func, name, subselect) {
    if (subselect === null) {
        if (func.length > 2 && name !== "scope") {
            throw new Error("pseudo-selector :" + name + " requires an argument");
        }
    }
    else {
        if (func.length === 2) {
            throw new Error("pseudo-selector :" + name + " doesn't have any arguments");
        }
    }
}
exports.verifyPseudoArgs = verifyPseudoArgs;
});

var subselects = createCommonjsModule(function (module, exports) {
var __spreadArrays = (commonjsGlobal && commonjsGlobal.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subselects = exports.getNextSiblings = exports.ensureIsTag = exports.PLACEHOLDER_ELEMENT = void 0;


/** Used as a placeholder for :has. Will be replaced with the actual element. */
exports.PLACEHOLDER_ELEMENT = {};
function containsTraversal(t) {
    return t.some(procedure.isTraversal);
}
function ensureIsTag(next, adapter) {
    if (next === boolbase.falseFunc)
        return next;
    return function (elem) { return adapter.isTag(elem) && next(elem); };
}
exports.ensureIsTag = ensureIsTag;
function getNextSiblings(elem, adapter) {
    var siblings = adapter.getSiblings(elem);
    if (siblings.length <= 1)
        return [];
    var elemIndex = siblings.indexOf(elem);
    if (elemIndex < 0 || elemIndex === siblings.length - 1)
        return [];
    return siblings.slice(elemIndex + 1).filter(adapter.isTag);
}
exports.getNextSiblings = getNextSiblings;
/*
 * :not, :has and :matches have to compile selectors
 * doing this in src/pseudos.ts would lead to circular dependencies,
 * so we add them here
 */
exports.subselects = {
    /**
     * `:is` is an alias for `:matches`.
     */
    is: function (next, token, options, context, compileToken) {
        return exports.subselects.matches(next, token, options, context, compileToken);
    },
    matches: function (next, token, options, context, compileToken) {
        var opts = {
            xmlMode: !!options.xmlMode,
            strict: !!options.strict,
            adapter: options.adapter,
            equals: options.equals,
            rootFunc: next,
        };
        return compileToken(token, opts, context);
    },
    not: function (next, token, options, context, compileToken) {
        var opts = {
            xmlMode: !!options.xmlMode,
            strict: !!options.strict,
            adapter: options.adapter,
            equals: options.equals,
        };
        if (opts.strict) {
            if (token.length > 1 || token.some(containsTraversal)) {
                throw new Error("complex selectors in :not aren't allowed in strict mode");
            }
        }
        var func = compileToken(token, opts, context);
        if (func === boolbase.falseFunc)
            return next;
        if (func === boolbase.trueFunc)
            return boolbase.falseFunc;
        return function not(elem) {
            return !func(elem) && next(elem);
        };
    },
    has: function (next, subselect, options, _context, compileToken) {
        var adapter = options.adapter;
        var opts = {
            xmlMode: !!options.xmlMode,
            strict: !!options.strict,
            adapter: adapter,
            equals: options.equals,
        };
        // @ts-expect-error Uses an array as a pointer to the current element (side effects)
        var context = subselect.some(containsTraversal)
            ? [exports.PLACEHOLDER_ELEMENT]
            : undefined;
        var compiled = compileToken(subselect, opts, context);
        if (compiled === boolbase.falseFunc)
            return boolbase.falseFunc;
        if (compiled === boolbase.trueFunc) {
            return function (elem) {
                return adapter.getChildren(elem).some(adapter.isTag) && next(elem);
            };
        }
        var hasElement = ensureIsTag(compiled, adapter);
        var _a = compiled.shouldTestNextSiblings, shouldTestNextSiblings = _a === void 0 ? false : _a;
        /*
         * `shouldTestNextSiblings` will only be true if the query starts with
         * a traversal (sibling or adjacent). That means we will always have a context.
         */
        if (context) {
            return function (elem) {
                context[0] = elem;
                var childs = adapter.getChildren(elem);
                var nextElements = shouldTestNextSiblings
                    ? __spreadArrays(childs, getNextSiblings(elem, adapter)) : childs;
                return (next(elem) && adapter.existsOne(hasElement, nextElements));
            };
        }
        return function (elem) {
            return next(elem) &&
                adapter.existsOne(hasElement, adapter.getChildren(elem));
        };
    },
};
});

var pseudoSelectors = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.compilePseudoSelector = exports.pseudos = exports.filters = void 0;
/*
 * Pseudo selectors
 *
 * Pseudo selectors are available in three forms:
 *
 * 1. Filters are called when the selector is compiled and return a function
 *  that has to return either false, or the results of `next()`.
 * 2. Pseudos are called on execution. They have to return a boolean.
 * 3. Subselects work like filters, but have an embedded selector that will be run separately.
 *
 * Filters are great if you want to do some pre-processing, or change the call order
 * of `next()` and your code.
 * Pseudos should be used to implement simple checks.
 */


Object.defineProperty(exports, "filters", { enumerable: true, get: function () { return filters$1.filters; } });

Object.defineProperty(exports, "pseudos", { enumerable: true, get: function () { return pseudos.pseudos; } });

// FIXME This is pretty hacky
var reCSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;
function compilePseudoSelector(next, selector, options, context, compileToken) {
    var name = selector.name, data = selector.data;
    if (options.strict && !reCSS3.test(name)) {
        throw new Error(":" + name + " isn't part of CSS3");
    }
    if (Array.isArray(data)) {
        return subselects.subselects[name](next, data, options, context, compileToken);
    }
    if (name in filters$1.filters) {
        return filters$1.filters[name](next, data, options, context);
    }
    if (name in pseudos.pseudos) {
        var pseudo_1 = pseudos.pseudos[name];
        pseudos.verifyPseudoArgs(pseudo_1, name, data);
        return pseudo_1 === boolbase.falseFunc
            ? boolbase.falseFunc
            : next === boolbase.trueFunc
                ? function (elem) { return pseudo_1(elem, options, data); }
                : function (elem) { return pseudo_1(elem, options, data) && next(elem); };
    }
    throw new Error("unmatched pseudo-class :" + name);
}
exports.compilePseudoSelector = compilePseudoSelector;
});

var general = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileGeneralSelector = void 0;


/*
 * All available rules
 */
function compileGeneralSelector(next, selector, options, context, compileToken) {
    var adapter = options.adapter, equals = options.equals;
    switch (selector.type) {
        case "pseudo-element":
            throw new Error("Pseudo-elements are not supported by css-select");
        case "attribute":
            if (options.strict &&
                (selector.ignoreCase || selector.action === "not")) {
                throw new Error("Unsupported attribute selector");
            }
            return attributes$1.attributeRules[selector.action](next, selector, options);
        case "pseudo":
            return pseudoSelectors.compilePseudoSelector(next, selector, options, context, compileToken);
        // Tags
        case "tag":
            return function tag(elem) {
                return adapter.getName(elem) === selector.name && next(elem);
            };
        // Traversal
        case "descendant":
            if (options.cacheResults === false ||
                typeof WeakSet === "undefined") {
                return function descendant(elem) {
                    var current = elem;
                    while ((current = adapter.getParent(current))) {
                        if (adapter.isTag(current) && next(current)) {
                            return true;
                        }
                    }
                    return false;
                };
            }
            // @ts-expect-error `ElementNode` is not extending object
            // eslint-disable-next-line no-case-declarations
            var isFalseCache_1 = new WeakSet();
            return function cachedDescendant(elem) {
                var current = elem;
                while ((current = adapter.getParent(current))) {
                    if (!isFalseCache_1.has(current)) {
                        if (adapter.isTag(current) && next(current)) {
                            return true;
                        }
                        isFalseCache_1.add(current);
                    }
                }
                return false;
            };
        case "_flexibleDescendant":
            // Include element itself, only used while querying an array
            return function flexibleDescendant(elem) {
                var current = elem;
                do {
                    if (adapter.isTag(current) && next(current))
                        return true;
                } while ((current = adapter.getParent(current)));
                return false;
            };
        case "parent":
            if (options.strict) {
                throw new Error("Parent selector isn't part of CSS3");
            }
            return function parent(elem) {
                return adapter
                    .getChildren(elem)
                    .some(function (elem) { return adapter.isTag(elem) && next(elem); });
            };
        case "child":
            return function child(elem) {
                var parent = adapter.getParent(elem);
                return !!parent && adapter.isTag(parent) && next(parent);
            };
        case "sibling":
            return function sibling(elem) {
                var siblings = adapter.getSiblings(elem);
                for (var i = 0; i < siblings.length; i++) {
                    var currentSibling = siblings[i];
                    if (equals(elem, currentSibling))
                        break;
                    if (adapter.isTag(currentSibling) && next(currentSibling)) {
                        return true;
                    }
                }
                return false;
            };
        case "adjacent":
            return function adjacent(elem) {
                var siblings = adapter.getSiblings(elem);
                var lastElement;
                for (var i = 0; i < siblings.length; i++) {
                    var currentSibling = siblings[i];
                    if (equals(elem, currentSibling))
                        break;
                    if (adapter.isTag(currentSibling)) {
                        lastElement = currentSibling;
                    }
                }
                return !!lastElement && next(lastElement);
            };
        case "universal":
            return next;
    }
}
exports.compileGeneralSelector = compileGeneralSelector;
});

var compile_1$1 = createCommonjsModule(function (module, exports) {
var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileToken = exports.compileUnsafe = exports.compile = void 0;


var sort_1 = __importDefault(sort);



/**
 * Compiles a selector to an executable function.
 *
 * @param selector Selector to compile.
 * @param options Compilation options.
 * @param context Optional context for the selector.
 */
function compile(selector, options, context) {
    var next = compileUnsafe(selector, options, context);
    return subselects.ensureIsTag(next, options.adapter);
}
exports.compile = compile;
function compileUnsafe(selector, options, context) {
    var token = lib$5.parse(selector, options);
    return compileToken(token, options, context);
}
exports.compileUnsafe = compileUnsafe;
function includesScopePseudo(t) {
    return (t.type === "pseudo" &&
        (t.name === "scope" ||
            (Array.isArray(t.data) &&
                t.data.some(function (data) { return data.some(includesScopePseudo); }))));
}
var DESCENDANT_TOKEN = { type: "descendant" };
var FLEXIBLE_DESCENDANT_TOKEN = {
    type: "_flexibleDescendant",
};
var SCOPE_TOKEN = { type: "pseudo", name: "scope", data: null };
/*
 * CSS 4 Spec (Draft): 3.3.1. Absolutizing a Scope-relative Selector
 * http://www.w3.org/TR/selectors4/#absolutizing
 */
function absolutize(token, _a, context) {
    var adapter = _a.adapter;
    // TODO Use better check if the context is a document
    var hasContext = !!(context === null || context === void 0 ? void 0 : context.every(function (e) {
        var parent = adapter.getParent(e);
        return e === subselects.PLACEHOLDER_ELEMENT || !!(parent && adapter.isTag(parent));
    }));
    for (var _i = 0, token_1 = token; _i < token_1.length; _i++) {
        var t = token_1[_i];
        if (t.length > 0 && procedure.isTraversal(t[0]) && t[0].type !== "descendant") ;
        else if (hasContext && !t.some(includesScopePseudo)) {
            t.unshift(DESCENDANT_TOKEN);
        }
        else {
            continue;
        }
        t.unshift(SCOPE_TOKEN);
    }
}
function compileToken(token, options, context) {
    var _a;
    token = token.filter(function (t) { return t.length > 0; });
    token.forEach(sort_1.default);
    context = (_a = options.context) !== null && _a !== void 0 ? _a : context;
    var isArrayContext = Array.isArray(context);
    var finalContext = context && (Array.isArray(context) ? context : [context]);
    absolutize(token, options, finalContext);
    var shouldTestNextSiblings = false;
    var query = token
        .map(function (rules) {
        if (rules.length >= 2) {
            var first = rules[0], second = rules[1];
            if (first.type !== "pseudo" || first.name !== "scope") ;
            else if (isArrayContext && second.type === "descendant") {
                rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
            }
            else if (second.type === "adjacent" ||
                second.type === "sibling") {
                shouldTestNextSiblings = true;
            }
        }
        return compileRules(rules, options, finalContext);
    })
        .reduce(reduceRules, boolbase.falseFunc);
    query.shouldTestNextSiblings = shouldTestNextSiblings;
    return query;
}
exports.compileToken = compileToken;
function compileRules(rules, options, context) {
    var _a;
    return rules.reduce(function (previous, rule) {
        return previous === boolbase.falseFunc
            ? boolbase.falseFunc
            : general.compileGeneralSelector(previous, rule, options, context, compileToken);
    }, (_a = options.rootFunc) !== null && _a !== void 0 ? _a : boolbase.trueFunc);
}
function reduceRules(a, b) {
    if (b === boolbase.falseFunc || a === boolbase.trueFunc) {
        return a;
    }
    if (a === boolbase.falseFunc || b === boolbase.trueFunc) {
        return b;
    }
    return function combine(elem) {
        return a(elem) || b(elem);
    };
}
});

var lib$7 = createCommonjsModule(function (module, exports) {
var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pseudos = exports.filters = exports.is = exports.selectOne = exports.selectAll = exports.prepareContext = exports._compileToken = exports._compileUnsafe = exports.compile = void 0;
var DomUtils = __importStar(lib$4);



var defaultEquals = function (a, b) { return a === b; };
var defaultOptions = {
    adapter: DomUtils,
    equals: defaultEquals,
};
function convertOptionFormats(options) {
    var _a, _b, _c, _d;
    /*
     * We force one format of options to the other one.
     */
    // @ts-expect-error Default options may have incompatible `Node` / `ElementNode`.
    var opts = options !== null && options !== void 0 ? options : defaultOptions;
    // @ts-expect-error Same as above.
    (_a = opts.adapter) !== null && _a !== void 0 ? _a : (opts.adapter = DomUtils);
    // @ts-expect-error `equals` does not exist on `Options`
    (_b = opts.equals) !== null && _b !== void 0 ? _b : (opts.equals = (_d = (_c = opts.adapter) === null || _c === void 0 ? void 0 : _c.equals) !== null && _d !== void 0 ? _d : defaultEquals);
    return opts;
}
function wrapCompile(func) {
    return function addAdapter(selector, options, context) {
        var opts = convertOptionFormats(options);
        return func(selector, opts, context);
    };
}
/**
 * Compiles the query, returns a function.
 */
exports.compile = wrapCompile(compile_1$1.compile);
exports._compileUnsafe = wrapCompile(compile_1$1.compileUnsafe);
exports._compileToken = wrapCompile(compile_1$1.compileToken);
function getSelectorFunc(searchFunc) {
    return function select(query, elements, options) {
        var opts = convertOptionFormats(options);
        if (typeof query !== "function") {
            query = compile_1$1.compileUnsafe(query, opts, elements);
        }
        var filteredElements = prepareContext(elements, opts.adapter, query.shouldTestNextSiblings);
        return searchFunc(query, filteredElements, opts);
    };
}
function prepareContext(elems, adapter, shouldTestNextSiblings) {
    if (shouldTestNextSiblings === void 0) { shouldTestNextSiblings = false; }
    /*
     * Add siblings if the query requires them.
     * See https://github.com/fb55/css-select/pull/43#issuecomment-225414692
     */
    if (shouldTestNextSiblings) {
        elems = appendNextSiblings(elems, adapter);
    }
    return Array.isArray(elems)
        ? adapter.removeSubsets(elems)
        : adapter.getChildren(elems);
}
exports.prepareContext = prepareContext;
function appendNextSiblings(elem, adapter) {
    // Order matters because jQuery seems to check the children before the siblings
    var elems = Array.isArray(elem) ? elem.slice(0) : [elem];
    for (var i = 0; i < elems.length; i++) {
        var nextSiblings = subselects.getNextSiblings(elems[i], adapter);
        elems.push.apply(elems, nextSiblings);
    }
    return elems;
}
/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried..
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns All matching elements.
 *
 */
exports.selectAll = getSelectorFunc(function (query, elems, options) {
    return query === boolbase.falseFunc || !elems || elems.length === 0
        ? []
        : options.adapter.findAll(query, elems);
});
/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried..
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns the first match, or null if there was no match.
 */
exports.selectOne = getSelectorFunc(function (query, elems, options) {
    return query === boolbase.falseFunc || !elems || elems.length === 0
        ? null
        : options.adapter.findOne(query, elems);
});
/**
 * Tests whether or not an element is matched by query.
 *
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elem The element to test if it matches the query.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns
 */
function is(elem, query, options) {
    var opts = convertOptionFormats(options);
    return (typeof query === "function" ? query : compile_1$1.compile(query, opts))(elem);
}
exports.is = is;
/**
 * Alias for selectAll(query, elems, options).
 * @see [compile] for supported selector queries.
 */
exports.default = exports.selectAll;
// Export filters and pseudos to allow users to supply their own.

Object.defineProperty(exports, "filters", { enumerable: true, get: function () { return pseudoSelectors.filters; } });
Object.defineProperty(exports, "pseudos", { enumerable: true, get: function () { return pseudoSelectors.pseudos; } });
});

var cssSelectBaseAdapter = adapterFactory;

function adapterFactory(implementation){
	ensureImplementation(implementation);

	var adapter = {};

	var baseAdapter = {
		removeSubsets: function (nodes){
			return removeSubsets(adapter, nodes);
		},
		existsOne: function(test, elems){
			return existsOne(adapter, test, elems);
		},
		getSiblings: function(elem){
			return getSiblings(adapter, elem);
		},
		hasAttrib: function(elem, name){
			return hasAttrib(adapter, elem, name);
		},
		findOne: function(test, arr){
			return findOne(adapter, test, arr);
		},
		findAll: function(test, elems){
			return findAll(adapter, test, elems)
		}
	};

	Object.assign(adapter, baseAdapter, implementation);

	return adapter;
}

var expectImplemented = [
	"isTag", "getAttributeValue", "getChildren", "getName", "getParent",
	"getText"
];

function ensureImplementation(implementation){
	if(!implementation)	throw new TypeError("Expected implementation")

	var notImplemented = expectImplemented.filter(function(fname){
		return typeof implementation[fname] !== "function";
	});

	if(notImplemented.length){
		var notList = "(" + notImplemented.join(", ") + ")";
		var message = "Expected functions " + notList + " to be implemented";
		throw new Error(message);
	}
}

function removeSubsets(adapter, nodes){
	var idx = nodes.length, node, ancestor, replace;

	// Check if each node (or one of its ancestors) is already contained in the
	// array.
	while(--idx > -1){
		node = ancestor = nodes[idx];

		// Temporarily remove the node under consideration
		nodes[idx] = null;
		replace = true;

		while(ancestor){
			if(nodes.indexOf(ancestor) > -1){
				replace = false;
				nodes.splice(idx, 1);
				break;
			}
			ancestor = adapter.getParent(ancestor);
		}

		// If the node has been found to be unique, re-insert it.
		if(replace){
			nodes[idx] = node;
		}
	}

	return nodes;
}

function existsOne(adapter, test, elems){
	return elems.some(function(elem){
		return adapter.isTag(elem) ?
			test(elem) || adapter.existsOne(test, adapter.getChildren(elem)) :
			false;
	});
}

function getSiblings(adapter, elem){
	var parent = adapter.getParent(elem);
	return parent && adapter.getChildren(parent);
}


function hasAttrib(adapter, elem, name){
	return adapter.getAttributeValue(elem,name) !== undefined
}

function findOne(adapter, test, arr){
	var elem = null;

	for(var i = 0, l = arr.length; i < l && !elem; i++){
		if(test(arr[i])){
			elem = arr[i];
		} else {
			var childs = adapter.getChildren(arr[i]);
			if(childs && childs.length > 0){
				elem = adapter.findOne(test, childs);
			}
		}
	}

	return elem;
}

function findAll(adapter, test, elems){
	var result = [];

	for(var i = 0, j = elems.length; i < j; i++){
		if(!adapter.isTag(elems[i])) continue;
		if(test(elems[i])) result.push(elems[i]);
		var childs = adapter.getChildren(elems[i]);
		if(childs) result = result.concat(adapter.findAll(test, childs));
	}

	return result;
}

/**
 * DOMUtils API for SVGO AST (used by css-select)
 */
var svgoCssSelectAdapterMin = {

    // is the node a tag?
    // isTag: ( node:Node ) => isTag:Boolean
    isTag: function(node) {
        return node.isElem();
    },

    // get the parent of the node
    // getParent: ( node:Node ) => parentNode:Node
    // returns null when no parent exists
    getParent: function(node) {
        return node.parentNode || null;
    },

    // get the node's children
    // getChildren: ( node:Node ) => children:[Node]
    getChildren: function(node) {
        return node.content || [];
    },

    // get the name of the tag
    // getName: ( elem:ElementNode ) => tagName:String
    getName: function(elemAst) {
        return elemAst.elem;
    },

    // get the text content of the node, and its children if it has any
    // getText: ( node:Node ) => text:String
    // returns empty string when there is no text
    getText: function(node) {
        return node.content[0].text || node.content[0].cdata || '';
    },

    // get the attribute value
    // getAttributeValue: ( elem:ElementNode, name:String ) => value:String
    // returns null when attribute doesn't exist
    getAttributeValue: function(elem, name) {
        return elem.hasAttr(name) ? elem.attr(name).value : null;
    }
};

// use base adapter for default implementation
var svgoCssSelectAdapter = cssSelectBaseAdapter(svgoCssSelectAdapterMin);

var cssSelectAdapter = svgoCssSelectAdapter;

var jsAPI = createCommonjsModule(function (module) {

const { selectAll, selectOne, is } = lib$7;


var cssSelectOpts = {
  xmlMode: true,
  adapter: cssSelectAdapter
};

var JSAPI = module.exports = function(data, parentNode) {
    Object.assign(this, data);
    if (parentNode) {
        Object.defineProperty(this, 'parentNode', {
            writable: true,
            value: parentNode
        });
    }
};

/**
 * Perform a deep clone of this node.
 *
 * @return {Object} element
 */
JSAPI.prototype.clone = function() {
    var node = this;
    var nodeData = {};

    Object.keys(node).forEach(function(key) {
        if (key !== 'class' && key !== 'style' && key !== 'content') {
            nodeData[key] = node[key];
        }
    });

    // Deep-clone node data.
    nodeData = JSON.parse(JSON.stringify(nodeData));

    // parentNode gets set to a proper object by the parent clone,
    // but it needs to be true/false now to do the right thing
    // in the constructor.
    var clonedNode = new JSAPI(nodeData, !!node.parentNode);

    if (node.class) {
        clonedNode.class = node.class.clone(clonedNode);
    }
    if (node.style) {
        clonedNode.style = node.style.clone(clonedNode);
    }
    if (node.content) {
        clonedNode.content = node.content.map(function(childNode) {
            var clonedChild = childNode.clone();
            clonedChild.parentNode = clonedNode;
            return clonedChild;
        });
    }

    return clonedNode;
};

/**
 * Determine if item is an element
 * (any, with a specific name or in a names array).
 *
 * @param {String|Array} [param] element name or names arrays
 * @return {Boolean}
 */
JSAPI.prototype.isElem = function(param) {

    if (!param) return !!this.elem;

    if (Array.isArray(param)) return !!this.elem && (param.indexOf(this.elem) > -1);

    return !!this.elem && this.elem === param;

};

/**
 * Renames an element
 *
 * @param {String} name new element name
 * @return {Object} element
 */
JSAPI.prototype.renameElem = function(name) {

    if (name && typeof name === 'string')
        this.elem = this.local = name;

    return this;

};

/**
 * Determine if element is empty.
 *
 * @return {Boolean}
 */
 JSAPI.prototype.isEmpty = function() {

    return !this.content || !this.content.length;

};

/**
 * Find the closest ancestor of the current element.
 * @param elemName
 *
 * @return {?Object}
 */
 JSAPI.prototype.closestElem = function(elemName) {
    var elem = this;

    while ((elem = elem.parentNode) && !elem.isElem(elemName));

    return elem;
};

/**
 * Changes content by removing elements and/or adding new elements.
 *
 * @param {Number} start Index at which to start changing the content.
 * @param {Number} n Number of elements to remove.
 * @param {Array|Object} [insertion] Elements to add to the content.
 * @return {Array} Removed elements.
 */
 JSAPI.prototype.spliceContent = function(start, n, insertion) {

    if (arguments.length < 2) return [];

    if (!Array.isArray(insertion))
        insertion = Array.apply(null, arguments).slice(2);

    insertion.forEach(function(inner) { inner.parentNode = this; }, this);

    return this.content.splice.apply(this.content, [start, n].concat(insertion));


};

/**
 * Determine if element has an attribute
 * (any, or by name or by name + value).
 *
 * @param {String} [name] attribute name
 * @param {String} [val] attribute value (will be toString()'ed)
 * @return {Boolean}
 */
 JSAPI.prototype.hasAttr = function(name, val) {

    if (!this.attrs || !Object.keys(this.attrs).length) return false;

    if (!arguments.length) return !!this.attrs;

    if (val !== undefined) return !!this.attrs[name] && this.attrs[name].value === val.toString();

    return !!this.attrs[name];

};

/**
 * Determine if element has an attribute by local name
 * (any, or by name or by name + value).
 *
 * @param {String} [localName] local attribute name
 * @param {Number|String|RegExp|Function} [val] attribute value (will be toString()'ed or executed, otherwise ignored)
 * @return {Boolean}
 */
 JSAPI.prototype.hasAttrLocal = function(localName, val) {

    if (!this.attrs || !Object.keys(this.attrs).length) return false;

    if (!arguments.length) return !!this.attrs;

    var callback;

    switch (val != null && val.constructor && val.constructor.name) {
        case 'Number':   // same as String
        case 'String':   callback = stringValueTest; break;
        case 'RegExp':   callback = regexpValueTest; break;
        case 'Function': callback = funcValueTest; break;
        default:         callback = nameTest;
    }
    return this.someAttr(callback);

    function nameTest(attr) {
        return attr.local === localName;
    }

    function stringValueTest(attr) {
        return attr.local === localName && val == attr.value;
    }

    function regexpValueTest(attr) {
        return attr.local === localName && val.test(attr.value);
    }

    function funcValueTest(attr) {
        return attr.local === localName && val(attr.value);
    }

};

/**
 * Get a specific attribute from an element
 * (by name or name + value).
 *
 * @param {String} name attribute name
 * @param {String} [val] attribute value (will be toString()'ed)
 * @return {Object|Undefined}
 */
 JSAPI.prototype.attr = function(name, val) {

    if (!this.hasAttr() || !arguments.length) return undefined;

    if (val !== undefined) return this.hasAttr(name, val) ? this.attrs[name] : undefined;

    return this.attrs[name];

};

/**
 * Get computed attribute value from an element
 *
 * @param {String} name attribute name
 * @return {Object|Undefined}
 */
 JSAPI.prototype.computedAttr = function(name, val) {
    if (!arguments.length) return;

    for (var elem = this; elem && (!elem.hasAttr(name) || !elem.attr(name).value); elem = elem.parentNode);

    if (val != null) {
        return elem ? elem.hasAttr(name, val) : false;
    } else if (elem && elem.hasAttr(name)) {
        return elem.attrs[name].value;
    }

};

/**
 * Remove a specific attribute.
 *
 * @param {String|Array} name attribute name
 * @param {String} [val] attribute value
 * @return {Boolean}
 */
 JSAPI.prototype.removeAttr = function(name, val, recursive) {

    if (!arguments.length) return false;

    if (Array.isArray(name)) {
        name.forEach(this.removeAttr, this);
        return false;
    }

    if (!this.hasAttr(name)) return false;

    if (!recursive && val && this.attrs[name].value !== val) return false;

    delete this.attrs[name];

    if (!Object.keys(this.attrs).length) delete this.attrs;

    return true;

};

/**
 * Add attribute.
 *
 * @param {Object} [attr={}] attribute object
 * @return {Object|Boolean} created attribute or false if no attr was passed in
 */
 JSAPI.prototype.addAttr = function(attr) {
    attr = attr || {};

    if (attr.name === undefined ||
        attr.prefix === undefined ||
        attr.local === undefined
    ) return false;

    this.attrs = this.attrs || {};
    this.attrs[attr.name] = attr;

    if(attr.name === 'class') { // newly added class attribute
        this.class.hasClass();
    }

    if(attr.name === 'style') { // newly added style attribute
        this.style.hasStyle();
    }

    return this.attrs[attr.name];

};

/**
 * Iterates over all attributes.
 *
 * @param {Function} callback callback
 * @param {Object} [context] callback context
 * @return {Boolean} false if there are no any attributes
 */
 JSAPI.prototype.eachAttr = function(callback, context) {

    if (!this.hasAttr()) return false;

    for (var name in this.attrs) {
        callback.call(context, this.attrs[name]);
    }

    return true;

};

/**
 * Tests whether some attribute passes the test.
 *
 * @param {Function} callback callback
 * @param {Object} [context] callback context
 * @return {Boolean} false if there are no any attributes
 */
 JSAPI.prototype.someAttr = function(callback, context) {

    if (!this.hasAttr()) return false;

    for (var name in this.attrs) {
        if (callback.call(context, this.attrs[name])) return true;
    }

    return false;

};

/**
 * Evaluate a string of CSS selectors against the element and returns matched elements.
 *
 * @param {String} selectors CSS selector(s) string
 * @return {Array} null if no elements matched
 */
 JSAPI.prototype.querySelectorAll = function(selectors) {

   var matchedEls = selectAll(selectors, this, cssSelectOpts);

   return matchedEls.length > 0 ? matchedEls : null;

};

/**
 * Evaluate a string of CSS selectors against the element and returns only the first matched element.
 *
 * @param {String} selectors CSS selector(s) string
 * @return {Array} null if no element matched
 */
 JSAPI.prototype.querySelector = function(selectors) {

   return selectOne(selectors, this, cssSelectOpts);

};

/**
 * Test if a selector matches a given element.
 *
 * @param {String} selector CSS selector string
 * @return {Boolean} true if element would be selected by selector string, false if it does not
 */
 JSAPI.prototype.matches = function(selector) {

   return is(this, selector, cssSelectOpts);

};
});

var type$y = 'perItem';

var active$y = false;

var description$z = 'removes elements that are drawn outside of the viewbox (disabled by default)';



var intersects$1 = _path.intersects,
	path2js$2    = _path.path2js,
	viewBox,
	viewBoxJS;

/**
 * Remove elements that are drawn outside of the viewbox.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author JoshyPHP
 */
var fn$y = function(item) {

	if (item.isElem('path') && item.hasAttr('d') && typeof viewBox !== 'undefined')
	{
		// Consider that any item with a transform attribute or a M instruction
		// within the viewBox is visible
		if (hasTransform(item) || pathMovesWithinViewBox(item.attr('d').value))
		{
			return true;
		}

		var pathJS = path2js$2(item);
		if (pathJS.length === 2)
		{
			// Use a closed clone of the path if it's too short for intersects()
			pathJS = JSON.parse(JSON.stringify(pathJS));
			pathJS.push({ instruction: 'z' });
		}

		return intersects$1(viewBoxJS, pathJS);
	}
	if (item.isElem('svg'))
	{
		parseViewBox(item);
	}

	return true;
};

/**
 * Test whether given item or any of its ancestors has a transform attribute.
 *
 * @param {String} path
 * @return {Boolean}
 */
function hasTransform(item)
{
	return item.hasAttr('transform') || (item.parentNode && hasTransform(item.parentNode));
}

/**
 * Parse the viewBox coordinates and compute the JS representation of its path.
 *
 * @param {Object} svg svg element item
 */
function parseViewBox(svg)
{
	var viewBoxData = '';
	if (svg.hasAttr('viewBox'))
	{
		// Remove commas and plus signs, normalize and trim whitespace
		viewBoxData = svg.attr('viewBox').value;
	}
	else if (svg.hasAttr('height') && svg.hasAttr('width'))
	{
		viewBoxData = '0 0 ' + svg.attr('width').value + ' ' + svg.attr('height').value;
	}

	// Remove commas and plus signs, normalize and trim whitespace
	viewBoxData = viewBoxData.replace(/[,+]|px/g, ' ').replace(/\s+/g, ' ').replace(/^\s*|\s*$/g, '');

	// Ensure that the dimensions are 4 values separated by space
	var m = /^(-?\d*\.?\d+) (-?\d*\.?\d+) (\d*\.?\d+) (\d*\.?\d+)$/.exec(viewBoxData);
	if (!m)
	{
		return;
	}

	// Store the viewBox boundaries
	viewBox = {
		left:   parseFloat(m[1]),
		top:    parseFloat(m[2]),
		right:  parseFloat(m[1]) + parseFloat(m[3]),
		bottom: parseFloat(m[2]) + parseFloat(m[4])
	};

	var path = new jsAPI({
		elem:   'path',
		prefix: '',
		local:  'path'
	});
	path.addAttr({
		name:   'd',
		prefix: '',
		local:  'd',
		value:  'M' + m[1] + ' ' + m[2] + 'h' + m[3] + 'v' + m[4] + 'H' + m[1] + 'z'
	});

	viewBoxJS = path2js$2(path);
}

/**
 * Test whether given path has a M instruction with coordinates within the viewBox.
 *
 * @param {String} path
 * @return {Boolean}
 */
function pathMovesWithinViewBox(path)
{
	var regexp = /M\s*(-?\d*\.?\d+)(?!\d)\s*(-?\d*\.?\d+)/g, m;
	while (null !== (m = regexp.exec(path)))
	{
		if (m[1] >= viewBox.left && m[1] <= viewBox.right && m[2] >= viewBox.top && m[2] <= viewBox.bottom)
		{
			return true;
		}
	}

	return false;
}

var removeOffCanvasPaths = {
	type: type$y,
	active: active$y,
	description: description$z,
	fn: fn$y
};

var type$z = 'perItem';

var active$z = false;

var description$A = 'removes raster images (disabled by default)';

/**
 * Remove raster images references in <image>.
 *
 * @see https://bugs.webkit.org/show_bug.cgi?id=63548
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$z = function(item) {

    if (
        item.isElem('image') &&
        item.hasAttrLocal('href', /(\.|image\/)(jpg|png|gif)/)
    ) {
        return false;
    }

};

var removeRasterImages = {
	type: type$z,
	active: active$z,
	description: description$A,
	fn: fn$z
};

var type$A = 'perItem';

var active$A = false;

var description$B = 'removes <script> elements (disabled by default)';

/**
 * Remove <script>.
 *
 * https://www.w3.org/TR/SVG/script.html
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Patrick Klingemann
 */
var fn$A = function(item) {

    return !item.isElem('script');

};

var removeScriptElement = {
	type: type$A,
	active: active$A,
	description: description$B,
	fn: fn$A
};

var type$B = 'perItem';

var active$B = false;

var description$C = 'removes <style> element (disabled by default)';

/**
 * Remove <style>.
 *
 * http://www.w3.org/TR/SVG/styling.html#StyleElement
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Betsy Dupuis
 */
var fn$B = function(item) {

    return !item.isElem('style');

};

var removeStyleElement = {
	type: type$B,
	active: active$B,
	description: description$C,
	fn: fn$B
};

var type$C = 'perItem';

var active$C = true;

var description$D = 'removes <title>';

/**
 * Remove <title>.
 *
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Igor Kalashnikov
 */
var fn$C = function(item) {

    return !item.isElem('title');

};

var removeTitle = {
	type: type$C,
	active: active$C,
	description: description$D,
	fn: fn$C
};

var type$D = 'perItem';

var active$D = true;

var description$E = 'removes unknown elements content and attributes, removes attrs with default values';

var params$j = {
    unknownContent: true,
    unknownAttrs: true,
    defaultAttrs: true,
    uselessOverrides: true,
    keepDataAttrs: true,
    keepAriaAttrs: true,
    keepRoleAttr: false
};

var elems$1 = _collections.elems,
    attrsGroups$2 = _collections.attrsGroups,
    elemsGroups$1 = _collections.elemsGroups,
    attrsGroupsDefaults$1 = _collections.attrsGroupsDefaults,
    attrsInheritable$1 = _collections.inheritableAttrs,
    applyGroups$1 = _collections.presentationNonInheritableGroupAttrs;

// collect and extend all references
for (var elem in elems$1) {
    elem = elems$1[elem];

    if (elem.attrsGroups) {
        elem.attrs = elem.attrs || [];

        elem.attrsGroups.forEach(function(attrsGroupName) {
            elem.attrs = elem.attrs.concat(attrsGroups$2[attrsGroupName]);

            var groupDefaults = attrsGroupsDefaults$1[attrsGroupName];

            if (groupDefaults) {
                elem.defaults = elem.defaults || {};

                for (var attrName in groupDefaults) {
                    elem.defaults[attrName] = groupDefaults[attrName];
                }
            }
        });

    }

    if (elem.contentGroups) {
        elem.content = elem.content || [];

        elem.contentGroups.forEach(function(contentGroupName) {
            elem.content = elem.content.concat(elemsGroups$1[contentGroupName]);
        });
    }
}

/**
 * Remove unknown elements content and attributes,
 * remove attributes with default values.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$D = function(item, params) {

    // elems w/o namespace prefix
    if (item.isElem() && !item.prefix) {

        var elem = item.elem;

        // remove unknown element's content
        if (
            params.unknownContent &&
            !item.isEmpty() &&
            elems$1[elem] && // make sure we know of this element before checking its children
            elem !== 'foreignObject' // Don't check foreignObject
        ) {
            item.content.forEach(function(content, i) {
                if (
                    content.isElem() &&
                    !content.prefix &&
                    (
                        (
                            elems$1[elem].content && // Do we have a record of its permitted content?
                            elems$1[elem].content.indexOf(content.elem) === -1
                        ) ||
                        (
                            !elems$1[elem].content && // we dont know about its permitted content
                            !elems$1[content.elem] // check that we know about the element at all
                        )
                    )
                ) {
                    item.content.splice(i, 1);
                }
            });
        }

        // remove element's unknown attrs and attrs with default values
        if (elems$1[elem] && elems$1[elem].attrs) {

            item.eachAttr(function(attr) {

                if (
                    attr.name !== 'xmlns' &&
                    (attr.prefix === 'xml' || !attr.prefix) &&
                    (!params.keepDataAttrs || attr.name.indexOf('data-') != 0) &&
                    (!params.keepAriaAttrs || attr.name.indexOf('aria-') != 0) &&
                    (!params.keepRoleAttr || attr.name != 'role')
                ) {
                    if (
                        // unknown attrs
                        (
                            params.unknownAttrs &&
                            elems$1[elem].attrs.indexOf(attr.name) === -1
                        ) ||
                        // attrs with default values
                        (
                            params.defaultAttrs &&
                            !item.hasAttr('id') &&
                            elems$1[elem].defaults &&
                            elems$1[elem].defaults[attr.name] === attr.value && (
                                attrsInheritable$1.indexOf(attr.name) < 0 ||
                                !item.parentNode.computedAttr(attr.name)
                            )
                        ) ||
                        // useless overrides
                        (
                            params.uselessOverrides &&
                            !item.hasAttr('id') &&
                            applyGroups$1.indexOf(attr.name) < 0 &&
                            attrsInheritable$1.indexOf(attr.name) > -1 &&
                            item.parentNode.computedAttr(attr.name, attr.value)
                        )
                    ) {
                        item.removeAttr(attr.name);
                    }
                }

            });

        }

    }

};

var removeUnknownsAndDefaults = {
	type: type$D,
	active: active$D,
	description: description$E,
	params: params$j,
	fn: fn$D
};

var type$E = 'full';

var active$E = true;

var description$F = 'removes unused namespaces declaration';

/**
 * Remove unused namespaces declaration.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$E = function(data) {

    var svgElem,
        xmlnsCollection = [];

    /**
     * Remove namespace from collection.
     *
     * @param {String} ns namescape name
     */
    function removeNSfromCollection(ns) {

        var pos = xmlnsCollection.indexOf(ns);

        // if found - remove ns from the namespaces collection
        if (pos > -1) {
            xmlnsCollection.splice(pos, 1);
        }

    }

    /**
     * Bananas!
     *
     * @param {Array} items input items
     *
     * @return {Array} output items
     */
    function monkeys(items) {

        var i = 0,
            length = items.content.length;

        while(i < length) {

            var item = items.content[i];

            if (item.isElem('svg')) {

                item.eachAttr(function(attr) {
                    // collect namespaces
                    if (attr.prefix === 'xmlns' && attr.local) {
                        xmlnsCollection.push(attr.local);
                    }
                });

                // if svg element has ns-attr
                if (xmlnsCollection.length) {
                    // save svg element
                    svgElem = item;
                }

            }

            if (xmlnsCollection.length) {

                // check item for the ns-attrs
                if (item.prefix) {
                    removeNSfromCollection(item.prefix);
                }

                // check each attr for the ns-attrs
                item.eachAttr(function(attr) {
                    removeNSfromCollection(attr.prefix);
                });

            }

            // if nothing is found - go deeper
            if (xmlnsCollection.length && item.content) {
                monkeys(item);
            }

            i++;

        }

        return items;

    }

    data = monkeys(data);

    // remove svg element ns-attributes if they are not used even once
    if (xmlnsCollection.length) {
        xmlnsCollection.forEach(function(name) {
            svgElem.removeAttr('xmlns:' + name);
        });
    }

    return data;

};

var removeUnusedNS = {
	type: type$E,
	active: active$E,
	description: description$F,
	fn: fn$E
};

var type$F = 'perItem';

var active$F = true;

var description$G = 'removes elements in <defs> without id';

var nonRendering = _collections.elemsGroups.nonRendering;

/**
 * Removes content of defs and properties that aren't rendered directly without ids.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Lev Solntsev
 */
var fn$F = function(item) {

    if (item.isElem('defs')) {

        if (item.content) {
            item.content = getUsefulItems(item, []);
        }
        
        if (item.isEmpty()) return false;

    } else if (item.isElem(nonRendering) && !item.hasAttr('id')) {

        return false;

    }

};

function getUsefulItems(item, usefulItems) {

    item.content.forEach(function(child) {
        if (child.hasAttr('id') || child.isElem('style')) {

            usefulItems.push(child);
            child.parentNode = item;

        } else if (!child.isEmpty()) {

            child.content = getUsefulItems(child, usefulItems);

        }
    });

    return usefulItems;
}

var removeUselessDefs = {
	type: type$F,
	active: active$F,
	description: description$G,
	fn: fn$F
};

var type$G = 'perItem';

var active$G = true;

var description$H = 'removes useless stroke and fill attributes';

var params$k = {
    stroke: true,
    fill: true,
    removeNone: false,
    hasStyleOrScript: false
};

var shape = _collections.elemsGroups.shape,
    regStrokeProps = /^stroke/,
    regFillProps = /^fill-/,
    styleOrScript$1 = ['style', 'script'];

/**
 * Remove useless stroke and fill attrs.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$G = function(item, params) {
    
    if (item.isElem(styleOrScript$1)) {
        params.hasStyleOrScript = true;
    }

    if (!params.hasStyleOrScript && item.isElem(shape) && !item.computedAttr('id')) {

        var stroke = params.stroke && item.computedAttr('stroke'),
            fill = params.fill && !item.computedAttr('fill', 'none');

        // remove stroke*
        if (
            params.stroke &&
            (!stroke ||
                stroke == 'none' ||
                item.computedAttr('stroke-opacity', '0') ||
                item.computedAttr('stroke-width', '0')
            )
        ) {
            var parentStroke = item.parentNode.computedAttr('stroke'),
                declineStroke = parentStroke && parentStroke != 'none';

            item.eachAttr(function(attr) {
                if (regStrokeProps.test(attr.name)) {
                    item.removeAttr(attr.name);
                }
            });

            if (declineStroke) item.addAttr({
                name: 'stroke',
                value: 'none',
                prefix: '',
                local: 'stroke'
            });
        }

        // remove fill*
        if (
            params.fill &&
            (!fill || item.computedAttr('fill-opacity', '0'))
        ) {
            item.eachAttr(function(attr) {
                if (regFillProps.test(attr.name)) {
                    item.removeAttr(attr.name);
                }
            });

            if (fill) {
                if (item.hasAttr('fill'))
                    item.attr('fill').value = 'none';
                else
                    item.addAttr({
                        name: 'fill',
                        value: 'none',
                        prefix: '',
                        local: 'fill'
                    });
            }
        }

        if (params.removeNone && 
            (!stroke || item.hasAttr('stroke') && item.attr('stroke').value=='none') &&
            (!fill || item.hasAttr('fill') && item.attr('fill').value=='none')) {

            return false;
        }

    }

};

var removeUselessStrokeAndFill = {
	type: type$G,
	active: active$G,
	description: description$H,
	params: params$k,
	fn: fn$G
};

var type$H = 'perItem';

var active$H = true;

var description$I = 'removes viewBox attribute when possible';

var viewBoxElems = ['svg', 'pattern', 'symbol'];

/**
 * Remove viewBox attr which coincides with a width/height box.
 *
 * @see http://www.w3.org/TR/SVG/coords.html#ViewBoxAttribute
 *
 * @example
 * <svg width="100" height="50" viewBox="0 0 100 50">
 *             ⬇
 * <svg width="100" height="50">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$H = function(item) {

    if (
        item.isElem(viewBoxElems) &&
        item.hasAttr('viewBox') &&
        item.hasAttr('width') &&
        item.hasAttr('height')
    ) {

        var nums = item.attr('viewBox').value.split(/[ ,]+/g);

        if (
            nums[0] === '0' &&
            nums[1] === '0' &&
            item.attr('width').value.replace(/px$/, '') === nums[2] && // could use parseFloat too
            item.attr('height').value.replace(/px$/, '') === nums[3]
        ) {
            item.removeAttr('viewBox');
        }

    }

};

var removeViewBox = {
	type: type$H,
	active: active$H,
	description: description$I,
	fn: fn$H
};

var type$I = 'perItem';

var active$I = false;

var description$J = 'removes xmlns attribute (for inline svg, disabled by default)';

/**
 * Remove the xmlns attribute when present.
 *
 * @example
 * <svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
 *   ↓
 * <svg viewBox="0 0 100 50">
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if true, xmlns will be filtered out
 *
 * @author Ricardo Tomasi
 */
var fn$I = function(item) {

    if (item.isElem('svg') && item.hasAttr('xmlns')) {
        item.removeAttr('xmlns');
    }

};

var removeXMLNS = {
	type: type$I,
	active: active$I,
	description: description$J,
	fn: fn$I
};

var type$J = 'perItem';

var active$J = true;

var description$K = 'removes XML processing instructions';

/**
 * Remove XML Processing Instruction.
 *
 * @example
 * <?xml version="1.0" encoding="utf-8"?>
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
var fn$J = function(item) {

    return !(item.processinginstruction && item.processinginstruction.name === 'xml');

};

var removeXMLProcInst = {
	type: type$J,
	active: active$J,
	description: description$K,
	fn: fn$J
};

/**
 * @license
 * The MIT License
 *
 * Copyright © 2012–2016 Kir Belevich
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 * Лицензия MIT
 *
 * Copyright © 2012–2016 Кир Белевич
 *
 * Данная лицензия разрешает лицам, получившим копию
 * данного
 * программного обеспечения и сопутствующей
 * документации
 * (в дальнейшем именуемыми «Программное Обеспечение»),
 * безвозмездно
 * использовать Программное Обеспечение без
 * ограничений, включая
 * неограниченное право на использование, копирование,
 * изменение,
 * добавление, публикацию, распространение,
 * сублицензирование
 * и/или продажу копий Программного Обеспечения, также
 * как и лицам,
 * которым предоставляется данное Программное
 * Обеспечение,
 * при соблюдении следующих условий:
 *
 * Указанное выше уведомление об авторском праве и
 * данные условия
 * должны быть включены во все копии или значимые части
 * данного
 * Программного Обеспечения.
 *
 * ДАННОЕ ПРОГРАММНОЕ ОБЕСПЕЧЕНИЕ ПРЕДОСТАВЛЯЕТСЯ «КАК
 * ЕСТЬ»,
 * БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ, ЯВНО ВЫРАЖЕННЫХ ИЛИ
 * ПОДРАЗУМЕВАЕМЫХ,
 * ВКЛЮЧАЯ, НО НЕ ОГРАНИЧИВАЯСЬ ГАРАНТИЯМИ ТОВАРНОЙ
 * ПРИГОДНОСТИ,
 * СООТВЕТСТВИЯ ПО ЕГО КОНКРЕТНОМУ НАЗНАЧЕНИЮ И
 * ОТСУТСТВИЯ НАРУШЕНИЙ
 * ПРАВ. НИ В КАКОМ СЛУЧАЕ АВТОРЫ ИЛИ ПРАВООБЛАДАТЕЛИ НЕ
 * НЕСУТ
 * ОТВЕТСТВЕННОСТИ ПО ИСКАМ О ВОЗМЕЩЕНИИ УЩЕРБА, УБЫТКОВ
 * ИЛИ ДРУГИХ
 * ТРЕБОВАНИЙ ПО ДЕЙСТВУЮЩИМ КОНТРАКТАМ, ДЕЛИКТАМ ИЛИ
 * ИНОМУ,
 * ВОЗНИКШИМ ИЗ, ИМЕЮЩИМ ПРИЧИНОЙ ИЛИ СВЯЗАННЫМ С
 * ПРОГРАММНЫМ
 * ОБЕСПЕЧЕНИЕМ ИЛИ ИСПОЛЬЗОВАНИЕМ ПРОГРАММНОГО
 * ОБЕСПЕЧЕНИЯ
 * ИЛИ ИНЫМИ ДЕЙСТВИЯМИ С ПРОГРАММНЫМ ОБЕСПЕЧЕНИЕМ.
 */



var type$K = 'full';

var active$K = false;

var description$L = 'Finds <path> elements with the same d, fill, and ' +
                      'stroke, and converts them to <use> elements ' +
                      'referencing a single <path> def.';

/**
 * Finds <path> elements with the same d, fill, and stroke, and converts them to
 * <use> elements referencing a single <path> def.
 *
 * @author Jacob Howcroft
 */
var fn$K = function(data) {
  const seen = new Map();
  let count = 0;
  const defs = [];
  traverse(data, item => {
    if (!item.isElem('path') || !item.hasAttr('d')) {
      return;
    }
    const d = item.attr('d').value;
    const fill = (item.hasAttr('fill') && item.attr('fill').value) || '';
    const stroke = (item.hasAttr('stroke') && item.attr('stroke').value) || '';
    const key = d + ';s:' + stroke + ';f:' + fill;
    const hasSeen = seen.get(key);
    if (!hasSeen) {
      seen.set(key, {elem: item, reused: false});
      return;
    }
    if (!hasSeen.reused) {
      hasSeen.reused = true;
      if (!hasSeen.elem.hasAttr('id')) {
        hasSeen.elem.addAttr({name: 'id', local: 'id',
                              prefix: '', value: 'reuse-' + (count++)});
      }
      defs.push(hasSeen.elem);
    }
    convertToUse(item, hasSeen.elem.attr('id').value);
  });
  if (defs.length > 0) {
    const defsTag = new jsAPI({
      elem: 'defs', prefix: '', local: 'defs', content: [], attrs: []}, data);
    data.content[0].spliceContent(0, 0, defsTag);
    for (let def of defs) {
      // Remove class and style before copying to avoid circular refs in
      // JSON.stringify. This is fine because we don't actually want class or
      // style information to be copied.
      const style = def.style;
      const defClass = def.class;
      delete def.style;
      delete def.class;
      const defClone = def.clone();
      def.style = style;
      def.class = defClass;
      defClone.removeAttr('transform');
      defsTag.spliceContent(0, 0, defClone);
      // Convert the original def to a use so the first usage isn't duplicated.
      def = convertToUse(def, defClone.attr('id').value);
      def.removeAttr('id');
    }
  }
  return data;
};

/** */
function convertToUse(item, href) {
  item.renameElem('use');
  item.removeAttr('d');
  item.removeAttr('stroke');
  item.removeAttr('fill');
  item.addAttr({name: 'xlink:href', local: 'xlink:href',
                prefix: 'none', value: '#' + href});
  delete item.pathJS;
  return item;
}

/** */
function traverse(parent, callback) {
  if (parent.isEmpty()) {
    return;
  }
  for (let child of parent.content) {
    callback(child);
    traverse(child, callback);
  }
}

var reusePaths = {
	type: type$K,
	active: active$K,
	description: description$L,
	fn: fn$K
};

var type$L = 'perItem';

var active$L = false;

var description$M = 'sorts element attributes (disabled by default)';

var params$l = {
	order: [
		'id',
		'width', 'height',
		'x', 'x1', 'x2',
		'y', 'y1', 'y2',
		'cx', 'cy', 'r',
		'fill', 'stroke', 'marker',
		'd', 'points'
	]
};

/**
 * Sort element attributes for epic readability.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Nikolay Frantsev
 */
var fn$L = function(item, params) {

	var attrs = [],
		sorted = {},
		orderlen = params.order.length + 1,
		xmlnsOrder = params.xmlnsOrder || 'front';

	if (item.elem) {

		item.eachAttr(function(attr) {
			attrs.push(attr);
		});

		attrs.sort(function(a, b) {
			if (a.prefix != b.prefix) {
				// xmlns attributes implicitly have the prefix xmlns
				if (xmlnsOrder == 'front') {
                    if (a.prefix == 'xmlns')
                        return -1;
                    if (b.prefix == 'xmlns')
                        return 1;
                }
				return a.prefix < b.prefix ? -1 : 1;
			}

			var aindex = orderlen;
			var bindex = orderlen;

			for (var i = 0; i < params.order.length; i++) {
				if (a.name == params.order[i]) {
					aindex = i;
				} else if (a.name.indexOf(params.order[i] + '-') === 0) {
					aindex = i + .5;
				}
				if (b.name == params.order[i]) {
					bindex = i;
				} else if (b.name.indexOf(params.order[i] + '-') === 0) {
					bindex = i + .5;
				}
			}

			if (aindex != bindex) {
				return aindex - bindex;
			}
			return a.name < b.name ? -1 : 1;
		});

		attrs.forEach(function (attr) {
			sorted[attr.name] = attr;
		});

		item.attrs = sorted;

	}

};

var sortAttrs = {
	type: type$L,
	active: active$L,
	description: description$M,
	params: params$l,
	fn: fn$L
};

var type$M = 'perItem';

var active$M = true;

var description$N = 'Sorts children of <defs> to improve compression';

/**
 * Sorts children of defs in order to improve compression.
 * Sorted first by frequency then by element name length then by element name (to ensure grouping).
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author David Leston
 */
var fn$M = function(item) {

    if (item.isElem('defs')) {

        if (item.content) {
            var frequency = item.content.reduce(function (frequency, child) {
                if (child.elem in frequency) {
                    frequency[child.elem]++;
                } else {
                    frequency[child.elem] = 1;
                }
                return frequency;
            }, {});
            item.content.sort(function (a, b) {
                var frequencyComparison = frequency[b.elem] - frequency[a.elem];
                if (frequencyComparison !== 0 ) {
                    return frequencyComparison;
                }
                var lengthComparison = b.elem.length - a.elem.length;
                if (lengthComparison !== 0) {
                    return lengthComparison;
                }
                return a.elem != b.elem ? a.elem > b.elem ? -1 : 1 : 0;
            });
        }

        return true;
    }

};

var sortDefsChildren = {
	type: type$M,
	active: active$M,
	description: description$N,
	fn: fn$M
};

var addAttributesToSVGElement$1 = addAttributesToSVGElement;
var addClassesToSVGElement$1 = addClassesToSVGElement;
var cleanupAttrs$1 = cleanupAttrs;
var cleanupEnableBackground$1 = cleanupEnableBackground;
var cleanupIDs$1 = cleanupIDs;
var cleanupListOfValues$1 = cleanupListOfValues;
var cleanupNumericValues$1 = cleanupNumericValues;
var collapseGroups$1 = collapseGroups;
var convertColors$1 = convertColors;
var convertEllipseToCircle$1 = convertEllipseToCircle;
var convertPathData$1 = convertPathData;
var convertShapeToPath$1 = convertShapeToPath;
var convertStyleToAttrs$1 = convertStyleToAttrs;
var convertTransform$1 = convertTransform_1;
var inlineStyles$1 = inlineStyles;
var mergePaths$1 = mergePaths;
var minifyStyles$1 = minifyStyles;
var moveElemsAttrsToGroup$1 = moveElemsAttrsToGroup;
var moveGroupAttrsToElems$1 = moveGroupAttrsToElems;
var prefixIds$1 = prefixIds;
var removeAttributesBySelector$1 = removeAttributesBySelector;
var removeAttrs$1 = removeAttrs;
var removeComments$1 = removeComments;
var removeDesc$1 = removeDesc;
var removeDimensions$1 = removeDimensions;
var removeDoctype$1 = removeDoctype;
var removeEditorsNSData$1 = removeEditorsNSData;
var removeElementsByAttr$1 = removeElementsByAttr;
var removeEmptyAttrs$1 = removeEmptyAttrs;
var removeEmptyContainers$1 = removeEmptyContainers;
var removeEmptyText$1 = removeEmptyText;
var removeHiddenElems$1 = removeHiddenElems;
var removeMetadata$1 = removeMetadata;
var removeNonInheritableGroupAttrs$1 = removeNonInheritableGroupAttrs;
var removeOffCanvasPaths$1 = removeOffCanvasPaths;
var removeRasterImages$1 = removeRasterImages;
var removeScriptElement$1 = removeScriptElement;
var removeStyleElement$1 = removeStyleElement;
var removeTitle$1 = removeTitle;
var removeUnknownsAndDefaults$1 = removeUnknownsAndDefaults;
var removeUnusedNS$1 = removeUnusedNS;
var removeUselessDefs$1 = removeUselessDefs;
var removeUselessStrokeAndFill$1 = removeUselessStrokeAndFill;
var removeViewBox$1 = removeViewBox;
var removeXMLNS$1 = removeXMLNS;
var removeXMLProcInst$1 = removeXMLProcInst;
var reusePaths$1 = reusePaths;
var sortAttrs$1 = sortAttrs;
var sortDefsChildren$1 = sortDefsChildren;

var plugins = {
	addAttributesToSVGElement: addAttributesToSVGElement$1,
	addClassesToSVGElement: addClassesToSVGElement$1,
	cleanupAttrs: cleanupAttrs$1,
	cleanupEnableBackground: cleanupEnableBackground$1,
	cleanupIDs: cleanupIDs$1,
	cleanupListOfValues: cleanupListOfValues$1,
	cleanupNumericValues: cleanupNumericValues$1,
	collapseGroups: collapseGroups$1,
	convertColors: convertColors$1,
	convertEllipseToCircle: convertEllipseToCircle$1,
	convertPathData: convertPathData$1,
	convertShapeToPath: convertShapeToPath$1,
	convertStyleToAttrs: convertStyleToAttrs$1,
	convertTransform: convertTransform$1,
	inlineStyles: inlineStyles$1,
	mergePaths: mergePaths$1,
	minifyStyles: minifyStyles$1,
	moveElemsAttrsToGroup: moveElemsAttrsToGroup$1,
	moveGroupAttrsToElems: moveGroupAttrsToElems$1,
	prefixIds: prefixIds$1,
	removeAttributesBySelector: removeAttributesBySelector$1,
	removeAttrs: removeAttrs$1,
	removeComments: removeComments$1,
	removeDesc: removeDesc$1,
	removeDimensions: removeDimensions$1,
	removeDoctype: removeDoctype$1,
	removeEditorsNSData: removeEditorsNSData$1,
	removeElementsByAttr: removeElementsByAttr$1,
	removeEmptyAttrs: removeEmptyAttrs$1,
	removeEmptyContainers: removeEmptyContainers$1,
	removeEmptyText: removeEmptyText$1,
	removeHiddenElems: removeHiddenElems$1,
	removeMetadata: removeMetadata$1,
	removeNonInheritableGroupAttrs: removeNonInheritableGroupAttrs$1,
	removeOffCanvasPaths: removeOffCanvasPaths$1,
	removeRasterImages: removeRasterImages$1,
	removeScriptElement: removeScriptElement$1,
	removeStyleElement: removeStyleElement$1,
	removeTitle: removeTitle$1,
	removeUnknownsAndDefaults: removeUnknownsAndDefaults$1,
	removeUnusedNS: removeUnusedNS$1,
	removeUselessDefs: removeUselessDefs$1,
	removeUselessStrokeAndFill: removeUselessStrokeAndFill$1,
	removeViewBox: removeViewBox$1,
	removeXMLNS: removeXMLNS$1,
	removeXMLProcInst: removeXMLProcInst$1,
	reusePaths: reusePaths$1,
	sortAttrs: sortAttrs$1,
	sortDefsChildren: sortDefsChildren$1
};

const pluginsOrder = [
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeMetadata',
  'removeXMLNS',
  'removeEditorsNSData',
  'cleanupAttrs',
  'inlineStyles',
  'minifyStyles',
  'convertStyleToAttrs',
  'cleanupIDs',
  'prefixIds',
  'removeRasterImages',
  'removeUselessDefs',
  'cleanupNumericValues',
  'cleanupListOfValues',
  'convertColors',
  'removeUnknownsAndDefaults',
  'removeNonInheritableGroupAttrs',
  'removeUselessStrokeAndFill',
  'removeViewBox',
  'cleanupEnableBackground',
  'removeHiddenElems',
  'removeEmptyText',
  'convertShapeToPath',
  'convertEllipseToCircle',
  'moveElemsAttrsToGroup',
  'moveGroupAttrsToElems',
  'collapseGroups',
  'convertPathData',
  'convertTransform',
  'removeEmptyAttrs',
  'removeEmptyContainers',
  'mergePaths',
  'removeUnusedNS',
  'sortAttrs',
  'sortDefsChildren',
  'removeTitle',
  'removeDesc',
  'removeDimensions',
  'removeAttrs',
  'removeAttributesBySelector',
  'removeElementsByAttr',
  'addClassesToSVGElement',
  'removeStyleElement',
  'removeScriptElement',
  'addAttributesToSVGElement',
  'removeOffCanvasPaths',
  'reusePaths',
];
const defaultPlugins = pluginsOrder.filter(name => plugins[name].active);
var defaultPlugins_1 = defaultPlugins;

const extendDefaultPlugins = (plugins$1) => {
  const extendedPlugins = pluginsOrder.map(name => ({ name, ...plugins[name] }));
  for (const plugin of plugins$1) {
    const resolvedPlugin = resolvePluginConfig(plugin, {});
    const index = pluginsOrder.indexOf(resolvedPlugin.name);
    if (index === -1) {
      extendedPlugins.push(plugin);
    } else {
      extendedPlugins[index] = plugin;
    }
  }
  return extendedPlugins;
};
var extendDefaultPlugins_1 = extendDefaultPlugins;

const resolvePluginConfig = (plugin, config) => {
  let configParams = {};
  if ('floatPrecision' in config) {
    configParams.floatPrecision = config.floatPrecision;
  }
  if (typeof plugin === 'string') {
    // resolve builtin plugin specified as string
    const pluginConfig = plugins[plugin];
    if (pluginConfig == null) {
      throw Error(`Unknown builtin plugin "${plugin}" specified.`);
    }
    return {
      ...pluginConfig,
      name: plugin,
      active: true,
      params: { ...pluginConfig.params, ...configParams }
    };
  }
  if (typeof plugin === 'object' && plugin != null) {
    if (plugin.name == null) {
      throw Error(`Plugin name should be specified`);
    }
    if (plugin.fn) {
      // resolve custom plugin with implementation
      return {
        active: true,
        ...plugin,
        params: { configParams, ...plugin.params }
      };
    } else {
      // resolve builtin plugin specified as object without implementation
      const pluginConfig = plugins[plugin.name];
      if (pluginConfig == null) {
        throw Error(`Unknown builtin plugin "${plugin.name}" specified.`);
      }
      return {
        ...pluginConfig,
        active: true,
        ...plugin,
        params: { ...pluginConfig.params, ...configParams, ...plugin.params }
      };
    }
  }
  return null;
};
var resolvePluginConfig_1 = resolvePluginConfig;

var config = {
	defaultPlugins: defaultPlugins_1,
	extendDefaultPlugins: extendDefaultPlugins_1,
	resolvePluginConfig: resolvePluginConfig_1
};

function Stream(){}

var stream = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Stream: Stream
});

var string_decoder = null;

var string_decoder$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': string_decoder
});

var require$$0$3 = /*@__PURE__*/getAugmentedNamespace(stream);

var require$$1$2 = /*@__PURE__*/getAugmentedNamespace(string_decoder$1);

var sax = createCommonjsModule(function (module, exports) {
(function (sax) { // wrapper for non-node envs
  sax.parser = function (strict, opt) { return new SAXParser(strict, opt) };
  sax.SAXParser = SAXParser;
  sax.SAXStream = SAXStream;
  sax.createStream = createStream;

  // When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
  // When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
  // since that's the earliest that a buffer overrun could occur.  This way, checks are
  // as rare as required, but as often as necessary to ensure never crossing this bound.
  // Furthermore, buffers are only tested at most once per write(), so passing a very
  // large string into write() might have undesirable effects, but this is manageable by
  // the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
  // edge case, result in creating at most one complete copy of the string passed in.
  // Set to Infinity to have unlimited buffers.
  sax.MAX_BUFFER_LENGTH = 64 * 1024;

  var buffers = [
    'comment', 'sgmlDecl', 'textNode', 'tagName', 'doctype',
    'procInstName', 'procInstBody', 'entity', 'attribName',
    'attribValue', 'cdata', 'script'
  ];

  sax.EVENTS = [
    'text',
    'processinginstruction',
    'sgmldeclaration',
    'doctype',
    'comment',
    'opentagstart',
    'attribute',
    'opentag',
    'closetag',
    'opencdata',
    'cdata',
    'closecdata',
    'error',
    'end',
    'ready',
    'script',
    'opennamespace',
    'closenamespace'
  ];

  function SAXParser (strict, opt) {
    if (!(this instanceof SAXParser)) {
      return new SAXParser(strict, opt)
    }

    var parser = this;
    clearBuffers(parser);
    parser.q = parser.c = '';
    parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
    parser.opt = opt || {};
    parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
    parser.looseCase = parser.opt.lowercase ? 'toLowerCase' : 'toUpperCase';
    parser.tags = [];
    parser.closed = parser.closedRoot = parser.sawRoot = false;
    parser.tag = parser.error = null;
    parser.strict = !!strict;
    parser.noscript = !!(strict || parser.opt.noscript);
    parser.state = S.BEGIN;
    parser.strictEntities = parser.opt.strictEntities;
    parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES);
    parser.attribList = [];

    // namespaces form a prototype chain.
    // it always points at the current tag,
    // which protos to its parent tag.
    if (parser.opt.xmlns) {
      parser.ns = Object.create(rootNS);
    }

    // mostly just for error reporting
    parser.trackPosition = parser.opt.position !== false;
    if (parser.trackPosition) {
      parser.position = parser.line = parser.column = 0;
    }
    emit(parser, 'onready');
  }

  if (!Object.create) {
    Object.create = function (o) {
      function F () {}
      F.prototype = o;
      var newf = new F();
      return newf
    };
  }

  if (!Object.keys) {
    Object.keys = function (o) {
      var a = [];
      for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
      return a
    };
  }

  function checkBufferLength (parser) {
    var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
    var maxActual = 0;
    for (var i = 0, l = buffers.length; i < l; i++) {
      var len = parser[buffers[i]].length;
      if (len > maxAllowed) {
        // Text/cdata nodes can get big, and since they're buffered,
        // we can get here under normal conditions.
        // Avoid issues by emitting the text node now,
        // so at least it won't get any bigger.
        switch (buffers[i]) {
          case 'textNode':
            closeText(parser);
            break

          case 'cdata':
            emitNode(parser, 'oncdata', parser.cdata);
            parser.cdata = '';
            break

          case 'script':
            emitNode(parser, 'onscript', parser.script);
            parser.script = '';
            break

          default:
            error(parser, 'Max buffer length exceeded: ' + buffers[i]);
        }
      }
      maxActual = Math.max(maxActual, len);
    }
    // schedule the next check for the earliest possible buffer overrun.
    var m = sax.MAX_BUFFER_LENGTH - maxActual;
    parser.bufferCheckPosition = m + parser.position;
  }

  function clearBuffers (parser) {
    for (var i = 0, l = buffers.length; i < l; i++) {
      parser[buffers[i]] = '';
    }
  }

  function flushBuffers (parser) {
    closeText(parser);
    if (parser.cdata !== '') {
      emitNode(parser, 'oncdata', parser.cdata);
      parser.cdata = '';
    }
    if (parser.script !== '') {
      emitNode(parser, 'onscript', parser.script);
      parser.script = '';
    }
  }

  SAXParser.prototype = {
    end: function () { end(this); },
    write: write,
    resume: function () { this.error = null; return this },
    close: function () { return this.write(null) },
    flush: function () { flushBuffers(this); }
  };

  var Stream;
  try {
    Stream = require$$0$3.Stream;
  } catch (ex) {
    Stream = function () {};
  }

  var streamWraps = sax.EVENTS.filter(function (ev) {
    return ev !== 'error' && ev !== 'end'
  });

  function createStream (strict, opt) {
    return new SAXStream(strict, opt)
  }

  function SAXStream (strict, opt) {
    if (!(this instanceof SAXStream)) {
      return new SAXStream(strict, opt)
    }

    Stream.apply(this);

    this._parser = new SAXParser(strict, opt);
    this.writable = true;
    this.readable = true;

    var me = this;

    this._parser.onend = function () {
      me.emit('end');
    };

    this._parser.onerror = function (er) {
      me.emit('error', er);

      // if didn't throw, then means error was handled.
      // go ahead and clear error, so we can write again.
      me._parser.error = null;
    };

    this._decoder = null;

    streamWraps.forEach(function (ev) {
      Object.defineProperty(me, 'on' + ev, {
        get: function () {
          return me._parser['on' + ev]
        },
        set: function (h) {
          if (!h) {
            me.removeAllListeners(ev);
            me._parser['on' + ev] = h;
            return h
          }
          me.on(ev, h);
        },
        enumerable: true,
        configurable: false
      });
    });
  }

  SAXStream.prototype = Object.create(Stream.prototype, {
    constructor: {
      value: SAXStream
    }
  });

  SAXStream.prototype.write = function (data) {
    if (typeof Buffer === 'function' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(data)) {
      if (!this._decoder) {
        var SD = require$$1$2.StringDecoder;
        this._decoder = new SD('utf8');
      }
      data = this._decoder.write(data);
    }

    this._parser.write(data.toString());
    this.emit('data', data);
    return true
  };

  SAXStream.prototype.end = function (chunk) {
    if (chunk && chunk.length) {
      this.write(chunk);
    }
    this._parser.end();
    return true
  };

  SAXStream.prototype.on = function (ev, handler) {
    var me = this;
    if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
      me._parser['on' + ev] = function () {
        var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
        args.splice(0, 0, ev);
        me.emit.apply(me, args);
      };
    }

    return Stream.prototype.on.call(me, ev, handler)
  };

  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  var CDATA = '[CDATA[';
  var DOCTYPE = 'DOCTYPE';
  var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
  var XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';
  var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };

  // http://www.w3.org/TR/REC-xml/#NT-NameStartChar
  // This implementation works on strings, a single character at a time
  // as such, it cannot ever support astral-plane characters (10000-EFFFF)
  // without a significant breaking change to either this  parser, or the
  // JavaScript language.  Implementation of an emoji-capable xml parser
  // is left as an exercise for the reader.
  var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;

  var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

  var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
  var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

  function isWhitespace (c) {
    return c === ' ' || c === '\n' || c === '\r' || c === '\t'
  }

  function isQuote (c) {
    return c === '"' || c === '\''
  }

  function isAttribEnd (c) {
    return c === '>' || isWhitespace(c)
  }

  function isMatch (regex, c) {
    return regex.test(c)
  }

  function notMatch (regex, c) {
    return !isMatch(regex, c)
  }

  var S = 0;
  sax.STATE = {
    BEGIN: S++, // leading byte order mark or whitespace
    BEGIN_WHITESPACE: S++, // leading whitespace
    TEXT: S++, // general stuff
    TEXT_ENTITY: S++, // &amp and such.
    OPEN_WAKA: S++, // <
    SGML_DECL: S++, // <!BLARG
    SGML_DECL_QUOTED: S++, // <!BLARG foo "bar
    DOCTYPE: S++, // <!DOCTYPE
    DOCTYPE_QUOTED: S++, // <!DOCTYPE "//blah
    DOCTYPE_DTD: S++, // <!DOCTYPE "//blah" [ ...
    DOCTYPE_DTD_QUOTED: S++, // <!DOCTYPE "//blah" [ "foo
    COMMENT_STARTING: S++, // <!-
    COMMENT: S++, // <!--
    COMMENT_ENDING: S++, // <!-- blah -
    COMMENT_ENDED: S++, // <!-- blah --
    CDATA: S++, // <![CDATA[ something
    CDATA_ENDING: S++, // ]
    CDATA_ENDING_2: S++, // ]]
    PROC_INST: S++, // <?hi
    PROC_INST_BODY: S++, // <?hi there
    PROC_INST_ENDING: S++, // <?hi "there" ?
    OPEN_TAG: S++, // <strong
    OPEN_TAG_SLASH: S++, // <strong /
    ATTRIB: S++, // <a
    ATTRIB_NAME: S++, // <a foo
    ATTRIB_NAME_SAW_WHITE: S++, // <a foo _
    ATTRIB_VALUE: S++, // <a foo=
    ATTRIB_VALUE_QUOTED: S++, // <a foo="bar
    ATTRIB_VALUE_CLOSED: S++, // <a foo="bar"
    ATTRIB_VALUE_UNQUOTED: S++, // <a foo=bar
    ATTRIB_VALUE_ENTITY_Q: S++, // <foo bar="&quot;"
    ATTRIB_VALUE_ENTITY_U: S++, // <foo bar=&quot
    CLOSE_TAG: S++, // </a
    CLOSE_TAG_SAW_WHITE: S++, // </a   >
    SCRIPT: S++, // <script> ...
    SCRIPT_ENDING: S++ // <script> ... <
  };

  sax.XML_ENTITIES = {
    'amp': '&',
    'gt': '>',
    'lt': '<',
    'quot': '"',
    'apos': "'"
  };

  sax.ENTITIES = {
    'amp': '&',
    'gt': '>',
    'lt': '<',
    'quot': '"',
    'apos': "'",
    'AElig': 198,
    'Aacute': 193,
    'Acirc': 194,
    'Agrave': 192,
    'Aring': 197,
    'Atilde': 195,
    'Auml': 196,
    'Ccedil': 199,
    'ETH': 208,
    'Eacute': 201,
    'Ecirc': 202,
    'Egrave': 200,
    'Euml': 203,
    'Iacute': 205,
    'Icirc': 206,
    'Igrave': 204,
    'Iuml': 207,
    'Ntilde': 209,
    'Oacute': 211,
    'Ocirc': 212,
    'Ograve': 210,
    'Oslash': 216,
    'Otilde': 213,
    'Ouml': 214,
    'THORN': 222,
    'Uacute': 218,
    'Ucirc': 219,
    'Ugrave': 217,
    'Uuml': 220,
    'Yacute': 221,
    'aacute': 225,
    'acirc': 226,
    'aelig': 230,
    'agrave': 224,
    'aring': 229,
    'atilde': 227,
    'auml': 228,
    'ccedil': 231,
    'eacute': 233,
    'ecirc': 234,
    'egrave': 232,
    'eth': 240,
    'euml': 235,
    'iacute': 237,
    'icirc': 238,
    'igrave': 236,
    'iuml': 239,
    'ntilde': 241,
    'oacute': 243,
    'ocirc': 244,
    'ograve': 242,
    'oslash': 248,
    'otilde': 245,
    'ouml': 246,
    'szlig': 223,
    'thorn': 254,
    'uacute': 250,
    'ucirc': 251,
    'ugrave': 249,
    'uuml': 252,
    'yacute': 253,
    'yuml': 255,
    'copy': 169,
    'reg': 174,
    'nbsp': 160,
    'iexcl': 161,
    'cent': 162,
    'pound': 163,
    'curren': 164,
    'yen': 165,
    'brvbar': 166,
    'sect': 167,
    'uml': 168,
    'ordf': 170,
    'laquo': 171,
    'not': 172,
    'shy': 173,
    'macr': 175,
    'deg': 176,
    'plusmn': 177,
    'sup1': 185,
    'sup2': 178,
    'sup3': 179,
    'acute': 180,
    'micro': 181,
    'para': 182,
    'middot': 183,
    'cedil': 184,
    'ordm': 186,
    'raquo': 187,
    'frac14': 188,
    'frac12': 189,
    'frac34': 190,
    'iquest': 191,
    'times': 215,
    'divide': 247,
    'OElig': 338,
    'oelig': 339,
    'Scaron': 352,
    'scaron': 353,
    'Yuml': 376,
    'fnof': 402,
    'circ': 710,
    'tilde': 732,
    'Alpha': 913,
    'Beta': 914,
    'Gamma': 915,
    'Delta': 916,
    'Epsilon': 917,
    'Zeta': 918,
    'Eta': 919,
    'Theta': 920,
    'Iota': 921,
    'Kappa': 922,
    'Lambda': 923,
    'Mu': 924,
    'Nu': 925,
    'Xi': 926,
    'Omicron': 927,
    'Pi': 928,
    'Rho': 929,
    'Sigma': 931,
    'Tau': 932,
    'Upsilon': 933,
    'Phi': 934,
    'Chi': 935,
    'Psi': 936,
    'Omega': 937,
    'alpha': 945,
    'beta': 946,
    'gamma': 947,
    'delta': 948,
    'epsilon': 949,
    'zeta': 950,
    'eta': 951,
    'theta': 952,
    'iota': 953,
    'kappa': 954,
    'lambda': 955,
    'mu': 956,
    'nu': 957,
    'xi': 958,
    'omicron': 959,
    'pi': 960,
    'rho': 961,
    'sigmaf': 962,
    'sigma': 963,
    'tau': 964,
    'upsilon': 965,
    'phi': 966,
    'chi': 967,
    'psi': 968,
    'omega': 969,
    'thetasym': 977,
    'upsih': 978,
    'piv': 982,
    'ensp': 8194,
    'emsp': 8195,
    'thinsp': 8201,
    'zwnj': 8204,
    'zwj': 8205,
    'lrm': 8206,
    'rlm': 8207,
    'ndash': 8211,
    'mdash': 8212,
    'lsquo': 8216,
    'rsquo': 8217,
    'sbquo': 8218,
    'ldquo': 8220,
    'rdquo': 8221,
    'bdquo': 8222,
    'dagger': 8224,
    'Dagger': 8225,
    'bull': 8226,
    'hellip': 8230,
    'permil': 8240,
    'prime': 8242,
    'Prime': 8243,
    'lsaquo': 8249,
    'rsaquo': 8250,
    'oline': 8254,
    'frasl': 8260,
    'euro': 8364,
    'image': 8465,
    'weierp': 8472,
    'real': 8476,
    'trade': 8482,
    'alefsym': 8501,
    'larr': 8592,
    'uarr': 8593,
    'rarr': 8594,
    'darr': 8595,
    'harr': 8596,
    'crarr': 8629,
    'lArr': 8656,
    'uArr': 8657,
    'rArr': 8658,
    'dArr': 8659,
    'hArr': 8660,
    'forall': 8704,
    'part': 8706,
    'exist': 8707,
    'empty': 8709,
    'nabla': 8711,
    'isin': 8712,
    'notin': 8713,
    'ni': 8715,
    'prod': 8719,
    'sum': 8721,
    'minus': 8722,
    'lowast': 8727,
    'radic': 8730,
    'prop': 8733,
    'infin': 8734,
    'ang': 8736,
    'and': 8743,
    'or': 8744,
    'cap': 8745,
    'cup': 8746,
    'int': 8747,
    'there4': 8756,
    'sim': 8764,
    'cong': 8773,
    'asymp': 8776,
    'ne': 8800,
    'equiv': 8801,
    'le': 8804,
    'ge': 8805,
    'sub': 8834,
    'sup': 8835,
    'nsub': 8836,
    'sube': 8838,
    'supe': 8839,
    'oplus': 8853,
    'otimes': 8855,
    'perp': 8869,
    'sdot': 8901,
    'lceil': 8968,
    'rceil': 8969,
    'lfloor': 8970,
    'rfloor': 8971,
    'lang': 9001,
    'rang': 9002,
    'loz': 9674,
    'spades': 9824,
    'clubs': 9827,
    'hearts': 9829,
    'diams': 9830
  };

  Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key];
    var s = typeof e === 'number' ? String.fromCharCode(e) : e;
    sax.ENTITIES[key] = s;
  });

  for (var s in sax.STATE) {
    sax.STATE[sax.STATE[s]] = s;
  }

  // shorthand
  S = sax.STATE;

  function emit (parser, event, data) {
    parser[event] && parser[event](data);
  }

  function emitNode (parser, nodeType, data) {
    if (parser.textNode) closeText(parser);
    emit(parser, nodeType, data);
  }

  function closeText (parser) {
    parser.textNode = textopts(parser.opt, parser.textNode);
    if (parser.textNode) emit(parser, 'ontext', parser.textNode);
    parser.textNode = '';
  }

  function textopts (opt, text) {
    if (opt.trim) text = text.trim();
    if (opt.normalize) text = text.replace(/\s+/g, ' ');
    return text
  }

  function error (parser, er) {
    closeText(parser);
    if (parser.trackPosition) {
      er += '\nLine: ' + parser.line +
        '\nColumn: ' + parser.column +
        '\nChar: ' + parser.c;
    }
    er = new Error(er);
    parser.error = er;
    emit(parser, 'onerror', er);
    return parser
  }

  function end (parser) {
    if (parser.sawRoot && !parser.closedRoot) strictFail(parser, 'Unclosed root tag');
    if ((parser.state !== S.BEGIN) &&
      (parser.state !== S.BEGIN_WHITESPACE) &&
      (parser.state !== S.TEXT)) {
      error(parser, 'Unexpected end');
    }
    closeText(parser);
    parser.c = '';
    parser.closed = true;
    emit(parser, 'onend');
    SAXParser.call(parser, parser.strict, parser.opt);
    return parser
  }

  function strictFail (parser, message) {
    if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
      throw new Error('bad call to strictFail')
    }
    if (parser.strict) {
      error(parser, message);
    }
  }

  function newTag (parser) {
    if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
    var parent = parser.tags[parser.tags.length - 1] || parser;
    var tag = parser.tag = { name: parser.tagName, attributes: {} };

    // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
    if (parser.opt.xmlns) {
      tag.ns = parent.ns;
    }
    parser.attribList.length = 0;
    emitNode(parser, 'onopentagstart', tag);
  }

  function qname (name, attribute) {
    var i = name.indexOf(':');
    var qualName = i < 0 ? [ '', name ] : name.split(':');
    var prefix = qualName[0];
    var local = qualName[1];

    // <x "xmlns"="http://foo">
    if (attribute && name === 'xmlns') {
      prefix = 'xmlns';
      local = '';
    }

    return { prefix: prefix, local: local }
  }

  function attrib (parser) {
    if (!parser.strict) {
      parser.attribName = parser.attribName[parser.looseCase]();
    }

    if (parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
      parser.attribName = parser.attribValue = '';
      return
    }

    if (parser.opt.xmlns) {
      var qn = qname(parser.attribName, true);
      var prefix = qn.prefix;
      var local = qn.local;

      if (prefix === 'xmlns') {
        // namespace binding attribute. push the binding into scope
        if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
          strictFail(parser,
            'xml: prefix must be bound to ' + XML_NAMESPACE + '\n' +
            'Actual: ' + parser.attribValue);
        } else if (local === 'xmlns' && parser.attribValue !== XMLNS_NAMESPACE) {
          strictFail(parser,
            'xmlns: prefix must be bound to ' + XMLNS_NAMESPACE + '\n' +
            'Actual: ' + parser.attribValue);
        } else {
          var tag = parser.tag;
          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (tag.ns === parent.ns) {
            tag.ns = Object.create(parent.ns);
          }
          tag.ns[local] = parser.attribValue;
        }
      }

      // defer onattribute events until all attributes have been seen
      // so any new bindings can take effect. preserve attribute order
      // so deferred events can be emitted in document order
      parser.attribList.push([parser.attribName, parser.attribValue]);
    } else {
      // in non-xmlns mode, we can emit the event right away
      parser.tag.attributes[parser.attribName] = parser.attribValue;
      emitNode(parser, 'onattribute', {
        name: parser.attribName,
        value: parser.attribValue
      });
    }

    parser.attribName = parser.attribValue = '';
  }

  function openTag (parser, selfClosing) {
    if (parser.opt.xmlns) {
      // emit namespace binding events
      var tag = parser.tag;

      // add namespace info to tag
      var qn = qname(parser.tagName);
      tag.prefix = qn.prefix;
      tag.local = qn.local;
      tag.uri = tag.ns[qn.prefix] || '';

      if (tag.prefix && !tag.uri) {
        strictFail(parser, 'Unbound namespace prefix: ' +
          JSON.stringify(parser.tagName));
        tag.uri = qn.prefix;
      }

      var parent = parser.tags[parser.tags.length - 1] || parser;
      if (tag.ns && parent.ns !== tag.ns) {
        Object.keys(tag.ns).forEach(function (p) {
          emitNode(parser, 'onopennamespace', {
            prefix: p,
            uri: tag.ns[p]
          });
        });
      }

      // handle deferred onattribute events
      // Note: do not apply default ns to attributes:
      //   http://www.w3.org/TR/REC-xml-names/#defaulting
      for (var i = 0, l = parser.attribList.length; i < l; i++) {
        var nv = parser.attribList[i];
        var name = nv[0];
        var value = nv[1];
        var qualName = qname(name, true);
        var prefix = qualName.prefix;
        var local = qualName.local;
        var uri = prefix === '' ? '' : (tag.ns[prefix] || '');
        var a = {
          name: name,
          value: value,
          prefix: prefix,
          local: local,
          uri: uri
        };

        // if there's any attributes with an undefined namespace,
        // then fail on them now.
        if (prefix && prefix !== 'xmlns' && !uri) {
          strictFail(parser, 'Unbound namespace prefix: ' +
            JSON.stringify(prefix));
          a.uri = prefix;
        }
        parser.tag.attributes[name] = a;
        emitNode(parser, 'onattribute', a);
      }
      parser.attribList.length = 0;
    }

    parser.tag.isSelfClosing = !!selfClosing;

    // process the tag
    parser.sawRoot = true;
    parser.tags.push(parser.tag);
    emitNode(parser, 'onopentag', parser.tag);
    if (!selfClosing) {
      // special case for <script> in non-strict mode.
      if (!parser.noscript && parser.tagName.toLowerCase() === 'script') {
        parser.state = S.SCRIPT;
      } else {
        parser.state = S.TEXT;
      }
      parser.tag = null;
      parser.tagName = '';
    }
    parser.attribName = parser.attribValue = '';
    parser.attribList.length = 0;
  }

  function closeTag (parser) {
    if (!parser.tagName) {
      strictFail(parser, 'Weird empty close tag.');
      parser.textNode += '</>';
      parser.state = S.TEXT;
      return
    }

    if (parser.script) {
      if (parser.tagName !== 'script') {
        parser.script += '</' + parser.tagName + '>';
        parser.tagName = '';
        parser.state = S.SCRIPT;
        return
      }
      emitNode(parser, 'onscript', parser.script);
      parser.script = '';
    }

    // first make sure that the closing tag actually exists.
    // <a><b></c></b></a> will close everything, otherwise.
    var t = parser.tags.length;
    var tagName = parser.tagName;
    if (!parser.strict) {
      tagName = tagName[parser.looseCase]();
    }
    var closeTo = tagName;
    while (t--) {
      var close = parser.tags[t];
      if (close.name !== closeTo) {
        // fail the first time in strict mode
        strictFail(parser, 'Unexpected close tag');
      } else {
        break
      }
    }

    // didn't find it.  we already failed for strict, so just abort.
    if (t < 0) {
      strictFail(parser, 'Unmatched closing tag: ' + parser.tagName);
      parser.textNode += '</' + parser.tagName + '>';
      parser.state = S.TEXT;
      return
    }
    parser.tagName = tagName;
    var s = parser.tags.length;
    while (s-- > t) {
      var tag = parser.tag = parser.tags.pop();
      parser.tagName = parser.tag.name;
      emitNode(parser, 'onclosetag', parser.tagName);

      var x = {};
      for (var i in tag.ns) {
        x[i] = tag.ns[i];
      }

      var parent = parser.tags[parser.tags.length - 1] || parser;
      if (parser.opt.xmlns && tag.ns !== parent.ns) {
        // remove namespace bindings introduced by tag
        Object.keys(tag.ns).forEach(function (p) {
          var n = tag.ns[p];
          emitNode(parser, 'onclosenamespace', { prefix: p, uri: n });
        });
      }
    }
    if (t === 0) parser.closedRoot = true;
    parser.tagName = parser.attribValue = parser.attribName = '';
    parser.attribList.length = 0;
    parser.state = S.TEXT;
  }

  function parseEntity (parser) {
    var entity = parser.entity;
    var entityLC = entity.toLowerCase();
    var num;
    var numStr = '';

    if (parser.ENTITIES[entity]) {
      return parser.ENTITIES[entity]
    }
    if (parser.ENTITIES[entityLC]) {
      return parser.ENTITIES[entityLC]
    }
    entity = entityLC;
    if (entity.charAt(0) === '#') {
      if (entity.charAt(1) === 'x') {
        entity = entity.slice(2);
        num = parseInt(entity, 16);
        numStr = num.toString(16);
      } else {
        entity = entity.slice(1);
        num = parseInt(entity, 10);
        numStr = num.toString(10);
      }
    }
    entity = entity.replace(/^0+/, '');
    if (isNaN(num) || numStr.toLowerCase() !== entity) {
      strictFail(parser, 'Invalid character entity');
      return '&' + parser.entity + ';'
    }

    return String.fromCodePoint(num)
  }

  function beginWhiteSpace (parser, c) {
    if (c === '<') {
      parser.state = S.OPEN_WAKA;
      parser.startTagPosition = parser.position;
    } else if (!isWhitespace(c)) {
      // have to process this as a text node.
      // weird, but happens.
      strictFail(parser, 'Non-whitespace before first tag.');
      parser.textNode = c;
      parser.state = S.TEXT;
    }
  }

  function charAt (chunk, i) {
    var result = '';
    if (i < chunk.length) {
      result = chunk.charAt(i);
    }
    return result
  }

  function write (chunk) {
    var parser = this;
    if (this.error) {
      throw this.error
    }
    if (parser.closed) {
      return error(parser,
        'Cannot write after close. Assign an onready handler.')
    }
    if (chunk === null) {
      return end(parser)
    }
    if (typeof chunk === 'object') {
      chunk = chunk.toString();
    }
    var i = 0;
    var c = '';
    while (true) {
      c = charAt(chunk, i++);
      parser.c = c;

      if (!c) {
        break
      }

      if (parser.trackPosition) {
        parser.position++;
        if (c === '\n') {
          parser.line++;
          parser.column = 0;
        } else {
          parser.column++;
        }
      }

      switch (parser.state) {
        case S.BEGIN:
          parser.state = S.BEGIN_WHITESPACE;
          if (c === '\uFEFF') {
            continue
          }
          beginWhiteSpace(parser, c);
          continue

        case S.BEGIN_WHITESPACE:
          beginWhiteSpace(parser, c);
          continue

        case S.TEXT:
          if (parser.sawRoot && !parser.closedRoot) {
            var starti = i - 1;
            while (c && c !== '<' && c !== '&') {
              c = charAt(chunk, i++);
              if (c && parser.trackPosition) {
                parser.position++;
                if (c === '\n') {
                  parser.line++;
                  parser.column = 0;
                } else {
                  parser.column++;
                }
              }
            }
            parser.textNode += chunk.substring(starti, i - 1);
          }
          if (c === '<' && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
            parser.state = S.OPEN_WAKA;
            parser.startTagPosition = parser.position;
          } else {
            if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) {
              strictFail(parser, 'Text data outside of root node.');
            }
            if (c === '&') {
              parser.state = S.TEXT_ENTITY;
            } else {
              parser.textNode += c;
            }
          }
          continue

        case S.SCRIPT:
          // only non-strict
          if (c === '<') {
            parser.state = S.SCRIPT_ENDING;
          } else {
            parser.script += c;
          }
          continue

        case S.SCRIPT_ENDING:
          if (c === '/') {
            parser.state = S.CLOSE_TAG;
          } else {
            parser.script += '<' + c;
            parser.state = S.SCRIPT;
          }
          continue

        case S.OPEN_WAKA:
          // either a /, ?, !, or text is coming next.
          if (c === '!') {
            parser.state = S.SGML_DECL;
            parser.sgmlDecl = '';
          } else if (isWhitespace(c)) ; else if (isMatch(nameStart, c)) {
            parser.state = S.OPEN_TAG;
            parser.tagName = c;
          } else if (c === '/') {
            parser.state = S.CLOSE_TAG;
            parser.tagName = '';
          } else if (c === '?') {
            parser.state = S.PROC_INST;
            parser.procInstName = parser.procInstBody = '';
          } else {
            strictFail(parser, 'Unencoded <');
            // if there was some whitespace, then add that in.
            if (parser.startTagPosition + 1 < parser.position) {
              var pad = parser.position - parser.startTagPosition;
              c = new Array(pad).join(' ') + c;
            }
            parser.textNode += '<' + c;
            parser.state = S.TEXT;
          }
          continue

        case S.SGML_DECL:
          if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
            emitNode(parser, 'onopencdata');
            parser.state = S.CDATA;
            parser.sgmlDecl = '';
            parser.cdata = '';
          } else if (parser.sgmlDecl + c === '--') {
            parser.state = S.COMMENT;
            parser.comment = '';
            parser.sgmlDecl = '';
          } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
            parser.state = S.DOCTYPE;
            if (parser.doctype || parser.sawRoot) {
              strictFail(parser,
                'Inappropriately located doctype declaration');
            }
            parser.doctype = '';
            parser.sgmlDecl = '';
          } else if (c === '>') {
            emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl);
            parser.sgmlDecl = '';
            parser.state = S.TEXT;
          } else if (isQuote(c)) {
            parser.state = S.SGML_DECL_QUOTED;
            parser.sgmlDecl += c;
          } else {
            parser.sgmlDecl += c;
          }
          continue

        case S.SGML_DECL_QUOTED:
          if (c === parser.q) {
            parser.state = S.SGML_DECL;
            parser.q = '';
          }
          parser.sgmlDecl += c;
          continue

        case S.DOCTYPE:
          if (c === '>') {
            parser.state = S.TEXT;
            emitNode(parser, 'ondoctype', parser.doctype);
            parser.doctype = true; // just remember that we saw it.
          } else {
            parser.doctype += c;
            if (c === '[') {
              parser.state = S.DOCTYPE_DTD;
            } else if (isQuote(c)) {
              parser.state = S.DOCTYPE_QUOTED;
              parser.q = c;
            }
          }
          continue

        case S.DOCTYPE_QUOTED:
          parser.doctype += c;
          if (c === parser.q) {
            parser.q = '';
            parser.state = S.DOCTYPE;
          }
          continue

        case S.DOCTYPE_DTD:
          parser.doctype += c;
          if (c === ']') {
            parser.state = S.DOCTYPE;
          } else if (isQuote(c)) {
            parser.state = S.DOCTYPE_DTD_QUOTED;
            parser.q = c;
          }
          continue

        case S.DOCTYPE_DTD_QUOTED:
          parser.doctype += c;
          if (c === parser.q) {
            parser.state = S.DOCTYPE_DTD;
            parser.q = '';
          }
          continue

        case S.COMMENT:
          if (c === '-') {
            parser.state = S.COMMENT_ENDING;
          } else {
            parser.comment += c;
          }
          continue

        case S.COMMENT_ENDING:
          if (c === '-') {
            parser.state = S.COMMENT_ENDED;
            parser.comment = textopts(parser.opt, parser.comment);
            if (parser.comment) {
              emitNode(parser, 'oncomment', parser.comment);
            }
            parser.comment = '';
          } else {
            parser.comment += '-' + c;
            parser.state = S.COMMENT;
          }
          continue

        case S.COMMENT_ENDED:
          if (c !== '>') {
            strictFail(parser, 'Malformed comment');
            // allow <!-- blah -- bloo --> in non-strict mode,
            // which is a comment of " blah -- bloo "
            parser.comment += '--' + c;
            parser.state = S.COMMENT;
          } else {
            parser.state = S.TEXT;
          }
          continue

        case S.CDATA:
          if (c === ']') {
            parser.state = S.CDATA_ENDING;
          } else {
            parser.cdata += c;
          }
          continue

        case S.CDATA_ENDING:
          if (c === ']') {
            parser.state = S.CDATA_ENDING_2;
          } else {
            parser.cdata += ']' + c;
            parser.state = S.CDATA;
          }
          continue

        case S.CDATA_ENDING_2:
          if (c === '>') {
            if (parser.cdata) {
              emitNode(parser, 'oncdata', parser.cdata);
            }
            emitNode(parser, 'onclosecdata');
            parser.cdata = '';
            parser.state = S.TEXT;
          } else if (c === ']') {
            parser.cdata += ']';
          } else {
            parser.cdata += ']]' + c;
            parser.state = S.CDATA;
          }
          continue

        case S.PROC_INST:
          if (c === '?') {
            parser.state = S.PROC_INST_ENDING;
          } else if (isWhitespace(c)) {
            parser.state = S.PROC_INST_BODY;
          } else {
            parser.procInstName += c;
          }
          continue

        case S.PROC_INST_BODY:
          if (!parser.procInstBody && isWhitespace(c)) {
            continue
          } else if (c === '?') {
            parser.state = S.PROC_INST_ENDING;
          } else {
            parser.procInstBody += c;
          }
          continue

        case S.PROC_INST_ENDING:
          if (c === '>') {
            emitNode(parser, 'onprocessinginstruction', {
              name: parser.procInstName,
              body: parser.procInstBody
            });
            parser.procInstName = parser.procInstBody = '';
            parser.state = S.TEXT;
          } else {
            parser.procInstBody += '?' + c;
            parser.state = S.PROC_INST_BODY;
          }
          continue

        case S.OPEN_TAG:
          if (isMatch(nameBody, c)) {
            parser.tagName += c;
          } else {
            newTag(parser);
            if (c === '>') {
              openTag(parser);
            } else if (c === '/') {
              parser.state = S.OPEN_TAG_SLASH;
            } else {
              if (!isWhitespace(c)) {
                strictFail(parser, 'Invalid character in tag name');
              }
              parser.state = S.ATTRIB;
            }
          }
          continue

        case S.OPEN_TAG_SLASH:
          if (c === '>') {
            openTag(parser, true);
            closeTag(parser);
          } else {
            strictFail(parser, 'Forward-slash in opening tag not followed by >');
            parser.state = S.ATTRIB;
          }
          continue

        case S.ATTRIB:
          // haven't read the attribute name yet.
          if (isWhitespace(c)) {
            continue
          } else if (c === '>') {
            openTag(parser);
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH;
          } else if (isMatch(nameStart, c)) {
            parser.attribName = c;
            parser.attribValue = '';
            parser.state = S.ATTRIB_NAME;
          } else {
            strictFail(parser, 'Invalid attribute name');
          }
          continue

        case S.ATTRIB_NAME:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE;
          } else if (c === '>') {
            strictFail(parser, 'Attribute without value');
            parser.attribValue = parser.attribName;
            attrib(parser);
            openTag(parser);
          } else if (isWhitespace(c)) {
            parser.state = S.ATTRIB_NAME_SAW_WHITE;
          } else if (isMatch(nameBody, c)) {
            parser.attribName += c;
          } else {
            strictFail(parser, 'Invalid attribute name');
          }
          continue

        case S.ATTRIB_NAME_SAW_WHITE:
          if (c === '=') {
            parser.state = S.ATTRIB_VALUE;
          } else if (isWhitespace(c)) {
            continue
          } else {
            strictFail(parser, 'Attribute without value');
            parser.tag.attributes[parser.attribName] = '';
            parser.attribValue = '';
            emitNode(parser, 'onattribute', {
              name: parser.attribName,
              value: ''
            });
            parser.attribName = '';
            if (c === '>') {
              openTag(parser);
            } else if (isMatch(nameStart, c)) {
              parser.attribName = c;
              parser.state = S.ATTRIB_NAME;
            } else {
              strictFail(parser, 'Invalid attribute name');
              parser.state = S.ATTRIB;
            }
          }
          continue

        case S.ATTRIB_VALUE:
          if (isWhitespace(c)) {
            continue
          } else if (isQuote(c)) {
            parser.q = c;
            parser.state = S.ATTRIB_VALUE_QUOTED;
          } else {
            strictFail(parser, 'Unquoted attribute value');
            parser.state = S.ATTRIB_VALUE_UNQUOTED;
            parser.attribValue = c;
          }
          continue

        case S.ATTRIB_VALUE_QUOTED:
          if (c !== parser.q) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_Q;
            } else {
              parser.attribValue += c;
            }
            continue
          }
          attrib(parser);
          parser.q = '';
          parser.state = S.ATTRIB_VALUE_CLOSED;
          continue

        case S.ATTRIB_VALUE_CLOSED:
          if (isWhitespace(c)) {
            parser.state = S.ATTRIB;
          } else if (c === '>') {
            openTag(parser);
          } else if (c === '/') {
            parser.state = S.OPEN_TAG_SLASH;
          } else if (isMatch(nameStart, c)) {
            strictFail(parser, 'No whitespace between attributes');
            parser.attribName = c;
            parser.attribValue = '';
            parser.state = S.ATTRIB_NAME;
          } else {
            strictFail(parser, 'Invalid attribute name');
          }
          continue

        case S.ATTRIB_VALUE_UNQUOTED:
          if (!isAttribEnd(c)) {
            if (c === '&') {
              parser.state = S.ATTRIB_VALUE_ENTITY_U;
            } else {
              parser.attribValue += c;
            }
            continue
          }
          attrib(parser);
          if (c === '>') {
            openTag(parser);
          } else {
            parser.state = S.ATTRIB;
          }
          continue

        case S.CLOSE_TAG:
          if (!parser.tagName) {
            if (isWhitespace(c)) {
              continue
            } else if (notMatch(nameStart, c)) {
              if (parser.script) {
                parser.script += '</' + c;
                parser.state = S.SCRIPT;
              } else {
                strictFail(parser, 'Invalid tagname in closing tag.');
              }
            } else {
              parser.tagName = c;
            }
          } else if (c === '>') {
            closeTag(parser);
          } else if (isMatch(nameBody, c)) {
            parser.tagName += c;
          } else if (parser.script) {
            parser.script += '</' + parser.tagName;
            parser.tagName = '';
            parser.state = S.SCRIPT;
          } else {
            if (!isWhitespace(c)) {
              strictFail(parser, 'Invalid tagname in closing tag');
            }
            parser.state = S.CLOSE_TAG_SAW_WHITE;
          }
          continue

        case S.CLOSE_TAG_SAW_WHITE:
          if (isWhitespace(c)) {
            continue
          }
          if (c === '>') {
            closeTag(parser);
          } else {
            strictFail(parser, 'Invalid characters in closing tag');
          }
          continue

        case S.TEXT_ENTITY:
        case S.ATTRIB_VALUE_ENTITY_Q:
        case S.ATTRIB_VALUE_ENTITY_U:
          var returnState;
          var buffer;
          switch (parser.state) {
            case S.TEXT_ENTITY:
              returnState = S.TEXT;
              buffer = 'textNode';
              break

            case S.ATTRIB_VALUE_ENTITY_Q:
              returnState = S.ATTRIB_VALUE_QUOTED;
              buffer = 'attribValue';
              break

            case S.ATTRIB_VALUE_ENTITY_U:
              returnState = S.ATTRIB_VALUE_UNQUOTED;
              buffer = 'attribValue';
              break
          }

          if (c === ';') {
            parser[buffer] += parseEntity(parser);
            parser.entity = '';
            parser.state = returnState;
          } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
            parser.entity += c;
          } else {
            strictFail(parser, 'Invalid character in entity name');
            parser[buffer] += '&' + parser.entity + c;
            parser.entity = '';
            parser.state = returnState;
          }

          continue

        default:
          throw new Error(parser, 'Unknown state: ' + parser.state)
      }
    } // while

    if (parser.position >= parser.bufferCheckPosition) {
      checkBufferLength(parser);
    }
    return parser
  }

  /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
  /* istanbul ignore next */
  if (!String.fromCodePoint) {
    (function () {
      var stringFromCharCode = String.fromCharCode;
      var floor = Math.floor;
      var fromCodePoint = function () {
        var MAX_SIZE = 0x4000;
        var codeUnits = [];
        var highSurrogate;
        var lowSurrogate;
        var index = -1;
        var length = arguments.length;
        if (!length) {
          return ''
        }
        var result = '';
        while (++index < length) {
          var codePoint = Number(arguments[index]);
          if (
            !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
            codePoint < 0 || // not a valid Unicode code point
            codePoint > 0x10FFFF || // not a valid Unicode code point
            floor(codePoint) !== codePoint // not an integer
          ) {
            throw RangeError('Invalid code point: ' + codePoint)
          }
          if (codePoint <= 0xFFFF) { // BMP code point
            codeUnits.push(codePoint);
          } else { // Astral code point; split in surrogate halves
            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000;
            highSurrogate = (codePoint >> 10) + 0xD800;
            lowSurrogate = (codePoint % 0x400) + 0xDC00;
            codeUnits.push(highSurrogate, lowSurrogate);
          }
          if (index + 1 === length || codeUnits.length > MAX_SIZE) {
            result += stringFromCharCode.apply(null, codeUnits);
            codeUnits.length = 0;
          }
        }
        return result
      };
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(String, 'fromCodePoint', {
          value: fromCodePoint,
          configurable: true,
          writable: true
        });
      } else {
        String.fromCodePoint = fromCodePoint;
      }
    }());
  }
})(exports);
});

var CSSClassList = function(node) {
    this.parentNode = node;
    this.classNames = new Set();
    this.classAttr = null;
    //this.classValue = null;
};

/**
 * Performs a deep clone of this object.
 *
 * @param parentNode the parentNode to assign to the cloned result
 */
CSSClassList.prototype.clone = function(parentNode) {
    var node = this;
    var nodeData = {};

    Object.keys(node).forEach(function(key) {
        if (key !== 'parentNode') {
            nodeData[key] = node[key];
        }
    });

    // Deep-clone node data.
    nodeData = JSON.parse(JSON.stringify(nodeData));

    var clone = new CSSClassList(parentNode);
   Object.assign(clone, nodeData);
    return clone;
};

CSSClassList.prototype.hasClass = function() {
    this.classAttr = { // empty class attr
        'name': 'class',
        'value': null
    };

    this.addClassHandler();
};


// attr.class

CSSClassList.prototype.addClassHandler = function() {

    Object.defineProperty(this.parentNode.attrs, 'class', {
        get: this.getClassAttr.bind(this),
        set: this.setClassAttr.bind(this),
        enumerable: true,
        configurable: true
    });

    this.addClassValueHandler();
};

// attr.class.value

CSSClassList.prototype.addClassValueHandler = function() {

    Object.defineProperty(this.classAttr, 'value', {
        get: this.getClassValue.bind(this),
        set: this.setClassValue.bind(this),
        enumerable: true,
        configurable: true
    });
};

CSSClassList.prototype.getClassAttr = function() {
    return this.classAttr;
};

CSSClassList.prototype.setClassAttr = function(newClassAttr) {
    this.setClassValue(newClassAttr.value); // must before applying value handler!

    this.classAttr = newClassAttr;
    this.addClassValueHandler();
};

CSSClassList.prototype.getClassValue = function() {
    var arrClassNames = Array.from(this.classNames);
    return arrClassNames.join(' ');
};

CSSClassList.prototype.setClassValue = function(newValue) {
    if(typeof newValue === 'undefined') {
      this.classNames.clear();
      return;
    }
    var arrClassNames = newValue.split(' ');
    this.classNames = new Set(arrClassNames);
};


CSSClassList.prototype.add = function(/* variadic */) {
    this.hasClass();
    Object.values(arguments).forEach(this._addSingle.bind(this));
};

CSSClassList.prototype._addSingle = function(className) {
    this.classNames.add(className);
};


CSSClassList.prototype.remove = function(/* variadic */) {
    this.hasClass();
    Object.values(arguments).forEach(this._removeSingle.bind(this));
};

CSSClassList.prototype._removeSingle = function(className) {
    this.classNames.delete(className);
};


CSSClassList.prototype.item = function(index) {
    var arrClassNames = Array.from(this.classNames);
    return arrClassNames[index];
};

CSSClassList.prototype.toggle = function(className, force) {
    if(this.contains(className) || force === false) {
        this.classNames.delete(className);
    }
    this.classNames.add(className);
};

CSSClassList.prototype.contains = function(className) {
    return this.classNames.has(className);
};


var cssClassList = CSSClassList;

var CSSStyleDeclaration = function(node) {
    this.parentNode = node;

    this.properties = new Map();
    this.hasSynced = false;

    this.styleAttr = null;
    this.styleValue = null;

    this.parseError = false;
};

/**
 * Performs a deep clone of this object.
 *
 * @param parentNode the parentNode to assign to the cloned result
 */
CSSStyleDeclaration.prototype.clone = function(parentNode) {
    var node = this;
    var nodeData = {};

    Object.keys(node).forEach(function(key) {
        if (key !== 'parentNode') {
            nodeData[key] = node[key];
        }
    });

    // Deep-clone node data.
    nodeData = JSON.parse(JSON.stringify(nodeData));

    var clone = new CSSStyleDeclaration(parentNode);
    Object.assign(clone, nodeData);
    return clone;
};

CSSStyleDeclaration.prototype.hasStyle = function() {
    this.addStyleHandler();
};




// attr.style

CSSStyleDeclaration.prototype.addStyleHandler = function() {

    this.styleAttr = { // empty style attr
        'name': 'style',
        'value': null
    };

    Object.defineProperty(this.parentNode.attrs, 'style', {
        get: this.getStyleAttr.bind(this),
        set: this.setStyleAttr.bind(this),
        enumerable: true,
        configurable: true
    });

    this.addStyleValueHandler();
};

// attr.style.value

CSSStyleDeclaration.prototype.addStyleValueHandler = function() {

    Object.defineProperty(this.styleAttr, 'value', {
        get: this.getStyleValue.bind(this),
        set: this.setStyleValue.bind(this),
        enumerable: true,
        configurable: true
    });
};

CSSStyleDeclaration.prototype.getStyleAttr = function() {
    return this.styleAttr;
};

CSSStyleDeclaration.prototype.setStyleAttr = function(newStyleAttr) {
    this.setStyleValue(newStyleAttr.value); // must before applying value handler!

    this.styleAttr = newStyleAttr;
    this.addStyleValueHandler();
    this.hasSynced = false; // raw css changed
};

CSSStyleDeclaration.prototype.getStyleValue = function() {
    return this.getCssText();
};

CSSStyleDeclaration.prototype.setStyleValue = function(newValue) {
    this.properties.clear(); // reset all existing properties
    this.styleValue = newValue;
    this.hasSynced = false; // raw css changed
};




CSSStyleDeclaration.prototype._loadCssText = function() {
    if (this.hasSynced) {
        return;
    }
    this.hasSynced = true; // must be set here to prevent loop in setProperty(...)

    if (!this.styleValue || this.styleValue.length === 0) {
        return;
    }
    var inlineCssStr = this.styleValue;

    var declarations = {};
    try {
        declarations = csstree_min.parse(inlineCssStr, {
            context: 'declarationList',
            parseValue: false
        });
    } catch (parseError) {
        this.parseError = parseError;
        return;
    }
    this.parseError = false;

    var self = this;
    declarations.children.each(function(declaration) {
        try {
          var styleDeclaration = cssTools.csstreeToStyleDeclaration(declaration);
          self.setProperty(styleDeclaration.name, styleDeclaration.value, styleDeclaration.priority);
        } catch(styleError) {
            if(styleError.message !== 'Unknown node type: undefined') {
                self.parseError = styleError;
            }
        }
    });
};


// only reads from properties

/**
 * Get the textual representation of the declaration block (equivalent to .cssText attribute).
 *
 * @return {String} Textual representation of the declaration block (empty string for no properties)
 */
CSSStyleDeclaration.prototype.getCssText = function() {
    var properties = this.getProperties();

    if (this.parseError) {
        // in case of a parse error, pass through original styles
        return this.styleValue;
    }

    var cssText = [];
    properties.forEach(function(property, propertyName) {
        var strImportant = property.priority === 'important' ? '!important' : '';
        cssText.push(propertyName.trim() + ':' + property.value.trim() + strImportant);
    });
    return cssText.join(';');
};

CSSStyleDeclaration.prototype._handleParseError = function() {
    if (this.parseError) {
        console.warn('Warning: Parse error when parsing inline styles, style properties of this element cannot be used. The raw styles can still be get/set using .attr(\'style\').value. Error details: ' + this.parseError);
    }
};


CSSStyleDeclaration.prototype._getProperty = function(propertyName) {
    if(typeof propertyName === 'undefined') {
        throw Error('1 argument required, but only 0 present.');
    }

    var properties = this.getProperties();
    this._handleParseError();

    var property = properties.get(propertyName.trim());
    return property;
};

/**
 * Return the optional priority, "important".
 *
 * @param {String} propertyName representing the property name to be checked.
 * @return {String} priority that represents the priority (e.g. "important") if one exists. If none exists, returns the empty string.
 */
CSSStyleDeclaration.prototype.getPropertyPriority = function(propertyName) {
    var property = this._getProperty(propertyName);
    return property ? property.priority : '';
};

/**
 * Return the property value given a property name.
 *
 * @param {String} propertyName representing the property name to be checked.
 * @return {String} value containing the value of the property. If not set, returns the empty string.
 */
CSSStyleDeclaration.prototype.getPropertyValue = function(propertyName) {
    var property = this._getProperty(propertyName);
    return property ? property.value : null;
};

/**
 * Return a property name.
 *
 * @param {Number} index of the node to be fetched. The index is zero-based.
 * @return {String} propertyName that is the name of the CSS property at the specified index.
 */
CSSStyleDeclaration.prototype.item = function(index) {
    if(typeof index === 'undefined') {
        throw Error('1 argument required, but only 0 present.');
    }

    var properties = this.getProperties();
    this._handleParseError();

    return Array.from(properties.keys())[index];
};

/**
 * Return all properties of the node.
 *
 * @return {Map} properties that is a Map with propertyName as key and property (propertyValue + propertyPriority) as value.
 */
CSSStyleDeclaration.prototype.getProperties = function() {
    this._loadCssText();
    return this.properties;
};


// writes to properties

/**
 * Remove a property from the CSS declaration block.
 *
 * @param {String} propertyName representing the property name to be removed.
 * @return {String} oldValue equal to the value of the CSS property before it was removed.
 */
CSSStyleDeclaration.prototype.removeProperty = function(propertyName) {
    if(typeof propertyName === 'undefined') {
        throw Error('1 argument required, but only 0 present.');
    }

    this.hasStyle();

    var properties = this.getProperties();
    this._handleParseError();

    var oldValue = this.getPropertyValue(propertyName);
    properties.delete(propertyName.trim());
    return oldValue;
};

/**
 * Modify an existing CSS property or creates a new CSS property in the declaration block.
 *
 * @param {String} propertyName representing the CSS property name to be modified.
 * @param {String} [value] containing the new property value. If not specified, treated as the empty string. value must not contain "!important" -- that should be set using the priority parameter.
 * @param {String} [priority] allowing the "important" CSS priority to be set. If not specified, treated as the empty string.
 * @return {undefined}
 */
CSSStyleDeclaration.prototype.setProperty = function(propertyName, value, priority) {
    if(typeof propertyName === 'undefined') {
        throw Error('propertyName argument required, but only not present.');
    }

    this.hasStyle();

    var properties = this.getProperties();
    this._handleParseError();

    var property = {
        value: value.trim(),
        priority: priority.trim()
    };
    properties.set(propertyName.trim(), property);

    return property;
};


var cssStyleDeclaration = CSSStyleDeclaration;

var entityDeclaration = /<!ENTITY\s+(\S+)\s+(?:'([^']+)'|"([^"]+)")\s*>/g;

var config$1 = {
    strict: true,
    trim: false,
    normalize: true,
    lowercase: true,
    xmlns: true,
    position: true
};

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @param {String} data input data
 */
var svg2js = function(data) {

    var sax$1 = sax.parser(config$1.strict, config$1),
        root = new jsAPI({ elem: '#document', content: [] }),
        current = root,
        stack = [root],
        textContext = null;

    function pushToContent(content) {

        content = new jsAPI(content, current);

        (current.content = current.content || []).push(content);

        return content;

    }

    sax$1.ondoctype = function(doctype) {

        pushToContent({
            doctype: doctype
        });

        var subsetStart = doctype.indexOf('['),
            entityMatch;

        if (subsetStart >= 0) {
            entityDeclaration.lastIndex = subsetStart;

            while ((entityMatch = entityDeclaration.exec(data)) != null) {
                sax$1.ENTITIES[entityMatch[1]] = entityMatch[2] || entityMatch[3];
            }
        }
    };

    sax$1.onprocessinginstruction = function(data) {

        pushToContent({
            processinginstruction: data
        });

    };

    sax$1.oncomment = function(comment) {

        pushToContent({
            comment: comment.trim()
        });

    };

    sax$1.oncdata = function(cdata) {

        pushToContent({
            cdata: cdata
        });

    };

    sax$1.onopentag = function(data) {

        var elem = {
            elem: data.name,
            prefix: data.prefix,
            local: data.local,
            attrs: {}
        };

        elem.class = new cssClassList(elem);
        elem.style = new cssStyleDeclaration(elem);

        if (Object.keys(data.attributes).length) {
            for (var name in data.attributes) {

                if (name === 'class') { // has class attribute
                    elem.class.hasClass();
                }

                if (name === 'style') { // has style attribute
                    elem.style.hasStyle();
                }

                elem.attrs[name] = {
                    name: name,
                    value: data.attributes[name].value,
                    prefix: data.attributes[name].prefix,
                    local: data.attributes[name].local
                };
            }
        }

        elem = pushToContent(elem);
        current = elem;

        // Save info about <text> tag to prevent trimming of meaningful whitespace
        if (data.name == 'text' && !data.prefix) {
            textContext = current;
        }

        stack.push(elem);

    };

    sax$1.ontext = function(text) {

        if (/\S/.test(text) || textContext) {

            if (!textContext)
                text = text.trim();

            pushToContent({
                text: text
            });

        }

    };

    sax$1.onclosetag = function() {

        var last = stack.pop();

        // Trim text inside <text> tag.
        if (last == textContext) {
            trim(textContext);
            textContext = null;
        }
        current = stack[stack.length - 1];

    };

    sax$1.onerror = function(e) {

        e.message = 'Error in parsing SVG: ' + e.message;
        if (e.message.indexOf('Unexpected end') < 0) {
            throw e;
        }

    };

    try {
        sax$1.write(data).close();
        return root;
    } catch (e) {
        return { error: e.message };
    }

    function trim(elem) {
        if (!elem.content) return elem;

        var start = elem.content[0],
            end = elem.content[elem.content.length - 1];

        while (start && start.content && !start.text) start = start.content[0];
        if (start && start.text) start.text = start.text.replace(/^\s+/, '');

        while (end && end.content && !end.text) end = end.content[end.content.length - 1];
        if (end && end.text) end.text = end.text.replace(/\s+$/, '');

        return elem;

    }

};

var EOL = '\n';

var os = /*#__PURE__*/Object.freeze({
  __proto__: null,
  EOL: EOL
});

var require$$0$4 = /*@__PURE__*/getAugmentedNamespace(os);

var EOL$1 = require$$0$4.EOL,
    textElem = _collections.elemsGroups.textContent.concat('title');

var defaults = {
    doctypeStart: '<!DOCTYPE',
    doctypeEnd: '>',
    procInstStart: '<?',
    procInstEnd: '?>',
    tagOpenStart: '<',
    tagOpenEnd: '>',
    tagCloseStart: '</',
    tagCloseEnd: '>',
    tagShortStart: '<',
    tagShortEnd: '/>',
    attrStart: '="',
    attrEnd: '"',
    commentStart: '<!--',
    commentEnd: '-->',
    cdataStart: '<![CDATA[',
    cdataEnd: ']]>',
    textStart: '',
    textEnd: '',
    indent: 4,
    regEntities: /[&'"<>]/g,
    regValEntities: /[&"<>]/g,
    encodeEntity: encodeEntity,
    pretty: false,
    useShortTags: true
};

var entities = {
      '&': '&amp;',
      '\'': '&apos;',
      '"': '&quot;',
      '>': '&gt;',
      '<': '&lt;',
    };

/**
 * Convert SVG-as-JS object to SVG (XML) string.
 *
 * @param {Object} data input data
 * @param {Object} config config
 *
 * @return {Object} output data
 */
var js2svg = function(data, config) {

    return new JS2SVG(config).convert(data);

};

function JS2SVG(config) {

    if (config) {
        this.config = Object.assign({}, defaults, config);
    } else {
        this.config = Object.assign({}, defaults);
    }

    var indent = this.config.indent;
    if (typeof indent == 'number' && !isNaN(indent)) {
        this.config.indent = (indent < 0) ? '\t' : ' '.repeat(indent);
    } else if (typeof indent != 'string') {
        this.config.indent = '    ';
    }

    if (this.config.pretty) {
        this.config.doctypeEnd += EOL$1;
        this.config.procInstEnd += EOL$1;
        this.config.commentEnd += EOL$1;
        this.config.cdataEnd += EOL$1;
        this.config.tagShortEnd += EOL$1;
        this.config.tagOpenEnd += EOL$1;
        this.config.tagCloseEnd += EOL$1;
        this.config.textEnd += EOL$1;
    }

    this.indentLevel = 0;
    this.textContext = null;

}

function encodeEntity(char) {
    return entities[char];
}

/**
 * Start conversion.
 *
 * @param {Object} data input data
 *
 * @return {String}
 */
JS2SVG.prototype.convert = function(data) {

    var svg = '';

    if (data.content) {

        this.indentLevel++;

        data.content.forEach(function(item) {

            if (item.elem) {
               svg += this.createElem(item);
            } else if (item.text) {
               svg += this.createText(item.text);
            } else if (item.doctype) {
                svg += this.createDoctype(item.doctype);
            } else if (item.processinginstruction) {
                svg += this.createProcInst(item.processinginstruction);
            } else if (item.comment) {
                svg += this.createComment(item.comment);
            } else if (item.cdata) {
                svg += this.createCDATA(item.cdata);
            }

        }, this);

    }

    this.indentLevel--;

    return {
        data: svg,
        info: {
            width: this.width,
            height: this.height
        }
    };

};

/**
 * Create indent string in accordance with the current node level.
 *
 * @return {String}
 */
JS2SVG.prototype.createIndent = function() {

    var indent = '';

    if (this.config.pretty && !this.textContext) {
        indent = this.config.indent.repeat(this.indentLevel - 1);
    }

    return indent;

};

/**
 * Create doctype tag.
 *
 * @param {String} doctype doctype body string
 *
 * @return {String}
 */
JS2SVG.prototype.createDoctype = function(doctype) {

    return  this.config.doctypeStart +
            doctype +
            this.config.doctypeEnd;

};

/**
 * Create XML Processing Instruction tag.
 *
 * @param {Object} instruction instruction object
 *
 * @return {String}
 */
JS2SVG.prototype.createProcInst = function(instruction) {

    return  this.config.procInstStart +
            instruction.name +
            ' ' +
            instruction.body +
            this.config.procInstEnd;

};

/**
 * Create comment tag.
 *
 * @param {String} comment comment body
 *
 * @return {String}
 */
JS2SVG.prototype.createComment = function(comment) {

    return  this.config.commentStart +
            comment +
            this.config.commentEnd;

};

/**
 * Create CDATA section.
 *
 * @param {String} cdata CDATA body
 *
 * @return {String}
 */
JS2SVG.prototype.createCDATA = function(cdata) {

    return  this.createIndent() +
            this.config.cdataStart +
            cdata +
            this.config.cdataEnd;

};

/**
 * Create element tag.
 *
 * @param {Object} data element object
 *
 * @return {String}
 */
JS2SVG.prototype.createElem = function(data) {

    // beautiful injection for obtaining SVG information :)
    if (
        data.isElem('svg') &&
        data.hasAttr('width') &&
        data.hasAttr('height')
    ) {
        this.width = data.attr('width').value;
        this.height = data.attr('height').value;
    }

    // empty element and short tag
    if (data.isEmpty()) {
        if (this.config.useShortTags) {
            return this.createIndent() +
                   this.config.tagShortStart +
                   data.elem +
                   this.createAttrs(data) +
                   this.config.tagShortEnd;
        } else {
            return this.createIndent() +
                   this.config.tagShortStart +
                   data.elem +
                   this.createAttrs(data) +
                   this.config.tagOpenEnd +
                   this.config.tagCloseStart +
                   data.elem +
                   this.config.tagCloseEnd;
        }
    // non-empty element
    } else {
        var tagOpenStart = this.config.tagOpenStart,
            tagOpenEnd = this.config.tagOpenEnd,
            tagCloseStart = this.config.tagCloseStart,
            tagCloseEnd = this.config.tagCloseEnd,
            openIndent = this.createIndent(),
            textIndent = '',
            processedData = '',
            dataEnd = '';

        if (this.textContext) {
            tagOpenStart = defaults.tagOpenStart;
            tagOpenEnd = defaults.tagOpenEnd;
            tagCloseStart = defaults.tagCloseStart;
            tagCloseEnd = defaults.tagCloseEnd;
            openIndent = '';
        } else if (data.isElem(textElem)) {
            if (this.config.pretty) {
                textIndent += openIndent + this.config.indent;
            }
            this.textContext = data;
        }

        processedData += this.convert(data).data;

        if (this.textContext == data) {
            this.textContext = null;
            if (this.config.pretty) dataEnd = EOL$1;
        }

        return  openIndent +
                tagOpenStart +
                data.elem +
                this.createAttrs(data) +
                tagOpenEnd +
                textIndent +
                processedData +
                dataEnd +
                this.createIndent() +
                tagCloseStart +
                data.elem +
                tagCloseEnd;

    }

};

/**
 * Create element attributes.
 *
 * @param {Object} elem attributes object
 *
 * @return {String}
 */
JS2SVG.prototype.createAttrs = function(elem) {

    var attrs = '';

    elem.eachAttr(function(attr) {

        if (attr.value !== undefined) {
            attrs +=    ' ' +
                        attr.name +
                        this.config.attrStart +
                        String(attr.value).replace(this.config.regValEntities, this.config.encodeEntity) +
                        this.config.attrEnd;
        }
        else {
            attrs +=    ' ' +
                        attr.name;
        }


    }, this);

    return attrs;

};

/**
 * Create text node.
 *
 * @param {String} text text
 *
 * @return {String}
 */
JS2SVG.prototype.createText = function(text) {

    return  this.createIndent() +
            this.config.textStart +
            text.replace(this.config.regEntities, this.config.encodeEntity) +
            (this.textContext ? '' : this.config.textEnd);

};

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {Object} data input data
 * @param {Object} info extra information
 * @param {Object} plugins plugins object from config
 * @return {Object} output data
 */
var plugins$1 = function(data, info, plugins) {
  // Try to group sequential elements of plugins array
  // to optimize ast traversing
  const groups = [];
  let prev;
  for (const plugin of plugins) {
    if (prev && plugin.type == prev[0].type) {
      prev.push(plugin);
    } else {
      prev = [plugin];
      groups.push(prev);
    }
  }
  for (const group of groups) {
    switch(group[0].type) {
      case 'perItem':
        data = perItem(data, info, group);
        break;
      case 'perItemReverse':
        data = perItem(data, info, group, true);
        break;
      case 'full':
        data = full(data, info, group);
        break;
    }
  }
  return data;
};

/**
 * Direct or reverse per-item loop.
 *
 * @param {Object} data input data
 * @param {Object} info extra information
 * @param {Array} plugins plugins list to process
 * @param {Boolean} [reverse] reverse pass?
 * @return {Object} output data
 */
function perItem(data, info, plugins, reverse) {

    function monkeys(items) {

        items.content = items.content.filter(function(item) {

            // reverse pass
            if (reverse && item.content) {
                monkeys(item);
            }

            // main filter
            var filter = true;

            for (var i = 0; filter && i < plugins.length; i++) {
                var plugin = plugins[i];

                if (plugin.active && plugin.fn(item, plugin.params, info) === false) {
                    filter = false;
                }
            }

            // direct pass
            if (!reverse && item.content) {
                monkeys(item);
            }

            return filter;

        });

        return items;

    }

    return monkeys(data);

}

/**
 * "Full" plugins.
 *
 * @param {Object} data input data
 * @param {Object} info extra information
 * @param {Array} plugins plugins list to process
 * @return {Object} output data
 */
function full(data, info, plugins) {

    plugins.forEach(function(plugin) {
        if (plugin.active) {
            data = plugin.fn(data, plugin.params, info);
        }
    });

    return data;

}

/**
 * SVGO is a Nodejs-based tool for optimizing SVG vector graphics files.
 *
 * @see https://github.com/svg/svgo
 *
 * @author Kir Belevich <kir@soulshine.in> (https://github.com/deepsweet)
 * @copyright © 2012 Kir Belevich
 * @license MIT https://raw.githubusercontent.com/svg/svgo/master/LICENSE
 */

const {
  defaultPlugins: defaultPlugins$1,
  resolvePluginConfig: resolvePluginConfig$1,
  extendDefaultPlugins: extendDefaultPlugins$1
} = config;




const { encodeSVGDatauri } = tools;

var extendDefaultPlugins_1$1 = extendDefaultPlugins$1;

const optimize = (input, config) => {
  if (config == null) {
    config = {};
  }
  if (typeof config !== 'object') {
    throw Error('Config should be an object')
  }
  const maxPassCount = config.multipass ? 10 : 1;
  let prevResultSize = Number.POSITIVE_INFINITY;
  let svgjs = null;
  const info = {};
  if (config.path != null) {
    info.path = config.path;
  }
  for (let i = 0; i < maxPassCount; i += 1) {
    info.multipassCount = i;
    svgjs = svg2js(input);
    if (svgjs.error != null) {
      if (config.path != null) {
        svgjs.path = config.path;
      }
      return svgjs;
    }
    const plugins = config.plugins || defaultPlugins$1;
    if (Array.isArray(plugins) === false) {
      throw Error('Invalid plugins list. Provided \'plugins\' in config should be an array.');
    }
    const resolvedPlugins = plugins.map(plugin => resolvePluginConfig$1(plugin, config));
    svgjs = plugins$1(svgjs, info, resolvedPlugins);
    svgjs = js2svg(svgjs, config.js2svg);
    if (svgjs.error) {
      throw Error(svgjs.error);
    }
    if (svgjs.data.length < prevResultSize) {
      input = svgjs.data;
      prevResultSize = svgjs.data.length;
    } else {
      if (config.datauri) {
        svgjs.data = encodeSVGDatauri(svgjs.data, config.datauri);
      }
      if (config.path != null) {
        svgjs.path = config.path;
      }
      return svgjs;
    }
  }
  return svgjs;
};
var optimize_1 = optimize;

/**
 * The factory that creates a content item with the helper methods.
 *
 * @param {Object} data which is passed to jsAPI constructor
 * @returns {JSAPI} content item
 */
const createContentItem = (data) => {
  return new jsAPI(data);
};
var createContentItem_1 = createContentItem;

var svgo = {
	extendDefaultPlugins: extendDefaultPlugins_1$1,
	optimize: optimize_1,
	createContentItem: createContentItem_1
};

export default svgo;
export { createContentItem_1 as createContentItem, extendDefaultPlugins_1$1 as extendDefaultPlugins, optimize_1 as optimize };