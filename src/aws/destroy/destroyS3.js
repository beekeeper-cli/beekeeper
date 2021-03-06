/**
 * Exports an async function that tears down the S3 bucket
 * @module destroyS3
 */
const { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand, DeleteBucketCommand } = require("@aws-sdk/client-s3");
const logger = require("../../utils/logger")("dev");

/**
 * List all the objects versions from a S3 bucket
 * @param {S3Client} s3 This is the S3 Client
 * @param {String} bucketName This is the name of the S3 bucket
 * @returns {Array} This is the list of object versions
 * @throws Will throw an error if S3 client fails to execute its command
 */
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
    throw new Error(err);
  }
}

/**
 * Deletes S3 bucket objects
 * @param {S3Client} s3 This is the S3 Client
 * @param {Array} versions This is the list of object versions
 * @param {String} bucketName This is the S3 bucket name
 * @throws Will throw an error if S3 client fails to execute its command
 */
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
    throw new Error(err);
  }
}

/**
 * Deletes a S3 bucket
 * @param {S3Client} s3 This is the S3 Client
 * @param {String} bucketName This is the S3 bucket name
 * @throws Will throw an error if S3 client fails to execute its command
 */
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
    throw new Error(err);
  }
}

/**
 * Exports destroyS3
 * @param {String} region This is the region of where this AWS service is deployed
 * @param {String} bucketName This is the name of the S3 bucket
 */
module.exports = async (region, bucketName) => {
  const s3 = new S3Client({ region });

  const versions = await listBucketObjects(s3, bucketName);

  await deleteBucketObjects(s3, versions, bucketName);

  await deleteBucket(s3, bucketName);
};