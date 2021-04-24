const {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
} = require("@aws-sdk/client-s3");
const logger = require("../../utils/logger")("dev");
const { getFilePaths, getContentType } = require("../../utils/utilities");
const fs = require("fs");

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
