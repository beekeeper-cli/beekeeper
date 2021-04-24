const {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
} = require("@aws-sdk/client-sqs");
const logger = require("../../utils/logger")("deploy");

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
    logger.log(`Successfully created DLQ: ${QueueUrl}`);
    return QueueUrl;
  } catch (err) {
    logger.warning("Error", err);
  }
};

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
    logger.log(`Successfully retrieved DLQ ARN: ${QueueArn}`);
    return QueueArn;
  } catch (err) {
    logger.warning("Error", err);
  }
};

module.exports = async (region, dlqName) => {
  // Create an SQS client service object
  const sqs = new SQSClient({ region });

  // Create DLQ SQS
  const dqlUrl = await createDLQ(sqs, dlqName);

  // Get ARN of DLQ
  const dlqArn = await getArn(sqs, dqlUrl);

  return dlqArn;
};
