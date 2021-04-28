const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const logger = require("../../utils/logger")("dev");
const { getContentType, createFile } = require("../../utils/utilities");
const fs = require("fs");

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
