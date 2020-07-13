const fs = require("fs");
const path = require("path");

// https://stackoverflow.com/questions/10265798/determine-project-root-from-a-running-node-js-application
const { path: appRootPath } = require("app-root-path");

function copyBrowserslist() {
  const packageDirectory = path.join(__dirname, "..");
  const browsersListPath = path.join(packageDirectory, ".browserslistrc");

  console.log(`Copying ${browsersListPath} to ${appRootPath}`);

  try {
    fs.copyFileSync(browsersListPath, appRootPath);
  } catch (err) {
    console.error(err);
  }
}

copyBrowserslist();
