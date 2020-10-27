const path = require("path");
const { merge, loadJavaScript, webpackPluginServe } = require("../");

const commonConfig = merge(
  { entry: path.join(__dirname, "src") },
  loadJavaScript(),
);
const developmentConfig = webpackPluginServe({ staticPaths: [] });

module.exports = (mode) => {
  switch (mode) {
    case "dev":
      return merge(commonConfig, developmentConfig, { mode: "development" });
    case "test":
      return merge(commonConfig, { mode: "none" });
    default:
      throw new Error(`${mode} didn't match`);
  }
};
