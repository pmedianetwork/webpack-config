# webpack-config

This repository contains configuration that can be shared between applications using webpack for bundling.

The configuration consists of smaller functions that can be composed together and then customized per function based on the exact need. There are also specific `merge` functions that you should use to combine the fragments together.

## Installation

Currently the package is provided as compiled source through GitHub. To use it, first add it to your **package.json** `devDependencies` as follows:

```
"@pmedianetwork/webpack-config": "github:pmedianetwork/webpack-config#v1.2.3",
```

Please adjust the version tag to match the version you want. Note the `v` prefix!

The package includes a basic Babel and ESLint configuration (only webpack specific rules).

### Babel

To consume Babel, set up `.babelrc` at the project root as follows:

```json
{
  "extends": "@pmedianetwork/webpack-config/.babelrc"
}
```

It's worth checking out the file within **webpack-config** package to see what exactly is included. You'll notice it's handling `@babel/preset-env`, `@babel/preset-react`, custom features used by the projects, and HMR (`react-hot-loader`).

### ESLint

For ESLint, extend your `.eslintrc` like this:

```json
{
  "extends": ["./node_modules/@pmedianetwork/webpack-config/eslint-defaults"]
}
```

Doing this will fix import related linting rules to take webpack configuration into account.

## Development

The project has been written in TypeScript. Each part of configuration is a small function that has type annotations.

When you want to publish changes, run `npm version <patch|minor|major>` depending on the type of the change as per SemVer. Doing this will compile the project (see `dist/`) and tag the project. Remember to push the tags to GitHub using `git push --follow-tags`.
