/**
 * Exports an async function that deploys our S3 bucket which holds our waiting rooms assets
 * @module deployS3
 */
const {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
} = require("@aws-sdk/client-s3");
const logger = require("../../utils/logger")("dev");
const { getFilePaths, getContentType } = require("../../utils/utilities");
const fs = require("fs");

/**
 * Function creates the S3 bucket
 * @param {S3Client} s3 Looks like `new S3Client({ region })`
 * @param {String} bucketName Constant looks like `beekeeper-${PROFILE_NAME}-s3`
 * @returns {String} Current implementation is not using this return value.
 */
const createBucket = async (s3, bucketName) => {
  const params = { Bucket: bucketName };
  const command = new CreateBucketCommand(params);

  try {
    const { Location } = await s3.send(command);
    logger.debugSuccess(`Successfully created S3 Bucket: ${bucketName}`);
    return Location;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Function uploads a given asset for the S3 bucket. This is called with a loop that iterates through every file in the directory holding the S3 assets.
 * @param {S3Client} s3 Looks like `new S3Client({ region })`
 * @param {String} bucketName Constant looks like `beekeeper-${PROFILE_NAME}-s3`
 * @param {String} directoryPath Constant that is the path of the folder holding all S3 assets
 * @param {String} filePath The path of a given asset inside the S3 directory
 */
const uploadToS3 = async (s3, bucketName, directoryPath, filePath) => {
  const keyName = filePath.split(`${directoryPath}/`)[1];
  const extension = keyName.split(".").slice(-1)[0];

  const params = {
    Bucket: bucketName,
    Key: keyName,
    Body: fs.readFileSync(filePath),
    ACL: "public-read",
    ContentType: getContentType(extension),
  };
  const command = new PutObjectCommand(params);

  try {
    await s3.send(command);
    logger.debugSuccess(
      "Successfully uploaded S3 Object file: " + bucketName + "/" + keyName
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports deployS3
 * @param {String} region A constant destructured from the CLI user's answers in deploy.js. Like "us-east-2".
 * @param {String} bucketName Constant looks like `beekeeper-${PROFILE_NAME}-s3`
 * @param {String} directoryPath Constant that is the path of the folder holding all S3 assets
 * @returns {String} A manually constructed string that represents the public URL of the S3 Bucket.
 */
module.exports = async (region, bucketName, directoryPath) => {
  // Create an S3 client service object
  const s3 = new S3Client({ region });

  // Create S3 bucket
  await createBucket(s3, bucketName);

  // Get all S3 object file paths
  const filePaths = getFilePaths(directoryPath);

  // Upload every S3 object to S3 bucket
  for (const filePath of filePaths) {
    await uploadToS3(s3, bucketName, directoryPath, filePath);
  }

  // Return S3 Object root domain (not s3 bucket domain)
  return `https://${bucketName}.s3.${region}.amazonaws.com`;
};
