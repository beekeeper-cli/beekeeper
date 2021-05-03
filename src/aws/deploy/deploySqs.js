/**
 * Exports an async function that deploys our S3 bucket which holds our waiting rooms assets
 * @module deploySqs
 */
const { SQSClient, CreateQueueCommand } = require("@aws-sdk/client-sqs");
const logger = require("../../utils/logger")("dev");

/**
 * Function creates the SQS queue. Of note is the use of batching 10 messages at a time and the VisibilityTimeout of 60 seconds which matches the amount of time our post queue Lambda needs to do its work.
 * @param {SQSClient} sqs Constant looks like `new SQSClient({ region })`
 * @param {String} sqsName Constant `beekeeper-${PROFILE_NAME}-sqs`
 * @param {String} dlqARN Constant returned from `deployDlq.js`
 * @returns {String} Returns the URL of the SQS queue
 */
const createSQS = async (sqs, sqsName, dlqARN) => {
  const params = {
    QueueName: sqsName,
    Attributes: {
      VisibilityTimeout: 60,
      ReceiveMessageWaitTimeSeconds: 0,
      MessageRetentionPeriod: 345600,
      DelaySeconds: 0,
      RedrivePolicy: JSON.stringify({
        deadLetterTargetArn: dlqARN,
        maxReceiveCount: 10,
      }),
    },
  };
  const command = new CreateQueueCommand(params);

  try {
    const { QueueUrl } = await sqs.send(command);
    logger.debugSuccess(`Successfully created SQS: ${QueueUrl}`);
    return QueueUrl;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports deploySqs
 * @param {String} region A constant destructured from the CLI user's answers in deploy.js. Like "us-east-2".
 * @param {String} sqsName Constant `beekeeper-${PROFILE_NAME}-sqs`
 * @param {String} dlqARN Constant returned from `deployDlq.js`
 * @returns {String} Returns a URL referring to the SQS created by this module.
 */
module.exports = async (region, sqsName, dlqARN) => {
  // Create an SQS client service object
  const sqs = new SQSClient({ region });

  // Create SQS
  const sqsUrl = await createSQS(sqs, sqsName, dlqARN);
  return sqsUrl;
};
