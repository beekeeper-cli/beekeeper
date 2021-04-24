const { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand, DeleteBucketCommand } = require("@aws-sdk/client-s3");
const logger = require("../../utils/logger")("dev");

const listBucketObjects = async (s3, bucketName) => {
  const params = {
    Bucket: bucketName
  };
  
  const command = new ListObjectVersionsCommand(params);

  try {
    const {Versions} = await s3.send(command);
    logger.debugSuccess(`Successfully retrieved bucket objects from: ${bucketName}`);
    return Versions;
  } catch (err) {
    logger.debugError("Error", err);
  }
}

const deleteBucketObjects = async (s3, versions, bucketName) => {
  const params = {
    Bucket: bucketName,
    Delete: {
      Objects: versions
    }
  }

  const command = new DeleteObjectsCommand(params);

  try {
    await s3.send(command);
    logger.debugSuccess(`Successfully deleted bucket objects from: ${bucketName}`);
  } catch (err) {
    logger.debugError("Error", err);
  }
}

const deleteBucket = async (s3, bucketName) => {
  const params = {
    Bucket: bucketName,
    "force_destroy": true
  }

  const command = new DeleteBucketCommand(params);

  try {
    await s3.send(command);
    logger.debugSuccess(`Successfully deleted bucket: ${bucketName}`);
  } catch (err) {
    logger.debugError("Error", err);
  }
}

module.exports = async (region, bucketName) => {
  // Create an S3 client service object
  const s3 = new S3Client({ region });

  // Get the bucket objects
  const versions = await listBucketObjects(s3, bucketName);

  // Destroy bucket objects
  await deleteBucketObjects(s3, versions, bucketName);

  // Destroy bucket itself
  await deleteBucket(s3, bucketName);
};