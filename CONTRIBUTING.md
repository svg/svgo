# Contributing

## Reporting Bugs

If you've found a bug with SVGO, [create an issue](https://github.com/svg/svgo/issues) on GitHub.

Your issue should ideally contain:

* A concise description of the bug.
* How you were using SVGO, the version of the tool, and any configuration or command-line options.
* The SVG that was effected, or a [Minimal, Reproducible Example](https://stackoverflow.com/help/minimal-reproducible-example).

If you haven't found a bug, but need help using SVGO in your project, please consider asking on [Stack Overflow](https://stackoverflow.com/questions/tagged/svgo) with the `[svgo]` tag, you may get help faster there. You can still create an issue if the confusion stemmed from a lack of documentation.

## Reporting Security Vulnerabilities

See: [SECURITY.md](./SECURITY.md)

## Development

### Requirements

* [Git](https://git-scm.com/)
* [Node.js 14](https://nodejs.org/) or later

### Getting Started

Clone the repository with Git.

```sh
git clone https://github.com/svg/svgo.git
```

As this is a Node.js project and uses Yarn for package management, install the dependencies.

```sh
yarn install
```

Finally, make sure all quality assurance checks pass before making changes. This will lint, build, and test the project.

```sh
yarn run qa
```

### Plugins

SVGO uses a plugin architecture, so we ultimately perform many smaller tasks rather than a single monolithic task. This provides users a lot of flexibility for which optimizations they use, and in what order to run them.

See [`plugins/**`](./plugins/) for the list of existing plugins. This is where you can create new ones.

You should read our [Plugin Architecture](https://svgo.dev/docs/plugins-api/) documentation for the gist of how to create a new plugin. If you've created custom plugins before, it's mostly the same process.

#### Plugin Parameters

SVGO plugins can optionally have parameters. These can be consumed by the plugin to tailor the behavior.

As types are managed through TypeScript definition files and JSDocs, you must define the parameter types in [`plugins/plugin-types.ts`](./plugins/plugins-types.ts) for built-in plugins. Then you'll have code completion and type checking as you'd expect while editing the plugin if your code editor supports that.

## Documentation

Our documentation is maintained in [MDX](https://mdxjs.com/), which is Markdown with React components. The files are then pulled by [svg/svgo.dev](https://github.com/svg/svgo.dev) to build and deploy the SVGO website.

To preview local changes, follow the steps to run the website locally in [svg/svgo.dev](https://github.com/svg/svgo.dev).

New plugins, plugin parameters, and notable features should be paired with documentation in the [`docs/`](./docs/) directory and included in the same pull request.

## Funding

Sponsoring the project helps keep it sustainable for current maintainers.

See: [SVGO on Open Collective](https://opencollective.com/svgo)
