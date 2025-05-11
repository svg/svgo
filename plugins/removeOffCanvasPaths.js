import { detachNodeFromParent } from '../lib/xast.js';
import { visitSkip } from '../lib/util/visit.js';
import { parsePathData } from '../lib/path.js';
import { intersects } from './_path.js';

export const name = 'removeOffCanvasPaths';
export const description =
  'removes elements that are drawn outside of the viewBox (disabled by default)';

/**
 * Remove elements that are drawn outside of the viewBox.
 *
 * @author JoshyPHP
 *
 * @type {import('../lib/types.js').Plugin}
 */
export const fn = () => {
  /**
   * @type {?{
   *   top: number,
   *   right: number,
   *   bottom: number,
   *   left: number,
   *   width: number,
   *   height: number
   * }}
   */
  let viewBoxData = null;

  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          let viewBox = '';
          // find viewBox
          if (node.attributes.viewBox != null) {
            // remove commas and plus signs, normalize and trim whitespace
            viewBox = node.attributes.viewBox;
          } else if (
            node.attributes.height != null &&
            node.attributes.width != null
          ) {
            viewBox = `0 0 ${node.attributes.width} ${node.attributes.height}`;
          }

          // parse viewBox
          // remove commas and plus signs, normalize and trim whitespace
          viewBox = viewBox
            .replace(/[,+]|px/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^\s*|\s*$/g, '');
          // ensure that the dimensions are 4 values separated by space
          const m =
            /^(-?\d*\.?\d+) (-?\d*\.?\d+) (\d*\.?\d+) (\d*\.?\d+)$/.exec(
              viewBox,
            );
          if (m == null) {
            return;
          }
          const left = Number.parseFloat(m[1]);
          const top = Number.parseFloat(m[2]);
          const width = Number.parseFloat(m[3]);
          const height = Number.parseFloat(m[4]);

          // store the viewBox boundaries
          viewBoxData = {
            left,
            top,
            right: left + width,
            bottom: top + height,
            width,
            height,
          };
        }

        // consider that any item with a transform attribute is visible
        if (node.attributes.transform != null) {
          return visitSkip;
        }

        if (
          node.name === 'path' &&
          node.attributes.d != null &&
          viewBoxData != null
        ) {
          const pathData = parsePathData(node.attributes.d);

          // consider that an M command within the viewBox is visible
          let visible = false;
          for (const pathDataItem of pathData) {
            if (pathDataItem.command === 'M') {
              const [x, y] = pathDataItem.args;
              if (
                x >= viewBoxData.left &&
                x <= viewBoxData.right &&
                y >= viewBoxData.top &&
                y <= viewBoxData.bottom
              ) {
                visible = true;
              }
            }
          }
          if (visible) {
            return;
          }

          if (pathData.length === 2) {
            // close the path too short for intersects()
            pathData.push({ command: 'z', args: [] });
          }

          const { left, top, width, height } = viewBoxData;
          /** @type {ReadonlyArray<import('../lib/types.js').PathDataItem>} */
          const viewBoxPathData = [
            { command: 'M', args: [left, top] },
            { command: 'h', args: [width] },
            { command: 'v', args: [height] },
            { command: 'H', args: [left] },
            { command: 'z', args: [] },
          ];

          if (intersects(viewBoxPathData, pathData) === false) {
            detachNodeFromParent(node, parentNode);
          }
        }
      },
    },
  };
};
