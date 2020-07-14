---
issue: https://github.com/pmedianetwork/webpack-config/issues/13
type: patch
---

Resolve `@svgr/webpack` with an absolute path. This way the consumers don't need to have it installed. The problem is that the dependency is nested within `node_modules` and Node won't find it otherwise.
