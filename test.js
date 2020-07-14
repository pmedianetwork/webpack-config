const webpack = require("webpack");
const MemoryFs = require("memory-fs");
const config = require("./demo/webpack.config")("test");

// This is a regression test to detect changes in webpack output
test("webpack output matches", () => {
  // https://stackoverflow.com/questions/39923743/is-there-a-way-to-get-the-output-of-webpack-node-api-as-a-string
  const compiler = webpack(config);

  compiler.outputFileSystem = new MemoryFs();

  return new Promise((resolve, reject) =>
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }

      if (stats.hasErrors()) {
        return reject(stats.toString("errors-only"));
      }

      const pathParts = compiler.outputFileSystem
        .pathToArray(__dirname)
        .concat(["dist", "main.js"]);
      const file = get(compiler.outputFileSystem.data, pathParts).toString();

      expect(file).toMatchSnapshot();

      resolve();
    }),
  );
});

function get(o, keys) {
  let ret = o;

  keys.forEach((key) => {
    ret = ret[key];
  });

  return ret;
}
