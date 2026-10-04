import { expect, it } from 'vitest';
import { optimize } from '../../lib/svgo.js';

it.each([false, true])(
  'preserves conditional CSS split across text and CDATA (multipass: %s)',
  (multipass) => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.sh<![CDATA[ape{fill:blue}]]></style><rect class="shape" width="100" height="100" fill="red"/></svg>';
    expect(optimize(svg, { multipass }).data).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.shape{fill:#00f}</style><path fill="red" d="M0 0h100v100H0z" class="shape"/></svg>',
    );
  },
);

it.each([
  ['print', false],
  ['print', true],
  ['screen', false],
  ['screen', true],
])(
  'preserves a shape hidden only for %s (multipass: %s)',
  (media, multipass) => {
    const result = optimize(
      `<svg xmlns="http://www.w3.org/2000/svg"><style media="${media}">.hidden { display: none; }</style><rect class="hidden" width="100" height="100"/></svg>`,
      { multipass },
    );
    expect(result.data).toBe(
      `<svg xmlns="http://www.w3.org/2000/svg"><style media="${media}">.hidden{display:none}</style><path d="M0 0h100v100H0z" class="hidden"/></svg>`,
    );
  },
);
