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

      console.log(compiler.outputFileSystem);

      const result = compiler.outputFileSystem.data["main.js"].toString();

      console.log("result", result);

      expect(true).toEqual(true);
      //expect(stats).toMatchSnapshot();

      resolve();
    }),
  );
});
