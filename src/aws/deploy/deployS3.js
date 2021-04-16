const {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  PutBucketVersioningCommand
} = require("@aws-sdk/client-s3");
const logger = require('../../utils/logger')('commands:deployS3');
const { getFilePaths, getContentType } = require('../../utils/utilities');
const fs = require('fs');

const createBucket = async (s3, bucketName) => {
  const params = { Bucket: bucketName };
  const command = new CreateBucketCommand(params);

  try {
    await s3.send(command);
    logger.log(`Successfully created S3 Bucket: ${bucketName}`);
  } catch (err) {
    logger.log("Error", err);
  }
}

const enableVersioning = async (s3, bucketName) => {
  const params = {
    Bucket: bucketName, 
    VersioningConfiguration: {
      MFADelete: "Disabled",
      Status: "Enabled"
    }
  };
  const command = new PutBucketVersioningCommand(params);

  try {
    await s3.send(command);
    logger.log("Successfully enabled S3 Bucket versioning to: " + bucketName);
  } catch (err) {
    logger.log("Error", err);
  }
}

const uploadToS3 = async (s3, bucketName, dir, path) => {
  const keyName = path.split(`${dir}/`)[1];
  const extension = keyName.split('.').slice(-1)[0];

  const params = {
    Bucket: bucketName,
    Key: keyName,
    Body: fs.readFileSync(path),
    ACL: "public-read",
    ContentType: getContentType(extension)
  };
  const command = new PutObjectCommand(params);

  try {
    await s3.send(command);
    logger.log("Successfully uploaded waiting room files to: " + bucketName + "/" + keyName);
  } catch (err) {
    logger.log("Error", err);
  }
};

module.exports = async (region, bucketName, directoryPath) => {
  // Create an S3 client service object
  const s3 = new S3Client({ region });

  // Create S3 bucket
  await createBucket(s3, bucketName);
  await enableVersioning(s3, bucketName);

  // Get all file paths
  const filePaths = getFilePaths(directoryPath);

  // Upload every file to S3
  for (const path of filePaths) {
    await uploadToS3(s3, bucketName, directoryPath, path)
  }
};
