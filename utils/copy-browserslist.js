const fs = require("fs");
const path = require("path");

// https://stackoverflow.com/questions/10265798/determine-project-root-from-a-running-node-js-application
const { path: appRootPath } = require("app-root-path");

function copyBrowserslist() {
  const browsersListFile = ".browserslistrc";
  const packageDirectory = path.join(__dirname, "..");
  const browsersListPath = path.join(packageDirectory, browsersListFile);
  const targetPath = path.join(appRootPath, browsersListFile);

  console.log(`Copying ${browsersListPath} to ${targetPath}`);

  try {
    fs.copyFileSync(browsersListPath, targetPath);
  } catch (err) {
    console.error(err);
  }
}

copyBrowserslist();
