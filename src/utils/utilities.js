const fs = require('fs');
const path = require("path");

const getFilePaths = (dir) => {
  const filePaths = [];

  const getPaths = (dir) => {
    fs.readdirSync(dir).forEach((name) => {
      const filePath = path.join(dir, name);

      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        filePaths.push(filePath);
      } else if (stat.isDirectory()) {
        getPaths(filePath);
      }
    });
  }

  getPaths(dir);
  return filePaths;
};

const getContentType = (extension) => {
  let imageExtensions = ["gif", "png", "jpeg"]
  let textExtensions = ["css", "html"];
  
  if (imageExtensions.includes(extension)) {
    return `image/${extension}`
  } else if (textExtensions.includes(extension)) {
    return `text/${extension}`
  }
}

module.exports = {
  getFilePaths,
  getContentType
}