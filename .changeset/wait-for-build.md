---
issue: https://github.com/pmedianetwork/webpack-config/issues/37
type: patch
---

Make `webpackPluginServe` to use `waitForBuild` by default. The setting is particulary useful for projects like **adverity-presense-frontend** where webpack is used as the frontend. Otherwise it might serve HTML before the initial JavaScript bundle is ready.
