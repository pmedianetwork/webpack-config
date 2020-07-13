---
issue: https://github.com/pmedianetwork/webpack-config/issues/8
label: Enhancements
---

Now Babel is using **babel-plugin-lodash** to reduce the size of lodash in projects. In addition, the following setup has been added to `@babel/preset-env`:

```json
{
  "bugfixes": true,
  "corejs": 3,
  "loose": true,
  "modules": false,
  "useBuiltIns": "entry"
}
```

The idea is that given we support only modern browsers, we can generate code that's specific to them (`"bugfixes": true`) using [loose mode](https://2ality.com/2015/12/babel6-loose-mode.html).

For polyfills, there's [a more specific solution](https://babeljs.io/docs/en/babel-preset-env#usebuiltins-entry) in place now and you should do `import "core-js";` once within the application. That will be rewritten to only to the polyfills that are required instead of all.
