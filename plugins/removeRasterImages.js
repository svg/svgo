import { detachNodeFromParent } from '../lib/xast.js';

export const name = 'removeRasterImages';
export const description = 'removes raster images';

/**
 * Matches raster image references, either as a file extension or as a
 * data URI media type.
 */
const rasterImage = /(\.|image\/)(jpe?g|jfif|png|gif|webp|avif|bmp|ico|tiff?)/;

/**
 * Remove raster images references in <image>.
 *
 * @see https://bugs.webkit.org/show_bug.cgi?id=63548
 *
 * @author Kir Belevich
 *
 * @type {import('../lib/types.js').Plugin}
 * @since 0.2.3
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name !== 'image') {
          return;
        }
        // When both attributes are present, href takes precedence over xlink:href.
        const href = node.attributes.href ?? node.attributes['xlink:href'];
        if (href != null && rasterImage.test(href)) {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
