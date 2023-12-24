'use strict';

const { inheritableAttrs } = require( './_collections' );

/**
 * @typedef {import('../lib/types').XastElement} XastElement
 * @typedef {import('../lib/types').XastChild} XastChild
 */

exports.name = 'mergeText';
exports.description = 'merges <text> elements and children where possible';

/**
 * @typedef {{
 * x:string,
 * y:string,
 * attributes:Map<string,string>,
 * children:XastChild[]
 * }} TspanData
 */

/**
 * @typedef {{
 * x:string,
 * y:string,
 * children:TspanData[],
 * }
 * }TextData
 */

/**
 * Merge <text> elements and children where possible, and minimize duplication of attributes.
 *
 * @author John Kenny
 *
 * @type {import('./plugins-types').Plugin<'mergeText'>}
 */

exports.fn = () => {
    let deoptimized = false;

    return {
        element: {
            enter: ( node ) => {
                // Don't collapse if styles are present.
                if ( node.name === 'style' && node.children.length !== 0 ) {
                    deoptimized = true;
                }
            },

            exit: ( node ) => {
                if ( deoptimized ) {
                    return;
                }

                // See if the node has <text> children.
                /** @type Map<number,TextData> */
                const mergeableChildren = new Map();
                for ( let index = 0; index < node.children.length; index++ ) {
                    const child = node.children[ index ];
                    if ( child.type === 'element' && child.name === 'text' ) {
                        const mergeData = getMergeData( child );
                        if ( mergeData ) {
                            mergeableChildren.set( index, mergeData );
                        }
                    }
                }

                // If nothing to merge, return.
                if ( mergeableChildren.size === 0 ) {
                    return;
                }

                // Create new child nodes.
                /** @type XastChild[] */
                const newChildren = [];
                for ( let index = 0; index < node.children.length; index++ ) {
                    if ( !mergeableChildren.has( index ) ) {
                        // This is not a <text> element; do not process.
                        newChildren.push( node.children[ index ] );
                        continue;
                    }
                    if ( mergeableChildren.has( index - 1 ) ) {
                        // The previous child was a mergeable <text> element; assume this one was already merged into it.
                        continue;
                    }
                    // Merge and insert text elements.
                    newChildren.push( mergeTextElements( mergeableChildren, index ) );
                }

                // Update children.
                node.children = newChildren;
            },
        },
    };
};

/**
 *
 * @param {XastElement} textEl
 * @returns {any}
 */
function getMergeData( textEl ) {
    /**@type TextData   */
    const data = {};
    /**@type Map<string,string> */
    const textAttributes = new Map();
    data.children = [];

    // Gather all <text> attributes.
    for ( const [ k, v ] of Object.entries( textEl.attributes ) ) {
        switch ( k ) {
            case 'x':
            case 'y':
                data[ k ] = v;
                break;
            default:
                textAttributes.set( k, v );
                break;
        }
    }

    // Check all children of <text> element.
    for ( const child of textEl.children ) {
        if ( child.type === 'text' ) {
            if ( isWhiteSpace( child.value ) ) {
                // Ignore nodes that are all whitespace.
                continue;
            }
        }
        if ( child.type !== 'element' || child.name !== 'tspan' ) {
            // Don't transform unless all children are <tspan> elements.
            return;
        }
        for ( const tspanChild of child.children ) {
            // Don't transform unless <tspan> has only text nodes and <tspan>s as children.
            if ( tspanChild.type === 'text' ) {
                continue;
            }
            if ( tspanChild.type === 'element' && tspanChild.name === 'tspan' ) {
                continue;
            }
            return;
        }

        /** @type TspanData     */
        const tspanData = {};

        // Copy all <text> attributes to the tspan data.
        tspanData.attributes = new Map( textAttributes );

        // Merge all <tspan> attributes.
        for ( const [ k, v ] of Object.entries( child.attributes ) ) {
            switch ( k ) {
                case 'x':
                case 'y':
                    tspanData[ k ] = v;
                    break;
                default:
                    if ( !inheritableAttrs.includes( k ) ) {
                        // Don't transform if <tspan> has unrecognized attributes.
                        return;
                    }
                    tspanData.attributes.set( k, v );
                    break;
            }
        }

        // Don't transform unless all children have x and y attributes.
        if ( !tspanData.x || !tspanData.y ) {
            return;
        }

        tspanData.children = child.children;

        data.children.push( tspanData );
    }

    return data;
}

/**
 *
 * @param {TspanData[]} tspans
 * @returns {{}}
 */
function getTextAttributes( tspans ) {
    // Figure out what attributes and values we have.
    const allAttributes = new Map();
    for ( const tspanElement of tspans ) {
        for ( const [ attName, attValue ] of tspanElement.attributes ) {
            let values = allAttributes.get( attName );
            if ( !values ) {
                values = new Map();
                allAttributes.set( attName, values );
            }
            if ( !values.has( attValue ) ) {
                values.set( attValue, 1 );
            } else {
                values.set( attValue, values.get( attValue ) + 1 );
            }
        }
    }

    // Figure out which ones to use as <text> attributes.
    /** @type Object.<string,string> */
    const textAttributes = {};
    for ( const [ attName, values ] of allAttributes ) {
        // Check all values. If there are fewer values than children, at least one child does not have the attribute;
        // in this case leave attribute off of <text>. Otherwise, set text attribute to the most-used value.
        let total = 0;
        let maxCount = 0;
        let textAttValue;
        for ( const [ value, count ] of values ) {
            total += count;
            if ( count > maxCount ) {
                maxCount = count;
                textAttValue = value;
            }
        }
        if ( total === tspans.length && textAttValue ) {
            textAttributes[ attName ] = textAttValue;
        }
    }

    return textAttributes;
}

/**
 * @param {string} s
 * @returns {boolean}
 */
function isWhiteSpace( s ) {
    return /^\s*$/.test( s );
}

/**
 *
 * @param {Map<number,TextData>} mergeableChildren
 * @param {number} index
 * @returns XastElement
 */
function mergeTextElements( mergeableChildren, index ) {
    /** @type {XastElement} */
    const textElement = {
        type: 'element',
        name: 'text',
        attributes: {},
        children: [],
    };

    //   Find all child data.
    const tspans = [];
    for ( ; ; index++ ) {
        const textData = mergeableChildren.get( index );
        if ( !textData ) {
            break;
        }
        tspans.push( ...textData.children );
    }

    // Find the default attributes for the <text> element.
    textElement.attributes = getTextAttributes( tspans );

    // If there is only one <tspan>, merge content into <text>.
    if ( tspans.length === 1 ) {
        const tspanData = tspans[ 0 ];
        textElement.attributes.x = tspanData.x;
        textElement.attributes.y = tspanData.y;
        textElement.children = tspanData.children;
        return textElement;
    }

    // Generate <tspan> elements.
    const textChildren = [];
    for ( const tspanData of tspans ) {
        /** @type {XastElement} */
        const tspanElement = {
            type: 'element',
            name: 'tspan',
            attributes: { x: tspanData.x, y: tspanData.y },
            children: tspanData.children,
        };

        // Add any attributes that are different from <text> attributes.
        for ( const [ k, v ] of tspanData.attributes ) {
            if ( textElement.attributes[ k ] !== v ) {
                tspanElement.attributes[ k ] = v;
            }
        }

        textChildren.push( tspanElement );
    }

    textElement.children = textChildren;
    return textElement;
}
