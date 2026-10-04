import { expect, it } from 'vitest';
import { optimize } from '../../lib/svgo.js';

/** @type {[import('../../lib/types.js').PluginConfig[]][]} */
const configurations = [[['minifyStyles']], [['inlineStyles', 'minifyStyles']]];
it.each(configurations)(
  'minifies a selector split across text and CDATA: %s',
  (plugins) => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.sh<![CDATA[ape{fill:blue}]]></style><rect class="shape" width="100" height="100" fill="red"/></svg>';
    expect(optimize(svg, { plugins }).data).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.shape{fill:#00f}</style><rect class="shape" width="100" height="100" fill="red"/></svg>',
    );
  },
);

it('minifies every rule without retaining duplicate CDATA content', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.shape{stroke:green}<![CDATA[.shape{fill:blue}]]></style><rect class="shape"/></svg>';
  expect(optimize(svg, { plugins: ['minifyStyles'] }).data).toBe(
    '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.shape{stroke:green;fill:#00f}</style><rect class="shape"/></svg>',
  );
});

it('escapes a CDATA terminator in the combined stylesheet', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.shape{fill:blue;content:"]]&gt;"}<![CDATA[.shape{stroke:green}]]></style><rect class="shape"/></svg>';
  const result = optimize(svg, { plugins: ['minifyStyles'] }).data;
  expect(result).toContain('content:&quot;]]&gt;&quot;');
  expect(() => optimize(result, { plugins: [] })).not.toThrow();
});
