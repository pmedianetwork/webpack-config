---
issue: https://github.com/pmedianetwork/webpack-config/issues/26
type: major
---

**webpack-config** exposes [webpack-plugin-serve](https://www.npmjs.com/package/webpack-plugin-serve) through `webpackPluginServe(...)` now. In practice, it has proven to fit the project setup better especially when a proxy is used in front.

In addition, now `@pmmmwh/react-refresh-webpack-plugin` is using the newest beta version that's available.

Note that given `reactHotLoader(...)` and `webpackDevServer` aren't needed after this change, they have been removed from the API.
