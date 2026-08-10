module.exports = {
  name: 'plugin-disable-typescript-compat',
  factory: (require) => {
    const { structUtils } = require('@yarnpkg/core');

    return {
      hooks: {
        reduceDependency: async (dependency) => {
          if (structUtils.stringifyIdent(dependency) !== 'typescript') {
            return dependency;
          }
          if (
            !dependency.range.startsWith('patch:') ||
            !/#~builtin<compat\/typescript>(?:::.*)?$/.test(dependency.range)
          ) {
            return dependency;
          }

          const source = dependency.range.match(/^patch:([^#]+)/)?.[1];
          if (source == null) {
            return dependency;
          }

          const unpatched = structUtils.parseDescriptor(decodeURIComponent(source));
          return structUtils.makeDescriptor(dependency, unpatched.range);
        },
      },
    };
  },
};
