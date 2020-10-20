---
issue: https://github.com/pmedianetwork/webpack-config/issues/41
type: minor
---

**webpack-plugin-serve** has been updated to use `refresh-on-failure` option during HMR. This means it's going to perform a full refresh in case HMR fails instead of waiting for the developer to refresh.
