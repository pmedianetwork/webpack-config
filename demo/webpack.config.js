const path = require("path");
const { merge, loadJavaScript } = require("../");

const commonConfig = merge(
  { entry: path.join(__dirname, "src") },
  loadJavaScript(),
);
const productionConfig = {};

module.exports = (mode) => {
  switch (mode) {
    case "test":
      return merge(commonConfig, productionConfig, { mode: "none" });
    default:
      throw new Error(`${mode} didn't match`);
  }
};
