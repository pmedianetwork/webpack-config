const fs = require("fs");
const path = require("path");

function copyBrowserslist() {
  const packageDirectory = path.join(__dirname, "..");
  const browsersListPath = path.join(packageDirectory, ".browserslistrc");

  // This assumes npm install was run within the project root directory.
  const targetPath = process.cwd();

  try {
    fs.copyFileSync(browsersListPath, targetPath);
  } catch (err) {
    console.error(err);
  }
}

copyBrowserslist();
