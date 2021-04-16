const { SQSClient, CreateQueueCommand, GetQueueAttributesCommand } = require("@aws-sdk/client-sqs");
const logger = require('../../utils/logger')('commands:deployDLQ');

const createDLQ = async (sqs, sqsName) => {
  const params = {
    QueueName: sqsName,
    Attributes: {
      VisibilityTimeout: 30,
      ReceiveMessageWaitTimeSeconds: 0,
      MessageRetentionPeriod: 345600,
      DelaySeconds: 0,
    }
  };
  const command = new CreateQueueCommand(params);

  try {
    const { QueueUrl } = await sqs.send(command);
    logger.log(`Successfully created DLQ: ${QueueUrl}`);
    return QueueUrl;
  } catch (err) {
    logger.log("Error", err);
  }
}

const getArn = async (sqs, queueUrl) => {
  const params = {
    QueueUrl: queueUrl,
    AttributeNames: ["All"]
  }

  const command = new GetQueueAttributesCommand(params);

  try {
    const { Attributes: { QueueArn } } = await sqs.send(command);
    logger.log(`Successfully retrieved DLQ ARN: ${QueueArn}`);
    return QueueArn;
  } catch (err) {
    logger.log("Error", err);
  }
}

module.exports = async (region, sqsName) => {
  // Create an SQS client service object
  const sqs = new SQSClient({ region });

  // Create DLQ SQS
  const queueUrl = await createDLQ(sqs, sqsName);

  // Get ARN of DLQ
  const deadLetterQueueARN = await getArn(sqs, queueUrl);

  return deadLetterQueueARN;
};
