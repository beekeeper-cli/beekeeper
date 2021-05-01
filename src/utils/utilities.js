/**
 * Exports an object, which contains utility methods for validation and managing files
 * @module utilities
 */

const fs = require("fs");
const path = require("path");
const logger = require("./logger")("dev");
/**
 * Looks inside of a directory, then recursively searches for the paths of all files nested inside of the given directory. Returns an array of file paths.
 * @param {String} dir a path to a directory
 * @returns {Array} an array of file paths
 * @example 
 * const path = require("path");
 * const { getFilePaths } = require('./utilities')
 * const dirPath = path.join(__dirname, "..", "..", "dirName");
 * const filePaths = getFilePaths(dirPath);
 * // [
 * //  '/path/to/file1.js',
 * //  '/path/to/file2.jpg',
 * //  '/path/to/file3.md'
 * // ]
 */
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

/**
 * Takes a string and outputs a string for use as a content-type value.
 * @param {String} extension a file's extension name
 * @returns {String} a content type in the form of "text/extension". Returns undefined if it is an invalid extension
 */
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

/**
 * Given data, and a file path, asynchronously creates a new file with that data inserted.  Will overwrite the file if it already exists.
 * @param {String} data the data that you want in the file
 * @param {String} filePath the path and filename that you want to write to
 * @returns {undefined}
 */
const createFile = async (data, filePath) => {
  const fileName = filePath.split("/").slice(-1)[0];

  try {
    await fs.promises.writeFile(filePath, data);
    logger.debugSuccess(`Successfully created ${fileName}`);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Asynchronously reads the contents of a file, and returns the contents of that file
 * @param {String} filePath a path and filename
 * @returns {String} returns text from the file in utf8 format
 */
const readFile = async (filePath) => {
  const fileName = filePath.split("/").slice(-1)[0];

  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    logger.debugSuccess(`Successfully read ${fileName}`);
    return data;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Checks if a given file exists
 * @param {String} filePath a path and file name
 * @returns {Boolean}
 */
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
}

/**
 * Check if user executed `beekeeper init` before any other commands
 * @param {String} answersFilePath a path and file name
 * @returns {Boolean}
 */
const validateInitRan = async (answersFilePath) => {
  let fileFound = await fileExists(answersFilePath);
  
  if (!fileFound) {
    logger.error("Error: Run 'beekeeper init' first.");
    return false;
  }

  return true;
}

/**
 * // Check if user provided a valid profile name as part of command
 * @param {String} profileName the profile name given during bookeeper init
 * @param {Object} profiles all of the data stored in user-answers.json
 * @param {String} command a command given to the CLI
 * @returns {Boolean}
 */
const validateProfileName = (profileName, profiles, command) => {
  if (!profileName) {
    logger.error(`Error: Please provide a profile name 'beekeeper ${command} [PROFILE_NAME]'.`);
    return false;
  }

  const profileNames = Object.keys(profiles);

  if (!profileNames.includes(profileName)) {
    logger.error(`Error: Profile '${profileName}' does not exist. Enter 'beekeeper config' to see a list of all profiles.`);
    return false;
  }

  return true;
}

/**
 * Exports the an object containing the utility functions.
 * @returns {Object}
 */
module.exports = {
  getFilePaths,
  getContentType,
  createFile,
  readFile,
  fileExists,
  validateInitRan,
  validateProfileName
};
