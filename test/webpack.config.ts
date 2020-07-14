import { merge, loadJavaScript } from "../";

const commonConfig = merge(loadJavaScript());
const productionConfig = {};

export default (mode: string) => {
  switch (mode) {
    case "test":
      return merge(commonConfig, productionConfig, { mode: "none" });
    default:
      throw new Error(`${mode} didn't match`);
  }
};
