import assert from 'node:assert/strict';
import { createRequire, registerHooks } from 'node:module';

const require = createRequire(import.meta.url);

const nodeSvgo = require('svgo');
assert.equal(typeof nodeSvgo.optimize, 'function');
assert.equal(typeof nodeSvgo.loadConfig, 'function');

// Add the browser condition to this import so Node resolves the browser branch
// of SVGO's root conditional export, just as a browser-targeting bundler would.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'svgo') {
      return nextResolve(specifier, {
        ...context,
        conditions: [...context.conditions, 'browser'],
      });
    }
    return nextResolve(specifier, context);
  },
});

try {
  const browserSvgo = await import('svgo');
  assert.equal(typeof browserSvgo.optimize, 'function');
  assert.equal('loadConfig' in browserSvgo, false);
} finally {
  hooks.deregister();
}

const browserSubpathSvgo = await import('svgo/browser');
assert.equal(typeof browserSubpathSvgo.optimize, 'function');
assert.equal('loadConfig' in browserSubpathSvgo, false);
