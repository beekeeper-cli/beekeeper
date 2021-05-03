/**
 * Exports an async function that uploads the javascript, i.e. polling.js, to the S3 bucket. The purpose of doing this toward the end of our deployment is that we use this file to inject constants created along the way during the broader deployment, and export it for our main javascript file to import and access.
 * @module deployPollingS3Object
 */
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const logger = require("../../utils/logger")("dev");
const { getContentType, createFile } = require("../../utils/utilities");
const fs = require("fs");

/**
 * Function that uploads the polling.js file
 * @param {S3Client} s3 Looks like `new S3Client({ region })`
 * @param {String} bucketName Constant looks like `beekeeper-${PROFILE_NAME}-s3`
 * @param {String} pollFilePath The file path where the polling.js file is located in the directory
 */
const uploadToS3 = async (s3, bucketName, pollFilePath) => {
  const keyName = pollFilePath.split("/").slice(-1)[0];
  const extension = keyName.split(".").slice(-1)[0];

  const params = {
    Bucket: bucketName,
    Key: keyName,
    Body: fs.readFileSync(pollFilePath),
    ACL: "public-read",
    ContentType: getContentType(extension),
  };
  const command = new PutObjectCommand(params);

  try {
    await s3.send(command);
    logger.debugSuccess(
      `Successfully uploaded file ${keyName} to S3 bucket ${bucketName}`
    );
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports deployPollingS3Object
 * @param {String} region A constant destructured from the CLI user's answers in deploy.js. Like "us-east-2".
 * @param {String} bucketName Constant looks like `beekeeper-${PROFILE_NAME}-s3`
 * @param {String} stagePollingUrl The public URL for the "/polling" resource of our API Gateway, was created and returned by `deployPollingRoute.js`
  * @param {String} pollFilePath The file path where the polling.js file is located in the directory
 * @param {String} waitingRoomName A constant destructured from answers in the CLI, will be the dynamic name shown in the waiting room HTML
 * @param {Number} rate A constant destructured from answers in the CLI, used by the frontend JavaScript to show dynamic information to the user in waiting room.
 */
module.exports = async (region, bucketName, stagePollingUrl, pollFilePath, waitingRoomName, rate) => {
  // Create an S3 client service object
  const s3 = new S3Client({ region });

  // ToDo: Take passed in display name and interpolate down below for dummy value
  // Create javascript for waiting room to poll
  const script = `const poll = async () => {
    const URL = "${stagePollingUrl}";
    let response = await fetch(URL, {
      credentials: "include",
    });
    let json = await response.json();
    if (json.allow === true) {
      let origin = json.origin;
      window.location.href = origin;
      return true;
    }
    return false;
  }

  const polling = {
    poll,
    displayName: "${waitingRoomName}",
    rate: ${rate}
  }
  
  export default polling;`;

  // Creates poll.js
  await createFile(script, pollFilePath);

  // Upload poll.js to s3
  await uploadToS3(s3, bucketName, pollFilePath);
};
