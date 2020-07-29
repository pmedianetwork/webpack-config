---
issue: https://github.com/pmedianetwork/webpack-config/issues/34
type: patch
---

If `npm ci` or `npm install` is run against the package itself, don't copy `.browserslistrc` over itself as that would empty it.
