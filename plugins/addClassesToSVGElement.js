/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 */

export const name = 'addClassesToSVGElement';
export const description = 'adds classnames to an outer <svg> element';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  required: ['classNames'],
  properties: {
    classNames: {
      title: 'Class Names',
      description:
        'Adds the specified class names to the outer most `<svg>` element.',
      type: 'array',
      default: undefined,
      minItems: 1,
      items: {
        type: 'string',
      },
    },
  },
};

var ENOCLS = `Error in plugin "addClassesToSVGElement": absent parameters.
It should have a list of classes in "classNames" or one "className".
Config example:

plugins: [
  {
    name: "addClassesToSVGElement",
    params: {
      className: "mySvg"
    }
  }
]

plugins: [
  {
    name: "addClassesToSVGElement",
    params: {
      classNames: ["mySvg", "size-big"]
    }
  }
]
`;

/**
 * Add classnames to an outer <svg> element. Example config:
 *
 * plugins: [
 *   {
 *     name: "addClassesToSVGElement",
 *     params: {
 *       className: "mySvg"
 *     }
 *   }
 * ]
 *
 * plugins: [
 *   {
 *     name: "addClassesToSVGElement",
 *     params: {
 *       classNames: ["mySvg", "size-big"]
 *     }
 *   }
 * ]
 *
 * @author April Arcus
 *
 * @type {import('./plugins-types.js').Plugin<'addClassesToSVGElement'>}
 */
export const fn = (root, params) => {
  if (
    !(Array.isArray(params.classNames) && params.classNames.some(String)) &&
    !params.className
  ) {
    console.error(ENOCLS);
    return null;
  }
  const classNames = params.classNames || [params.className];
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          const classList = new Set(
            node.attributes.class == null
              ? null
              : node.attributes.class.split(' '),
          );
          for (const className of classNames) {
            if (className != null) {
              classList.add(className);
            }
          }
          node.attributes.class = Array.from(classList).join(' ');
        }
      },
    },
  };
};
