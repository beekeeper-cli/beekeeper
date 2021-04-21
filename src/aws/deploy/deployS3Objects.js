const {
  S3Client,
  PutObjectCommand
} = require("@aws-sdk/client-s3");
const logger = require('../../utils/logger')('commands:deployS3Objects');
const { getFilePaths, getContentType } = require('../../utils/utilities');
const fs = require('fs');

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

module.exports = async (region, directoryPath, bucketName) => {
  // Create an S3 client service object
  const s3 = new S3Client({ region });

  const data = "Hello my name is Hugo, I'm using the new fs promises API";


  // Get all s3 object file paths
  const filePaths = getFilePaths(directoryPath);

  // Upload every object file to S3
  for (const path of filePaths) {
    await uploadToS3(s3, bucketName, directoryPath, path)
  }

  // return bucketUrl;
};
