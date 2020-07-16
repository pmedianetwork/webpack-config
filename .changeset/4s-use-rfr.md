---
issue: https://github.com/pmedianetwork/webpack-config/issues/4
type: major
---

React hot loading functionality has been split into two functions now. Earlier the setup was included to `webpackDevServer`. Now it's divided as `reactHotLoader` and `reactFastRefresh`. The former represents the solution that was in place earlier and it's considered the legacy option. `reactFastRefresh` requires React 16.9 to work and it implements the most modern setup available. The big benefit of the approach is that it requires zero frontend setup compared to the `hot()` wrappings required by the earlier one.
