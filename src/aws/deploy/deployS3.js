const {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand
} = require("@aws-sdk/client-s3");
const logger = require('../../utils/logger')('commands:deployS3');
const { getFilePaths, getContentType } = require('../../utils/utilities');
const fs = require('fs');

const createBucket = async (s3, bucketName) => {
  const params = { Bucket: bucketName };
  const command = new CreateBucketCommand(params);

  try {
    const {Location} = await s3.send(command);
    logger.log(`Successfully created S3 Bucket: ${bucketName}`);
    return Location;
  } catch (err) {
    logger.warning("Error", err);
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
    logger.warning("Error", err);
  }
};

module.exports = async (region, bucketName, directoryPath) => {
  // Create an S3 client service object
  const s3 = new S3Client({ region });

  // Create S3 bucket
  await createBucket(s3, bucketName);

  // Get all file paths
  const filePaths = getFilePaths(directoryPath);

  // // Upload every file to S3
  for (const path of filePaths) {
    await uploadToS3(s3, bucketName, directoryPath, path)
  }

  // 'http://wr-teamsix-s3.s3.amazonaws.com/'	
  // https://bucketName.s3.region.amazonaws.com/
  return `https://${bucketName}.s3.${region}.amazonaws.com`
};
