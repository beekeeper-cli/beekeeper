const fs = require("fs");
const path = require("path");
const logger = require("./logger")("dev");

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
  };

  getPaths(dir);
  return filePaths;
};

const getContentType = (extension) => {
  let imageExtensions = ["gif", "png", "jpeg"];
  let textExtensions = ["css", "html", "js"];

  if (imageExtensions.includes(extension)) {
    return `image/${extension}`;
  } else if (textExtensions.includes(extension)) {
    if (extension === "js") {
      extension = "javascript";
    }

    return `text/${extension}`;
  }
};

const createFile = async (data, filePath) => {
  const fileName = filePath.split("/").slice(-1)[0];

  try {
    await fs.promises.writeFile(filePath, data);
    logger.debug(`Successfully created ${fileName}`);
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const readFile = async (filePath) => {
  const fileName = filePath.split("/").slice(-1)[0];

  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    logger.debug(`Successfully read ${fileName}`);
    return data;
  } catch (err) {
    logger.debugError("Error", err);
  }
};

const fileExists = async (filePath) => {
  try {
    return await fs.existsSync(filePath);
  } catch (err) {
    logger.debugError("Error", err);
  }
}

module.exports = {
  getFilePaths,
  getContentType,
  createFile,
  readFile,
  fileExists,
};
