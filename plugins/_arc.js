/**
 * @typedef {import('../lib//types').PathDataItem} PathDataItem
 */

/**
 * @typedef {[number, number]} Point
 */

/**
 * @typedef {{
 *   error: number,
 *   arcThreshold: number,
 *   arcTolerance: number
 * }} Options
 */

/**
 * @type {(prev: Point, item: PathDataItem, options: Options) => { item: PathDataItem, radius: number, center: Point } | undefined}
 */
function findArc(prev, item, options) {
  if (item.command === 'a') {
    var radius = (item.args[0] + item.args[1]) / 2;
    var tolerance = Math.min(
      options.arcThreshold * options.error,
      (options.arcTolerance * radius) / 100
    );
    if (
      Math.abs(item.args[0] - radius) <= tolerance &&
      Math.abs(item.args[1] - radius) <= tolerance
    ) {
      // @ts-ignore
      var center = getArcCenter(prev, item.coords, item.args);
      return { item, center, radius };
    }
  }
  if (item.command === 'c' || item.command === 's') {
    var circle = findCircle(item.args, options);
    if (!circle) return;
    var sweep =
      item.args[5] * item.args[0] - item.args[4] * item.args[1] > 0 ? 1 : 0;
    return {
      item: {
        command: 'a',
        args: [
          circle.radius,
          circle.radius,
          0,
          0,
          sweep,
          item.args[4],
          item.args[5],
        ],
        // @ts-ignore
        coords: item.coords.slice(),
        // @ts-ignore
        base: item.base,
      },
      center: [
        // @ts-ignore
        item.base[0] + circle.relCenter[0],
        // @ts-ignore
        item.base[1] + circle.relCenter[1],
      ],
      radius: circle.radius,
    };
  }
}
exports.findArc = findArc;

/**
 * Finds circle by 3 points of the curve and checks if the curve fits the found circle.
 *
 * @type {(curve: number[], options: Options) => undefined | { radius: number, relCenter: Point }}
 */

function findCircle(curve, { error, arcThreshold, arcTolerance }) {
  if (!isConvex(curve)) return;
  var midPoint = getCubicBezierPoint(curve, 1 / 2),
    m1 = [midPoint[0] / 2, midPoint[1] / 2],
    m2 = [(midPoint[0] + curve[4]) / 2, (midPoint[1] + curve[5]) / 2],
    center = getIntersection([
      m1[0],
      m1[1],
      m1[0] + m1[1],
      m1[1] - m1[0],
      m2[0],
      m2[1],
      m2[0] + (m2[1] - midPoint[1]),
      m2[1] - (m2[0] - midPoint[0]),
    ]),
    radius = center && getDistance([0, 0], center),
    // @ts-ignore
    tolerance = Math.min(arcThreshold * error, (arcTolerance * radius) / 100);

  if (
    center &&
    // @ts-ignore
    radius < 1e15 &&
    [1 / 4, 3 / 4].every(function (point) {
      return (
        Math.abs(
          // @ts-ignore
          getDistance(getCubicBezierPoint(curve, point), center) - radius
        ) <= tolerance
      );
    })
  ) {
    // @ts-ignore
    return { relCenter: center, radius: radius };
  }
}

/**
 * Returns coordinates of the curve point corresponding to the certain t
 * a·(1 - t)³·p1 + b·(1 - t)²·t·p2 + c·(1 - t)·t²·p3 + d·t³·p4,
 * where pN are control points and p1 is zero due to relative coordinates.
 *
 * @type {(curve: number[], t: number) => Point}
 */

function getCubicBezierPoint(curve, t) {
  var sqrT = t * t,
    cubT = sqrT * t,
    mt = 1 - t,
    sqrMt = mt * mt;

  return [
    3 * sqrMt * t * curve[0] + 3 * mt * sqrT * curve[2] + cubT * curve[4],
    3 * sqrMt * t * curve[1] + 3 * mt * sqrT * curve[3] + cubT * curve[5],
  ];
}

/**
 * Returns distance between two points
 *
 * @type {(point1: Point, point2: Point) => number}
 */

function getDistance(point1, point2) {
  return Math.hypot(point1[0] - point2[0], point1[1] - point2[1]);
}

/**
 * Computes lines equations by two points and returns their intersection point.
 *
 * @type {(coords: number[]) => undefined | Point}
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
    denom = a1 * b2 - a2 * b1;

  if (!denom) return; // parallel lines don't have an intersection

  /**
   * @type {Point}
   */
  var cross = [(b1 * c2 - b2 * c1) / denom, (a1 * c2 - a2 * c1) / -denom];
  if (
    !isNaN(cross[0]) &&
    !isNaN(cross[1]) &&
    isFinite(cross[0]) &&
    isFinite(cross[1])
  ) {
    return cross;
  }
}

/**
 * @type {(perv: Point, coords: Point, arc: number[]) => Point}
 */
function getArcCenter(
  [px, py],
  [cx, cy],
  [rx, ry, xAxisRotation, largeArcFlag, sweepFlag]
) {
  var sinphi = Math.sin((xAxisRotation * Math.PI * 2) / 360);
  var cosphi = Math.cos((xAxisRotation * Math.PI * 2) / 360);
  var pxp = (cosphi * (px - cx)) / 2 + (sinphi * (py - cy)) / 2;
  var pyp = (-sinphi * (px - cx)) / 2 + (cosphi * (py - cy)) / 2;
  var rxsq = Math.pow(rx, 2);
  var rysq = Math.pow(ry, 2);
  var pxpsq = Math.pow(pxp, 2);
  var pypsq = Math.pow(pyp, 2);

  var rad = rxsq * rysq - rxsq * pypsq - rysq * pxpsq;

  if (rad < 0) {
    rad = 0;
  }

  rad /= rxsq * pypsq + rysq * pxpsq;
  rad = Math.sqrt(rad) * (largeArcFlag === sweepFlag ? -1 : 1);

  var centerxp = ((rad * rx) / ry) * pyp;
  var centeryp = ((rad * -ry) / rx) * pxp;

  return [
    cosphi * centerxp - sinphi * centeryp + (px + cx) / 2,
    sinphi * centerxp + cosphi * centeryp + (py + cy) / 2,
  ];
}

/**
 * Checks if curve is convex. Control points of such a curve must form
 * a convex quadrilateral with diagonals crosspoint inside of it.
 *
 * @type {(data: number[]) => boolean}
 */
function isConvex(data) {
  var center = getIntersection([
    0,
    0,
    data[2],
    data[3],
    data[0],
    data[1],
    data[4],
    data[5],
  ]);

  return (
    center != null &&
    data[2] < center[0] == center[0] < 0 &&
    data[3] < center[1] == center[1] < 0 &&
    data[4] < center[0] == center[0] < data[0] &&
    data[5] < center[1] == center[1] < data[1]
  );
}
