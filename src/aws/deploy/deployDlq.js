/**
 * Exports an async function that creates a dead letter queue (DLQ)
 * @module deployDlq
 */

const {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
} = require("@aws-sdk/client-sqs");
const logger = require("../../utils/logger")("dev");

/**
 * Creates the DLQ.
 * @param {SQSClient} sqs looks like `new SQSClient({ region });`
 * @param {String} dlqName Constant initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-dlq`
 * @returns {String} A URL referring to the created DLQ
 */
const createDLQ = async (sqs, dlqName) => {
  const params = {
    QueueName: dlqName,
    Attributes: {
      VisibilityTimeout: 30,
      ReceiveMessageWaitTimeSeconds: 0,
      MessageRetentionPeriod: 345600,
      DelaySeconds: 0,
    },
  };
  const command = new CreateQueueCommand(params);

  try {
    const { QueueUrl } = await sqs.send(command);
    logger.debugSuccess(`Successfully created DLQ: ${QueueUrl}`);
    return QueueUrl;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Once the DLQ is created, this function can now get ARN of it.
 * @param {SQSClient} sqs looks like `new SQSClient({ region });`
 * @param {String} dlqUrl URL that was returned from `createDLQ()`
 * @returns {String} An Amazon Resource Name that refers to the DLQ
 */
const getArn = async (sqs, dlqUrl) => {
  const params = {
    QueueUrl: dlqUrl,
    AttributeNames: ["All"],
  };

  const command = new GetQueueAttributesCommand(params);

  try {
    const {
      Attributes: { QueueArn },
    } = await sqs.send(command);
    logger.debugSuccess(`Successfully retrieved DLQ ARN: ${QueueArn}`);
    return QueueArn;
  } catch (err) {
    logger.debugError("Error", err);
    throw new Error(err);
  }
};

/**
 * Exports deployDlq
 * @param {String} region A constant destructured from the CLI user's answers in `deploy.js`. Like "us-east-2".
 * @param {String} dlqName Constant initialized in `deploy.js`, looks like `beekeeper-${PROFILE_NAME}-dlq`
 * @returns {String} Returns the ARN that refers to the DLQ created by this module.
 */
module.exports = async (region, dlqName) => {
  // Create an SQS client service object
  const sqs = new SQSClient({ region });

  // Create DLQ SQS
  const dqlUrl = await createDLQ(sqs, dlqName);

  // Get ARN of DLQ
  const dlqArn = await getArn(sqs, dqlUrl);

  return dlqArn;
};
