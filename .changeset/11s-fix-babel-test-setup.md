---
issue: https://github.com/pmedianetwork/webpack-config/issues/11
label: patch
---

The previous Babel test setup has been restored now. Without this addition, @babel/preset-env is specific to browsers and the code will compile to something that's not compatible with Jest.
