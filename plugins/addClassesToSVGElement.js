/**
 * @typedef AddClassesToSVGElementParams
 * @property {string | ((node: import('../lib/types.js').XastElement, info: import('../lib/types.js').PluginInfo) => string)=} className
 * @property {Array<string | ((node: import('../lib/types.js').XastElement, info: import('../lib/types.js').PluginInfo) => string)>=} classNames
 */

export const name = 'addClassesToSVGElement';
export const description = 'adds classnames to an outer <svg> element';

const ENOCLS = `Error in plugin "addClassesToSVGElement": absent parameters.
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
 * @type {import('../lib/types.js').Plugin<AddClassesToSVGElementParams>}
 */
export const fn = (root, params, info) => {
  if (
    !(Array.isArray(params.classNames) && params.classNames.length !== 0) &&
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
              const classToAdd =
                typeof className === 'string'
                  ? className
                  : className(node, info);
              classList.add(classToAdd);
            }
          }
          node.attributes.class = Array.from(classList).join(' ');
        }
      },
    },
  };
};
